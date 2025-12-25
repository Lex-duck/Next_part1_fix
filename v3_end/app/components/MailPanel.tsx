"use client";

export default function MailPanel() {
  return (
    <div style={{ width: "100%" }}>
      <div className="notice">
        UI scaffold. Éles (Outlook-szerű) működéshez hitelesítés + levelező integráció kell (Microsoft Graph / IMAP/SMTP).
      </div>
      <div className="card" style={{ width: "100%", padding: 14, background: "rgba(255,255,255,.02)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 12 }}>
          <div style={{ border: "1px solid rgba(255,255,255,.08)", borderRadius: 14, padding: 12 }}>
            <div style={{ fontWeight: 800, marginBottom: 8 }}>Mappák</div>
            <div className="muted">Beérkezett</div>
            <div className="muted">Elküldött</div>
            <div className="muted">Piszkozat</div>
            <div className="muted">Archivált</div>
          </div>
          <div style={{ border: "1px solid rgba(255,255,255,.08)", borderRadius: 14, padding: 12 }}>
            <div style={{ fontWeight: 800, marginBottom: 8 }}>Levelek</div>
            <div className="muted">Itt jelenik meg az e-mail lista és előnézet (integráció után).</div>
          </div>
        </div>
      </div>
    </div>
  );
}
