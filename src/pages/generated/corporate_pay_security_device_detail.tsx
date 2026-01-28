import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Smartphone, Shield, Globe, Clock, Ban, CheckCircle } from "lucide-react";

export default function SecurityDeviceDetail() {
  const navigate = useNavigate();
  const { id } = useParams();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Devices
          </button>
        </div>

        <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-4">
              <div className="grid h-16 w-16 place-items-center rounded-3xl bg-slate-100 text-slate-600">
                <Smartphone className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Chrome on MacBook Pro</h1>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                    ID: {id}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                    Trusted
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100">
                <Ban className="h-4 w-4" /> Revoke Trust
              </button>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-3xl bg-slate-50 p-6">
              <div className="flex items-center gap-3 text-slate-900">
                <Shield className="h-5 w-5 text-slate-500" />
                <h3 className="font-semibold">Security Score</h3>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-bold text-slate-900">Low Risk</div>
                <p className="mt-1 text-sm text-slate-500">No anomalies detected</p>
              </div>
            </div>

            <div className="rounded-3xl bg-slate-50 p-6">
              <div className="flex items-center gap-3 text-slate-900">
                <Globe className="h-5 w-5 text-slate-500" />
                <h3 className="font-semibold">Location</h3>
              </div>
              <div className="mt-4">
                <div className="text-lg font-semibold text-slate-900">Kampala, Uganda</div>
                <p className="text-sm text-slate-500">IP: 197.23.12.44</p>
              </div>
            </div>

            <div className="rounded-3xl bg-slate-50 p-6">
              <div className="flex items-center gap-3 text-slate-900">
                <Clock className="h-5 w-5 text-slate-500" />
                <h3 className="font-semibold">Activity</h3>
              </div>
              <div className="mt-4">
                <div className="text-lg font-semibold text-slate-900">Active Now</div>
                <p className="text-sm text-slate-500">First seen: 20 days ago</p>
              </div>
            </div>
          </div>

          <div className="mt-10">
            <h3 className="font-semibold text-slate-900">Device Fingerprint</h3>
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <code className="text-sm text-slate-600">
                Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
