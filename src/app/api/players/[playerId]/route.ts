import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const BodySchema = z.object({
  active: z.boolean(),
});

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ playerId: string }> }
) {
  const { playerId } = await ctx.params;

  const body = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body. Expected { active: boolean }." },
      { status: 400 }
    );
  }

  const updated = await prisma.player.update({
    where: { id: playerId },
    data: { active: parsed.data.active },
  });

  return NextResponse.json(updated);
}
