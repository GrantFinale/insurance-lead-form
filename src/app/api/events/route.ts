import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { leadId, stepId, eventType, metadata } = await request.json();

    if (!leadId) {
      return NextResponse.json({ ok: true }); // no lead yet, skip
    }

    await prisma.funnelEvent.create({
      data: {
        leadId,
        stepId: stepId || null,
        eventType,
        metadata: metadata || null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true }); // never fail analytics
  }
}
