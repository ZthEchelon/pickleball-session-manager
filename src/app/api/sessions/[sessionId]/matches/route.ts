//get function for matches orderer

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await ctx.params;

  const matches = await prisma.match.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
    include: {
      members: {
        include: { player: true },
      },
    },
  });

  return NextResponse.json(matches);
}
