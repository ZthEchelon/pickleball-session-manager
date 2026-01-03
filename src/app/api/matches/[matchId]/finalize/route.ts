import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { calculateDoublesEloUpdate } from "@/lib/ratings";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ matchId: string }> }
) {
  const { matchId } = await ctx.params;

  // 1) Load match with members and player ratings
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      members: {
        include: { player: true },
      },
    },
  });

  //check for match
  if (!match) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }

  //score check
  if (match.score1 == null || match.score2 == null) {
    return NextResponse.json(
      { error: "Match must have both scores before finalizing" },
      { status: 400 }
    );
  }
  //finalize matches
  if (match.finalizedAt) {
  return NextResponse.json(
    { error: "Match already finalized" },
    { status: 409 }
  );
}


  // 2) Split teams
  type MemberWithPlayer = (typeof match.members)[number];
  const team1Members = match.members.filter(
    (m: MemberWithPlayer) => m.team === 1
  );
  const team2Members = match.members.filter(
    (m: MemberWithPlayer) => m.team === 2
  );

  if (team1Members.length !== 2 || team2Members.length !== 2) {
    return NextResponse.json(
      { error: "Match must have exactly 2 players per team to finalize" },
      { status: 400 }
    );
  }

  const team1 = [
    { id: team1Members[0].playerId, rating: team1Members[0].player.rating },
    { id: team1Members[1].playerId, rating: team1Members[1].player.rating },
  ] as const;

  const team2 = [
    { id: team2Members[0].playerId, rating: team2Members[0].player.rating },
    { id: team2Members[1].playerId, rating: team2Members[1].player.rating },
  ] as const;

  // 3) Compute deltas (pure function)
  const deltas = calculateDoublesEloUpdate({
    team1,
    team2,
    score1: match.score1,
    score2: match.score2,
    k: 24,
  });

  // 4) Apply updates in a single transaction
  const playerIds = Object.keys(deltas);
//editted this
  const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {

    // ✅ Atomically finalize (prevents double-apply even under race)
  const updated = await tx.match.updateMany({
    where: { id: match.id, finalizedAt: null },
    data: { finalizedAt: new Date() },
  });

  if (updated.count !== 1) {
    throw new Error("Match already finalized");
  }

    // Re-read current ratings inside transaction (avoid race conditions)
    const players = await tx.player.findMany({
      where: { id: { in: playerIds } },
      select: { id: true, rating: true },
    });

    if (players.length !== playerIds.length) {
      throw new Error("Mismatch between target players and transaction read");
    }

    const beforeMap = new Map<string, number>(
      players.map((p: { id: string; rating: number }) => [p.id, p.rating])
    );

    // Create snapshots
    await tx.ratingSnapshot.createMany({
      data: playerIds.map((playerId) => {
        const before = beforeMap.get(playerId);
        if (before == null) throw new Error("Missing player in transaction");

        const delta = deltas[playerId];
        const MIN_RATING = 100; // FLOOR VALUE FOR RATINGS
        const after = Math.max(MIN_RATING,before + delta);

        return {
          sessionId: match.sessionId,
          matchId: match.id,
          playerId,
          before,
          after,
          delta,
        };
      }),
    });

    // Update players
    for (const playerId of playerIds) {
      const before = beforeMap.get(playerId);
      if (before == null) {
        throw new Error(`Missing player in transaction: ${playerId}`);
      }
      const delta = deltas[playerId];
      const MIN_RATING = 100; // FLOOR VALUE FOR RATINGS
      const after = Math.max(MIN_RATING, before + delta);

      await tx.player.update({
        where: { id: playerId },
        data: { rating: after },
      });
    }

    return { deltas };
  });

  return NextResponse.json(
    { ok: true, matchId: match.id, sessionId: match.sessionId, ...result },
    { status: 200 }
  );
}
