"use client";

import { useEffect, useMemo, useState } from "react";
import type { Project } from "../types/project";

type Scope = "project" | "company" | "employee";

type Doc = {
  id: string;
  scope: Scope;
  projectId: string | null;
  type: string;
  subType?: string | null;
  employeeName?: string | null;
  filename: string;
  path: string;
  createdAt: string;
};

const scopeTabs: { id: Scope; name: string }[] = [
  { id: "project", name: "Projekt dokumentumok" },
  { id: "company", name: "Céges dokumentumok" },
  { id: "employee", name: "Alkalmazotti dokumentumok" }
];

const projectTypeOptions = [
  { id: "offer_pdf", name: "Ajánlat (PDF)" },
  { id: "signed_offer", name: "Ajánlat aláírva" },
  { id: "contract", name: "Szerződés" },
  { id: "acceptance_tig", name: "TIG / átadás-átvétel" },
  { id: "invoice", name: "Számla" },
  { id: "meeting_minutes", name: "Meeting jegyzőkönyv" },
  { id: "general", name: "Egyéb projekt doksi" }
];

const companySubcats = [
  { id: "cegiratok", name: "Cég alapiratok" },
  { id: "szamvitel", name: "Számvitel / pénzügy" },
  { id: "szabalyzatok", name: "Belső szabályzatok" },
  { id: "adatvedelem", name: "Adatvédelem / GDPR" },
  { id: "szerzodes_sablon", name: "Szerződés sablonok / ÁSZF" },
  { id: "biztositas", name: "Biztosítások / engedélyek" },
  { id: "egyeb", name: "Egyéb" }
];

const employeeSubcats = [
  { id: "munkaszerzodes", name: "Munkaszerződés / módosítás" },
  { id: "jelenleti_iv", name: "Jelenléti ív / munkaidő" },
  { id: "szabadsag", name: "Szabadság / távollét" },
  { id: "ber", name: "Bér (bérjegyzék, elszámolás)" },
  { id: "adatkezeles", name: "Adatkezelési dokumentumok" },
  { id: "munkavedelmi", name: "Munkavédelem / oktatás" },
  { id: "egyeb", name: "Egyéb" }
];

