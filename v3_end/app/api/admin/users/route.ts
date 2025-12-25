import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getSessionUser, isAdmin } from "@/lib/auth";

export async function GET() {
  const me = await getSessionUser();
  if (!me || !isAdmin(me)) return NextResponse.json({ error: "Nincs jogosultság." }, { status: 403 });

  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" }, include: { company: true } });
  return NextResponse.json(users.map((u) => ({
    id: u.id,
    username: u.username,
    displayName: u.displayName,
    role: u.role,
    avatarUrl: u.avatarUrl,
    canViewFinance: u.canViewFinance,
    canManageUsers: u.canManageUsers,
    canManageProjects: u.canManageProjects,
    company: u.company ? { id: u.company.id, name: u.company.name } : null
  })));
}

export async function POST(req: Request) {
  const me = await getSessionUser();
  if (!me || !isAdmin(me)) return NextResponse.json({ error: "Nincs jogosultság." }, { status: 403 });

  const body = await req.json();
  const created = await prisma.user.create({ data: body });
  return NextResponse.json(created);
}
