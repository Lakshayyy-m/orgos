import "server-only";
import { asc, count, eq } from "drizzle-orm";
import { getDatabase } from "@/db/server";
import { organizationMembers, organizations, projects, users } from "@/db/schema";

export type OrganizationMember = {
  id: string;
  displayName: string;
  email: string;
};

export type OrganizationOverview = {
  id: string;
  name: string;
  projectCount: number;
  members: readonly OrganizationMember[];
};

export async function getOrganizationOverview(
  organizationId: string,
): Promise<OrganizationOverview | null> {
  const database = getDatabase();
  const [organization] = await database
    .select({
      id: organizations.id,
      name: organizations.name,
    })
    .from(organizations)
    .where(eq(organizations.id, organizationId))
    .limit(1);

  if (!organization) {
    return null;
  }

  const [members, projectCountRows] = await Promise.all([
    database
      .select({
        id: users.id,
        displayName: users.displayName,
        email: users.email,
      })
      .from(organizationMembers)
      .innerJoin(users, eq(users.id, organizationMembers.userId))
      .where(eq(organizationMembers.organizationId, organizationId))
      .orderBy(asc(users.displayName)),
    database
      .select({
        projectCount: count(projects.id),
      })
      .from(projects)
      .where(eq(projects.organizationId, organizationId)),
  ]);

  return {
    ...organization,
    projectCount: projectCountRows[0]?.projectCount ?? 0,
    members,
  };
}
