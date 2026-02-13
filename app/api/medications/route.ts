import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const query = url.searchParams.get("query")?.trim() ?? "";

  try {
    const meds = await prisma.medication.findMany({
      where: query
        ? {
            name: {
              contains: query
            }
          }
        : undefined,
      orderBy: { name: "asc" },
      take: 20,
      select: {
        id: true,
        name: true,
        commonStrengths: true
      }
    });
    return NextResponse.json(meds);
  } catch (error) {
    console.error("Failed to fetch medications", error);
    return NextResponse.json({ message: "Could not fetch medications" }, { status: 500 });
  }
}
