// this files sorts participants in the groups made based on rating

type Player = {
  id: string;
  rating: number;
};

type Match = {
  team1: [string, string];
  team2: [string, string];
};

export function generateRoundRobinDoubles(players: Player[]): Match[] {
  if (players.length < 4 || players.length > 6) {
    throw new Error("Groups must have 4–6 players");
  }

  // Sort best → worst
  const sorted = [...players].sort((a, b) => b.rating - a.rating);

  const ids = sorted.map(p => p.id);
  const n = ids.length;
  const matches: Match[] = [];

  // Helper to pair best with worst
  function pair(a: number, b: number): [string, string] {
    return [ids[a], ids[b]];
  }

  if (n === 4) {
    matches.push(
      { team1: pair(0, 3), team2: pair(1, 2) },
      { team1: pair(0, 2), team2: pair(1, 3) },
      { team1: pair(0, 1), team2: pair(2, 3) }
    );
  }

  if (n === 5) {
    for (let bye = 0; bye < 5; bye++) {
      const playing = ids.filter((_, i) => i !== bye);
      matches.push({
        team1: [playing[0], playing[3]],
        team2: [playing[1], playing[2]],
      });
    }
  }

  if (n === 6) {
    const rounds = [
      [[0,5],[1,4]],
      [[0,4],[2,5]],
      [[0,3],[1,5]],
      [[0,2],[3,5]],
      [[0,1],[2,4]],
    ];

    for (const r of rounds) {
      matches.push({
        team1: pair(r[0][0], r[0][1]),
        team2: pair(r[1][0], r[1][1]),
      });
    }
  }

  return matches;
}
