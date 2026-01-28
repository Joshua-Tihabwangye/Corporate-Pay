import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ShieldCheck, Clock, User, FileText, Download, Share2 } from "lucide-react";

export default function SecurityDetail() {
  const navigate = useNavigate();
  const { id } = useParams();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="grid h-16 w-16 place-items-center rounded-3xl bg-emerald-50 text-emerald-600">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Security Event Details</h1>
                <p className="mt-1 text-slate-500">ID: {id || "Unknown"}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-50">
                <Share2 className="h-4 w-4" /> Share
              </button>
              <button className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
                <Download className="h-4 w-4" /> Export
              </button>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <div className="rounded-3xl bg-slate-50 p-6">
                <h3 className="font-semibold text-slate-900">Event Summary</h3>
                <div className="mt-4 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                    <span className="text-sm text-slate-500">Timestamp</span>
                    <span className="text-sm font-medium text-slate-900">2024-03-20 14:32:11 UTC</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                    <span className="text-sm text-slate-500">Event Type</span>
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                      Policy Change
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                    <span className="text-sm text-slate-500">Severity</span>
                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      Low
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Status</span>
                    <span className="text-sm font-medium text-slate-900">Completed</span>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-900">Technical Details</h3>
                <div className="mt-4 font-mono text-xs text-slate-600">
                  <p>Client IP: 192.168.1.1</p>
                  <p>User Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)...</p>
                  <p>Session ID: sess_8923748923</p>
                  <p>Request ID: req_7823647823</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-900">Actor</h3>
                <div className="mt-4 flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-slate-100">
                    <User className="h-5 w-5 text-slate-500" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-900">Sarah Finance</div>
                    <div className="text-xs text-slate-500">finance@acme.com</div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-900">Related Resources</h3>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                    <FileText className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-600">Policy Document v2</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
