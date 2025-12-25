import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/apiAuth";

export async function GET() {
  const { me, activeCompany, error, status } = await requireUser();
  if (!me) return NextResponse.json(error, { status });
  if (!activeCompany) return NextResponse.json({ error: "Nincs aktív cég." }, { status: 400 });

  const projects = await prisma.project.findMany({
    where: { company: activeCompany.name },
    orderBy: { updatedAt: "desc" }
  });
  return NextResponse.json(projects);
}

export async function POST(req: Request) {
  const { me, activeCompany, error, status } = await requireUser();
  if (!me) return NextResponse.json(error, { status });
  if (!activeCompany) return NextResponse.json({ error: "Nincs aktív cég." }, { status: 400 });
  if (!me.canManageProjects) return NextResponse.json({ error: "Nincs jogosultság projektek kezeléséhez." }, { status: 403 });

  const body = await req.json();
  if (!body?.id || !body?.name) return NextResponse.json({ error: "Hiányzó projekt adatok (id, név)." }, { status: 400 });

  const created = await prisma.project.create({
    data: {
      id: String(body.id),
      name: String(body.name),
      company: activeCompany.name,
      owner: String(body.owner || me.displayName || me.username),
      deadline: body.deadline ? String(body.deadline) : null,
      status: "ajanlat",
      description: body.description ? String(body.description) : null,
      partnerId: body.partnerId ? String(body.partnerId) : null,
      projectValueHuf: Number(body.projectValueHuf || 0)
    }
  });

  return NextResponse.json(created);
}
