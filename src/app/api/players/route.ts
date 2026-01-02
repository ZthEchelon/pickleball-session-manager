import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const CreatePlayerSchema = z.object({
  name: z.string().min(1).max(80),
  rating: z.number().int().min(0).max(4000).optional(),
});

export async function GET() {
  const players = await prisma.player.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(players);
}

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = CreatePlayerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const player = await prisma.player.create({
    data: {
      name: parsed.data.name.trim(),
      rating: parsed.data.rating ?? 1000,
    },
  });

  return NextResponse.json(player, { status: 201 });
}
