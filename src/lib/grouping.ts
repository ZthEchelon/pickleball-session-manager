export type RatedPlayer = {
  id: string;
  name: string;
  rating: number;
};

export function snakeDraftGroups(players: RatedPlayer[], groupCount: number) {
  if (!Number.isInteger(groupCount) || groupCount < 2) {
    throw new Error("groupCount must be an integer >= 2");
  }
  if (players.length < groupCount) {
    throw new Error("Not enough players to form groups");
  }

  // Highest rating first
  const sorted = [...players].sort((a, b) => b.rating - a.rating);

  const groups: RatedPlayer[][] = Array.from({ length: groupCount }, () => []);

  for (let i = 0; i < sorted.length; i++) {
    const round = Math.floor(i / groupCount);
    const indexInRound = i % groupCount;

    // Even rounds go left->right, odd rounds right->left
    const groupIndex =
      round % 2 === 0 ? indexInRound : groupCount - 1 - indexInRound;

    groups[groupIndex].push(sorted[i]);
  }

  return groups;
}
