import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BadgeCheck,
  Bell,
  Building2,
  Check,
  ChevronRight,
  Copy,
  FileText,
  HelpCircle,
  Info,
  LifeBuoy,
  Lock,
  MessageCircle,
  Phone,
  Search,
  Server,
  ShieldAlert,
  Sparkles,
  Wrench,
  X,
} from "lucide-react";

const EVZ = { green: "#03CD8C", orange: "#F77F00" };

type OrgRole = "Viewer" | "Member" | "Approver" | "Finance" | "Admin" | "Owner";

type Org = { id: string; name: string; role: OrgRole };

type CaseStatus = "Open" | "In progress" | "Waiting" | "Resolved" | "Escalated";

type CaseType = "Payout not received" | "Unauthorized tx" | "Chargeback" | "KYB" | "Provider outage" | "Policy dispute";

type SupportCase = {
  id: string;
  createdAt: string;
  org: string;
  type: CaseType;
  status: CaseStatus;
  priority: "Low" | "Medium" | "High";
  sla: { target: string; remaining: string; breached: boolean };
  subject: string;
  assignee: string;
  channel: "In-app" | "Email" | "WhatsApp" | "WeChat";
  notes: string;
};

type ToolMode = "Read-only" | "Guided";

type ToolItem = {
  id: string;
  name: string;
  mode: ToolMode;
  risk: "Low" | "Medium" | "High";
  description: string;
  requiresDualControl: boolean;
};

type Incident = {
  id: string;
  createdAt: string;
  title: string;
  status: "Investigating" | "Identified" | "Monitoring" | "Resolved";
  impact: "Minor" | "Major" | "Critical";
  affected: string[];
  message: string;
  orgBannerEnabled: boolean;
};

type Toast = { id: string; title: string; message?: string; kind: "success" | "warn" | "error" | "info" };

function cn(...p: Array<string | false | null | undefined>) {
  return p.filter(Boolean).join(" ");
}
function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
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

function toneForImpact(i: Incident["impact"]) {
  if (i === "Critical") return "bad" as const;
  if (i === "Major") return "warn" as const;
  return "info" as const;
}

function toneForCaseStatus(s: CaseStatus) {
  if (s === "Resolved") return "good" as const;
  if (s === "Escalated") return "warn" as const;
  if (s === "Open" || s === "In progress") return "info" as const;
  return "neutral" as const;
}

