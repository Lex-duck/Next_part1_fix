import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get("roomId");
  const after = searchParams.get("after");
  if (!roomId) return NextResponse.json({ error: "roomId required" }, { status: 400 });

  const where: any = { roomId };
  if (after) where.createdAt = { gt: new Date(after) };

  const msgs = await prisma.chatMessage.findMany({
    where,
    orderBy: { createdAt: "asc" },
    include: { sender: true }
  });

  return NextResponse.json(msgs.map((m) => ({
    id: m.id,
    roomId: m.roomId,
    text: m.text,
    createdAt: m.createdAt.toISOString(),
    sender: { id: m.sender.id, name: m.sender.name, role: m.sender.role }
  })));
}

export async function POST(req: Request) {
  const body = await req.json();
  const { roomId, senderId, text } = body || {};
  if (!roomId || !senderId || !text) return NextResponse.json({ error: "roomId, senderId, text required" }, { status: 400 });

  const created = await prisma.chatMessage.create({
    data: { roomId, senderId, text },
    include: { sender: true }
  });

  await prisma.chatRoom.update({ where: { id: roomId }, data: { updatedAt: new Date() } });

  return NextResponse.json({
    id: created.id,
    roomId: created.roomId,
    text: created.text,
    createdAt: created.createdAt.toISOString(),
    sender: { id: created.sender.id, name: created.sender.name, role: created.sender.role }
  });
}
