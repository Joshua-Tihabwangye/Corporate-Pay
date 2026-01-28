import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Play, Plus, FileText, Check, AlertTriangle, Clock } from "lucide-react";

const EVZ = { green: "#03CD8C", orange: "#F77F00" };

type ScenarioResult = "Pass" | "Fail" | "Warning" | "Pending";

type Scenario = {
  id: string;
  name: string;
  description: string;
  module: string;
  expectedDecision: string;
  result: ScenarioResult;
  lastRun: string;
};

export default function PolicyScenarios() {
  const navigate = useNavigate();
  const [running, setRunning] = useState(false);

  const [scenarios, setScenarios] = useState<Scenario[]>([
    { id: "SC-1", name: "High value CorporatePay", description: "Transaction above 500k UGX", module: "CorporatePay", expectedDecision: "Require approval", result: "Pass", lastRun: "2 hours ago" },
    { id: "SC-2", name: "Missing cost center", description: "No cost center assigned", module: "CorporatePay", expectedDecision: "Block", result: "Pass", lastRun: "2 hours ago" },
    { id: "SC-3", name: "Large refund with attachment", description: "Refund over 150k UGX", module: "E-Commerce", expectedDecision: "Require attestation", result: "Warning", lastRun: "1 day ago" },
    { id: "SC-4", name: "Blocked vendor attempt", description: "Vendor contains 'banned'", module: "Marketplace", expectedDecision: "Block", result: "Pending", lastRun: "Never" },
    { id: "SC-5", name: "Normal low value transaction", description: "Transaction under threshold", module: "Services", expectedDecision: "Allow", result: "Pass", lastRun: "2 hours ago" },
  ]);

  const runAll = () => {
    setRunning(true);
    setTimeout(() => {
      setScenarios((prev) =>
        prev.map((s) => ({
          ...s,
          result: Math.random() > 0.2 ? "Pass" : Math.random() > 0.5 ? "Warning" : "Fail",
          lastRun: "Just now",
        }))
      );
      setRunning(false);
    }, 2000);
  };

  const getResultStyles = (result: ScenarioResult) => {
    switch (result) {
      case "Pass":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Fail":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "Warning":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const getResultIcon = (result: ScenarioResult) => {
    switch (result) {
      case "Pass":
        return <Check className="h-4 w-4" />;
      case "Fail":
        return <AlertTriangle className="h-4 w-4" />;
      case "Warning":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const passCount = scenarios.filter((s) => s.result === "Pass").length;
  const failCount = scenarios.filter((s) => s.result === "Fail").length;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Policies
        </button>

        <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="grid h-14 w-14 place-items-center rounded-2xl text-white" style={{ background: EVZ.orange }}>
                <FileText className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Policy Scenarios</h1>
                <p className="text-slate-500">Test your policies with predefined scenarios</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50">
                <Plus className="h-4 w-4" /> Add Scenario
              </button>
              <button
                onClick={runAll}
                disabled={running}
                className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-lg disabled:opacity-50"
                style={{ background: EVZ.green }}
              >
                <Play className="h-4 w-4" /> {running ? "Running..." : "Run All"}
              </button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-center">
              <div className="text-2xl font-bold text-emerald-700">{passCount}</div>
              <div className="text-sm text-emerald-600">Passing</div>
            </div>
            <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-center">
              <div className="text-2xl font-bold text-rose-700">{failCount}</div>
              <div className="text-sm text-rose-600">Failing</div>
            </div>
            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 text-center">
              <div className="text-2xl font-bold text-slate-700">{scenarios.length}</div>
              <div className="text-sm text-slate-600">Total</div>
            </div>
          </div>

          <div className="mt-8 space-y-3">
            {scenarios.map((s) => (
              <div
                key={s.id}
                className={`rounded-2xl border p-4 transition-all hover:shadow-md ${getResultStyles(s.result)}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold">{s.name}</span>
                      <span className="text-xs px-2 py-1 rounded-full bg-white/50">{s.module}</span>
                    </div>
                    <div className="mt-1 text-sm opacity-80">{s.description}</div>
                    <div className="mt-2 text-xs opacity-60">Expected: {s.expectedDecision} • Last run: {s.lastRun}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getResultIcon(s.result)}
                    <span className="font-semibold">{s.result}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
