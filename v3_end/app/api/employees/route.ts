import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const employees = await prisma.employee.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(employees);
}
