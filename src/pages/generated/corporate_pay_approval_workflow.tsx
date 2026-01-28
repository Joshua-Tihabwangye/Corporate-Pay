import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  AlertTriangle,
  BadgeCheck,
  Check,
  ChevronRight,
  Info,
  Layers,
  Lock,
  Plus,
  Sparkles,
  Timer,
  X,
} from "lucide-react";
import { ApprovalStorage, ApprovalFlow, ApprovalStage, Channel } from "../../utils/approvalStorage";

const EVZ = { green: "#03CD8C", orange: "#F77F00" };

type OrgRole = "Viewer" | "Member" | "Approver" | "Finance" | "Admin" | "Owner";
type OrgStatus = "Active" | "Deposit depleted" | "Suspended" | "Needs verification";
type Org = { id: string; name: string; role: OrgRole; status: OrgStatus };

type Toast = { id: string; title: string; message?: string; kind: "success" | "warn" | "error" | "info" };

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}
function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}
function formatUGX(amount: number) {
  const num = Math.abs(amount).toLocaleString(undefined, { maximumFractionDigits: 0 });
  return `UGX ${num}`;
}

function Pill({ label, tone = "neutral" }: { label: string; tone?: "good" | "warn" | "bad" | "info" | "neutral" }) {
  const map: Record<string, string> = {
    good: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    warn: "bg-amber-50 text-amber-800 ring-amber-200",
    bad: "bg-rose-50 text-rose-700 ring-rose-200",
    info: "bg-blue-50 text-blue-700 ring-blue-200",
    neutral: "bg-slate-50 text-slate-700 ring-slate-200",
  };
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1", map[tone])}>{label}</span>;
}

function toneForOrgStatus(s: OrgStatus) {
  if (s === "Active") return "good" as const;
  if (s === "Deposit depleted") return "warn" as const;
  if (s === "Needs verification") return "warn" as const;
  return "bad" as const;
}

function Button({
  variant = "outline",
  className,
  children,
  onClick,
  disabled,
  title,
}: {
  variant?: "primary" | "accent" | "outline" | "ghost";
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
}) {
  const base = "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-4";
  const variants: Record<string, string> = {
    primary: "text-white shadow-[0_12px_24px_rgba(3,205,140,0.22)] hover:opacity-95 focus:ring-emerald-200",
    accent: "text-white shadow-[0_12px_24px_rgba(247,127,0,0.22)] hover:opacity-95 focus:ring-orange-200",
    outline: "border border-slate-200 bg-white text-slate-800 shadow-sm hover:bg-slate-50 focus:ring-slate-200",
    ghost: "bg-transparent text-slate-700 hover:bg-slate-100 focus:ring-slate-200",
  };
  const style = variant === "primary" ? { background: EVZ.green } : variant === "accent" ? { background: EVZ.orange } : undefined;
  return (
    <button type="button" title={title} disabled={disabled} onClick={onClick} style={style} className={cn(base, variants[variant], disabled && "cursor-not-allowed opacity-60", className)}>
      {children}
    </button>
  );
}

