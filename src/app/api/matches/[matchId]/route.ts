import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const ScoreSchema = z.object({
  score1: z.coerce.number().int().min(0).max(50),
  score2: z.coerce.number().int().min(0).max(50),
});

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ matchId: string }> }
) {
  const { matchId } = await ctx.params;

  const body = await req.json();
  const parsed = ScoreSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid scores", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const match = await prisma.match.update({
    where: { id: matchId },
    data: {
      score1: parsed.data.score1,
      score2: parsed.data.score2,
    },
  });

  return NextResponse.json(match);
}
