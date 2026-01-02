"use client";

import { useEffect, useMemo, useState } from "react";

type Player = { id: string; name: string; rating: number };
type Member = { playerId: string; team: number; player: Player };
type Match = {
  id: string;
  sessionId: string;
  round: number;
  score1: number | null;
  score2: number | null;
  finalizedAt: string | null;
  members: Member[];
  createdAt: string;
};

function teamNames(members: Member[], team: 1 | 2) {
  return members
    .filter((m) => m.team === team)
    .map((m) => m.player.name)
    .join(" & ");
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    const res = await fetch("/api/matches", { cache: "no-store" });
    const data = await res.json();
    setMatches(data);
  }

  useEffect(() => {
    load();
  }, []);

  async function saveScores(matchId: string, score1: number, score2: number) {
    setLoading(true);
    try {
      const res = await fetch(`/api/matches/${matchId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score1, score2 }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err?.error ?? "Failed to update scores");
        return;
      }
      await load();
    } finally {
      setLoading(false);
    }
  }

  async function finalizeMatch(matchId: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/matches/${matchId}/finalize`, {
        method: "POST",
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err?.error ?? "Failed to finalize match");
        return;
      }

      await load();
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="text-2xl font-semibold">Matches</h1>
        <button
          className="rounded-md border px-3 py-2 text-sm disabled:opacity-50"
          onClick={load}
          disabled={loading}
        >
          Refresh
        </button>
      </div>

      <div className="mt-6 overflow-hidden rounded-md border">
        <div className="grid grid-cols-12 gap-2 border-b bg-muted/30 px-3 py-2 text-sm font-medium">
          <div className="col-span-4">Team 1</div>
          <div className="col-span-4">Team 2</div>
          <div className="col-span-2">Score</div>
          <div className="col-span-2 text-right">Action</div>
        </div>

        {matches.map((m) => {
          const t1 = teamNames(m.members, 1);
          const t2 = teamNames(m.members, 2);

          const s1 = m.score1 ?? 0;
          const s2 = m.score2 ?? 0;

          const canFinalize =
            m.finalizedAt == null && m.score1 != null && m.score2 != null;

          return (
            <div
              key={m.id}
              className="grid grid-cols-12 items-center gap-2 px-3 py-3 text-sm"
            >
              <div className="col-span-4">
                <div className="font-medium">{t1 || "(missing team 1)"}</div>
              </div>
              <div className="col-span-4">
                <div className="font-medium">{t2 || "(missing team 2)"}</div>
              </div>

              <div className="col-span-2 flex items-center gap-2">
                <input
                  className="w-14 rounded-md border px-2 py-1"
                  type="number"
                  defaultValue={m.score1 ?? ""}
                  placeholder="0"
                  onBlur={(e) => {
                    const v1 = Number(e.currentTarget.value || 0);
                    const v2 =
                      Number(
                        (document.getElementById(
                          `s2-${m.id}`
                        ) as HTMLInputElement | null)?.value || 0
                      ) ?? 0;
                    // Only save when both are present-ish (blur pattern)
                    saveScores(m.id, v1, v2);
                  }}
                />
                <span>-</span>
                <input
                  id={`s2-${m.id}`}
                  className="w-14 rounded-md border px-2 py-1"
                  type="number"
                  defaultValue={m.score2 ?? ""}
                  placeholder="0"
                  onBlur={(e) => {
                    const v2 = Number(e.currentTarget.value || 0);
                    const v1 =
                      Number(
                        (document.querySelector(
                          `input[data-s1='${m.id}']`
                        ) as HTMLInputElement | null)?.value || 0
                      ) ?? 0;
                    // fallback: use current stored score1 if selector fails
                    saveScores(m.id, m.score1 ?? 0, v2);
                  }}
                />
              </div>

              <div className="col-span-2 flex items-center justify-end gap-2">
                {m.finalizedAt ? (
                  <span className="rounded-md border px-2 py-1 text-xs">
                    Finalized ✅
                  </span>
                ) : (
                  <button
                    className="rounded-md border px-3 py-2 text-sm disabled:opacity-50"
                    disabled={loading || !canFinalize}
                    onClick={() => finalizeMatch(m.id)}
                    title={
                      !canFinalize
                        ? "Enter both scores before finalizing"
                        : "Finalize match and apply rating updates"
                    }
                  >
                    Finalize
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {matches.length === 0 && (
          <div className="px-3 py-6 text-sm text-muted-foreground">
            No matches yet.
          </div>
        )}
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Tip: enter scores, then click Finalize. Finalize applies rating changes
        and locks the match.
      </p>
    </main>
  );
}
