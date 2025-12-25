import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getSessionUser, isAdmin } from "@/lib/auth";

export async function GET() {
  const me = await getSessionUser();
  if (!me || !isAdmin(me)) return NextResponse.json({ error: "Nincs jogosultság." }, { status: 403 });

  const companies = await prisma.company.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json(companies);
}

export async function POST(req: Request) {
  const me = await getSessionUser();
  if (!me || !isAdmin(me)) return NextResponse.json({ error: "Nincs jogosultság." }, { status: 403 });

  const body = await req.json();
  const created = await prisma.company.create({ data: body });
  return NextResponse.json(created);
}
