import "server-only";
import { asc, eq } from "drizzle-orm";
import { getDatabase } from "@/db/client";
import { projects } from "@/db/schema";

export type ProjectSummary = {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
};

export async function listProjectsForOrganization(
  organizationId: string,
): Promise<readonly ProjectSummary[]> {
  return getDatabase()
    .select({
      id: projects.id,
      name: projects.name,
      description: projects.description,
      createdAt: projects.createdAt,
    })
    .from(projects)
    .where(eq(projects.organizationId, organizationId))
    .orderBy(asc(projects.name));
}
