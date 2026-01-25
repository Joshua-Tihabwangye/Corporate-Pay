import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BadgeCheck,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Copy,
  FileText,
  Filter,
  Flag,
  Info,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Timer,
  X,
} from "lucide-react";

const EVZ = { green: "#03CD8C", orange: "#F77F00" };

type Currency = "UGX" | "USD" | "CNY" | "KES";

type ApprovalStatus = "Pending" | "Approved" | "Rejected" | "Escalated";

type SLA = { dueIn: string; breached: boolean; target: string };

type ApprovalItem = {
  id: string;
  orgId: string;
  orgName: string;
  module: string;
  requestType: "Purchase" | "Payout" | "Refund" | "Policy change";
  requester: string;
  amount: number;
  currency: Currency;
  status: ApprovalStatus;
  createdAt: string;
  policyWhy: string;
  attachments: number;
  comments: number;
  sla: SLA;
  escalationPath: string;
  auditTrail: Array<{ when: string; who: string; action: string }>;
};

type Filters = {
  q: string;
  status: "ALL" | ApprovalStatus;
  orgId: "ALL" | string;
  module: "ALL" | string;
  due: "ALL" | "Due soon" | "Breached";
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
  const sign = amount < 0 ? "-" : "";
  return `${sign}${currency} ${num}`;
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
            role="status"
            aria-live="polite"
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "mt-0.5 grid h-9 w-9 place-items-center rounded-2xl",
                  t.kind === "success" && "bg-emerald-50 text-emerald-700",
                  t.kind === "warn" && "bg-amber-50 text-amber-800",
                  t.kind === "error" && "bg-rose-50 text-rose-700",
                  t.kind === "info" && "bg-blue-50 text-blue-700"
                )}
              >
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

function toneForApprovalStatus(s: ApprovalStatus) {
  if (s === "Approved") return "good" as const;
  if (s === "Rejected") return "bad" as const;
  if (s === "Escalated") return "warn" as const;
  return "info" as const;
}

