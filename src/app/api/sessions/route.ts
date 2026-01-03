import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const CreateSessionSchema = z.object({
  name: z.string().min(1, "Session name is required"),
  date: z.coerce.date(), // accepts "2026-01-02"
});

export async function GET() {
  const sessions = await prisma.session.findMany({
    orderBy: { date: "desc" },
  });
  return NextResponse.json(sessions);
}

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = CreateSessionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Normalize date to midnight
  const d = new Date(parsed.data.date);
  d.setHours(0, 0, 0, 0);

  const session = await prisma.session.create({
    data: {
      name: parsed.data.name.trim(),
      date: d,
    },
  });

  return NextResponse.json(session, { status: 201 });
}
