export type RatedPlayer = {
  id: string;
  rating: number;
};

export type DoublesMatchInput = {
  team1: readonly [RatedPlayer, RatedPlayer];
  team2: readonly [RatedPlayer, RatedPlayer];
  score1: number;
  score2: number;
  k?: number; // default 24
};

export function calculateDoublesEloUpdate(input: DoublesMatchInput) {
  const { team1, team2, score1, score2 } = input;

  if (!Number.isInteger(score1) || !Number.isInteger(score2) || score1 < 0 || score2 < 0) {
    throw new Error("Scores must be non-negative integers.");
  }
  if (score1 === score2) {
    throw new Error("Pickleball matches can't be ties.");
  }

  const k = input.k ?? 24;

  const r1 = (team1[0].rating + team1[1].rating) / 2;
  const r2 = (team2[0].rating + team2[1].rating) / 2;

  // Expected score for team1
  const d = (r1 - r2) / 400;
  const e1 = 1 / (1 + Math.pow(10, -d));

  // Actual result
  const s1 = score1 > score2 ? 1 : 0;

  // Margin-of-victory multiplier: 1.0 → 1.5
  const margin = Math.abs(score1 - score2);
  const m = 1 + (Math.min(margin, 11) / 11) * 0.5;

  const deltaTeam1 = Math.round(k * m * (s1 - e1));
  const deltaTeam2 = -deltaTeam1;

  return {
    [team1[0].id]: deltaTeam1,
    [team1[1].id]: deltaTeam1,
    [team2[0].id]: deltaTeam2,
    [team2[1].id]: deltaTeam2,
  } as Record<string, number>;
}
