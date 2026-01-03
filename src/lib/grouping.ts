export type RatedPlayer = {
  id: string;
  name: string;
  rating: number;
};

export function groupByRatingBands(players: RatedPlayer[], groupCount: number) {
  if (!Number.isInteger(groupCount) || groupCount < 2) {
    throw new Error("groupCount must be an integer >= 2");
  }
  if (players.length < groupCount) {
    throw new Error("Not enough players to form groups");
  }

  // best -> worst
  const sorted = [...players].sort((a, b) => b.rating - a.rating);

  const n = sorted.length;
  const base = Math.floor(n / groupCount);
  const rem = n % groupCount;

  // First `rem` groups get one extra player
  const sizes = Array.from({ length: groupCount }, (_, i) =>
    i < rem ? base + 1 : base
  );

  const groups: RatedPlayer[][] = [];
  let idx = 0;

  for (const size of sizes) {
    groups.push(sorted.slice(idx, idx + size));
    idx += size;
  }

  return groups;
}
