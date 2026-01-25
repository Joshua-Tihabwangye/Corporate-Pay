import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  AlertTriangle,
  BadgeCheck,
  Check,
  ChevronRight,
  Code,
  Copy,
  Download,
  Globe,
  Info,
  KeyRound,
  ListChecks,
  Package,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Terminal,
  Trash2,
  Webhook,
  X,
} from "lucide-react";

const EVZ = { green: "#03CD8C", orange: "#F77F00" };

type OrgRole = "Viewer" | "Member" | "Approver" | "Finance" | "Admin" | "Owner";

type Org = { id: string; name: string; role: OrgRole };

type Env = "Sandbox" | "Production";

type Scope =
  | "wallet.read"
  | "wallet.write"
  | "transactions.read"
  | "transactions.export"
  | "approvals.read"
  | "approvals.write"
  | "payouts.write"
  | "invoices.read"
  | "webhooks.manage";

type ApiKey = {
  id: string;
  name: string;
  env: Env;
  createdAt: string;
  lastUsed: string;
  scopes: Scope[];
  status: "Active" | "Revoked";
  masked: string;
};

type WebhookEvent =
  | "wallet.deposit.created"
  | "wallet.deposit.posted"
  | "wallet.withdrawal.created"
  | "wallet.withdrawal.failed"
  | "wallet.payout.queued"
  | "wallet.payout.paid"
  | "wallet.payout.failed"
  | "wallet.transfer.created"
  | "wallet.fx.converted"
  | "wallet.dispute.opened"
  | "approvals.requested"
  | "approvals.decided"
  | "invoices.issued";

type WebhookEndpoint = {
  id: string;
  url: string;
  env: Env;
  enabled: boolean;
  secretMasked: string;
  events: WebhookEvent[];
  lastDelivery: { status: "Success" | "Failed"; when: string; code: number };
};

type Delivery = {
  id: string;
  endpointId: string;
  event: WebhookEvent;
  when: string;
  status: "Success" | "Failed";
  code: number;
  attempts: number;
  requestId: string;
  payloadPreview: string;
};

