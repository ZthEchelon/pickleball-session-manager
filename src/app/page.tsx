import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-3xl font-semibold">
        Pickleball Session Manager
      </h1>

      <p className="mt-3 text-muted-foreground">
        Manage players, generate balanced groups, schedule matches,
        and track rating changes across sessions.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          href="/players"
          className="rounded-md border p-4 hover:bg-muted/50"
        >
          <div className="font-medium">Players</div>
          <p className="mt-1 text-sm text-muted-foreground">
            Add players, activate/deactivate, and view ratings.
          </p>
        </Link>

        <Link
          href="/sessions"
          className="rounded-md border p-4 hover:bg-muted/50"
        >
          <div className="font-medium">Sessions</div>
          <p className="mt-1 text-sm text-muted-foreground">
            Create sessions, manage attendance, generate groups and matches.
          </p>
        </Link>
      </div>
    </main>
  );
}
