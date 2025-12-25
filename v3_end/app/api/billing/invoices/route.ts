import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

function pad(n: number, w = 6) {
  return String(n).padStart(w, "0");
}
function roundInt(n: number) {
  return Math.round(n);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const status = searchParams.get("status") || "";
  const where: any = {};
  if (status) where.status = status;
  if (q) {
    where.OR = [
      { number: { contains: q } },
      { buyerName: { contains: q } },
      { buyerTaxNo: { contains: q } }
    ];
  }
  const list = await prisma.invoice.findMany({ where, orderBy: { issueDate: "desc" } });
  return NextResponse.json(list);
}

export async function POST(req: Request) {
  const body = await req.json();
  const profile = await prisma.billingProfile.findFirst({ orderBy: { createdAt: "asc" } });
  if (!profile) return NextResponse.json({ error: "Hiányzik a Számlázás / Beállítások (kibocsátó adatok)." }, { status: 400 });

  const seq = profile.nextInvoiceSeq;
  const number = `${profile.prefix}-${new Date().getFullYear()}-${pad(seq)}`;

  const vatRateDefault = body.vatRate ?? profile.defaultVatRate ?? 27;

  const created = await prisma.invoice.create({
    data: {
      number,
      issueDate: body.issueDate ? new Date(body.issueDate) : new Date(),
      performanceDate: body.performanceDate ? new Date(body.performanceDate) : null,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      currency: body.currency || "HUF",
      status: body.status || "draft",
      paymentMethod: body.paymentMethod || "átutalás",
      notes: body.notes || null,

      issuerName: profile.companyName,
      issuerAddress: profile.address,
      issuerTaxNo: profile.taxNo || null,
      issuerBank: profile.bankAccount || null,

      buyerName: body.buyerName,
      buyerAddress: body.buyerAddress,
      buyerTaxNo: body.buyerTaxNo || null,

      partnerId: body.partnerId || null,
      projectId: body.projectId || null,
      vatRate: vatRateDefault,

      netTotal: 0,
      vatTotal: 0,
      grossTotal: 0
    }
  });

  // Items (optional, but supported)
  const items = Array.isArray(body.items) ? body.items : [];
  if (items.length) {
    let netTotal = 0;
    let vatTotal = 0;
    let grossTotal = 0;

    for (const it of items) {
      const qty = Number(it.quantity ?? 1);
      const unitNet = Number(it.unitNet ?? 0);
      const vr = Number(it.vatRate ?? vatRateDefault);
      const net = roundInt(qty * unitNet);
      const vat = roundInt(net * (vr / 100));
      const gross = net + vat;

      netTotal += net;
      vatTotal += vat;
      grossTotal += gross;

      await prisma.invoiceItem.create({
        data: {
          invoiceId: created.id,
          name: String(it.name || ""),
          quantity: qty,
          unit: String(it.unit || "db"),
          unitNet,
          vatRate: vr,
          netAmount: net,
          vatAmount: vat,
          grossAmount: gross
        }
      });
    }

    await prisma.invoice.update({
      where: { id: created.id },
      data: { netTotal, vatTotal, grossTotal }
    });
  }

  await prisma.billingProfile.update({ where: { id: profile.id }, data: { nextInvoiceSeq: seq + 1 } });

  const full = await prisma.invoice.findUnique({ where: { id: created.id }, include: { items: true } });
  return NextResponse.json(full);
}
