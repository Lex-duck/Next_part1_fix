import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/apiAuth";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { me, activeCompany, error, status } = await requireUser();
  if (!me) return NextResponse.json(error, { status });
  if (!activeCompany) return NextResponse.json({ error: "Nincs aktív cég." }, { status: 400 });

  if (!(me.role === "admin" || me.canManageUsers)) return NextResponse.json({ error: "Nincs jogosultság." }, { status: 403 });

  const body = await req.json();
  const target = await prisma.user.findUnique({ where: { id: params.id } });
  if (!target || target.companyId !== activeCompany.id) return NextResponse.json({ error: "Felhasználó nem található." }, { status: 404 });

  // Biztonság: ne lehessen saját admin jogot kiosztani nem-adminból (csak admin tudja)
  if (me.role !== "admin" && body.role === "admin") {
    return NextResponse.json({ error: "Admin szerep kiosztásához admin jogosultság kell." }, { status: 403 });
  }

  const updated = await prisma.user.update({
    where: { id: params.id },
    data: {
      displayName: body.displayName ?? undefined,
      role: body.role ?? undefined,
      canViewFinance: body.canViewFinance ?? undefined,
      canManageUsers: body.canManageUsers ?? undefined,
      canManageProjects: body.canManageProjects ?? undefined
    }
  });

  return NextResponse.json({
    id: updated.id,
    username: updated.username,
    displayName: updated.displayName,
    role: updated.role,
    canViewFinance: updated.canViewFinance,
    canManageUsers: updated.canManageUsers,
    canManageProjects: updated.canManageProjects
  });
}
