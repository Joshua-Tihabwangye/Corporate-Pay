import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Trash2, Layers, AlertTriangle, Check, Info, Plus, X, Edit2, GripVertical } from "lucide-react";
import { ApprovalStorage, ApprovalFlow, ApprovalStage, Channel } from "../../utils/approvalStorage";

const EVZ = { green: "#03CD8C", orange: "#F77F00" };

function uid() {
  return Math.random().toString(36).substr(2, 9);
}

export default function ApprovalWorkflowEdit() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isNew = id === "new";

  const [flow, setFlow] = useState<ApprovalFlow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [editingStage, setEditingStage] = useState<string | null>(null);

  // Stage draft state
  const [stageDraft, setStageDraft] = useState<ApprovalStage | null>(null);

  useEffect(() => {
    if (isNew) {
      setFlow({
        id: `F-${uid()}`,
        name: "New Workflow",
        status: "Draft",
        appliesTo: "Purchases",
        thresholdCurrency: "UGX",
        thresholdAmount: 100000,
        stages: [
          {
            id: `S-${uid()}`,
            name: "Manager Approval",
            type: "Manager",
            requiredApprovers: 1,
            delegatesAllowed: true,
            escalationAfter: "24h",
            notifyChannels: ["In-app", "Email"],
            note: "First level approval",
          },
        ],
        lastEdited: "Just now",
      });
    } else {
      const found = ApprovalStorage.getById(id!);
      if (found) {
        setFlow(found);
      } else {
        // Fallback for demo if id not found (shouldn't happen with correct storage usage)
        setFlow({
          id: id!,
          name: "Workflow not found",
          status: "Draft",
          appliesTo: "Purchases",
          thresholdCurrency: "UGX",
          thresholdAmount: 0,
          stages: [],
          lastEdited: "Now",
        });
      }
    }
    setLoading(false);
  }, [id, isNew]);

  const handleSave = () => {
    if (!flow) return;
    ApprovalStorage.save(flow);
    setSaved(true);
    setTimeout(() => navigate(-1), 1000);
  };

  const handleDelete = () => {
    if (!flow) return;
    if (confirm("Are you sure you want to delete this workflow?")) {
      ApprovalStorage.delete(flow.id);
      navigate(-1);
    }
  };

  const addStage = () => {
    if (!flow) return;
    const newStage: ApprovalStage = {
      id: `S-${uid()}`,
      name: "New Stage",
      type: "Custom",
      requiredApprovers: 1,
      delegatesAllowed: false,
      escalationAfter: "48h",
      notifyChannels: ["In-app"],
      note: "Description here",
    };
    setFlow({ ...flow, stages: [...flow.stages, newStage] });
    setEditingStage(newStage.id);
    setStageDraft(newStage);
  };

  const deleteStage = (stageId: string) => {
    if (!flow) return;
    if (confirm("Delete this stage?")) {
      setFlow({ ...flow, stages: flow.stages.filter((s) => s.id !== stageId) });
      if (editingStage === stageId) {
        setEditingStage(null);
        setStageDraft(null);
      }
    }
  };

  const startEditStage = (stage: ApprovalStage) => {
    setEditingStage(stage.id);
    setStageDraft({ ...stage });
  };

  const saveStageDraft = () => {
    if (!flow || !stageDraft) return;
    setFlow({
      ...flow,
      stages: flow.stages.map((s) => (s.id === stageDraft.id ? stageDraft : s)),
    });
    setEditingStage(null);
    setStageDraft(null);
  };

  const toggleChannel = (ch: Channel) => {
    if (!stageDraft) return;
    setStageDraft({
      ...stageDraft,
      notifyChannels: stageDraft.notifyChannels.includes(ch)
        ? stageDraft.notifyChannels.filter((c) => c !== ch)
        : [...stageDraft.notifyChannels, ch],
    });
  };

  if (loading || !flow) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Workflows
        </button>

        <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="grid h-14 w-14 place-items-center rounded-2xl text-white" style={{ background: EVZ.green }}>
                <Layers className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{isNew ? "Create Workflow" : "Edit Workflow"}</h1>
                <p className="text-slate-500">ID: {flow.id}</p>
              </div>
            </div>
            {!isNew && (
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100"
              >
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            )}
          </div>

          {saved && (
            <div className="mt-6 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 flex items-center gap-3">
              <Check className="h-5 w-5 text-emerald-600" />
              <span className="text-emerald-700 font-medium">Workflow saved successfully!</span>
            </div>
          )}

          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Workflow Name</label>
                <input
                  value={flow.name}
                  onChange={(e) => setFlow({ ...flow, name: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Applies To</label>
                <select
                  value={flow.appliesTo}
                  onChange={(e) => setFlow({ ...flow, appliesTo: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-emerald-100"
                >
                  <option>Purchases</option>
                  <option>Payouts</option>
                  <option>Refunds</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Status</label>
                <select
                  value={flow.status}
                  onChange={(e) => setFlow({ ...flow, status: e.target.value as any })}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-emerald-100"
                >
                  <option>Draft</option>
                  <option>Active</option>
                  <option>Archived</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Auto-Approve Under</label>
                <div className="flex gap-2">
                  <select
                    value={flow.thresholdCurrency}
                    onChange={(e) => setFlow({ ...flow, thresholdCurrency: e.target.value })}
                    className="w-24 rounded-2xl border border-slate-200 px-3 py-3 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-emerald-100"
                  >
                    <option>UGX</option>
                    <option>USD</option>
                    <option>KES</option>
                  </select>
                  <input
                    value={flow.thresholdAmount}
                    onChange={(e) => setFlow({ ...flow, thresholdAmount: Number(e.target.value) || 0 })}
                    className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-emerald-100"
                    type="number"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 border-t border-slate-100 pt-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Approval Stages</h2>
                <p className="text-sm text-slate-500">Define the sequential approval chain</p>
              </div>
              <button
                onClick={addStage}
                className="flex items-center gap-2 rounded-xl border-2 border-dashed border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
              >
                <Plus className="h-4 w-4" /> Add Stage
              </button>
            </div>

            <div className="space-y-4">
              {flow.stages.map((stage, index) => (
                <div
                  key={stage.id}
                  className={`relative rounded-2xl border transition-all ${
                    editingStage === stage.id ? "border-emerald-500 ring-4 ring-emerald-50 bg-white" : "border-slate-200 bg-slate-50"
                  }`}
                >
                  {editingStage === stage.id && stageDraft ? (
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-slate-900">Edit Stage {index + 1}</h3>
                        <button onClick={() => setEditingStage(null)} className="text-slate-400 hover:text-slate-600">
                          <X className="h-5 w-5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="text-xs font-semibold text-slate-500 uppercase">Stage Name</label>
                          <input
                            value={stageDraft.name}
                            onChange={(e) => setStageDraft({ ...stageDraft, name: e.target.value })}
                            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-500 uppercase">Approver Role</label>
                          <select
                            value={stageDraft.type}
                            onChange={(e) => setStageDraft({ ...stageDraft, type: e.target.value as any })}
                            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                          >
                            <option value="Manager">Manager</option>
                            <option value="Finance">Finance</option>
                            <option value="Risk">Risk</option>
                            <option value="Custom">Custom</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-500 uppercase">Required Approvers</label>
                          <input
                            type="number"
                            value={stageDraft.requiredApprovers}
                            onChange={(e) => setStageDraft({ ...stageDraft, requiredApprovers: Number(e.target.value) || 1 })}
                            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-500 uppercase">Escalation After</label>
                          <input
                            value={stageDraft.escalationAfter}
                            onChange={(e) => setStageDraft({ ...stageDraft, escalationAfter: e.target.value })}
                            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                          />
                        </div>
                      </div>

                      <div className="mb-6">
                        <label className="text-xs font-semibold text-slate-500 uppercase block mb-2">Notification Channels</label>
                        <div className="flex flex-wrap gap-2">
                          {(["In-app", "Email", "WhatsApp", "WeChat", "SMS"] as Channel[]).map((ch) => (
                            <button
                              key={ch}
                              onClick={() => toggleChannel(ch)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                                stageDraft.notifyChannels.includes(ch)
                                  ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                              }`}
                            >
                              {ch}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <button
                          onClick={() => deleteStage(stage.id)}
                          className="px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 rounded-xl mr-auto"
                        >
                          Delete Stage
                        </button>
                        <button
                          onClick={() => setEditingStage(null)}
                          className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={saveStageDraft}
                          className="px-6 py-2 text-sm font-semibold text-white rounded-xl shadow-lg"
                          style={{ background: EVZ.green }}
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                        <div className="grid h-8 w-8 place-items-center rounded-full bg-white border border-slate-200 text-sm font-bold text-slate-500">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{stage.name}</div>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span>{stage.type}</span>
                            <span className="h-1 w-1 rounded-full bg-slate-300" />
                            <span>{stage.requiredApprovers} approver{stage.requiredApprovers > 1 ? "s" : ""}</span>
                            <span className="h-1 w-1 rounded-full bg-slate-300" />
                            <span>{stage.notifyChannels.length} channels</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => startEditStage(stage)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteStage(stage.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {!flow.stages.length && (
                <div className="text-center py-10 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400">
                  <p>No stages defined yet.</p>
                  <button onClick={addStage} className="mt-2 text-sm font-semibold text-emerald-600 hover:underline">
                    Add the first stage
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between">
            <div className="text-sm text-slate-500 flex items-center gap-2">
              <Info className="h-4 w-4" />
              Changes saved to local storage
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate(-1)}
                className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Back
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold text-white shadow-lg"
                style={{ background: EVZ.green }}
              >
                <Save className="h-4 w-4" /> Save Workflow
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
