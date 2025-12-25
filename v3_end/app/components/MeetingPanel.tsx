"use client";

import { useEffect, useMemo, useState } from "react";
import ModalShell from "./ModalShell";

type Meeting = {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  roomKey: string;
  provider: string;
};

function jitsiJoinUrl(roomKey: string) {
  return `https://meet.jit.si/${encodeURIComponent(roomKey)}`;
}

export default function MeetingPanel() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [msg, setMsg] = useState("");

  const load = async () => {
    const res = await fetch("/api/meetings");
    setMeetings(await res.json());
  };

  useEffect(() => { load(); }, []);

  const suggestedRoomKey = useMemo(() => {
    const base = (title || "meeting").trim().toLowerCase()
      .replace(/á/g, "a").replace(/é/g, "e").replace(/í/g, "i").replace(/ó/g, "o").replace(/ö|ő/g, "o")
      .replace(/ú/g, "u").replace(/ü|ű/g, "u")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    const salt = new Date().toISOString().slice(0, 10);
    return `${base || "meeting"}-${salt}`;
  }, [title]);

  const create = async () => {
    setMsg("");
    if (!title.trim() || !startsAt || !endsAt) { setMsg("Minden mező kötelező."); return; }
    const res = await fetch("/api/meetings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim(), startsAt, endsAt, roomKey: suggestedRoomKey, provider: "jitsi" })
    });
    if (!res.ok) { setMsg("Nem sikerült létrehozni a meetinget."); return; }
    setOpen(false);
    setTitle("");
    setStartsAt("");
    setEndsAt("");
    await load();
  };

  return (
    <div style={{ width: "100%" }}>
      <div className="notice">
        Meeting: azonnal használható Jitsi linkkel. Később váltható saját Jitsi / Teams / Zoom integrációra.
      </div>

      <div className="row" style={{ padding: 0, alignItems: "flex-end" }}>
        <div style={{ flex: 1, minWidth: 260 }}>
          <div className="muted" style={{ marginBottom: 6 }}>Közelgő meetingek</div>
          <div className="muted">A “Csatlakozás” gomb megnyitja a meetinget böngészőben.</div>
        </div>
        <button className="btn btnPrimary" onClick={() => setOpen(true)}>Meeting létrehozása</button>
      </div>

      <div className="tableWrap" style={{ padding: 0, marginTop: 10 }}>
        <table className="table" style={{ minWidth: 980 }}>
          <thead><tr><th>Cím</th><th>Kezdés</th><th>Vége</th><th>Szolgáltató</th><th></th></tr></thead>
          <tbody>
            {meetings.map((m) => (
              <tr key={m.id}>
                <td style={{ fontWeight: 900 }}>{m.title}</td>
                <td>{new Date(m.startsAt).toLocaleString("hu-HU")}</td>
                <td>{new Date(m.endsAt).toLocaleString("hu-HU")}</td>
                <td><span className="badge">{m.provider}</span></td>
                <td style={{ textAlign: "right" }}>
                  <a className="btn btnPrimary" href={jitsiJoinUrl(m.roomKey)} target="_blank" rel="noreferrer">Csatlakozás</a>
                </td>
              </tr>
            ))}
            {meetings.length === 0 ? <tr><td colSpan={5} className="muted" style={{ padding: 14 }}>Nincs meeting.</td></tr> : null}
          </tbody>
        </table>
      </div>

      <ModalShell open={open} title="Meeting létrehozása" onClose={() => { setOpen(false); setMsg(""); }}>
        {msg ? <div className="notice">{msg}</div> : null}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <div className="muted" style={{ marginBottom: 6 }}>Meeting címe *</div>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="pl. Helyszíni egyeztetés – P-1001" />
          </div>
          <div>
            <div className="muted" style={{ marginBottom: 6 }}>Kezdés *</div>
            <input className="input" type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
          </div>
          <div>
            <div className="muted" style={{ marginBottom: 6 }}>Vége *</div>
            <input className="input" type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <div className="muted">Meeting link (automatikus):</div>
            <div style={{ fontWeight: 800 }}>{jitsiJoinUrl(suggestedRoomKey)}</div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14 }}>
          <button className="btn" onClick={() => setOpen(false)}>Mégse</button>
          <button className="btn btnPrimary" onClick={create}>Létrehozás</button>
        </div>
      </ModalShell>
    </div>
  );
}
