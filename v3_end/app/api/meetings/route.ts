import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const meetings = await prisma.meeting.findMany({ orderBy: { startsAt: "asc" } });
  return NextResponse.json(meetings.map((m) => ({
    id: m.id,
    title: m.title,
    startsAt: m.startsAt.toISOString(),
    endsAt: m.endsAt.toISOString(),
    roomKey: m.roomKey,
    provider: m.provider
  })));
}

export async function POST(req: Request) {
  const body = await req.json();
  const created = await prisma.meeting.create({
    data: {
      title: body.title,
      startsAt: new Date(body.startsAt),
      endsAt: new Date(body.endsAt),
      roomKey: body.roomKey,
      provider: body.provider || "jitsi"
    }
  });
  return NextResponse.json({
    id: created.id,
    title: created.title,
    startsAt: created.startsAt.toISOString(),
    endsAt: created.endsAt.toISOString(),
    roomKey: created.roomKey,
    provider: created.provider
  });
}