export default function ApprovalsInbox() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = (t: Omit<Toast, "id">) => {
    const id = uid("toast");
    setToasts((p) => [{ id, ...t }, ...p].slice(0, 4));
    window.setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 3200);
  };

  const items = useMemo<ApprovalItem[]>(
    () => [
      {
        id: "AP-1001",
        orgId: "org_acme",
        orgName: "Acme Group Ltd",
        module: "CorporatePay",
        requestType: "Purchase",
        requester: "Procurement",
        amount: 540000,
        currency: "UGX",
        status: "Pending",
        createdAt: "Today 08:00",
        policyWhy: "Above UGX 500,000 approval threshold. Cost center required.",
        attachments: 2,
        comments: 3,
        sla: { dueIn: "1h 10m", breached: false, target: "4h" },
        escalationPath: "Approver → Finance → Admin",
        auditTrail: [
          { when: "Today 08:00", who: "Procurement", action: "Submitted request" },
          { when: "Today 08:10", who: "Approver", action: "Approved stage 1" },
          { when: "Now", who: "Finance", action: "Pending" },
        ],
      },
      {
        id: "AP-1002",
        orgId: "org_acme",
        orgName: "Acme Group Ltd",
        module: "Wallet",
        requestType: "Payout",
        requester: "Finance Desk",
        amount: 1200000,
        currency: "UGX",
        status: "Escalated",
        createdAt: "Today 06:40",
        policyWhy: "High value payout requires dual-control and verified beneficiary.",
        attachments: 1,
        comments: 2,
        sla: { dueIn: "Breached", breached: true, target: "2h" },
        escalationPath: "Finance → Admin → EVzone Support",
        auditTrail: [
          { when: "Today 06:40", who: "Finance Desk", action: "Submitted payout" },
          { when: "Today 07:10", who: "System", action: "Escalated due to SLA" },
        ],
      },
      {
        id: "AP-1003",
        orgId: "org_khl",
        orgName: "Kampala Holdings",
        module: "CorporatePay",
        requestType: "Purchase",
        requester: "Member",
        amount: 180000,
        currency: "UGX",
        status: "Pending",
        createdAt: "Yesterday",
        policyWhy: "Org wallet deposit depleted. Alternative method required or funding request.",
        attachments: 0,
        comments: 1,
        sla: { dueIn: "6h", breached: false, target: "24h" },
        escalationPath: "Approver → Admin",
        auditTrail: [{ when: "Yesterday", who: "Member", action: "Submitted" }],
      },
      {
        id: "AP-1004",
        orgId: "org_acme",
        orgName: "Acme Group Ltd",
        module: "E-Commerce",
        requestType: "Refund",
        requester: "Support Agent",
        amount: 220000,
        currency: "UGX",
        status: "Pending",
        createdAt: "2 days ago",
        policyWhy: "Refund above UGX 150,000 requires evidence attachment and attestation.",
        attachments: 1,
        comments: 0,
        sla: { dueIn: "10h", breached: false, target: "24h" },
        escalationPath: "Support → Finance",
        auditTrail: [{ when: "2 days ago", who: "Support Agent", action: "Requested refund approval" }],
      },
    ],
    []
  );

  const orgOptions = useMemo(() => {
    const uniq = Array.from(new Map(items.map((i) => [i.orgId, i.orgName])).entries()).map(([value, label]) => ({ value, label }));
    return [{ value: "ALL", label: "All organizations" }, ...uniq];
  }, [items]);

  const moduleOptions = useMemo(() => {
    const uniq = Array.from(new Set(items.map((i) => i.module))).map((m) => ({ value: m, label: m }));
    return [{ value: "ALL", label: "All modules" }, ...uniq];
  }, [items]);

  const [filters, setFilters] = useState<Filters>({ q: "", status: "ALL", orgId: "ALL", module: "ALL", due: "ALL" });

  const filtered = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    return items
      .filter((i) => (filters.status === "ALL" ? true : i.status === filters.status))
      .filter((i) => (filters.orgId === "ALL" ? true : i.orgId === filters.orgId))
      .filter((i) => (filters.module === "ALL" ? true : i.module === filters.module))
      .filter((i) => {
        if (filters.due === "ALL") return true;
        if (filters.due === "Breached") return i.sla.breached;
        return !i.sla.breached && (i.sla.dueIn.includes("m") || i.sla.dueIn.includes("1h"));
      })
      .filter((i) => {
        if (!q) return true;
        const blob = `${i.id} ${i.orgName} ${i.module} ${i.requestType} ${i.requester} ${i.policyWhy}`.toLowerCase();
        return blob.includes(q);
      });
  }, [items, filters]);

  const stats = useMemo(() => {
    const pending = items.filter((i) => i.status === "Pending").length;
    const escalated = items.filter((i) => i.status === "Escalated").length;
    const breached = items.filter((i) => i.sla.breached).length;
    return { pending, escalated, breached };
  }, [items]);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const allSelected = filtered.length > 0 && selectedIds.length === filtered.length;

  useEffect(() => {
    // Keep selection limited to visible items
    setSelectedIds((prev) => prev.filter((id) => filtered.some((x) => x.id === id)));
  }, [filtered]);

  const toggleSelect = (id: string) => {
    setSelectedIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  };

  const toggleAll = () => {
    setSelectedIds(allSelected ? [] : filtered.map((x) => x.id));
  };

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [active, setActive] = useState<ApprovalItem | null>(null);

  const openItem = (i: ApprovalItem) => {
    setActive(i);
    setDrawerOpen(true);
  };

  const [comment, setComment] = useState("");

  // Review Modal state
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<"Approve" | "Reject" | null>(null);
  const [reviewComment, setReviewComment] = useState("");

  const doBatch = (action: "Approve" | "Reject") => {
    if (!selectedIds.length) {
      toast({ kind: "warn", title: "No items selected" });
      return;
    }
    toast({
      kind: "success",
      title: `Batch ${action}`,
      message: `${selectedIds.length} item(s) processed. Audit trail updated.`,
    });
    setSelectedIds([]);
  };

  const doSingle = (action: "Approve" | "Reject") => {
    if (!active) return;
    // Open review modal instead of immediate action
    setReviewAction(action);
    setReviewComment("");
    setReviewOpen(true);
  };

  const confirmReview = () => {
    if (!active || !reviewAction) return;
    toast({ kind: "success", title: `${reviewAction}d`, message: `${active.id} updated.${reviewComment ? " Comment added." : ""}` });
    setReviewOpen(false);
    setDrawerOpen(false);
  };

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

      <div className="mx-auto max-w-[1180px] px-4 py-5 md:px-6">
        <div className="rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(2,8,23,0.10)]">
          {/* Header */}
          <div className="border-b border-slate-200 px-4 py-4 md:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl text-white" style={{ background: EVZ.green }}>
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">Approvals Inbox</div>
                  <div className="mt-1 text-xs text-slate-500">Approve and reject queue, batch actions, policy explanations, and SLA monitoring</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Pill label={`Pending: ${stats.pending}`} tone={stats.pending ? "warn" : "neutral"} />
                    <Pill label={`Escalated: ${stats.escalated}`} tone={stats.escalated ? "warn" : "neutral"} />
                    <Pill label={`SLA breached: ${stats.breached}`} tone={stats.breached ? "bad" : "neutral"} />
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={() => toast({ kind: "info", title: "Policy builder", message: "Deep link to Policy Builder." })}>
                  <ChevronRight className="h-4 w-4" /> Policy
                </Button>
                <Button variant="outline" onClick={() => toast({ kind: "info", title: "Workflow builder", message: "Deep link to Approval Workflow Builder." })}>
                  <ChevronRight className="h-4 w-4" /> Workflows
                </Button>
                <Button variant="primary" onClick={() => toast({ kind: "success", title: "Refreshed" })}>
                  <ChevronDown className="h-4 w-4" /> Refresh
                </Button>
              </div>
            </div>

            {/* Filters */}
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-12">
              <div className="md:col-span-4">
                <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5">
                  <Search className="h-4 w-4 text-slate-500" />
                  <input
                    value={filters.q}
                    onChange={(e) => setFilters((p) => ({ ...p, q: e.target.value }))}
                    placeholder="Search id, org, requester, reason"
                    className="w-full bg-transparent text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none"
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <Select
                  value={filters.status}
                  onChange={(v) => setFilters((p) => ({ ...p, status: v as any }))}
                  options={[
                    { value: "ALL", label: "All statuses" },
                    { value: "Pending", label: "Pending" },
                    { value: "Escalated", label: "Escalated" },
                    { value: "Approved", label: "Approved" },
                    { value: "Rejected", label: "Rejected" },
                  ]}
                />
              </div>
              <div className="md:col-span-3">
                <Select value={filters.orgId} onChange={(v) => setFilters((p) => ({ ...p, orgId: v }))} options={orgOptions} />
              </div>
              <div className="md:col-span-3">
                <Select value={filters.module} onChange={(v) => setFilters((p) => ({ ...p, module: v }))} options={moduleOptions} />
              </div>
              <div className="md:col-span-3">
                <Select
                  value={filters.due}
                  onChange={(v) => setFilters((p) => ({ ...p, due: v as any }))}
                  options={[
                    { value: "ALL", label: "All due" },
                    { value: "Due soon", label: "Due soon" },
                    { value: "Breached", label: "Breached" },
                  ]}
                />
              </div>
              <div className="md:col-span-9">
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" onClick={toggleAll}>
                    <Check className="h-4 w-4" /> {allSelected ? "Clear" : "Select all"}
                  </Button>
                  <Button variant="primary" onClick={() => doBatch("Approve")} disabled={!selectedIds.length} title={!selectedIds.length ? "Select items" : "Batch approve"}>
                    <CheckCircle2 className="h-4 w-4" /> Approve
                  </Button>
                  <Button variant="accent" onClick={() => doBatch("Reject")} disabled={!selectedIds.length} title={!selectedIds.length ? "Select items" : "Batch reject"}>
                    <X className="h-4 w-4" /> Reject
                  </Button>
                  <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5">
                    <MessageCircle className="h-4 w-4 text-slate-500" />
                    <input
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Batch comment (optional)"
                      className="w-[min(360px,60vw)] bg-transparent text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none"
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => toast({ kind: "info", title: "Batch comment", message: "This would attach the comment to all selected items." })}
                    disabled={!selectedIds.length}
                  >
                    <ChevronRight className="h-4 w-4" /> Add comment
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* List */}
          <div className="bg-slate-50 px-4 py-5 md:px-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">Queue</div>
                  <div className="mt-1 text-xs text-slate-500">Tap an item to review policy reason, attachments, and SLA</div>
                </div>
                <Pill label={`${filtered.length} item(s)`} tone={filtered.length ? "neutral" : "warn"} />
              </div>

              <div className="mt-4 space-y-2">
                {filtered.map((i) => (
                  <div key={i.id} className="rounded-3xl border border-slate-200 bg-white p-4 hover:bg-slate-50">
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => toggleSelect(i.id)}
                        className={cn(
                          "mt-1 grid h-6 w-6 place-items-center rounded-lg border",
                          selectedIds.includes(i.id) ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-400"
                        )}
                        aria-label="Select"
                      >
                        {selectedIds.includes(i.id) ? <Check className="h-4 w-4" /> : null}
                      </button>

                      <button type="button" className="min-w-0 flex-1 text-left" onClick={() => openItem(i)}>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="text-sm font-semibold text-slate-900">{i.requestType}: {i.module}</div>
                              <Pill label={i.status} tone={toneForApprovalStatus(i.status)} />
                              <Pill label={i.orgName} tone="info" />
                              {i.sla.breached ? <Pill label="SLA breached" tone="bad" /> : <Pill label={`Due ${i.sla.dueIn}`} tone="neutral" />}
                              <Pill label={`${i.attachments} file(s)`} tone={i.attachments ? "neutral" : "neutral"} />
                              <Pill label={`${i.comments} comment(s)`} tone={i.comments ? "neutral" : "neutral"} />
                            </div>
                            <div className="mt-1 text-sm text-slate-600">Requester: {i.requester} • {i.createdAt}</div>
                            <div className="mt-2 text-xs text-slate-500">{i.policyWhy}</div>
                          </div>
                          <div className="text-right">
                            <div className={cn("text-sm font-semibold", i.amount < 0 ? "text-slate-900" : "text-slate-900")}>
                              {formatMoney(i.amount, i.currency)}
                            </div>
                            <div className="mt-1 text-xs text-slate-500">{i.currency}</div>
                          </div>
                        </div>
                      </button>

                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          variant="primary"
                          onClick={() => {
                            setActive(i);
                            doSingle("Approve");
                          }}
                          disabled={i.status !== "Pending" && i.status !== "Escalated"}
                          title={i.status === "Approved" ? "Already approved" : "Approve"}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="accent"
                          onClick={() => {
                            setActive(i);
                            doSingle("Reject");
                          }}
                          disabled={i.status !== "Pending" && i.status !== "Escalated"}
                          title={i.status === "Rejected" ? "Already rejected" : "Reject"}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" onClick={() => openItem(i)}>
                          <ChevronRight className="h-4 w-4" /> Review
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {!filtered.length ? (
                  <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
                    No approvals match your filters.
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-50 text-slate-700">
                    <Info className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Tip</div>
                    <div className="mt-1 text-sm text-slate-600">Use batch actions for low risk items. Keep notes for audit clarity.</div>
                  </div>
                </div>
                <Button variant="outline" onClick={() => toast({ kind: "info", title: "Export", message: "This would export approvals report." })}>
                  <ChevronRight className="h-4 w-4" /> Export
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Drawer
        open={drawerOpen}
        title={active ? `${active.requestType} approval` : "Approval"}
        subtitle={active ? `${active.id} • ${active.orgName}` : ""}
        onClose={() => setDrawerOpen(false)}
        footer={
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Info className="h-4 w-4" /> Decisions are logged in audit trail.
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setDrawerOpen(false)}>Close</Button>
              <Button
                variant="primary"
                onClick={() => doSingle("Approve")}
                disabled={!active || (active.status !== "Pending" && active.status !== "Escalated")}
              >
                <CheckCircle2 className="h-4 w-4" /> Approve
              </Button>
              <Button
                variant="accent"
                onClick={() => doSingle("Reject")}
                disabled={!active || (active.status !== "Pending" && active.status !== "Escalated")}
              >
                <X className="h-4 w-4" /> Reject
              </Button>
            </div>
          </div>
        }
      >
        {active ? (
          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill label={active.status} tone={toneForApprovalStatus(active.status)} />
                    <Pill label={active.module} tone="neutral" />
                    <Pill label={active.requestType} tone="neutral" />
                    {active.sla.breached ? <Pill label="SLA breached" tone="bad" /> : <Pill label={`Due ${active.sla.dueIn}`} tone="neutral" />}
                  </div>
                  <div className="mt-2 text-sm font-semibold text-slate-900">{formatMoney(active.amount, active.currency)}</div>
                  <div className="mt-1 text-sm text-slate-600">Requester: {active.requester}</div>
                  <div className="mt-2 text-xs text-slate-500">Created: {active.createdAt} • SLA target {active.sla.target}</div>
                </div>
                <div className={cn("grid h-10 w-10 place-items-center rounded-2xl", active.sla.breached ? "bg-rose-50 text-rose-700" : "bg-slate-50 text-slate-700")}>
                  {active.sla.breached ? <AlertTriangle className="h-5 w-5" /> : <Timer className="h-5 w-5" />}
                </div>
              </div>

              <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                <div className="flex items-start gap-2">
                  <Info className="mt-0.5 h-4 w-4" />
                  <div>
                    <div className="font-semibold text-slate-900">Policy explanation</div>
                    <div className="mt-1">{active.policyWhy}</div>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={() => toast({ kind: "info", title: "Open policy", message: "Deep link to Policy Builder with rule focus." })}>
                  <ChevronRight className="h-4 w-4" /> Policy
                </Button>
                <Button variant="outline" onClick={() => toast({ kind: "info", title: "Open workflow", message: "Deep link to Approval Workflow Builder." })}>
                  <ChevronRight className="h-4 w-4" /> Workflow
                </Button>
                <Button variant="outline" onClick={() => toast({ kind: "info", title: "Escalate", message: active.escalationPath })}>
                  <Flag className="h-4 w-4" /> Escalation
                </Button>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="text-sm font-semibold text-slate-900">Attachments and comments</div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Pill label={`${active.attachments} attachment(s)`} tone="neutral" />
                <Pill label={`${active.comments} comment(s)`} tone="neutral" />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={() => toast({ kind: "info", title: "Open attachments", message: "This would open attachments viewer." })}>
                  <FileText className="h-4 w-4" /> Attachments
                </Button>
                <Button variant="outline" onClick={() => toast({ kind: "info", title: "Add comment", message: "This would add a comment to this approval." })}>
                  <MessageCircle className="h-4 w-4" /> Comment
                </Button>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="text-sm font-semibold text-slate-900">Audit trail</div>
              <div className="mt-3 space-y-2">
                {active.auditTrail.map((a, idx) => (
                  <div key={idx} className="rounded-2xl border border-slate-200 bg-white p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{a.action}</div>
                        <div className="mt-1 text-xs text-slate-500">{a.who}</div>
                      </div>
                      <div className="text-xs text-slate-500">{a.when}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={() => copy(active.id)}>
                  <Copy className="h-4 w-4" /> Copy id
                </Button>
                <Button variant="outline" onClick={() => toast({ kind: "info", title: "Export audit", message: "This would export audit record." })}>
                  <ChevronRight className="h-4 w-4" /> Export
                </Button>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="text-sm font-semibold text-slate-900">SLA monitoring</div>
              <div className="mt-2 text-sm text-slate-600">Target: {active.sla.target} • Status: {active.sla.breached ? "Breached" : `Due in ${active.sla.dueIn}`}</div>
              <div className={cn("mt-3 rounded-2xl border p-3 text-xs", active.sla.breached ? "border-rose-200 bg-rose-50 text-rose-800" : "border-slate-200 bg-slate-50 text-slate-700")}>
                <div className="flex items-start gap-2">
                  {active.sla.breached ? <AlertTriangle className="mt-0.5 h-4 w-4" /> : <Timer className="mt-0.5 h-4 w-4" />}
                  <div>
                    <div className="font-semibold">Escalation path</div>
                    <div className="mt-1">{active.escalationPath}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </Drawer>

      {/* Review Modal */}
      <Modal
        open={reviewOpen}
        title={reviewAction === "Approve" ? "Confirm Approval" : "Confirm Rejection"}
        subtitle={active ? `${active.id} - ${active.requestType}` : undefined}
        onClose={() => setReviewOpen(false)}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setReviewOpen(false)}>Cancel</Button>
            <Button variant={reviewAction === "Approve" ? "primary" : "accent"} onClick={confirmReview}>
              {reviewAction === "Approve" ? <CheckCircle2 className="h-4 w-4" /> : <X className="h-4 w-4" />}
              Confirm {reviewAction}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-blue-700" />
              <div className="text-sm text-blue-800">
                {reviewAction === "Approve" 
                  ? "This will approve the request and notify the requester." 
                  : "This will reject the request. Please provide a reason."}
              </div>
            </div>
          </div>
          <TextArea
            label={reviewAction === "Reject" ? "Rejection Reason (Required)" : "Comment (Optional)"}
            value={reviewComment}
            onChange={setReviewComment}
            placeholder={reviewAction === "Reject" ? "Explain why this request is being rejected..." : "Add any notes for audit trail..."}
            rows={4}
          />
        </div>
      </Modal>
    </div>
  );
}

function Modal({
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
          <motion.div
            className="fixed inset-0 z-40 bg-black/35"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-x-0 top-[10vh] z-50 mx-auto w-[min(600px,calc(100vw-2rem))] overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(2,8,23,0.22)]"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
              <div>
                <div className="text-lg font-semibold text-slate-900">{title}</div>
                {subtitle ? <div className="mt-1 text-sm text-slate-600">{subtitle}</div> : null}
              </div>
              <button className="rounded-2xl p-2 text-slate-600 hover:bg-slate-100" onClick={onClose}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5">{children}</div>
            {footer ? <div className="border-t border-slate-200 px-5 py-4">{footer}</div> : null}
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-slate-500">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 transition focus:outline-none focus:ring-4 focus:ring-emerald-100"
      />
    </div>
  );
}
