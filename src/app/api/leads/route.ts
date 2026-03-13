import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { leadId, sessionId, insuranceType, data, lastStepReached, completed } = body;

  const type = await prisma.insuranceType.findUnique({ where: { name: insuranceType } });
  if (!type) return NextResponse.json({ error: "Invalid insurance type" }, { status: 400 });

  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
  const ua = request.headers.get("user-agent") || "";
  const ref = request.headers.get("referer") || "";

  if (leadId) {
    // Update existing lead
    const lead = await prisma.lead.update({
      where: { id: leadId },
      data: {
        data,
        lastStepReached,
        status: completed ? "completed" : "in_progress",
        completedAt: completed ? new Date() : undefined,
      },
    });

    // If completed, try to route
    if (completed) {
      await routeLead(lead.id, type.id, data);
    }

    return NextResponse.json({ id: lead.id });
  }

  // Create new lead
  const lead = await prisma.lead.create({
    data: {
      sessionId,
      insuranceTypeId: type.id,
      data,
      lastStepReached,
      ipAddress: ip,
      userAgent: ua,
      referrer: ref,
      status: completed ? "completed" : "in_progress",
      completedAt: completed ? new Date() : undefined,
    },
  });

  if (completed) {
    await routeLead(lead.id, type.id, data);
  }

  return NextResponse.json({ id: lead.id });
}

async function routeLead(leadId: string, insuranceTypeId: string, leadData: Record<string, unknown>) {
  // Find matching routing rules
  const rules = await prisma.routingRule.findMany({
    where: { insuranceTypeId, enabled: true },
    orderBy: { priority: "desc" },
  });

  for (const rule of rules) {
    // Check daily cap
    if (rule.dailyCap && rule.todayCount >= rule.dailyCap) continue;

    // Check conditions
    const conditions = rule.conditions as Array<{ field: string; operator: string; value: string }>;
    const matches = conditions.every((cond) => {
      const fieldVal = String(leadData[cond.field] || "");
      switch (cond.operator) {
        case "equals": return fieldVal === cond.value;
        case "not_equals": return fieldVal !== cond.value;
        case "contains": return fieldVal.includes(cond.value);
        case "greater_than": return Number(fieldVal) > Number(cond.value);
        case "less_than": return Number(fieldVal) < Number(cond.value);
        default: return true;
      }
    });

    if (matches || conditions.length === 0) {
      await prisma.lead.update({
        where: { id: leadId },
        data: { routedTo: rule.companyName, routedAt: new Date(), status: "routed" },
      });
      await prisma.routingRule.update({
        where: { id: rule.id },
        data: { todayCount: { increment: 1 } },
      });
      break;
    }
  }
}
