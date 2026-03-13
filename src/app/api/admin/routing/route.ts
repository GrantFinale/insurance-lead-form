import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try { await requireAuth(); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
  const typeId = request.nextUrl.searchParams.get("typeId");

  const rules = await prisma.routingRule.findMany({
    where: typeId ? { insuranceTypeId: typeId } : {},
    include: { insuranceType: { select: { name: true, label: true } } },
    orderBy: { priority: "desc" },
  });

  return NextResponse.json(rules);
}

export async function POST(request: NextRequest) {
  try { await requireAuth(); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
  const body = await request.json();

  const rule = await prisma.routingRule.create({
    data: {
      insuranceTypeId: body.insuranceTypeId,
      name: body.name,
      companyName: body.companyName,
      companyEndpoint: body.companyEndpoint || null,
      companyEmail: body.companyEmail || null,
      priority: body.priority || 0,
      conditions: body.conditions || [],
      weight: body.weight || 100,
      dailyCap: body.dailyCap || null,
      enabled: body.enabled ?? true,
    },
  });

  return NextResponse.json(rule);
}

export async function PUT(request: NextRequest) {
  try { await requireAuth(); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
  const body = await request.json();

  const rule = await prisma.routingRule.update({
    where: { id: body.id },
    data: {
      name: body.name,
      companyName: body.companyName,
      companyEndpoint: body.companyEndpoint,
      companyEmail: body.companyEmail,
      priority: body.priority,
      conditions: body.conditions,
      weight: body.weight,
      dailyCap: body.dailyCap,
      enabled: body.enabled,
    },
  });

  return NextResponse.json(rule);
}

export async function DELETE(request: NextRequest) {
  try { await requireAuth(); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await prisma.routingRule.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
