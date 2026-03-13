"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

interface Question {
  id: string;
  label: string;
  fieldName: string;
  fieldType: string;
  placeholder?: string;
  helpText?: string;
  required: boolean;
  options?: { value: string; label: string }[];
  order: number;
  enabled: boolean;
}

interface Step {
  id: string;
  title: string;
  description?: string;
  order: number;
  questions: Question[];
}

interface InsuranceType {
  id: string;
  name: string;
  label: string;
}

function QuestionsInner() {
  const searchParams = useSearchParams();
  const initialTypeId = searchParams.get("typeId") || "";
  const [types, setTypes] = useState<InsuranceType[]>([]);
  const [typeId, setTypeId] = useState(initialTypeId);
  const [steps, setSteps] = useState<Step[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Question>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/questions").then((r) => r.json()).then((data) => {
      setTypes(data);
      if (!typeId && data.length > 0) setTypeId(data[0].id);
    });
  }, []);

  useEffect(() => {
    if (!typeId) return;
    fetch(`/api/admin/questions?typeId=${typeId}`).then((r) => r.json()).then(setSteps);
  }, [typeId]);

  const saveAction = async (action: string, payload: Record<string, unknown>) => {
    setSaving(true);
    await fetch("/api/admin/questions", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...payload }),
    });
    // Reload steps
    const res = await fetch(`/api/admin/questions?typeId=${typeId}`);
    setSteps(await res.json());
    setSaving(false);
    setEditing(null);
  };

  const moveQuestion = async (stepIdx: number, qIdx: number, direction: "up" | "down") => {
    const step = steps[stepIdx];
    const qs = [...step.questions];
    const targetIdx = direction === "up" ? qIdx - 1 : qIdx + 1;
    if (targetIdx < 0 || targetIdx >= qs.length) return;
    [qs[qIdx], qs[targetIdx]] = [qs[targetIdx], qs[qIdx]];
    await saveAction("reorder_questions", {
      questions: qs.map((q, i) => ({ id: q.id, order: i, stepId: step.id })),
    });
  };

  const moveStep = async (idx: number, direction: "up" | "down") => {
    const ss = [...steps];
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= ss.length) return;
    [ss[idx], ss[targetIdx]] = [ss[targetIdx], ss[idx]];
    await saveAction("reorder_steps", {
      steps: ss.map((s, i) => ({ id: s.id, order: i })),
    });
  };

  const startEdit = (q: Question) => {
    setEditing(q.id);
    setEditData({ ...q });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Question Editor</h1>
        <select
          className="input-field w-auto"
          value={typeId}
          onChange={(e) => setTypeId(e.target.value)}
        >
          {types.map((t) => (
            <option key={t.id} value={t.id}>{t.label}</option>
          ))}
        </select>
      </div>

      {saving && (
        <div className="fixed top-4 right-4 bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          Saving...
        </div>
      )}

      <div className="space-y-6">
        {steps.map((step, stepIdx) => (
          <div key={step.id} className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold">Step {step.order + 1}: {step.title}</h2>
                {step.description && <p className="text-sm text-gray-500">{step.description}</p>}
              </div>
              <div className="flex gap-1">
                <button onClick={() => moveStep(stepIdx, "up")} disabled={stepIdx === 0} className="px-2 py-1 text-sm bg-gray-100 rounded disabled:opacity-30">↑</button>
                <button onClick={() => moveStep(stepIdx, "down")} disabled={stepIdx === steps.length - 1} className="px-2 py-1 text-sm bg-gray-100 rounded disabled:opacity-30">↓</button>
                <button
                  onClick={() => {
                    const title = prompt("Step title:", step.title);
                    const description = prompt("Step description:", step.description || "");
                    if (title) saveAction("update_step", { step: { id: step.id, title, description } });
                  }}
                  className="px-2 py-1 text-sm bg-indigo-100 text-indigo-700 rounded"
                >Edit</button>
              </div>
            </div>

            <div className="space-y-2">
              {step.questions.map((q, qIdx) => (
                <div key={q.id} className={`border rounded-lg p-3 ${q.enabled ? "bg-white" : "bg-gray-50 opacity-60"}`}>
                  {editing === q.id ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium text-gray-500">Label</label>
                          <input className="input-field text-sm" value={editData.label || ""} onChange={(e) => setEditData({ ...editData, label: e.target.value })} />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500">Field Name</label>
                          <input className="input-field text-sm" value={editData.fieldName || ""} onChange={(e) => setEditData({ ...editData, fieldName: e.target.value })} />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500">Type</label>
                          <select className="input-field text-sm" value={editData.fieldType || "text"} onChange={(e) => setEditData({ ...editData, fieldType: e.target.value })}>
                            {["text", "email", "tel", "number", "select", "radio", "checkbox", "zip", "date"].map((t) => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500">Placeholder</label>
                          <input className="input-field text-sm" value={editData.placeholder || ""} onChange={(e) => setEditData({ ...editData, placeholder: e.target.value })} />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500">Help Text</label>
                        <input className="input-field text-sm" value={editData.helpText || ""} onChange={(e) => setEditData({ ...editData, helpText: e.target.value })} />
                      </div>
                      {(editData.fieldType === "select" || editData.fieldType === "radio") && (
                        <div>
                          <label className="text-xs font-medium text-gray-500">Options (JSON: [{"{"}value, label{"}"}])</label>
                          <textarea
                            className="input-field text-sm font-mono"
                            rows={3}
                            value={JSON.stringify(editData.options || [], null, 2)}
                            onChange={(e) => {
                              try { setEditData({ ...editData, options: JSON.parse(e.target.value) }); } catch {}
                            }}
                          />
                        </div>
                      )}
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 text-sm">
                          <input type="checkbox" checked={editData.required ?? true} onChange={(e) => setEditData({ ...editData, required: e.target.checked })} />
                          Required
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <input type="checkbox" checked={editData.enabled ?? true} onChange={(e) => setEditData({ ...editData, enabled: e.target.checked })} />
                          Enabled
                        </label>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => saveAction("update_question", { question: { id: q.id, ...editData } })} className="btn-primary text-sm py-2 px-4">Save</button>
                        <button onClick={() => setEditing(null)} className="btn-secondary text-sm py-2 px-4">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{q.label}</span>
                        <span className="text-xs text-gray-400 ml-2">{q.fieldType} · {q.fieldName}</span>
                        {q.required && <span className="text-xs text-red-400 ml-2">required</span>}
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => moveQuestion(stepIdx, qIdx, "up")} disabled={qIdx === 0} className="px-2 py-1 text-xs bg-gray-100 rounded disabled:opacity-30">↑</button>
                        <button onClick={() => moveQuestion(stepIdx, qIdx, "down")} disabled={qIdx === step.questions.length - 1} className="px-2 py-1 text-xs bg-gray-100 rounded disabled:opacity-30">↓</button>
                        <button onClick={() => startEdit(q)} className="px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded">Edit</button>
                        <button onClick={() => { if (confirm("Delete this question?")) saveAction("delete_question", { id: q.id }); }} className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded">Delete</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <button
                onClick={() => {
                  const label = prompt("Question label:");
                  const fieldName = prompt("Field name (e.g. firstName):");
                  if (label && fieldName) {
                    saveAction("create_question", {
                      question: { stepId: step.id, label, fieldName, fieldType: "text", required: true, enabled: true },
                    });
                  }
                }}
                className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
              >
                + Add Question
              </button>
            </div>
          </div>
        ))}

        <button
          onClick={() => {
            const title = prompt("New step title:");
            if (title) saveAction("create_step", { step: { insuranceTypeId: typeId, title } });
          }}
          className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
        >
          + Add Step
        </button>
      </div>
    </div>
  );
}

export default function QuestionsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <QuestionsInner />
    </Suspense>
  );
}
