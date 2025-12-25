"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

async function safeJson(res: Response) {
  try {
    const txt = await res.text();
    if (!txt) return null;
    return JSON.parse(txt);
  } catch {
    return null;
  }
}

export default function LoginForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "/";
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setErr("");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      const j: any = await safeJson(res);

      if (!res.ok) {
        setErr(j?.error || `Sikertelen bejelentkezés (HTTP ${res.status}).`);
        return;
      }

      router.push(next);
      router.refresh();
    } catch {
      setErr("Hálózati hiba vagy szerverhiba.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="loginWrap">
      <div className="loginCard">
        <div className="h1">Bejelentkezés</div>
        <div className="muted" style={{ marginTop: 6 }}>
          Demo felhasználók: admin/admin, Kacsa/anyakacsa, NagyKacsa/apakacsa
        </div>

        {err ? (
          <div className="notice" style={{ marginTop: 12, borderColor: "rgba(255,80,80,.45)", background: "rgba(255,80,80,.12)" }}>
            {err}
          </div>
        ) : null}

        <div style={{ marginTop: 12 }}>
          <div className="muted" style={{ marginBottom: 6 }}>Felhasználó</div>
          <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="pl. Kacsa" onKeyDown={(e) => (e.key === "Enter" ? submit() : null)} />
        </div>

        <div style={{ marginTop: 10 }}>
          <div className="muted" style={{ marginBottom: 6 }}>Jelszó</div>
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" onKeyDown={(e) => (e.key === "Enter" ? submit() : null)} />
        </div>

        <button className="btn btnPrimary" style={{ width: "100%", marginTop: 14 }} onClick={submit} disabled={busy}>
          {busy ? "Belépés..." : "Belépés"}
        </button>
      </div>
    </div>
  );
}
