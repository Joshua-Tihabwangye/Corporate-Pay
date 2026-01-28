import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Trash2, ShieldCheck, AlertTriangle, Check, Info, Plus, X } from "lucide-react";

const EVZ = { green: "#03CD8C", orange: "#F77F00" };

type Severity = "Allow" | "Require approval" | "Require attestation" | "Block";

export default function PolicyEdit() {
  const navigate = useNavigate();
  const { policyId } = useParams();
  const isNew = policyId === "new";

  const [name, setName] = useState(isNew ? "New Policy" : "CorporatePay high value requires approval");
  const [status, setStatus] = useState<"Draft" | "Active" | "Archived">("Draft");
  const [action, setAction] = useState<Severity>("Require approval");
  const [module, setModule] = useState("CorporatePay");
  const [amountThreshold, setAmountThreshold] = useState("500000");
  const [reason, setReason] = useState("Above approval threshold");
  const [requireAttachment, setRequireAttachment] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => navigate(-1), 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Policies
        </button>

        <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="grid h-14 w-14 place-items-center rounded-2xl text-white" style={{ background: EVZ.green }}>
                <ShieldCheck className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{isNew ? "Create Policy" : "Edit Policy"}</h1>
                <p className="text-slate-500">ID: {policyId}</p>
              </div>
            </div>
            {!isNew && (
              <button className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100">
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            )}
          </div>

          {saved && (
            <div className="mt-6 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 flex items-center gap-3">
              <Check className="h-5 w-5 text-emerald-600" />
              <span className="text-emerald-700 font-medium">Policy saved successfully!</span>
            </div>
          )}

          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Policy Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Module</label>
                <select
                  value={module}
                  onChange={(e) => setModule(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-emerald-100"
                >
                  <option>CorporatePay</option>
                  <option>E-Commerce</option>
                  <option>Services</option>
                  <option>EV Charging</option>
                  <option>Rides & Logistics</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Amount Threshold (UGX)</label>
                <input
                  value={amountThreshold}
                  onChange={(e) => setAmountThreshold(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-emerald-100"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Action</label>
                <select
                  value={action}
                  onChange={(e) => setAction(e.target.value as Severity)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-emerald-100"
                >
                  <option>Allow</option>
                  <option>Require approval</option>
                  <option>Require attestation</option>
                  <option>Block</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-emerald-100"
                >
                  <option>Draft</option>
                  <option>Active</option>
                  <option>Archived</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Reason</label>
                <input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-emerald-100"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={requireAttachment}
                onChange={(e) => setRequireAttachment(e.target.checked)}
                className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm font-medium text-slate-700">Require attachment for this policy</span>
            </label>
          </div>

          <div className="mt-8 flex items-center justify-between">
            <div className="text-sm text-slate-500 flex items-center gap-2">
              <Info className="h-4 w-4" />
              Draft policies must be activated to take effect
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate(-1)}
                className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold text-white shadow-lg"
                style={{ background: EVZ.green }}
              >
                <Save className="h-4 w-4" /> Save Policy
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
