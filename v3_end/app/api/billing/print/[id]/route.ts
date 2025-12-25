import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

function huf(n: number) {
  return (n || 0).toLocaleString("hu-HU");
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const inv = await prisma.invoice.findUnique({ where: { id: params.id }, include: { items: true } });
  if (!inv) return new NextResponse("Not found", { status: 404 });

  const html = `<!doctype html>
<html lang="hu">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${inv.number}</title>
<style>
  body{ font-family: Arial, sans-serif; padding: 24px; color:#111; }
  .row{ display:flex; justify-content:space-between; gap:16px; }
  .box{ border:1px solid #ddd; padding:12px; border-radius:8px; }
  h1{ margin:0 0 8px 0; font-size:20px; }
  .muted{ color:#555; font-size:12px; }
  table{ width:100%; border-collapse:collapse; margin-top:16px; }
  th,td{ border-bottom:1px solid #eee; padding:8px 6px; text-align:left; font-size:12px; }
  th{ background:#fafafa; }
  .right{text-align:right;}
  .total{ margin-top:16px; width:320px; margin-left:auto; }
  .total td{ border:none; }
  @media print { .noprint{ display:none; } body{ padding:0; } }
</style>
</head>
<body>
<div class="noprint" style="display:flex;justify-content:flex-end;margin-bottom:10px;">
  <button onclick="window.print()">Nyomtatás / PDF</button>
</div>

<div class="row">
  <div class="box" style="flex:1;">
    <h1>Számla: ${inv.number}</h1>
    <div class="muted">Kelte: ${new Date(inv.issueDate).toLocaleDateString("hu-HU")} | Fizetési mód: ${inv.paymentMethod} | Státusz: ${inv.status}</div>
    <div class="muted">Teljesítés: ${inv.performanceDate ? new Date(inv.performanceDate).toLocaleDateString("hu-HU") : "-"} | Határidő: ${inv.dueDate ? new Date(inv.dueDate).toLocaleDateString("hu-HU") : "-"}</div>
  </div>
</div>

<div class="row" style="margin-top:12px;">
  <div class="box" style="flex:1;">
    <div style="font-weight:700;margin-bottom:6px;">Eladó</div>
    <div>${inv.issuerName}</div>
    <div class="muted">${inv.issuerAddress}</div>
    <div class="muted">Adószám: ${inv.issuerTaxNo || "-"}</div>
    <div class="muted">Bankszámla: ${inv.issuerBank || "-"}</div>
  </div>
  <div class="box" style="flex:1;">
    <div style="font-weight:700;margin-bottom:6px;">Vevő</div>
    <div>${inv.buyerName}</div>
    <div class="muted">${inv.buyerAddress}</div>
    <div class="muted">Adószám: ${inv.buyerTaxNo || "-"}</div>
  </div>
</div>

<table>
  <thead>
    <tr>
      <th>Tétel</th><th class="right">Menny.</th><th>Egys.</th><th class="right">Nettó egységár</th><th class="right">ÁFA %</th><th class="right">Nettó</th><th class="right">ÁFA</th><th class="right">Bruttó</th>
    </tr>
  </thead>
  <tbody>
    ${inv.items.map(i => `<tr>
      <td>${i.name}</td>
      <td class="right">${i.quantity}</td>
      <td>${i.unit}</td>
      <td class="right">${huf(i.unitNet)} Ft</td>
      <td class="right">${i.vatRate}</td>
      <td class="right">${huf(i.netAmount)} Ft</td>
      <td class="right">${huf(i.vatAmount)} Ft</td>
      <td class="right">${huf(i.grossAmount)} Ft</td>
    </tr>`).join("")}
  </tbody>
</table>

<table class="total">
  <tr><td class="right">Nettó összesen:</td><td class="right"><b>${huf(inv.netTotal)} Ft</b></td></tr>
  <tr><td class="right">ÁFA összesen:</td><td class="right"><b>${huf(inv.vatTotal)} Ft</b></td></tr>
  <tr><td class="right">Bruttó összesen:</td><td class="right"><b>${huf(inv.grossTotal)} Ft</b></td></tr>
</table>

${inv.notes ? `<div class="box" style="margin-top:12px;"><b>Megjegyzés</b><div class="muted" style="margin-top:6px;">${inv.notes}</div></div>` : ""}

</body></html>`;

  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
