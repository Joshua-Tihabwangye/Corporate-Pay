import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, X, AlertTriangle, Timer, FileText, MessageCircle, Flag, Copy, Info } from "lucide-react";
import { ApprovalsStorage, ApprovalItem, ApprovalStatus } from "../../utils/approvalsStorage";

const EVZ = { green: "#03CD8C", orange: "#F77F00" };

function cn(...p: Array<string | false | null | undefined>) {
  return p.filter(Boolean).join(" ");
}

function Pill({ label, tone = "neutral" }: { label: string; tone?: "good" | "warn" | "bad" | "info" | "neutral" }) {
  const map: Record<string, string> = {
    good: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    warn: "bg-amber-50 text-amber-800 ring-amber-200",
    bad: "bg-rose-50 text-rose-700 ring-rose-200",
    info: "bg-blue-50 text-blue-700 ring-blue-200",
    neutral: "bg-slate-50 text-slate-700 ring-slate-200",
  };
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1", map[tone])}>{label}</span>;
}

function toneForStatus(s: ApprovalStatus) {
  if (s === "Approved") return "good" as const;
  if (s === "Rejected") return "bad" as const;
  if (s === "Escalated") return "warn" as const;
  return "info" as const;
}

export default function ApprovalDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [item, setItem] = useState<ApprovalItem | null>(null);
  const [comment, setComment] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (id) {
      const found = ApprovalsStorage.getById(id);
      setItem(found || null);
    }
  }, [id]);

  const handleAction = (action: "Approve" | "Reject") => {
    if (!item) return;
    const newStatus: ApprovalStatus = action === "Approve" ? "Approved" : "Rejected";
    ApprovalsStorage.updateStatus(item.id, newStatus, comment || undefined);
    setSaved(true);
    setTimeout(() => navigate(-1), 1500);
  };

  if (!item) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500">Approval not found.</p>
          <button onClick={() => navigate(-1)} className="mt-4 text-emerald-600 underline">Go back</button>
        </div>
      </div>
    );
  }

  const canAct = item.status === "Pending" || item.status === "Escalated";

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Inbox
        </button>

        <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{item.requestType} Approval</h1>
              <p className="text-slate-500">{item.id}</p>
            </div>
            <Pill label={item.status} tone={toneForStatus(item.status)} />
          </div>

          {saved && (
            <div className="mb-6 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <span className="text-emerald-700 font-medium">Action saved successfully!</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="rounded-2xl border border-slate-200 p-4">
              <div className="text-xs text-slate-500 uppercase font-semibold mb-2">Amount</div>
              <div className="text-2xl font-bold text-slate-900">{item.currency} {item.amount.toLocaleString()}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4">
              <div className="text-xs text-slate-500 uppercase font-semibold mb-2">SLA Status</div>
              {item.sla.breached ? (
                <div className="flex items-center gap-2 text-rose-600 font-semibold text-lg">
                  <AlertTriangle className="h-5 w-5" /> Breached
                </div>
              ) : (
                <div className="flex items-center gap-2 text-slate-700 text-lg">
                  <Timer className="h-5 w-5" /> Due in {item.sla.dueIn}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 p-4 mb-6">
            <div className="text-xs text-slate-500 uppercase font-semibold mb-2">Details</div>
            <div className="space-y-2 text-sm text-slate-700">
              <div className="flex justify-between"><span className="text-slate-500">Organization</span><span className="font-semibold">{item.orgName}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Module</span><span className="font-semibold">{item.module}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Requester</span><span className="font-semibold">{item.requester}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Created</span><span className="font-semibold">{item.createdAt}</span></div>
              {item.workflow && <div className="flex justify-between"><span className="text-slate-500">Workflow</span><span className="font-semibold">{item.workflow}</span></div>}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 mb-6">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-slate-500 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-slate-900">Policy Reason</div>
                <div className="text-sm text-slate-700 mt-1">{item.policyWhy}</div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 p-4 mb-6">
            <div className="text-xs text-slate-500 uppercase font-semibold mb-3">Audit Trail</div>
            <div className="space-y-2">
              {item.auditTrail.map((a, idx) => (
                <div key={idx} className="flex justify-between text-sm border-b border-slate-100 pb-2 last:border-0">
                  <div>
                    <span className="font-semibold text-slate-900">{a.action}</span>
                    <span className="text-slate-500 ml-2">by {a.who}</span>
                  </div>
                  <span className="text-slate-400">{a.when}</span>
                </div>
              ))}
            </div>
          </div>

          {canAct && (
            <div className="rounded-2xl border border-slate-200 p-4 mb-6">
              <div className="text-xs text-slate-500 uppercase font-semibold mb-2">Add Comment</div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                placeholder="Optional comment for audit trail..."
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-4 focus:ring-emerald-100"
              />
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => navigate(-1)}
              className="flex-1 rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Back
            </button>
            {canAct && (
              <>
                <button
                  onClick={() => handleAction("Reject")}
                  className="flex-1 flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold text-white"
                  style={{ background: EVZ.orange }}
                >
                  <X className="h-4 w-4" /> Reject
                </button>
                <button
                  onClick={() => handleAction("Approve")}
                  className="flex-1 flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold text-white shadow-lg"
                  style={{ background: EVZ.green }}
                >
                  <CheckCircle2 className="h-4 w-4" /> Approve
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
