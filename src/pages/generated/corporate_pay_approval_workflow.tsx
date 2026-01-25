import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BadgeCheck,
  Bell,
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  FileText,
  Globe,
  Info,
  Layers,
  Lock,
  Mail,
  MessageCircle,
  Plus,
  ShieldCheck,
  Sparkles,
  Timer,
  Users,
  X,
} from "lucide-react";

const EVZ = { green: "#03CD8C", orange: "#F77F00" };

type OrgRole = "Viewer" | "Member" | "Approver" | "Finance" | "Admin" | "Owner";

type OrgStatus = "Active" | "Deposit depleted" | "Suspended" | "Needs verification";

type Org = { id: string; name: string; role: OrgRole; status: OrgStatus };

type Channel = "In-app" | "Email" | "WhatsApp" | "WeChat" | "SMS";

type StageType = "Manager" | "Finance" | "Risk" | "Custom";

type ApprovalStage = {
  id: string;
  name: string;
  type: StageType;
  requiredApprovers: number;
  delegatesAllowed: boolean;
  escalationAfter: string;
  notifyChannels: Channel[];
  note: string;
};

type Flow = {
  id: string;
  name: string;
  status: "Draft" | "Active" | "Archived";
  appliesTo: Array<"Purchases" | "Payouts" | "Refunds">;
  thresholds: Array<{ currency: "UGX" | "USD" | "CNY" | "KES"; under: number; autoApprove: boolean; note: string }>;
  eligibility: Array<string>;
  stages: ApprovalStage[];
  lastEdited: string;
};

type Scenario = {
  type: "Purchases" | "Payouts" | "Refunds";
  amountUGX: number;
  requesterRole: OrgRole;
  vendor: string;
  module: string;
};

type SimulationResult = {
  decision: "Auto-approved" | "Approval required" | "Blocked";
  stages: Array<{ stage: string; required: number; channels: Channel[]; sla: string }>;
  reason: string;
};

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

