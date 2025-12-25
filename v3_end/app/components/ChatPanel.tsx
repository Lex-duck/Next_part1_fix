"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Employee = { id: string; name: string; role: string };
type Room = { id: string; name: string; scope: string };
type Msg = { id: string; roomId: string; text: string; createdAt: string; sender: { id: string; name: string; role: string } };

function roleBadge(role: string) {
  if (role === "admin") return "Admin";
  if (role === "iroda") return "Iroda";
  if (role === "terep") return "Terep";
  return role;
}

export default function ChatPanel() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomId, setRoomId] = useState<string>("");
  const [meId, setMeId] = useState<string>(() => (typeof window !== "undefined" ? localStorage.getItem("chat_meId") || "" : ""));
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [hint, setHint] = useState("");

  const lastTsRef = useRef<string>("");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const loadBasics = async () => {
    const [eRes, rRes] = await Promise.all([fetch("/api/employees"), fetch("/api/chat/rooms")]);
    const e = await eRes.json();
    const r = await rRes.json();
    setEmployees(e);
    setRooms(r);
    if (!roomId && r?.[0]?.id) setRoomId(r[0].id);
    if (!meId && e?.[0]?.id) {
      setMeId(e[0].id);
      localStorage.setItem("chat_meId", e[0].id);
    }
  };

  const loadMessages = async (fresh = false) => {
    if (!roomId) return;
    const after = !fresh && lastTsRef.current ? `&after=${encodeURIComponent(lastTsRef.current)}` : "";
    const res = await fetch(`/api/chat/messages?roomId=${encodeURIComponent(roomId)}${after}`);
    const data: Msg[] = await res.json();
    if (!Array.isArray(data)) return;

    if (fresh) setMsgs(data);
    else if (data.length) setMsgs((prev) => [...prev, ...data]);

    const last = data[data.length - 1];
    if (last) lastTsRef.current = last.createdAt;
  };

  useEffect(() => {
    loadBasics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!roomId) return;
    setMsgs([]);
    lastTsRef.current = "";
    loadMessages(true);

    const t = setInterval(() => loadMessages(false), 1500); // polling; later: websocket
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [msgs.length]);

  const me = useMemo(() => employees.find((e) => e.id === meId) || null, [employees, meId]);

  const send = async () => {
    const t = text.trim();
    if (!t || !roomId || !meId) return;
    setHint("");
    setText("");
    const res = await fetch("/api/chat/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId, senderId: meId, text: t })
    });
    if (!res.ok) {
      setHint("Nem sikerült elküldeni.");
      setText(t);
      return;
    }
    const j = await res.json();
    setMsgs((prev) => [...prev, j]);
    lastTsRef.current = j.createdAt;
  };

  return (
    <div style={{ width: "100%" }}>
      <div className="notice">
        Messenger jellegű céges chat (iroda ↔ terep). DB + polling (1.5s). Élesben: auth + WebSocket.
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 12, width: "100%" }}>
        <div style={{ border: "1px solid rgba(255,255,255,.08)", borderRadius: 16, padding: 12 }}>
          <div style={{ fontWeight: 900, marginBottom: 10 }}>Szobák</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {rooms.map((r) => (
              <button
                key={r.id}
                className={`btn ${r.id === roomId ? "btnPrimary" : ""}`}
                style={{ justifyContent: "space-between" }}
                onClick={() => setRoomId(r.id)}
              >
                <span>{r.name}</span>
                <span className="badge">{r.scope}</span>
              </button>
            ))}
          </div>

          <div style={{ height: 12 }} />

          <div style={{ fontWeight: 900, marginBottom: 8 }}>Te vagy</div>
          <select className="input" value={meId} onChange={(e) => { setMeId(e.target.value); localStorage.setItem("chat_meId", e.target.value); }}>
            {employees.map((e) => <option key={e.id} value={e.id}>{e.name} ({roleBadge(e.role)})</option>)}
          </select>

          <div style={{ height: 12 }} />

          <div style={{ fontWeight: 900, marginBottom: 8 }}>Emberek</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 260, overflow: "auto" }}>
            {employees.map((e) => (
              <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 12, border: "1px solid rgba(255,255,255,.08)", background: "rgba(255,255,255,.02)" }}>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontWeight: 800 }}>{e.name}</span>
                  <span className="muted" style={{ fontSize: 12 }}>{roleBadge(e.role)}</span>
                </div>
                <span className="badge">●</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ border: "1px solid rgba(255,255,255,.08)", borderRadius: 16, padding: 12, display: "flex", flexDirection: "column", minHeight: 520 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontWeight: 900 }}>Beszélgetés</div>
              <div className="muted">{rooms.find((r) => r.id === roomId)?.name || "-"}</div>
            </div>
            <button className="btn" onClick={() => loadMessages(true)}>Frissítés</button>
          </div>

          <div ref={scrollRef} style={{ marginTop: 12, flex: 1, overflow: "auto", display: "flex", flexDirection: "column", gap: 10, paddingRight: 6 }}>
            {msgs.map((m) => {
              const mine = m.sender.id === meId;
              return (
                <div key={m.id} style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start" }}>
                  <div style={{
                    maxWidth: "72%",
                    border: "1px solid rgba(255,255,255,.12)",
                    background: mine ? "rgba(79,134,255,.18)" : "rgba(255,255,255,.05)",
                    padding: "10px 12px",
                    borderRadius: 16
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 900 }}>{m.sender.name} <span className="muted" style={{ fontWeight: 600 }}>({roleBadge(m.sender.role)})</span></span>
                      <span className="muted" style={{ fontSize: 11 }}>{new Date(m.createdAt).toLocaleString("hu-HU")}</span>
                    </div>
                    <div style={{ fontSize: 13, whiteSpace: "pre-wrap" }}>{m.text}</div>
                  </div>
                </div>
              );
            })}
            {msgs.length === 0 ? <div className="muted">Nincs üzenet.</div> : null}
          </div>

          {hint ? <div className="notice" style={{ marginTop: 10 }}>{hint}</div> : null}

          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <textarea className="input" rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder="Írj… pl. Mikorra várhatlak vissza? A főni keres." />
            <button className="btn btnPrimary" onClick={send} disabled={!me || !roomId}>Küldés</button>
          </div>
        </div>
      </div>
    </div>
  );
}
