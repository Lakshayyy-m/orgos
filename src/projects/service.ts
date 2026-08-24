import "server-only";
import { asc, eq } from "drizzle-orm";
import { getDatabase } from "@/db/server";
import { projectMembers, projects, users } from "@/db/schema";

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

export type CreateProjectInput = {
  organizationId: string;
  name: string;
  description: string;
};

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

export function isProjectNameConflict(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}