function ToastStack({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 w-[min(460px,calc(100vw-2rem))] space-y-2">
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="pointer-events-auto rounded-3xl border border-slate-200 bg-white/90 p-3 shadow-[0_18px_45px_rgba(2,8,23,0.18)] backdrop-blur"
          >
            <div className="flex items-start gap-3">
              <div className={cn("mt-0.5 grid h-9 w-9 place-items-center rounded-2xl", t.kind === "success" ? "bg-emerald-50 text-emerald-700" : t.kind === "warn" ? "bg-amber-50 text-amber-800" : t.kind === "error" ? "bg-rose-50 text-rose-700" : "bg-blue-50 text-blue-700")}>
                {t.kind === "warn" || t.kind === "error" ? <AlertTriangle className="h-5 w-5" /> : <BadgeCheck className="h-5 w-5" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-slate-900">{t.title}</div>
                {t.message ? <div className="mt-0.5 text-sm text-slate-600">{t.message}</div> : null}
              </div>
              <button className="rounded-2xl p-2 text-slate-500 hover:bg-slate-100" onClick={() => onDismiss(t.id)} aria-label="Dismiss">
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function Section({ title, subtitle, right, children }: { title: string; subtitle?: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">{title}</div>
          {subtitle ? <div className="mt-1 text-xs text-slate-500">{subtitle}</div> : null}
        </div>
        {right}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-100"
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

export default function ApprovalWorkflowBuilder() {
  const navigate = useNavigate();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = (t: Omit<Toast, "id">) => {
    const id = uid("toast");
    setToasts((p) => [{ id, ...t }, ...p].slice(0, 4));
    window.setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 3200);
  };

  const orgs = useMemo<Org[]>(
    () => [
      { id: "org_acme", name: "Acme Group Ltd", role: "Admin", status: "Active" },
      { id: "org_khl", name: "Kampala Holdings", role: "Viewer", status: "Deposit depleted" },
    ],
    []
  );

  const [orgName, setOrgName] = useState(orgs[0].name);
  const org = useMemo(() => orgs.find((o) => o.name === orgName) || orgs[0], [orgs, orgName]);
  const canEdit = useMemo(() => ["Owner", "Admin", "Finance"].includes(org.role), [org.role]);

  // Load flows from storage
  const [flows, setFlows] = useState<ApprovalFlow[]>([]);
  const [selectedFlowName, setSelectedFlowName] = useState("");

  const loadFlows = () => {
    const loaded = ApprovalStorage.getAll();
    setFlows(loaded);
    if (loaded.length > 0 && !loaded.find(f => f.name === selectedFlowName)) {
      setSelectedFlowName(loaded[0].name);
    }
  };

  useEffect(() => {
    loadFlows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reload when returning to this page (e.g., after editing)
  useEffect(() => {
    const handleFocus = () => loadFlows();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const flow = useMemo(() => flows.find((f) => f.name === selectedFlowName) || flows[0], [flows, selectedFlowName]);

  const openEdit = (id: string = "new") => navigate(`/console/settings/approvals/workflows/${id}/edit`);

  const toggleFlowStatus = () => {
    if (!canEdit || !flow) {
      toast({ kind: "warn", title: "Admin required" });
      return;
    }
    const updated = { ...flow, status: flow.status === "Active" ? "Archived" as const : "Active" as const };
    ApprovalStorage.save(updated);
    loadFlows();
    toast({ kind: "success", title: "Status updated" });
  };

  const toggleChannel = (stageId: string, ch: Channel) => {
    if (!canEdit || !flow) {
      toast({ kind: "warn", title: "Admin required" });
      return;
    }
    const updatedStages = flow.stages.map((s) => {
      if (s.id !== stageId) return s;
      const has = s.notifyChannels.includes(ch);
      return { ...s, notifyChannels: has ? s.notifyChannels.filter((x) => x !== ch) : [...s.notifyChannels, ch] };
    });
    const updated = { ...flow, stages: updatedStages };
    ApprovalStorage.save(updated);
    loadFlows();
    toast({ kind: "success", title: "Channels updated" });
  };

  if (!flow) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">No workflows found. <button onClick={() => openEdit("new")} className="text-emerald-600 underline">Create one</button></p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "radial-gradient(90% 60% at 50% 0%, rgba(3,205,140,0.18), rgba(255,255,255,0))" }}>
      <ToastStack toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((x) => x.id !== id))} />

      <div className="mx-auto max-w-[95%] px-4 py-5 md:px-6">
        <div className="rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(2,8,23,0.10)]">
          <div className="border-b border-slate-200 px-4 py-4 md:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-slate-100 rounded-full text-slate-500">
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="grid h-12 w-12 place-items-center rounded-2xl text-white" style={{ background: EVZ.green }}>
                  <Layers className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">Approval Workflow Builder</div>
                  <div className="mt-1 text-xs text-slate-500">Multi-stage approvals, escalation, delegation, SLA, and channels</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Pill label={`Org: ${org.name}`} tone="info" />
                    <Pill label={`Role: ${org.role}`} tone={canEdit ? "info" : "neutral"} />
                    <Pill label={org.status} tone={toneForOrgStatus(org.status)} />
                    <Pill label={`Flow: ${flow.name}`} tone="neutral" />
                    <Pill label={flow.status} tone={flow.status === "Active" ? "good" : flow.status === "Draft" ? "warn" : "neutral"} />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="min-w-[220px]">
                  <Select value={orgName} onChange={setOrgName} options={orgs.map((o) => o.name)} />
                </div>
                <div className="min-w-[260px]">
                  <Select value={selectedFlowName} onChange={setSelectedFlowName} options={flows.map((f) => f.name)} />
                </div>
                <Button variant="primary" disabled={!canEdit} title={!canEdit ? "Admin required" : "New"} onClick={() => openEdit("new")}>
                  <Plus className="h-4 w-4" /> New flow
                </Button>
              </div>
            </div>

            {!canEdit ? (
              <div className="mt-4 rounded-3xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-amber-800">
                    <Lock className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">View-only access</div>
                    <div className="mt-1 text-sm text-amber-900">Editing flows requires Admin or Finance role.</div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="bg-slate-50 px-4 py-5 md:px-6">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              <div className="space-y-4 lg:col-span-8">
                <Section
                  title="Flow configuration"
                  subtitle="Stages, thresholds, and eligibility"
                  right={
                    <div className="flex flex-wrap items-center gap-2">
                      <Button variant={flow.status === "Active" ? "outline" : "primary"} disabled={!canEdit} title={!canEdit ? "Admin required" : "Toggle"} onClick={toggleFlowStatus}>
                        {flow.status === "Active" ? "Archive" : "Activate"}
                      </Button>
                      <Button variant="outline" onClick={() => openEdit(flow.id)}><ChevronRight className="h-4 w-4" /> Edit</Button>
                    </div>
                  }
                >
                  <div className="rounded-3xl border border-slate-200 bg-white p-4">
                    <div className="text-sm font-semibold text-slate-900">Auto-approve threshold</div>
                    <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="text-sm font-semibold text-slate-900">{flow.thresholdCurrency}</div>
                            <Pill label="Auto" tone="good" />
                            <Pill label={`Under ${formatUGX(flow.thresholdAmount)}`} tone="neutral" />
                          </div>
                          <div className="mt-1 text-sm text-slate-600">Auto-approve transactions under this threshold</div>
                        </div>
                        <Button variant="outline" onClick={() => openEdit(flow.id)} className="px-3 py-2"><ChevronRight className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">Stages ({flow.stages.length})</div>
                        <div className="mt-1 text-sm text-slate-600">Multi-stage approvals with escalation and delegation</div>
                      </div>
                      <Button variant="outline" onClick={() => openEdit(flow.id)}>
                        <Plus className="h-4 w-4" /> Edit stages
                      </Button>
                    </div>

                    <div className="mt-3 space-y-2">
                      {flow.stages.map((s) => (
                        <div key={s.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="text-sm font-semibold text-slate-900">{s.name}</div>
                                <Pill label={s.type} tone="neutral" />
                                <Pill label={`${s.requiredApprovers} approver(s)`} tone="info" />
                                <Pill label={s.delegatesAllowed ? "Delegation" : "No delegation"} tone="neutral" />
                                <Pill label={`Escalate ${s.escalationAfter}`} tone="warn" />
                              </div>
                              <div className="mt-1 text-sm text-slate-600">{s.note}</div>
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                {s.notifyChannels.map((c) => (
                                  <Pill key={c} label={c} tone={c === "WhatsApp" || c === "WeChat" ? "info" : "neutral"} />
                                ))}
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              {(["In-app", "Email", "WhatsApp", "WeChat"] as Channel[]).map((c) => (
                                <Button key={c} variant={s.notifyChannels.includes(c) ? "primary" : "outline"} className="px-3 py-2" disabled={!canEdit} title={!canEdit ? "Admin required" : "Toggle"} onClick={() => toggleChannel(s.id, c)}>
                                  {c}
                                </Button>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                      <div className="flex items-start gap-2"><Info className="mt-0.5 h-4 w-4" /><div>Changes to channels are saved immediately. Click Edit to manage stages.</div></div>
                    </div>
                  </div>
                </Section>
              </div>

              <div className="space-y-4 lg:col-span-4">
                <Section
                  title="Scenario simulation"
                  subtitle="Test workflow behavior"
                  right={<Pill label="Ready" tone="good" />}
                >
                  <div className="space-y-3">
                    <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4">
                      <div className="flex items-start gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-emerald-700">
                          <Timer className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-900">Workflow active</div>
                          <div className="mt-1 text-sm text-slate-700">{flow.stages.length} stage(s) configured</div>
                          <div className="mt-2 text-xs text-emerald-600">Auto-approve under {formatUGX(flow.thresholdAmount)}</div>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Button variant="outline" onClick={() => navigate("/console/settings/approvals/workflows/preview")}>
                          <ChevronRight className="h-4 w-4" /> Preview
                        </Button>
                        <Button variant="outline" onClick={() => navigate("/console/receipt/approval-demo")}>
                          <ChevronRight className="h-4 w-4" /> Receipt
                        </Button>
                      </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <div className="text-sm font-semibold text-slate-900">Tip</div>
                      <div className="mt-1 text-sm text-slate-600">Use simulation to test delegation, escalation, and channel rules.</div>
                    </div>
                  </div>
                </Section>

                <div
                  className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                  style={{ background: "radial-gradient(90% 80% at 10% 0%, rgba(247,127,0,0.20), rgba(255,255,255,0)), radial-gradient(90% 80% at 90% 0%, rgba(3,205,140,0.16), rgba(255,255,255,0))" }}
                >
                  <div className="flex items-start gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-2xl text-white" style={{ background: EVZ.orange }}>
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Premium approvals</div>
                      <div className="mt-1 text-sm text-slate-600">Escalation, delegation, SLA, and multi-channel.</div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Pill label="SLA" tone="neutral" />
                        <Pill label="Delegation" tone="neutral" />
                        <Pill label="WeChat" tone="info" />
                      </div>
                      <div className="mt-3"><Button variant="outline" onClick={() => openEdit(flow.id)}><ChevronRight className="h-4 w-4" /> Edit Workflow</Button></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><BadgeCheck className="h-5 w-5" /></div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Tip</div>
                    <div className="mt-1 text-sm text-slate-600">Enable auto-approve under threshold for low-value requests to reduce workload.</div>
                  </div>
                </div>
                <Button variant="primary" disabled={!canEdit} title={!canEdit ? "Admin required" : "New"} onClick={() => openEdit("new")}>
                  <Plus className="h-4 w-4" /> New flow
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
