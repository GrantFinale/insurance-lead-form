"use client";

import { useEffect, useState } from "react";

interface Lead {
  id: string;
  sessionId: string;
  status: string;
  data: Record<string, string>;
  lastStepReached: number;
  routedTo?: string;
  routedAt?: string;
  completedAt?: string;
  createdAt: string;
  insuranceType: { name: string; label: string };
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [expandedLead, setExpandedLead] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams({ page: String(page) });
    if (statusFilter) params.set("status", statusFilter);
    fetch(`/api/admin/leads?${params}`).then((r) => r.json()).then((d) => {
      setLeads(d.leads);
      setTotal(d.total);
    });
  }, [page, statusFilter]);

  const statusColors: Record<string, string> = {
    in_progress: "bg-yellow-100 text-yellow-800",
    completed: "bg-emerald-100 text-emerald-800",
    routed: "bg-blue-100 text-blue-800",
    expired: "bg-gray-100 text-gray-800",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Leads ({total})</h1>
        <div className="flex gap-3">
          <select className="input-field w-auto text-sm" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">All Statuses</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="routed">Routed</option>
          </select>
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">Date</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">Type</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">Status</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">Step</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">Routed To</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">Contact</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {leads.map((lead) => (
              <>
                <tr
                  key={lead.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => setExpandedLead(expandedLead === lead.id ? null : lead.id)}
                >
                  <td className="px-4 py-3 text-sm">{new Date(lead.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-sm">{lead.insuranceType.label}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[lead.status] || "bg-gray-100"}`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">{lead.lastStepReached}</td>
                  <td className="px-4 py-3 text-sm">{lead.routedTo || "—"}</td>
                  <td className="px-4 py-3 text-sm">{(lead.data as Record<string, string>).email || (lead.data as Record<string, string>).phone || "—"}</td>
                </tr>
                {expandedLead === lead.id && (
                  <tr key={`${lead.id}-detail`}>
                    <td colSpan={6} className="px-4 py-4 bg-gray-50">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        {Object.entries(lead.data as Record<string, string>).map(([key, val]) => (
                          <div key={key}>
                            <span className="text-xs font-medium text-gray-500 block">{key}</span>
                            <span>{String(val)}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-center gap-2 mt-6">
        <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="btn-secondary text-sm py-2 px-4 disabled:opacity-30">Previous</button>
        <span className="flex items-center text-sm text-gray-500">Page {page}</span>
        <button onClick={() => setPage(page + 1)} disabled={leads.length < 50} className="btn-secondary text-sm py-2 px-4 disabled:opacity-30">Next</button>
      </div>
    </div>
  );
}