function Modal({
  open,
  title,
  subtitle,
  onClose,
  children,
  footer,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => (e.key === "Escape" ? onClose() : null);
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div className="fixed inset-0 z-40 bg-black/35" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-x-0 top-[10vh] z-50 mx-auto w-[min(980px,calc(100vw-2rem))] overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(2,8,23,0.22)]"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
              <div>
                <div className="text-lg font-semibold text-slate-900">{title}</div>
                {subtitle ? <div className="mt-1 text-sm text-slate-600">{subtitle}</div> : null}
              </div>
              <button className="rounded-2xl p-2 text-slate-600 hover:bg-slate-100" onClick={onClose} aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto px-5 py-4">{children}</div>
            {footer ? <div className="border-t border-slate-200 bg-slate-50 px-5 py-4">{footer}</div> : null}
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
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

function simulate(flow: Flow, s: Scenario): SimulationResult {
  // Auto-approve under threshold
  const thr = flow.thresholds.find((t) => t.currency === "UGX");
  if (thr && s.amountUGX < thr.under && thr.autoApprove) {
    return { decision: "Auto-approved", stages: [], reason: `Under ${formatUGX(thr.under)} auto-approve threshold` };
  }

  // Basic eligibility
  if (s.requesterRole === "Viewer") {
    return { decision: "Blocked", stages: [], reason: "Viewer role cannot request approvals" };
  }

  const stages = flow.stages.map((st) => ({ stage: st.name, required: st.requiredApprovers, channels: st.notifyChannels, sla: st.escalationAfter }));
  return { decision: "Approval required", stages, reason: "Meets criteria for approval workflow" };
}

export default function ApprovalWorkflowBuilder() {
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

  const [orgId, setOrgId] = useState(orgs[0].id);
  const org = useMemo(() => orgs.find((o) => o.id === orgId) || orgs[0], [orgs, orgId]);
  const canEdit = useMemo(() => ["Owner", "Admin", "Finance"].includes(org.role), [org.role]);

  const [flows, setFlows] = useState<Flow[]>([
    {
      id: "F-1",
      name: "CorporatePay purchases",
      status: "Active",
      appliesTo: ["Purchases"],
      thresholds: [{ currency: "UGX", under: 100000, autoApprove: true, note: "Auto-approve small purchases" }],
      eligibility: ["Requester must not be Viewer", "Cost center required"],
      stages: [
        {
          id: "S-1",
          name: "Manager approval",
          type: "Manager",
          requiredApprovers: 1,
          delegatesAllowed: true,
          escalationAfter: "2h",
          notifyChannels: ["In-app", "Email", "WhatsApp"],
          note: "First line approval",
        },
        {
          id: "S-2",
          name: "Finance approval",
          type: "Finance",
          requiredApprovers: 1,
          delegatesAllowed: true,
          escalationAfter: "4h",
          notifyChannels: ["In-app", "Email", "WeChat"],
          note: "Final approval",
        },
      ],
      lastEdited: "Today",
    },
    {
      id: "F-2",
      name: "Payout approvals",
      status: "Draft",
      appliesTo: ["Payouts"],
      thresholds: [{ currency: "UGX", under: 50000, autoApprove: true, note: "Small payouts auto" }],
      eligibility: ["Beneficiary must be verified", "No risk holds"],
      stages: [
        {
          id: "S-3",
          name: "Finance approval",
          type: "Finance",
          requiredApprovers: 2,
          delegatesAllowed: false,
          escalationAfter: "6h",
          notifyChannels: ["In-app", "Email"],
          note: "Dual approval",
        },
      ],
      lastEdited: "Draft",
    },
  ]);

  const [flowId, setFlowId] = useState(flows[0].id);
  const flow = useMemo(() => flows.find((f) => f.id === flowId) || flows[0], [flows, flowId]);

  const [scenario, setScenario] = useState<Scenario>({
    type: "Purchases",
    amountUGX: 540000,
    requesterRole: "Member",
    vendor: "Acme Supplies",
    module: "CorporatePay",
  });

  const result = useMemo(() => simulate(flow, scenario), [flow, scenario]);

  const openAdmin = () => toast({ kind: "info", title: "Open Admin Console", message: "Deep link to full workflow builder." });

  const [addOpen, setAddOpen] = useState(false);
  const [draftName, setDraftName] = useState("New flow");
  const [draftUnder, setDraftUnder] = useState("100000");

  const addFlow = () => {
    if (!draftName.trim()) {
      toast({ kind: "warn", title: "Name required" });
      return;
    }
    const id = `F-${Math.floor(10 + Math.random() * 90)}`;
    setFlows((p) => [
      {
        id,
        name: draftName.trim(),
        status: "Draft",
        appliesTo: ["Purchases"],
        thresholds: [{ currency: "UGX", under: Number(draftUnder.replace(/[^0-9]/g, "")) || 0, autoApprove: true, note: "Auto-approve under threshold" }],
        eligibility: ["Requester must not be Viewer"],
        stages: [
          {
            id: uid("S"),
            name: "Manager approval",
            type: "Manager",
            requiredApprovers: 1,
            delegatesAllowed: true,
            escalationAfter: "2h",
            notifyChannels: ["In-app", "Email"],
            note: "Default stage",
          },
        ],
        lastEdited: "Just now",
      },
      ...p,
    ]);
    setAddOpen(false);
    toast({ kind: "success", title: "Flow created", message: id });
  };

  const toggleFlowStatus = () => {
    if (!canEdit) {
      toast({ kind: "warn", title: "Admin required" });
      return;
    }
    setFlows((p) => p.map((f) => (f.id === flow.id ? { ...f, status: f.status === "Active" ? "Archived" : "Active", lastEdited: "Just now" } : f)));
    toast({ kind: "success", title: "Status updated" });
  };

  const addStage = () => {
    if (!canEdit) {
      toast({ kind: "warn", title: "Admin required" });
      return;
    }
    const st: ApprovalStage = {
      id: uid("S"),
      name: `Stage ${flow.stages.length + 1}`,
      type: "Custom",
      requiredApprovers: 1,
      delegatesAllowed: true,
      escalationAfter: "4h",
      notifyChannels: ["In-app", "Email"],
      note: "New stage",
    };
    setFlows((p) => p.map((f) => (f.id === flow.id ? { ...f, stages: [...f.stages, st], lastEdited: "Just now" } : f)));
    toast({ kind: "success", title: "Stage added" });
  };

  const toggleChannel = (stageId: string, ch: Channel) => {
    if (!canEdit) {
      toast({ kind: "warn", title: "Admin required" });
      return;
    }
    setFlows((p) =>
      p.map((f) => {
        if (f.id !== flow.id) return f;
        return {
          ...f,
          stages: f.stages.map((s) => {
            if (s.id !== stageId) return s;
            const has = s.notifyChannels.includes(ch);
            return { ...s, notifyChannels: has ? s.notifyChannels.filter((x) => x !== ch) : [...s.notifyChannels, ch] };
          }),
          lastEdited: "Just now",
        };
      })
    );
    toast({ kind: "success", title: "Channels updated" });
  };

  return (
    <div className="min-h-screen" style={{ background: "radial-gradient(90% 60% at 50% 0%, rgba(3,205,140,0.18), rgba(255,255,255,0))" }}>
      <ToastStack toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((x) => x.id !== id))} />

      <div className="mx-auto max-w-[95%] px-4 py-5 md:px-6">
        <div className="rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(2,8,23,0.10)]">
          <div className="border-b border-slate-200 px-4 py-4 md:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
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
                  <Select value={orgId} onChange={setOrgId} options={orgs.map((o) => o.id)} />
                </div>
                <div className="min-w-[260px]">
                  <Select value={flowId} onChange={setFlowId} options={flows.map((f) => f.id)} />
                </div>
                <Button variant="outline" onClick={() => toast({ kind: "info", title: "Switch", message: "Open wallet switcher" })}>
                  <ChevronRight className="h-4 w-4" /> Switch
                </Button>
                <Button variant="outline" onClick={openAdmin}>
                  <ChevronRight className="h-4 w-4" /> Admin Console
                </Button>
                <Button variant="primary" disabled={!canEdit} title={!canEdit ? "Admin required" : "New"} onClick={() => setAddOpen(true)}>
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
                      <Button variant="outline" onClick={openAdmin}><ChevronRight className="h-4 w-4" /> Advanced</Button>
                    </div>
                  }
                >
                  <div className="rounded-3xl border border-slate-200 bg-white p-4">
                    <div className="text-sm font-semibold text-slate-900">Auto-approve thresholds</div>
                    <div className="mt-3 space-y-2">
                      {flow.thresholds.map((t, idx) => (
                        <div key={idx} className="rounded-2xl border border-slate-200 bg-white p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="text-sm font-semibold text-slate-900">{t.currency}</div>
                                <Pill label={t.autoApprove ? "Auto" : "No auto"} tone={t.autoApprove ? "good" : "neutral"} />
                                <Pill label={`Under ${formatUGX(t.under)}`} tone="neutral" />
                              </div>
                              <div className="mt-1 text-sm text-slate-600">{t.note}</div>
                            </div>
                            <Button variant="outline" onClick={openAdmin} className="px-3 py-2"><ChevronRight className="h-4 w-4" /></Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">Stages</div>
                        <div className="mt-1 text-sm text-slate-600">Multi-stage approvals with escalation and delegation</div>
                      </div>
                      <Button variant="primary" disabled={!canEdit} title={!canEdit ? "Admin required" : "Add"} onClick={addStage}>
                        <Plus className="h-4 w-4" /> Add stage
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
                                <Pill label={s.delegatesAllowed ? "Delegation" : "No delegation"} tone={s.delegatesAllowed ? "neutral" : "neutral"} />
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
                              {(["In-app", "Email", "WhatsApp", "WeChat", "SMS"] as Channel[]).slice(0, 4).map((c) => (
                                <Button key={c} variant={s.notifyChannels.includes(c) ? "primary" : "outline"} className="px-3 py-2" disabled={!canEdit} title={!canEdit ? "Admin required" : "Toggle"} onClick={() => toggleChannel(s.id, c)}>
                                  {c}
                                </Button>
                              ))}
                              <Button variant="outline" onClick={openAdmin}><ChevronRight className="h-4 w-4" /> Edit</Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                      <div className="flex items-start gap-2"><Info className="mt-0.5 h-4 w-4" /><div>WeChat is supported as a channel for approval notifications where enabled.</div></div>
                    </div>
                  </div>
                </Section>
              </div>

              <div className="space-y-4 lg:col-span-4">
                <Section
                  title="Scenario simulation"
                  subtitle="What happens if..."
                  right={<Pill label={result.decision} tone={result.decision === "Auto-approved" ? "good" : result.decision === "Blocked" ? "bad" : "info"} />}
                >
                  <div className="space-y-3">
                    <div className="rounded-3xl border border-slate-200 bg-white p-4">
                      <div className="text-xs font-semibold text-slate-600">Type</div>
                      <div className="mt-2"><Select value={scenario.type} onChange={(v) => setScenario((p) => ({ ...p, type: v as any }))} options={["Purchases", "Payouts", "Refunds"]} /></div>
                      <div className="mt-3 text-xs font-semibold text-slate-600">Amount (UGX)</div>
                      <div className="mt-2"><input value={String(scenario.amountUGX)} onChange={(e) => setScenario((p) => ({ ...p, amountUGX: Number(e.target.value.replace(/[^0-9]/g, "")) || 0 }))} className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold" /></div>
                      <div className="mt-3 text-xs font-semibold text-slate-600">Requester role</div>
                      <div className="mt-2"><Select value={scenario.requesterRole} onChange={(v) => setScenario((p) => ({ ...p, requesterRole: v as any }))} options={["Member", "Approver", "Finance", "Admin", "Owner", "Viewer"]} /></div>
                      <div className="mt-3 text-xs font-semibold text-slate-600">Module</div>
                      <div className="mt-2"><Select value={scenario.module} onChange={(v) => setScenario((p) => ({ ...p, module: v }))} options={["CorporatePay", "E-Commerce", "Services", "EV Charging", "Rides & Logistics"]} /></div>
                      <div className="mt-3 text-xs font-semibold text-slate-600">Vendor</div>
                      <div className="mt-2"><input value={scenario.vendor} onChange={(e) => setScenario((p) => ({ ...p, vendor: e.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold" /></div>
                    </div>

                    <div className={cn("rounded-3xl border p-4", result.decision === "Auto-approved" ? "border-emerald-200 bg-emerald-50" : result.decision === "Blocked" ? "border-rose-200 bg-rose-50" : "border-blue-200 bg-blue-50")}>
                      <div className="flex items-start gap-3">
                        <div className={cn("grid h-10 w-10 place-items-center rounded-2xl", result.decision === "Auto-approved" ? "bg-white text-emerald-700" : result.decision === "Blocked" ? "bg-white text-rose-700" : "bg-white text-blue-700")}>
                          {result.decision === "Auto-approved" ? <BadgeCheck className="h-5 w-5" /> : result.decision === "Blocked" ? <AlertTriangle className="h-5 w-5" /> : <Timer className="h-5 w-5" />}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-900">{result.decision}</div>
                          <div className="mt-1 text-sm text-slate-700">{result.reason}</div>
                          {result.stages.length ? (
                            <div className="mt-3 space-y-2">
                              {result.stages.map((s, idx) => (
                                <div key={idx} className="rounded-2xl border border-slate-200 bg-white p-3">
                                  <div className="flex items-start justify-between gap-2">
                                    <div>
                                      <div className="text-sm font-semibold text-slate-900">{s.stage}</div>
                                      <div className="mt-1 text-xs text-slate-500">Approvers: {s.required} • SLA: {s.sla}</div>
                                      <div className="mt-2 flex flex-wrap items-center gap-2">
                                        {s.channels.map((c) => (
                                          <Pill key={c} label={c} tone={c === "WeChat" || c === "WhatsApp" ? "info" : "neutral"} />
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Button variant="outline" onClick={() => toast({ kind: "info", title: "Preview", message: "This would preview the actual approval journey." })}>
                          <ChevronRight className="h-4 w-4" /> Preview
                        </Button>
                        <Button variant="outline" onClick={() => toast({ kind: "info", title: "Receipt", message: "Approval chain will show in receipt drawer." })}>
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
                      <div className="mt-1 text-sm text-slate-600">Escalation, delegation, SLA, and multi-channel (including WeChat).</div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Pill label="SLA" tone="neutral" />
                        <Pill label="Delegation" tone="neutral" />
                        <Pill label="WeChat" tone="info" />
                      </div>
                      <div className="mt-3"><Button variant="outline" onClick={openAdmin}><ChevronRight className="h-4 w-4" /> Admin Console</Button></div>
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
                <Button variant="primary" disabled={!canEdit} title={!canEdit ? "Admin required" : "New"} onClick={() => setAddOpen(true)}>
                  <Plus className="h-4 w-4" /> New flow
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={addOpen}
        title="Create approval flow"
        subtitle="Draft a flow with basic thresholds"
        onClose={() => setAddOpen(false)}
        footer={
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm text-slate-600"><Info className="h-4 w-4" /> Draft flows should be simulated before activation.</div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={addFlow}><Check className="h-4 w-4" /> Create</Button>
            </div>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="text-sm font-semibold text-slate-900">Draft</div>
            <div className="mt-3 space-y-3">
              <div>
                <div className="text-xs font-semibold text-slate-600">Name</div>
                <div className="mt-1"><input value={draftName} onChange={(e) => setDraftName(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold" /></div>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-600">Auto-approve under (UGX)</div>
                <div className="mt-1"><input value={draftUnder} onChange={(e) => setDraftUnder(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold" /></div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                <div className="flex items-start gap-2"><Info className="mt-0.5 h-4 w-4" /><div>Advanced settings for SLA, delegation, and channels are available in Admin Console.</div></div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-semibold text-slate-900">Preview</div>
            <div className="mt-3 space-y-2 text-sm text-slate-700">
              <div className="flex items-center justify-between"><span className="text-slate-500">Name</span><span className="font-semibold">{draftName}</span></div>
              <div className="flex items-center justify-between"><span className="text-slate-500">Under</span><span className="font-semibold">{formatUGX(Number(draftUnder.replace(/[^0-9]/g, "")) || 0)}</span></div>
              <div className="mt-3"><Pill label="Draft" tone="warn" /> <Pill label="Simulate" tone="info" /></div>
              <div className="mt-4"><Button variant="outline" onClick={openAdmin}><ChevronRight className="h-4 w-4" /> Advanced editor</Button></div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
