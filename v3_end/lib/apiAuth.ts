import { cookies } from "next/headers";
import { getSessionUser } from "@/lib/auth";

export async function requireUser() {
  const me = await getSessionUser();
  if (!me) return { me: null, activeCompany: null, error: { error: "Nincs bejelentkezve." }, status: 401 };

  const accessible =
    me.role === "accountant"
      ? (me.companyAccesses || []).map((x: any) => x.company).filter(Boolean)
      : (me.company ? [me.company] : []);

  const activeId = cookies().get("active_company")?.value || "";
  const active = accessible.find((c: any) => c.id === activeId) || accessible[0] || null;

  return { me, activeCompany: active, error: null, status: 200 };
}
