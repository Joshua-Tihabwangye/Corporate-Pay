import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BadgeCheck,
  Building2,
  Check,
  ChevronRight,
  Copy,
  FileText,
  Info,
  Lock,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  UserCheck,
  Users,
  X,
} from "lucide-react";

const EVZ = { green: "#03CD8C", orange: "#F77F00" };

type OrgRole = "Viewer" | "Member" | "Approver" | "Finance" | "Admin" | "Owner";

type OrgStatus = "Active" | "Deposit depleted" | "Suspended" | "Needs verification";

type Org = { id: string; name: string; role: OrgRole; status: OrgStatus };

type Permission =
  | "View wallet"
  | "Pay"
  | "Request"
  | "Approve"
  | "Withdraw"
  | "Manage beneficiaries"
  | "Batch payouts"
  | "Refunds"
  | "Export reports"
  | "Manage users"
  | "Manage policies";

type RoleDef = {
  role: OrgRole;
  summary: string;
  permissions: Permission[];
};

type DualControlKey =
  | "Beneficiary edits"
  | "Batch payouts"
  | "Refund approvals"
  | "Policy changes"
  | "Role changes"
  | "High value payouts";

type DualControlRule = {
  key: DualControlKey;
  enabled: boolean;
  note: string;
};

type ThresholdRule = {
  id: string;
  label: string;
  currency: "UGX" | "USD" | "CNY" | "KES";
  threshold: number;
  approvers: number;
  appliesTo: Array<"Purchases" | "Payouts" | "Refunds">;
};

type AuditEvent = {
  id: string;
  when: string;
  actor: string;
  action: string;
  target: string;
  outcome: "Success" | "Blocked";
  why: string;
};

type Toast = { id: string; title: string; message?: string; kind: "success" | "warn" | "error" | "info" };

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
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
  variant?: "primary" | "accent" | "outline" | "ghost" | "danger";
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

