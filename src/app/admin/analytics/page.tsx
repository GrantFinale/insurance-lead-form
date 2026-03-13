"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

interface FunnelStep {
  stepId: string;
  stepTitle: string;
  stepOrder: number;
  reached: number;
  viewed: number;
  completed: number;
  dropoffRate: number;
}

interface Analytics {
  overview: {
    totalLeads: number;
    completedLeads: number;
    routedLeads: number;
    abandonedLeads: number;
    conversionRate: number;
  };
  funnelData: FunnelStep[];
  dailyStats: { date: string; total: number; completed: number }[];
  routingDistribution: { company: string; count: number }[];
}

function AnalyticsInner() {
  const searchParams = useSearchParams();
  const initialTypeId = searchParams.get("typeId") || "";
  const [typeId, setTypeId] = useState(initialTypeId);
  const [types, setTypes] = useState<Array<{ id: string; name: string; label: string }>>([]);
  const [data, setData] = useState<Analytics | null>(null);
  const [days, setDays] = useState(30);

  useEffect(() => {
    fetch("/api/admin/questions").then((r) => r.json()).then((d) => {
      setTypes(d);
      if (!typeId && d.length > 0) setTypeId(d[0].id);
    });
  }, []);

  useEffect(() => {
    if (!typeId) return;
    fetch(`/api/admin/analytics?typeId=${typeId}&days=${days}`)
      .then((r) => r.json())
      .then(setData);
  }, [typeId, days]);

  const maxReached = data?.funnelData?.[0]?.reached || 1;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Abandonment Analytics</h1>
        <div className="flex gap-3">
          <select className="input-field w-auto text-sm" value={days} onChange={(e) => setDays(Number(e.target.value))}>
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <select className="input-field w-auto text-sm" value={typeId} onChange={(e) => setTypeId(e.target.value)}>
            {types.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      {!data ? (
        <div className="text-center py-12 text-gray-400">Loading analytics...</div>
      ) : (
        <>
          {/* Overview Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            {[
              { label: "Total Leads", value: data.overview.totalLeads, color: "text-gray-900" },
              { label: "Completed", value: data.overview.completedLeads, color: "text-emerald-600" },
              { label: "Routed", value: data.overview.routedLeads, color: "text-blue-600" },
              { label: "Abandoned", value: data.overview.abandonedLeads, color: "text-orange-600" },
              { label: "Conversion", value: `${data.overview.conversionRate}%`, color: "text-indigo-600" },
            ].map((s) => (
              <div key={s.label} className="card text-center">
                <div className="text-xs text-gray-500 uppercase tracking-wide">{s.label}</div>
                <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Funnel Visualization */}
          <div className="card mb-8">
            <h2 className="text-lg font-bold mb-6">Conversion Funnel</h2>
            {data.funnelData.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No funnel data yet. Leads need to be created first.</p>
            ) : (
              <div className="space-y-3">
                {data.funnelData.map((step, i) => {
                  const width = maxReached > 0 ? (step.reached / maxReached) * 100 : 0;
                  const prevReached = i > 0 ? data.funnelData[i - 1].reached : step.reached;
                  const dropoff = prevReached > 0 ? Math.round(((prevReached - step.reached) / prevReached) * 100) : 0;

                  return (
                    <div key={step.stepId}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="font-medium">Step {step.stepOrder + 1}: {step.stepTitle}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-gray-500">{step.reached} users</span>
                          {i > 0 && dropoff > 0 && (
                            <span className="text-red-500 font-semibold">-{dropoff}% dropoff</span>
                          )}
                        </div>
                      </div>
                      <div className="h-10 bg-gray-100 rounded-lg overflow-hidden relative">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg transition-all duration-700 flex items-center px-3"
                          style={{ width: `${Math.max(width, 2)}%` }}
                        >
                          {width > 15 && (
                            <span className="text-white text-xs font-bold">{Math.round(width)}%</span>
                          )}
                        </div>
                      </div>
                      {i < data.funnelData.length - 1 && dropoff > 20 && (
                        <div className="text-xs text-red-400 mt-1 ml-2">
                          ⚠️ High abandonment — consider simplifying this step
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Daily chart (simple bar chart) */}
          <div className="card mb-8">
            <h2 className="text-lg font-bold mb-4">Daily Leads</h2>
            {data.dailyStats.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No data yet</p>
            ) : (
              <div className="flex items-end gap-1 h-40">
                {data.dailyStats.slice(-30).map((day) => {
                  const maxDay = Math.max(...data.dailyStats.map((d) => d.total), 1);
                  const height = (day.total / maxDay) * 100;
                  const completedHeight = (day.completed / maxDay) * 100;
                  return (
                    <div key={day.date} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                      <div className="absolute -top-8 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">
                        {day.date}: {day.total} leads, {day.completed} completed
                      </div>
                      <div className="w-full bg-indigo-200 rounded-t relative" style={{ height: `${height}%` }}>
                        <div className="absolute bottom-0 w-full bg-indigo-600 rounded-t" style={{ height: `${completedHeight > 0 ? (completedHeight / height) * 100 : 0}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="flex gap-4 mt-3 text-xs text-gray-500">
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-indigo-200 rounded" /> Total</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-indigo-600 rounded" /> Completed</span>
            </div>
          </div>

          {/* Routing Distribution */}
          {data.routingDistribution.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-bold mb-4">Lead Routing Distribution</h2>
              <div className="space-y-2">
                {data.routingDistribution.map((r) => (
                  <div key={r.company} className="flex items-center justify-between">
                    <span className="font-medium">{r.company}</span>
                    <span className="text-gray-500">{r.count} leads</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AnalyticsInner />
    </Suspense>
  );
}
