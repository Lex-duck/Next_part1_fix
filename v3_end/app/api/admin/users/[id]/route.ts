import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getSessionUser, isAdmin } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const me = await getSessionUser();
  if (!me || !isAdmin(me)) return NextResponse.json({ error: "Nincs jogosultság." }, { status: 403 });

  const body = await req.json();
  const updated = await prisma.user.update({ where: { id: params.id }, data: body });
  return NextResponse.json(updated);
}