function Button({
  variant = "outline",
  children,
  onClick,
  disabled,
  className,
  title,
}: {
  variant?: "primary" | "accent" | "outline" | "ghost" | "danger";
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  title?: string;
}) {
  const base = "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-4";
  const variants: Record<string, string> = {
    primary: "text-white shadow-[0_12px_24px_rgba(3,205,140,0.22)] hover:opacity-95 focus:ring-emerald-200",
    accent: "text-white shadow-[0_12px_24px_rgba(247,127,0,0.22)] hover:opacity-95 focus:ring-orange-200",
    outline: "border border-slate-200 bg-white text-slate-800 shadow-sm hover:bg-slate-50 focus:ring-slate-200",
    ghost: "bg-transparent text-slate-700 hover:bg-slate-100 focus:ring-slate-200",
    danger: "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 focus:ring-rose-100",
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

function Drawer({
  open,
  title,
  subtitle,
  children,
  onClose,
  footer,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onClose: () => void;
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
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 30, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-[560px] overflow-hidden border-l border-slate-200 bg-white shadow-[0_20px_70px_rgba(2,8,23,0.22)]"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
              <div className="min-w-0">
                <div className="text-base font-semibold text-slate-900">{title}</div>
                {subtitle ? <div className="mt-1 truncate text-sm text-slate-600">{subtitle}</div> : null}
              </div>
              <button className="rounded-2xl p-2 text-slate-600 hover:bg-slate-100" onClick={onClose} aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="h-[calc(100vh-140px)] overflow-auto px-5 py-4">{children}</div>
            {footer ? <div className="border-t border-slate-200 bg-slate-50 px-5 py-4">{footer}</div> : null}
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: Array<{ value: string; label: string }> }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-100"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export default function SupportAdminTools() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = (t: Omit<Toast, "id">) => {
    const id = uid("toast");
    setToasts((p) => [{ id, ...t }, ...p].slice(0, 4));
    window.setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 3200);
  };

  const orgs = useMemo<Org[]>(
    () => [
      { id: "org_acme", name: "Acme Group Ltd", role: "Admin" },
      { id: "org_khl", name: "Kampala Holdings", role: "Viewer" },
    ],
    []
  );

  const [orgId, setOrgId] = useState(orgs[0].id);
  const org = useMemo(() => orgs.find((o) => o.id === orgId) || orgs[0], [orgs, orgId]);
  const canSupport = useMemo(() => ["Owner", "Admin", "Finance"].includes(org.role), [org.role]);

  const [tab, setTab] = useState<"Cases" | "Tools" | "Incidents">("Cases");

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"ALL" | CaseStatus>("ALL");

  const cases = useMemo<SupportCase[]>(
    () => [
      {
        id: "CASE-901",
        createdAt: "Today 07:10",
        org: "Acme Group Ltd",
        type: "Payout not received",
        status: "Open",
        priority: "High",
        sla: { target: "4h", remaining: "3h 20m", breached: false },
        subject: "Bank payout failed",
        assignee: "EVzone Support",
        channel: "WhatsApp",
        notes: "Beneficiary name mismatch. Awaiting updated details.",
      },
      {
        id: "CASE-902",
        createdAt: "Yesterday",
        org: "Acme Group Ltd",
        type: "Provider outage",
        status: "In progress",
        priority: "Medium",
        sla: { target: "12h", remaining: "6h", breached: false },
        subject: "Card deposits delayed",
        assignee: "Payments Desk",
        channel: "In-app",
        notes: "PSP incident ongoing.",
      },
      {
        id: "CASE-903",
        createdAt: "Last week",
        org: "Kampala Holdings",
        type: "Policy dispute",
        status: "Escalated",
        priority: "Medium",
        sla: { target: "24h", remaining: "Breached", breached: true },
        subject: "Approval threshold dispute",
        assignee: "Compliance Desk",
        channel: "Email",
        notes: "Customer requested exception.",
      },
    ],
    []
  );

  const tools = useMemo<ToolItem[]>(
    () => [
      { id: "T-1", name: "View transaction", mode: "Read-only", risk: "Low", description: "Lookup tx and receipt", requiresDualControl: false },
      { id: "T-2", name: "Trigger webhook retry", mode: "Guided", risk: "Medium", description: "Retry failed delivery with confirmation", requiresDualControl: true },
      { id: "T-3", name: "Place org banner", mode: "Guided", risk: "Medium", description: "Publish incident banner to org users", requiresDualControl: true },
      { id: "T-4", name: "Lock withdrawals", mode: "Guided", risk: "High", description: "Emergency payout lock", requiresDualControl: true },
      { id: "T-5", name: "Generate forensics ZIP", mode: "Guided", risk: "High", description: "Audit export with hashes", requiresDualControl: true },
    ],
    []
  );

  const [incidents, setIncidents] = useState<Incident[]>([
    {
      id: "INC-12",
      createdAt: "Today 06:50",
      title: "Bank payouts delay",
      status: "Monitoring",
      impact: "Major",
      affected: ["Bank Transfer", "CorporatePay"],
      message: "Some bank payouts may take 30 to 60 minutes.",
      orgBannerEnabled: true,
    },
    {
      id: "INC-11",
      createdAt: "Last week",
      title: "Card deposit outage",
      status: "Resolved",
      impact: "Critical",
      affected: ["Card"],
      message: "Card deposits were delayed. Issue resolved.",
      orgBannerEnabled: false,
    },
  ]);

  const filteredCases = useMemo(() => {
    const s = q.trim().toLowerCase();
    return cases
      .filter((c) => (status === "ALL" ? true : c.status === status))
      .filter((c) => (!s ? true : `${c.id} ${c.subject} ${c.type} ${c.org} ${c.assignee}`.toLowerCase().includes(s)));
  }, [cases, q, status]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeCase, setActiveCase] = useState<SupportCase | null>(null);

  const openCase = (c: SupportCase) => {
    setActiveCase(c);
    setDrawerOpen(true);
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ kind: "success", title: "Copied" });
    } catch {
      toast({ kind: "warn", title: "Copy failed" });
    }
  };

  const toggleBanner = (id: string) => {
    if (!canSupport) {
      toast({ kind: "warn", title: "Admin required" });
      return;
    }
    setIncidents((p) => p.map((i) => (i.id === id ? { ...i, orgBannerEnabled: !i.orgBannerEnabled } : i)));
    toast({ kind: "success", title: "Banner updated" });
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
                  <LifeBuoy className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">Support & Admin Tools</div>
                  <div className="mt-1 text-xs text-slate-500">Support cases, guided sessions, incidents, tools catalog, org-visible banners</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Pill label={`Org: ${org.name}`} tone="info" />
                    <Pill label={`Role: ${org.role}`} tone={canSupport ? "info" : "neutral"} />
                    <Pill label={`Cases: ${cases.length}`} tone="neutral" />
                    <Pill label={`Incidents: ${incidents.length}`} tone={incidents.some((i) => i.status !== "Resolved") ? "warn" : "neutral"} />
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="min-w-[260px]">
                  <Select value={orgId} onChange={setOrgId} options={orgs.map((o) => ({ value: o.id, label: o.name }))} />
                </div>
                <Button variant="outline" onClick={() => toast({ kind: "info", title: "Admin Console", message: "Deep link to support tools" })}>
                  <ChevronRight className="h-4 w-4" /> Admin Console
                </Button>
                <Button variant="primary" onClick={() => toast({ kind: "success", title: "Refreshed" })}>
                  <ChevronRight className="h-4 w-4" /> Refresh
                </Button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {(
                [
                  ["Cases", "Support cases"],
                  ["Tools", "Tools catalog"],
                  ["Incidents", "Incidents"],
                ] as Array<[typeof tab, string]>
              ).map(([k, label]) => (
                <Button key={k} variant={tab === k ? "primary" : "outline"} className="px-3 py-2" onClick={() => setTab(k)}>
                  {label}
                </Button>
              ))}
            </div>

            {!canSupport ? (
              <div className="mt-4 rounded-3xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-amber-800"><Lock className="h-5 w-5" /></div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Limited access</div>
                    <div className="mt-1 text-sm text-amber-900">Admin/Finance required for guided actions and incident banners.</div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="bg-slate-50 px-4 py-5 md:px-6">
            {tab === "Cases" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="space-y-4 lg:col-span-8">
                  <Section
                    title="Support cases"
                    subtitle="SLA tracking and escalation"
                    right={<Pill label={`${filteredCases.length} shown`} tone={filteredCases.length ? "neutral" : "warn"} />}
                  >
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                      <div className="md:col-span-6">
                        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5">
                          <Search className="h-4 w-4 text-slate-500" />
                          <input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Search cases"
                            className="w-full bg-transparent text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none"
                          />
                        </div>
                      </div>
                      <div className="md:col-span-3">
                        <select
                          value={status}
                          onChange={(e) => setStatus(e.target.value as any)}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-emerald-100"
                        >
                          {["ALL", "Open", "In progress", "Waiting", "Resolved", "Escalated"].map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="md:col-span-3 flex flex-wrap items-center gap-2">
                        <Button variant="outline" onClick={() => toast({ kind: "info", title: "Export", message: "Export cases" })}>
                          <ChevronRight className="h-4 w-4" /> Export
                        </Button>
                        <Button variant="outline" onClick={() => toast({ kind: "info", title: "New case", message: "Create case" })}>
                          <ChevronRight className="h-4 w-4" /> New
                        </Button>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      {filteredCases.map((c) => (
                        <button key={c.id} type="button" onClick={() => openCase(c)} className={cn("w-full rounded-3xl border p-4 text-left", c.sla.breached ? "border-rose-200 bg-rose-50" : "border-slate-200 bg-white hover:bg-slate-50")}>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="text-sm font-semibold text-slate-900">{c.subject}</div>
                                <Pill label={c.type} tone="neutral" />
                                <Pill label={c.status} tone={toneForCaseStatus(c.status)} />
                                <Pill label={c.priority} tone={c.priority === "High" ? "warn" : "neutral"} />
                                {c.sla.breached ? <Pill label="SLA breached" tone="bad" /> : <Pill label={`SLA ${c.sla.remaining}`} tone="neutral" />}
                                <Pill label={c.channel} tone={c.channel === "WhatsApp" || c.channel === "WeChat" ? "info" : "neutral"} />
                                <Pill label={c.id} tone="neutral" />
                              </div>
                              <div className="mt-1 text-sm text-slate-700">Org: {c.org} • Assignee: {c.assignee}</div>
                              <div className="mt-2 text-xs text-slate-500">{c.createdAt} • Target {c.sla.target}</div>
                              <div className="mt-2 text-xs text-slate-600">{c.notes}</div>
                            </div>
                            <Button variant="outline" className="px-3 py-2" onClick={() => openCase(c)}>
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </button>
                      ))}

                      {!filteredCases.length ? <div className="rounded-3xl border border-slate-200 bg-white p-4 text-sm text-slate-600">No cases match.</div> : null}
                    </div>
                  </Section>
                </div>

                <div className="space-y-4 lg:col-span-4">
                  <SummaryCard title="Guided sessions" subtitle="Help users resolve issues" bullets={["Join session with user", "Explain policy reasons", "Request missing docs", "Trigger safe actions"]} />
                  <SummaryCard title="Escalation" subtitle="When to escalate" bullets={["SLA breach", "High risk fraud", "Provider outage", "Compliance lock"]} />
                </div>
              </div>
            ) : null}

            {tab === "Tools" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="space-y-4 lg:col-span-8">
                  <Section title="Tools catalog" subtitle="Read-only vs guided actions" right={<Pill label={`${tools.length} tools`} tone="neutral" />}>
                    <div className="space-y-2">
                      {tools.map((t) => (
                        <div key={t.id} className={cn("rounded-3xl border p-4", t.mode === "Guided" ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white")}>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="text-sm font-semibold text-slate-900">{t.name}</div>
                                <Pill label={t.mode} tone={t.mode === "Guided" ? "warn" : "neutral"} />
                                <Pill label={`Risk ${t.risk}`} tone={t.risk === "High" ? "bad" : t.risk === "Medium" ? "warn" : "good"} />
                                {t.requiresDualControl ? <Pill label="Dual-control" tone="info" /> : null}
                                <Pill label={t.id} tone="neutral" />
                              </div>
                              <div className="mt-1 text-sm text-slate-700">{t.description}</div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Button
                                variant={t.mode === "Guided" ? "primary" : "outline"}
                                disabled={!canSupport && t.mode === "Guided"}
                                title={!canSupport && t.mode === "Guided" ? "Admin required" : "Run"}
                                onClick={() => toast({ kind: "info", title: "Run tool", message: `${t.name} (${t.mode})` })}
                              >
                                <ChevronRight className="h-4 w-4" /> Run
                              </Button>
                              <Button variant="outline" onClick={() => toast({ kind: "info", title: "Docs", message: t.id })}>
                                <ChevronRight className="h-4 w-4" /> Docs
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                      <div className="flex items-start gap-2"><Info className="mt-0.5 h-4 w-4" /><div>Guided tools require confirmations and create audit logs. Read-only tools are safe.</div></div>
                    </div>
                  </Section>
                </div>
                <div className="space-y-4 lg:col-span-4">
                  <SummaryCard title="Safety model" subtitle="How tools are controlled" bullets={["Read-only tools: no change", "Guided tools: confirmations", "Dual-control for high risk", "All actions audited"]} />
                </div>
              </div>
            ) : null}

            {tab === "Incidents" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="space-y-4 lg:col-span-8">
                  <Section title="Incidents" subtitle="Incidents/outages and org-visible banners" right={<Pill label={`${incidents.filter((i) => i.status !== "Resolved").length} active`} tone={incidents.some((i) => i.status !== "Resolved") ? "warn" : "neutral"} />}>
                    <div className="space-y-2">
                      {incidents.map((i) => (
                        <div key={i.id} className={cn("rounded-3xl border p-4", i.status !== "Resolved" ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white")}>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="text-sm font-semibold text-slate-900">{i.title}</div>
                                <Pill label={i.status} tone={i.status === "Resolved" ? "good" : "warn"} />
                                <Pill label={i.impact} tone={toneForImpact(i.impact)} />
                                <Pill label={i.id} tone="neutral" />
                              </div>
                              <div className="mt-1 text-sm text-slate-700">{i.message}</div>
                              <div className="mt-2 text-xs text-slate-600">Affected: {i.affected.join(", ")}</div>
                              <div className="mt-2 text-xs text-slate-500">{i.createdAt}</div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Button
                                variant={i.orgBannerEnabled ? "primary" : "outline"}
                                disabled={!canSupport}
                                title={!canSupport ? "Admin required" : "Toggle banner"}
                                onClick={() => toggleBanner(i.id)}
                              >
                                <Bell className="h-4 w-4" /> {i.orgBannerEnabled ? "Banner ON" : "Banner OFF"}
                              </Button>
                              <Button variant="outline" onClick={() => toast({ kind: "info", title: "Comms", message: "Open incident comms" })}>
                                <ChevronRight className="h-4 w-4" /> Comms
                              </Button>
                            </div>
                          </div>

                          {i.orgBannerEnabled ? (
                            <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3 text-xs text-slate-700">
                              <div className="flex items-start gap-2">
                                <Info className="mt-0.5 h-4 w-4" />
                                <div>
                                  <div className="font-semibold">Org-visible banner</div>
                                  <div className="mt-1">Users will see an in-app banner on Wallet Home and checkout.</div>
                                </div>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      ))}

                      <div className="pt-2 flex flex-wrap items-center gap-2">
                        <Button variant="primary" disabled={!canSupport} onClick={() => toast({ kind: "info", title: "New incident", message: "Create incident" })}>
                          <ChevronRight className="h-4 w-4" /> New incident
                        </Button>
                        <Button variant="outline" onClick={() => toast({ kind: "info", title: "Status page", message: "Open status page" })}>
                          <ChevronRight className="h-4 w-4" /> Status page
                        </Button>
                      </div>
                    </div>
                  </Section>
                </div>
                <div className="space-y-4 lg:col-span-4">
                  <SummaryCard title="Incident comms" subtitle="Recommended" bullets={["Banner on Wallet Home", "Push + email updates", "WhatsApp/WeChat broadcasts", "Postmortem export"]} />
                </div>
              </div>
            ) : null}

            <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-50 text-slate-700"><Info className="h-5 w-5" /></div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Tip</div>
                    <div className="mt-1 text-sm text-slate-600">Use incident banners for PSP outages so users understand delays and avoid duplicate retries.</div>
                  </div>
                </div>
                <Button variant="outline" onClick={() => toast({ kind: "info", title: "Policies", message: "Open policy builder" })}>
                  <ChevronRight className="h-4 w-4" /> Policies
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Drawer
        open={drawerOpen}
        title={activeCase ? `${activeCase.subject}` : "Case"}
        subtitle={activeCase ? `${activeCase.id} • ${activeCase.status}` : ""}
        onClose={() => setDrawerOpen(false)}
        footer={
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm text-slate-600"><Info className="h-4 w-4" /> Actions are logged.</div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setDrawerOpen(false)}>Close</Button>
              <Button variant="primary" disabled={!canSupport} onClick={() => toast({ kind: "info", title: "Guided session", message: "Start guided session" })}>
                <ChevronRight className="h-4 w-4" /> Guided session
              </Button>
            </div>
          </div>
        }
      >
        {activeCase ? (
          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Pill label={activeCase.type} tone="neutral" />
                <Pill label={activeCase.status} tone={toneForCaseStatus(activeCase.status)} />
                <Pill label={activeCase.priority} tone={activeCase.priority === "High" ? "warn" : "neutral"} />
                {activeCase.sla.breached ? <Pill label="SLA breached" tone="bad" /> : <Pill label={`SLA ${activeCase.sla.remaining}`} tone="neutral" />}
                <Pill label={activeCase.channel} tone={activeCase.channel === "WhatsApp" || activeCase.channel === "WeChat" ? "info" : "neutral"} />
              </div>
              <div className="mt-3 text-sm text-slate-700">Assignee: <span className="font-semibold text-slate-900">{activeCase.assignee}</span></div>
              <div className="mt-1 text-xs text-slate-500">Created: {activeCase.createdAt} • Target {activeCase.sla.target}</div>
              <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">{activeCase.notes}</div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="text-sm font-semibold text-slate-900">Suggested tools</div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={() => toast({ kind: "info", title: "View transaction", message: "Read-only" })}>
                  <ChevronRight className="h-4 w-4" /> View transaction
                </Button>
                <Button variant="outline" disabled={!canSupport} onClick={() => toast({ kind: "info", title: "Retry payout", message: "Guided" })}>
                  <ChevronRight className="h-4 w-4" /> Retry payout
                </Button>
                <Button variant="outline" disabled={!canSupport} onClick={() => toast({ kind: "info", title: "Add banner", message: "Guided" })}>
                  <ChevronRight className="h-4 w-4" /> Add banner
                </Button>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="text-sm font-semibold text-slate-900">Comms</div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={() => toast({ kind: "info", title: "Open thread", message: activeCase.channel })}>
                  <MessageCircle className="h-4 w-4" /> Thread
                </Button>
                <Button variant="outline" onClick={() => toast({ kind: "info", title: "Call", message: "Start call" })}>
                  <Phone className="h-4 w-4" /> Call
                </Button>
                <Button variant="outline" onClick={() => toast({ kind: "info", title: "Escalate", message: "Escalate" })}>
                  <ChevronRight className="h-4 w-4" /> Escalate
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}

function SummaryCard({ title, subtitle, bullets }: { title: string; subtitle: string; bullets: string[] }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-sm font-semibold text-slate-900">{title}</div>
      <div className="mt-1 text-xs text-slate-500">{subtitle}</div>
      <ul className="mt-3 space-y-2 text-sm text-slate-700">
        {bullets.map((b) => (
          <li key={b} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-400" />{b}</li>
        ))}
      </ul>
    </div>
  );
}