export default function RolesPermissionsGovernance() {
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
  const canGovern = useMemo(() => ["Owner", "Admin", "Finance"].includes(org.role), [org.role]);

  const roles = useMemo<RoleDef[]>(
    () => [
      {
        role: "Owner",
        summary: "Full control of org wallet and policies",
        permissions: ["View wallet", "Pay", "Request", "Approve", "Withdraw", "Manage beneficiaries", "Batch payouts", "Refunds", "Export reports", "Manage users", "Manage policies"],
      },
      {
        role: "Admin",
        summary: "Manage users and policies",
        permissions: ["View wallet", "Pay", "Request", "Approve", "Withdraw", "Manage beneficiaries", "Export reports", "Manage users", "Manage policies"],
      },
      {
        role: "Finance",
        summary: "Payout operations and reconciliation",
        permissions: ["View wallet", "Pay", "Request", "Approve", "Withdraw", "Manage beneficiaries", "Batch payouts", "Export reports"],
      },
      {
        role: "Approver",
        summary: "Approve purchases and payouts",
        permissions: ["View wallet", "Approve", "Pay", "Request"],
      },
      {
        role: "Member",
        summary: "Create requests and view own items",
        permissions: ["View wallet", "Request", "Pay"],
      },
      {
        role: "Viewer",
        summary: "Read-only access",
        permissions: ["View wallet"],
      },
    ],
    []
  );

  const [selectedRole, setSelectedRole] = useState<OrgRole>("Admin");
  const selectedRoleDef = useMemo(() => roles.find((r) => r.role === selectedRole) || roles[0], [roles, selectedRole]);

  const [dual, setDual] = useState<DualControlRule[]>([
    { key: "Beneficiary edits", enabled: true, note: "Require second approval for beneficiary changes" },
    { key: "Batch payouts", enabled: true, note: "Maker-checker required for CSV batch payouts" },
    { key: "Refund approvals", enabled: false, note: "Optional dual-control for refunds" },
    { key: "Policy changes", enabled: true, note: "Any policy change requires dual-control" },
    { key: "Role changes", enabled: true, note: "Role assignments require approval" },
    { key: "High value payouts", enabled: true, note: "Extra approvals for payouts above threshold" },
  ]);

  const [thresholds, setThresholds] = useState<ThresholdRule[]>([
    { id: "T-1", label: "Purchases", currency: "UGX", threshold: 500000, approvers: 2, appliesTo: ["Purchases"] },
    { id: "T-2", label: "Payouts", currency: "UGX", threshold: 300000, approvers: 2, appliesTo: ["Payouts"] },
    { id: "T-3", label: "Refunds", currency: "UGX", threshold: 150000, approvers: 1, appliesTo: ["Refunds"] },
  ]);

  const [audit] = useState<AuditEvent[]>([
    { id: "A-1", when: "Today 08:10", actor: "Ronald", action: "Role change", target: "procurement@acme.ug → Approver", outcome: "Success", why: "Admin role" },
    { id: "A-2", when: "Today 07:55", actor: "Finance Desk", action: "Policy update", target: "Approval threshold to UGX 500,000", outcome: "Success", why: "Dual-control satisfied" },
    { id: "A-3", when: "Yesterday", actor: "Auditor", action: "Export", target: "Statement PDF (30D)", outcome: "Success", why: "Viewer allowed exports disabled" },
    { id: "A-4", when: "Last week", actor: "Unknown", action: "Beneficiary edit", target: "Attempted add bank account", outcome: "Blocked", why: "Step-up and dual-control required" },
  ]);

  const openAdmin = () => toast({ kind: "info", title: "Open Admin Console", message: "Deep link to full governance editor." });

  const toggleDual = (key: DualControlKey) => {
    setDual((p) => p.map((d) => (d.key === key ? { ...d, enabled: !d.enabled } : d)));
    toast({ kind: "success", title: "Rule updated" });
  };

  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string>("T-1");
  const [editThreshold, setEditThreshold] = useState("500000");
  const [editApprovers, setEditApprovers] = useState("2");

  useEffect(() => {
    const t = thresholds.find((x) => x.id === editId);
    if (!t) return;
    setEditThreshold(String(t.threshold));
    setEditApprovers(String(t.approvers));
  }, [editId, thresholds]);

  const saveThreshold = () => {
    const thr = Number(editThreshold.replace(/[^0-9]/g, "")) || 0;
    const appr = Number(editApprovers.replace(/[^0-9]/g, "")) || 1;
    setThresholds((p) => p.map((t) => (t.id === editId ? { ...t, threshold: thr, approvers: Math.max(1, Math.min(5, appr)) } : t)));
    setEditOpen(false);
    toast({ kind: "success", title: "Threshold updated" });
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
          <div className="border-b border-slate-200 px-4 py-4 md:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl text-white" style={{ background: EVZ.green }}>
                  <UserCheck className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">Roles, Permissions & Governance</div>
                  <div className="mt-1 text-xs text-slate-500">Dual-control, thresholds, and audit trail</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Pill label={`Org: ${org.name}`} tone="info" />
                    <Pill label={`Role: ${org.role}`} tone={canGovern ? "info" : "neutral"} />
                    <Pill label={org.status} tone={toneForOrgStatus(org.status)} />
                    <Pill label={canGovern ? "Can manage policies" : "View only"} tone={canGovern ? "good" : "neutral"} />
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
                <Button variant="primary" disabled={!canGovern} title={!canGovern ? "Admin role required" : "Save"} onClick={() => toast({ kind: "success", title: "Saved", message: "Governance settings saved." })}>
                  <Sparkles className="h-4 w-4" /> Save
                </Button>
              </div>
            </div>

            {!canGovern ? (
              <div className="mt-4 rounded-3xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-amber-800">
                    <Lock className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">View-only access</div>
                    <div className="mt-1 text-sm text-amber-900">Editing roles and policies requires Admin or Finance role. Use deep links to request access.</div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Button variant="accent" onClick={() => toast({ kind: "info", title: "Request access", message: "Open request access flow" })}>
                        <ChevronRight className="h-4 w-4" /> Request access
                      </Button>
                      <Button variant="outline" onClick={() => toast({ kind: "info", title: "Contact Admin", message: "Show org Admin contacts" })}>
                        <ChevronRight className="h-4 w-4" /> Contact Admin
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="bg-slate-50 px-4 py-5 md:px-6">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              <div className="space-y-4 lg:col-span-8">
                <Section title="Roles" subtitle="Standard roles with granular permissions" right={<Pill label={selectedRoleDef.role} tone="info" />}>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {roles.map((r) => (
                      <button
                        key={r.role}
                        type="button"
                        onClick={() => setSelectedRole(r.role)}
                        className={cn(
                          "rounded-3xl border bg-white p-4 text-left shadow-sm hover:bg-slate-50",
                          selectedRole === r.role ? "border-emerald-200 ring-2 ring-emerald-100" : "border-slate-200"
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="text-sm font-semibold text-slate-900">{r.role}</div>
                              <Pill label={`${r.permissions.length} perms`} tone="neutral" />
                            </div>
                            <div className="mt-1 text-sm text-slate-600">{r.summary}</div>
                          </div>
                          <div className={cn("grid h-10 w-10 place-items-center rounded-2xl", selectedRole === r.role ? "bg-emerald-50 text-emerald-700" : "bg-slate-50 text-slate-700")}>
                            <Users className="h-5 w-5" />
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {r.permissions.slice(0, 3).map((p) => (
                            <Pill key={p} label={p} tone="neutral" />
                          ))}
                          {r.permissions.length > 3 ? <Pill label={`+${r.permissions.length - 3} more`} tone="neutral" /> : null}
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">Permission details</div>
                        <div className="mt-1 text-sm text-slate-600">Role: {selectedRoleDef.role}</div>
                      </div>
                      <Button variant="outline" onClick={openAdmin}>
                        <ChevronRight className="h-4 w-4" /> Edit in Admin
                      </Button>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {selectedRoleDef.permissions.map((p) => (
                        <Pill key={p} label={p} tone={p.includes("Manage") ? "info" : "neutral"} />
                      ))}
                    </div>
                  </div>
                </Section>

                <Section
                  title="Dual-control rules"
                  subtitle="Maker-checker for sensitive actions"
                  right={<Pill label={`${dual.filter((d) => d.enabled).length}/${dual.length} enabled`} tone="info" />}
                >
                  <div className="space-y-2">
                    {dual.map((d) => (
                      <div key={d.key} className={cn("rounded-3xl border p-4", d.enabled ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white")}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="text-sm font-semibold text-slate-900">{d.key}</div>
                              <Pill label={d.enabled ? "Enabled" : "Disabled"} tone={d.enabled ? "good" : "neutral"} />
                            </div>
                            <div className="mt-1 text-sm text-slate-700">{d.note}</div>
                          </div>
                          <Button
                            variant={d.enabled ? "primary" : "outline"}
                            disabled={!canGovern}
                            title={!canGovern ? "Admin role required" : "Toggle"}
                            onClick={() => toggleDual(d.key)}
                            className="px-3 py-2"
                          >
                            {d.enabled ? "ON" : "OFF"}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                    <div className="flex items-start gap-2">
                      <Info className="mt-0.5 h-4 w-4" />
                      <div>Dual-control actions create an immutable audit trail with both decisions.</div>
                    </div>
                  </div>
                </Section>

                <Section
                  title="Approval thresholds"
                  subtitle="Approval required above threshold"
                  right={<Pill label={`${thresholds.length} rules`} tone="neutral" />}
                >
                  <div className="space-y-2">
                    {thresholds.map((t) => (
                      <div key={t.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="text-sm font-semibold text-slate-900">{t.label}</div>
                              <Pill label={t.currency} tone="neutral" />
                              <Pill label={`${t.approvers} approver(s)`} tone="info" />
                              <Pill label={`Above ${formatMoney(t.threshold, t.currency)}`} tone="warn" />
                            </div>
                            <div className="mt-1 text-sm text-slate-600">Applies to: {t.appliesTo.join(", ")}</div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Button
                              variant="outline"
                              disabled={!canGovern}
                              title={!canGovern ? "Admin role required" : "Edit"}
                              onClick={() => {
                                setEditId(t.id);
                                setEditOpen(true);
                              }}
                            >
                              <ChevronRight className="h-4 w-4" /> Edit
                            </Button>
                            <Button variant="outline" onClick={() => copy(`${t.label} ${formatMoney(t.threshold, t.currency)} ${t.approvers}`)}>
                              <Copy className="h-4 w-4" /> Copy
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>

                <Section title="Audit trail" subtitle="Recent policy and permission changes" right={<Pill label={`${audit.length}`} tone="neutral" />}>
                  <div className="space-y-2">
                    {audit.map((a) => (
                      <div key={a.id} className={cn("rounded-3xl border p-4", a.outcome === "Blocked" ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white")}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="text-sm font-semibold text-slate-900">{a.action}</div>
                              <Pill label={a.outcome} tone={a.outcome === "Blocked" ? "warn" : "good"} />
                              <Pill label={a.actor} tone="neutral" />
                            </div>
                            <div className="mt-1 text-sm text-slate-700">{a.target}</div>
                            <div className="mt-2 text-xs text-slate-500">{a.when} • {a.why}</div>
                          </div>
                          <Button variant="outline" onClick={() => toast({ kind: "info", title: "Open audit", message: a.id })} className="px-3 py-2">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                        {a.outcome === "Blocked" ? (
                          <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                            <div className="flex items-start gap-2">
                              <AlertTriangle className="mt-0.5 h-4 w-4" />
                              <div>
                                <div className="font-semibold">Blocked by governance</div>
                                <div className="mt-1 text-xs text-amber-800">{a.why}</div>
                              </div>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </Section>
              </div>

              <div className="space-y-4 lg:col-span-4">
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="text-sm font-semibold text-slate-900">Governance health</div>
                  <div className="mt-1 text-xs text-slate-500">A quick view of protections</div>
                  <div className="mt-4 space-y-2">
                    <div className="rounded-3xl border border-slate-200 bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">Dual-control</div>
                          <div className="mt-1 text-sm text-slate-600">Enabled for high-risk actions</div>
                          <div className="mt-2"><Pill label={`${dual.filter((d) => d.enabled).length} rules enabled`} tone="info" /></div>
                        </div>
                        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
                          <ShieldCheck className="h-5 w-5" />
                        </div>
                      </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">Thresholds</div>
                          <div className="mt-1 text-sm text-slate-600">Approval required above thresholds</div>
                          <div className="mt-2"><Pill label={`${thresholds.length} threshold rules`} tone="neutral" /></div>
                        </div>
                        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-50 text-slate-700">
                          <SlidersHorizontal className="h-5 w-5" />
                        </div>
                      </div>
                    </div>

                    <div className={cn("rounded-3xl border p-4", canGovern ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50")}>
                      <div className="flex items-start gap-3">
                        <div className={cn("grid h-10 w-10 place-items-center rounded-2xl", canGovern ? "bg-white text-emerald-700" : "bg-white text-amber-800")}>
                          {canGovern ? <BadgeCheck className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-900">Admin controls</div>
                          <div className="mt-1 text-sm text-slate-700">{canGovern ? "You can edit governance" : "Request Admin access to edit"}</div>
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <Button variant={canGovern ? "outline" : "accent"} onClick={() => (canGovern ? openAdmin() : toast({ kind: "info", title: "Request access", message: "Open request access" }))}>
                              <ChevronRight className="h-4 w-4" /> {canGovern ? "Open Admin" : "Request access"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white p-4">
                      <div className="text-sm font-semibold text-slate-900">Exports and reporting</div>
                      <div className="mt-1 text-sm text-slate-600">Audit-ready exports and receipts</div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Button variant="outline" onClick={() => toast({ kind: "info", title: "Export", message: "Open export center" })}>
                          <ChevronRight className="h-4 w-4" /> Export
                        </Button>
                        <Button variant="outline" onClick={() => toast({ kind: "info", title: "Statements", message: "Open statements" })}>
                          <ChevronRight className="h-4 w-4" /> Statements
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                  style={{
                    background:
                      "radial-gradient(90% 80% at 10% 0%, rgba(247,127,0,0.20), rgba(255,255,255,0)), radial-gradient(90% 80% at 90% 0%, rgba(3,205,140,0.16), rgba(255,255,255,0))",
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-2xl text-white" style={{ background: EVZ.orange }}>
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Premium governance</div>
                      <div className="mt-1 text-sm text-slate-600">Dual-control and audit trail reduce fraud and policy drift.</div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Pill label="Dual-control" tone="neutral" />
                        <Pill label="Audit trail" tone="neutral" />
                        <Pill label="Thresholds" tone="neutral" />
                      </div>
                      <div className="mt-3">
                        <Button variant="outline" onClick={openAdmin}>
                          <ChevronRight className="h-4 w-4" /> Open Admin
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
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
                    <div className="mt-1 text-sm text-slate-600">Enable dual-control for beneficiary edits and batch payouts to reduce payout fraud.</div>
                  </div>
                </div>
                <Button variant="outline" onClick={() => toast({ kind: "info", title: "Support", message: "Open support" })}>
                  <ChevronRight className="h-4 w-4" /> Support
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={editOpen}
        title="Edit approval threshold"
        subtitle="Adjust threshold amount and approver count"
        onClose={() => setEditOpen(false)}
        footer={
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Info className="h-4 w-4" /> Changes are audited.
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button variant="primary" disabled={!canGovern} title={!canGovern ? "Admin role required" : "Save"} onClick={saveThreshold}>
                <BadgeCheck className="h-4 w-4" /> Save
              </Button>
            </div>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="text-sm font-semibold text-slate-900">Threshold</div>
            <div className="mt-3 space-y-3">
              <div>
                <div className="text-xs font-semibold text-slate-600">Rule</div>
                <div className="mt-1">
                  <Select value={editId} onChange={setEditId} options={thresholds.map((t) => t.id)} />
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-600">Amount</div>
                <div className="mt-1">
                  <input
                    value={editThreshold}
                    onChange={(e) => setEditThreshold(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                    placeholder="500000"
                  />
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-600">Approvers</div>
                <div className="mt-1">
                  <input
                    value={editApprovers}
                    onChange={(e) => setEditApprovers(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                    placeholder="2"
                  />
                </div>
                <div className="mt-2 text-xs text-slate-500">Allowed range: 1 to 5</div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-semibold text-slate-900">Preview</div>
            <div className="mt-3 space-y-2 text-sm text-slate-700">
              {(() => {
                const t = thresholds.find((x) => x.id === editId);
                if (!t) return null;
                const thr = Number(editThreshold.replace(/[^0-9]/g, "")) || t.threshold;
                const appr = Number(editApprovers.replace(/[^0-9]/g, "")) || t.approvers;
                return (
                  <>
                    <div className="flex items-center justify-between"><span className="text-slate-500">Label</span><span className="font-semibold">{t.label}</span></div>
                    <div className="flex items-center justify-between"><span className="text-slate-500">Currency</span><span className="font-semibold">{t.currency}</span></div>
                    <div className="flex items-center justify-between"><span className="text-slate-500">Threshold</span><span className="font-semibold">{formatMoney(thr, t.currency)}</span></div>
                    <div className="flex items-center justify-between"><span className="text-slate-500">Approvers</span><span className="font-semibold">{Math.max(1, Math.min(5, appr))}</span></div>
                    <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3 text-xs text-slate-600">
                      <div className="flex items-start gap-2">
                        <Info className="mt-0.5 h-4 w-4" />
                        <div>Transactions above this threshold will require approvals. Policy reasons show in receipt drawer.</div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
            <div className="mt-4">
              <Button variant="outline" onClick={openAdmin}>
                <ChevronRight className="h-4 w-4" /> Advanced rules
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
