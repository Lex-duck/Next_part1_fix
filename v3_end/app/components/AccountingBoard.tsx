"use client";

import { useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";

function tabBtn(active: boolean) {
  return active ? "btn btnPrimary" : "btn";
}

export default function AccountingBoard() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"overview" | "exports" | "nav">("overview");
  const [companyId, setCompanyId] = useState<string>("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    setCompanyId(user?.activeCompany?.id || "");
  }, [user?.activeCompany?.id]);

  if (!user) return null;

  const companies = user.accessibleCompanies || [];
  const isAllowed = user.role === "admin" || user.role === "accountant";
  if (!isAllowed) {
    return <div className="card"><div className="notice">Nincs jogosultság a Könyvelő nézethez.</div></div>;
  }

  const setActive = async (id: string) => {
    setMsg("");
    const res = await fetch("/api/company/active", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ companyId: id }) });
    const j = await res.json().catch(()=>null);
    if (!res.ok) { setMsg(j?.error || "Nem sikerült a cégváltás."); return; }
    location.reload();
  };

  return (
    <div className="card">
      <div className="sectionHeader">
        <div>
          <div className="h1">Könyvelő</div>
          <div className="muted">Cégszintű rálátás, exportok és kontrollok. (Beküldés NAV-ra: következő iteráció.)</div>
        </div>
        <div className="row" style={{ padding: 0, gap: 8 }}>
          <button className={tabBtn(tab==="overview")} onClick={() => setTab("overview")}>Áttekintés</button>
          <button className={tabBtn(tab==="exports")} onClick={() => setTab("exports")}>Exportok</button>
          <button className={tabBtn(tab==="nav")} onClick={() => setTab("nav")}>NAV</button>
        </div>
      </div>

      {msg ? <div className="notice">{msg}</div> : null}

      <div className="row" style={{ padding: 0, alignItems:"flex-end" }}>
        <div style={{ flex: 1, minWidth: 240 }}>
          <div className="muted" style={{ marginBottom: 6 }}>Aktív cég</div>
          <select className="input" value={companyId} onChange={(e) => { setCompanyId(e.target.value); setActive(e.target.value); }}>
            {companies.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {tab === "overview" ? (
        <div className="notice" style={{ marginTop: 12 }}>
          Itt lesznek: havi forgalom, fizetetlen számlák, áfa összesítés, kintlévőség. (Következő csomag.)
        </div>
      ) : null}

      {tab === "exports" ? (
        <div className="notice" style={{ marginTop: 12 }}>
          Exportok (következő csomag): Számlák CSV, ÁFA lista CSV, Pénzforgalom CSV.
        </div>
      ) : null}

      {tab === "nav" ? (
        <div className="notice" style={{ marginTop: 12 }}>
          NAV panel (következő csomag): beküldési státuszok, hibák, újraküldés queue.
        </div>
      ) : null}
    </div>
  );
}
