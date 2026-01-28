import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Key, User, Clock, ShieldCheck, RefreshCw } from "lucide-react";

export default function SecurityKeyDetail() {
  const navigate = useNavigate();
  const { keyId } = useParams();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Keys
        </button>

        <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex items-start gap-6">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-amber-50 text-amber-600">
              <Key className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">API Key Rotation</h1>
              <p className="text-slate-500">Key ID: {keyId}</p>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-slate-100 p-6">
              <h2 className="mb-4 font-semibold text-slate-900">Event Details</h2>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <RefreshCw className="mt-0.5 h-5 w-5 text-slate-400" />
                  <div>
                    <div className="text-sm font-medium text-slate-900">Action Type</div>
                    <div className="text-sm text-slate-500">Manual Rotation</div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Clock className="mt-0.5 h-5 w-5 text-slate-400" />
                  <div>
                    <div className="text-sm font-medium text-slate-900">Timestamp</div>
                    <div className="text-sm text-slate-500">Today, 10:45 AM</div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <User className="mt-0.5 h-5 w-5 text-slate-400" />
                  <div>
                    <div className="text-sm font-medium text-slate-900">Initiated By</div>
                    <div className="text-sm text-slate-500">Admin User</div>
                  </div>
                </li>
              </ul>
            </div>

            <div className="rounded-3xl border border-slate-100 p-6">
              <h2 className="mb-4 font-semibold text-slate-900">Security Context</h2>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-500" />
                  <div>
                    <div className="text-sm font-medium text-slate-900">Dual Control</div>
                    <div className="text-sm text-slate-500">Verified (2 Approvers)</div>
                  </div>
                </li>
              </ul>
              
              <div className="mt-6 rounded-xl bg-slate-50 p-4 text-xs text-slate-500">
                The previous key version will remain active for 24 hours to allow for graceful rollover.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
