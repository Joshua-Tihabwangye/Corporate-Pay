import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  AlertTriangle,
  BadgeCheck,
  Check,
  ChevronRight,
  Copy,
  FileText,
  Filter,
  Info,
  Layers,
  Lock,
  Plus,
  ShieldCheck,
  Sparkles,
  Wand2,
  X,
} from "lucide-react";

const EVZ = { green: "#03CD8C", orange: "#F77F00" };

type OrgRole = "Viewer" | "Member" | "Approver" | "Finance" | "Admin" | "Owner";

type OrgStatus = "Active" | "Deposit depleted" | "Suspended" | "Needs verification";

type Org = { id: string; name: string; role: OrgRole; status: OrgStatus };

type PolicyStatus = "Draft" | "Active" | "Archived";

type Severity = "Allow" | "Require approval" | "Require attestation" | "Block";

type ConditionKey = "Module" | "Marketplace" | "Vendor" | "Category" | "Amount" | "Currency" | "Country" | "Cost center";

type PolicyRule = {
  id: string;
  name: string;
  status: PolicyStatus;
  priority: number;
  when: Array<{ key: ConditionKey; op: "is" | "in" | "gte" | "lte" | "contains"; value: string }>;
  then: {
    action: Severity;
    reason: string;
    requireAttachment?: boolean;
    attachmentType?: string;
    attachmentThresholdUGX?: number;
    outOfPolicyHandling: "Stop" | "Allow with attestation" | "Route to approval";
  };
  lastEdited: string;
};

type Simulation = {
  module: string;
  marketplace: string;
  vendor: string;
  amountUGX: number;
  country: string;
  costCenter: string;
};

