import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/apiAuth";

export async function GET() {
  const { me, activeCompany, error, status } = await requireUser();
  if (!me) return NextResponse.json(error, { status });
  if (!activeCompany) return NextResponse.json({ error: "Nincs aktív cég." }, { status: 400 });

  if (!(me.role === "admin" || me.canManageUsers)) return NextResponse.json({ error: "Nincs jogosultság." }, { status: 403 });

  const users = await prisma.user.findMany({
    where: { companyId: activeCompany.id },
    orderBy: { createdAt: "asc" }
  });

  return NextResponse.json(
    users.map((u) => ({
      id: u.id,
      username: u.username,
      displayName: u.displayName,
      role: u.role,
      canViewFinance: u.canViewFinance,
      canManageUsers: u.canManageUsers,
      canManageProjects: u.canManageProjects
    }))
  );
}

export async function POST(req: Request) {
  const { me, activeCompany, error, status } = await requireUser();
  if (!me) return NextResponse.json(error, { status });
  if (!activeCompany) return NextResponse.json({ error: "Nincs aktív cég." }, { status: 400 });

  if (!(me.role === "admin" || me.canManageUsers)) return NextResponse.json({ error: "Nincs jogosultság." }, { status: 403 });

  const body = await req.json();
  if (!body?.username || !body?.password || !body?.displayName) {
    return NextResponse.json({ error: "Hiányzó adatok (username, password, displayName)." }, { status: 400 });
  }

  const created = await prisma.user.create({
    data: {
      username: String(body.username),
      password: String(body.password),
      displayName: String(body.displayName),
      role: String(body.role || "staff"),
      canViewFinance: !!body.canViewFinance,
      canManageUsers: !!body.canManageUsers,
      canManageProjects: body.canManageProjects !== false,
      companyId: activeCompany.id
    }
  });

  return NextResponse.json({
    id: created.id,
    username: created.username,
    displayName: created.displayName,
    role: created.role,
    canViewFinance: created.canViewFinance,
    canManageUsers: created.canManageUsers,
    canManageProjects: created.canManageProjects
  });
}
