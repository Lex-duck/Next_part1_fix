import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const rooms = await prisma.chatRoom.findMany({ orderBy: { updatedAt: "desc" } });
  return NextResponse.json(rooms);
}

export async function POST(req: Request) {
  const body = await req.json();
  const created = await prisma.chatRoom.create({ data: body });
  return NextResponse.json(created);
}
