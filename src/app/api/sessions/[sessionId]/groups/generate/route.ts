import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { groupByRatingBands } from "@/lib/grouping";

//added for group end to end wiring

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await ctx.params;

  const groups = await prisma.group.findMany({
    where: { sessionId },
    orderBy: { label: "asc" },
    include: {
      members: {
        orderBy: { position: "asc" },
        include: { player: true },
      },
    },
  });

  return NextResponse.json(groups);
}


const BodySchema = z.object({
  groupCount: z.coerce.number().int().min(2).max(20),
});



export async function POST(
  req: Request,
  ctx: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await ctx.params;

  const body = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body. Expected { groupCount: number }" },
      { status: 400 }
    );
  }

  // If you used "default present" logic (no row means present),
  // we should compute present list like this instead:
  const activePlayers = await prisma.player.findMany({
    where: { active: true },
    select: { id: true, name: true, rating: true },
    orderBy: { rating: "desc" },
  });

  const attendanceRows = await prisma.sessionAttendance.findMany({
    where: { sessionId },
    select: { playerId: true, present: true },
  });

  type AttendanceRow = (typeof attendanceRows)[number];
  type PlayerRow = (typeof activePlayers)[number];

  const presentMap = new Map<string, boolean>(
    attendanceRows.map((a: AttendanceRow) => [a.playerId, a.present])
  );
  const presentPlayers = activePlayers.filter(
    (p: PlayerRow) => presentMap.get(p.id) ?? true
  );

  if (presentPlayers.length < 4) {
    return NextResponse.json(
      { error: "Need at least 4 present players to generate groups" },
      { status: 400 }
    );
  }

  const groups = groupByRatingBands(presentPlayers, parsed.data.groupCount);

  const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // Clear old groups for this session
    await tx.groupMember.deleteMany({
      where: { group: { sessionId } },
    });
    await tx.group.deleteMany({
      where: { sessionId },
    });

    // Create new groups + members
    for (let i = 0; i < groups.length; i++) {
      const g = await tx.group.create({
        data: {
          sessionId,
          label: `Group ${i + 1}`,
        },
      });

      const members = groups[i];

      await tx.groupMember.createMany({
        data: members.map((p, idx) => ({
          groupId: g.id,
          playerId: p.id,
          position: idx + 1,
        })),
      });
    }

    // Return created groups
    return await tx.group.findMany({
      where: { sessionId },
      orderBy: { label: "asc" },
      include: {
        members: { include: { player: true }, orderBy: { position: "asc" } },
      },
    });
  });

  return NextResponse.json({ ok: true, groups: result });
}
