import { DEMO_ACME_ORGANIZATION_ID } from "@/src/organizations/demo-organization";
import { listProjectsForOrganization } from "@/src/projects/project-service";

export const dynamic = "force-dynamic";

export default async function Home() {
  const projects = await listProjectsForOrganization(
    DEMO_ACME_ORGANIZATION_ID,
  );

  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-16 font-sans text-zinc-900">
      <div className="mx-auto w-full max-w-3xl">
        <p className="mb-4 text-sm font-semibold tracking-[0.2em] text-indigo-700">
          ACMEBOARD / ORGOS
        </p>
        <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl">Projects</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-600">
          Acme Corp&apos;s unauthenticated Phase 1 workspace.
        </p>
        <section className="mt-12 space-y-4">
          {projects.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-zinc-300 bg-white p-6 text-zinc-600">
              No projects yet. Run the local database migration and seed script
              to load the Acme Corp demo data.
            </p>
          ) : (
            projects.map((project) => (
              <article
                className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
                key={project.id}
              >
                <h2 className="text-xl font-semibold">{project.name}</h2>
                <p className="mt-2 text-zinc-600">
                  {project.description || "No description provided."}
                </p>
              </article>
            ))
          )}
        </section>
      </div>
    </main>
  );
}
