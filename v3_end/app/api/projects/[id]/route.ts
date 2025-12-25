import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/apiAuth";

async function hasDoc(projectId: string, type: string) {
  const d = await prisma.document.findFirst({ where: { projectId, type } });
  return !!d;
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const { me, activeCompany, error, status } = await requireUser();
  if (!me) return NextResponse.json(error, { status });
  if (!activeCompany) return NextResponse.json({ error: "Nincs aktív cég." }, { status: 400 });

  const p = await prisma.project.findUnique({ where: { id: params.id } });
  if (!p || p.company !== activeCompany.name) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(p);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { me, activeCompany, error, status } = await requireUser();
  if (!me) return NextResponse.json(error, { status });
  if (!activeCompany) return NextResponse.json({ error: "Nincs aktív cég." }, { status: 400 });
  if (!me.canManageProjects) return NextResponse.json({ error: "Nincs jogosultság projektek kezeléséhez." }, { status: 403 });

  const body = await req.json();
  const current = await prisma.project.findUnique({ where: { id: params.id } });
  if (!current || current.company !== activeCompany.name) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (body.status && body.status !== current.status) {
    const target = String(body.status);

    if (current.status === "ajanlat" && target === "folyamatban") {
      const offerCount = await prisma.offer.count({ where: { projectId: current.id } });
      const hasOfferDoc = (await hasDoc(current.id, "offer_doc")) || (await hasDoc(current.id, "offer_pdf"));
      const hasSigned = (await hasDoc(current.id, "signed_offer")) || !!current.signedFilePath || current.signed;

      if (offerCount < 1) return NextResponse.json({ error: "Nem tehető folyamatba: nincs még ajánlat létrehozva." }, { status: 400 });
      if (!hasOfferDoc) return NextResponse.json({ error: "Nem tehető folyamatba: az ajánlathoz kötelező a dokumentum." }, { status: 400 });
      if (!hasSigned) return NextResponse.json({ error: "Nem tehető folyamatba: az ajánlat nincs aláírva (töltsd fel az aláírt fájlt)." }, { status: 400 });
    }

    if (current.status === "folyamatban" && target === "zart") {
      const hasInvoiceDoc = (await hasDoc(current.id, "invoice")) || !!current.invoiceFilePath || current.invoiceIssued;
      const hasSigned = (await hasDoc(current.id, "signed_offer")) || !!current.signedFilePath || current.signed;
      if (!hasSigned) return NextResponse.json({ error: "Nem zárható: nincs aláírt ajánlat." }, { status: 400 });
      if (!hasInvoiceDoc) return NextResponse.json({ error: "Nem zárható: nincs számla kiállítva / feltöltve." }, { status: 400 });
    }

    const ok =
      (current.status === "ajanlat" && target === "folyamatban") ||
      (current.status === "folyamatban" && target === "zart") ||
      (current.status === "ajanlat" && target === "zart");
    if (!ok) return NextResponse.json({ error: "Érvénytelen státusz átmenet." }, { status: 400 });

    body.status = target;
  }

  if (current.status === "zart") {
    const forbidden = ["name", "deadline", "owner", "partnerId", "description", "projectValueHuf", "company"];
    for (const k of forbidden) if (k in body) delete body[k];
  }

  const updated = await prisma.project.update({ where: { id: params.id }, data: body });
  return NextResponse.json(updated);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const { me, activeCompany, error, status } = await requireUser();
  if (!me) return NextResponse.json(error, { status });
  if (!activeCompany) return NextResponse.json({ error: "Nincs aktív cég." }, { status: 400 });
  if (!me.canManageProjects) return NextResponse.json({ error: "Nincs jogosultság projektek kezeléséhez." }, { status: 403 });

  const p = await prisma.project.findUnique({ where: { id: params.id } });
  if (!p || p.company !== activeCompany.name) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (p.status === "zart") return NextResponse.json({ error: "Zárt projekt nem törölhető." }, { status: 400 });

  await prisma.project.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
