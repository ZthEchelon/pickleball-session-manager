import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const UpdateSchema = z.object({
  active: z.boolean(),
});

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await ctx.params;

  const body = await req.json().catch(() => null);
  const parsed = UpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body. Expected { active: boolean }" },
      { status: 400 }
    );
  }

  try {
    const updated = await prisma.session.update({
      where: { id: sessionId },
      data: { active: parsed.data.active },
      select: { id: true, active: true },
    });

    return NextResponse.json(updated);
  } catch (err) {
    // Prisma throws if the record is missing
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
}
