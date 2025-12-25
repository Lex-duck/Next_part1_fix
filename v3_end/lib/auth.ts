import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function getSessionUser() {
  const cookie = cookies().get("session_user")?.value;
  if (!cookie) return null;
  const user = await prisma.user.findUnique({
    where: { id: cookie },
    include: {
      company: true,
      companyAccesses: { include: { company: true } }
    }
  });
  return user;
}

export function isAdmin(user: any) {
  return user?.role === "admin";
}

export function isOwner(user: any) {
  return user?.role === "owner";
}

export function isAccountant(user: any) {
  return user?.role === "accountant";
}
