import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");

  const matches = await prisma.match.findMany({
    where: sessionId ? { sessionId } : undefined,
    orderBy: [{ createdAt: "desc" }],
    include: {
      members: {
        include: { player: true },
      },
    },
  });

  return NextResponse.json(matches);
}
