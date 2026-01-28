import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BadgeCheck,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  RotateCcw,
  Search,
  ShieldCheck,
  Timer,
  Trash2,
  X,
} from "lucide-react";
import { ApprovalsStorage, ApprovalItem, ApprovalStatus } from "../../utils/approvalsStorage";

const EVZ = { green: "#03CD8C", orange: "#F77F00" };

type PeriodFilter = "today" | "week" | "month" | "year" | "custom" | "all";

type Filters = {
  q: string;
  status: "ALL" | ApprovalStatus;
  orgId: "ALL" | string;
  period: PeriodFilter;
  customStart: string;
  customEnd: string;
};

type Toast = { id: string; title: string; message?: string; kind: "success" | "warn" | "error" | "info" };

function cn(...p: Array<string | false | null | undefined>) {
  return p.filter(Boolean).join(" ");
}
function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}
function formatMoney(amount: number, currency: string) {
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
              <button className="rounded-2xl p-2 text-slate-500 hover:bg-slate-100" onClick={() => onDismiss(t.id)}><X className="h-4 w-4" /></button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
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
        <option key={o.value} value={o.value}>{o.label}</option>
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
  const navigate = useNavigate();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = (t: Omit<Toast, "id">) => {
    const id = uid("toast");
    setToasts((p) => [{ id, ...t }, ...p].slice(0, 4));
    window.setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 3200);
  };

  const [items, setItems] = useState<ApprovalItem[]>([]);
  const [showCompleted, setShowCompleted] = useState(false);
  const loadItems = () => setItems(ApprovalsStorage.getAll());
  
  useEffect(() => {
    loadItems();
  }, []);

  const orgOptions = useMemo(() => {
    const uniq = Array.from(new Map(items.map((i) => [i.orgId, i.orgName])).entries()).map(([value, label]) => ({ value, label }));
    return [{ value: "ALL", label: "All organizations" }, ...uniq];
  }, [items]);

  const [filters, setFilters] = useState<Filters>({ 
    q: "", 
    status: "ALL", 
    orgId: "ALL", 
    period: "all",
    customStart: "",
    customEnd: "",
  });

  const filtered = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    return items
      .filter((i) => {
        // Hide completed items unless showCompleted is true
        if (!showCompleted && (i.status === "Approved" || i.status === "Rejected")) {
          return false;
        }
        return true;
      })
      .filter((i) => (filters.status === "ALL" ? true : i.status === filters.status))
      .filter((i) => (filters.orgId === "ALL" ? true : i.orgId === filters.orgId))
      .filter((i) => {
        if (!q) return true;
        const blob = `${i.id} ${i.orgName} ${i.module} ${i.requestType} ${i.requester} ${i.policyWhy}`.toLowerCase();
        return blob.includes(q);
      });
  }, [items, filters, showCompleted]);

  const stats = useMemo(() => {
    const pending = items.filter((i) => i.status === "Pending").length;
    const escalated = items.filter((i) => i.status === "Escalated").length;
    const completed = items.filter((i) => i.status === "Approved" || i.status === "Rejected").length;
    return { pending, escalated, completed };
  }, [items]);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const allSelected = filtered.length > 0 && selectedIds.length === filtered.length;

  useEffect(() => {
    setSelectedIds((prev) => prev.filter((id) => filtered.some((x) => x.id === id)));
  }, [filtered]);

  const toggleSelect = (id: string) => {
    setSelectedIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  };

  const toggleAll = () => {
    setSelectedIds(allSelected ? [] : filtered.map((x) => x.id));
  };

  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<"Approve" | "Reject" | null>(null);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewItem, setReviewItem] = useState<ApprovalItem | null>(null);

  const openReview = (item: ApprovalItem, action: "Approve" | "Reject") => {
    setReviewItem(item);
    setReviewAction(action);
    setReviewComment("");
    setReviewOpen(true);
  };

  const confirmReview = () => {
    if (!reviewItem || !reviewAction) return;
    const newStatus: ApprovalStatus = reviewAction === "Approve" ? "Approved" : "Rejected";
    ApprovalsStorage.updateStatus(reviewItem.id, newStatus, reviewComment || undefined);
    loadItems();
    toast({ kind: "success", title: `${reviewAction}d`, message: `${reviewItem.id} updated successfully.` });
    setReviewOpen(false);
  };

  const doBatch = (action: "Approve" | "Reject") => {
    if (!selectedIds.length) {
      toast({ kind: "warn", title: "No items selected" });
      return;
    }
    const newStatus: ApprovalStatus = action === "Approve" ? "Approved" : "Rejected";
    selectedIds.forEach(id => ApprovalsStorage.updateStatus(id, newStatus));
    loadItems();
    toast({ kind: "success", title: `Batch ${action}`, message: `${selectedIds.length} item(s) processed.` });
    setSelectedIds([]);
  };

  const revertAction = (item: ApprovalItem) => {
    // Revert: Approved -> Pending, Rejected -> Pending
    ApprovalsStorage.updateStatus(item.id, "Pending", "Action reverted");
    loadItems();
    toast({ kind: "info", title: "Reverted", message: `${item.id} set back to Pending.` });
  };

  const clearCompleted = () => {
    const completedIds = items.filter(i => i.status === "Approved" || i.status === "Rejected").map(i => i.id);
    if (!completedIds.length) {
      toast({ kind: "warn", title: "Nothing to clear" });
      return;
    }
    // For demo, we just remove from storage
    const remaining = items.filter(i => i.status !== "Approved" && i.status !== "Rejected");
    localStorage.setItem("corporate_pay_approvals", JSON.stringify(remaining));
    loadItems();
    toast({ kind: "success", title: "Cleared", message: `${completedIds.length} completed item(s) removed.` });
  };

  return (
    <div className="min-h-screen" style={{ background: "radial-gradient(90% 60% at 50% 0%, rgba(3,205,140,0.18), rgba(255,255,255,0))" }}>
      <ToastStack toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((x) => x.id !== id))} />

      <div className="mx-auto max-w-[95%] px-4 py-5 md:px-6">
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
                  <div className="mt-1 text-xs text-slate-500">Approve and reject queue with SLA monitoring</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Pill label={`Pending: ${stats.pending}`} tone={stats.pending ? "warn" : "neutral"} />
                    <Pill label={`Escalated: ${stats.escalated}`} tone={stats.escalated ? "warn" : "neutral"} />
                    <Pill label={`Completed: ${stats.completed}`} tone="neutral" />
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="primary" onClick={loadItems}>
                  <ChevronDown className="h-4 w-4" /> Refresh
                </Button>
              </div>
            </div>

            {/* Filters */}
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-12">
              <div className="md:col-span-3">
                <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5">
                  <Search className="h-4 w-4 text-slate-500" />
                  <input
                    value={filters.q}
                    onChange={(e) => setFilters((p) => ({ ...p, q: e.target.value }))}
                    placeholder="Search..."
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
              <div className="md:col-span-2">
                <Select
                  value={filters.period}
                  onChange={(v) => setFilters((p) => ({ ...p, period: v as PeriodFilter }))}
                  options={[
                    { value: "all", label: "All time" },
                    { value: "today", label: "Today" },
                    { value: "week", label: "This week" },
                    { value: "month", label: "This month" },
                    { value: "year", label: "This year" },
                    { value: "custom", label: "Custom range" },
                  ]}
                />
              </div>
              {filters.period === "custom" && (
                <>
                  <div className="md:col-span-2">
                    <input
                      type="date"
                      value={filters.customStart}
                      onChange={(e) => setFilters((p) => ({ ...p, customStart: e.target.value }))}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <input
                      type="date"
                      value={filters.customEnd}
                      onChange={(e) => setFilters((p) => ({ ...p, customEnd: e.target.value }))}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                    />
                  </div>
                </>
              )}
              <div className={cn("flex flex-wrap items-center gap-2", filters.period === "custom" ? "md:col-span-1" : "md:col-span-5")}>
                <Button variant="outline" onClick={toggleAll}>
                  <Check className="h-4 w-4" /> {allSelected ? "Clear" : "Select"}
                </Button>
                <Button variant="primary" onClick={() => doBatch("Approve")} disabled={!selectedIds.length}>
                  <CheckCircle2 className="h-4 w-4" />
                </Button>
                <Button variant="accent" onClick={() => doBatch("Reject")} disabled={!selectedIds.length}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Toggle & Clear */}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                onClick={() => setShowCompleted(!showCompleted)}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition",
                  showCompleted ? "bg-slate-100 text-slate-900" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                )}
              >
                {showCompleted ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showCompleted ? "Hide completed" : "Show completed"}
              </button>
              <Button variant="danger" onClick={clearCompleted} disabled={stats.completed === 0}>
                <Trash2 className="h-4 w-4" /> Clear completed
              </Button>
            </div>
          </div>

          {/* List */}
          <div className="bg-slate-50 px-4 py-5 md:px-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">Queue</div>
                  <div className="mt-1 text-xs text-slate-500">Tap an item to review</div>
                </div>
                <Pill label={`${filtered.length} item(s)`} tone={filtered.length ? "neutral" : "warn"} />
              </div>

              <div className="mt-4 space-y-3">
                {filtered.map((i) => {
                  const isCompleted = i.status === "Approved" || i.status === "Rejected";
                  return (
                    <div key={i.id} className={cn("rounded-3xl border p-6 transition-colors", isCompleted ? "border-slate-100 bg-slate-50" : "border-slate-200 bg-white hover:bg-slate-50")}>
                      <div className="flex items-start gap-4">
                        <button
                          type="button"
                          onClick={() => toggleSelect(i.id)}
                          className={cn(
                            "mt-1 grid h-6 w-6 place-items-center rounded-lg border flex-shrink-0",
                            selectedIds.includes(i.id) ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-400"
                          )}
                        >
                          {selectedIds.includes(i.id) ? <Check className="h-4 w-4" /> : null}
                        </button>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <div className="text-base font-semibold text-slate-900">{i.requestType}: {i.module}</div>
                            <Pill label={i.status} tone={toneForApprovalStatus(i.status)} />
                            <Pill label={i.orgName} tone="info" />
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Amount</div>
                              <div className="text-lg font-bold text-slate-900">{formatMoney(i.amount, i.currency)}</div>
                            </div>
                            <div>
                              <div className="text-xs text-slate-500 uppercase font-semibold mb-1">SLA Status</div>
                              {i.sla.breached ? (
                                <div className="flex items-center gap-2 text-rose-600 font-semibold">
                                  <AlertTriangle className="h-4 w-4" /> Breached
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 text-slate-700">
                                  <Timer className="h-4 w-4" /> Due in {i.sla.dueIn}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="mb-4">
                            <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Policy Reason</div>
                            <div className="text-sm text-slate-700 bg-slate-50 rounded-xl p-3 border border-slate-100">{i.policyWhy}</div>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <span>Requester: {i.requester}</span>
                            <span className="h-1 w-1 rounded-full bg-slate-300" />
                            <span>{i.createdAt}</span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          {isCompleted ? (
                            <Button variant="outline" onClick={() => revertAction(i)} className="w-full">
                              <RotateCcw className="h-4 w-4" /> Revert
                            </Button>
                          ) : (
                            <>
                              <Button
                                variant="primary"
                                onClick={() => openReview(i, "Approve")}
                                className="w-full"
                              >
                                <CheckCircle2 className="h-4 w-4" /> Approve
                              </Button>
                              <Button
                                variant="accent"
                                onClick={() => openReview(i, "Reject")}
                                className="w-full"
                              >
                                <X className="h-4 w-4" /> Reject
                              </Button>
                            </>
                          )}
                          <Button variant="outline" onClick={() => navigate(`/console/approvals/${i.id}`)} className="w-full">
                            <ChevronRight className="h-4 w-4" /> Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {!filtered.length && (
                  <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600 text-center">
                    {showCompleted ? "No approvals match your filters." : "No pending approvals. Click 'Show completed' to view processed items."}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      <AnimatePresence>
        {reviewOpen && (
          <>
            <motion.div className="fixed inset-0 z-40 bg-black/35" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setReviewOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-x-0 top-[10vh] z-50 mx-auto w-[min(600px,calc(100vw-2rem))] overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(2,8,23,0.22)]"
            >
              <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
                <div>
                  <div className="text-lg font-semibold text-slate-900">Confirm {reviewAction}</div>
                  {reviewItem && <div className="mt-1 text-sm text-slate-600">{reviewItem.id} - {reviewItem.requestType}</div>}
                </div>
                <button className="rounded-2xl p-2 text-slate-600 hover:bg-slate-100" onClick={() => setReviewOpen(false)}>
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-500">
                    {reviewAction === "Reject" ? "Rejection Reason" : "Comment (Optional)"}
                  </label>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    rows={3}
                    placeholder="Add notes for audit trail..."
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 transition focus:outline-none focus:ring-4 focus:ring-emerald-100"
                  />
                </div>
              </div>
              <div className="border-t border-slate-200 px-5 py-4 flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setReviewOpen(false)}>Cancel</Button>
                <Button variant={reviewAction === "Approve" ? "primary" : "accent"} onClick={confirmReview}>
                  {reviewAction === "Approve" ? <CheckCircle2 className="h-4 w-4" /> : <X className="h-4 w-4" />}
                  Confirm {reviewAction}
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
