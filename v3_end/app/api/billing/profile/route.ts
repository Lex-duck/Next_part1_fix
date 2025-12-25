import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const p = await prisma.billingProfile.findFirst({ orderBy: { createdAt: "asc" } });
  return NextResponse.json(p || null);
}

export async function POST(req: Request) {
  const body = await req.json();
  const existing = await prisma.billingProfile.findFirst({ orderBy: { createdAt: "asc" } });
  const saved = existing
    ? await prisma.billingProfile.update({ where: { id: existing.id }, data: body })
    : await prisma.billingProfile.create({ data: body });
  return NextResponse.json(saved);
}
