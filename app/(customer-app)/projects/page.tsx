import Link from "next/link";
import { DEMO_ACME_ORGANIZATION_ID } from "@/src/organizations/demo-organization";
import {
  listOrganizationMembers,
  listProjectsForOrganization,
} from "@/src/projects/service";
import { AssignProjectMemberForm } from "./_components/assign-project-member-form";
import { CreateProjectForm } from "./_components/create-project-form";
import { DeleteProjectButton } from "./_components/delete-project-button";
import { RemoveProjectMemberButton } from "./_components/remove-project-member-button";
import { UpdateProjectForm } from "./_components/update-project-form";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const [projects, organizationMembers] = await Promise.all([
    listProjectsForOrganization(DEMO_ACME_ORGANIZATION_ID),
    listOrganizationMembers(DEMO_ACME_ORGANIZATION_ID),
  ]);

  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-16 font-sans text-zinc-900">
      <div className="mx-auto w-full max-w-3xl">
        <p className="mb-4 text-sm font-semibold tracking-[0.2em] text-indigo-700">
          ACMEBOARD / ORGOS
        </p>
        <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl">
          Projects
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-600">
          Acme Corp&apos;s unauthenticated Phase 1 workspace.
        </p>
        <Link
          className="mt-3 inline-block cursor-pointer text-sm font-medium text-indigo-700 underline"
          href="/organization"
        >
          View organization
        </Link>
        <section className="mt-12 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Create a project</h2>
          <CreateProjectForm />
        </section>
        <section className="mt-12 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Assign a project member</h2>
          <AssignProjectMemberForm
            organizationMembers={organizationMembers}
            projects={projects}
          />
        </section>
        <section className="mt-12 space-y-4">
          <h2 className="text-xl font-semibold">All projects</h2>
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
                <UpdateProjectForm
                  initialDescription={project.description}
                  initialName={project.name}
                  projectId={project.id}
                />
                <div className="mt-3 flex justify-end">
                  <DeleteProjectButton
                    memberCount={project.members.length}
                    projectId={project.id}
                    projectName={project.name}
                  />
                </div>
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-zinc-700">Members</h3>
                  {project.members.length === 0 ? (
                    <p className="mt-1 text-sm text-zinc-500">
                      No members assigned.
                    </p>
                  ) : (
                    <ul className="mt-2">
                      {project.members.map((member) => (
                        <li
                          className="flex items-center justify-between gap-4 text-sm text-zinc-600"
                          key={member.id}
                        >
                          <span>{member.displayName}</span>
                          <RemoveProjectMemberButton
                            memberId={member.id}
                            memberName={member.displayName}
                            projectId={project.id}
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </article>
            ))
          )}
        </section>
      </div>
    </main>
  );
}
