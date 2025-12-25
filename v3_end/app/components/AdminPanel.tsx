"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthProvider";

type Company = { id: string; name: string; employeeCount?: number | null; notes?: string | null };
type User = {
  id: string;
  username: string;
  displayName: string;
  role: string;
  avatarUrl?: string | null;
  canViewFinance: boolean;
  canManageUsers: boolean;
  canManageProjects: boolean;
  company?: { id: string; name: string } | null;
};

export default function AdminPanel() {
  const { user: me } = useAuth();

  if (!me) return <div className="card"><div className="h1">Admin</div><div className="muted">Betöltés...</div></div>;
  if (me.role !== "admin") {
    return <div className="card"><div className="h1">Admin</div><div className="notice">Nincs jogosultságod ehhez a felülethez.</div></div>;
  }

  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [msg, setMsg] = useState("");

  const [newCompanyName, setNewCompanyName] = useState("");
  const [newUser, setNewUser] = useState({ username: "", password: "", displayName: "", role: "staff", companyId: "", canViewFinance: true, canManageUsers: false, canManageProjects: true, avatarUrl: "" });

  const load = async () => {
    setMsg("");
    const [cRes, uRes] = await Promise.all([fetch("/api/admin/company"), fetch("/api/admin/users")]);
    if (!cRes.ok || !uRes.ok) {
      setMsg("Nincs jogosultság vagy hiba történt. (Csak admin látja.)");
      return;
    }
    setCompanies(await cRes.json());
    setUsers(await uRes.json());
  };

  useEffect(() => { load(); }, []);

  const createCompany = async () => {
    setMsg("");
    if (!newCompanyName.trim()) return;
    const res = await fetch("/api/admin/company", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newCompanyName.trim() }) });
    if (!res.ok) { setMsg("Nem sikerült cég létrehozása."); return; }
    setNewCompanyName("");
    await load();
  };

  const createUser = async () => {
    setMsg("");
    if (!newUser.username.trim() || !newUser.password.trim() || !newUser.displayName.trim()) { setMsg("Felhasználó/név/jelszó kötelező."); return; }
    const payload: any = { ...newUser };
    if (!payload.companyId) delete payload.companyId;
    if (!payload.avatarUrl) delete payload.avatarUrl;
    const res = await fetch("/api/admin/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (!res.ok) { const j = await res.json().catch(() => ({})); setMsg(j?.error || "Nem sikerült user létrehozás."); return; }
    setNewUser({ username: "", password: "", displayName: "", role: "staff", companyId: "", canViewFinance: true, canManageUsers: false, canManageProjects: true, avatarUrl: "" });
    await load();
  };

  const patchUser = async (id: string, data: Partial<User>) => {
    setMsg("");
    const res = await fetch(`/api/admin/users/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (!res.ok) { setMsg("Mentés sikertelen."); return; }
    await load();
  };

  return (
    <div className="card">
      <div className="sectionHeader">
        <div>
          <div className="h1">Regisztráció / Admin</div>
          <div className="muted">Cég(ek) és felhasználók felvétele + jogosultságok.</div>
        </div>
      </div>

      {msg ? <div className="notice">{msg}</div> : null}

      {!me?.canManageUsers ? (
        <div className="notice">Ehhez admin jogosultság kell.</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ border: "1px solid rgba(255,255,255,.08)", borderRadius: 16, padding: 12 }}>
            <div style={{ fontWeight: 900, marginBottom: 8 }}>Cég felvétele</div>
            <div className="muted" style={{ marginBottom: 6 }}>Cégnév</div>
            <input className="input" value={newCompanyName} onChange={(e) => setNewCompanyName(e.target.value)} placeholder="pl. Kacsák Kft." />
            <button className="btn btnPrimary" style={{ marginTop: 10 }} onClick={createCompany}>Cég létrehozása</button>

            <div style={{ height: 14 }} />
            <div style={{ fontWeight: 900, marginBottom: 8 }}>Cégek</div>
            <div className="muted">{companies.length ? "" : "Nincs cég."}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
              {companies.map((c) => (
                <div key={c.id} style={{ border: "1px solid rgba(255,255,255,.08)", borderRadius: 12, padding: "8px 10px" }}>
                  <div style={{ fontWeight: 900 }}>{c.name}</div>
                  <div className="muted" style={{ fontSize: 12 }}>ID: {c.id}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ border: "1px solid rgba(255,255,255,.08)", borderRadius: 16, padding: 12 }}>
            <div style={{ fontWeight: 900, marginBottom: 8 }}>Felhasználó felvétele</div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <div className="muted" style={{ marginBottom: 6 }}>Felhasználónév *</div>
                <input className="input" value={newUser.username} onChange={(e) => setNewUser((x) => ({ ...x, username: e.target.value }))} />
              </div>
              <div>
                <div className="muted" style={{ marginBottom: 6 }}>Jelszó *</div>
                <input className="input" value={newUser.password} onChange={(e) => setNewUser((x) => ({ ...x, password: e.target.value }))} />
              </div>
              <div>
                <div className="muted" style={{ marginBottom: 6 }}>Megjelenő név *</div>
                <input className="input" value={newUser.displayName} onChange={(e) => setNewUser((x) => ({ ...x, displayName: e.target.value }))} />
              </div>
              <div>
                <div className="muted" style={{ marginBottom: 6 }}>Szerep</div>
                <select className="input" value={newUser.role} onChange={(e) => setNewUser((x) => ({ ...x, role: e.target.value }))}>
                  <option value="staff">Dolgozó</option>
                  <option value="owner">Cég tulaj</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <div className="muted" style={{ marginBottom: 6 }}>Cég</div>
                <select className="input" value={newUser.companyId} onChange={(e) => setNewUser((x) => ({ ...x, companyId: e.target.value }))}>
                  <option value="">(nincs)</option>
                  {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <div className="muted" style={{ marginBottom: 6 }}>Avatar URL</div>
                <input className="input" value={newUser.avatarUrl} onChange={(e) => setNewUser((x) => ({ ...x, avatarUrl: e.target.value }))} placeholder="pl. https://..." />
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
              <label className="check"><input type="checkbox" checked={newUser.canViewFinance} onChange={(e) => setNewUser((x) => ({ ...x, canViewFinance: e.target.checked }))} /> Pénzügy látható</label>
              <label className="check"><input type="checkbox" checked={newUser.canManageProjects} onChange={(e) => setNewUser((x) => ({ ...x, canManageProjects: e.target.checked }))} /> Projektek kezelése</label>
              <label className="check"><input type="checkbox" checked={newUser.canManageUsers} onChange={(e) => setNewUser((x) => ({ ...x, canManageUsers: e.target.checked }))} /> Felhasználók kezelése</label>
            </div>

            <button className="btn btnPrimary" style={{ marginTop: 10 }} onClick={createUser}>Felhasználó létrehozása</button>
          </div>
        </div>
      )}

      <div style={{ height: 14 }} />

      <div style={{ fontWeight: 900, marginBottom: 8 }}>Felhasználók (jogosultság állítás)</div>
      <div className="tableWrap" style={{ padding: 0 }}>
        <table className="table" style={{ minWidth: 1100 }}>
          <thead>
            <tr>
              <th>Név</th><th>User</th><th>Szerep</th><th>Cég</th><th>Pénzügy</th><th>Projektek</th><th>Userek</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td style={{ fontWeight: 900 }}>{u.displayName}</td>
                <td>{u.username}</td>
                <td>
                  <select className="input" value={u.role} onChange={(e) => patchUser(u.id, { role: e.target.value } as any)}>
                    <option value="staff">Dolgozó</option>
                    <option value="owner">Cég tulaj</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td>{u.company?.name || "-"}</td>
                <td>
                  <input type="checkbox" checked={u.canViewFinance} onChange={(e) => patchUser(u.id, { canViewFinance: e.target.checked } as any)} />
                </td>
                <td>
                  <input type="checkbox" checked={u.canManageProjects} onChange={(e) => patchUser(u.id, { canManageProjects: e.target.checked } as any)} />
                </td>
                <td>
                  <input type="checkbox" checked={u.canManageUsers} onChange={(e) => patchUser(u.id, { canManageUsers: e.target.checked } as any)} />
                </td>
              </tr>
            ))}
            {users.length === 0 ? <tr><td colSpan={7} className="muted" style={{ padding: 14 }}>Nincs user.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