type ExportJob = {
  id: string;
  type: "Transactions" | "Approvals" | "Invoices";
  format: "CSV" | "JSON";
  env: Env;
  createdAt: string;
  status: "Queued" | "Running" | "Ready" | "Failed";
  note: string;
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
            className="fixed inset-y-0 right-0 z-50 w-full max-w-[560px] flex flex-col overflow-hidden border-l border-slate-200 bg-white shadow-[0_20px_70px_rgba(2,8,23,0.22)]"
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
            <div className="flex-1 overflow-auto px-5 py-4">{children}</div>
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

export default function IntegrationsDeveloperCenter() {
  const navigate = useNavigate();
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
  const canDev = useMemo(() => ["Owner", "Admin"].includes(org.role), [org.role]);

  const [env, setEnv] = useState<Env>("Sandbox");

  const [keys, setKeys] = useState<ApiKey[]>([
    {
      id: "KEY-1",
      name: "Server key",
      env: "Production",
      createdAt: "Last month",
      lastUsed: "Today",
      scopes: ["wallet.read", "wallet.write", "transactions.read", "approvals.read", "webhooks.manage"],
      status: "Active",
      masked: "sk_live_•••••••••••A1",
    },
    {
      id: "KEY-2",
      name: "Sandbox key",
      env: "Sandbox",
      createdAt: "Last week",
      lastUsed: "Yesterday",
      scopes: ["wallet.read", "wallet.write", "transactions.read", "webhooks.manage"],
      status: "Active",
      masked: "sk_test_•••••••••••B2",
    },
  ]);

  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([
    {
      id: "WH-1",
      url: "https://example.com/webhooks/wallet",
      env: "Production",
      enabled: true,
      secretMasked: "whsec_••••••••C1",
      events: ["wallet.deposit.posted", "wallet.withdrawal.failed", "wallet.payout.paid", "approvals.decided", "invoices.issued"],
      lastDelivery: { status: "Success", when: "5m ago", code: 200 },
    },
    {
      id: "WH-2",
      url: "https://sandbox.example.com/webhooks",
      env: "Sandbox",
      enabled: true,
      secretMasked: "whsec_••••••••T1",
      events: ["wallet.deposit.created", "wallet.payout.queued"],
      lastDelivery: { status: "Failed", when: "1h ago", code: 500 },
    },
  ]);

  const [deliveries, setDeliveries] = useState<Delivery[]>([
    {
      id: "D-1",
      endpointId: "WH-1",
      event: "wallet.payout.paid",
      when: "5m ago",
      status: "Success",
      code: 200,
      attempts: 1,
      requestId: "req_9a12",
      payloadPreview: "{\"payout_id\":\"PO-3102\",\"state\":\"paid\"}",
    },
    {
      id: "D-2",
      endpointId: "WH-2",
      event: "wallet.deposit.created",
      when: "1h ago",
      status: "Failed",
      code: 500,
      attempts: 3,
      requestId: "req_8b77",
      payloadPreview: "{\"deposit_id\":\"TX-9004\",\"state\":\"created\"}",
    },
  ]);

  const [jobs, setJobs] = useState<ExportJob[]>([
    { id: "JOB-200", type: "Transactions", format: "CSV", env: "Production", createdAt: "Today", status: "Ready", note: "Last 30 days" },
    { id: "JOB-201", type: "Approvals", format: "JSON", env: "Production", createdAt: "Yesterday", status: "Running", note: "Pending" },
    { id: "JOB-202", type: "Invoices", format: "CSV", env: "Sandbox", createdAt: "Last week", status: "Failed", note: "Timeout" },
  ]);

  const visibleKeys = useMemo(() => keys.filter((k) => k.env === env), [keys, env]);
  const visibleEndpoints = useMemo(() => endpoints.filter((e) => e.env === env), [endpoints, env]);
  const visibleJobs = useMemo(() => jobs.filter((j) => j.env === env), [jobs, env]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeDelivery, setActiveDelivery] = useState<Delivery | null>(null);

  const openDelivery = (d: Delivery) => {
    setActiveDelivery(d);
    setDrawerOpen(true);
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ kind: "success", title: "Copied" });
    } catch {
      toast({ kind: "warn", title: "Copy failed", message: "Clipboard blocked" });
    }
  };

  const createKey = () => {
    if (!canDev) {
      toast({ kind: "warn", title: "Admin required" });
      return;
    }
    const id = `KEY-${Math.floor(10 + Math.random() * 90)}`;
    setKeys((p) => [
      {
        id,
        name: `${env} key`,
        env,
        createdAt: "Just now",
        lastUsed: "Never",
        scopes: ["wallet.read", "transactions.read", "webhooks.manage"],
        status: "Active",
        masked: env === "Production" ? "sk_live_••••••••NEW" : "sk_test_••••••••NEW",
      },
      ...p,
    ]);
    toast({ kind: "success", title: "API key created", message: `${env} • ${id}` });
  };

  const revokeKey = (id: string) => {
    if (!canDev) {
      toast({ kind: "warn", title: "Admin required" });
      return;
    }
    setKeys((p) => p.map((k) => (k.id === id ? { ...k, status: "Revoked" } : k)));
    toast({ kind: "info", title: "Key revoked", message: id });
  };

  const toggleEndpoint = (id: string) => {
    if (!canDev) {
      toast({ kind: "warn", title: "Admin required" });
      return;
    }
    setEndpoints((p) => p.map((e) => (e.id === id ? { ...e, enabled: !e.enabled } : e)));
    toast({ kind: "success", title: "Endpoint updated" });
  };

  const retryDelivery = (id: string) => {
    if (!canDev) {
      toast({ kind: "warn", title: "Admin required" });
      return;
    }
    setDeliveries((p) => p.map((d) => (d.id === id ? { ...d, attempts: d.attempts + 1, status: "Success", code: 200, when: "Just now" } : d)));
    toast({ kind: "success", title: "Delivery retried", message: id });
  };

  const createExportJob = (type: ExportJob["type"], format: ExportJob["format"]) => {
    if (!canDev && type !== "Invoices") {
      toast({ kind: "warn", title: "Admin required" });
      return;
    }
    const id = `JOB-${Math.floor(300 + Math.random() * 900)}`;
    setJobs((p) => [{ id, type, format, env, createdAt: "Just now", status: "Queued", note: "Export job" }, ...p]);
    toast({ kind: "success", title: "Export queued", message: `${type} • ${format}` });
    window.setTimeout(() => setJobs((p) => p.map((j) => (j.id === id ? { ...j, status: "Running" } : j))), 900);
    window.setTimeout(() => setJobs((p) => p.map((j) => (j.id === id ? { ...j, status: "Ready" } : j))), 2100);
  };

  const downloadJob = (id: string) => toast({ kind: "info", title: "Download", message: `Would download ${id}` });

  const openAdmin = () => toast({ kind: "info", title: "Admin Console", message: "Deep link to Integrations section" });

  const walletEvents = useMemo<WebhookEvent[]>(
    () => [
      "wallet.deposit.created",
      "wallet.deposit.posted",
      "wallet.withdrawal.created",
      "wallet.withdrawal.failed",
      "wallet.payout.queued",
      "wallet.payout.paid",
      "wallet.payout.failed",
      "wallet.transfer.created",
      "wallet.fx.converted",
      "wallet.dispute.opened",
    ],
    []
  );

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
                  <Code className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">Integrations & Developer Center</div>
                  <div className="mt-1 text-xs text-slate-500">API keys, webhooks, inspector, retries, and export jobs</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Pill label={`Org: ${org.name}`} tone="info" />
                    <Pill label={`Role: ${org.role}`} tone={canDev ? "info" : "neutral"} />
                    <Pill label={`Env: ${env}`} tone={env === "Production" ? "warn" : "neutral"} />
                    <Pill label={`Wallet events: ${walletEvents.length}`} tone="info" />
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="min-w-[260px]">
                  <Select value={orgId} onChange={setOrgId} options={orgs.map((o) => ({ value: o.id, label: o.name }))} />
                </div>
                <Button variant={env === "Sandbox" ? "primary" : "outline"} className="px-3 py-2" onClick={() => setEnv("Sandbox")}>Sandbox</Button>
                <Button variant={env === "Production" ? "primary" : "outline"} className="px-3 py-2" onClick={() => setEnv("Production")}>Production</Button>
                <Button variant="outline" onClick={openAdmin}><ChevronRight className="h-4 w-4" /> Admin Console</Button>
              </div>
            </div>

            {!canDev ? (
              <div className="mt-4 rounded-3xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-amber-800"><AlertTriangle className="h-5 w-5" /></div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Limited access</div>
                    <div className="mt-1 text-sm text-amber-900">Only Admin/Owner can manage API keys and webhooks.</div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="bg-slate-50 px-4 py-5 md:px-6">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              <div className="space-y-4 lg:col-span-8">
                <Section
                  title="API keys"
                  subtitle="Scopes and sandbox vs production"
                  right={<Button variant="primary" disabled={!canDev} onClick={createKey}><KeyRound className="h-4 w-4" /> New key</Button>}
                >
                  <div className="space-y-2">
                    {visibleKeys.map((k) => (
                      <div key={k.id} className={cn("rounded-3xl border p-4", k.status === "Revoked" ? "border-slate-200 bg-slate-50" : "border-slate-200 bg-white")}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="text-sm font-semibold text-slate-900">{k.name}</div>
                              <Pill label={k.env} tone={k.env === "Production" ? "warn" : "neutral"} />
                              <Pill label={k.status} tone={k.status === "Active" ? "good" : "neutral"} />
                              <Pill label={k.id} tone="neutral" />
                            </div>
                            <div className="mt-1 text-sm text-slate-700">{k.masked}</div>
                            <div className="mt-1 text-xs text-slate-500">Created {k.createdAt} • Last used {k.lastUsed}</div>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              {k.scopes.slice(0, 5).map((s) => (
                                <Pill key={s} label={s} tone="neutral" />
                              ))}
                              {k.scopes.length > 5 ? <Pill label={`+${k.scopes.length - 5} more`} tone="neutral" /> : null}
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Button variant="outline" className="px-3 py-2" onClick={() => copy(k.masked)}>
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" className="px-3 py-2" onClick={() => toast({ kind: "info", title: "Rotate", message: "Rotate key" })} disabled={!canDev}>
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" className="px-3 py-2" onClick={() => revokeKey(k.id)} disabled={!canDev || k.status === "Revoked"}>
                              Revoke
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {!visibleKeys.length ? <div className="rounded-3xl border border-slate-200 bg-white p-4 text-sm text-slate-600">No keys for this environment.</div> : null}
                  </div>
                </Section>

                <Section
                  title="Webhooks"
                  subtitle="Endpoints, wallet events, inspector and retries"
                  right={<Pill label={`${visibleEndpoints.length} endpoint(s)`} tone="neutral" />}
                >
                  <div className="space-y-2">
                    {visibleEndpoints.map((e) => (
                      <div key={e.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="text-sm font-semibold text-slate-900">{e.url}</div>
                              <Pill label={e.id} tone="neutral" />
                              <Pill label={e.enabled ? "Enabled" : "Disabled"} tone={e.enabled ? "good" : "neutral"} />
                              <Pill label={e.lastDelivery.status} tone={e.lastDelivery.status === "Success" ? "good" : "warn"} />
                              <Pill label={`${e.lastDelivery.code}`} tone="neutral" />
                            </div>
                            <div className="mt-1 text-xs text-slate-500">Secret: {e.secretMasked} • Last delivery {e.lastDelivery.when}</div>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              {e.events.slice(0, 4).map((ev) => (
                                <Pill key={ev} label={ev} tone={ev.startsWith("wallet.") ? "info" : "neutral"} />
                              ))}
                              {e.events.length > 4 ? <Pill label={`+${e.events.length - 4} more`} tone="neutral" /> : null}
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Button variant={e.enabled ? "primary" : "outline"} disabled={!canDev} className="px-3 py-2" onClick={() => toggleEndpoint(e.id)}>
                              {e.enabled ? "ON" : "OFF"}
                            </Button>
                            <Button variant="outline" className="px-3 py-2" onClick={() => toast({ kind: "info", title: "Inspector", message: "Scroll to delivery inspector" })}>
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}

                    <div className="pt-2 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <div className="text-sm font-semibold text-slate-900">Wallet webhook events</div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {walletEvents.slice(0, 8).map((ev) => (
                          <Pill key={ev} label={ev} tone="info" />
                        ))}
                        {walletEvents.length > 8 ? <Pill label={`+${walletEvents.length - 8} more`} tone="neutral" /> : null}
                      </div>
                    </div>
                  </div>
                </Section>

                <Section
                  title="Webhook inspector"
                  subtitle="Delivery logs and retries"
                  right={<Pill label={`${deliveries.length} delivery(s)`} tone="neutral" />}
                >
                  <div className="space-y-2">
                    {deliveries.filter((d) => (env === "Sandbox" ? d.endpointId === "WH-2" : d.endpointId === "WH-1")).map((d) => (
                      <button key={d.id} type="button" onClick={() => openDelivery(d)} className={cn("w-full rounded-3xl border p-4 text-left", d.status === "Success" ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50")}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="text-sm font-semibold text-slate-900">{d.event}</div>
                              <Pill label={d.status} tone={d.status === "Success" ? "good" : "warn"} />
                              <Pill label={`${d.code}`} tone="neutral" />
                              <Pill label={`Attempts ${d.attempts}`} tone={d.attempts > 1 ? "warn" : "neutral"} />
                            </div>
                            <div className="mt-1 text-xs text-slate-600">{d.when} • {d.requestId}</div>
                            <div className="mt-2 text-xs text-slate-700">{d.payloadPreview}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant={d.status === "Failed" ? "primary" : "outline"}
                              disabled={!canDev || d.status !== "Failed"}
                              title={!canDev ? "Admin required" : d.status !== "Failed" ? "No retry" : "Retry"}
                              onClick={() => retryDelivery(d.id)}
                            >
                              <RefreshCcw className="h-4 w-4" /> Retry
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => openDelivery(d)}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </Section>

                <Section
                  title="Export jobs"
                  subtitle="CSV and JSON for transactions, approvals, invoices"
                  right={<Pill label={`${visibleJobs.length} job(s)`} tone="neutral" />}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="primary" disabled={!canDev} onClick={() => createExportJob("Transactions", "CSV")}>
                      <ChevronRight className="h-4 w-4" /> Transactions CSV
                    </Button>
                    <Button variant="outline" disabled={!canDev} onClick={() => createExportJob("Approvals", "JSON")}>
                      <ChevronRight className="h-4 w-4" /> Approvals JSON
                    </Button>
                    <Button variant="outline" onClick={() => createExportJob("Invoices", "CSV")}>
                      <ChevronRight className="h-4 w-4" /> Invoices CSV
                    </Button>
                  </div>

                  <div className="mt-4 space-y-2">
                    {visibleJobs.map((j) => (
                      <div key={j.id} className={cn("rounded-3xl border p-4", j.status === "Ready" ? "border-emerald-200 bg-emerald-50" : j.status === "Failed" ? "border-rose-200 bg-rose-50" : "border-slate-200 bg-white")}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="text-sm font-semibold text-slate-900">{j.id}</div>
                              <Pill label={j.type} tone="neutral" />
                              <Pill label={j.format} tone="neutral" />
                              <Pill label={j.status} tone={j.status === "Ready" ? "good" : j.status === "Failed" ? "bad" : "neutral"} />
                            </div>
                            <div className="mt-1 text-xs text-slate-500">{j.createdAt} • {j.note}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" className="px-3 py-2" onClick={() => toast({ kind: "info", title: "Open", message: j.id })}>
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                            <Button variant={j.status === "Ready" ? "primary" : "outline"} disabled={j.status !== "Ready"} title={j.status !== "Ready" ? "Not ready" : "Download"} onClick={() => downloadJob(j.id)}>
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>
              </div>

              <div className="space-y-4 lg:col-span-4">
                <div
                  className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                  style={{ background: "radial-gradient(90% 80% at 10% 0%, rgba(247,127,0,0.20), rgba(255,255,255,0)), radial-gradient(90% 80% at 90% 0%, rgba(3,205,140,0.16), rgba(255,255,255,0))" }}
                >
                  <div className="flex items-start gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-2xl text-white" style={{ background: EVZ.orange }}>
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Premium developer tools</div>
                      <div className="mt-1 text-sm text-slate-600">Webhooks for wallet events, delivery inspector, retries, and export jobs.</div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Pill label="API keys" tone="neutral" />
                        <Pill label="Webhooks" tone="neutral" />
                        <Pill label="Inspector" tone="neutral" />
                        <Pill label="Exports" tone="neutral" />
                      </div>
                      <div className="mt-3"><Button variant="outline" onClick={openAdmin}><ChevronRight className="h-4 w-4" /> Admin Console</Button></div>
                    </div>
                  </div>
                </div>

                <Section title="Security" subtitle="Best practices" right={<Pill label="Required" tone="warn" />}>
                  <div className="rounded-3xl border border-slate-200 bg-white p-4">
                    <div className="text-sm font-semibold text-slate-900">Keep secrets safe</div>
                    <ul className="mt-3 space-y-2 text-sm text-slate-700">
                      <li className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-400" />Use separate keys per environment</li>
                      <li className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-400" />Rotate webhook secrets regularly</li>
                      <li className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-400" />Restrict scopes to least privilege</li>
                    </ul>
                    <div className="mt-3"><Button variant="outline" onClick={() => toast({ kind: "info", title: "Docs", message: "Open security docs" })}><ChevronRight className="h-4 w-4" /> Docs</Button></div>
                  </div>
                </Section>

                <Section title="Docs" subtitle="Quick start" right={<Pill label={env} tone={env === "Production" ? "warn" : "neutral"} />}>
                  <div className="space-y-2">
                    <div className="rounded-3xl border border-slate-200 bg-white p-4">
                      <div className="text-sm font-semibold text-slate-900">Quick start</div>
                      <div className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                        <pre className="whitespace-pre-wrap">{`# Example (pseudo)
POST /v1/wallet/transfer
Authorization: Bearer <API_KEY>

{ "amount": 50000, "currency": "UGX", "to": "user_123" }`}</pre>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Button variant="outline" onClick={() => toast({ kind: "info", title: "Open docs", message: "Deep link to API docs" })}>
                          <ChevronRight className="h-4 w-4" /> API docs
                        </Button>
                        <Button variant="outline" onClick={() => toast({ kind: "info", title: "SDK", message: "Download SDK" })}>
                          <Download className="h-4 w-4" /> SDK
                        </Button>
                      </div>
                    </div>
                  </div>
                </Section>
              </div>
            </div>

            <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-50 text-slate-700"><Info className="h-5 w-5" /></div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Tip</div>
                    <div className="mt-1 text-sm text-slate-600">Add wallet events to webhooks so partners can sync deposits, withdrawals, and payouts.</div>
                  </div>
                </div>
                <Button variant="primary" disabled={!canDev} onClick={createKey}>
                  <KeyRound className="h-4 w-4" /> New key
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Drawer
        open={drawerOpen}
        title={activeDelivery ? `Delivery ${activeDelivery.id}` : "Delivery"}
        subtitle={activeDelivery ? `${activeDelivery.event} • ${activeDelivery.status}` : ""}
        onClose={() => setDrawerOpen(false)}
        footer={
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm text-slate-600"><Info className="h-4 w-4" /> Payloads are logged for debugging.</div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setDrawerOpen(false)}>Close</Button>
              {activeDelivery && activeDelivery.status === "Failed" ? (
                <Button variant="primary" disabled={!canDev} onClick={() => retryDelivery(activeDelivery.id)}>
                  <RefreshCcw className="h-4 w-4" /> Retry
                </Button>
              ) : null}
            </div>
          </div>
        }
      >
        {activeDelivery ? (
          <div className="space-y-4">
            <div className={cn("rounded-3xl border p-4", activeDelivery.status === "Success" ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50")}>
              <div className="flex items-start gap-3">
                <div className={cn("grid h-10 w-10 place-items-center rounded-2xl bg-white", activeDelivery.status === "Success" ? "text-emerald-700" : "text-amber-800")}>
                  {activeDelivery.status === "Success" ? <BadgeCheck className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">{activeDelivery.status}</div>
                  <div className="mt-1 text-sm text-slate-700">HTTP {activeDelivery.code} • Attempts {activeDelivery.attempts}</div>
                  <div className="mt-1 text-xs text-slate-600">Request {activeDelivery.requestId} • {activeDelivery.when}</div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="text-sm font-semibold text-slate-900">Payload</div>
              <div className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                <pre className="whitespace-pre-wrap">{activeDelivery.payloadPreview}</pre>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={() => copy(activeDelivery.payloadPreview)}>
                  <Copy className="h-4 w-4" /> Copy payload
                </Button>
                <Button variant="outline" onClick={() => toast({ kind: "info", title: "View headers", message: "Show headers" })}>
                  <ChevronRight className="h-4 w-4" /> Headers
                </Button>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="text-sm font-semibold text-slate-900">Actions</div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {activeDelivery.status === "Failed" ? (
                  <Button variant="primary" disabled={!canDev} onClick={() => retryDelivery(activeDelivery.id)}>
                    <RefreshCcw className="h-4 w-4" /> Retry
                  </Button>
                ) : null}
                <Button variant="outline" onClick={() => toast({ kind: "info", title: "Redeliver", message: "Schedule retry" })}>
                  <ChevronRight className="h-4 w-4" /> Schedule retry
                </Button>
                <Button variant="outline" onClick={() => toast({ kind: "info", title: "Inspect", message: "Open inspector" })}>
                  <ChevronRight className="h-4 w-4" /> Inspector
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
