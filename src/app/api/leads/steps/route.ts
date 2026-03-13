import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get("type");
  if (!type) return NextResponse.json({ error: "Missing type" }, { status: 400 });

  const insuranceType = await prisma.insuranceType.findUnique({
    where: { name: type },
    include: {
      steps: {
        where: {},
        orderBy: { order: "asc" },
        include: {
          questions: {
            where: { enabled: true },
            orderBy: { order: "asc" },
          },
        },
      },
    },
  });

  if (!insuranceType) {
    return NextResponse.json({ steps: [] });
  }

  return NextResponse.json({ steps: insuranceType.steps });
}