type Outcome = {
  decision: Severity;
  reason: string;
  matchedRule?: string;
  attachmentsRequired?: string;
  route?: string;
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

function toneForDecision(d: Severity) {
  if (d === "Allow") return "good" as const;
  if (d === "Require approval") return "info" as const;
  if (d === "Require attestation") return "warn" as const;
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

function Input({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-100"
    />
  );
}

function evaluateRule(sim: Simulation, rule: PolicyRule): boolean {
  // Very small evaluator to support this demo
  for (const c of rule.when) {
    const v = c.value.toLowerCase();
    const getField = () => {
      if (c.key === "Module") return sim.module;
      if (c.key === "Marketplace") return sim.marketplace;
      if (c.key === "Vendor") return sim.vendor;
      if (c.key === "Country") return sim.country;
      if (c.key === "Cost center") return sim.costCenter;
      if (c.key === "Amount") return String(sim.amountUGX);
      if (c.key === "Currency") return "UGX";
      return "";
    };
    const field = getField().toLowerCase();

    if (c.op === "is" && field !== v) return false;
    if (c.op === "contains" && !field.includes(v)) return false;
    if (c.op === "gte" && Number(field) < Number(v)) return false;
    if (c.op === "lte" && Number(field) > Number(v)) return false;
    if (c.op === "in") {
      const set = v.split(",").map((x) => x.trim());
      if (!set.includes(field)) return false;
    }
  }
  return true;
}

export default function PolicyBuilder() {
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

  const [orgId, setOrgId] = useState(orgs[0].id);
  const org = useMemo(() => orgs.find((o) => o.id === orgId) || orgs[0], [orgs, orgId]);
  const canEdit = useMemo(() => ["Owner", "Admin", "Finance"].includes(org.role), [org.role]);

  const [rules, setRules] = useState<PolicyRule[]>([
    {
      id: "PR-1",
      name: "CorporatePay high value requires approval",
      status: "Active",
      priority: 1,
      when: [
        { key: "Module", op: "is", value: "CorporatePay" },
        { key: "Amount", op: "gte", value: "500000" },
      ],
      then: {
        action: "Require approval",
        reason: "Above approval threshold",
        outOfPolicyHandling: "Route to approval",
      },
      lastEdited: "Today",
    },
    {
      id: "PR-2",
      name: "Missing cost center blocks",
      status: "Active",
      priority: 2,
      when: [
        { key: "Cost center", op: "is", value: "" },
        { key: "Module", op: "in", value: "CorporatePay,Marketplace" },
      ],
      then: {
        action: "Block",
        reason: "Cost center is required",
        outOfPolicyHandling: "Stop",
      },
      lastEdited: "Yesterday",
    },
    {
      id: "PR-3",
      name: "Large refunds require attachment",
      status: "Active",
      priority: 3,
      when: [
        { key: "Module", op: "is", value: "E-Commerce" },
        { key: "Amount", op: "gte", value: "150000" },
      ],
      then: {
        action: "Require attestation",
        reason: "Large refund needs evidence",
        requireAttachment: true,
        attachmentType: "Refund proof",
        attachmentThresholdUGX: 150000,
        outOfPolicyHandling: "Allow with attestation",
      },
      lastEdited: "Last week",
    },
    {
      id: "PR-4",
      name: "Blocked vendor list",
      status: "Draft",
      priority: 10,
      when: [{ key: "Vendor", op: "contains", value: "banned" }],
      then: {
        action: "Block",
        reason: "Vendor is blocked",
        outOfPolicyHandling: "Stop",
      },
      lastEdited: "Draft",
    },
  ]);

  const [filterStatus, setFilterStatus] = useState<"ALL" | PolicyStatus>("ALL");
  const [q, setQ] = useState("");

  const filteredRules = useMemo(() => {
    const s = q.trim().toLowerCase();
    return rules
      .filter((r) => (filterStatus === "ALL" ? true : r.status === filterStatus))
      .filter((r) => (!s ? true : `${r.id} ${r.name}`.toLowerCase().includes(s)))
      .sort((a, b) => a.priority - b.priority);
  }, [rules, filterStatus, q]);

  const [sim, setSim] = useState<Simulation>({
    module: "CorporatePay",
    marketplace: "EVmart",
    vendor: "Acme Supplies",
    amountUGX: 540000,
    country: "Uganda",
    costCenter: "CC-PROC",
  });

  const outcome = useMemo<Outcome>(() => {
    // Find first matching active rule by priority
    const actives = rules.filter((r) => r.status === "Active").sort((a, b) => a.priority - b.priority);
    const matched = actives.find((r) => evaluateRule(sim, r));
    if (!matched) return { decision: "Allow", reason: "No matching policy" };

    const attachmentsRequired = matched.then.requireAttachment ? `${matched.then.attachmentType ?? "Attachment"} above ${formatUGX(matched.then.attachmentThresholdUGX ?? 0)}` : undefined;

    const route = matched.then.outOfPolicyHandling === "Route to approval" ? "Approval workflow" : matched.then.outOfPolicyHandling === "Allow with attestation" ? "Attestation + record" : "Stop";

    return {
      decision: matched.then.action,
      reason: matched.then.reason,
      matchedRule: matched.name,
      attachmentsRequired,
      route,
    };
  }, [rules, sim]);

  const [addOpen, setAddOpen] = useState(false);
  const [draftName, setDraftName] = useState("New policy");
  const [draftAction, setDraftAction] = useState<Severity>("Require approval");
  const [draftModule, setDraftModule] = useState("CorporatePay");
  const [draftAmount, setDraftAmount] = useState("500000");

  const addRule = () => {
    if (!draftName.trim()) {
      toast({ kind: "warn", title: "Name required" });
      return;
    }
    const id = `PR-${Math.floor(10 + Math.random() * 90)}`;
    setRules((p) => [
      {
        id,
        name: draftName.trim(),
        status: "Draft",
        priority: Math.max(...p.map((x) => x.priority)) + 1,
        when: [
          { key: "Module", op: "is", value: draftModule },
          { key: "Amount", op: "gte", value: draftAmount },
        ],
        then: {
          action: draftAction,
          reason: "New rule",
          outOfPolicyHandling: draftAction === "Block" ? "Stop" : draftAction === "Require attestation" ? "Allow with attestation" : "Route to approval",
        },
        lastEdited: "Just now",
      },
      ...p,
    ]);
    setAddOpen(false);
    toast({ kind: "success", title: "Policy created", message: id });
  };

  const toggleStatus = (id: string) => {
    if (!canEdit) {
      toast({ kind: "warn", title: "Admin required" });
      return;
    }
    setRules((p) =>
      p.map((r) =>
        r.id === id
          ? { ...r, status: r.status === "Active" ? "Archived" : "Active", lastEdited: "Just now" }
          : r
      )
    );
    toast({ kind: "success", title: "Status updated" });
  };

  const openAdmin = () => toast({ kind: "info", title: "Open Admin Console", message: "Deep link to full policy editor." });

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ kind: "success", title: "Copied" });
    } catch {
      toast({ kind: "warn", title: "Copy failed", message: "Clipboard access blocked." });
    }
  };

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
                  <Wand2 className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">Policy Builder</div>
                  <div className="mt-1 text-xs text-slate-500">Rule engine by module, marketplace, and vendor</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Pill label={`Org: ${org.name}`} tone="info" />
                    <Pill label={`Role: ${org.role}`} tone={canEdit ? "info" : "neutral"} />
                    <Pill label={org.status} tone={toneForOrgStatus(org.status)} />
                    <Pill label={`${filteredRules.length} rules`} tone="neutral" />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="min-w-[220px]">
                  <Select value={orgId} onChange={setOrgId} options={orgs.map((o) => o.id)} />
                </div>
                <Button variant="outline" onClick={() => toast({ kind: "info", title: "Switch", message: "Open wallet switcher" })}>
                  <ChevronRight className="h-4 w-4" /> Switch
                </Button>
                <Button variant="outline" onClick={openAdmin}>
                  <ChevronRight className="h-4 w-4" /> Admin Console
                </Button>
                <Button variant="primary" disabled={!canEdit} title={!canEdit ? "Admin required" : "Add"} onClick={() => setAddOpen(true)}>
                  <Plus className="h-4 w-4" /> New policy
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
                    <div className="mt-1 text-sm text-amber-900">Editing policies requires Admin or Finance role.</div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="bg-slate-50 px-4 py-5 md:px-6">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              <div className="space-y-4 lg:col-span-8">
                <Section
                  title="Rules"
                  subtitle="Priority order matters. First match wins."
                  right={
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="min-w-[160px]">
                        <Select value={filterStatus} onChange={(v) => setFilterStatus(v as any)} options={["ALL", "Draft", "Active", "Archived"]} />
                      </div>
                      <div className="min-w-[220px]">
                        <input
                          value={q}
                          onChange={(e) => setQ(e.target.value)}
                          placeholder="Search rules"
                          className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                        />
                      </div>
                    </div>
                  }
                >
                  <div className="space-y-2">
                    {filteredRules.map((r) => (
                      <div key={r.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="text-sm font-semibold text-slate-900">{r.name}</div>
                              <Pill label={r.id} tone="neutral" />
                              <Pill label={r.status} tone={r.status === "Active" ? "good" : r.status === "Draft" ? "warn" : "neutral"} />
                              <Pill label={`Priority ${r.priority}`} tone="neutral" />
                              <Pill label={r.then.action} tone={toneForDecision(r.then.action)} />
                            </div>
                            <div className="mt-1 text-sm text-slate-600">Then: {r.then.reason}</div>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              {r.when.slice(0, 3).map((c, idx) => (
                                <Pill key={idx} label={`${c.key} ${c.op} ${c.value || "(empty)"}`} tone="neutral" />
                              ))}
                              {r.when.length > 3 ? <Pill label={`+${r.when.length - 3} more`} tone="neutral" /> : null}
                            </div>
                            {r.then.requireAttachment ? (
                              <div className="mt-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                                <div className="flex items-start gap-2">
                                  <AlertTriangle className="mt-0.5 h-4 w-4" />
                                  <div>
                                    Attachment required: {r.then.attachmentType} above {formatUGX(r.then.attachmentThresholdUGX ?? 0)}
                                  </div>
                                </div>
                              </div>
                            ) : null}
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Button variant="outline" onClick={() => copy(r.id)} className="px-3 py-2">
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" onClick={openAdmin}>
                              <ChevronRight className="h-4 w-4" /> Edit
                            </Button>
                            <Button variant={r.status === "Active" ? "outline" : "primary"} disabled={!canEdit} title={!canEdit ? "Admin required" : "Toggle"} onClick={() => toggleStatus(r.id)}>
                              {r.status === "Active" ? "Archive" : "Activate"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {!filteredRules.length ? <div className="rounded-3xl border border-slate-200 bg-white p-4 text-sm text-slate-600">No rules match.</div> : null}
                  </div>
                </Section>

                <Section
                  title="Out-of-policy handling"
                  subtitle="Stop, allow with attestation, or route to approval"
                  right={<Pill label="Premium" tone="info" />}
                >
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div className="rounded-3xl border border-slate-200 bg-white p-4">
                      <div className="text-sm font-semibold text-slate-900">Stop</div>
                      <div className="mt-1 text-sm text-slate-600">Block transaction until fixed</div>
                      <div className="mt-3"><Pill label="Hard enforcement" tone="warn" /></div>
                    </div>
                    <div className="rounded-3xl border border-slate-200 bg-white p-4">
                      <div className="text-sm font-semibold text-slate-900">Attestation</div>
                      <div className="mt-1 text-sm text-slate-600">Allow with user justification and record</div>
                      <div className="mt-3"><Pill label="Audit-ready" tone="info" /></div>
                    </div>
                    <div className="rounded-3xl border border-slate-200 bg-white p-4">
                      <div className="text-sm font-semibold text-slate-900">Route to approval</div>
                      <div className="mt-1 text-sm text-slate-600">Send to approvals and escalation</div>
                      <div className="mt-3"><Pill label="Maker-checker" tone="info" /></div>
                    </div>
                  </div>
                  <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                    <div className="flex items-start gap-2"><Info className="mt-0.5 h-4 w-4" /><div>Policy reasons show in the receipt drawer as enforcement details.</div></div>
                  </div>
                </Section>
              </div>

              <div className="space-y-4 lg:col-span-4">
                <Section
                  title="Scenario simulation"
                  subtitle="What happens if..."
                  right={<Pill label={outcome.decision} tone={toneForDecision(outcome.decision)} />}
                >
                  <div className="space-y-3">
                    <div className="rounded-3xl border border-slate-200 bg-white p-4">
                      <div className="text-xs font-semibold text-slate-600">Module</div>
                      <div className="mt-2"><Select value={sim.module} onChange={(v) => setSim((p) => ({ ...p, module: v }))} options={["CorporatePay", "E-Commerce", "Services", "EV Charging", "Rides & Logistics", "Shoppable Adz"]} /></div>
                      <div className="mt-3 text-xs font-semibold text-slate-600">Marketplace</div>
                      <div className="mt-2"><Select value={sim.marketplace} onChange={(v) => setSim((p) => ({ ...p, marketplace: v }))} options={["EVmart", "ServiceMart", "GeneralMart"]} /></div>
                      <div className="mt-3 text-xs font-semibold text-slate-600">Vendor</div>
                      <div className="mt-2"><Input value={sim.vendor} onChange={(v) => setSim((p) => ({ ...p, vendor: v }))} placeholder="Vendor" /></div>
                      <div className="mt-3 text-xs font-semibold text-slate-600">Amount (UGX)</div>
                      <div className="mt-2"><Input value={String(sim.amountUGX)} onChange={(v) => setSim((p) => ({ ...p, amountUGX: Number(v.replace(/[^0-9]/g, "")) || 0 }))} placeholder="540000" /></div>
                      <div className="mt-3 text-xs font-semibold text-slate-600">Cost center</div>
                      <div className="mt-2"><Input value={sim.costCenter} onChange={(v) => setSim((p) => ({ ...p, costCenter: v }))} placeholder="CC-PROC" /></div>
                    </div>

                    <div className={cn("rounded-3xl border p-4", outcome.decision === "Allow" ? "border-emerald-200 bg-emerald-50" : outcome.decision === "Block" ? "border-rose-200 bg-rose-50" : "border-amber-200 bg-amber-50")}>
                      <div className="flex items-start gap-3">
                        <div className={cn("grid h-10 w-10 place-items-center rounded-2xl", outcome.decision === "Allow" ? "bg-white text-emerald-700" : outcome.decision === "Block" ? "bg-white text-rose-700" : "bg-white text-amber-800")}>
                          {outcome.decision === "Allow" ? <BadgeCheck className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-900">Decision: {outcome.decision}</div>
                          <div className="mt-1 text-sm text-slate-700">{outcome.reason}</div>
                          {outcome.matchedRule ? <div className="mt-2 text-xs text-slate-700">Matched: {outcome.matchedRule}</div> : null}
                          {outcome.attachmentsRequired ? <div className="mt-2 text-xs text-slate-700">Attachments: {outcome.attachmentsRequired}</div> : null}
                          {outcome.route ? <div className="mt-2 text-xs text-slate-700">Route: {outcome.route}</div> : null}
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Button variant="outline" onClick={() => toast({ kind: "info", title: "Open approvals", message: "Deep link to Approval Workflow Builder" })}>
                          <ChevronRight className="h-4 w-4" /> Approvals
                        </Button>
                        <Button variant="outline" onClick={() => toast({ kind: "info", title: "Receipt", message: "Policy reason would appear in receipt drawer." })}>
                          <ChevronRight className="h-4 w-4" /> Receipt
                        </Button>
                      </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <div className="text-sm font-semibold text-slate-900">Tip</div>
                      <div className="mt-1 text-sm text-slate-600">Use simulation to validate changes before activating policies.</div>
                      <div className="mt-3"><Button variant="outline" onClick={() => toast({ kind: "info", title: "Run full simulation", message: "This would run scenario suite." })}><ChevronRight className="h-4 w-4" /> Scenario suite</Button></div>
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
                      <div className="text-sm font-semibold text-slate-900">Premium policy control</div>
                      <div className="mt-1 text-sm text-slate-600">Out-of-policy handling, attestations, and attachment thresholds.</div>
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
                    <div className="mt-1 text-sm text-slate-600">Keep policies simple and predictable. Put exceptions behind attestations and approvals.</div>
                  </div>
                </div>
                <Button variant="primary" disabled={!canEdit} title={!canEdit ? "Admin required" : "New"} onClick={() => setAddOpen(true)}>
                  <Plus className="h-4 w-4" /> New policy
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={addOpen}
        title="Create policy"
        subtitle="Draft rule with basic conditions"
        onClose={() => setAddOpen(false)}
        footer={
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm text-slate-600"><Info className="h-4 w-4" /> Draft policies must be reviewed before activation.</div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={addRule}><Check className="h-4 w-4" /> Create</Button>
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
                <div className="text-xs font-semibold text-slate-600">Module</div>
                <div className="mt-1"><Select value={draftModule} onChange={setDraftModule} options={["CorporatePay", "E-Commerce", "Services", "EV Charging", "Rides & Logistics", "Shoppable Adz"]} /></div>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-600">Amount gte (UGX)</div>
                <div className="mt-1"><input value={draftAmount} onChange={(e) => setDraftAmount(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold" /></div>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-600">Action</div>
                <div className="mt-1"><Select value={draftAction} onChange={(v) => setDraftAction(v as Severity)} options={["Allow", "Require approval", "Require attestation", "Block"]} /></div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                <div className="flex items-start gap-2"><Info className="mt-0.5 h-4 w-4" /><div>Out-of-policy handling is chosen automatically for the draft, but can be customized in Admin Console.</div></div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-semibold text-slate-900">Preview</div>
            <div className="mt-3 space-y-2 text-sm text-slate-700">
              <div className="flex items-center justify-between"><span className="text-slate-500">Name</span><span className="font-semibold">{draftName}</span></div>
              <div className="flex items-center justify-between"><span className="text-slate-500">Module</span><span className="font-semibold">{draftModule}</span></div>
              <div className="flex items-center justify-between"><span className="text-slate-500">Threshold</span><span className="font-semibold">{formatUGX(Number(draftAmount.replace(/[^0-9]/g, "")) || 0)}</span></div>
              <div className="flex items-center justify-between"><span className="text-slate-500">Decision</span><span className="font-semibold">{draftAction}</span></div>
              <div className="mt-3"><Pill label="Draft" tone="warn" /> <Pill label="Audit-ready" tone="neutral" /></div>
              <div className="mt-4"><Button variant="outline" onClick={openAdmin}><ChevronRight className="h-4 w-4" /> Advanced editor</Button></div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
