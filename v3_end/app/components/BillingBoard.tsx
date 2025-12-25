"use client";

import { useEffect, useMemo, useState } from "react";
import ModalShell from "./ModalShell";

type Invoice = any;

function tabBtn(active: boolean) {
  return active ? "btn btnPrimary" : "btn";
}

function huf(n: number) {
  return (n || 0).toLocaleString("hu-HU");
}

export default function BillingBoard() {
  const [tab, setTab] = useState<"invoices" | "settings">("invoices");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [msg, setMsg] = useState("");

  const [openNew, setOpenNew] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const load = async () => {
    const [iRes, pRes] = await Promise.all([
      fetch(`/api/billing/invoices?q=${encodeURIComponent(q)}&status=${encodeURIComponent(status)}`),
      fetch(`/api/billing/profile`)
    ]);
    setInvoices(await iRes.json());
    setProfile(await pRes.json());
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => load(), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, status]);

  const totals = useMemo(() => {
    let net = 0,
      vat = 0,
      gross = 0;
    for (const x of invoices) {
      net += x.netTotal || 0;
      vat += x.vatTotal || 0;
      gross += x.grossTotal || 0;
    }
    return { net, vat, gross };
  }, [invoices]);

  const createInvoice = async (payload: any) => {
    setMsg("");
    const res = await fetch("/api/billing/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const txt = await res.text();
    const j = txt ? JSON.parse(txt) : null;
    if (!res.ok) {
      setMsg(j?.error || "Nem sikerült a számla létrehozása.");
      return;
    }
    setOpenNew(false);
    await load();
  };

  const openInvoice = async (id: string) => {
    const res = await fetch(`/api/billing/invoices/${id}`);
    const j = await res.json();
    setEditing(j);
    setOpenEdit(true);
  };

  const saveInvoice = async (payload: any) => {
    if (!editing?.id) return;
    setMsg("");
    const res = await fetch(`/api/billing/invoices/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      setMsg("Mentés sikertelen.");
      return;
    }
    const j = await res.json();
    setEditing(j);
    await load();
  };

  const delInvoice = async (id: string) => {
    if (!confirm("Biztosan törlöd?")) return;
    await fetch(`/api/billing/invoices/${id}`, { method: "DELETE" });
    await load();
  };

  const saveProfile = async (p: any) => {
    setMsg("");
    const res = await fetch("/api/billing/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(p)
    });
    if (!res.ok) {
      setMsg("Beállítás mentése sikertelen.");
      return;
    }
    setProfile(await res.json());
    setMsg("Mentve.");
  };

  return (
    <div className="card">
      <div className="sectionHeader">
        <div>
          <div className="h1">Számlázás</div>
          <div className="muted">
            Kimenő számlák + beállítások. NAV Online Számla beküldés: következő iteráció (helye előkészítve).
          </div>
        </div>
        <div className="row" style={{ padding: 0, gap: 8 }}>
          <button className={tabBtn(tab === "invoices")} onClick={() => setTab("invoices")}>
            Számlák
          </button>
          <button className={tabBtn(tab === "settings")} onClick={() => setTab("settings")}>
            Beállítások
          </button>
        </div>
      </div>

      {msg ? <div className="notice">{msg}</div> : null}

      {tab === "invoices" ? (
        <>
          <div className="row" style={{ padding: 0, alignItems: "flex-end" }}>
            <div style={{ flex: 1, minWidth: 220 }}>
              <div className="muted" style={{ marginBottom: 6 }}>
                Gyors keresés (számlaszám, vevő név, adószám)
              </div>
              <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="pl. SZ-2025-000001 vagy Alfa" />
            </div>
            <div style={{ width: 220 }}>
              <div className="muted" style={{ marginBottom: 6 }}>
                Státusz
              </div>
              <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">(összes)</option>
                <option value="draft">Piszkozat</option>
                <option value="issued">Kiállítva</option>
                <option value="sent">Kiküldve</option>
                <option value="paid">Fizetve</option>
                <option value="cancelled">Sztornó / törölt</option>
              </select>
            </div>
            <button className="btn btnPrimary" onClick={() => setOpenNew(true)}>
              Új számla
            </button>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
            <div className="badge">Összes nettó: {huf(totals.net)} Ft</div>
            <div className="badge">Összes áfa: {huf(totals.vat)} Ft</div>
            <div className="badge">Összes bruttó: {huf(totals.gross)} Ft</div>
          </div>

          <div className="tableWrap" style={{ padding: 0, marginTop: 10 }}>
            <table className="table" style={{ minWidth: 1100 }}>
              <thead>
                <tr>
                  <th>Számlaszám</th>
                  <th>Kelte</th>
                  <th>Vevő</th>
                  <th>Státusz</th>
                  <th className="right">Bruttó</th>
                  <th>NAV</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((x) => (
                  <tr key={x.id}>
                    <td style={{ fontWeight: 900 }}>{x.number}</td>
                    <td>{new Date(x.issueDate).toLocaleDateString("hu-HU")}</td>
                    <td>{x.buyerName}</td>
                    <td>
                      <span className="badge">{x.status}</span>
                    </td>
                    <td className="right" style={{ fontWeight: 900 }}>
                      {huf(x.grossTotal)} Ft
                    </td>
                    <td>
                      <span className="badge">{x.navStatus}</span>
                    </td>
                    <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                      <button className="btn" onClick={() => openInvoice(x.id)}>
                        Részletek
                      </button>{" "}
                      <a className="btn" href={`/api/billing/print/${x.id}`} target="_blank" rel="noreferrer">
                        Nyomtatás/PDF
                      </a>{" "}
                      <button className="btn" onClick={() => delInvoice(x.id)}>
                        Törlés
                      </button>
                    </td>
                  </tr>
                ))}
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="muted" style={{ padding: 14 }}>
                      Nincs találat.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <NewInvoiceModal open={openNew} onClose={() => setOpenNew(false)} onCreate={createInvoice} profile={profile} />
          <EditInvoiceModal open={openEdit} onClose={() => setOpenEdit(false)} invoice={editing} onSave={saveInvoice} />
        </>
      ) : (
        <BillingSettings profile={profile} onSave={saveProfile} />
      )}
    </div>
  );
}

function BillingSettings({ profile, onSave }: { profile: any; onSave: (p: any) => void }) {
  const [p, setP] = useState<any>(profile || null);
  useEffect(() => {
    setP(profile || null);
  }, [profile]);

  if (!p) return <div className="notice">Betöltés...</div>;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
      <div style={{ border: "1px solid rgba(255,255,255,.08)", borderRadius: 16, padding: 12 }}>
        <div style={{ fontWeight: 900, marginBottom: 8 }}>Kibocsátó adatai</div>
        <div className="muted" style={{ marginBottom: 6 }}>
          Cégnév
        </div>
        <input className="input" value={p.companyName || ""} onChange={(e) => setP((x: any) => ({ ...x, companyName: e.target.value }))} />
        <div className="muted" style={{ margin: "10px 0 6px" }}>
          Cím
        </div>
        <input className="input" value={p.address || ""} onChange={(e) => setP((x: any) => ({ ...x, address: e.target.value }))} />
        <div className="muted" style={{ margin: "10px 0 6px" }}>
          Adószám
        </div>
        <input className="input" value={p.taxNo || ""} onChange={(e) => setP((x: any) => ({ ...x, taxNo: e.target.value }))} />
        <div className="muted" style={{ margin: "10px 0 6px" }}>
          Bankszámla
        </div>
        <input className="input" value={p.bankAccount || ""} onChange={(e) => setP((x: any) => ({ ...x, bankAccount: e.target.value }))} />
        <div className="muted" style={{ margin: "10px 0 6px" }}>
          E-mail / Telefon
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <input className="input" value={p.email || ""} onChange={(e) => setP((x: any) => ({ ...x, email: e.target.value }))} placeholder="email" />
          <input className="input" value={p.phone || ""} onChange={(e) => setP((x: any) => ({ ...x, phone: e.target.value }))} placeholder="telefon" />
        </div>
      </div>

      <div style={{ border: "1px solid rgba(255,255,255,.08)", borderRadius: 16, padding: 12 }}>
        <div style={{ fontWeight: 900, marginBottom: 8 }}>Sorszám / ÁFA</div>
        <div className="muted" style={{ marginBottom: 6 }}>
          Számla prefix
        </div>
        <input className="input" value={p.prefix || ""} onChange={(e) => setP((x: any) => ({ ...x, prefix: e.target.value }))} placeholder="pl. SZ" />
        <div className="muted" style={{ margin: "10px 0 6px" }}>
          Következő sorszám
        </div>
        <input className="input" type="number" value={p.nextInvoiceSeq ?? 1} onChange={(e) => setP((x: any) => ({ ...x, nextInvoiceSeq: Number(e.target.value) }))} />
        <div className="muted" style={{ margin: "10px 0 6px" }}>
          Alapértelmezett ÁFA %
        </div>
        <input className="input" type="number" value={p.defaultVatRate ?? 27} onChange={(e) => setP((x: any) => ({ ...x, defaultVatRate: Number(e.target.value) }))} />
        <div className="notice" style={{ marginTop: 12 }}>
          NAV Online Számla: a beküldéshez később API kulcs + technikai felhasználó + XML generálás kell. A modellben a navStatus/navLastError mezők már előkészítettek.
        </div>
      </div>

      <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end" }}>
        <button className="btn btnPrimary" onClick={() => onSave(p)}>
          Mentés
        </button>
      </div>
    </div>
  );
}

function NewInvoiceModal({ open, onClose, onCreate, profile }: any) {
  const [buyerName, setBuyerName] = useState("");
  const [buyerAddress, setBuyerAddress] = useState("");
  const [buyerTaxNo, setBuyerTaxNo] = useState("");
  const [vatRate, setVatRate] = useState<number>(27);
  const [issueDate, setIssueDate] = useState("");
  const [performanceDate, setPerformanceDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("átutalás");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<any[]>([{ name: "", quantity: 1, unit: "db", unitNet: 0, vatRate: 27 }]);

  useEffect(() => {
    const vr = profile?.defaultVatRate ?? 27;
    setVatRate(vr);
    setItems([{ name: "", quantity: 1, unit: "db", unitNet: 0, vatRate: vr }]);
    setBuyerName("");
    setBuyerAddress("");
    setBuyerTaxNo("");
    setIssueDate("");
    setPerformanceDate("");
    setDueDate("");
    setPaymentMethod("átutalás");
    setNotes("");
  }, [profile, open]);

  const addItem = () => {
    setItems((x) => [...x, { name: "", quantity: 1, unit: "db", unitNet: 0, vatRate }]);
  };

  const rmItem = (idx: number) => {
    setItems((x) => x.filter((_, i) => i !== idx));
  };

  const create = () => {
    if (!buyerName.trim() || !buyerAddress.trim()) return;
    onCreate({
      buyerName: buyerName.trim(),
      buyerAddress: buyerAddress.trim(),
      buyerTaxNo: buyerTaxNo.trim(),
      vatRate,
      issueDate,
      performanceDate,
      dueDate,
      paymentMethod,
      notes,
      items: (items || []).filter((i) => String(i.name || "").trim().length > 0)
    });
  };

  return (
    <ModalShell open={open} title="Új számla" onClose={onClose} wide>
      <div className="grid2">
        <div style={{ gridColumn: "1 / -1" }}>
          <div className="muted" style={{ marginBottom: 6 }}>
            Vevő neve
          </div>
          <input className="input" value={buyerName} onChange={(e) => setBuyerName(e.target.value)} placeholder="pl. Alfa Kft." />
        </div>

        <div style={{ gridColumn: "1 / -1" }}>
          <div className="muted" style={{ marginBottom: 6 }}>
            Vevő címe
          </div>
          <input className="input" value={buyerAddress} onChange={(e) => setBuyerAddress(e.target.value)} placeholder="pl. 1117 Budapest, Példa u. 2." />
        </div>

        <div>
          <div className="muted" style={{ marginBottom: 6 }}>
            Vevő adószám (opcionális)
          </div>
          <input className="input" value={buyerTaxNo} onChange={(e) => setBuyerTaxNo(e.target.value)} placeholder="12345678-1-42" />
        </div>

        <div>
          <div className="muted" style={{ marginBottom: 6 }}>
            ÁFA %
          </div>
          <input className="input" type="number" value={vatRate} onChange={(e) => setVatRate(Number(e.target.value))} />
        </div>

        <div>
          <div className="muted" style={{ marginBottom: 6 }}>
            Kelte
          </div>
          <input className="input" type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
        </div>

        <div>
          <div className="muted" style={{ marginBottom: 6 }}>
            Teljesítés
          </div>
          <input className="input" type="date" value={performanceDate} onChange={(e) => setPerformanceDate(e.target.value)} />
        </div>

        <div>
          <div className="muted" style={{ marginBottom: 6 }}>
            Határidő
          </div>
          <input className="input" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>

        <div>
          <div className="muted" style={{ marginBottom: 6 }}>
            Fizetési mód
          </div>
          <select className="input" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
            <option value="átutalás">Átutalás</option>
            <option value="készpénz">Készpénz</option>
            <option value="bankkártya">Bankkártya</option>
          </select>
        </div>

        <div style={{ gridColumn: "1 / -1" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
            <div style={{ fontWeight: 900 }}>Tételek</div>
            <button className="btn" onClick={addItem}>+ Tétel</button>
          </div>

          <div className="tableWrap" style={{ padding: 0, marginTop: 8 }}>
            <table className="table" style={{ minWidth: 980 }}>
              <thead>
                <tr>
                  <th>Megnevezés</th>
                  <th className="right">Menny</th>
                  <th>Egys</th>
                  <th className="right">Nettó egységár</th>
                  <th className="right">ÁFA %</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, idx) => (
                  <tr key={idx}>
                    <td>
                      <input className="input" value={it.name || ""} onChange={(e) => {
                        const v = e.target.value;
                        setItems((x) => {
                          const a = [...x]; a[idx] = { ...a[idx], name: v }; return a;
                        });
                      }} placeholder="pl. Villanyszerelés" />
                    </td>
                    <td className="right">
                      <input className="input" type="number" value={it.quantity ?? 1} onChange={(e) => {
                        const v = Number(e.target.value);
                        setItems((x) => { const a=[...x]; a[idx]={...a[idx], quantity:v}; return a; });
                      }} style={{ width: 90 }} />
                    </td>
                    <td>
                      <input className="input" value={it.unit || "db"} onChange={(e) => {
                        const v = e.target.value;
                        setItems((x) => { const a=[...x]; a[idx]={...a[idx], unit:v}; return a; });
                      }} style={{ width: 90 }} />
                    </td>
                    <td className="right">
                      <input className="input" type="number" value={it.unitNet ?? 0} onChange={(e) => {
                        const v = Number(e.target.value);
                        setItems((x) => { const a=[...x]; a[idx]={...a[idx], unitNet:v}; return a; });
                      }} style={{ width: 140 }} />
                    </td>
                    <td className="right">
                      <input className="input" type="number" value={it.vatRate ?? vatRate} onChange={(e) => {
                        const v = Number(e.target.value);
                        setItems((x) => { const a=[...x]; a[idx]={...a[idx], vatRate:v}; return a; });
                      }} style={{ width: 90 }} />
                    </td>
                    <td className="right">
                      <button className="btn" onClick={() => rmItem(idx)}>Törlés</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ gridColumn: "1 / -1" }}>
          <div className="muted" style={{ marginBottom: 6 }}>
            Megjegyzés (opcionális)
          </div>
          <textarea className="input" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
        </div>
      </div>

      <div className="modalActions">
        <button className="btn" onClick={onClose}>Mégse</button>
        <button className="btn btnPrimary" onClick={create}>Létrehozás</button>
      </div>
    </ModalShell>
  );
}


function EditInvoiceModal({ open, onClose, invoice, onSave }: any) {
  const [local, setLocal] = useState<any>(invoice || null);
  useEffect(() => {
    setLocal(invoice || null);
  }, [invoice, open]);

  if (!local) return null;

  const addItem = () => {
    setLocal((x: any) => ({
      ...x,
      items: [...(x.items || []), { name: "", quantity: 1, unit: "db", unitNet: 0, vatRate: x.vatRate ?? 27 }]
    }));
  };

  const save = () => {
    onSave({
      buyerName: local.buyerName,
      buyerAddress: local.buyerAddress,
      buyerTaxNo: local.buyerTaxNo,
      paymentMethod: local.paymentMethod,
      notes: local.notes,
      status: local.status,
      issueDate: local.issueDate,
      performanceDate: local.performanceDate,
      dueDate: local.dueDate,
      vatRate: local.vatRate,
      items: local.items || []
    });
  };

  return (
    <ModalShell open={open} title={`Számla: ${local.number}`} onClose={onClose} wide>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div style={{ gridColumn: "1 / -1" }}>
          <div className="muted" style={{ marginBottom: 6 }}>
            Vevő
          </div>
          <input className="input" value={local.buyerName || ""} onChange={(e) => setLocal((x: any) => ({ ...x, buyerName: e.target.value }))} />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <div className="muted" style={{ marginBottom: 6 }}>
            Cím
          </div>
          <input className="input" value={local.buyerAddress || ""} onChange={(e) => setLocal((x: any) => ({ ...x, buyerAddress: e.target.value }))} />
        </div>
        <div>
          <div className="muted" style={{ marginBottom: 6 }}>
            Adószám
          </div>
          <input className="input" value={local.buyerTaxNo || ""} onChange={(e) => setLocal((x: any) => ({ ...x, buyerTaxNo: e.target.value }))} />
        </div>
        <div>
          <div className="muted" style={{ marginBottom: 6 }}>
            Státusz
          </div>
          <select className="input" value={local.status} onChange={(e) => setLocal((x: any) => ({ ...x, status: e.target.value }))}>
            <option value="draft">Piszkozat</option>
            <option value="issued">Kiállítva</option>
            <option value="sent">Kiküldve</option>
            <option value="paid">Fizetve</option>
            <option value="cancelled">Sztornó / törölt</option>
          </select>
        </div>

        <div>
          <div className="muted" style={{ marginBottom: 6 }}>
            Kelte
          </div>
          <input className="input" type="date" value={(local.issueDate || "").slice(0, 10)} onChange={(e) => setLocal((x: any) => ({ ...x, issueDate: e.target.value }))} />
        </div>
        <div>
          <div className="muted" style={{ marginBottom: 6 }}>
            Teljesítés
          </div>
          <input className="input" type="date" value={(local.performanceDate || "").slice(0, 10)} onChange={(e) => setLocal((x: any) => ({ ...x, performanceDate: e.target.value }))} />
        </div>
        <div>
          <div className="muted" style={{ marginBottom: 6 }}>
            Határidő
          </div>
          <input className="input" type="date" value={(local.dueDate || "").slice(0, 10)} onChange={(e) => setLocal((x: any) => ({ ...x, dueDate: e.target.value }))} />
        </div>
        <div>
          <div className="muted" style={{ marginBottom: 6 }}>
            Fizetési mód
          </div>
          <select className="input" value={local.paymentMethod} onChange={(e) => setLocal((x: any) => ({ ...x, paymentMethod: e.target.value }))}>
            <option value="átutalás">Átutalás</option>
            <option value="készpénz">Készpénz</option>
            <option value="bankkártya">Bankkártya</option>
          </select>
        </div>

        <div style={{ gridColumn: "1 / -1" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
            <div style={{ fontWeight: 900 }}>Tételek</div>
            <button className="btn" onClick={addItem}>
              + Tétel
            </button>
          </div>

          <div className="tableWrap" style={{ padding: 0, marginTop: 8 }}>
            <table className="table" style={{ minWidth: 1100 }}>
              <thead>
                <tr>
                  <th>Megnevezés</th>
                  <th className="right">Menny</th>
                  <th>Egys</th>
                  <th className="right">Nettó egységár</th>
                  <th className="right">ÁFA %</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {(local.items || []).map((it: any, idx: number) => (
                  <tr key={idx}>
                    <td>
                      <input
                        className="input"
                        value={it.name || ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          setLocal((x: any) => {
                            const items = [...(x.items || [])];
                            items[idx] = { ...items[idx], name: v };
                            return { ...x, items };
                          });
                        }}
                      />
                    </td>
                    <td className="right">
                      <input
                        className="input"
                        type="number"
                        value={it.quantity ?? 1}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          setLocal((x: any) => {
                            const items = [...(x.items || [])];
                            items[idx] = { ...items[idx], quantity: v };
                            return { ...x, items };
                          });
                        }}
                        style={{ width: 90 }}
                      />
                    </td>
                    <td>
                      <input
                        className="input"
                        value={it.unit || "db"}
                        onChange={(e) => {
                          const v = e.target.value;
                          setLocal((x: any) => {
                            const items = [...(x.items || [])];
                            items[idx] = { ...items[idx], unit: v };
                            return { ...x, items };
                          });
                        }}
                        style={{ width: 90 }}
                      />
                    </td>
                    <td className="right">
                      <input
                        className="input"
                        type="number"
                        value={it.unitNet ?? 0}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          setLocal((x: any) => {
                            const items = [...(x.items || [])];
                            items[idx] = { ...items[idx], unitNet: v };
                            return { ...x, items };
                          });
                        }}
                        style={{ width: 140 }}
                      />
                    </td>
                    <td className="right">
                      <input
                        className="input"
                        type="number"
                        value={it.vatRate ?? (local.vatRate ?? 27)}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          setLocal((x: any) => {
                            const items = [...(x.items || [])];
                            items[idx] = { ...items[idx], vatRate: v };
                            return { ...x, items };
                          });
                        }}
                        style={{ width: 90 }}
                      />
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        className="btn"
                        onClick={() =>
                          setLocal((x: any) => {
                            const items = [...(x.items || [])];
                            items.splice(idx, 1);
                            return { ...x, items };
                          })
                        }
                      >
                        Törlés
                      </button>
                    </td>
                  </tr>
                ))}
                {(local.items || []).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="muted" style={{ padding: 14 }}>
                      Nincs tétel. Adj hozzá legalább egyet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ gridColumn: "1 / -1" }}>
          <div className="muted" style={{ marginBottom: 6 }}>
            Megjegyzés
          </div>
          <textarea className="input" rows={3} value={local.notes || ""} onChange={(e) => setLocal((x: any) => ({ ...x, notes: e.target.value }))} />
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
        <a className="btn" href={`/api/billing/print/${local.id}`} target="_blank" rel="noreferrer">
          Nyomtatás/PDF
        </a>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" onClick={onClose}>
            Bezár
          </button>
          <button className="btn btnPrimary" onClick={save}>
            Mentés
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
