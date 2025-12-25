"use client";

import { useEffect } from "react";

export default function ModalShell({ open, title, children, onClose }: any) {
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
        <div style={header}>
          <div style={{ fontWeight: 800 }}>{title}</div>
          <button className="btn" onClick={onClose}>Bezárás</button>
        </div>
        {children}
      </div>
    </div>
  );
}

const overlay: React.CSSProperties = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,.55)",
  display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 2000
};
const modal: React.CSSProperties = {
  width: "min(980px, 100%)",
  maxHeight: "85vh",
  overflow: "auto",
  background: "rgba(18,26,39,.97)",
  border: "1px solid rgba(255,255,255,.10)",
  borderRadius: 16,
  boxShadow: "0 18px 50px rgba(0,0,0,.55)",
  color: "#e8eefc",
  padding: 14
};
const header: React.CSSProperties = {
  display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 10
};
