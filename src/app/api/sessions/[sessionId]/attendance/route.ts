import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await ctx.params;

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    select: { id: true, date: true },
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const [players, attendance] = await Promise.all([
    prisma.player.findMany({
      where: { active: true },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, rating: true },
    }),
    prisma.sessionAttendance.findMany({
      where: { sessionId },
      select: { playerId: true, present: true },
    }),
  ]);

  type AttendanceRow = (typeof attendance)[number];
  type PlayerRow = (typeof players)[number];

  const presentMap = new Map<string, boolean>(
    attendance.map((a: AttendanceRow) => [a.playerId, a.present])
  );

  const rows = players.map((p: PlayerRow) => ({
    ...p,
    present: presentMap.get(p.id) ?? true, // ✅ default present
  }));

  return NextResponse.json({ session, rows });
}

const UpsertSchema = z.object({
  playerId: z.string().min(1),
  present: z.boolean(),
});

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await ctx.params;

  const body = await req.json().catch(() => null);
  const parsed = UpsertSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body. Expected { playerId: string, present: boolean }" },
      { status: 400 }
    );
  }

  // Upsert attendance row (composite key: sessionId + playerId)
  const updated = await prisma.sessionAttendance.upsert({
    where: {
      sessionId_playerId: {
        sessionId,
        playerId: parsed.data.playerId,
      },
    },
    update: { present: parsed.data.present },
    create: {
      sessionId,
      playerId: parsed.data.playerId,
      present: parsed.data.present,
    },
  });

  return NextResponse.json(updated);
}
