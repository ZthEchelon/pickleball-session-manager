"use client";

import { useEffect, useState } from "react";

type Session = {
  id: string;
  name: string;
  date: string;
  active: boolean;
};

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

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
        body: JSON.stringify({ name, date }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err?.error ?? "Failed to create session");
        return;
      }

      setName("");
      setDate("");
      await load();
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(sessionId: string, active: boolean) {
    setTogglingId(sessionId);
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err?.error ?? "Failed to update session");
        return;
      }

      await load();
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-semibold">Sessions</h1>

      <form onSubmit={createSession} className="mt-6 flex gap-2">
        <input
          className="w-full rounded-md border px-3 py-2"
          placeholder="Session name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <input
          type="date"
          className="rounded-md border px-3 py-2"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />

        <button
          disabled={loading || !name.trim() || !date}
          className="rounded-md border px-4 py-2 disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create"}
        </button>
      </form>

      <div className="mt-6 rounded-md border">
        <div className="grid grid-cols-4 gap-2 border-b px-3 py-2 text-sm font-medium">
          <div>Name</div>
          <div>Date</div>
          <div>Status</div>
          <div className="text-right">Actions</div>
        </div>

        {sessions.map((s) => (
          <div
            key={s.id}
            className="grid grid-cols-4 items-center gap-2 px-3 py-2 text-sm"
          >
            <div className="truncate" title={s.name}>
              {s.name}
            </div>
            <div>{new Date(s.date).toLocaleDateString()}</div>
            <div className={s.active ? "text-green-600" : "text-muted-foreground"}>
              {s.active ? "Active" : "Inactive"}
            </div>
            <div className="flex justify-end gap-2">
              <a className="underline" href={`/sessions/${s.id}`}>
                Manage
              </a>
              <button
                className="rounded-md border px-2 py-1 text-xs disabled:opacity-50"
                onClick={() => toggleActive(s.id, !s.active)}
                disabled={Boolean(togglingId)}
              >
                {togglingId === s.id
                  ? "Saving..."
                  : s.active
                    ? "Set Inactive"
                    : "Activate"}
              </button>
            </div>
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
