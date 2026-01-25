import React, { useState } from "react";
import { ArrowRight, Check, ChevronRight, Lock, MessageSquare, Send, Shield, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

export default function AccessRequest() {
  const navigate = useNavigate();
  const [role, setRole] = useState("Finance");
  const [reason, setReason] = useState("");
  const [sent, setSent] = useState(false);

  const roles = [
    {
        id: "Finance",
        label: "Finance Controller",
        desc: "Full access to billing, budgets, invoices, and reports.",
        icon: <User className="h-5 w-5" />
    },
    {
        id: "Admin",
        label: "Organization Admin",
        desc: "Manage users, settings, and integrations.",
        icon: <Shield className="h-5 w-5" />
    },
    {
        id: "Approver",
        label: "Approver",
        desc: "Approve or reject requests within budget limits.",
        icon: <Check className="h-5 w-5" />
    }
  ];

  if (sent) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
            <div className="bg-white max-w-md w-full rounded-3xl p-8 border border-slate-200 text-center shadow-lg">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Send className="h-8 w-8" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Request Sent!</h2>
                <p className="text-slate-600 mb-8">
                    Your request for <strong>{roles.find(r => r.id === role)?.label}</strong> access has been sent to the organization administrators. You will be notified via email once reviewed.
                </p>
                <button
                    onClick={() => navigate("/console/dashboard")}
                    className="w-full bg-slate-900 text-white rounded-xl py-3 font-semibold hover:bg-slate-800 transition-colors"
                >
                    Back to Dashboard
                </button>
            </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 flex items-center justify-center">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900">Request Access Upgrade</h1>
              <p className="text-slate-500 mt-1 text-sm">Request additional permissions for your account.</p>
            </div>
            <div className="h-10 w-10 bg-amber-50 rounded-full flex items-center justify-center text-amber-600">
              <Lock className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="p-8">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Select Role</h3>
            <div className="grid grid-cols-1 gap-3 mb-8">
                {roles.map((r) => (
                    <button
                        key={r.id}
                        onClick={() => setRole(r.id)}
                        className={cn(
                            "flex items-start gap-4 p-4 rounded-2xl border text-left transition-all",
                            role === r.id
                                ? "border-slate-900 bg-slate-50 ring-1 ring-slate-900"
                                : "border-slate-200 hover:border-slate-300 bg-white"
                        )}
                    >
                        <div className={cn("p-2 rounded-lg", role === r.id ? "bg-white shadow-sm text-slate-900" : "bg-slate-100 text-slate-500")}>
                            {r.icon}
                        </div>
                        <div>
                            <div className="font-semibold text-slate-900">{r.label}</div>
                            <div className="text-xs text-slate-500 mt-1">{r.desc}</div>
                        </div>
                        {role === r.id && <div className="ml-auto text-slate-900"><Check className="h-5 w-5" /></div>}
                    </button>
                ))}
            </div>

            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Justification</h3>
            <div className="relative">
                <MessageSquare className="absolute top-3 left-3 h-5 w-5 text-slate-400" />
                <textarea
                    className="w-full pl-10 p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 min-h-[120px] text-sm"
                    placeholder="Why do you need this access? Please explain briefly..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                />
            </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="text-slate-500 hover:text-slate-700 font-semibold text-sm px-4 py-2"
          >
            Cancel
          </button>
          <button
            onClick={() => setSent(true)}
            disabled={!reason.trim()}
            className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition-colors shadow-lg shadow-slate-900/10"
          >
            Submit Request <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
