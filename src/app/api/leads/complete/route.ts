import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  const { leadId, data } = await request.json();

  if (!leadId) return NextResponse.json({ error: "Missing leadId" }, { status: 400 });

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: { insuranceType: { include: { steps: true } } },
  });

  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  // Get applicable routing rules
  const rules = await prisma.routingRule.findMany({
    where: { insuranceTypeId: lead.insuranceTypeId, enabled: true },
    orderBy: { priority: "desc" },
  });

  let routedTo: string | null = null;

  // Evaluate routing rules
  for (const rule of rules) {
    if (rule.dailyCap && rule.todayCount >= rule.dailyCap) continue;

    const conditions = rule.conditions as Array<{ field: string; operator: string; value: string }>;
    const allMatch = conditions.every((cond) => {
      const fieldVal = (data as Record<string, string>)?.[cond.field] || "";
      switch (cond.operator) {
        case "equals": return fieldVal === cond.value;
        case "not_equals": return fieldVal !== cond.value;
        case "contains": return fieldVal.includes(cond.value);
        case "greater_than": return Number(fieldVal) > Number(cond.value);
        case "less_than": return Number(fieldVal) < Number(cond.value);
        default: return true;
      }
    });

    if (allMatch || conditions.length === 0) {
      routedTo = rule.companyName;
      // Increment daily count
      await prisma.routingRule.update({
        where: { id: rule.id },
        data: { todayCount: { increment: 1 } },
      });
      break;
    }
  }

  const totalSteps = lead.insuranceType.steps.length;

  const updated = await prisma.lead.update({
    where: { id: leadId },
    data: {
      data,
      status: "completed",
      completedAt: new Date(),
      lastStepReached: totalSteps - 1,
      routedTo,
      routedAt: routedTo ? new Date() : null,
    },
  });

  return NextResponse.json(updated);
}
