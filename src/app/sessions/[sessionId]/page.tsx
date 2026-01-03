"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

type Row = {
  id: string;
  name: string;
  rating: number;
  present: boolean;
};

type Session = {
  id: string;
  date: string;
};

type Group = {
  id: string;
  label: string;
  members: {
    id: string;
    position: number;
    player: {
      id: string;
      name: string;
      rating: number;
    };
  }[];
};

//changed matched maember
type MatchMember = {
  team: number;
  player: { id: string; name: string; rating: number };
};

type Match = {
  id: string;
  score1: number | null;
  score2: number | null;
  finalizedAt: string | null;
  round: number;
  members: MatchMember[];
};


export default function SessionDetailPage() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = params.sessionId;

  

  const [session, setSession] = useState<Session | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupCount, setGroupCount] = useState(2);
  const [loading, setLoading] = useState(false);

  //added state for generate matches
  const [matches, setMatches] = useState<Match[]>([]);


  async function loadAttendance() {
    const res = await fetch(`/api/sessions/${sessionId}/attendance`, {
      cache: "no-store",
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err?.error ?? "Failed to load session");
      return;
    }

    const data = await res.json();
    setSession(data.session);
    setRows(data.rows);
  }

  //edit new functions

  async function saveScores(matchId: string, score1: number, score2: number) {
  const res = await fetch(`/api/matches/${matchId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ score1, score2 }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    alert(err?.error ?? "Failed to save scores");
    return false;
  }
  return true;
}

  async function finalizeMatch(matchId: string) {
    const res = await fetch(`/api/matches/${matchId}/finalize`, {
      method: "POST",
    });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    alert(err?.error ?? "Failed to finalize match");
    return false;
  }
  return true;
}

//end of new functions


  async function loadGroups() {
    const res = await fetch(`/api/sessions/${sessionId}/groups`, {
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      setGroups(data);
    }
  }

  async function loadMatches() {
    const res = await fetch(`/api/sessions/${sessionId}/matches`, {
      cache: "no-store",
    });
    if (res.ok) setMatches(await res.json());
}

  useEffect(() => {
    loadAttendance();
    loadGroups();
    loadMatches();
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const presentCount = useMemo(
    () => rows.filter((r) => r.present).length,
    [rows]
  );

  

  async function setPresent(playerId: string, present: boolean) {
    setRows((prev) =>
      prev.map((r) => (r.id === playerId ? { ...r, present } : r))
    );

    setLoading(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/attendance`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, present }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err?.error ?? "Failed to update attendance");
        await loadAttendance();
      }
    } finally {
      setLoading(false);
    }
  }

  async function generateGroups() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/sessions/${sessionId}/groups/generate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ groupCount }),
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err?.error ?? "Failed to generate groups");
        return;
      }

      const data = await res.json();
      setGroups(data.groups);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{session?.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {session && new Date(session.date).toLocaleDateString()}
              ? new Date(session.date).toLocaleDateString()
          </p>
        </div>

        <button
          className="rounded-md border px-3 py-2 text-sm disabled:opacity-50"
          onClick={() => {
            loadAttendance();
            loadGroups();
          }}
          disabled={loading}
        >
          Refresh
        </button>
      </div>

      {/* Attendance */}
      <div className="mt-4 text-sm">
        Present: <span className="font-medium">{presentCount}</span> /{" "}
        <span className="font-medium">{rows.length}</span>
      </div>

      <div className="mt-4 rounded-md border">
        <div className="grid grid-cols-4 gap-2 border-b px-3 py-2 text-sm font-medium">
          <div className="col-span-2">Player</div>
          <div>Rating</div>
          <div className="text-right">Present</div>
        </div>

        {rows.map((r) => (
          <div
            key={r.id}
            className="grid grid-cols-4 items-center gap-2 px-3 py-2 text-sm"
          >
            <div className="col-span-2">{r.name}</div>
            <div>{r.rating}</div>
            <div className="flex justify-end">
              <input
                type="checkbox"
                checked={r.present}
                onChange={(e) => setPresent(r.id, e.target.checked)}
                disabled={loading}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Generate Groups */}
      <div className="mt-8 flex items-center gap-3">
        <input
          type="number"
          min={2}
          className="w-20 rounded-md border px-3 py-2 text-sm"
          value={groupCount}
          onChange={(e) => setGroupCount(Number(e.target.value))}
        />
        <button
          className="rounded-md border px-4 py-2 text-sm disabled:opacity-50"
          onClick={generateGroups}
          disabled={loading}
        >
          Generate Groups
        </button>
      </div>

      {/* Groups Display */}
      {groups.length > 0 && (
        <>
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            {groups.map((g) => (
              <div key={g.id} className="rounded-md border p-3">
                <div className="mb-2 font-medium">{g.label}</div>
                <ul className="text-sm">
                  {g.members.map((m) => (
                    <li key={`${g.id}-${m.player.id}`}>
                      {m.position}. {m.player.name} ({m.player.rating})
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <button
            className="mt-4 rounded-md border px-4 py-2 text-sm disabled:opacity-50"
            onClick={async () => {
              setLoading(true);
              try {
                const res = await fetch(
                  `/api/sessions/${sessionId}/matches/generate`,
                  { method: "POST" }
                );
                if (!res.ok) {
                  const err = await res.json().catch(() => ({}));
                  alert(err?.error ?? "Failed to generate matches");
                  return;
                }
                await loadMatches();
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
          >
            Generate Matches
          </button>
        </>
      )}



      {/* Matches Display */}
      {matches.length > 0 && (
        <div className="mt-8">
          <div className="text-lg font-medium">Matches</div>
          <div className="mt-3 space-y-3">
            {matches.map((m) => {
              const team1 = m.members.filter((mem) => mem.team === 1);
              const team2 = m.members.filter((mem) => mem.team === 2);

              return (
                <div key={m.id} className="rounded-md border p-3 text-sm">
                  <div className="text-xs text-muted-foreground">
                    Round {m.round}
                  </div>
                  <div className="mt-1">
                    <span className="font-medium">Team 1:</span>{" "}
                    {team1.map((p) => p.player.name).join(" / ")}
                  </div>
                  <div className="mt-1">
                    <span className="font-medium">Team 2:</span>{" "}
                    {team2.map((p) => p.player.name).join(" / ")}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* render matches with input*/}

      {matches.length > 0 && (
  <div className="mt-8 rounded-md border">
    <div className="border-b px-3 py-2 text-sm font-medium">Matches</div>

    {matches.map((m) => {
      const team1 = m.members.filter((x) => x.team === 1);
      const team2 = m.members.filter((x) => x.team === 2);

      const locked = Boolean(m.finalizedAt);

      return (
        <div key={m.id} className="border-b px-3 py-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1">
              <div className="font-medium">
                {team1.map((p) => p.player.name).join(" & ")}{" "}
                <span className="text-muted-foreground">vs</span>{" "}
                {team2.map((p) => p.player.name).join(" & ")}
              </div>

              {locked && (
                <div className="mt-1 text-xs text-muted-foreground">
                  Finalized ✅
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                className="w-16 rounded-md border px-2 py-1 text-sm"
                type="number"
                min={0}
                max={99}
                defaultValue={m.score1 ?? ""}
                disabled={locked || loading}
                onChange={(e) => {
                  const v = e.target.value === "" ? null : Number(e.target.value);
                  setMatches((prev) =>
                    prev.map((x) => (x.id === m.id ? { ...x, score1: v } : x))
                  );
                }}
              />
              <span className="text-muted-foreground">-</span>
              <input
                className="w-16 rounded-md border px-2 py-1 text-sm"
                type="number"
                min={0}
                max={99}
                defaultValue={m.score2 ?? ""}
                disabled={locked || loading}
                onChange={(e) => {
                  const v = e.target.value === "" ? null : Number(e.target.value);
                  setMatches((prev) =>
                    prev.map((x) => (x.id === m.id ? { ...x, score2: v } : x))
                  );
                }}
              />

              <button
                className="rounded-md border px-3 py-1 text-sm disabled:opacity-50"
                disabled={locked || loading || m.score1 == null || m.score2 == null}
                onClick={async () => {
                  setLoading(true);
                  try {
                    const ok = await saveScores(m.id, m.score1!, m.score2!);
                    if (ok) await loadMatches();
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                Save
              </button>

              <button
                className="rounded-md border px-3 py-1 text-sm disabled:opacity-50"
                disabled={locked || loading || m.score1 == null || m.score2 == null}
                onClick={async () => {
                  setLoading(true);
                  try {
                    // ensure scores are saved before finalize
                    const saved = await saveScores(m.id, m.score1!, m.score2!);
                    if (!saved) return;

                    const ok = await finalizeMatch(m.id);
                    if (ok) {
                      await loadMatches();
                      // optional: refresh attendance/groups too if you show ratings/live changes elsewhere
                    }
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                Finalize
              </button>
            </div>
          </div>
        </div>
      );
    })}
  </div>
)}


      <div className="mt-6">
        <Link href="/sessions" className="text-sm underline">
          ← Back to sessions
        </Link>
      </div>
    </main>
  );
}
