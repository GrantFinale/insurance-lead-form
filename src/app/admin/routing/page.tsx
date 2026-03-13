"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

interface Condition {
  field: string;
  operator: string;
  value: string;
}

interface RoutingRule {
  id: string;
  name: string;
  companyName: string;
  companyEndpoint?: string;
  companyEmail?: string;
  priority: number;
  conditions: Condition[];
  weight: number;
  dailyCap?: number;
  todayCount: number;
  enabled: boolean;
  insuranceType: { name: string; label: string };
}

function RoutingInner() {
  const searchParams = useSearchParams();
  const initialTypeId = searchParams.get("typeId") || "";
  const [typeId, setTypeId] = useState(initialTypeId);
  const [types, setTypes] = useState<Array<{ id: string; name: string; label: string }>>([]);
  const [rules, setRules] = useState<RoutingRule[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState<RoutingRule | null>(null);
  const [form, setForm] = useState({
    name: "",
    companyName: "",
    companyEndpoint: "",
    companyEmail: "",
    priority: 0,
    weight: 100,
    dailyCap: "",
    conditions: "[]",
    enabled: true,
  });

  useEffect(() => {
    fetch("/api/admin/questions").then((r) => r.json()).then((d) => {
      setTypes(d);
      if (!typeId && d.length > 0) setTypeId(d[0].id);
    });
  }, []);

  useEffect(() => {
    if (!typeId) return;
    fetch(`/api/admin/routing?typeId=${typeId}`).then((r) => r.json()).then(setRules);
  }, [typeId]);

  const loadRules = () => {
    fetch(`/api/admin/routing?typeId=${typeId}`).then((r) => r.json()).then(setRules);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let conditions: Condition[] = [];
    try { conditions = JSON.parse(form.conditions); } catch {}

    const payload = {
      ...form,
      insuranceTypeId: typeId,
      conditions,
      dailyCap: form.dailyCap ? parseInt(form.dailyCap) : null,
    };

    if (editingRule) {
      await fetch("/api/admin/routing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, id: editingRule.id }),
      });
    } else {
      await fetch("/api/admin/routing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    setShowForm(false);
    setEditingRule(null);
    setForm({ name: "", companyName: "", companyEndpoint: "", companyEmail: "", priority: 0, weight: 100, dailyCap: "", conditions: "[]", enabled: true });
    loadRules();
  };

  const deleteRule = async (id: string) => {
    if (!confirm("Delete this routing rule?")) return;
    await fetch(`/api/admin/routing?id=${id}`, { method: "DELETE" });
    loadRules();
  };

  const editRule = (rule: RoutingRule) => {
    setEditingRule(rule);
    setForm({
      name: rule.name,
      companyName: rule.companyName,
      companyEndpoint: rule.companyEndpoint || "",
      companyEmail: rule.companyEmail || "",
      priority: rule.priority,
      weight: rule.weight,
      dailyCap: rule.dailyCap?.toString() || "",
      conditions: JSON.stringify(rule.conditions, null, 2),
      enabled: rule.enabled,
    });
    setShowForm(true);
  };

  const toggleRule = async (rule: RoutingRule) => {
    await fetch("/api/admin/routing", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...rule, enabled: !rule.enabled }),
    });
    loadRules();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Lead Routing</h1>
        <div className="flex gap-3">
          <select className="input-field w-auto text-sm" value={typeId} onChange={(e) => setTypeId(e.target.value)}>
            {types.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
          <button onClick={() => { setShowForm(true); setEditingRule(null); }} className="btn-primary text-sm py-2">
            + Add Rule
          </button>
        </div>
      </div>

      {/* Rule form */}
      {showForm && (
        <div className="card mb-6">
          <h2 className="text-lg font-bold mb-4">{editingRule ? "Edit" : "New"} Routing Rule</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Rule Name</label>
                <input className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Insurance Company</label>
                <input className="input-field" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} required />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Webhook URL (optional)</label>
                <input className="input-field" value={form.companyEndpoint} onChange={(e) => setForm({ ...form, companyEndpoint: e.target.value })} placeholder="https://..." />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Notification Email (optional)</label>
                <input className="input-field" type="email" value={form.companyEmail} onChange={(e) => setForm({ ...form, companyEmail: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Priority (higher = first)</label>
                <input className="input-field" type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value) })} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Weight</label>
                <input className="input-field" type="number" value={form.weight} onChange={(e) => setForm({ ...form, weight: parseInt(e.target.value) })} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Daily Cap (empty = unlimited)</label>
                <input className="input-field" type="number" value={form.dailyCap} onChange={(e) => setForm({ ...form, dailyCap: e.target.value })} />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} className="w-4 h-4" />
                  <span className="text-sm font-medium">Enabled</span>
                </label>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Conditions (JSON)</label>
              <p className="text-xs text-gray-400 mb-1">Format: [{"{"}field, operator (equals/not_equals/contains/greater_than/less_than), value{"}"}]</p>
              <textarea className="input-field font-mono text-sm" rows={4} value={form.conditions} onChange={(e) => setForm({ ...form, conditions: e.target.value })} />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn-primary text-sm py-2">{editingRule ? "Update" : "Create"} Rule</button>
              <button type="button" onClick={() => { setShowForm(false); setEditingRule(null); }} className="btn-secondary text-sm py-2">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Rules list */}
      <div className="space-y-3">
        {rules.length === 0 ? (
          <div className="card text-center py-12 text-gray-400">
            No routing rules configured. Add one to start routing leads.
          </div>
        ) : (
          rules.map((rule) => (
            <div key={rule.id} className={`card flex items-center justify-between ${!rule.enabled ? "opacity-50" : ""}`}>
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-bold">{rule.name}</h3>
                  <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">→ {rule.companyName}</span>
                  <span className="text-xs text-gray-400">Priority: {rule.priority}</span>
                  {rule.dailyCap && (
                    <span className="text-xs text-gray-400">Cap: {rule.todayCount}/{rule.dailyCap}</span>
                  )}
                </div>
                {(rule.conditions as Condition[]).length > 0 && (
                  <div className="text-xs text-gray-500 mt-1">
                    Conditions: {(rule.conditions as Condition[]).map((c) => `${c.field} ${c.operator} ${c.value}`).join(", ")}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => toggleRule(rule)} className={`px-3 py-1 text-xs rounded ${rule.enabled ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                  {rule.enabled ? "On" : "Off"}
                </button>
                <button onClick={() => editRule(rule)} className="px-3 py-1 text-xs bg-indigo-100 text-indigo-700 rounded">Edit</button>
                <button onClick={() => deleteRule(rule.id)} className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded">Delete</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function RoutingPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RoutingInner />
    </Suspense>
  );
}
