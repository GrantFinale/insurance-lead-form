import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get("type") || "auto";

  const insuranceType = await prisma.insuranceType.findUnique({
    where: { name: type },
    include: {
      steps: {
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
    return NextResponse.json({ error: "Insurance type not found" }, { status: 404 });
  }

  return NextResponse.json({
    insuranceType: { id: insuranceType.id, name: insuranceType.name, label: insuranceType.label },
    steps: insuranceType.steps,
  });
}
