import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BadgeCheck,
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Copy,
  Download,
  FileText,
  KeyRound,
  Mail,
  Phone,
  Plus,
  Search,
  Shield,
  Sparkles,
  Trash2,
  User,
  UserPlus,
  Users,
  X,
  Save,
} from "lucide-react";

const EVZ = {
  green: "#03CD8C",
  orange: "#F77F00",
  grey: "#A6A6A6",
  light: "#F2F2F2",
};

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function formatUGX(n: number) {
  const v = Math.round(Number(n || 0));
  return `UGX ${v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

function timeAgo(ts: number | null) {
  if (!ts) return "-";
  const d = Date.now() - ts;
  const m = Math.floor(d / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  return `${days}d ago`;
}

function formatDateTime(ts: number) {
  return new Date(ts).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Pill({ label, tone = "neutral" }: { label: string; tone?: "good" | "warn" | "bad" | "info" | "neutral" }) {
  const map: Record<string, string> = {
    good: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    warn: "bg-amber-50 text-amber-800 ring-amber-200",
    bad: "bg-rose-50 text-rose-700 ring-rose-200",
    info: "bg-blue-50 text-blue-700 ring-blue-200",
    neutral: "bg-slate-50 text-slate-700 ring-slate-200",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1", map[tone] || map.neutral)}>
      {label}
    </span>
  );
}

function Button({ variant = "outline", className, children, onClick, disabled, title }: { variant?: "primary" | "accent" | "outline" | "ghost" | "danger"; className?: string; children: React.ReactNode; onClick?: () => void; disabled?: boolean; title?: string }) {
  const base = "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-4";
  const variants: Record<string, string> = {
    primary: "text-white shadow-[0_12px_24px_rgba(3,205,140,0.22)] hover:opacity-95 focus:ring-emerald-200",
    accent: "text-white shadow-[0_12px_24px_rgba(247,127,0,0.22)] hover:opacity-95 focus:ring-orange-200",
    outline: "border border-slate-200 bg-white text-slate-800 shadow-sm hover:bg-slate-50 focus:ring-slate-200",
    ghost: "bg-transparent text-slate-700 hover:bg-slate-100 focus:ring-slate-200",
    danger: "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 focus:ring-rose-100",
  };
  const style =
    variant === "primary" ? { background: EVZ.green } : variant === "accent" ? { background: EVZ.orange } : undefined;

  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      style={style}
      className={cn(base, variants[variant] || variants.outline, disabled && "cursor-not-allowed opacity-60", className)}
    >
      {children}
    </button>
  );
}

function Toggle({ enabled, onChange, label, description, disabled }: { enabled: boolean; onChange: (v: boolean) => void; label: string; description?: string; disabled?: boolean }) {
  return (
    <div className={cn("flex items-start justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-4", disabled && "opacity-60")}>
      <div>
        <div className="text-sm font-semibold text-slate-900">{label}</div>
        {description ? <div className="mt-1 text-xs text-slate-600">{description}</div> : null}
      </div>
      <button
        type="button"
        disabled={disabled}
        className={cn(
          "relative h-7 w-12 rounded-full border transition",
          enabled ? "border-emerald-300 bg-emerald-200" : "border-slate-200 bg-white",
          disabled && "cursor-not-allowed"
        )}
        onClick={() => !disabled && onChange(!enabled)}
        aria-label={label}
      >
        <span
          className={cn(
            "absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition",
            enabled ? "left-[22px]" : "left-1"
          )}
        />
      </button>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, hint, type = "text", required, disabled }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; hint?: string; type?: string; required?: boolean; disabled?: boolean }) {
  const bad = !!required && !String(value || "").trim();
  return (
    <div className={cn(disabled && "opacity-70")}>
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-semibold text-slate-600">
          {label}
          {required ? <span className="text-rose-600"> *</span> : null}
        </div>
        {hint ? <div className="text-xs text-slate-500">{hint}</div> : null}
      </div>
      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "mt-2 w-full rounded-2xl border px-3 py-2.5 text-sm font-semibold shadow-sm outline-none focus:ring-4",
          disabled
            ? "border-slate-200 bg-slate-50 text-slate-500"
            : bad
              ? "border-rose-300 bg-white text-slate-900 focus:ring-rose-100"
              : "border-slate-200 bg-white text-slate-900 focus:ring-emerald-100"
        )}
      />
      {bad ? <div className="mt-1 text-xs text-rose-600">Required</div> : null}
    </div>
  );
}

function NumberField({ label, value, onChange, hint, disabled }: { label: string; value: number; onChange: (v: number) => void; hint?: string; disabled?: boolean }) {
  return (
    <div className={cn(disabled && "opacity-70")}>
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-semibold text-slate-600">{label}</div>
        {hint ? <div className="text-xs text-slate-500">{hint}</div> : null}
      </div>
      <input
        type="number"
        min={0}
        onKeyDown={(e) => (e.key === "-" || e.key === "e") && e.preventDefault()}
        value={value}
        disabled={disabled}
        onChange={(e) => {
          const v = Number(e.target.value || 0);
          if (v >= 0) onChange(v);
        }}
        className={cn(
          "mt-2 w-full rounded-2xl border px-3 py-2.5 text-sm font-semibold shadow-sm outline-none focus:ring-4",
          disabled ? "border-slate-200 bg-slate-50 text-slate-500" : "border-slate-200 bg-white text-slate-900 focus:ring-emerald-100"
        )}
      />
    </div>
  );
}

function TextArea({ label, value, onChange, placeholder, rows = 4, hint }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number; hint?: string }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-semibold text-slate-600">{label}</div>
        {hint ? <div className="text-xs text-slate-500">{hint}</div> : null}
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-900 shadow-sm outline-none focus:ring-4 focus:ring-emerald-100"
      />
    </div>
  );
}

function Select({ label, value, onChange, options, hint, disabled }: { label: string; value: string; onChange: (v: string) => void; options: Array<{ value: string; label: string }>; hint?: string; disabled?: boolean }) {
  return (
    <div className={cn(disabled && "opacity-70")}>
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-semibold text-slate-600">{label}</div>
        {hint ? <div className="text-xs text-slate-500">{hint}</div> : null}
      </div>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "mt-2 w-full rounded-2xl border px-3 py-2.5 text-sm font-semibold outline-none focus:ring-4",
          disabled ? "border-slate-200 bg-slate-50 text-slate-500" : "border-slate-200 bg-white text-slate-900 focus:ring-emerald-100"
        )}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function Modal({ open, title, subtitle, children, onClose, footer, maxW = "900px" }: { open: boolean; title: string; subtitle?: string; children: React.ReactNode; onClose: () => void; footer?: React.ReactNode; maxW?: string }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
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
            className="fixed inset-x-0 bottom-4 top-4 z-50 mx-auto flex w-[min(980px,calc(100vw-2rem))] flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(2,8,23,0.22)]"
            style={{ maxWidth: maxW, maxHeight: "92vh" }}
            role="dialog"
            aria-modal="true"
          >
            {/* Header - rigid */}
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
              <div>
                <div className="text-lg font-semibold text-slate-900">{title}</div>
                {subtitle ? <div className="mt-1 text-sm text-slate-600">{subtitle}</div> : null}
              </div>
              <button className="rounded-2xl p-2 text-slate-600 hover:bg-slate-100" onClick={onClose} aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body - scrollable */}
            <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>

            {/* Footer - rigid */}
            {footer ? <div className="shrink-0 border-t border-slate-200 px-5 py-4">{footer}</div> : null}
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}

function Drawer({ open, title, subtitle, children, onClose, footer }: { open: boolean; title: string; subtitle?: string; children: React.ReactNode; onClose: () => void; footer?: React.ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div className="fixed inset-0 z-40 bg-black/35" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.18 }}
            className={cn(
              "fixed z-50 flex flex-col overflow-hidden border border-slate-200 bg-white shadow-[0_30px_90px_rgba(2,8,23,0.22)]",
              "bottom-2 left-2 right-2 top-2 rounded-[28px]", // Reduced top offset for more space on mobile
              "lg:bottom-4 lg:left-auto lg:right-4 lg:top-4 lg:w-[560px]"
            )}
            style={{ maxHeight: "calc(100vh - 32px)" }}
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
              <div className="min-w-0">
                <div className="truncate text-base font-semibold text-slate-900">{title}</div>
                {subtitle ? <div className="mt-1 text-xs text-slate-600">{subtitle}</div> : null}
              </div>
              <button className="rounded-2xl p-2 text-slate-600 hover:bg-slate-100" onClick={onClose} aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>

            {/* Footer */}
            {footer ? <div className="shrink-0 border-t border-slate-200 px-5 py-4">{footer}</div> : null}
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
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
                {t.kind === "error" || t.kind === "warn" ? <AlertTriangle className="h-5 w-5" /> : <Check className="h-5 w-5" />}
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

function riskLabel(score: number) {
  if (score >= 70) return { label: "High", tone: "bad" as const };
  if (score >= 40) return { label: "Medium", tone: "warn" as const };
  return { label: "Low", tone: "good" as const };
}

function computeRisk(u: { policyBreaches?: number; anomalySignals?: number; spendMonth?: number; limitMonth?: number; role?: string; daysSinceApprovalAction?: number; status?: string }) {
  // Simple, explainable risk model (logic-based)
  const breaches = Number(u.policyBreaches || 0);
  const anomaly = Number(u.anomalySignals || 0);
  const spend = Number(u.spendMonth || 0);
  const limit = Math.max(1, Number(u.limitMonth || 1));
  const utilization = spend / limit;

  let score = 8;
  score += breaches * 10;
  score += anomaly * 15;
  score += utilization > 1 ? 35 : utilization > 0.85 ? 20 : utilization > 0.6 ? 10 : 0;
  if (u.role === "Approver" && (u.daysSinceApprovalAction || 0) >= 14) score += 25;
  if (u.status === "Suspended") score += 10;

  score = clamp(score, 0, 100);
  const l = riskLabel(score);
  return { score, ...l };
}

function suggestionForLimits(u: { spendMonth?: number; limitMonth?: number }) {
  const spend = Number(u.spendMonth || 0);
  const limit = Math.max(1, Number(u.limitMonth || 1));
  const utilization = spend / limit;

  if (utilization >= 0.9) {
    return {
      title: "Consider raising monthly cap",
      body: "User consistently near cap. If legitimate, raise cap or enforce approvals above threshold.",
      tone: "warn" as const,
      suggestedLimit: Math.round(limit * 1.25),
    };
  }

  if (utilization <= 0.2 && spend > 0) {
    return {
      title: "Consider lowering monthly cap",
      body: "Low utilization. You can tighten cap or move budget to higher-need users.",
      tone: "info" as const,
      suggestedLimit: Math.round(limit * 0.7),
    };
  }

  return {
    title: "Limits look reasonable",
    body: "No recommendation based on current patterns.",
    tone: "good" as const,
    suggestedLimit: null,
  };
}

function parseCSV(text: string) {
  // Very simple CSV parser: header row with name,email,phone,role,group,costCenter
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return { headers: [], rows: [] };

  const headers = lines[0].split(",").map((h) => h.trim());
  const rows = lines.slice(1).map((line) => {
    const cols = line.split(",").map((c) => c.trim());
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => (obj[h] = cols[i] || ""));
    return obj;
  });

  return { headers, rows };
}

interface AuditLog {
  ts: number;
  actor: string;
  action: string;
  detail: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  role: string;
  group: string;
  costCenter: string;
  autoApproval: boolean;
  autoApproveUnder: number;
  limitDay: number;
  limitWeek: number;
  limitMonth: number;
  spendDay: number;
  spendWeek: number;
  spendMonth: number;
  policyBreaches: number;
  anomalySignals: number;
  daysSinceApprovalAction: number;
  lastActiveAt: number | null;
  createdAt: number;
  audit: AuditLog[];
}

interface Toast {
  id: string;
  title: string;
  message: string;
  kind?: "success" | "warn" | "error" | "info" | "neutral";
}

export default function CorporatePayUsersInvitationsV2() {
  const ROLES = ["Org Admin", "Manager", "Accountant", "Approver", "Travel Coordinator", "User"];
  const GROUPS = ["Operations", "Sales", "Finance", "Admin", "Procurement"];
  const COST_CENTERS = [
    { id: "FIN-OPS", group: "Finance", name: "Finance ops" },
    { id: "OPS-CORE", group: "Operations", name: "Operations core" },
    { id: "SALES-TRAVEL", group: "Sales", name: "Sales travel" },
    { id: "ADMIN-CORE", group: "Admin", name: "Admin core" },
    { id: "PROC-001", group: "Procurement", name: "Procurement" },
  ];

  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = (t) => {
    const id = uid("toast");
    setToasts((p) => [{ id, ...t }, ...p].slice(0, 4));
    window.setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 3200);
  };

  const [tab, setTab] = useState("All");
  const [q, setQ] = useState("");
  const [groupFilter, setGroupFilter] = useState("All");
  const [roleFilter, setRoleFilter] = useState("All");
  const [riskFilter, setRiskFilter] = useState("All");

  const [users, setUsers] = useState<User[]>(() => {
    const now = Date.now();
    return [
      {
        id: "U-1001",
        name: "Mary N.",
        email: "mary@acme.com",
        phone: "+256 700 111 111",
        status: "Active",
        role: "Manager",
        group: "Operations",
        costCenter: "OPS-CORE",
        autoApproval: false,
        autoApproveUnder: 0,
        limitDay: 1200000,
        limitWeek: 4800000,
        limitMonth: 12000000,
        spendDay: 180000,
        spendWeek: 1320000,
        spendMonth: 9400000,
        policyBreaches: 1,
        anomalySignals: 0,
        daysSinceApprovalAction: 999,
        lastActiveAt: now - 2 * 60 * 60 * 1000,
        createdAt: now - 38 * 24 * 60 * 60 * 1000,
        audit: [
          { ts: now - 38 * 24 * 60 * 60 * 1000, actor: "Org Admin", action: "Created", detail: "User created and activated" },
        ],
      },
      {
        id: "U-1002",
        name: "Finance Desk",
        email: "finance@acme.com",
        phone: "+256 700 222 222",
        status: "Active",
        role: "Accountant",
        group: "Finance",
        costCenter: "FIN-OPS",
        autoApproval: false,
        autoApproveUnder: 0,
        limitDay: 2500000,
        limitWeek: 12000000,
        limitMonth: 30000000,
        spendDay: 420000,
        spendWeek: 2200000,
        spendMonth: 8200000,
        policyBreaches: 0,
        anomalySignals: 0,
        daysSinceApprovalAction: 2,
        lastActiveAt: now - 45 * 60 * 1000,
        createdAt: now - 60 * 24 * 60 * 60 * 1000,
        audit: [
          { ts: now - 60 * 24 * 60 * 60 * 1000, actor: "Org Admin", action: "Created", detail: "Finance role created" },
        ],
      },
      {
        id: "U-1003",
        name: "John S.",
        email: "john@acme.com",
        phone: "+256 700 333 333",
        status: "Active",
        role: "User",
        group: "Sales",
        costCenter: "SALES-TRAVEL",
        autoApproval: true,
        autoApproveUnder: 200000,
        limitDay: 800000,
        limitWeek: 4200000,
        limitMonth: 12000000,
        spendDay: 92000,
        spendWeek: 760000,
        spendMonth: 11800000,
        policyBreaches: 2,
        anomalySignals: 1,
        daysSinceApprovalAction: 999,
        lastActiveAt: now - 15 * 60 * 1000,
        createdAt: now - 22 * 24 * 60 * 60 * 1000,
        audit: [
          { ts: now - 22 * 24 * 60 * 60 * 1000, actor: "Org Admin", action: "Created", detail: "User invited and activated" },
          { ts: now - 6 * 24 * 60 * 60 * 1000, actor: "System", action: "Policy breach", detail: "Ride request outside hours" },
        ],
      },
      {
        id: "U-1004",
        name: "Approver Desk",
        email: "approver@acme.com",
        phone: "+256 700 444 444",
        status: "Active",
        role: "Approver",
        group: "Procurement",
        costCenter: "PROC-001",
        autoApproval: false,
        autoApproveUnder: 0,
        limitDay: 5000000,
        limitWeek: 20000000,
        limitMonth: 50000000,
        spendDay: 0,
        spendWeek: 0,
        spendMonth: 0,
        policyBreaches: 0,
        anomalySignals: 0,
        daysSinceApprovalAction: 21,
        lastActiveAt: now - 22 * 24 * 60 * 60 * 1000,
        createdAt: now - 120 * 24 * 60 * 60 * 1000,
        audit: [
          { ts: now - 120 * 24 * 60 * 60 * 1000, actor: "Org Admin", action: "Created", detail: "Approver role created" },
          { ts: now - 21 * 24 * 60 * 60 * 1000, actor: "Approver Desk", action: "Approved", detail: "Approved PO-9002" },
        ],
      },
      {
        id: "U-1005",
        name: "New Hire",
        email: "newhire@acme.com",
        phone: "+256 700 555 555",
        status: "Invited",
        role: "User",
        group: "Operations",
        costCenter: "OPS-CORE",
        autoApproval: false,
        autoApproveUnder: 0,
        limitDay: 600000,
        limitWeek: 3000000,
        limitMonth: 8000000,
        spendDay: 0,
        spendWeek: 0,
        spendMonth: 0,
        policyBreaches: 0,
        anomalySignals: 0,
        daysSinceApprovalAction: 999,
        lastActiveAt: null,
        createdAt: now - 2 * 24 * 60 * 60 * 1000,
        audit: [
          { ts: now - 2 * 24 * 60 * 60 * 1000, actor: "Org Admin", action: "Invited", detail: "Invite sent" },
        ],
      },
      {
        id: "U-1006",
        name: "Former Staff",
        email: "former@acme.com",
        phone: "+256 700 666 666",
        status: "Offboarded",
        role: "User",
        group: "Admin",
        costCenter: "ADMIN-CORE",
        autoApproval: false,
        autoApproveUnder: 0,
        limitDay: 0,
        limitWeek: 0,
        limitMonth: 0,
        spendDay: 0,
        spendWeek: 0,
        spendMonth: 0,
        policyBreaches: 0,
        anomalySignals: 0,
        daysSinceApprovalAction: 999,
        lastActiveAt: now - 200 * 24 * 60 * 60 * 1000,
        createdAt: now - 420 * 24 * 60 * 60 * 1000,
        audit: [
          { ts: now - 18 * 24 * 60 * 60 * 1000, actor: "Org Admin", action: "Offboarded", detail: "CorporatePay revoked immediately" },
        ],
      },
    ];
  });

  // Delegation prompt for inactive approver
  const inactiveApprovers = useMemo(() => {
    return users
      .filter((u) => u.role === "Approver" && u.status === "Active")
      .map((u) => ({ user: u, risk: computeRisk(u) }))
      .filter((x) => x.user.daysSinceApprovalAction >= 14);
  }, [users]);

  // Filters
  const filteredUsers = useMemo(() => {
    const query = q.trim().toLowerCase();
    return users
      .filter((u) => (tab === "All" ? true : u.status === tab))
      .filter((u) => (groupFilter === "All" ? true : u.group === groupFilter))
      .filter((u) => (roleFilter === "All" ? true : u.role === roleFilter))
      .filter((u) => {
        if (riskFilter === "All") return true;
        const r = computeRisk(u);
        return r.label === riskFilter;
      })
      .filter((u) => {
        if (!query) return true;
        const blob = `${u.id} ${u.name} ${u.email} ${u.phone} ${u.status} ${u.role} ${u.group} ${u.costCenter}`.toLowerCase();
        return blob.includes(query);
      })
      .map((u) => ({ user: u, risk: computeRisk(u) }));
  }, [users, tab, q, groupFilter, roleFilter, riskFilter]);

  const counts = useMemo(() => {
    const by = { All: users.length, Invited: 0, Active: 0, Suspended: 0, Offboarded: 0 };
    users.forEach((u) => {
      by[u.status] = (by[u.status] || 0) + 1;
    });
    return by;
  }, [users]);

  const topSpenders = useMemo(() => {
    return [...users]
      .filter((u) => u.status === "Active")
      .sort((a, b) => (b.spendMonth || 0) - (a.spendMonth || 0))
      .slice(0, 5)
      .map((u) => ({ user: u, suggestion: suggestionForLimits(u), risk: computeRisk(u) }));
  }, [users]);

  // Add user
  const [addOpen, setAddOpen] = useState(false);
  const [addDraft, setAddDraft] = useState({
    name: "",
    email: "",
    phone: "",
    role: "User",
    group: "Operations",
    costCenter: "OPS-CORE",
    autoApproval: false,
    autoApproveUnder: 0,
    limitDay: 600000,
    limitWeek: 3000000,
    limitMonth: 8000000,
    sendInviteNow: true,
  });

  const openAdd = () => {
    setAddDraft({
      name: "",
      email: "",
      phone: "",
      role: "User",
      group: "Operations",
      costCenter: "OPS-CORE",
      autoApproval: false,
      autoApproveUnder: 0,
      limitDay: 600000,
      limitWeek: 3000000,
      limitMonth: 8000000,
      sendInviteNow: true,
    });
    setAddOpen(true);
  };

  const createUser = () => {
    if (!addDraft.name.trim() || !addDraft.email.trim()) {
      toast({ title: "Missing fields", message: "Name and email are required.", kind: "warn" });
      return;
    }

    const now = Date.now();
    const id = `U-${Math.floor(1000 + Math.random() * 9000)}`;

    const status = addDraft.sendInviteNow ? "Invited" : "Active";
    const audit = [
      {
        ts: now,
        actor: "Org Admin",
        action: addDraft.sendInviteNow ? "Invited" : "Created",
        detail: `Role ${addDraft.role}, Group ${addDraft.group}, Cost center ${addDraft.costCenter}`,
      },
    ];

    setUsers((p) => [
      {
        id,
        name: addDraft.name,
        email: addDraft.email,
        phone: addDraft.phone,
        status,
        role: addDraft.role,
        group: addDraft.group,
        costCenter: addDraft.costCenter,
        autoApproval: addDraft.autoApproval,
        autoApproveUnder: addDraft.autoApproval ? addDraft.autoApproveUnder : 0,
        limitDay: addDraft.limitDay,
        limitWeek: addDraft.limitWeek,
        limitMonth: addDraft.limitMonth,
        spendDay: 0,
        spendWeek: 0,
        spendMonth: 0,
        policyBreaches: 0,
        anomalySignals: 0,
        daysSinceApprovalAction: 999,
        lastActiveAt: null,
        createdAt: now,
        audit,
      },
      ...p,
    ]);

    setAddOpen(false);
    toast({ title: "User created", message: `${id} • ${status}`, kind: "success" });
  };

  // Bulk import
  const fileRef = useRef<HTMLInputElement>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkPreview, setBulkPreview] = useState<{ headers: string[]; rows: Record<string, string>[] }>({ headers: [], rows: [] });

  const csvTemplate = useMemo(() => {
    return [
      "name,email,phone,role,group,costCenter",
      "Jane Doe,jane@acme.com,+256700000001,User,Operations,OPS-CORE",
      "Mark P.,mark@acme.com,+256700000002,Approver,Procurement,PROC-001",
    ].join("\n");
  }, []);

  const openBulk = () => {
    setBulkText(csvTemplate);
    setBulkPreview(parseCSV(csvTemplate));
    setBulkOpen(true);
  };

  const onBulkFile = async (file) => {
    if (!file) return;
    const text = await file.text();
    setBulkText(text);
    setBulkPreview(parseCSV(text));
  };

  const downloadTemplate = () => {
    const blob = new Blob([csvTemplate], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "corporatepay-users-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importUsers = () => {
    if (!bulkPreview.rows.length) {
      toast({ title: "No rows", message: "Upload or paste a CSV with at least one row.", kind: "warn" });
      return;
    }

    const now = Date.now();
    const created = bulkPreview.rows.slice(0, 50).map((r) => {
      const id = `U-${Math.floor(1000 + Math.random() * 9000)}`;
      const role = (r.role || "User").trim();
      const group = (r.group || "Operations").trim();
      const costCenter = (r.costCenter || "OPS-CORE").trim();

      return {
        id,
        name: (r.name || "Unnamed").trim(),
        email: (r.email || "").trim(),
        phone: (r.phone || "").trim(),
        status: "Invited",
        role: ROLES.includes(role) ? role : "User",
        group: GROUPS.includes(group) ? group : "Operations",
        costCenter,
        autoApproval: false,
        autoApproveUnder: 0,
        limitDay: 600000,
        limitWeek: 3000000,
        limitMonth: 8000000,
        spendDay: 0,
        spendWeek: 0,
        spendMonth: 0,
        policyBreaches: 0,
        anomalySignals: 0,
        daysSinceApprovalAction: 999,
        lastActiveAt: null,
        createdAt: now,
        audit: [
          { ts: now, actor: "Org Admin", action: "Bulk invited", detail: "Imported via CSV" },
        ],
      };
    });

    setUsers((p) => [...created, ...p]);
    setBulkOpen(false);
    toast({ title: "Bulk import", message: `Created ${created.length} invited users.`, kind: "success" });
  };

  // HRIS (phase 2)
  const [hrisOpen, setHrisOpen] = useState(false);

  // User drawer
  const [selected, setSelected] = useState<User | null>(null);
  const selectedRisk = selected ? computeRisk(selected) : null;

  const [offboardOpen, setOffboardOpen] = useState(false);
  const [offboardReason, setOffboardReason] = useState("");
  const [offboardRevokeNow, setOffboardRevokeNow] = useState(true);

  const [delegateOpen, setDelegateOpen] = useState(false);
  const [delegateFrom, setDelegateFrom] = useState<User | null>(null);
  const [delegateTo, setDelegateTo] = useState("Finance Desk");
  const [delegateUntil, setDelegateUntil] = useState("2026-01-21");
  const [delegateReason, setDelegateReason] = useState("Approver inactivity coverage");

  const openUser = (u) => setSelected(u);

  const addAudit = (id, entry) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, audit: [{ ts: Date.now(), ...entry }, ...(u.audit || [])] } : u))
    );
  };

  const suspendUser = (u) => {
    if (u.status !== "Active") {
      toast({ title: "Not active", message: "Only active users can be suspended.", kind: "warn" });
      return;
    }
    setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, status: "Suspended" } : x)));
    addAudit(u.id, { actor: "Org Admin", action: "Suspended", detail: "CorporatePay blocked at checkout" });
    toast({ title: "Suspended", message: `${u.name} suspended.`, kind: "info" });
  };

  const reactivateUser = (u) => {
    if (u.status !== "Suspended") {
      toast({ title: "Not suspended", message: "User is not suspended.", kind: "warn" });
      return;
    }
    setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, status: "Active" } : x)));
    addAudit(u.id, { actor: "Org Admin", action: "Reactivated", detail: "CorporatePay restored" });
    toast({ title: "Reactivated", message: `${u.name} active again.`, kind: "success" });
  };

  const resendInvite = (u) => {
    if (u.status !== "Invited") {
      toast({ title: "Not invited", message: "User is not in invited status.", kind: "warn" });
      return;
    }
    addAudit(u.id, { actor: "System", action: "Invite resent", detail: "Invite resent to email/SMS" });
    toast({ title: "Invite resent", message: `Invite resent to ${u.email}.`, kind: "success" });
  };

  const openOffboard = (u) => {
    setOffboardReason("");
    setOffboardRevokeNow(true);
    setOffboardOpen(true);
  };

  const confirmOffboard = () => {
    if (!selected) return;
    if (offboardReason.trim().length < 8) {
      toast({ title: "Reason required", message: "Provide a clear offboarding reason.", kind: "warn" });
      return;
    }

    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== selected.id) return u;
        return {
          ...u,
          status: "Offboarded",
          limitDay: 0,
          limitWeek: 0,
          limitMonth: 0,
          autoApproval: false,
          autoApproveUnder: 0,
        };
      })
    );

    addAudit(selected.id, {
      actor: "Org Admin",
      action: "Offboarded",
      detail: `${offboardRevokeNow ? "CorporatePay revoked immediately" : "CorporatePay revoked"} • Reason: ${offboardReason}`,
    });

    setOffboardOpen(false);
    setSelected((p) => (p ? { ...p, status: "Offboarded" } : p));
    toast({ title: "Offboarded", message: `${selected.name} offboarded.`, kind: "success" });
  };

  const openDelegationFor = (u) => {
    setDelegateFrom(u);
    setDelegateTo("Finance Desk");
    setDelegateUntil("2026-01-21");
    setDelegateReason("Approver inactivity coverage");
    setDelegateOpen(true);
  };

  const confirmDelegation = () => {
    if (!delegateFrom) return;
    if (!delegateReason.trim()) {
      toast({ title: "Reason required", message: "Provide a reason for delegation.", kind: "warn" });
      return;
    }
    addAudit(delegateFrom.id, {
      actor: "Org Admin",
      action: "Delegation set",
      detail: `Delegated approvals to ${delegateTo} until ${delegateUntil}. Reason: ${delegateReason}`,
    });
    setDelegateOpen(false);
    toast({ title: "Delegation set", message: `${delegateFrom.name} delegated to ${delegateTo}.`, kind: "success" });
  };

  const statusTabs = ["All", "Invited", "Active", "Suspended", "Offboarded"];

  return (
    <div className="min-h-screen" style={{ background: "radial-gradient(90% 60% at 50% 0%, rgba(3,205,140,0.18), rgba(255,255,255,0))" }}>
      <ToastStack toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((x) => x.id !== id))} />

      <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-6">
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(2,8,23,0.12)]">
          {/* Header */}
          <div className="border-b border-slate-200 bg-white px-4 py-4 md:px-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl text-white" style={{ background: EVZ.green }}>
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">Users and Invitations</div>
                  <div className="mt-1 text-xs text-slate-500">Manage access, limits, and risk. Offboarding revokes CorporatePay instantly and preserves audit history.</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Pill label={`Total: ${counts.All}`} tone="neutral" />
                    <Pill label={`Active: ${counts.Active}`} tone={counts.Active ? "good" : "neutral"} />
                    <Pill label={`Invited: ${counts.Invited}`} tone={counts.Invited ? "info" : "neutral"} />
                    <Pill label={`Suspended: ${counts.Suspended}`} tone={counts.Suspended ? "warn" : "neutral"} />
                    <Pill label={`Offboarded: ${counts.Offboarded}`} tone={counts.Offboarded ? "neutral" : "neutral"} />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={openBulk}>
                  <ClipboardList className="h-4 w-4" /> Bulk import
                </Button>
                <Button variant="outline" onClick={() => setHrisOpen(true)}>
                  <Building2 className="h-4 w-4" /> HRIS import
                </Button>
                <Button variant="primary" onClick={openAdd}>
                  <UserPlus className="h-4 w-4" /> Add user
                </Button>
              </div>
            </div>

            {/* Status tabs */}
            <div className="mt-4 flex flex-wrap gap-2">
              {statusTabs.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-semibold ring-1 transition",
                    tab === t ? "text-white ring-emerald-600" : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
                  )}
                  style={tab === t ? { background: EVZ.green } : undefined}
                >
                  {t} {t === "All" ? `(${counts.All})` : `(${counts[t] || 0})`}
                </button>
              ))}
            </div>

            {/* Filters */}
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
                <div className="text-xs font-semibold text-slate-600">Search</div>
                <div className="mt-1 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-2">
                  <Search className="h-4 w-4 text-slate-500" />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Name, email, ID, group..."
                    className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>

              <Select
                label="Group"
                value={groupFilter}
                onChange={setGroupFilter}
                options={[{ value: "All", label: "All" }, ...GROUPS.map((g) => ({ value: g, label: g }))]}
              />

              <Select
                label="Role"
                value={roleFilter}
                onChange={setRoleFilter}
                options={[{ value: "All", label: "All" }, ...ROLES.map((r) => ({ value: r, label: r }))]}
              />

              <Select
                label="Risk"
                value={riskFilter}
                onChange={setRiskFilter}
                options={[
                  { value: "All", label: "All" },
                  { value: "Low", label: "Low" },
                  { value: "Medium", label: "Medium" },
                  { value: "High", label: "High" },
                ]}
                hint="Premium"
              />
            </div>
          </div>

          {/* Body */}
          <div className="bg-slate-50 px-4 py-5 md:px-6">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {/* Left rail */}
              <div className="space-y-4">
                {/* Delegation prompt */}
                {inactiveApprovers.length ? (
                  <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">Delegation needed</div>
                        <div className="mt-1 text-xs text-slate-700">Approver inactivity detected. Set a delegate to avoid approval bottlenecks.</div>
                      </div>
                      <Pill label="Premium" tone="info" />
                    </div>
                    <div className="mt-3 space-y-2">
                      {inactiveApprovers.slice(0, 2).map((x) => (
                        <div key={x.user.id} className="rounded-2xl border border-amber-200 bg-white p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-slate-900">{x.user.name}</div>
                              <div className="mt-1 text-xs text-slate-600">Inactive approvals: {x.user.daysSinceApprovalAction} days • Risk: {x.risk.label}</div>
                            </div>
                            <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => openDelegationFor(x.user)}>
                              <ChevronRight className="h-4 w-4" /> Set delegate
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 text-xs text-slate-700">This creates an audit log entry and routes approvals to a delegate.</div>
                  </div>
                ) : (
                  <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">Approvals health</div>
                        <div className="mt-1 text-xs text-slate-500">No inactive approvers detected in this demo.</div>
                      </div>
                      <Pill label="OK" tone="good" />
                    </div>
                    <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                      Premium: delegation prompts appear when an approver is inactive or SLA breaches spike.
                    </div>
                  </div>
                )}

                {/* Top spenders */}
                <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Top spenders</div>
                      <div className="mt-1 text-xs text-slate-500">Premium insights and limit suggestions</div>
                    </div>
                    <Pill label="Premium" tone="info" />
                  </div>
                  <div className="mt-3 space-y-2">
                    {topSpenders.map((x) => (
                      <div key={x.user.id} className="rounded-2xl border border-slate-200 bg-white p-3">
                        <div className="flex items-start justify-between gap-3">
                          <button className="min-w-0 text-left" onClick={() => openUser(x.user)}>
                            <div className="truncate text-sm font-semibold text-slate-900">{x.user.name}</div>
                            <div className="mt-1 text-xs text-slate-500">{x.user.group} • {x.user.role}</div>
                            <div className="mt-2 text-xs text-slate-700">Spend: <span className="font-semibold text-slate-900">{formatUGX(x.user.spendMonth)}</span> / {formatUGX(x.user.limitMonth)}</div>
                          </button>
                          <div className="flex flex-col items-end gap-2">
                            <Pill label={x.risk.label} tone={x.risk.tone} />
                            <Pill label={x.suggestion.title} tone={x.suggestion.tone} />
                          </div>
                        </div>
                        {x.suggestion.suggestedLimit ? (
                          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700">
                            <div>
                              Suggested monthly cap: <span className="font-semibold text-slate-900">{formatUGX(x.suggestion.suggestedLimit)}</span>
                            </div>
                            <Button
                              variant="outline"
                              className="px-3 py-2 text-xs"
                              onClick={() => {
                                setUsers((prev) => prev.map((u) => (u.id === x.user.id ? { ...u, limitMonth: x.suggestion.suggestedLimit as number } : u)));
                                addAudit(x.user.id, { actor: "Org Admin", action: "Limit adjusted", detail: `Monthly cap set to ${formatUGX(x.suggestion.suggestedLimit as number)}` });
                                toast({ title: "Applied", message: "Limit suggestion applied (demo).", kind: "success" });
                              }}
                            >
                              <Sparkles className="h-4 w-4" /> Apply
                            </Button>
                          </div>
                        ) : (
                          <div className="mt-2 text-xs text-slate-600">{x.suggestion.body}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bulk/HRIS summary */}
                <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Onboarding tools</div>
                      <div className="mt-1 text-xs text-slate-500">CSV bulk import and HRIS (Phase 2)</div>
                    </div>
                    <Pill label="Core" tone="neutral" />
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-2">
                    <Button variant="outline" onClick={openBulk}>
                      <ClipboardList className="h-4 w-4" /> Bulk import CSV
                    </Button>
                    <Button variant="outline" onClick={() => setHrisOpen(true)}>
                      <Building2 className="h-4 w-4" /> HRIS import (Phase 2)
                    </Button>
                  </div>
                </div>
              </div>

              {/* Main list */}
              <div className="lg:col-span-2">
                <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Users</div>
                      <div className="mt-1 text-xs text-slate-500">Click a row to open details and audit history.</div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button variant="outline" className="text-xs" onClick={() => { setQ(""); setGroupFilter("All"); setRoleFilter("All"); setRiskFilter("All"); toast({ title: "Reset", message: "Filters reset.", kind: "info" }); }}>
                        <X className="h-4 w-4" /> Reset filters
                      </Button>
                      <Button variant="primary" className="text-xs" onClick={openAdd}>
                        <UserPlus className="h-4 w-4" /> Add user
                      </Button>
                    </div>
                  </div>

                  {/* Desktop table */}
                  <div className="hidden overflow-x-auto md:block">
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-slate-50 text-xs text-slate-600">
                        <tr>
                          <th className="px-4 py-3 font-semibold">User</th>
                          <th className="px-4 py-3 font-semibold">Status</th>
                          <th className="px-4 py-3 font-semibold">Role</th>
                          <th className="px-4 py-3 font-semibold">Group</th>
                          <th className="px-4 py-3 font-semibold">Risk</th>
                          <th className="px-4 py-3 font-semibold">Spend MTD</th>
                          <th className="px-4 py-3 font-semibold">Auto-approve</th>
                          <th className="px-4 py-3 font-semibold">Last active</th>
                          <th className="px-4 py-3 font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map(({ user: u, risk }) => (
                          <tr key={u.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                            <td className="px-4 py-3">
                              <button className="text-left" onClick={() => openUser(u)}>
                                <div className="font-semibold text-slate-900">{u.name}</div>
                                <div className="mt-1 text-xs text-slate-500">{u.email} • {u.id}</div>
                              </button>
                            </td>
                            <td className="px-4 py-3"><Pill label={u.status} tone={u.status === "Active" ? "good" : u.status === "Invited" ? "info" : u.status === "Suspended" ? "warn" : "neutral"} /></td>
                            <td className="px-4 py-3 text-slate-700">{u.role}</td>
                            <td className="px-4 py-3 text-slate-700">{u.group}</td>
                            <td className="px-4 py-3"><Pill label={`${risk.label} (${risk.score})`} tone={risk.tone} /></td>
                            <td className="px-4 py-3 text-slate-700">{formatUGX(u.spendMonth)} / {formatUGX(u.limitMonth)}</td>
                            <td className="px-4 py-3">
                              {u.autoApproval ? <Pill label={`Yes ≤ ${formatUGX(u.autoApproveUnder)}`} tone="info" /> : <Pill label="No" tone="neutral" />}
                            </td>
                            <td className="px-4 py-3 text-slate-700">{u.lastActiveAt ? timeAgo(u.lastActiveAt) : "-"}</td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap items-center gap-2">
                                {u.status === "Invited" ? (
                                  <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => resendInvite(u)}>
                                    <Mail className="h-4 w-4" /> Resend
                                  </Button>
                                ) : null}
                                {u.status === "Active" ? (
                                  <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => suspendUser(u)}>
                                    <Shield className="h-4 w-4" /> Suspend
                                  </Button>
                                ) : null}
                                {u.status === "Suspended" ? (
                                  <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => reactivateUser(u)}>
                                    <Check className="h-4 w-4" /> Reactivate
                                  </Button>
                                ) : null}
                                <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => openUser(u)}>
                                  <ChevronRight className="h-4 w-4" /> Open
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {!filteredUsers.length ? (
                          <tr>
                            <td colSpan={9} className="px-4 py-12">
                              <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center">
                                <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-700">
                                  <Users className="h-6 w-6" />
                                </div>
                                <div className="mt-3 text-sm font-semibold text-slate-900">No users found</div>
                                <div className="mt-1 text-sm text-slate-600">Try adjusting filters or search.</div>
                              </div>
                            </td>
                          </tr>
                        ) : null}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile cards */}
                  <div className="space-y-3 p-4 md:hidden">
                    {filteredUsers.map(({ user: u, risk }) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => openUser(u)}
                        className="w-full rounded-3xl border border-slate-200 bg-white p-4 text-left"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-slate-900">{u.name}</div>
                            <div className="mt-1 text-xs text-slate-500">{u.email}</div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <Pill label={u.status} tone={u.status === "Active" ? "good" : u.status === "Invited" ? "info" : u.status === "Suspended" ? "warn" : "neutral"} />
                              <Pill label={u.group} tone="neutral" />
                              <Pill label={u.role} tone="neutral" />
                              <Pill label={`${risk.label} (${risk.score})`} tone={risk.tone} />
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-slate-400" />
                        </div>
                        <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700">
                          Spend: {formatUGX(u.spendMonth)} / {formatUGX(u.limitMonth)}
                        </div>
                      </button>
                    ))}
                    {!filteredUsers.length ? (
                      <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center">
                        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-700">
                          <Users className="h-6 w-6" />
                        </div>
                        <div className="mt-3 text-sm font-semibold text-slate-900">No users found</div>
                        <div className="mt-1 text-sm text-slate-600">Try adjusting filters or add a user.</div>
                      </div>
                    ) : null}
                  </div>

                  <div className="border-t border-slate-200 px-4 py-3 text-xs text-slate-500">
                    Premium: risk scoring is explainable and based on policy breaches, anomalies, utilization, and approver inactivity.
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 text-xs text-slate-500">
              F Users & Invitations v2: add users with role/group/cost center, auto-approval eligibility, spend limits, bulk CSV import, HRIS (phase 2), offboarding workflow, risk scoring, top spenders insights, and delegation prompts.
            </div>
          </div>
        </div>
      </div>

      {/* Add user modal */}
      <Modal
        open={addOpen}
        title="Add user"
        subtitle="Create a user, set role, group, cost center, spend limits, and auto-approval eligibility."
        onClose={() => setAddOpen(false)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={() => toast({ title: "Preview", message: "Preview invite message (demo).", kind: "info" })}>
                <Mail className="h-4 w-4" /> Preview invite
              </Button>
              <Button variant="primary" onClick={createUser}>
                <UserPlus className="h-4 w-4" /> Create
              </Button>
            </div>
          </div>
        }
        maxW="980px"
      >
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="text-sm font-semibold text-slate-900">Identity</div>
              <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Full name" required value={addDraft.name} onChange={(v) => setAddDraft((p) => ({ ...p, name: v }))} placeholder="Full name" />
                <Field label="Email" required value={addDraft.email} onChange={(v) => setAddDraft((p) => ({ ...p, email: v }))} placeholder="name@company.com" />
                <Field label="Phone" value={addDraft.phone} onChange={(v) => setAddDraft((p) => ({ ...p, phone: v }))} placeholder="+256..." />
                <Select label="Role" value={addDraft.role} onChange={(v) => setAddDraft((p) => ({ ...p, role: v }))} options={ROLES.map((r) => ({ value: r, label: r }))} />
                <Select label="Group" value={addDraft.group} onChange={(v) => {
                  // update cost centers default
                  const first = COST_CENTERS.find((c) => c.group === v)?.id || "OPS-CORE";
                  setAddDraft((p) => ({ ...p, group: v, costCenter: first }));
                }} options={GROUPS.map((g) => ({ value: g, label: g }))} />
                <Select
                  label="Cost center"
                  value={addDraft.costCenter}
                  onChange={(v) => setAddDraft((p) => ({ ...p, costCenter: v }))}
                  options={COST_CENTERS.filter((c) => c.group === addDraft.group).map((c) => ({ value: c.id, label: `${c.id} - ${c.name}` }))}
                />
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">Spend limits</div>
                  <div className="mt-1 text-xs text-slate-500">Daily, weekly, monthly caps for CorporatePay.</div>
                </div>
                <Pill label="Core" tone="neutral" />
              </div>
              <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-3">
                <NumberField label="Daily cap (UGX)" value={addDraft.limitDay} onChange={(v) => setAddDraft((p) => ({ ...p, limitDay: v }))} hint={formatUGX(addDraft.limitDay)} />
                <NumberField label="Weekly cap (UGX)" value={addDraft.limitWeek} onChange={(v) => setAddDraft((p) => ({ ...p, limitWeek: v }))} hint={formatUGX(addDraft.limitWeek)} />
                <NumberField label="Monthly cap (UGX)" value={addDraft.limitMonth} onChange={(v) => setAddDraft((p) => ({ ...p, limitMonth: v }))} hint={formatUGX(addDraft.limitMonth)} />
              </div>
              <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                Premium: limits can be suggested automatically based on peer usage.
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">Auto-approval eligibility</div>
                  <div className="mt-1 text-xs text-slate-500">Set by the admin creating this user.</div>
                </div>
                <Pill label="Core" tone="neutral" />
              </div>
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                <Toggle
                  enabled={addDraft.autoApproval}
                  onChange={(v) => setAddDraft((p) => ({ ...p, autoApproval: v }))}
                  label="Allow auto-approval"
                  description="If on, transactions under the threshold can auto-approve."
                />
                <NumberField
                  label="Auto-approve under (UGX)"
                  value={addDraft.autoApproveUnder}
                  onChange={(v) => setAddDraft((p) => ({ ...p, autoApproveUnder: v }))}
                  hint="Requires allow toggle"
                  disabled={!addDraft.autoApproval}
                />
              </div>
              <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                Best practice: auto-approval should be disabled for high-risk roles or high-value marketplaces.
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="text-sm font-semibold text-slate-900">Invite</div>
              <div className="mt-2 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700">
                Create as:
                <ul className="mt-2 space-y-1 text-xs text-slate-600">
                  <li>1) Invited (recommended) or</li>
                  <li>2) Active immediately (for admins)</li>
                </ul>
              </div>
              <Toggle
                enabled={addDraft.sendInviteNow}
                onChange={(v) => setAddDraft((p) => ({ ...p, sendInviteNow: v }))}
                label={addDraft.sendInviteNow ? "Send invite now" : "Activate immediately"}
                description="Invite acceptance happens on X3."
              />
              <div className="mt-3 text-xs text-slate-500">In production, invite delivery logs appear in Notifications Center.</div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="text-sm font-semibold text-slate-900">Audit preview</div>
              <pre className="mt-3 max-h-[260px] overflow-auto rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800">
                {JSON.stringify(
                  {
                    action: "Create user",
                    actor: "Org Admin",
                    role: addDraft.role,
                    group: addDraft.group,
                    costCenter: addDraft.costCenter,
                    limits: { daily: addDraft.limitDay, weekly: addDraft.limitWeek, monthly: addDraft.limitMonth },
                    autoApproval: addDraft.autoApproval ? { eligible: true, under: addDraft.autoApproveUnder } : { eligible: false },
                    status: addDraft.sendInviteNow ? "Invited" : "Active",
                  },
                  null,
                  2
                )}
              </pre>
              <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">This would be stored in the audit log (immutable in production).</div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Bulk import modal */}
      <Modal
        open={bulkOpen}
        title="Bulk import users"
        subtitle="Upload a CSV or paste contents. Users are created as Invited by default."
        onClose={() => setBulkOpen(false)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setBulkOpen(false)}>Close</Button>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={downloadTemplate}>
                <Download className="h-4 w-4" /> Download template
              </Button>
              <Button variant="primary" onClick={importUsers}>
                <ClipboardList className="h-4 w-4" /> Import
              </Button>
            </div>
          </div>
        }
        maxW="980px"
      >
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">CSV</div>
                  <div className="mt-1 text-xs text-slate-500">Header: name,email,phone,role,group,costCenter</div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => onBulkFile(e.target.files?.[0] || null)} />
                  <Button variant="outline" onClick={() => fileRef.current?.click()}>
                    <Plus className="h-4 w-4" /> Upload
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setBulkPreview(parseCSV(bulkText));
                      toast({ title: "Parsed", message: "Preview refreshed.", kind: "success" });
                    }}
                  >
                    <Check className="h-4 w-4" /> Parse
                  </Button>
                </div>
              </div>

              <textarea
                value={bulkText}
                onChange={(e) => { setBulkText(e.target.value); setBulkPreview(parseCSV(e.target.value)); }}
                rows={10}
                className="mt-3 w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-900 shadow-sm outline-none focus:ring-4 focus:ring-emerald-100"
              />
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="text-sm font-semibold text-slate-900">Preview</div>
              <div className="mt-1 text-xs text-slate-500">Showing up to 10 rows</div>
              <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs text-slate-600">
                    <tr>
                      {(bulkPreview.headers.length ? bulkPreview.headers : ["name", "email", "phone", "role", "group", "costCenter"]).map((h) => (
                        <th key={h} className="px-4 py-3 font-semibold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {bulkPreview.rows.slice(0, 10).map((r, idx) => (
                      <tr key={idx} className="border-t border-slate-100">
                        {(bulkPreview.headers.length ? bulkPreview.headers : ["name", "email", "phone", "role", "group", "costCenter"]).map((h) => (
                          <td key={h} className="px-4 py-3 text-slate-700">{r[h] || ""}</td>
                        ))}
                      </tr>
                    ))}
                    {!bulkPreview.rows.length ? (
                      <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-600">No rows parsed.</td></tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                Imported users are created as Invited by default. Admin can set initial limits later.
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="text-sm font-semibold text-slate-900">Bulk import rules</div>
              <ul className="mt-2 space-y-2 text-sm text-slate-700">
                <li className="flex items-start gap-2"><span className="mt-2 h-1.5 w-1.5 rounded-full" style={{ background: EVZ.green }} /> Max 50 users per import (demo)</li>
                <li className="flex items-start gap-2"><span className="mt-2 h-1.5 w-1.5 rounded-full" style={{ background: EVZ.orange }} /> Invalid roles default to User</li>
                <li className="flex items-start gap-2"><span className="mt-2 h-1.5 w-1.5 rounded-full" style={{ background: EVZ.green }} /> All actions are audit logged</li>
              </ul>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-amber-50 p-4">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-amber-800 ring-1 ring-amber-200">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">HRIS import (Phase 2)</div>
                  <div className="mt-1 text-sm text-slate-700">Workday/BambooHR/Microsoft Entra sync can be added later.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* HRIS modal */}
      <Modal
        open={hrisOpen}
        title="HRIS import"
        subtitle="Phase 2: sync users and groups from HRIS."
        onClose={() => setHrisOpen(false)}
        footer={<div className="flex justify-end"><Button variant="outline" onClick={() => setHrisOpen(false)}>Close</Button></div>}
        maxW="860px"
      >
        <div className="rounded-3xl border border-slate-200 bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-900">Connect HRIS</div>
              <div className="mt-1 text-xs text-slate-500">Planned: SSO + HRIS to provision users automatically.</div>
            </div>
            <Pill label="Phase 2" tone="info" />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <Button variant="outline" onClick={() => toast({ title: "Workday", message: "Connector coming in Phase 2.", kind: "info" })}>
              <Building2 className="h-4 w-4" /> Workday
            </Button>
            <Button variant="outline" onClick={() => toast({ title: "BambooHR", message: "Connector coming in Phase 2.", kind: "info" })}>
              <Building2 className="h-4 w-4" /> BambooHR
            </Button>
            <Button variant="outline" onClick={() => toast({ title: "Entra", message: "Connector coming in Phase 2.", kind: "info" })}>
              <Shield className="h-4 w-4" /> Microsoft Entra
            </Button>
            <Button variant="outline" onClick={() => toast({ title: "CSV sync", message: "Scheduled CSV sync (Phase 2).", kind: "info" })}>
              <FileText className="h-4 w-4" /> Scheduled CSV sync
            </Button>
          </div>
          <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
            Premium: HRIS rules can auto-assign group, role, and default limits (see X3 JIT provisioning).
          </div>
        </div>
      </Modal>

      {/* User detail drawer */}
      <Drawer
        open={!!selected}
        title={selected ? selected.name : ""}
        subtitle={selected ? `${selected.email} • ${selected.id}` : ""}
        onClose={() => { setSelected(null); setOffboardOpen(false); }}
        footer={
          selected ? (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs text-slate-600">Status: {selected.status} • Group: {selected.group}</div>
              <div className="flex flex-wrap items-center gap-2">
                {selected.status === "Invited" ? (
                  <Button variant="outline" onClick={() => resendInvite(selected)}>
                    <Mail className="h-4 w-4" /> Resend invite
                  </Button>
                ) : null}
                {selected.status === "Active" ? (
                  <Button variant="outline" onClick={() => suspendUser(selected)}>
                    <Shield className="h-4 w-4" /> Suspend
                  </Button>
                ) : null}
                {selected.status === "Suspended" ? (
                  <Button variant="outline" onClick={() => reactivateUser(selected)}>
                    <Check className="h-4 w-4" /> Reactivate
                  </Button>
                ) : null}
                {selected.status !== "Offboarded" ? (
                  <Button variant="danger" onClick={() => openOffboard(selected)}>
                    <Trash2 className="h-4 w-4" /> Offboard
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null
        }
      >
        {selected ? (
          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">Overview</div>
                  <div className="mt-1 text-xs text-slate-500">User settings and risk</div>
                </div>
                {selectedRisk ? <Pill label={`Risk: ${selectedRisk.label} (${selectedRisk.score})`} tone={selectedRisk.tone} /> : null}
              </div>
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                <InfoRow label="Role" value={selected.role} />
                <InfoRow label="Group" value={selected.group} />
                <InfoRow label="Cost center" value={selected.costCenter} />
                <InfoRow label="Last active" value={selected.lastActiveAt ? `${formatDateTime(selected.lastActiveAt)} (${timeAgo(selected.lastActiveAt)})` : "-"} />
              </div>
              <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700">
                Spend month-to-date: <span className="font-semibold text-slate-900">{formatUGX(selected.spendMonth)}</span> / {formatUGX(selected.limitMonth)}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="text-sm font-semibold text-slate-900">Limits</div>
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                <NumberField
                  label="Daily cap"
                  value={selected.limitDay}
                  onChange={(v) => {
                    setUsers((p) => p.map((u) => (u.id === selected.id ? { ...u, limitDay: v } : u)));
                    setSelected((p) => (p ? { ...p, limitDay: v } : null));
                  }}
                  hint={formatUGX(selected.limitDay)}
                  disabled={selected.status === "Offboarded"}
                />
                <NumberField
                  label="Weekly cap"
                  value={selected.limitWeek}
                  onChange={(v) => {
                    setUsers((p) => p.map((u) => (u.id === selected.id ? { ...u, limitWeek: v } : u)));
                    setSelected((p) => (p ? { ...p, limitWeek: v } : null));
                  }}
                  hint={formatUGX(selected.limitWeek)}
                  disabled={selected.status === "Offboarded"}
                />
                <NumberField
                  label="Monthly cap"
                  value={selected.limitMonth}
                  onChange={(v) => {
                    setUsers((p) => p.map((u) => (u.id === selected.id ? { ...u, limitMonth: v } : u)));
                    setSelected((p) => (p ? { ...p, limitMonth: v } : null));
                  }}
                  hint={formatUGX(selected.limitMonth)}
                  disabled={selected.status === "Offboarded"}
                />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    addAudit(selected.id, { actor: "Org Admin", action: "Limits updated", detail: "Updated spend limits" });
                    toast({ title: "Saved", message: "Limits saved (demo).", kind: "success" });
                  }}
                >
                  <Save className="h-4 w-4" /> Save limits
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const s = suggestionForLimits(selected);
                    if (!s.suggestedLimit) {
                      toast({ title: "No suggestion", message: "No limit change recommended.", kind: "info" });
                      return;
                    }
                    setUsers((p) => p.map((u) => (u.id === selected.id ? { ...u, limitMonth: s.suggestedLimit } : u)));
                    setSelected((p) => (p ? { ...p, limitMonth: s.suggestedLimit } : null));
                    addAudit(selected.id, { actor: "System", action: "Suggestion applied", detail: `Monthly cap set to ${formatUGX(s.suggestedLimit)}` });
                    toast({ title: "Applied", message: "Suggestion applied.", kind: "success" });
                  }}
                >
                  <Sparkles className="h-4 w-4" /> Apply suggestion
                </Button>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">Auto-approval</div>
                  <div className="mt-1 text-xs text-slate-500">Set by admin. Use carefully.</div>
                </div>
                <Pill label={selected.autoApproval ? "Enabled" : "Off"} tone={selected.autoApproval ? "info" : "neutral"} />
              </div>
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                <Toggle
                  enabled={!!selected.autoApproval}
                  onChange={(v) => {
                    setUsers((p) => p.map((u) => (u.id === selected.id ? { ...u, autoApproval: v, autoApproveUnder: v ? u.autoApproveUnder : 0 } : u)));
                    setSelected((p) => (p ? { ...p, autoApproval: v, autoApproveUnder: v ? p.autoApproveUnder : 0 } : null));
                  }}
                  label="Allow auto-approval"
                  description="Auto-approve under threshold"
                  disabled={selected.status === "Offboarded"}
                />
                <NumberField
                  label="Auto-approve under"
                  value={selected.autoApproveUnder}
                  onChange={(v) => {
                    setUsers((p) => p.map((u) => (u.id === selected.id ? { ...u, autoApproveUnder: v } : u)));
                    setSelected((p) => (p ? { ...p, autoApproveUnder: v } : null));
                  }}
                  hint={formatUGX(selected.autoApproveUnder)}
                  disabled={!selected.autoApproval || selected.status === "Offboarded"}
                />
              </div>
              <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                Auto-approval should be disabled for high-risk users or when anomalies occur.
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="text-sm font-semibold text-slate-900">Audit log</div>
              <div className="mt-1 text-xs text-slate-500">All changes are recorded (immutable in production).</div>
              <div className="mt-3 space-y-2">
                {(selected.audit || []).slice(0, 10).map((a, idx) => (
                  <div key={idx} className="rounded-2xl border border-slate-200 bg-white p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{a.action}</div>
                        <div className="mt-1 text-xs text-slate-500">{a.actor} • {formatDateTime(a.ts)}</div>
                        <div className="mt-1 text-xs text-slate-700">{a.detail}</div>
                      </div>
                      <Pill label={timeAgo(a.ts)} tone="neutral" />
                    </div>
                  </div>
                ))}
                {!selected.audit?.length ? <div className="text-sm text-slate-600">No audit entries.</div> : null}
              </div>
            </div>
          </div>
        ) : null}
      </Drawer>

      {/* Offboard modal */}
      <Modal
        open={offboardOpen}
        title="Offboard user"
        subtitle="Revokes CorporatePay instantly and preserves audit history."
        onClose={() => setOffboardOpen(false)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setOffboardOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={confirmOffboard}>
              <Trash2 className="h-4 w-4" /> Confirm offboard
            </Button>
          </div>
        }
        maxW="860px"
      >
        <div className="space-y-4">
          <div className="rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
            Offboarding immediately blocks CorporatePay at checkout for this user.
          </div>
          <Toggle
            enabled={offboardRevokeNow}
            onChange={setOffboardRevokeNow}
            label="Revoke CorporatePay immediately"
            description="Recommended"
          />
          <TextArea
            label="Reason"
            value={offboardReason}
            onChange={setOffboardReason}
            placeholder="Example: employee left the company; access revoked"
            rows={4}
            hint="Minimum 8 characters"
          />
          <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
            Audit logs remain visible to admins. Offboarded users can be reinstated by re-inviting.
          </div>
        </div>
      </Modal>

      {/* Delegation modal */}
      <Modal
        open={delegateOpen}
        title="Set approver delegation"
        subtitle="Route approvals to a delegate when the approver is inactive."
        onClose={() => setDelegateOpen(false)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setDelegateOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={confirmDelegation}>
              <BadgeCheck className="h-4 w-4" /> Save delegation
            </Button>
          </div>
        }
        maxW="920px"
      >
        <div className="space-y-4">
          {delegateFrom ? (
            <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-700">
              Approver: <span className="font-semibold text-slate-900">{delegateFrom.name}</span> • {delegateFrom.id}
            </div>
          ) : null}

          <Select
            label="Delegate to"
            value={delegateTo}
            onChange={setDelegateTo}
            options={["Finance Desk", "Org Admin", "Procurement Desk"].map((x) => ({ value: x, label: x }))}
          />
          <Field label="Delegation until" value={delegateUntil} onChange={setDelegateUntil} placeholder="YYYY-MM-DD" hint="Date" />
          <TextArea label="Reason" value={delegateReason} onChange={setDelegateReason} placeholder="Reason" rows={3} />

          <div className="rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
            Premium: delegation rules integrate with Approval Workflow Builder (J) and Approvals Inbox (K).
          </div>
        </div>
      </Modal>

      <footer className="border-t border-slate-200 bg-white/60 py-6">
        <div className="mx-auto max-w-[1400px] px-4 text-xs text-slate-500 md:px-6">
          F Users & Invitations v2: users list, add user, bulk import, HRIS placeholder, offboarding workflow, risk scoring, top spenders insights, and delegation prompts.
        </div>
      </footer>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3">
      <div className="text-xs font-semibold text-slate-600">{label}</div>
      <div className="mt-1 text-sm font-semibold text-slate-900">{value}</div>
    </div>
  );
}
