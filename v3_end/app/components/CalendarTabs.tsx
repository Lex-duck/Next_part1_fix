"use client";

import { useMemo, useState } from "react";
import Calendar from "./Calendar";
import { defaultCalendars } from "../data/defaultCalendars";

type Tab = { id: string; name: string };

function slugifyHu(name: string) {
  return name.trim().toLowerCase()
    .replace(/[áàâä]/g, "a").replace(/[éèêë]/g, "e").replace(/[íìîï]/g, "i")
    .replace(/[óòôöő]/g, "o").replace(/[úùûüű]/g, "u")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export default function CalendarTabs() {
  const [tabs, setTabs] = useState<Tab[]>(defaultCalendars as any);
  const [active, setActive] = useState<string>(tabs[0]?.id ?? "sajat");
  const activeName = useMemo(() => tabs.find((t) => t.id === active)?.name ?? "", [tabs, active]);

  const addTab = () => {
    const name = prompt("Új fül neve (pl. Etetés nyomonkövetése):");
    if (!name) return;
    const id = slugifyHu(name);
    if (!id) return;
    if (tabs.some((t) => t.id === id)) { alert("Már létezik ilyen fül."); return; }
    setTabs((prev) => [...prev, { id, name }]); setActive(id);
  };

  return (
    <div className="card">
      <div className="sectionHeader">
        <div>
          <div className="h1">Naptár</div>
          <div className="muted">Aktív naptár: {activeName}</div>
        </div>
      </div>

      <div className="tabsRow">
        {tabs.map((t) => (
          <button key={t.id} className={`tab ${t.id === active ? "tabActive" : ""}`} onClick={() => setActive(t.id)}>
            {t.name}
          </button>
        ))}
        <button className="tab tabAdd" onClick={addTab}>+ Új fül</button>
      </div>

      <Calendar calendarId={active} />
    </div>
  );
}
