import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import path from "path";
import { promises as fs } from "fs";

export const runtime = "nodejs";

function safeExt(name: string) {
  const ext = path.extname(name || "").toLowerCase().replace(/[^a-z0-9.]/g, "");
  return ext && ext.length <= 10 ? ext : "";
}

function safeSlug(s: string) {
  return (s || "")
    .trim()
    .toLowerCase()
    .replace(/[áàâä]/g, "a").replace(/[éèêë]/g, "e").replace(/[íìîï]/g, "i")
    .replace(/[óòôöő]/g, "o").replace(/[úùûüű]/g, "u")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export async function POST(req: Request) {
  const form = await req.formData();
  const scope = (form.get("scope") || "project").toString(); // project | company | employee
  const projectId = (form.get("projectId") || "").toString() || null; // optional for company/employee
  const type = (form.get("type") || "general").toString();
  const subType = (form.get("subType") || "").toString() || null;
  const employeeName = (form.get("employeeName") || "").toString() || null;

  const versionStr = (form.get("version") || "").toString();
  const version = versionStr ? Number(versionStr) : null;

  const file = form.get("file") as unknown as File | null;
  if (!file) return NextResponse.json({ error: "Hiányzó fájl" }, { status: 400 });

  if (scope === "project" && !projectId) {
    return NextResponse.json({ error: "Projekt dokumentumhoz kötelező a projectId" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const ext = safeExt(file.name);

  const datePart = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  let filenameBase = "";

  if (scope === "project") {
    const vPart = version ? `_ajanlat_v${version}` : "";
    const suffix =
      type === "signed_offer" ? "_alairva" :
      type === "invoice" ? "_szamla" :
      type === "offer_pdf" ? "_ajanlat" :
      type === "acceptance_tig" ? "_tig" :
      type === "contract" ? "_szerzodes" :
      "_dok";
    filenameBase = `${projectId}${vPart}${suffix}`;
  } else if (scope === "company") {
    const st = safeSlug(subType || type || "dok");
    filenameBase = `ceg_${st}_${datePart}`;
  } else {
    const emp = safeSlug(employeeName || "alkalmazott");
    const st = safeSlug(subType || type || "dok");
    filenameBase = `alkalmazott_${emp}_${st}_${datePart}`;
  }

  const filename = `${filenameBase}${ext || ""}`;
  const relPath = `/uploads/${filename}`;
  const absPath = path.join(process.cwd(), "public", "uploads", filename);

  await fs.mkdir(path.dirname(absPath), { recursive: true });
  await fs.writeFile(absPath, buffer);

  const doc = await prisma.document.create({
    data: {
      scope,
      projectId,
      type,
      subType,
      employeeName,
      filename,
      path: relPath
    }
  });

  // Optional: update project pointers for signed/invoice
  if (scope === "project" && projectId) {
    if (type === "signed_offer") {
      await prisma.project.update({
        where: { id: projectId },
        data: { signedFilePath: relPath, signedOfferVersion: version ?? undefined, signed: true }
      });
    }
    if (type === "invoice") {
      await prisma.project.update({
        where: { id: projectId },
        data: { invoiceFilePath: relPath, invoiceIssued: true }
      });
    }
  }

  return NextResponse.json({ ok: true, doc, path: relPath });
}
