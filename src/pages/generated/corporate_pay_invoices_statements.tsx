import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BadgeCheck,
  Building2,
  Calendar,
  Check,
  ChevronRight,
  Copy,
  Download,
  FileText,
  Filter,
  Info,
  Layers,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";

const EVZ = { green: "#03CD8C", orange: "#F77F00" };

type Currency = "UGX" | "USD" | "CNY" | "KES";

type OrgRole = "Viewer" | "Member" | "Approver" | "Finance" | "Admin" | "Owner";

type Org = { id: string; name: string; role: OrgRole };

type Entity = { id: string; name: string; country: string; currency: Currency };

type InvoiceGroup = { id: string; name: string; entityId: string; billingEmail: string };

type StatementFormat = "PDF" | "CSV" | "JSON" | "Forensics ZIP";

type InvoiceStatus = "Open" | "Paid" | "Overdue" | "Refund pending";

type Invoice = {
  id: string;
  entityId: string;
  invoiceGroupId: string;
  period: string;
  issuedAt: string;
  dueAt: string;
  status: InvoiceStatus;
  currency: Currency;
  total: number;
  balance: number;
  lineItems: Array<{ label: string; amount: number }>; 
  references: { internal: string; provider?: string };
};

type ExportJob = {
  id: string;
  createdAt: string;
  format: StatementFormat;
  scope: string;
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
function formatMoney(amount: number, currency: Currency) {
  const abs = Math.abs(amount);
  const isUGX = currency === "UGX";
  const decimals = isUGX ? 0 : 2;
  const num = abs.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return `${currency} ${num}`;
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

function toneForInvoiceStatus(s: InvoiceStatus) {
  if (s === "Paid") return "good" as const;
  if (s === "Overdue") return "bad" as const;
  if (s === "Open") return "info" as const;
  return "warn" as const;
}

function Button({
  variant = "outline",
  children,
  onClick,
  disabled,
  className,
  title,
}: {
  variant?: "primary" | "accent" | "outline" | "ghost";
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

export default function InvoicesStatements() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = (t: Omit<Toast, "id">) => {
    const id = uid("toast");
    setToasts((p) => [{ id, ...t }, ...p].slice(0, 4));
    window.setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 3200);
  };

  const orgs = useMemo<Org[]>(
    () => [
      { id: "org_acme", name: "Acme Group Ltd", role: "Finance" },
      { id: "org_khl", name: "Kampala Holdings", role: "Viewer" },
    ],
    []
  );

  const [orgId, setOrgId] = useState(orgs[0].id);
  const org = useMemo(() => orgs.find((o) => o.id === orgId) || orgs[0], [orgs, orgId]);
  const canExport = useMemo(() => ["Owner", "Admin", "Finance"].includes(org.role), [org.role]);

  const entities = useMemo<Entity[]>(
    () => [
      { id: "ent_ug", name: "Acme Uganda", country: "Uganda", currency: "UGX" },
      { id: "ent_cn", name: "Acme China", country: "China", currency: "CNY" },
    ],
    []
  );

  const groups = useMemo<InvoiceGroup[]>(
    () => [
      { id: "inv_g1", name: "UG Operations", entityId: "ent_ug", billingEmail: "billing-ug@acme.ug" },
      { id: "inv_g2", name: "CN Procurement", entityId: "ent_cn", billingEmail: "billing-cn@acme.ug" },
    ],
    []
  );

  const invoices = useMemo<Invoice[]>(
    () => [
      {
        id: "INV-7001",
        entityId: "ent_ug",
        invoiceGroupId: "inv_g1",
        period: "Jan 1 to Jan 31",
        issuedAt: "Feb 1",
        dueAt: "Feb 10",
        status: "Open",
        currency: "UGX",
        total: 1280000,
        balance: 1280000,
        lineItems: [
          { label: "CorporatePay fees", amount: 220000 },
          { label: "Payout fees", amount: 68000 },
          { label: "FX spread", amount: 12000 },
          { label: "Net settlement", amount: 980000 },
        ],
        references: { internal: "EVZ-INV-7001", provider: "PRV-INV-9001" },
      },
      {
        id: "INV-7002",
        entityId: "ent_ug",
        invoiceGroupId: "inv_g1",
        period: "Dec 1 to Dec 31",
        issuedAt: "Jan 1",
        dueAt: "Jan 10",
        status: "Paid",
        currency: "UGX",
        total: 980000,
        balance: 0,
        lineItems: [
          { label: "CorporatePay fees", amount: 180000 },
          { label: "Net settlement", amount: 800000 },
        ],
        references: { internal: "EVZ-INV-7002", provider: "PRV-INV-8891" },
      },
      {
        id: "INV-7003",
        entityId: "ent_cn",
        invoiceGroupId: "inv_g2",
        period: "Jan 1 to Jan 31",
        issuedAt: "Feb 1",
        dueAt: "Feb 10",
        status: "Refund pending",
        currency: "CNY",
        total: 820,
        balance: 820,
        lineItems: [{ label: "China settlement fees", amount: 9.84 }],
        references: { internal: "EVZ-INV-7003" },
      },
    ],
    []
  );

  const [scopeEntity, setScopeEntity] = useState<string>("ent_ug");
  const [scopeGroup, setScopeGroup] = useState<string>("inv_g1");
  const [range, setRange] = useState<string>("Last 30 days");
  const [format, setFormat] = useState<StatementFormat>("PDF");

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"ALL" | InvoiceStatus>("ALL");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return invoices
      .filter((i) => i.entityId === scopeEntity)
      .filter((i) => i.invoiceGroupId === scopeGroup)
      .filter((i) => (status === "ALL" ? true : i.status === status))
      .filter((i) => (!s ? true : `${i.id} ${i.period} ${i.references.internal} ${i.references.provider ?? ""}`.toLowerCase().includes(s)))
      .sort((a, b) => (a.issuedAt < b.issuedAt ? 1 : -1));
  }, [invoices, scopeEntity, scopeGroup, status, q]);

  const [jobs, setJobs] = useState<ExportJob[]>([
    { id: "JOB-100", createdAt: "Today 09:00", format: "PDF", scope: "UG Operations • Last 30 days", status: "Ready", note: "Statement" },
    { id: "JOB-101", createdAt: "Yesterday", format: "Forensics ZIP", scope: "UG Operations • Jan", status: "Running", note: "Forensics bundle" },
    { id: "JOB-102", createdAt: "Last week", format: "CSV", scope: "CN Procurement • Jan", status: "Failed", note: "Provider timeout" },
  ]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [active, setActive] = useState<Invoice | null>(null);

  const openInvoice = (i: Invoice) => {
    setActive(i);
    setDrawerOpen(true);
  };

  const requestExport = () => {
    if (!canExport) {
      toast({ kind: "warn", title: "Permission required", message: "Finance role required for exports." });
      return;
    }
    const id = `JOB-${Math.floor(200 + Math.random() * 900)}`;
    const scope = `${groups.find((g) => g.id === scopeGroup)?.name ?? scopeGroup} • ${range}`;
    setJobs((p) => [{ id, createdAt: "Just now", format, scope, status: "Queued", note: "Export job" }, ...p]);
    toast({ kind: "success", title: "Export queued", message: `${format} • ${scope}` });

    // simulate job lifecycle
    window.setTimeout(() => setJobs((p) => p.map((j) => (j.id === id ? { ...j, status: "Running" } : j))), 900);
    window.setTimeout(() => setJobs((p) => p.map((j) => (j.id === id ? { ...j, status: "Ready" } : j))), 2100);
  };

  const downloadJob = (id: string) => {
    toast({ kind: "info", title: "Download", message: `Would download ${id}` });
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ kind: "success", title: "Copied" });
    } catch {
      toast({ kind: "warn", title: "Copy failed", message: "Clipboard blocked." });
    }
  };

  const openAdmin = () => toast({ kind: "info", title: "Admin Console", message: "Deep link to invoices module" });

  return (
    <div className="min-h-screen" style={{ background: "radial-gradient(90% 60% at 50% 0%, rgba(3,205,140,0.18), rgba(255,255,255,0))" }}>
      <ToastStack toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((x) => x.id !== id))} />
      <div className="mx-auto max-w-[95%] px-4 py-5 md:px-6">
        <div className="rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(2,8,23,0.10)]">
          <div className="border-b border-slate-200 px-4 py-4 md:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl text-white" style={{ background: EVZ.green }}>
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">Invoices & Statements</div>
                  <div className="mt-1 text-xs text-slate-500">Statements by entity and invoice group with forensics-ready exports</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Pill label={`Org: ${org.name}`} tone="info" />
                    <Pill label={`Role: ${org.role}`} tone={canExport ? "info" : "neutral"} />
                    <Pill label={`Entity: ${entities.find((e) => e.id === scopeEntity)?.name ?? scopeEntity}`} tone="neutral" />
                    <Pill label={`Group: ${groups.find((g) => g.id === scopeGroup)?.name ?? scopeGroup}`} tone="neutral" />
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="min-w-[260px]">
                  <Select value={orgId} onChange={setOrgId} options={orgs.map((o) => ({ value: o.id, label: o.name }))} />
                </div>
                <Button variant="outline" onClick={openAdmin}>
                  <ChevronRight className="h-4 w-4" /> Admin Console
                </Button>
                <Button variant="primary" onClick={requestExport} disabled={!canExport} title={!canExport ? "Finance required" : "Export"}>
                  <Download className="h-4 w-4" /> Export
                </Button>
              </div>
            </div>

            {/* scope controls */}
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-12">
              <div className="md:col-span-3">
                <Select
                  value={scopeEntity}
                  onChange={setScopeEntity}
                  options={entities.map((e) => ({ value: e.id, label: `${e.name} (${e.currency})` }))}
                />
              </div>
              <div className="md:col-span-3">
                <Select
                  value={scopeGroup}
                  onChange={setScopeGroup}
                  options={groups
                    .filter((g) => g.entityId === scopeEntity)
                    .map((g) => ({ value: g.id, label: `${g.name} • ${g.billingEmail}` }))}
                />
              </div>
              <div className="md:col-span-3">
                <Select
                  value={range}
                  onChange={setRange}
                  options={[
                    { value: "Last 7 days", label: "Last 7 days" },
                    { value: "Last 30 days", label: "Last 30 days" },
                    { value: "Jan", label: "January" },
                    { value: "Feb", label: "February" },
                    { value: "YTD", label: "Year to date" },
                  ]}
                />
              </div>
              <div className="md:col-span-3">
                <Select
                  value={format}
                  onChange={(v) => setFormat(v as StatementFormat)}
                  options={[
                    { value: "PDF", label: "Statement PDF" },
                    { value: "CSV", label: "CSV" },
                    { value: "JSON", label: "JSON" },
                    { value: "Forensics ZIP", label: "Forensics ZIP" },
                  ]}
                />
              </div>

              <div className="md:col-span-4">
                <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5">
                  <Search className="h-4 w-4 text-slate-500" />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search invoice id or reference"
                    className="w-full bg-transparent text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none"
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-emerald-100"
                >
                  {["ALL", "Open", "Paid", "Overdue", "Refund pending"].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-6 flex flex-wrap items-center gap-2">
                <Button variant={canExport ? "primary" : "outline"} disabled={!canExport} title={!canExport ? "Finance required" : "Export"} onClick={requestExport}>
                  <Download className="h-4 w-4" /> Export job
                </Button>
                <Button variant="outline" onClick={() => toast({ kind: "info", title: "Forensics", message: "Forensics ZIP includes raw provider reports, receipts, and hashes." })}>
                  <ChevronRight className="h-4 w-4" /> Forensics details
                </Button>
              </div>
            </div>
          </div>

          {/* body */}
          <div className="bg-slate-50 px-4 py-5 md:px-6">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              <div className="space-y-4 lg:col-span-8">
                <Section
                  title="Invoices"
                  subtitle="By entity and invoice group"
                  right={<Pill label={`${filtered.length} invoice(s)`} tone={filtered.length ? "neutral" : "warn"} />}
                >
                  <div className="space-y-2">
                    {filtered.map((i) => (
                      <button key={i.id} type="button" onClick={() => openInvoice(i)} className="w-full rounded-3xl border border-slate-200 bg-white p-4 text-left hover:bg-slate-50">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="text-sm font-semibold text-slate-900">{i.id}</div>
                              <Pill label={i.status} tone={toneForInvoiceStatus(i.status)} />
                              <Pill label={i.currency} tone="neutral" />
                              <Pill label={i.period} tone="neutral" />
                            </div>
                            <div className="mt-1 text-sm text-slate-600">Issued {i.issuedAt} • Due {i.dueAt}</div>
                            <div className="mt-2 text-xs text-slate-500">Internal ref {i.references.internal}{i.references.provider ? ` • Provider ${i.references.provider}` : ""}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-slate-900">Total {formatMoney(i.total, i.currency)}</div>
                            <div className="mt-1 text-xs text-slate-500">Balance {formatMoney(i.balance, i.currency)}</div>
                          </div>
                        </div>
                      </button>
                    ))}

                    {!filtered.length ? <div className="rounded-3xl border border-slate-200 bg-white p-4 text-sm text-slate-600">No invoices match.</div> : null}
                  </div>
                </Section>

                <Section
                  title="Export jobs"
                  subtitle="Queued, running, ready, failed"
                  right={<Pill label={`${jobs.length} job(s)`} tone="neutral" />}
                >
                  <div className="space-y-2">
                    {jobs.map((j) => (
                      <div key={j.id} className={cn("rounded-3xl border p-4", j.status === "Ready" ? "border-emerald-200 bg-emerald-50" : j.status === "Failed" ? "border-rose-200 bg-rose-50" : "border-slate-200 bg-white")}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="text-sm font-semibold text-slate-900">{j.id}</div>
                              <Pill label={j.status} tone={j.status === "Ready" ? "good" : j.status === "Failed" ? "bad" : "neutral"} />
                              <Pill label={j.format} tone="neutral" />
                            </div>
                            <div className="mt-1 text-sm text-slate-700">{j.scope}</div>
                            <div className="mt-1 text-xs text-slate-500">{j.createdAt} • {j.note}</div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
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
                      <div className="text-sm font-semibold text-slate-900">Forensics-ready exports</div>
                      <div className="mt-1 text-sm text-slate-600">Use Forensics ZIP when you need receipts, hashes, provider reports, and matching logs.</div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Pill label="PDF" tone="neutral" />
                        <Pill label="CSV" tone="neutral" />
                        <Pill label="JSON" tone="neutral" />
                        <Pill label="Forensics ZIP" tone="info" />
                      </div>
                      <div className="mt-3"><Button variant="outline" onClick={openAdmin}><ChevronRight className="h-4 w-4" /> Admin Console</Button></div>
                    </div>
                  </div>
                </div>

                <Section title="Compliance" subtitle="Best practices" right={<Pill label="Premium" tone="info" />}>
                  <div className="rounded-3xl border border-slate-200 bg-white p-4">
                    <div className="text-sm font-semibold text-slate-900">Keep statements consistent</div>
                    <ul className="mt-3 space-y-2 text-sm text-slate-700">
                      <li className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-400" />Use invoice groups for billing separation</li>
                      <li className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-400" />Use forensics exports for investigations</li>
                      <li className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-400" />Store export jobs with audit</li>
                    </ul>
                    <div className="mt-3"><Button variant="outline" onClick={() => toast({ kind: "info", title: "Audit", message: "Open audit log" })}><ChevronRight className="h-4 w-4" /> Audit</Button></div>
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
                    <div className="mt-1 text-sm text-slate-600">Use statement exports together with reconciliation to keep ERP books clean.</div>
                  </div>
                </div>
                <Button variant="primary" disabled={!canExport} onClick={requestExport}>
                  <Download className="h-4 w-4" /> Export
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Drawer
        open={drawerOpen}
        title={active ? `Invoice ${active.id}` : "Invoice"}
        subtitle={active ? `${active.period} • ${active.status}` : ""}
        onClose={() => setDrawerOpen(false)}
        footer={
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm text-slate-600"><Info className="h-4 w-4" /> Exports are audit-ready.</div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setDrawerOpen(false)}>Close</Button>
              <Button variant="primary" disabled={!canExport} title={!canExport ? "Finance required" : "Download"} onClick={() => active && toast({ kind: "info", title: "Download", message: active.id })}>
                <Download className="h-4 w-4" /> Download
              </Button>
            </div>
          </div>
        }
      >
        {active ? (
          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Pill label={active.status} tone={toneForInvoiceStatus(active.status)} />
                <Pill label={active.currency} tone="neutral" />
                <Pill label={active.period} tone="neutral" />
              </div>
              <div className="mt-3 text-sm font-semibold text-slate-900">Total {formatMoney(active.total, active.currency)}</div>
              <div className="mt-1 text-sm text-slate-600">Balance {formatMoney(active.balance, active.currency)}</div>
              <div className="mt-2 text-xs text-slate-500">Issued {active.issuedAt} • Due {active.dueAt}</div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="text-sm font-semibold text-slate-900">Line items</div>
              <div className="mt-3 space-y-2">
                {active.lineItems.map((li, idx) => (
                  <div key={idx} className="rounded-2xl border border-slate-200 bg-white p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="text-sm font-semibold text-slate-900">{li.label}</div>
                      <div className="text-sm font-semibold text-slate-900">{formatMoney(li.amount, active.currency)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="text-sm font-semibold text-slate-900">References</div>
              <div className="mt-3 space-y-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-3">
                  <div className="text-xs font-semibold text-slate-500">Internal</div>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <div className="text-sm font-semibold text-slate-900">{active.references.internal}</div>
                    <Button variant="outline" className="px-3 py-2" onClick={() => copy(active.references.internal)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-3">
                  <div className="text-xs font-semibold text-slate-500">Provider</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">{active.references.provider ?? "Not available"}</div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={() => toast({ kind: "info", title: "Forensics", message: "Generate Forensics ZIP" })}>
                  <ChevronRight className="h-4 w-4" /> Forensics
                </Button>
                <Button variant="outline" onClick={() => toast({ kind: "info", title: "Reconciliation", message: "Open reconciliation" })}>
                  <ChevronRight className="h-4 w-4" /> Reconcile
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
