import React from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, LogIn, MapPin, Smartphone, ShieldAlert, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

export default function SecurityLoginDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();

  const result = searchParams.get("result") || "Success";
  const risk = searchParams.get("risk") || "Low";
  const device = searchParams.get("device") || "Unknown Device";
  const location = searchParams.get("location") || "Unknown Location";
  const ip = searchParams.get("ip") || "0.0.0.0";
  const when = searchParams.get("when") || "Unknown time";
  const reason = searchParams.get("reason") || "";

  const isFailed = result === "Failed";
  const isHighRisk = risk === "High";
  const isMediumRisk = risk === "Medium";

  const riskScore = isHighRisk ? 85 : isMediumRisk ? 45 : 5;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Logins
        </button>

        <div className={`rounded-[32px] border p-8 shadow-sm ${isHighRisk ? "border-rose-200 bg-rose-50" : isMediumRisk ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white"}`}>
          <div className="flex items-center gap-6">
            <div className={`grid h-20 w-20 place-items-center rounded-full ${isHighRisk ? "bg-rose-100" : isMediumRisk ? "bg-amber-100" : "bg-slate-100"}`}>
              <LogIn className={`h-10 w-10 ${isHighRisk ? "text-rose-600" : isMediumRisk ? "text-amber-600" : "text-slate-600"}`} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Login Attempt</h1>
              <p className="text-slate-500">Event ID: {id}</p>
              <p className="text-xs text-slate-400 mt-1">{when}</p>
            </div>
            <div className="ml-auto">
              <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${isFailed ? "bg-amber-100 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
                {isFailed ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                {result}
              </span>
            </div>
          </div>

          <div className="mt-8 border-t border-slate-100 pt-8">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div className="space-y-6">
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                    <MapPin className="h-4 w-4" /> Location
                  </h3>
                  <div className="mt-2 text-lg font-medium text-slate-900">{location}</div>
                  <div className="text-sm text-slate-500">IP: {ip}</div>
                </div>

                <div>
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                    <Smartphone className="h-4 w-4" /> Device
                  </h3>
                  <div className="mt-2 text-lg font-medium text-slate-900">{device}</div>
                </div>

                {reason && (
                  <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
                    <div className="flex items-center gap-2 text-amber-700 font-semibold text-sm">
                      <AlertTriangle className="h-4 w-4" /> Reason
                    </div>
                    <div className="mt-1 text-sm text-amber-800">{reason}</div>
                  </div>
                )}
              </div>

              <div className={`rounded-3xl p-6 ${isHighRisk ? "bg-rose-100" : isMediumRisk ? "bg-amber-100" : "bg-slate-50"}`}>
                <h3 className="flex items-center gap-2 font-semibold text-slate-900">
                  <ShieldAlert className={`h-5 w-5 ${isHighRisk ? "text-rose-500" : isMediumRisk ? "text-amber-500" : "text-slate-500"}`} /> Risk Analysis
                </h3>
                <div className="mt-4 space-y-4">
                  <div className="flex justify-between border-b border-slate-200 pb-2 text-sm">
                    <span className="text-slate-600">Geo Velocity</span>
                    <span className={`font-medium ${isHighRisk ? "text-rose-600" : isMediumRisk ? "text-amber-600" : "text-emerald-600"}`}>
                      {isHighRisk ? "Anomaly Detected" : isMediumRisk ? "Suspicious" : "Normal"}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-2 text-sm">
                    <span className="text-slate-600">Device Reputation</span>
                    <span className={`font-medium ${isHighRisk ? "text-rose-600" : isMediumRisk ? "text-amber-600" : "text-emerald-600"}`}>
                      {isHighRisk ? "Untrusted" : isMediumRisk ? "Unknown" : "Trusted"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Overall Risk Score</span>
                    <span className={`font-bold ${isHighRisk ? "text-rose-700" : isMediumRisk ? "text-amber-700" : "text-slate-900"}`}>
                      {riskScore}/100 ({risk})
                    </span>
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

