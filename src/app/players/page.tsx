"use client";

import { useEffect, useState } from "react";

type Player = {
  id: string;
  name: string;
  rating: number;
  createdAt: string;
};

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [name, setName] = useState("");
  const [rating, setRating] = useState<string>("1000");
  const [loading, setLoading] = useState(false);

  async function load() {
    const res = await fetch("/api/players");
    const data = await res.json();
    setPlayers(data);
  }

  useEffect(() => {
    load();
  }, []);

  async function addPlayer(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          rating: rating ? Number(rating) : undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err?.error ?? "Failed to create player");
        return;
      }

      setName("");
      setRating("1000");
      await load();
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-semibold">Players</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Add players and manage ratings.
      </p>

      <form onSubmit={addPlayer} className="mt-6 flex gap-2">
        <input
          className="w-full rounded-md border px-3 py-2"
          placeholder="Player name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="w-28 rounded-md border px-3 py-2"
          placeholder="Rating"
          value={rating}
          onChange={(e) => setRating(e.target.value)}
        />
        <button
          disabled={loading || !name.trim()}
          className="rounded-md border px-4 py-2 disabled:opacity-50"
        >
          {loading ? "Adding..." : "Add"}
        </button>
      </form>

      <div className="mt-8 rounded-md border">
        <div className="grid grid-cols-3 gap-2 border-b px-3 py-2 text-sm font-medium">
          <div>Name</div>
          <div>Rating</div>
          <div>Created</div>
        </div>
        {players.map((p) => (
          <div key={p.id} className="grid grid-cols-3 gap-2 px-3 py-2 text-sm">
            <div>{p.name}</div>
            <div>{p.rating}</div>
            <div>{new Date(p.createdAt).toLocaleDateString()}</div>
          </div>
        ))}
        {players.length === 0 && (
          <div className="px-3 py-4 text-sm text-muted-foreground">
            No players yet.
          </div>
        )}
      </div>
    </main>
  );
}