export default function DocumentsPageClient() {
  const [scope, setScope] = useState<Scope>("project");

  const [projects, setProjects] = useState<Project[]>([]);
  const [docs, setDocs] = useState<Doc[]>([]);

  // filters
  const [projectId, setProjectId] = useState<string>("");
  const [projectType, setProjectType] = useState<string>("offer_pdf");
  const [companySub, setCompanySub] = useState<string>("cegiratok");
  const [employeeName, setEmployeeName] = useState<string>("");
  const [employeeSub, setEmployeeSub] = useState<string>("munkaszerzodes");

  // free search
  const [qAll, setQAll] = useState<string>("");

  // upload
  const [file, setFile] = useState<File | null>(null);
  const [msg, setMsg] = useState<string>("");

  const load = async () => {
    const [pRes, dRes] = await Promise.all([fetch("/api/projects"), fetch(`/api/documents?scope=${scope}`)]);
    setProjects(await pRes.json());
    setDocs(await dRes.json());
  };

  useEffect(() => { load(); }, [scope]);

  const baseFiltered = useMemo(() => {
    let arr = docs;
    if (scope === "project") {
      if (projectId) arr = arr.filter((d) => d.projectId === projectId);
      if (projectType) arr = arr.filter((d) => d.type === projectType || (projectType === "general" && d.type === "general"));
    }
    if (scope === "company") {
      if (companySub) arr = arr.filter((d) => (d.subType || "") === companySub);
    }
    if (scope === "employee") {
      if (employeeName.trim()) {
        const q = employeeName.trim().toLowerCase();
        arr = arr.filter((d) => (d.employeeName || "").toLowerCase().includes(q));
      }
      if (employeeSub) arr = arr.filter((d) => (d.subType || "") === employeeSub);
    }
    return arr;
  }, [docs, scope, projectId, projectType, companySub, employeeName, employeeSub]);

  const visibleDocs = useMemo(() => {
    const q = qAll.trim().toLowerCase();
    if (!q) return baseFiltered;
    return baseFiltered.filter((d) => {
      const hay = [
        d.filename, d.type, d.subType, d.employeeName, d.projectId, d.scope
      ].filter(Boolean).join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [baseFiltered, qAll]);

  const suggestions = useMemo(() => {
    // top "refine" chips based on current result set
    const mType = new Map<string, number>();
    const mSub = new Map<string, number>();
    const mProj = new Map<string, number>();
    for (const d of visibleDocs) {
      if (d.type) mType.set(d.type, (mType.get(d.type) || 0) + 1);
      if (d.subType) mSub.set(d.subType, (mSub.get(d.subType) || 0) + 1);
      if (d.projectId) mProj.set(d.projectId, (mProj.get(d.projectId) || 0) + 1);
    }
    const top = (m: Map<string, number>) => Array.from(m.entries()).sort((a,b) => b[1]-a[1]).slice(0, 6);
    return { type: top(mType), sub: top(mSub), proj: top(mProj) };
  }, [visibleDocs]);

  const upload = async () => {
    setMsg("");
    if (!file) { setMsg("Válassz fájlt."); return; }

    if (scope === "project" && !projectId) { setMsg("Projekt dokumentumhoz válassz projektet."); return; }
    if (scope === "employee" && !employeeName.trim()) { setMsg("Alkalmazotti doksihoz add meg a nevet."); return; }

    const fd = new FormData();
    fd.set("scope", scope);
    if (projectId) fd.set("projectId", projectId);

    if (scope === "project") {
      fd.set("type", projectType);
    }
    if (scope === "company") {
      fd.set("type", "company");
      fd.set("subType", companySub);
    }
    if (scope === "employee") {
      fd.set("type", "employee");
      fd.set("subType", employeeSub);
      fd.set("employeeName", employeeName.trim());
    }

    fd.set("file", file);

    const res = await fetch("/api/uploads", { method: "POST", body: fd });
    const j = await res.json();
    if (!res.ok) { setMsg(j?.error || "Hiba feltöltéskor."); return; }

    setMsg("Feltöltve: " + j.path);
    setFile(null);
    await load();
  };

  return (
    <div className="card">
      <div className="sectionHeader">
        <div>
          <div className="h1">Dokumentumok</div>
          <div className="muted">Felső szűrés: projekt / cég / alkalmazott. Alatta szabad szöveges keresés és finomítás.</div>
        </div>
        <button className="btn" onClick={load}>Frissítés</button>
      </div>

      <div className="tabsRow">
        {scopeTabs.map((t) => (
          <button key={t.id} className={`tab ${t.id === scope ? "tabActive" : ""}`} onClick={() => { setScope(t.id); setQAll(""); }}>
            {t.name}
          </button>
        ))}
      </div>

      {msg ? <div className="notice">{msg}</div> : null}

      <div className="row" style={{ paddingBottom: 0 }}>
        <div style={{ flex: 1, minWidth: 260 }}>
          <div className="muted" style={{ marginBottom: 6 }}>Keresés (szabad szöveg)</div>
          <input className="input" value={qAll} onChange={(e) => setQAll(e.target.value)} placeholder="pl. Kiss Zsolt, tig, számla, v2, szerződés..." />
        </div>
        {qAll.trim() ? <button className="btn" onClick={() => setQAll("")}>Törlés</button> : null}
      </div>

      {qAll.trim() ? (
        <div className="row" style={{ paddingTop: 10 }}>
          {suggestions.proj.length ? (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span className="badge">Projekt szűkítés:</span>
              {suggestions.proj.map(([k, c]) => (
                <button key={k} className="btn" onClick={() => setQAll((prev) => prev ? `${prev} ${k}` : k)}>{k} ({c})</button>
              ))}
            </div>
          ) : null}
          {suggestions.type.length ? (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span className="badge">Típus szűkítés:</span>
              {suggestions.type.map(([k, c]) => (
                <button key={k} className="btn" onClick={() => setQAll((prev) => prev ? `${prev} ${k}` : k)}>{k} ({c})</button>
              ))}
            </div>
          ) : null}
          {suggestions.sub.length ? (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span className="badge">Kategória szűkítés:</span>
              {suggestions.sub.map(([k, c]) => (
                <button key={k} className="btn" onClick={() => setQAll((prev) => prev ? `${prev} ${k}` : k)}>{k} ({c})</button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="row" style={{ alignItems: "flex-end" }}>
        {scope === "project" ? (
          <>
            <div style={{ flex: 1, minWidth: 260 }}>
              <div className="muted" style={{ marginBottom: 6 }}>Projekt</div>
              <select className="input" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                <option value="">(Válassz projektet)</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.id} – {p.name}</option>)}
              </select>
            </div>
            <div style={{ width: 280 }}>
              <div className="muted" style={{ marginBottom: 6 }}>Doksi típus</div>
              <select className="input" value={projectType} onChange={(e) => setProjectType(e.target.value)}>
                {projectTypeOptions.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
          </>
        ) : null}

        {scope === "company" ? (
          <div style={{ width: 420, minWidth: 260 }}>
            <div className="muted" style={{ marginBottom: 6 }}>Kategória</div>
            <select className="input" value={companySub} onChange={(e) => setCompanySub(e.target.value)}>
              {companySubcats.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </div>
        ) : null}

        {scope === "employee" ? (
          <>
            <div style={{ flex: 1, minWidth: 260 }}>
              <div className="muted" style={{ marginBottom: 6 }}>Alkalmazott neve</div>
              <input className="input" value={employeeName} onChange={(e) => setEmployeeName(e.target.value)} placeholder="pl. Kovács Béla" />
            </div>
            <div style={{ width: 360 }}>
              <div className="muted" style={{ marginBottom: 6 }}>Kategória</div>
              <select className="input" value={employeeSub} onChange={(e) => setEmployeeSub(e.target.value)}>
                {employeeSubcats.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
          </>
        ) : null}

        <div style={{ flex: 1, minWidth: 260 }}>
          <div className="muted" style={{ marginBottom: 6 }}>Fájl</div>
          <input className="input" type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </div>

        <button className="btn btnPrimary" onClick={upload}>Feltöltés</button>
      </div>

      <div className="tableWrap">
        <table className="table" style={{ minWidth: 1100 }}>
          <thead>
            <tr>
              <th>Scope</th>
              <th>Projekt</th>
              <th>Kategória</th>
              <th>Alkalmazott</th>
              <th>Fájl</th>
              <th>Dátum</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {visibleDocs.map((d) => (
              <tr key={d.id}>
                <td><span className="badge">{d.scope}</span></td>
                <td>{d.projectId ? <span className="badge">{d.projectId}</span> : "-"}</td>
                <td>{d.subType || d.type}</td>
                <td>{d.employeeName || "-"}</td>
                <td style={{ fontWeight: 800 }}>{d.filename}</td>
                <td>{new Date(d.createdAt).toLocaleString("hu-HU")}</td>
                <td style={{ textAlign: "right" }}><a className="btn" href={d.path} target="_blank" rel="noreferrer">Megnyitás</a></td>
              </tr>
            ))}
            {visibleDocs.length === 0 ? <tr><td colSpan={7} className="muted" style={{ padding: 14 }}>Nincs dokumentum.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
