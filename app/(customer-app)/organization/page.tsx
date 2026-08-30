import Link from "next/link";
import { DEMO_ACME_ORGANIZATION_ID } from "@/src/organizations/demo-organization";
import { getOrganizationOverview } from "@/src/organizations/service";

export const dynamic = "force-dynamic";

export default async function OrganizationPage() {
  const organization = await getOrganizationOverview(
    DEMO_ACME_ORGANIZATION_ID,
  );

  if (!organization) {
    return (
      <main className="min-h-screen bg-zinc-50 px-6 py-16 font-sans text-zinc-900">
        <div className="mx-auto w-full max-w-3xl rounded-2xl border border-dashed border-zinc-300 bg-white p-6">
          <h1 className="text-2xl font-semibold">Organization data unavailable</h1>
          <p className="mt-2 text-zinc-600">
            Run the local database migration and seed script to load Acme Corp.
          </p>
          <Link
            className="mt-4 inline-block font-medium text-indigo-700 underline"
            href="/projects"
          >
            View projects
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-16 font-sans text-zinc-900">
      <div className="mx-auto w-full max-w-3xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold tracking-[0.2em] text-indigo-700">
              ACMEBOARD / ORGANIZATION
            </p>
            <h1 className="mt-4 text-5xl font-semibold tracking-tight sm:text-6xl">
              {organization.name}
            </h1>
          </div>
          <Link
            className="cursor-pointer rounded-md border border-indigo-200 px-3 py-2 text-sm font-medium text-indigo-700 transition-colors hover:border-indigo-700 hover:bg-indigo-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700"
            href="/projects"
          >
            View projects
          </Link>
        </div>
        <section className="mt-12 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-zinc-600">Members</p>
            <p className="mt-2 text-3xl font-semibold">
              {organization.members.length}
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-zinc-600">Projects</p>
            <p className="mt-2 text-3xl font-semibold">
              {organization.projectCount}
            </p>
          </div>
        </section>
        <section className="mt-12 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Organization members</h2>
          <ul className="mt-4 divide-y divide-zinc-200">
            {organization.members.map((member) => (
              <li
                className="flex flex-col gap-1 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                key={member.id}
              >
                <span className="font-medium">{member.displayName}</span>
                <span className="text-sm text-zinc-600">{member.email}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
