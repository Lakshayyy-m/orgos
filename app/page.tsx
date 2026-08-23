export default function Home() {
  return (
    <main className="flex min-h-screen items-center bg-zinc-50 px-6 py-16 font-sans text-zinc-900">
      <div className="mx-auto w-full max-w-3xl">
        <p className="mb-4 text-sm font-semibold tracking-[0.2em] text-indigo-700">
          ACMEBOARD / ORGOS
        </p>
        <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl">
          The secure foundation is ready.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-600">
          OrgOS is being built incrementally to learn the systems behind
          multi-tenant identity and authorization products.
        </p>
        <section className="mt-12 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">
            Phase 1: Application Foundation
          </h2>
          <p className="mt-2 text-zinc-600">
            Next.js, TypeScript, Tailwind, linting, and the architecture
            decision log are in place. The next task adds the relational
            project model.
          </p>
        </section>
      </div>
    </main>
  );
}
