import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ user: null }, { status: 200 });

  const accessibleCompanies =
    user.role === "accountant"
      ? (user.companyAccesses || []).map((x: any) => x.company).filter(Boolean)
      : (user.company ? [user.company] : []);

  const activeCookie = cookies().get("active_company")?.value || "";
  const activeCompany =
    accessibleCompanies.find((c: any) => c.id === activeCookie) ||
    accessibleCompanies[0] ||
    null;

  return NextResponse.json({
    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
      avatarUrl: user.avatarUrl,
      canViewFinance: user.canViewFinance,
      canManageUsers: user.canManageUsers,
      canManageProjects: user.canManageProjects,
      company: user.company ? { id: user.company.id, name: user.company.name } : null,
      accessibleCompanies: accessibleCompanies.map((c: any) => ({ id: c.id, name: c.name })),
      activeCompany: activeCompany ? { id: activeCompany.id, name: activeCompany.name } : null
    }
  });
}
