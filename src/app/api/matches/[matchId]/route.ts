import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const ScoreSchema = z.object({
  score1: z.number().int().min(0).max(99),
  score2: z.number().int().min(0).max(99),
});

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ matchId: string }> }
) {
  const { matchId } = await ctx.params;

  const body = await req.json().catch(() => null);
  const parsed = ScoreSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body. Expected { score1: int, score2: int }" },
      { status: 400 }
    );
  }

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: { id: true, finalizedAt: true },
  });

  if (!match) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }

  if (match.finalizedAt) {
    return NextResponse.json(
      { error: "Match already finalized" },
      { status: 409 }
    );
  }

  const updated = await prisma.match.update({
    where: { id: matchId },
    data: { score1: parsed.data.score1, score2: parsed.data.score2 },
  });

  return NextResponse.json(updated);
}
