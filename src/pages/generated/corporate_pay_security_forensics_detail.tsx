import React from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Sparkles, FolderArchive, ArrowDownToLine, Loader2, CheckCircle, FileText, Clock, XCircle } from "lucide-react";

export default function SecurityForensicsDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();

  const status = searchParams.get("status") || "Queued";
  const scope = searchParams.get("scope") || "Unknown Scope";
  const createdAt = searchParams.get("createdAt") || "Unknown time";
  const includesParam = searchParams.get("includes") || "";
  const includes = includesParam ? includesParam.split(",") : ["audit", "hashes"];

  const isReady = status === "Ready";
  const isFailed = status === "Failed";
  const isRunning = status === "Running";
  const isQueued = status === "Queued";

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Forensics
        </button>

        <div className={`rounded-[32px] border p-8 shadow-sm ${isReady ? "border-emerald-200 bg-emerald-50" : isFailed ? "border-rose-200 bg-rose-50" : "border-slate-200 bg-white"}`}>
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-6">
              <div className={`grid h-20 w-20 place-items-center rounded-3xl ${isReady ? "bg-emerald-100 text-emerald-600" : isFailed ? "bg-rose-100 text-rose-600" : "bg-indigo-50 text-indigo-600"}`}>
                <FolderArchive className="h-10 w-10" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Forensics Export</h1>
                <p className="text-slate-500">Job ID: {id}</p>
                <p className="text-xs text-slate-400 mt-1">Scope: {scope}</p>
              </div>
            </div>
            {isReady ? (
              <button className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 font-semibold text-white shadow-lg shadow-emerald-200 hover:bg-emerald-700">
                <ArrowDownToLine className="h-5 w-5" /> Download Archive
              </button>
            ) : (
              <button disabled className="flex items-center gap-2 rounded-2xl bg-slate-300 px-6 py-3 font-semibold text-slate-500 cursor-not-allowed">
                <ArrowDownToLine className="h-5 w-5" /> Not Available
              </button>
            )}
          </div>

          <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="rounded-3xl border border-slate-200 p-6 bg-white/80">
                <h3 className="font-semibold text-slate-900">Contents</h3>
                <div className="mt-4 space-y-3">
                  {includes.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                      <FileText className="h-5 w-5 text-slate-400" />
                      <span className="text-sm font-medium text-slate-700 capitalize">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className={`rounded-3xl p-6 ${isReady ? "bg-emerald-100" : isFailed ? "bg-rose-100" : "bg-slate-50"}`}>
                <h3 className="font-semibold text-slate-900">Status</h3>
                <div className={`mt-4 flex items-center gap-2 ${isReady ? "text-emerald-600" : isFailed ? "text-rose-600" : isRunning ? "text-blue-600" : "text-slate-600"}`}>
                  {isReady ? <CheckCircle className="h-5 w-5" /> : isFailed ? <XCircle className="h-5 w-5" /> : isRunning ? <Loader2 className="h-5 w-5 animate-spin" /> : <Clock className="h-5 w-5" />}
                  <span className="font-medium">
                    {isReady ? "Ready for Download" : isFailed ? "Export Failed" : isRunning ? "Processing..." : "Queued"}
                  </span>
                </div>
                <div className="mt-2 text-sm text-slate-500">Created: {createdAt}</div>
                {isReady && <div className="mt-1 text-sm text-slate-500">Size: 42.5 MB</div>}
                {isFailed && <div className="mt-1 text-sm text-rose-600">Please try again or contact support.</div>}
              </div>

              <div className="rounded-3xl border border-slate-200 p-6 bg-white">
                <h3 className="flex items-center gap-2 font-semibold text-slate-900">
                  <Sparkles className="h-4 w-4 text-amber-500" /> Legal Hold
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  This export is immutable and logged in the audit trail.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

