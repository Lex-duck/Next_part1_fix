import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const usernameRaw = String(body?.username || "");
    const password = String(body?.password || "");
    const username = usernameRaw.trim();

    if (!username || !password) {
      return NextResponse.json({ error: "Hiányzó adatok." }, { status: 400 });
    }

    // SQLite-ban nincs `mode: "insensitive"`, ezért dev-ben JS oldali fallback.
    let user = await prisma.user.findFirst({
      where: { username },
      include: { company: true, companyAccesses: { include: { company: true } } }
    });

    if (!user) {
      const list = await prisma.user.findMany({
        include: { company: true, companyAccesses: { include: { company: true } } }
      });
      const u = list.find(x => (x.username || "").toLowerCase() === username.toLowerCase());
      user = (u as any) || null;
    }

    if (!user || user.password !== password) {
      return NextResponse.json({ error: "Hibás felhasználónév vagy jelszó." }, { status: 401 });
    }

    const res = NextResponse.json({ ok: true });

    // session
    res.cookies.set("session_user", user.id, { httpOnly: true, sameSite: "lax", path: "/" });

    // active company (multi-company alap)
    const companyId =
      user.companyId ||
      (user.companyAccesses && user.companyAccesses.length ? user.companyAccesses[0].companyId : null);

    if (companyId) {
      res.cookies.set("active_company", companyId, { httpOnly: false, sameSite: "lax", path: "/" });
    }

    return res;
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return NextResponse.json({ error: "Szerverhiba a bejelentkezésnél." }, { status: 500 });
  }
}
