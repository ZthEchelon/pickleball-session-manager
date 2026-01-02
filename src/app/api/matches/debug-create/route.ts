import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const players = await prisma.player.findMany({
    where: { active: true },
    orderBy: { createdAt: "asc" },
    take: 4,
  });

  if (players.length < 4) {
    return NextResponse.json(
      { error: "Need at least 4 active players to create a match" },
      { status: 400 }
    );
  }

  // Make (or reuse) a session for today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const session = await prisma.session.upsert({
    where: { date: today },
    update: {},
    create: { date: today },
  });

  const match = await prisma.match.create({
    data: {
      sessionId: session.id,
      round: 1,
      members: {
        create: [
          { playerId: players[0].id, team: 1 },
          { playerId: players[1].id, team: 1 },
          { playerId: players[2].id, team: 2 },
          { playerId: players[3].id, team: 2 },
        ],
      },
    },
    include: { members: { include: { player: true } } },
  });

  return NextResponse.json(match, { status: 201 });
}
