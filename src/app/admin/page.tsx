"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Overview {
  totalLeads: number;
  completedLeads: number;
  routedLeads: number;
  abandonedLeads: number;
  conversionRate: number;
}

export default function AdminDashboard() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [types, setTypes] = useState<Array<{ id: string; name: string; label: string; _count: { steps: number } }>>([]);

  useEffect(() => {
    fetch("/api/admin/analytics").then((r) => r.json()).then((d) => setOverview(d.overview));
    fetch("/api/admin/questions").then((r) => r.json()).then(setTypes);
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        {[
          { label: "Total Leads", value: overview?.totalLeads ?? "—", color: "text-gray-900" },
          { label: "Completed", value: overview?.completedLeads ?? "—", color: "text-emerald-600" },
          { label: "Routed", value: overview?.routedLeads ?? "—", color: "text-blue-600" },
          { label: "Abandoned", value: overview?.abandonedLeads ?? "—", color: "text-orange-600" },
          { label: "Conversion", value: overview ? `${overview.conversionRate}%` : "—", color: "text-indigo-600" },
        ].map((stat) => (
          <div key={stat.label} className="card">
            <div className="text-sm text-gray-500">{stat.label}</div>
            <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Insurance Types */}
      <h2 className="text-xl font-bold mb-4">Insurance Types</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {types.map((type) => (
          <div key={type.id} className="card hover:shadow-md transition-shadow">
            <h3 className="font-bold text-lg mb-2">{type.label}</h3>
            <p className="text-sm text-gray-500 mb-4">{type._count.steps} steps configured</p>
            <div className="flex gap-2">
              <Link href={`/admin/questions?typeId=${type.id}`} className="text-sm text-indigo-600 hover:underline">Edit Questions</Link>
              <span className="text-gray-300">|</span>
              <Link href={`/admin/analytics?typeId=${type.id}`} className="text-sm text-indigo-600 hover:underline">View Analytics</Link>
              <span className="text-gray-300">|</span>
              <Link href={`/admin/routing?typeId=${type.id}`} className="text-sm text-indigo-600 hover:underline">Routing</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
