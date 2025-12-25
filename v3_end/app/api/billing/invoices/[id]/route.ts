import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

function roundInt(n: number) {
  return Math.round(n);
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const inv = await prisma.invoice.findUnique({ where: { id: params.id }, include: { items: true } });
  return NextResponse.json(inv);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();

  // Replace items if provided
  if (Array.isArray(body.items)) {
    await prisma.invoiceItem.deleteMany({ where: { invoiceId: params.id } });

    let netTotal = 0;
    let vatTotal = 0;
    let grossTotal = 0;

    for (const it of body.items) {
      const qty = Number(it.quantity ?? 1);
      const unitNet = Number(it.unitNet ?? 0);
      const vatRate = Number(it.vatRate ?? body.vatRate ?? 27);
      const net = roundInt(qty * unitNet);
      const vat = roundInt(net * (vatRate / 100));
      const gross = net + vat;

      netTotal += net;
      vatTotal += vat;
      grossTotal += gross;

      await prisma.invoiceItem.create({
        data: {
          invoiceId: params.id,
          name: String(it.name || ""),
          quantity: qty,
          unit: String(it.unit || "db"),
          unitNet,
          vatRate,
          netAmount: net,
          vatAmount: vat,
          grossAmount: gross
        }
      });
    }

    await prisma.invoice.update({
      where: { id: params.id },
      data: {
        buyerName: body.buyerName,
        buyerAddress: body.buyerAddress,
        buyerTaxNo: body.buyerTaxNo || null,
        paymentMethod: body.paymentMethod,
        notes: body.notes || null,
        status: body.status,
        issueDate: body.issueDate ? new Date(body.issueDate) : undefined,
        performanceDate: body.performanceDate ? new Date(body.performanceDate) : (body.performanceDate === null ? null : undefined),
        dueDate: body.dueDate ? new Date(body.dueDate) : (body.dueDate === null ? null : undefined),
        vatRate: body.vatRate ?? undefined,
        netTotal,
        vatTotal,
        grossTotal
      }
    });

    const full = await prisma.invoice.findUnique({ where: { id: params.id }, include: { items: true } });
    return NextResponse.json(full);
  }

  const updated = await prisma.invoice.update({
    where: { id: params.id },
    data: {
      ...body,
      issueDate: body.issueDate ? new Date(body.issueDate) : undefined,
      performanceDate: body.performanceDate ? new Date(body.performanceDate) : undefined,
      dueDate: body.dueDate ? new Date(body.dueDate) : undefined
    }
  });
  const full = await prisma.invoice.findUnique({ where: { id: updated.id }, include: { items: true } });
  return NextResponse.json(full);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  await prisma.invoiceItem.deleteMany({ where: { invoiceId: params.id } });
  await prisma.invoice.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
