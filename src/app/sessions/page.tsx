"use client";

import { useEffect, useState } from "react";

type Session = {
  id: string;
  date: string;
};

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    const res = await fetch("/api/sessions", { cache: "no-store" });
    setSessions(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  async function createSession(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err?.error ?? "Failed to create session");
        return;
      }

      setDate("");
      await load();
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-semibold">Sessions</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Create a session date and manage attendance.
      </p>

      <form onSubmit={createSession} className="mt-6 flex gap-2">
        <input
          className="w-full rounded-md border px-3 py-2"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <button
          disabled={loading || !date}
          className="rounded-md border px-4 py-2 disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create"}
        </button>
      </form>

      <div className="mt-6 rounded-md border">
        <div className="grid grid-cols-2 gap-2 border-b px-3 py-2 text-sm font-medium">
          <div>Date</div>
          <div>Open</div>
        </div>

        {sessions.map((s) => (
          <div key={s.id} className="grid grid-cols-2 gap-2 px-3 py-2 text-sm">
            <div>{new Date(s.date).toLocaleDateString()}</div>
            <a className="underline" href={`/sessions/${s.id}`}>
              Manage
            </a>
          </div>
        ))}

        {sessions.length === 0 && (
          <div className="px-3 py-4 text-sm text-muted-foreground">
            No sessions yet.
          </div>
        )}
      </div>
    </main>
  );
}
