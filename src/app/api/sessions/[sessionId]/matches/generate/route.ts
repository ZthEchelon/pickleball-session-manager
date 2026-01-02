//api connector matches

import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateRoundRobinDoubles } from "@/lib/matches";

type GroupWithMembers = Prisma.GroupGetPayload<{
  include: { members: { include: { player: true } } };
}>;

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await ctx.params;

  //for round robin doubles

  

  // Load groups + players
  const groups: GroupWithMembers[] = await prisma.group.findMany({
    where: { sessionId },
    include: {
      members: {
        include: { player: true },
        orderBy: { position: "asc" }, // safe since you added it
      },
    },
  });

  if (groups.length === 0) {
    return NextResponse.json(
      { error: "No groups found. Generate groups first." },
      { status: 400 }
    );
  }

  for (const group of groups) {
    if (group.members.length < 4 || group.members.length > 6) {
      return NextResponse.json(
        { error: "Each group must have between 4 and 6 players to generate matches." },
        { status: 400 }
      );
    }
  }

  const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // Clear existing matches for this session
    await tx.matchTeamMember.deleteMany({
      where: { match: { sessionId } },
    });
    await tx.match.deleteMany({
      where: { sessionId },
    });

    for (const group of groups) {
      const players = group.members.map((m: GroupWithMembers["members"][number]) => ({
        id: m.playerId,
        rating: m.player.rating,
      }));

      const matches = generateRoundRobinDoubles(players);

      let round = 1;

      for (const m of matches) {
        const match = await tx.match.create({
          data: {
            sessionId,
            round: round++,
          },
        });

        // Team 1
        await tx.matchTeamMember.createMany({
          data: m.team1.map((playerId) => ({
            matchId: match.id,
            playerId,
            team: 1,
          })),
        });

        // Team 2
        await tx.matchTeamMember.createMany({
          data: m.team2.map((playerId) => ({
            matchId: match.id,
            playerId,
            team: 2,
          })),
        });
      }
    }

    return tx.match.findMany({
      where: { sessionId },
      include: {
        members: { include: { player: true } },
      },
    });
  });

  return NextResponse.json({ ok: true, matches: result });
}
