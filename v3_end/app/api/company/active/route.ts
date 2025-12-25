import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Nincs bejelentkezve." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const companyId = String(body?.companyId || "");
  if (!companyId) return NextResponse.json({ error: "Hiányzó companyId." }, { status: 400 });

  // Check access
  let ok = false;
  if (user.role === "accountant") {
    const access = await prisma.companyAccess.findFirst({ where: { userId: user.id, companyId } });
    ok = !!access;
  } else {
    ok = user.companyId === companyId;
  }

  if (!ok) return NextResponse.json({ error: "Nincs jogosultság a céghez." }, { status: 403 });

  const res = NextResponse.json({ ok: true });
  res.cookies.set("active_company", companyId, { httpOnly: false, sameSite: "lax", path: "/" });
  return res;
}
