import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  await requireAuth();
  const typeId = request.nextUrl.searchParams.get("typeId");

  if (!typeId) {
    const types = await prisma.insuranceType.findMany({
      orderBy: { order: "asc" },
      include: { _count: { select: { steps: true } } },
    });
    return NextResponse.json(types);
  }

  const steps = await prisma.step.findMany({
    where: { insuranceTypeId: typeId },
    orderBy: { order: "asc" },
    include: {
      questions: { orderBy: { order: "asc" } },
    },
  });

  return NextResponse.json(steps);
}

export async function PUT(request: NextRequest) {
  await requireAuth();
  const body = await request.json();

  if (body.action === "reorder_steps") {
    const { steps } = body as { steps: { id: string; order: number }[] };
    await Promise.all(
      steps.map((s) => prisma.step.update({ where: { id: s.id }, data: { order: s.order } }))
    );
    return NextResponse.json({ ok: true });
  }

  if (body.action === "reorder_questions") {
    const { questions } = body as { questions: { id: string; order: number; stepId: string }[] };
    await Promise.all(
      questions.map((q) =>
        prisma.question.update({ where: { id: q.id }, data: { order: q.order, stepId: q.stepId } })
      )
    );
    return NextResponse.json({ ok: true });
  }

  if (body.action === "update_question") {
    const { id, ...data } = body.question;
    const updated = await prisma.question.update({ where: { id }, data });
    return NextResponse.json(updated);
  }

  if (body.action === "update_step") {
    const { id, ...data } = body.step;
    const updated = await prisma.step.update({ where: { id }, data });
    return NextResponse.json(updated);
  }

  if (body.action === "create_question") {
    const maxOrder = await prisma.question.findFirst({
      where: { stepId: body.question.stepId },
      orderBy: { order: "desc" },
    });
    const question = await prisma.question.create({
      data: { ...body.question, order: (maxOrder?.order ?? -1) + 1 },
    });
    return NextResponse.json(question);
  }

  if (body.action === "create_step") {
    const maxOrder = await prisma.step.findFirst({
      where: { insuranceTypeId: body.step.insuranceTypeId },
      orderBy: { order: "desc" },
    });
    const step = await prisma.step.create({
      data: { ...body.step, order: (maxOrder?.order ?? -1) + 1 },
    });
    return NextResponse.json(step);
  }

  if (body.action === "delete_question") {
    await prisma.question.delete({ where: { id: body.id } });
    return NextResponse.json({ ok: true });
  }

  if (body.action === "delete_step") {
    await prisma.step.delete({ where: { id: body.id } });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
