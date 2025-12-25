import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/apiAuth";
import path from "path";
import { promises as fs } from "fs";

export const runtime = "nodejs";

function safeSlug(s: string) {
  return (s || "")
    .trim()
    .toLowerCase()
    .replace(/[áàâä]/g, "a").replace(/[éèêë]/g, "e").replace(/[íìîï]/g, "i")
    .replace(/[óòôöő]/g, "o").replace(/[úùûüű]/g, "u")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export async function GET() {
  const { me, activeCompany, error, status } = await requireUser();
  if (!me) return NextResponse.json(error, { status });
  if (!activeCompany) return NextResponse.json({ error: "Nincs aktív cég." }, { status: 400 });

  const offers = await prisma.offer.findMany({
    orderBy: [{ projectId: "asc" }, { version: "asc" }],
    include: { project: true }
  });

  const filtered = offers.filter((o) => o.project.company === activeCompany.name);

  return NextResponse.json(
    filtered.map((o) => ({
      id: o.id,
      projectId: o.projectId,
      version: o.version,
      createdAt: o.createdAt.toISOString(),
      data: JSON.parse(o.dataJson),
      finalDocHtml: o.finalDocHtml
    }))
  );
}

export async function POST(req: Request) {
  const { me, activeCompany, error, status } = await requireUser();
  if (!me) return NextResponse.json(error, { status });
  if (!activeCompany) return NextResponse.json({ error: "Nincs aktív cég." }, { status: 400 });
  if (!me.canManageProjects) return NextResponse.json({ error: "Nincs jogosultság ajánlat létrehozásához." }, { status: 403 });

  const body = await req.json();
  const projectId = String(body.projectId || "");
  const version = Number(body.version || 1);
  const finalDocHtml = String(body.finalDocHtml || "");

  if (!projectId) return NextResponse.json({ error: "Hiányzó projectId." }, { status: 400 });
  if (!finalDocHtml) return NextResponse.json({ error: "Hiányzó ajánlat dokumentum." }, { status: 400 });

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project || project.company !== activeCompany.name) return NextResponse.json({ error: "Projekt nem található." }, { status: 404 });

  const created = await prisma.offer.create({
    data: {
      projectId,
      version,
      dataJson: JSON.stringify(body.data ?? {}),
      finalDocHtml
    }
  });

  // Kötelező dokumentum: HTML fájl a public/uploads/offers alatt
  const outDir = path.join(process.cwd(), "public", "uploads", "offers");
  await fs.mkdir(outDir, { recursive: true });
  const fname = `${safeSlug(projectId)}_ajanlat_v${version}.html`;
  await fs.writeFile(path.join(outDir, fname), finalDocHtml, "utf-8");

  const doc = await prisma.document.create({
    data: {
      scope: "project",
      projectId,
      type: "offer_doc",
      filename: fname,
      path: `/uploads/offers/${fname}`
    }
  });

  return NextResponse.json({
    id: created.id,
    projectId: created.projectId,
    version: created.version,
    createdAt: created.createdAt.toISOString(),
    data: JSON.parse(created.dataJson),
    finalDocHtml: created.finalDocHtml,
    documentId: doc.id
  });
}
