import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  await requireAuth();
  const typeId = request.nextUrl.searchParams.get("typeId");
  const days = parseInt(request.nextUrl.searchParams.get("days") || "30");

  const since = new Date();
  since.setDate(since.getDate() - days);

  const where = {
    createdAt: { gte: since },
    ...(typeId ? { insuranceTypeId: typeId } : {}),
  };

  // Overall stats
  const [totalLeads, completedLeads, routedLeads, abandonedLeads] = await Promise.all([
    prisma.lead.count({ where }),
    prisma.lead.count({ where: { ...where, status: "completed" } }),
    prisma.lead.count({ where: { ...where, status: "routed" } }),
    prisma.lead.count({ where: { ...where, status: "in_progress" } }),
  ]);

  // Funnel data: how many leads reached each step
  const steps = typeId
    ? await prisma.step.findMany({
        where: { insuranceTypeId: typeId },
        orderBy: { order: "asc" },
      })
    : [];

  const funnelData = await Promise.all(
    steps.map(async (step) => {
      const reached = await prisma.lead.count({
        where: { ...where, lastStepReached: { gte: step.order } },
      });
      const events = await prisma.funnelEvent.count({
        where: { stepId: step.id, eventType: "step_viewed", createdAt: { gte: since } },
      });
      const completed = await prisma.funnelEvent.count({
        where: { stepId: step.id, eventType: "step_completed", createdAt: { gte: since } },
      });
      return {
        stepId: step.id,
        stepTitle: step.title,
        stepOrder: step.order,
        reached,
        viewed: events,
        completed,
        dropoffRate: events > 0 ? Math.round(((events - completed) / events) * 100) : 0,
      };
    })
  );

  // Leads per day
  const leadsPerDay = await prisma.lead.groupBy({
    by: ["createdAt"],
    where,
    _count: true,
    orderBy: { createdAt: "asc" },
  });

  // Aggregate by day
  const dailyMap: Record<string, { total: number; completed: number }> = {};
  const allLeads = await prisma.lead.findMany({
    where,
    select: { createdAt: true, status: true },
  });
  for (const lead of allLeads) {
    const day = lead.createdAt.toISOString().split("T")[0];
    if (!dailyMap[day]) dailyMap[day] = { total: 0, completed: 0 };
    dailyMap[day].total++;
    if (lead.status === "completed" || lead.status === "routed") dailyMap[day].completed++;
  }
  const dailyStats = Object.entries(dailyMap)
    .map(([date, stats]) => ({ date, ...stats }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Routing distribution
  const routingDist = await prisma.lead.groupBy({
    by: ["routedTo"],
    where: { ...where, routedTo: { not: null } },
    _count: true,
  });

  return NextResponse.json({
    overview: {
      totalLeads,
      completedLeads,
      routedLeads,
      abandonedLeads,
      conversionRate: totalLeads > 0 ? Math.round((completedLeads / totalLeads) * 100) : 0,
    },
    funnelData,
    dailyStats,
    routingDistribution: routingDist.map((r) => ({
      company: r.routedTo || "Unrouted",
      count: r._count,
    })),
  });
}
