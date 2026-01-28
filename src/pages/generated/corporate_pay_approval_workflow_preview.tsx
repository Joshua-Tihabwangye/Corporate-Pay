import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Play, RefreshCw, CheckCircle2, Clock, AlertTriangle, User, MessageSquare } from "lucide-react";

const EVZ = { green: "#03CD8C", orange: "#F77F00" };

type SimulationStep = {
  id: string;
  name: string;
  status: "Pending" | "in_progress" | "Approved" | "Rejected";
  approvers: string[];
  comments?: string;
  timestamp?: string;
};

export default function ApprovalWorkflowPreview() {
  const navigate = useNavigate();
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState<SimulationStep[]>([
    { id: "1", name: "Request Submission", status: "Approved", approvers: ["John Doe"], timestamp: "Just now" },
    { id: "2", name: "Manager Approval", status: "Pending", approvers: ["Sarah Manager"] },
    { id: "3", name: "Finance Review", status: "Pending", approvers: ["Finance Team"] },
  ]);

  const runSimulation = () => {
    setRunning(true);
    // Reset
    setSteps([
      { id: "1", name: "Request Submission", status: "Approved", approvers: ["John Doe"], timestamp: "Just now" },
      { id: "2", name: "Manager Approval", status: "in_progress", approvers: ["Sarah Manager"] },
      { id: "3", name: "Finance Review", status: "Pending", approvers: ["Finance Team"] },
    ]);

    // Simulate progress
    setTimeout(() => {
      setSteps(prev => prev.map(s => s.id === "2" ? { ...s, status: "Approved", timestamp: "2 mins later", comments: "Approved via WhatsApp" } : s));
      setSteps(prev => prev.map(s => s.id === "3" ? { ...s, status: "in_progress" } : s));
    }, 2000);

    setTimeout(() => {
      setSteps(prev => prev.map(s => s.id === "3" ? { ...s, status: "Approved", timestamp: "5 mins later", comments: "Budget verified" } : s));
      setRunning(false);
    }, 4500);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Workflow Simulator</h1>
              <p className="text-slate-500">Preview how approvals flow in real-time</p>
            </div>
            <button
              onClick={runSimulation}
              disabled={running}
              className="flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-lg disabled:opacity-50 transition-all hover:scale-105"
              style={{ background: running ? "#64748b" : EVZ.green }}
            >
              {running ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {running ? "Simulating..." : "Start Simulation"}
            </button>
          </div>

          <div className="relative pl-8 border-l-2 border-slate-100 space-y-8">
            {steps.map((step, index) => (
              <div key={step.id} className="relative">
                <div className={`absolute -left-[41px] flex h-8 w-8 items-center justify-center rounded-full border-4 border-white ${
                  step.status === "Approved" ? "bg-emerald-500 text-white" :
                  step.status === "in_progress" ? "bg-amber-500 text-white animate-pulse" :
                  "bg-slate-200 text-slate-400"
                }`}>
                  {step.status === "Approved" ? <CheckCircle2 className="h-4 w-4" /> :
                   step.status === "in_progress" ? <Clock className="h-4 w-4" /> :
                   <span className="text-xs font-bold">{index + 1}</span>}
                </div>

                <div className={`rounded-2xl border p-5 transition-all ${
                  step.status === "in_progress" ? "border-amber-200 bg-amber-50 shadow-md transform scale-105" :
                  "border-slate-200 bg-white"
                }`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-slate-900">{step.name}</h3>
                      <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                        <User className="h-3 w-3" />
                        {step.approvers.join(", ")}
                      </div>
                    </div>
                    {step.timestamp && (
                      <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">
                        {step.timestamp}
                      </span>
                    )}
                  </div>
                  
                  {step.comments && (
                    <div className="mt-4 flex gap-3 text-sm bg-white/50 p-3 rounded-xl border border-slate-200/50">
                      <MessageSquare className="h-4 w-4 text-slate-400 mt-0.5" />
                      <span className="text-slate-600 italic">"{step.comments}"</span>
                    </div>
                  )}

                  {step.status === "in_progress" && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-amber-700 font-medium">
                      <Clock className="h-3 w-3" /> Waiting for approval...
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
