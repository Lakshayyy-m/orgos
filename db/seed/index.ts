import "../environment";
import { closeDatabaseConnection, getDatabase } from "../client";
import {
  organizationMembers,
  organizations,
  projectMembers,
  projects,
  users,
} from "../schema";
import { DEMO_ACME_ORGANIZATION_ID } from "../../src/organizations/demo-organization";

type SeedUser = {
  id: string;
  email: string;
  displayName: string;
};

type SeedProject = {
  id: string;
  name: string;
  description: string;
};

type SeedProjectMember = {
  id: string;
  projectName: string;
  userEmail: string;
};

const acmeCorp = {
  id: DEMO_ACME_ORGANIZATION_ID,
  name: "Acme Corp",
} as const;

const seedUsers: readonly SeedUser[] = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    email: "alice@acme.test",
    displayName: "Alice",
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    email: "bob@acme.test",
    displayName: "Bob",
  },
  {
    id: "00000000-0000-4000-8000-000000000003",
    email: "carol@acme.test",
    displayName: "Carol",
  },
];

const seedProjects: readonly SeedProject[] = [
  {
    id: "00000000-0000-4000-8000-000000000101",
    name: "Website",
    description: "Acme Corp's public website.",
  },
  {
    id: "00000000-0000-4000-8000-000000000102",
    name: "Mobile App",
    description: "Acme Corp's mobile application.",
  },
];

const seedProjectMembers: readonly SeedProjectMember[] = [
  {
    id: "00000000-0000-4000-8000-000000000201",
    projectName: "Website",
    userEmail: "alice@acme.test",
  },
  {
    id: "00000000-0000-4000-8000-000000000202",
    projectName: "Website",
    userEmail: "bob@acme.test",
  },
  {
    id: "00000000-0000-4000-8000-000000000203",
    projectName: "Mobile App",
    userEmail: "alice@acme.test",
  },
  {
    id: "00000000-0000-4000-8000-000000000204",
    projectName: "Mobile App",
    userEmail: "carol@acme.test",
  },
];

function getRequiredId(ids: ReadonlyMap<string, string>, key: string): string {
  const id = ids.get(key);

  if (!id) {
    throw new Error(`Seed record was not persisted: ${key}`);
  }

  return id;
}

async function seedDatabase(): Promise<void> {
  await getDatabase().transaction(async (transaction) => {
    const userIdsByEmail = new Map<string, string>();

    for (const seedUser of seedUsers) {
      const [persistedUser] = await transaction
        .insert(users)
        .values(seedUser)
        .onConflictDoUpdate({
          target: users.email,
          set: {
            displayName: seedUser.displayName,
            updatedAt: new Date(),
          },
        })
        .returning({ id: users.id, email: users.email });

      if (!persistedUser) {
        throw new Error(`Unable to seed user: ${seedUser.email}`);
      }

      userIdsByEmail.set(persistedUser.email, persistedUser.id);
    }

    const [persistedOrganization] = await transaction
      .insert(organizations)
      .values(acmeCorp)
      .onConflictDoUpdate({
        target: organizations.id,
        set: {
          name: acmeCorp.name,
          updatedAt: new Date(),
        },
      })
      .returning({ id: organizations.id });

    if (!persistedOrganization) {
      throw new Error("Unable to seed Acme Corp.");
    }

    const organizationId = persistedOrganization.id;

    await transaction
      .insert(organizationMembers)
      .values(
        seedUsers.map((seedUser) => ({
          organizationId,
          userId: getRequiredId(userIdsByEmail, seedUser.email),
        })),
      )
      .onConflictDoNothing({
        target: [organizationMembers.organizationId, organizationMembers.userId],
      });

    const projectIdsByName = new Map<string, string>();

    for (const seedProject of seedProjects) {
      const [persistedProject] = await transaction
        .insert(projects)
        .values({
          ...seedProject,
          organizationId,
        })
        .onConflictDoUpdate({
          target: [projects.organizationId, projects.name],
          set: {
            description: seedProject.description,
            updatedAt: new Date(),
          },
        })
        .returning({ id: projects.id, name: projects.name });

      if (!persistedProject) {
        throw new Error(`Unable to seed project: ${seedProject.name}`);
      }

      projectIdsByName.set(persistedProject.name, persistedProject.id);
    }

    await transaction
      .insert(projectMembers)
      .values(
        seedProjectMembers.map((seedProjectMember) => ({
          id: seedProjectMember.id,
          organizationId,
          projectId: getRequiredId(
            projectIdsByName,
            seedProjectMember.projectName,
          ),
          userId: getRequiredId(userIdsByEmail, seedProjectMember.userEmail),
        })),
      )
      .onConflictDoNothing({
        target: [projectMembers.projectId, projectMembers.userId],
      });
  });
}

async function main(): Promise<void> {
  try {
    await seedDatabase();
    console.info("Seeded Acme Corp with three users and two projects.");
  } finally {
    await closeDatabaseConnection();
  }
}

void main().catch((error: unknown) => {
  console.error("Database seed failed.", error);
  process.exitCode = 1;
});
