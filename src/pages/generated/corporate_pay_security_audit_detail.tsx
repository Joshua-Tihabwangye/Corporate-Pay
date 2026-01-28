import React from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, FileText, Share2, Download, ShieldCheck, User, Clock, AlertTriangle, Check, XCircle } from "lucide-react";

export default function SecurityAuditDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();

  const outcome = searchParams.get("outcome") || "Success";
  const action = searchParams.get("action") || "Unknown Action";
  const target = searchParams.get("target") || "Unknown Target";
  const why = searchParams.get("why") || "No reason provided";
  const actor = searchParams.get("actor") || "Unknown";
  const when = searchParams.get("when") || "Unknown time";

  const isBlocked = outcome === "Blocked";

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Audit Log
          </button>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50">
              <Share2 className="h-4 w-4" /> Share
            </button>
            <button className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
              <Download className="h-4 w-4" /> Export JSON
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className={`rounded-[32px] border p-8 shadow-sm ${isBlocked ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white"}`}>
              <div className="flex items-start gap-4">
                <div className={`grid h-14 w-14 place-items-center rounded-2xl ${isBlocked ? "bg-amber-100 text-amber-600" : "bg-blue-50 text-blue-600"}`}>
                  {isBlocked ? <AlertTriangle className="h-7 w-7" /> : <FileText className="h-7 w-7" />}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">Audit Log Event</h1>
                  <p className="mt-1 font-mono text-sm text-slate-500">ID: {id || "A-XXXX"}</p>
                </div>
              </div>

              <div className="mt-8">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Event Properties</h3>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl bg-white/80 p-4 border border-slate-100">
                    <span className="text-xs font-semibold text-slate-500">Action</span>
                    <div className="mt-1 font-medium text-slate-900">{action}</div>
                  </div>
                  <div className="rounded-2xl bg-white/80 p-4 border border-slate-100">
                    <span className="text-xs font-semibold text-slate-500">Outcome</span>
                    <div className={`mt-1 flex items-center gap-2 font-medium ${isBlocked ? "text-amber-700" : "text-emerald-700"}`}>
                      {isBlocked ? <XCircle className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                      {outcome}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-white/80 p-4 border border-slate-100">
                    <span className="text-xs font-semibold text-slate-500">Resource Target</span>
                    <div className="mt-1 font-medium text-slate-900">{target}</div>
                  </div>
                  <div className="rounded-2xl bg-white/80 p-4 border border-slate-100">
                    <span className="text-xs font-semibold text-slate-500">Reason</span>
                    <div className="mt-1 font-medium text-slate-900">{why}</div>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Raw Data</h3>
                <div className="mt-4 rounded-2xl bg-slate-900 p-4 font-mono text-xs text-slate-300 overflow-x-auto">
                  {`{
  "id": "${id}",
  "timestamp": "2024-03-20T10:23:45Z",
  "actor": "${actor}",
  "action": "${action}",
  "target": "${target}",
  "outcome": "${outcome}",
  "reason": "${why}",
  "metadata": {
    "ip": "192.168.1.1",
    "ua": "Mozilla/5.0..."
  }
}`}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="font-semibold text-slate-900">Actor Details</h3>
              <div className="mt-6 flex items-center gap-4">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-slate-100">
                  <User className="h-6 w-6 text-slate-500" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900">{actor}</div>
                  <div className="text-sm text-slate-500">{actor.toLowerCase()}@acme.com</div>
                </div>
              </div>
              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Role</span>
                  <span className="font-medium text-slate-900">{actor}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">IP Address</span>
                  <span className="font-mono text-slate-900">197.10.20.2</span>
                </div>
              </div>
            </div>

            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="font-semibold text-slate-900">Timeline</h3>
              <div className="mt-6 space-y-6">
                <div className={`relative pl-6 before:absolute before:left-0 before:top-2 before:h-2 before:w-2 before:rounded-full ${isBlocked ? "before:bg-amber-400" : "before:bg-emerald-400"}`}>
                  <div className="text-sm font-medium text-slate-900">{isBlocked ? "Action Blocked" : "Action Completed"}</div>
                  <div className="text-xs text-slate-500">{when}</div>
                </div>
                <div className="relative pl-6 before:absolute before:left-0 before:top-2 before:h-2 before:w-2 before:rounded-full before:bg-slate-300">
                  <div className="text-sm font-medium text-slate-900">Request Initiated</div>
                  <div className="text-xs text-slate-500">{when}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

