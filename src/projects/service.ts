import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { getDatabase } from "@/db/server";
import {
  organizationMembers,
  projectMembers,
  projects,
  users,
} from "@/db/schema";

export type ProjectSummary = {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
};

export type ProjectMemberSummary = {
  id: string;
  displayName: string;
};

export type ProjectWithMembers = ProjectSummary & {
  members: ProjectMemberSummary[];
};

export type OrganizationMemberSummary = {
  userId: string;
  displayName: string;
};

export type CreateProjectInput = {
  organizationId: string;
  name: string;
  description: string;
};

export type UpdateProjectInput = CreateProjectInput & {
  projectId: string;
};

export type DeleteProjectInput = {
  organizationId: string;
  projectId: string;
};

export type AssignProjectMemberInput = {
  organizationId: string;
  projectId: string;
  userId: string;
};

export type AssignProjectMemberResult = {
  status: "assigned" | "already_assigned";
};

export type RemoveProjectMemberInput = {
  organizationId: string;
  projectId: string;
  userId: string;
};

export type RemoveProjectMemberResult = {
  status: "removed" | "not_assigned";
};

export class ProjectMembershipError extends Error {
  constructor(
    public readonly code: "project_not_found" | "user_not_in_organization",
  ) {
    super(code);
  }
}

export async function listProjectsForOrganization(
  organizationId: string,
): Promise<readonly ProjectWithMembers[]> {
  const rows = await getDatabase()
    .select({
      id: projects.id,
      name: projects.name,
      description: projects.description,
      createdAt: projects.createdAt,
      memberId: users.id,
      memberDisplayName: users.displayName,
    })
    .from(projects)
    .leftJoin(projectMembers, eq(projectMembers.projectId, projects.id))
    .leftJoin(users, eq(users.id, projectMembers.userId))
    .where(eq(projects.organizationId, organizationId))
    .orderBy(asc(projects.name), asc(users.displayName));

  const projectsById = new Map<string, ProjectWithMembers>();

  for (const row of rows) {
    let project = projectsById.get(row.id);

    if (!project) {
      project = {
        id: row.id,
        name: row.name,
        description: row.description,
        createdAt: row.createdAt,
        members: [],
      };
      projectsById.set(project.id, project);
    }

    if (row.memberId && row.memberDisplayName) {
      project.members.push({
        id: row.memberId,
        displayName: row.memberDisplayName,
      });
    }
  }

  return [...projectsById.values()];
}

export async function listOrganizationMembers(
  organizationId: string,
): Promise<readonly OrganizationMemberSummary[]> {
  return getDatabase()
    .select({
      userId: users.id,
      displayName: users.displayName,
    })
    .from(organizationMembers)
    .innerJoin(users, eq(users.id, organizationMembers.userId))
    .where(eq(organizationMembers.organizationId, organizationId))
    .orderBy(asc(users.displayName));
}

export async function createProjectForOrganization(
  input: CreateProjectInput,
): Promise<ProjectSummary> {
  const [project] = await getDatabase()
    .insert(projects)
    .values(input)
    .returning({
      id: projects.id,
      name: projects.name,
      description: projects.description,
      createdAt: projects.createdAt,
    });

  if (!project) {
    throw new Error("Project creation did not return a project.");
  }

  return project;
}

export async function updateProjectForOrganization(
  input: UpdateProjectInput,
): Promise<ProjectSummary | null> {
  const [project] = await getDatabase()
    .update(projects)
    .set({
      name: input.name,
      description: input.description,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(projects.id, input.projectId),
        eq(projects.organizationId, input.organizationId),
      ),
    )
    .returning({
      id: projects.id,
      name: projects.name,
      description: projects.description,
      createdAt: projects.createdAt,
    });

  return project ?? null;
}

export async function deleteProjectForOrganization(
  input: DeleteProjectInput,
): Promise<ProjectSummary | null> {
  const [project] = await getDatabase()
    .delete(projects)
    .where(
      and(
        eq(projects.id, input.projectId),
        eq(projects.organizationId, input.organizationId),
      ),
    )
    .returning({
      id: projects.id,
      name: projects.name,
      description: projects.description,
      createdAt: projects.createdAt,
    });

  return project ?? null;
}

export async function assignProjectMember(
  input: AssignProjectMemberInput,
): Promise<AssignProjectMemberResult> {
  const database = getDatabase();

  const [project] = await database
    .select({ id: projects.id })
    .from(projects)
    .where(
      and(
        eq(projects.id, input.projectId),
        eq(projects.organizationId, input.organizationId),
      ),
    )
    .limit(1);

  if (!project) {
    throw new ProjectMembershipError("project_not_found");
  }

  const [organizationMember] = await database
    .select({ userId: organizationMembers.userId })
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.organizationId, input.organizationId),
        eq(organizationMembers.userId, input.userId),
      ),
    )
    .limit(1);

  if (!organizationMember) {
    throw new ProjectMembershipError("user_not_in_organization");
  }

  const [assignment] = await database
    .insert(projectMembers)
    .values(input)
    .onConflictDoNothing({
      target: [projectMembers.projectId, projectMembers.userId],
    })
    .returning({ id: projectMembers.id });

  return {
    status: assignment ? "assigned" : "already_assigned",
  };
}

export async function removeProjectMember(
  input: RemoveProjectMemberInput,
): Promise<RemoveProjectMemberResult> {
  const [removedMembership] = await getDatabase()
    .delete(projectMembers)
    .where(
      and(
        eq(projectMembers.organizationId, input.organizationId),
        eq(projectMembers.projectId, input.projectId),
        eq(projectMembers.userId, input.userId),
      ),
    )
    .returning({ id: projectMembers.id });

  return {
    status: removedMembership ? "removed" : "not_assigned",
  };
}

export function isProjectNameConflict(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}
