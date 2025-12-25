"use client";

import { useEffect, useMemo, useState } from "react";

type Props = {
  open: boolean;
  title: string;
  initial?: { title?: string; description?: string; start?: string; end?: string };
  canDelete?: boolean;
  onClose: () => void;
  onSave: (data: { title: string; description?: string; start: string; end?: string }) => void;
  onDelete?: () => void;
};

function toLocalInputValue(iso?: string) {
  if (!iso) return "";
  return iso.slice(0, 16);
}

export default function EventModal({ open, title, initial, canDelete, onClose, onSave, onDelete }: Props) {
  const [t, setT] = useState("");
  const [d, setD] = useState("");
  const [s, setS] = useState("");
  const [e, setE] = useState("");

  const initialKey = useMemo(() => JSON.stringify({ open, initial }), [open, initial]);

  useEffect(() => {
    if (!open) return;
    setT(initial?.title ?? "");
    setD(initial?.description ?? "");
    setS(toLocalInputValue(initial?.start) || "");
    setE(toLocalInputValue(initial?.end) || "");
  }, [initialKey, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (ev: KeyboardEvent) => { if (ev.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div style={overlay} onMouseDown={onClose}>
      <div style={modal} onMouseDown={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <div style={{ fontWeight: 800 }}>{title}</div>
          <button className="btn" onClick={onClose}>Bezárás</button>
        </div>

        <div style={field}>
          <div style={label}>Cím *</div>
          <input className="input" value={t} onChange={(ev) => setT(ev.target.value)} placeholder="Példa: Projekt egyeztetés" />
        </div>

        <div style={field}>
          <div style={label}>Leírás</div>
          <textarea className="input" value={d} onChange={(ev) => setD(ev.target.value)} placeholder="Részletek, agenda, linkek..." rows={3} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div style={field}>
            <div style={label}>Kezdés *</div>
            <input className="input" type="datetime-local" value={s} onChange={(ev) => setS(ev.target.value)} />
          </div>
          <div style={field}>
            <div style={label}>Vége</div>
            <input className="input" type="datetime-local" value={e} onChange={(ev) => setE(ev.target.value)} />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
          {canDelete && onDelete ? <button className="btn btnDanger" onClick={onDelete}>Törlés</button> : <span />}
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn" onClick={onClose}>Mégse</button>
            <button className="btn btnPrimary" onClick={() => {
              const titleTrim = t.trim();
              if (!titleTrim || !s) return;
              onSave({ title: titleTrim, description: d.trim() || undefined, start: s, end: e || undefined });
            }}>Mentés</button>
          </div>
        </div>
      </div>
    </div>
  );
}

const overlay: React.CSSProperties = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,.55)",
  display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 1500
};
const modal: React.CSSProperties = {
  width: "min(720px, 100%)",
  background: "rgba(18,26,39,.97)",
  border: "1px solid rgba(255,255,255,.10)",
  borderRadius: 16,
  boxShadow: "0 18px 50px rgba(0,0,0,.55)",
  color: "#e8eefc",
  padding: 14
};
const field: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 };
const label: React.CSSProperties = { fontSize: 12, color: "rgba(232,238,252,.75)" };
