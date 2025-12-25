import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const partners = await prisma.partner.findMany({ orderBy: { updatedAt: "desc" } });
  return NextResponse.json(partners);
}

export async function POST(req: Request) {
  const body = await req.json();
  const created = await prisma.partner.create({ data: body });
  return NextResponse.json(created);
}
