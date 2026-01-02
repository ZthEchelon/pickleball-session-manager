//

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
        include: { player: true },
        // If you DO have GroupMember.position in your schema, keep this:
        // orderBy: { position: "asc" },
      },
    },
  });

  return NextResponse.json(groups);
}
