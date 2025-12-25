import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/apiAuth";

export async function GET() {
  const { me, activeCompany, error, status } = await requireUser();
  if (!me) return NextResponse.json(error, { status });
  if (!activeCompany) return NextResponse.json({ error: "Nincs aktív cég." }, { status: 400 });

  const docs = await prisma.document.findMany({ orderBy: { createdAt: "desc" }, include: { project: true } });

  const filtered = docs.filter((d: any) => {
    if (d.scope === "company") return true;
    if (d.scope === "employee") return true;
    if (d.scope === "project") return d.project?.company === activeCompany.name;
    return false;
  });

  return NextResponse.json(
    filtered.map((d: any) => ({
      id: d.id,
      scope: d.scope,
      projectId: d.projectId,
      type: d.type,
      subType: d.subType,
      employeeName: d.employeeName,
      filename: d.filename,
      path: d.path,
      createdAt: d.createdAt.toISOString()
    }))
  );
}

export async function POST(req: Request) {
  const { me, activeCompany, error, status } = await requireUser();
  if (!me) return NextResponse.json(error, { status });
  if (!activeCompany) return NextResponse.json({ error: "Nincs aktív cég." }, { status: 400 });

  const body = await req.json();

  if (body.scope === "project" && body.projectId) {
    const p = await prisma.project.findUnique({ where: { id: String(body.projectId) } });
    if (!p || p.company !== activeCompany.name) return NextResponse.json({ error: "Projekt nem található." }, { status: 404 });
  }

  const created = await prisma.document.create({ data: body });
  return NextResponse.json({
    id: created.id,
    scope: created.scope,
    projectId: created.projectId,
    type: created.type,
    subType: created.subType,
    employeeName: created.employeeName,
    filename: created.filename,
    path: created.path,
    createdAt: created.createdAt.toISOString()
  });
}
