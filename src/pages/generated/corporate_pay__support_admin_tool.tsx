import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import {
  AlertTriangle,
  BadgeCheck,
  Bell,
  Check,
  ChevronRight,
  Copy,
  Download,
  FileText,
  Fingerprint,
  Headphones,
  Info,
  LifeBuoy,
  Link as LinkIcon,
  Lock,
  Mail,
  MessageSquare,
  Plus,
  Search,
  Settings2,
  Shield,
  ShieldCheck,
  Siren,
  Sparkles,
  Timer,
  User,
  Users,
  Video,
  Wrench,
  X,
} from "lucide-react";

const EVZ = {
  green: "#03CD8C",
  orange: "#F77F00",
  grey: "#A6A6A6",
  light: "#F2F2F2",
};

type ActorRole = "Org Admin" | "Finance" | "Approver" | "Employee" | "EVzone Support";

type Severity = "Info" | "Warning" | "Critical";

type ServiceModule =
  | "E-Commerce"
  | "EVs & Charging"
  | "Rides & Logistics"
  | "School & E-Learning"
  | "Medical & Health Care"
  | "Travel & Tourism"
  | "Green Investments"
  | "FaithHub"
  | "Virtual Workspace"
  | "Finance & Payments"
  | "Other Service Module";

type Marketplace =
  | "MyLiveDealz"
  | "ServiceMart"
  | "EVmart"
  | "GadgetMart"
  | "LivingMart"
  | "StyleMart"
  | "EduMart"
  | "HealthMart"
  | "PropertyMart"
  | "GeneratMart"
  | "ExpressMart"
  | "FaithMart"
  | "Other Marketplace";

type CasePriority = "Low" | "Medium" | "High" | "Critical";

type CaseStatus = "New" | "Open" | "Waiting on Customer" | "In Progress" | "Resolved" | "Closed";

type SupportCase = {
  id: string;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
  requesterRole: ActorRole;
  title: string;
  description: string;
  module: ServiceModule | "Security" | "Billing" | "Integrations" | "Other";
  marketplace: Marketplace | "-";
  priority: CasePriority;
  status: CaseStatus;
  assignedTo?: string;
  tags: string[];
  attachments: number;
  watchers: string[];
  timeline: Array<{ id: string; at: number; by: string; message: string; kind: "note" | "customer" | "support" | "system" }>;
};

type SessionMode = "View-only" | "Guided actions";

type SupportActionType = "Read-only check" | "Guided action" | "Evidence";

type SupportAction = {
  id: string;
  at: number;
  by: string;
  type: SupportActionType;
  label: string;
  outcome: "OK" | "Failed" | "Skipped";
  notes: string;
};

type SupportSession = {
  id: string;
  startedAt: number;
  endedAt?: number;
  startedBy: string; // support agent
  orgVisible: boolean;
  bannerEnabled: boolean;
  watermarkEnabled: boolean;
  mode: SessionMode;
  recordingEnabled: boolean;
  recordingApproved: boolean;
  relatedCaseId?: string;
  toolsScope: {
    readOnly: boolean;
    guidedActionsAllowed: boolean;
  };
  actions: SupportAction[];
};

type IncidentStatus = "Investigating" | "Identified" | "Monitoring" | "Resolved";

type IncidentSeverity = "Info" | "Degraded" | "Partial Outage" | "Major Outage";

type Incident = {
  id: string;
  createdAt: number;
  createdBy: string;
  title: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  message: string;
  modules: Array<ServiceModule | "Billing" | "Security" | "Integrations">;
  pinned: boolean;
  visibleToOrgAdmins: boolean;
  updates: Array<{ id: string; at: number; status: IncidentStatus; message: string; by: string }>;
};

type AuditEntry = {
  id: string;
  at: number;
  severity: Severity;
  actor: string;
  role: ActorRole;
  event: string;
  why: string;
  metadata: Record<string, any>;
};

type RecordingPolicy = {
  enabled: boolean;
  allowSupportToToggle: boolean;
  requireOrgApproval: boolean;
  storageDays: 7 | 14 | 30 | 90;
  noticeText: string;
};

type Toast = { id: string; title: string; message?: string; kind: "success" | "warn" | "error" | "info" };

type Tab = "cases" | "sessions" | "tools" | "incidents" | "audit";

type Tool = {
  id: string;
  label: string;
  module: ServiceModule | "Billing" | "Security" | "Integrations";
  kind: SupportActionType;
  risk: "Low" | "Medium" | "High";
  description: string;
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

function fmtDateTime(ts: number) {
  return new Date(ts).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function timeAgo(ts: number) {
  const d = Date.now() - ts;
  const m = Math.floor(d / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  return `${days}d ago`;
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

function toneForSeverity(sev: Severity) {
  if (sev === "Critical") return "bad" as const;
  if (sev === "Warning") return "warn" as const;
  return "info" as const;
}

function toneForPriority(p: CasePriority) {
  if (p === "Critical") return "bad" as const;
  if (p === "High") return "warn" as const;
  if (p === "Medium") return "info" as const;
  return "neutral" as const;
}

function toneForIncidentSeverity(s: IncidentSeverity) {
  if (s === "Major Outage") return "bad" as const;
  if (s === "Partial Outage") return "warn" as const;
  if (s === "Degraded") return "info" as const;
  return "neutral" as const;
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

function Toggle({ enabled, onChange, label, description }: { enabled: boolean; onChange: (v: boolean) => void; label: string; description?: string }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-4">
      <div>
        <div className="text-sm font-semibold text-slate-900">{label}</div>
        {description ? <div className="mt-1 text-xs text-slate-600">{description}</div> : null}
      </div>
      <button
        type="button"
        className={cn("relative h-7 w-12 rounded-full border transition", enabled ? "border-emerald-300 bg-emerald-200" : "border-slate-200 bg-white")}
        onClick={() => onChange(!enabled)}
        aria-label={label}
      >
        <span className={cn("absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition", enabled ? "left-[22px]" : "left-1")} />
      </button>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  hint,
  type = "text",
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <div className={cn(disabled && "opacity-70")}>
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-semibold text-slate-600">{label}</div>
        {hint ? <div className="text-xs text-slate-500">{hint}</div> : null}
      </div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "mt-2 w-full rounded-2xl border px-3 py-2.5 text-sm font-semibold outline-none focus:ring-4",
          disabled ? "border-slate-200 bg-slate-50 text-slate-500" : "border-slate-200 bg-white text-slate-900 focus:ring-emerald-100"
        )}
      />
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  hint,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
  hint?: string;
  disabled?: boolean;
}) {
  return (
    <div className={cn(disabled && "opacity-70")}>
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-semibold text-slate-600">{label}</div>
        {hint ? <div className="text-xs text-slate-500">{hint}</div> : null}
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
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

function TextArea({
  label,
  value,
  onChange,
  placeholder,
  hint,
  rows = 4,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  rows?: number;
  disabled?: boolean;
}) {
  return (
    <div className={cn(disabled && "opacity-70")}>
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-semibold text-slate-600">{label}</div>
        {hint ? <div className="text-xs text-slate-500">{hint}</div> : null}
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        className={cn(
          "mt-2 w-full rounded-2xl border p-3 text-sm font-semibold shadow-sm outline-none focus:ring-4",
          disabled ? "border-slate-200 bg-slate-50 text-slate-500" : "border-slate-200 bg-white text-slate-900 focus:ring-emerald-100"
        )}
      />
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
  maxW = "980px",
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onClose: () => void;
  footer?: React.ReactNode;
  maxW?: string;
}) {
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
            initial={{ opacity: 0, y: 12, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.985 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-x-0 top-[7vh] z-50 mx-auto w-[min(1040px,calc(100vw-2rem))] overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(2,8,23,0.22)]"
            style={{ maxWidth: maxW }}
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
            <div className="max-h-[72vh] overflow-auto px-5 py-4">{children}</div>
            {footer ? <div className="border-t border-slate-200 px-5 py-4">{footer}</div> : null}
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
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
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 18 }}
            transition={{ duration: 0.18 }}
            className={cn(
              "fixed z-50 overflow-hidden border border-slate-200 bg-white shadow-[0_30px_90px_rgba(2,8,23,0.22)]",
              "left-2 right-2 bottom-2 top-[10vh] rounded-[28px]",
              "lg:left-auto lg:right-4 lg:top-4 lg:bottom-4 lg:w-[760px]"
            )}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
              <div className="min-w-0">
                <div className="truncate text-base font-semibold text-slate-900">{title}</div>
                {subtitle ? <div className="mt-1 text-xs text-slate-600">{subtitle}</div> : null}
              </div>
              <button className="rounded-2xl p-2 text-slate-600 hover:bg-slate-100" onClick={onClose} aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="h-full min-h-0 overflow-auto px-5 py-4">{children}</div>
            {footer ? <div className="border-t border-slate-200 px-5 py-4">{footer}</div> : null}
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}

function ToastStack({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 w-[min(480px,calc(100vw-2rem))] space-y-2">
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

function Empty({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-700">
        <LifeBuoy className="h-6 w-6" />
      </div>
      <div className="mt-3 text-sm font-semibold text-slate-900">{title}</div>
      <div className="mt-1 text-sm text-slate-600">{subtitle}</div>
    </div>
  );
}

export default function CorporatePaySupportEVzoneAdminToolsV2() {
  const MODULES: Array<ServiceModule | "Billing" | "Security" | "Integrations" | "Other"> = [
    "Billing",
    "Security",
    "Integrations",
    "Rides & Logistics",
    "EVs & Charging",
    "E-Commerce",
    "Finance & Payments",
    "Travel & Tourism",
    "Other",
  ];

  const MARKETPLACES: Marketplace[] = [
    "MyLiveDealz",
    "ServiceMart",
    "EVmart",
    "GadgetMart",
    "LivingMart",
    "StyleMart",
    "EduMart",
    "HealthMart",
    "PropertyMart",
    "GeneratMart",
    "ExpressMart",
    "FaithMart",
    "Other Marketplace",
  ];

  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = (t: Omit<Toast, "id">) => {
    const id = uid("toast");
    setToasts((p) => [{ id, ...t }, ...p].slice(0, 4));
    window.setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 3200);
  };

  // Role switcher (embedded EVzone support role inside org console)
  const [viewAs, setViewAs] = useState<ActorRole>("Org Admin");

  const isOrgAdmin = viewAs === "Org Admin";
  const isSupport = viewAs === "EVzone Support";
  const canCreateIncidents = isOrgAdmin || isSupport;

  // Support configuration (org-controlled)
  const [supportEnabled, setSupportEnabled] = useState(true);
  const [supportWatermark, setSupportWatermark] = useState(true);

  const [recordingPolicy, setRecordingPolicy] = useState<RecordingPolicy>({
    enabled: true,
    allowSupportToToggle: false,
    requireOrgApproval: true,
    storageDays: 30,
    noticeText: "This support session may be recorded for security, QA, and incident review.",
  });

  // Cases
  const [cases, setCases] = useState<SupportCase[]>(() => {
    const now = Date.now();
    return [
      {
        id: "CASE-001",
        createdAt: now - 2 * 24 * 60 * 60 * 1000,
        updatedAt: now - 40 * 60 * 1000,
        createdBy: "Finance Desk",
        requesterRole: "Finance",
        title: "Invoice email delivery is delayed",
        description: "AP email did not receive weekly invoice. Need to confirm delivery logs and retry policy.",
        module: "Billing",
        marketplace: "-",
        priority: "High",
        status: "In Progress",
        assignedTo: "EVzone Support",
        tags: ["billing", "email", "weekly"],
        attachments: 1,
        watchers: ["Org Admin", "Finance Desk"],
        timeline: [
          { id: uid("T"), at: now - 2 * 24 * 60 * 60 * 1000, by: "Finance Desk", message: "Invoice not received", kind: "customer" },
          { id: uid("T"), at: now - 23 * 60 * 60 * 1000, by: "EVzone Support", message: "Investigating delivery logs and AP routing.", kind: "support" },
          { id: uid("T"), at: now - 40 * 60 * 1000, by: "System", message: "Webhook delivery retry observed (502).", kind: "system" },
        ],
      },
      {
        id: "CASE-002",
        createdAt: now - 6 * 60 * 60 * 1000,
        updatedAt: now - 55 * 60 * 1000,
        createdBy: "Org Admin",
        requesterRole: "Org Admin",
        title: "Need audit export for dispute",
        description: "Generate a forensic export for last 30 days for compliance review.",
        module: "Security",
        marketplace: "-",
        priority: "Medium",
        status: "Open",
        assignedTo: "EVzone Support",
        tags: ["audit", "forensic"],
        attachments: 0,
        watchers: ["Org Admin"],
        timeline: [
          { id: uid("T"), at: now - 6 * 60 * 60 * 1000, by: "Org Admin", message: "Please help generate forensic export", kind: "customer" },
          { id: uid("T"), at: now - 55 * 60 * 1000, by: "EVzone Support", message: "Ready to proceed. Require approval for production export.", kind: "support" },
        ],
      },
    ];
  });

  // Support sessions
  const [sessions, setSessions] = useState<SupportSession[]>(() => {
    const now = Date.now();
    return [
      {
        id: "SUP-SESSION-001",
        startedAt: now - 3 * 60 * 60 * 1000,
        startedBy: "EVzone Support",
        orgVisible: true,
        bannerEnabled: true,
        watermarkEnabled: true,
        mode: "View-only",
        recordingEnabled: false,
        recordingApproved: false,
        relatedCaseId: "CASE-001",
        toolsScope: { readOnly: true, guidedActionsAllowed: false },
        actions: [
          { id: uid("A"), at: now - 175 * 60 * 1000, by: "EVzone Support", type: "Read-only check", label: "Check invoice delivery logs", outcome: "OK", notes: "Email channel shows delayed queue." },
          { id: uid("A"), at: now - 155 * 60 * 1000, by: "EVzone Support", type: "Read-only check", label: "Verify invoice group routing", outcome: "OK", notes: "AP email matches invoice group." },
          { id: uid("A"), at: now - 45 * 60 * 1000, by: "EVzone Support", type: "Read-only check", label: "Inspect webhook deliveries", outcome: "Failed", notes: "502 from ERP endpoint, retrying." },
        ],
      },
    ];
  });

  // Incidents
  const [incidents, setIncidents] = useState<Incident[]>(() => {
    const now = Date.now();
    return [
      {
        id: "INC-001",
        createdAt: now - 10 * 60 * 60 * 1000,
        createdBy: "EVzone Support",
        title: "Webhook delivery delays (some orgs)",
        severity: "Degraded",
        status: "Monitoring",
        message: "Some webhook endpoints experiencing intermittent 5xx. Retries in progress.",
        modules: ["Integrations", "Billing"],
        pinned: true,
        visibleToOrgAdmins: true,
        updates: [
          { id: uid("U"), at: now - 10 * 60 * 60 * 1000, status: "Investigating", message: "We are investigating intermittent 5xx errors.", by: "EVzone Support" },
          { id: uid("U"), at: now - 7 * 60 * 60 * 1000, status: "Identified", message: "Issue identified on edge gateway. Rolling restart.", by: "EVzone Support" },
          { id: uid("U"), at: now - 2 * 60 * 60 * 1000, status: "Monitoring", message: "Recovery in progress; monitoring success rate.", by: "EVzone Support" },
        ],
      },
    ];
  });

  // Audit
  const [audit, setAudit] = useState<AuditEntry[]>(() => {
    const now = Date.now();
    return [
      { id: "AUD-001", at: now - 3 * 60 * 60 * 1000, severity: "Warning", actor: "EVzone Support", role: "EVzone Support", event: "Support session started", why: "Troubleshoot invoice delivery", metadata: { sessionId: "SUP-SESSION-001", caseId: "CASE-001" } },
      { id: "AUD-002", at: now - 2 * 60 * 60 * 1000, severity: "Info", actor: "Org Admin", role: "Org Admin", event: "Support mode verified", why: "Org admin visibility", metadata: { supportEnabled: true, watermark: true } },
    ];
  });

  // Tools
  const TOOLS: Tool[] = [
    {
      id: "tool_delivery_logs",
      label: "Inspect delivery logs",
      module: "Billing",
      kind: "Read-only check",
      risk: "Low",
      description: "Check invoice delivery status by channel (Email/WhatsApp/WeChat/SMS) and latest attempts.",
    },
    {
      id: "tool_invoice_group",
      label: "Validate invoice group routing",
      module: "Billing",
      kind: "Read-only check",
      risk: "Low",
      description: "Verify invoice group AP emails, CCs, frequency, and mapping for the selected entity.",
    },
    {
      id: "tool_webhook_inspector",
      label: "Webhook inspector",
      module: "Integrations",
      kind: "Read-only check",
      risk: "Medium",
      description: "Inspect a delivery payload, signature headers, status, and retry trace.",
    },
    {
      id: "tool_resend_invoice",
      label: "Resend invoice (guided)",
      module: "Billing",
      kind: "Guided action",
      risk: "High",
      description: "Guided action that requests approval, re-validates recipients, and then re-sends invoice.",
    },
    {
      id: "tool_rotate_key",
      label: "Rotate production API key (guided)",
      module: "Integrations",
      kind: "Guided action",
      risk: "High",
      description: "Guided rotation using dual-control approval with downtime warning.",
    },
    {
      id: "tool_forensic_export",
      label: "Generate forensic export",
      module: "Security",
      kind: "Guided action",
      risk: "High",
      description: "Creates a tamper-evident audit export (production requires approval).",
    },
  ];

  const [tab, setTab] = useState<Tab>("cases");
  const [q, setQ] = useState("");

  // Modal & drawer states
  const [caseModalOpen, setCaseModalOpen] = useState(false);
  const [caseDraft, setCaseDraft] = useState<Partial<SupportCase>>({
    title: "",
    description: "",
    module: "Billing",
    marketplace: "-",
    priority: "Medium",
    tags: [],
  });

  const [caseDrawerOpen, setCaseDrawerOpen] = useState(false);
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
  const activeCase = useMemo(() => (activeCaseId ? cases.find((c) => c.id === activeCaseId) || null : null), [cases, activeCaseId]);

  const [sessionDrawerOpen, setSessionDrawerOpen] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const activeSession = useMemo(() => (activeSessionId ? sessions.find((s) => s.id === activeSessionId) || null : null), [sessions, activeSessionId]);

  const [incidentModalOpen, setIncidentModalOpen] = useState(false);
  const [incidentDraft, setIncidentDraft] = useState<Partial<Incident>>({
    title: "",
    severity: "Info",
    status: "Investigating",
    message: "",
    modules: ["Billing"],
    pinned: false,
    visibleToOrgAdmins: true,
  });

  const [recordingRequestOpen, setRecordingRequestOpen] = useState(false);
  const [recordingReason, setRecordingReason] = useState("");

  // Derived
  const openCases = useMemo(() => cases.filter((c) => c.status !== "Closed").length, [cases]);
  const activeSessions = useMemo(() => sessions.filter((s) => !s.endedAt).length, [sessions]);
  const pinnedIncidents = useMemo(() => incidents.filter((i) => i.pinned && i.visibleToOrgAdmins).length, [incidents]);

  const filteredCases = useMemo(() => {
    const query = q.trim().toLowerCase();
    return cases
      .filter((c) => {
        if (!query) return true;
        const blob = `${c.id} ${c.title} ${c.description} ${c.module} ${c.marketplace} ${c.priority} ${c.status} ${c.tags.join(" ")}`.toLowerCase();
        return blob.includes(query);
      })
      .slice()
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [cases, q]);

  const filteredSessions = useMemo(() => {
    const query = q.trim().toLowerCase();
    return sessions
      .filter((s) => {
        if (!query) return true;
        const blob = `${s.id} ${s.startedBy} ${s.mode} ${s.relatedCaseId || ""}`.toLowerCase();
        return blob.includes(query);
      })
      .slice()
      .sort((a, b) => (b.endedAt || b.startedAt) - (a.endedAt || a.startedAt));
  }, [sessions, q]);

  const filteredIncidents = useMemo(() => {
    const query = q.trim().toLowerCase();
    return incidents
      .filter((i) => (isSupport || isOrgAdmin ? true : i.visibleToOrgAdmins))
      .filter((i) => {
        if (!query) return true;
        const blob = `${i.id} ${i.title} ${i.severity} ${i.status} ${i.message} ${i.modules.join(" ")}`.toLowerCase();
        return blob.includes(query);
      })
      .slice()
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [incidents, q, isSupport, isOrgAdmin]);

  const filteredAudit = useMemo(() => {
    const query = q.trim().toLowerCase();
    return audit
      .filter((a) => {
        if (!query) return true;
        const blob = `${a.id} ${a.actor} ${a.role} ${a.event} ${a.why} ${JSON.stringify(a.metadata)}`.toLowerCase();
        return blob.includes(query);
      })
      .slice()
      .sort((a, b) => b.at - a.at);
  }, [audit, q]);

  const filteredTools = useMemo(() => {
    const query = q.trim().toLowerCase();
    return TOOLS.filter((t) => {
      if (!query) return true;
      const blob = `${t.label} ${t.module} ${t.kind} ${t.risk} ${t.description}`.toLowerCase();
      return blob.includes(query);
    });
  }, [q]);

  // Audit helper
  const addAudit = (e: Omit<AuditEntry, "id" | "at"> & { at?: number }) => {
    const row: AuditEntry = { id: uid("AUD"), at: e.at ?? Date.now(), severity: e.severity, actor: e.actor, role: e.role, event: e.event, why: e.why, metadata: e.metadata };
    setAudit((p) => [row, ...p].slice(0, 600));
  };

  // Case actions
  const openNewCase = () => {
    setCaseDraft({ title: "", description: "", module: "Billing", marketplace: "-", priority: "Medium", tags: [] });
    setCaseModalOpen(true);
  };

  const saveCase = () => {
    const title = String(caseDraft.title || "").trim();
    const description = String(caseDraft.description || "").trim();
    if (title.length < 4 || description.length < 8) {
      toast({ title: "Missing", message: "Provide a title and description.", kind: "warn" });
      return;
    }

    const now = Date.now();
    const id = uid("CASE");
    const row: SupportCase = {
      id,
      createdAt: now,
      updatedAt: now,
      createdBy: isSupport ? "EVzone Support" : viewAs,
      requesterRole: viewAs,
      title,
      description,
      module: (caseDraft.module as any) || "Billing",
      marketplace: (caseDraft.marketplace as any) || "-",
      priority: (caseDraft.priority as any) || "Medium",
      status: "New",
      assignedTo: "EVzone Support",
      tags: Array.isArray(caseDraft.tags) ? (caseDraft.tags as string[]) : [],
      attachments: 0,
      watchers: ["Org Admin"],
      timeline: [{ id: uid("T"), at: now, by: viewAs, message: "Case created", kind: "system" }],
    };

    setCases((p) => [row, ...p]);

    addAudit({
      severity: "Info",
      actor: viewAs,
      role: viewAs,
      event: "Support case created",
      why: "Request support",
      metadata: { caseId: id, module: row.module, priority: row.priority },
    });

    toast({ title: "Created", message: `Case ${id} created.`, kind: "success" });
    setCaseModalOpen(false);
    setActiveCaseId(id);
    setCaseDrawerOpen(true);
  };

  const addCaseMessage = (caseId: string, message: string, kind: SupportCase["timeline"][number]["kind"]) => {
    const msg = message.trim();
    if (!msg) return;
    const now = Date.now();
    setCases((prev) =>
      prev.map((c) =>
        c.id === caseId
          ? { ...c, updatedAt: now, timeline: [...c.timeline, { id: uid("T"), at: now, by: viewAs, message: msg, kind }], status: c.status === "New" ? "Open" : c.status }
          : c
      )
    );

    addAudit({
      severity: "Info",
      actor: viewAs,
      role: viewAs,
      event: "Case message added",
      why: "Case collaboration",
      metadata: { caseId, kind },
    });
  };

  // Support sessions
  const startSession = (caseId?: string) => {
    if (!supportEnabled) {
      toast({ title: "Blocked", message: "Support mode is disabled by the organization.", kind: "warn" });
      return;
    }

    if (!isSupport) {
      toast({ title: "Support role required", message: "Switch to EVzone Support to start a session.", kind: "info" });
      return;
    }

    const now = Date.now();
    const s: SupportSession = {
      id: uid("SUP"),
      startedAt: now,
      startedBy: "EVzone Support",
      orgVisible: true,
      bannerEnabled: true,
      watermarkEnabled: supportWatermark,
      mode: "View-only",
      recordingEnabled: false,
      recordingApproved: !recordingPolicy.requireOrgApproval,
      relatedCaseId: caseId,
      toolsScope: { readOnly: true, guidedActionsAllowed: false },
      actions: [],
    };

    setSessions((p) => [s, ...p]);

    addAudit({
      severity: "Warning",
      actor: "EVzone Support",
      role: "EVzone Support",
      event: "Support session started",
      why: "Troubleshooting",
      metadata: { sessionId: s.id, caseId: caseId || null, mode: s.mode },
    });

    toast({ title: "Session started", message: `Session ${s.id} started.`, kind: "success" });
    setActiveSessionId(s.id);
    setSessionDrawerOpen(true);
  };

  const endSession = (sessionId: string) => {
    const now = Date.now();
    setSessions((p) => p.map((s) => (s.id === sessionId ? { ...s, endedAt: now } : s)));

    addAudit({
      severity: "Info",
      actor: viewAs,
      role: viewAs,
      event: "Support session ended",
      why: "Session closed",
      metadata: { sessionId },
    });

    toast({ title: "Ended", message: "Session ended.", kind: "info" });
  };

  const runTool = (tool: Tool) => {
    // Requires support session in focus
    const s = activeSession;
    if (!s || s.endedAt) {
      toast({ title: "No active session", message: "Open an active support session first.", kind: "warn" });
      return;
    }

    // Scope checks
    const isReadOnly = tool.kind === "Read-only check";
    if (isReadOnly && !s.toolsScope.readOnly) {
      toast({ title: "Blocked", message: "Read-only tools are disabled for this session.", kind: "warn" });
      return;
    }

    if (tool.kind === "Guided action" && !s.toolsScope.guidedActionsAllowed) {
      toast({ title: "Approval required", message: "Guided actions are not enabled. Request approval.", kind: "warn" });
      return;
    }

    // Simulate outcome
    const okChance = tool.risk === "High" ? 0.75 : tool.risk === "Medium" ? 0.85 : 0.92;
    const ok = Math.random() < okChance;
    const outcome: SupportAction["outcome"] = ok ? "OK" : "Failed";

    const now = Date.now();
    const action: SupportAction = {
      id: uid("ACT"),
      at: now,
      by: viewAs,
      type: tool.kind,
      label: tool.label,
      outcome,
      notes:
        tool.kind === "Read-only check"
          ? ok
            ? "Check completed. No write actions performed."
            : "Check failed. Review integrations and retry."
          : ok
            ? "Guided action completed with guardrails."
            : "Guided action failed. Requires manual review.",
    };

    setSessions((prev) => prev.map((x) => (x.id === s.id ? { ...x, actions: [...x.actions, action] } : x)));

    addAudit({
      severity: tool.kind === "Guided action" && tool.risk === "High" ? "Warning" : "Info",
      actor: viewAs,
      role: viewAs,
      event: "Support tool executed",
      why: tool.kind === "Read-only check" ? "Troubleshooting" : "Guided remediation",
      metadata: { sessionId: s.id, tool: tool.id, outcome },
    });

    toast({ title: ok ? "Done" : "Failed", message: `${tool.label}: ${outcome}.`, kind: ok ? "success" : "warn" });
  };

  const requestGuidedActionsApproval = (sessionId: string) => {
    // This is the premium bridge: enable guided actions after org admin approves
    const now = Date.now();
    setSessions((prev) => prev.map((s) => (s.id === sessionId ? { ...s, mode: "Guided actions" } : s)));

    addAudit({
      severity: "Warning",
      actor: viewAs,
      role: viewAs,
      event: "Guided actions requested",
      why: "Support remediation request",
      metadata: { sessionId, requestedBy: viewAs },
    });

    toast({ title: "Requested", message: "Guided actions request created (demo).", kind: "info" });
  };

  const approveGuidedActions = (sessionId: string) => {
    if (!isOrgAdmin) {
      toast({ title: "Org Admin required", message: "Only Org Admin can approve guided actions.", kind: "warn" });
      return;
    }

    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId
          ? {
            ...s,
            toolsScope: { ...s.toolsScope, guidedActionsAllowed: true },
            mode: "Guided actions",
          }
          : s
      )
    );

    addAudit({ severity: "Info", actor: viewAs, role: viewAs, event: "Guided actions approved", why: "Enable remediation", metadata: { sessionId } });
    toast({ title: "Approved", message: "Guided actions enabled for this session.", kind: "success" });
  };

  // Recording
  const requestRecordingToggle = () => {
    if (!activeSession || activeSession.endedAt) {
      toast({ title: "No active session", message: "Open an active session first.", kind: "warn" });
      return;
    }
    setRecordingReason("");
    setRecordingRequestOpen(true);
  };

  const confirmRecordingToggle = () => {
    if (!activeSession) return;
    const s = activeSession;

    if (!recordingPolicy.enabled) {
      toast({ title: "Disabled", message: "Recording is disabled by policy.", kind: "warn" });
      setRecordingRequestOpen(false);
      return;
    }

    // Policy enforcement
    if (isSupport && !recordingPolicy.allowSupportToToggle) {
      toast({ title: "Blocked", message: "Support cannot toggle recording. Org Admin must approve.", kind: "warn" });
      setRecordingRequestOpen(false);
      return;
    }

    if (recordingPolicy.requireOrgApproval && !isOrgAdmin) {
      toast({ title: "Approval required", message: "Recording toggle requires Org Admin approval.", kind: "warn" });
      setRecordingRequestOpen(false);
      return;
    }

    if (recordingReason.trim().length < 8) {
      toast({ title: "Reason required", message: "Provide a clear reason.", kind: "warn" });
      return;
    }

    const next = !s.recordingEnabled;

    setSessions((prev) => prev.map((x) => (x.id === s.id ? { ...x, recordingEnabled: next, recordingApproved: true } : x)));

    addAudit({
      severity: "Warning",
      actor: viewAs,
      role: viewAs,
      event: next ? "Session recording enabled" : "Session recording disabled",
      why: "Policy-controlled recording toggle",
      metadata: { sessionId: s.id, reason: recordingReason.trim(), storageDays: recordingPolicy.storageDays },
    });

    toast({ title: "Updated", message: next ? "Recording enabled." : "Recording disabled.", kind: "success" });
    setRecordingRequestOpen(false);
  };

  // Incidents
  const openNewIncident = () => {
    setIncidentDraft({ title: "", severity: "Info", status: "Investigating", message: "", modules: ["Billing"], pinned: false, visibleToOrgAdmins: true });
    setIncidentModalOpen(true);
  };

  const saveIncident = () => {
    if (!canCreateIncidents) {
      toast({ title: "Blocked", message: "You cannot create incident messages.", kind: "warn" });
      return;
    }

    const title = String(incidentDraft.title || "").trim();
    const message = String(incidentDraft.message || "").trim();
    if (title.length < 4 || message.length < 8) {
      toast({ title: "Missing", message: "Provide a title and message.", kind: "warn" });
      return;
    }

    const now = Date.now();
    const inc: Incident = {
      id: uid("INC"),
      createdAt: now,
      createdBy: viewAs,
      title,
      severity: (incidentDraft.severity as IncidentSeverity) || "Info",
      status: (incidentDraft.status as IncidentStatus) || "Investigating",
      message,
      modules: (incidentDraft.modules as any) || ["Billing"],
      pinned: !!incidentDraft.pinned,
      visibleToOrgAdmins: incidentDraft.visibleToOrgAdmins !== false,
      updates: [{ id: uid("U"), at: now, status: (incidentDraft.status as IncidentStatus) || "Investigating", message, by: viewAs }],
    };

    setIncidents((p) => [inc, ...p]);
    addAudit({ severity: "Warning", actor: viewAs, role: viewAs, event: "Incident message created", why: "Org status update", metadata: { incidentId: inc.id, severity: inc.severity, status: inc.status } });
    toast({ title: "Published", message: `Incident ${inc.id} published.`, kind: "success" });
    setIncidentModalOpen(false);
  };

  const exportCasesJSON = () => {
    const payload = { exportedAt: new Date().toISOString(), cases, sessions, incidents, audit };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "corporatepay-support-tools.json";
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported", message: "Downloaded JSON.", kind: "success" });
  };

  // Banner and watermark logic
  const activeSupportBanner = useMemo(() => {
    if (!activeSession || activeSession.endedAt) return null;
    if (!activeSession.bannerEnabled) return null;
    return {
      text: `Support session active (${activeSession.id}). Mode: ${activeSession.mode}.`,
      watermark: supportWatermark && activeSession.watermarkEnabled,
      recording: activeSession.recordingEnabled,
    };
  }, [activeSession, supportWatermark]);

  // Prevent support from silently toggling org settings
  const setSupportEnabledSafe = (v: boolean) => {
    if (!isOrgAdmin) {
      toast({ title: "Org Admin required", message: "Only Org Admin can change support enablement.", kind: "warn" });
      return;
    }
    setSupportEnabled(v);
    addAudit({ severity: "Warning", actor: viewAs, role: viewAs, event: v ? "Support mode enabled" : "Support mode disabled", why: "Org policy change", metadata: { supportEnabled: v } });
    toast({ title: "Updated", message: v ? "Support enabled." : "Support disabled.", kind: "success" });
  };

  const setRecordingPolicySafe = (updater: (p: RecordingPolicy) => RecordingPolicy) => {
    if (!isOrgAdmin) {
      toast({ title: "Org Admin required", message: "Only Org Admin can change recording policy.", kind: "warn" });
      return;
    }
    setRecordingPolicy((p) => {
      const next = updater(p);
      addAudit({ severity: "Warning", actor: viewAs, role: viewAs, event: "Recording policy updated", why: "Policy change", metadata: next });
      return next;
    });
    toast({ title: "Saved", message: "Recording policy updated.", kind: "success" });
  };

  return (
    <div className="min-h-screen" style={{ background: "radial-gradient(90% 60% at 50% 0%, rgba(3,205,140,0.18), rgba(255,255,255,0))" }}>
      <ToastStack toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((x) => x.id !== id))} />

      {/* Banner and watermark */}
      {activeSupportBanner ? (
        <div className="sticky top-0 z-30 border-b border-emerald-200 bg-emerald-50 px-4 py-2">
          <div className="mx-auto flex max-w-[1400px] flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-900">
              <Shield className="h-4 w-4" />
              {activeSupportBanner.text}
              {activeSupportBanner.recording ? <Pill label="Recording" tone="warn" /> : <Pill label="Not recording" tone="neutral" />}
              {activeCase ? <Pill label={`Case ${activeCase.id}`} tone="info" /> : null}
            </div>
            <div className="text-xs text-emerald-900">
              Visible to org admins. No silent actions.
            </div>
          </div>
          {activeSupportBanner.watermark ? (
            <div className="pointer-events-none fixed inset-0 z-10 grid place-items-center opacity-[0.06]">
              <div className="rotate-[-18deg] text-[44px] font-black tracking-tight text-slate-900">SUPPORT SESSION</div>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-6">
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(2,8,23,0.12)]">
          {/* Header */}
          <div className="border-b border-slate-200 bg-white px-4 py-4 md:px-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl text-white" style={{ background: EVZ.green }}>
                  <Headphones className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">Support and EVzone Admin Tools</div>
                  <div className="mt-1 text-xs text-slate-500">Embedded EVzone support inside the org console with auditable sessions, case tracking, scoped tools, and incident messaging.</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Pill label={`Cases: ${openCases}`} tone={openCases ? "info" : "neutral"} />
                    <Pill label={`Sessions: ${activeSessions}`} tone={activeSessions ? "warn" : "neutral"} />
                    <Pill label={`Pinned incidents: ${pinnedIncidents}`} tone={pinnedIncidents ? "warn" : "neutral"} />
                    <Pill label={`Support mode: ${supportEnabled ? "On" : "Off"}`} tone={supportEnabled ? "good" : "warn"} />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="min-w-[220px]">
                  <Select
                    label="View as"
                    value={viewAs}
                    onChange={(v) => setViewAs(v as ActorRole)}
                    options={[
                      { value: "Org Admin", label: "Org Admin" },
                      { value: "Finance", label: "Finance" },
                      { value: "Approver", label: "Approver" },
                      { value: "Employee", label: "Employee" },
                      { value: "EVzone Support", label: "EVzone Support" },
                    ]}
                    hint="Role gated"
                  />
                </div>
                <Button variant="outline" onClick={exportCasesJSON}>
                  <Download className="h-4 w-4" /> Export JSON
                </Button>
                <Button variant="primary" onClick={openNewCase}>
                  <Plus className="h-4 w-4" /> Request support
                </Button>
              </div>
            </div>

            {/* Tabs */}
            <div className="mt-4 flex flex-wrap gap-2">
              {(
                [
                  { id: "cases", label: "Cases" },
                  { id: "sessions", label: "Sessions" },
                  { id: "tools", label: "Troubleshooting tools" },
                  { id: "incidents", label: "Incidents and status" },
                  { id: "audit", label: "Audit" },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-semibold ring-1 transition",
                    tab === t.id ? "text-white ring-emerald-600" : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
                  )}
                  style={tab === t.id ? { background: EVZ.green } : undefined}
                  onClick={() => setTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="mt-4 grid grid-cols-1 gap-3 rounded-3xl border border-slate-200 bg-white p-4 md:grid-cols-12">
              <div className="md:col-span-7">
                <div className="text-xs font-semibold text-slate-600">Search</div>
                <div className="mt-2 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5">
                  <Search className="h-4 w-4 text-slate-500" />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="case id, incident, session, tool..."
                    className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
                  />
                  {q ? (
                    <button className="rounded-xl p-1 text-slate-500 hover:bg-slate-100" onClick={() => setQ("")} aria-label="Clear">
                      <X className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              </div>
              <div className="md:col-span-5">
                <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-700 ring-1 ring-slate-200">
                  Support is embedded here as a role. For deeper policies see <span className="font-semibold">Z Security</span> and <span className="font-semibold">D Org Setup</span>.
                </div>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="bg-slate-50 px-4 py-5 md:px-6">
            {tab === "cases" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-8 space-y-4">
                  <Section
                    title="Support cases"
                    subtitle="Core: request support and track cases."
                    right={<Pill label={`${filteredCases.length}`} tone="neutral" />}
                  >
                    <div className="space-y-2">
                      {filteredCases.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          className="w-full rounded-3xl border border-slate-200 bg-white p-4 text-left hover:bg-slate-50"
                          onClick={() => {
                            setActiveCaseId(c.id);
                            setCaseDrawerOpen(true);
                          }}
                        >
                          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <Pill label={c.priority} tone={toneForPriority(c.priority)} />
                                <Pill label={c.status} tone={c.status === "Resolved" ? "good" : c.status === "In Progress" ? "info" : c.status === "New" ? "warn" : "neutral"} />
                                <Pill label={c.module} tone="neutral" />
                                {c.marketplace !== "-" ? <Pill label={c.marketplace} tone="neutral" /> : null}
                                <Pill label={c.id} tone="neutral" />
                              </div>
                              <div className="mt-2 text-sm font-semibold text-slate-900">{c.title}</div>
                              <div className="mt-1 text-xs text-slate-500">Created {timeAgo(c.createdAt)} by {c.createdBy} • Updated {timeAgo(c.updatedAt)}</div>
                              <div className="mt-2 text-xs text-slate-600 line-clamp-2">{c.description}</div>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {c.tags.slice(0, 4).map((t) => (
                                  <Pill key={`${c.id}-${t}`} label={t} tone="neutral" />
                                ))}
                                {c.tags.length > 4 ? <Pill label="+more" tone="neutral" /> : null}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Pill label={c.attachments ? `${c.attachments} attachment(s)` : "No attachments"} tone={c.attachments ? "info" : "neutral"} />
                              <ChevronRight className="h-5 w-5 text-slate-400" />
                            </div>
                          </div>
                        </button>
                      ))}
                      {!filteredCases.length ? <Empty title="No cases" subtitle="Create a support request to get help." /> : null}
                    </div>
                  </Section>
                </div>

                <div className="lg:col-span-4 space-y-4">
                  <Section title="Org admin controls" subtitle="Core: support enablement and visibility." right={<Pill label={isOrgAdmin ? "Editable" : "View"} tone={isOrgAdmin ? "info" : "neutral"} />}>
                    <Toggle
                      enabled={supportEnabled}
                      onChange={(v) => setSupportEnabledSafe(v)}
                      label="Support mode"
                      description="EVzone support can sign in when enabled"
                    />
                    <Toggle
                      enabled={supportWatermark}
                      onChange={(v) => {
                        if (!isOrgAdmin) {
                          toast({ title: "Org Admin required", message: "Only Org Admin can change watermark.", kind: "warn" });
                          return;
                        }
                        setSupportWatermark(v);
                        addAudit({ severity: "Warning", actor: viewAs, role: viewAs, event: "Support watermark updated", why: "Visibility control", metadata: { watermark: v } });
                        toast({ title: "Saved", message: "Watermark updated.", kind: "success" });
                      }}
                      label="Watermark"
                      description="Banner and watermark during sessions"
                    />
                    <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700 ring-1 ring-slate-200">
                      Safety: sessions are always visible and audited. Support cannot silently change settings.
                    </div>
                  </Section>

                  <Section title="Premium recording policy" subtitle="Session recording toggle (policy-controlled)." right={<Pill label="Premium" tone="info" />}>
                    <Toggle
                      enabled={recordingPolicy.enabled}
                      onChange={(v) => setRecordingPolicySafe((p) => ({ ...p, enabled: v }))}
                      label="Recording enabled"
                      description="Allow session recording"
                    />
                    <Toggle
                      enabled={recordingPolicy.requireOrgApproval}
                      onChange={(v) => setRecordingPolicySafe((p) => ({ ...p, requireOrgApproval: v }))}
                      label="Require org approval"
                      description="Recording toggles require Org Admin"
                    />
                    <Toggle
                      enabled={recordingPolicy.allowSupportToToggle}
                      onChange={(v) => setRecordingPolicySafe((p) => ({ ...p, allowSupportToToggle: v }))}
                      label="Allow support to toggle"
                      description="If off, only Org Admin can toggle"
                    />
                    <Select
                      label="Storage"
                      value={`${recordingPolicy.storageDays}`}
                      onChange={(v) => setRecordingPolicySafe((p) => ({ ...p, storageDays: Number(v) as any }))}
                      options={[{ value: "7", label: "7 days" }, { value: "14", label: "14 days" }, { value: "30", label: "30 days" }, { value: "90", label: "90 days" }]}
                    />
                    <TextArea
                      label="Notice text"
                      value={recordingPolicy.noticeText}
                      onChange={(v) => setRecordingPolicySafe((p) => ({ ...p, noticeText: v }))}
                      rows={3}
                    />
                  </Section>
                </div>
              </div>
            ) : null}

            {tab === "sessions" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-8 space-y-4">
                  <Section
                    title="Support sessions"
                    subtitle="Core: sessions are always auditable and visible (banner + watermark)."
                    right={
                      <div className="flex flex-wrap items-center gap-2">
                        <Button variant="outline" onClick={() => startSession(activeCaseId || undefined)} disabled={!supportEnabled || !isSupport}>
                          <Headphones className="h-4 w-4" /> Start session
                        </Button>
                        <Pill label={supportEnabled ? "Support enabled" : "Support disabled"} tone={supportEnabled ? "good" : "warn"} />
                      </div>
                    }
                  >
                    <div className="space-y-2">
                      {filteredSessions.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          className="w-full rounded-3xl border border-slate-200 bg-white p-4 text-left hover:bg-slate-50"
                          onClick={() => {
                            setActiveSessionId(s.id);
                            setSessionDrawerOpen(true);
                          }}
                        >
                          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <Pill label={s.endedAt ? "Ended" : "Active"} tone={s.endedAt ? "neutral" : "warn"} />
                                <Pill label={s.mode} tone={s.mode === "Guided actions" ? "info" : "neutral"} />
                                <Pill label={s.recordingEnabled ? "Recording" : "Not recording"} tone={s.recordingEnabled ? "warn" : "neutral"} />
                                <Pill label={s.toolsScope.guidedActionsAllowed ? "Guided allowed" : "Guided off"} tone={s.toolsScope.guidedActionsAllowed ? "info" : "neutral"} />
                                <Pill label={s.id} tone="neutral" />
                              </div>
                              <div className="mt-2 text-sm font-semibold text-slate-900">Support agent: {s.startedBy}</div>
                              <div className="mt-1 text-xs text-slate-500">Started {timeAgo(s.startedAt)}{s.endedAt ? ` • Ended ${timeAgo(s.endedAt)}` : ""}</div>
                              <div className="mt-2 text-xs text-slate-600">Case: {s.relatedCaseId || "-"} • Actions: {s.actions.length}</div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              {!s.endedAt ? (
                                <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => endSession(s.id)}>
                                  <X className="h-4 w-4" /> End
                                </Button>
                              ) : null}
                              <ChevronRight className="h-5 w-5 text-slate-400" />
                            </div>
                          </div>
                        </button>
                      ))}
                      {!filteredSessions.length ? <Empty title="No sessions" subtitle="Start a session from a case." /> : null}
                    </div>
                  </Section>
                </div>

                <div className="lg:col-span-4 space-y-4">
                  <Section title="Session actions" subtitle="Premium: recording and guided actions." right={<Pill label="Premium" tone="info" />}>
                    <div className="grid grid-cols-1 gap-2">
                      <Button variant="outline" onClick={requestRecordingToggle} disabled={!activeSession || !!activeSession.endedAt}>
                        <Video className="h-4 w-4" /> Toggle recording
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          if (!activeSession) {
                            toast({ title: "No session", message: "Select a session first.", kind: "warn" });
                            return;
                          }
                          requestGuidedActionsApproval(activeSession.id);
                        }}
                        disabled={!activeSession || !!activeSession.endedAt}
                      >
                        <Wrench className="h-4 w-4" /> Request guided actions
                      </Button>
                      <Button
                        variant="primary"
                        onClick={() => {
                          if (!activeSession) {
                            toast({ title: "No session", message: "Select a session first.", kind: "warn" });
                            return;
                          }
                          approveGuidedActions(activeSession.id);
                        }}
                        disabled={!activeSession || !!activeSession.endedAt || !isOrgAdmin}
                        title={!isOrgAdmin ? "Org Admin required" : "Approve"}
                      >
                        <BadgeCheck className="h-4 w-4" /> Approve guided actions
                      </Button>
                    </div>
                    <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                      Guided actions are scoped and guarded. All changes are auditable and visible.
                    </div>
                  </Section>

                  <Section title="Recording notice" subtitle="Policy controlled" right={<Pill label="Premium" tone="info" />}>
                    <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-700 ring-1 ring-slate-200">
                      {recordingPolicy.noticeText}
                      <div className="mt-2 text-xs text-slate-500">Storage: {recordingPolicy.storageDays} days • Org approval: {recordingPolicy.requireOrgApproval ? "Required" : "Not required"}</div>
                    </div>
                  </Section>
                </div>
              </div>
            ) : null}

            {tab === "tools" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-8 space-y-4">
                  <Section title="Scoped troubleshooting tools" subtitle="Premium: read-only and guided actions." right={<Pill label="Premium" tone="info" />}>
                    <div className="space-y-2">
                      {filteredTools.map((t) => (
                        <div key={t.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <Pill label={t.kind} tone={t.kind === "Guided action" ? "warn" : "good"} />
                                <Pill label={t.module} tone="neutral" />
                                <Pill label={`Risk ${t.risk}`} tone={t.risk === "High" ? "bad" : t.risk === "Medium" ? "warn" : "good"} />
                                <Pill label={t.id} tone="neutral" />
                              </div>
                              <div className="mt-2 text-sm font-semibold text-slate-900">{t.label}</div>
                              <div className="mt-1 text-sm text-slate-600">{t.description}</div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Button
                                variant={t.kind === "Guided action" ? "primary" : "outline"}
                                className="px-3 py-2 text-xs"
                                onClick={() => runTool(t)}
                                disabled={!activeSession || !!activeSession.endedAt}
                                title={!activeSession ? "Open a session first" : "Run"}
                              >
                                <Sparkles className="h-4 w-4" /> Run
                              </Button>
                              <Button
                                variant="outline"
                                className="px-3 py-2 text-xs"
                                onClick={() => {
                                  if (!activeSession) {
                                    toast({ title: "No session", message: "Select an active session first.", kind: "warn" });
                                    return;
                                  }
                                  setSessionDrawerOpen(true);
                                }}
                              >
                                <ChevronRight className="h-4 w-4" /> Session
                              </Button>
                            </div>
                          </div>
                          {t.kind === "Guided action" ? (
                            <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                              Guided actions require approval and will always show confirmations and audit logs.
                            </div>
                          ) : (
                            <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                              Read-only check. No data changes.
                            </div>
                          )}
                        </div>
                      ))}
                      {!filteredTools.length ? <Empty title="No tools" subtitle="No tools match your search." /> : null}
                    </div>
                  </Section>
                </div>

                <div className="lg:col-span-4 space-y-4">
                  <Section title="Active session" subtitle="Select a session to run tools." right={<Pill label={activeSession && !activeSession.endedAt ? "Active" : "None"} tone={activeSession && !activeSession.endedAt ? "warn" : "neutral"} />}>
                    {activeSession ? (
                      <div className="rounded-3xl border border-slate-200 bg-white p-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <Pill label={activeSession.id} tone="neutral" />
                          <Pill label={activeSession.mode} tone={activeSession.mode === "Guided actions" ? "info" : "neutral"} />
                          <Pill label={activeSession.toolsScope.guidedActionsAllowed ? "Guided allowed" : "Guided off"} tone={activeSession.toolsScope.guidedActionsAllowed ? "info" : "neutral"} />
                        </div>
                        <div className="mt-2 text-xs text-slate-600">Case: {activeSession.relatedCaseId || "-"}</div>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => setSessionDrawerOpen(true)}>
                            <ChevronRight className="h-4 w-4" /> Open session
                          </Button>
                          {!activeSession.endedAt ? (
                            <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => endSession(activeSession.id)}>
                              <X className="h-4 w-4" /> End
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
                        Select a session from Sessions tab.
                      </div>
                    )}
                  </Section>

                  <Section title="Policy reminder" subtitle="Support scope" right={<Pill label="Core" tone="neutral" />}>
                    <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-700 ring-1 ring-slate-200">
                      Support is embedded with role gating. Sessions are visible and audited.
                      <ul className="mt-2 space-y-1">
                        <li>1) View-only by default</li>
                        <li>2) Guided actions require approvals</li>
                        <li>3) Recording is policy-controlled</li>
                      </ul>
                    </div>
                  </Section>
                </div>
              </div>
            ) : null}

            {tab === "incidents" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-8 space-y-4">
                  <Section
                    title="Incident and status messaging"
                    subtitle="Premium: communicate incidents to org admins."
                    right={
                      <div className="flex flex-wrap items-center gap-2">
                        <Button variant="outline" onClick={openNewIncident} disabled={!canCreateIncidents} title={!canCreateIncidents ? "Not allowed" : "Create"}>
                          <Siren className="h-4 w-4" /> New status
                        </Button>
                        <Pill label={canCreateIncidents ? "Publisher" : "Viewer"} tone={canCreateIncidents ? "info" : "neutral"} />
                      </div>
                    }
                  >
                    <div className="space-y-2">
                      {filteredIncidents.map((i) => (
                        <div key={i.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <Pill label={i.severity} tone={toneForIncidentSeverity(i.severity)} />
                                <Pill label={i.status} tone={i.status === "Resolved" ? "good" : i.status === "Monitoring" ? "info" : "warn"} />
                                {i.pinned ? <Pill label="Pinned" tone="info" /> : null}
                                <Pill label={i.id} tone="neutral" />
                              </div>
                              <div className="mt-2 text-sm font-semibold text-slate-900">{i.title}</div>
                              <div className="mt-1 text-xs text-slate-500">Posted {timeAgo(i.createdAt)} by {i.createdBy}</div>
                              <div className="mt-2 text-sm text-slate-700">{i.message}</div>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {i.modules.map((m) => (
                                  <Pill key={`${i.id}-${m}`} label={m} tone="neutral" />
                                ))}
                              </div>
                            </div>
                            <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-700 ring-1 ring-slate-200">
                              <div className="font-semibold">Latest update</div>
                              <div className="mt-1">{i.updates[i.updates.length - 1]?.message}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {!filteredIncidents.length ? <Empty title="No incidents" subtitle="No active incidents to display." /> : null}
                    </div>
                  </Section>
                </div>

                <div className="lg:col-span-4 space-y-4">
                  <Section title="Org admin notice" subtitle="Status feed is for org admins" right={<Pill label="Premium" tone="info" />}>
                    <div className="rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                      Premium: incident messages can be routed to email and WhatsApp as well. Logs appear in Notifications Center (B).
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        toast({ title: "Scheduled", message: "Digest scheduling is handled in Reporting (V) and Notifications (B).", kind: "info" });
                      }}
                    >
                      <Bell className="h-4 w-4" /> Digest routing
                    </Button>
                  </Section>

                  <Section title="Visibility rules" subtitle="Who sees what" right={<Pill label="Core" tone="neutral" />}>
                    <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-700 ring-1 ring-slate-200">
                      <ul className="space-y-1">
                        <li>1) Org admins always see org incidents</li>
                        <li>2) Support can publish only if enabled</li>
                        <li>3) Actions remain auditable and visible</li>
                      </ul>
                    </div>
                  </Section>
                </div>
              </div>
            ) : null}

            {tab === "audit" ? (
              <div className="grid grid-cols-1 gap-4">
                <Section title="Audit" subtitle="Core: sessions are auditable and visible." right={<Pill label={`${filteredAudit.length}`} tone="neutral" />}>
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-slate-50 text-xs text-slate-600">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Time</th>
                          <th className="px-4 py-3 font-semibold">Severity</th>
                          <th className="px-4 py-3 font-semibold">Actor</th>
                          <th className="px-4 py-3 font-semibold">Event</th>
                          <th className="px-4 py-3 font-semibold">Why</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAudit.slice(0, 60).map((a) => (
                          <tr key={a.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                            <td className="px-4 py-3 text-slate-700">{fmtDateTime(a.at)}</td>
                            <td className="px-4 py-3"><Pill label={a.severity} tone={toneForSeverity(a.severity)} /></td>
                            <td className="px-4 py-3">
                              <div className="font-semibold text-slate-900">{a.actor}</div>
                              <div className="mt-1 text-xs text-slate-500">{a.role}</div>
                            </td>
                            <td className="px-4 py-3 text-slate-700">{a.event}</td>
                            <td className="px-4 py-3 text-slate-700">{a.why}</td>
                          </tr>
                        ))}
                        {!filteredAudit.length ? (
                          <tr>
                            <td colSpan={5} className="px-4 py-10"><Empty title="No audit entries" subtitle="Actions will appear here." /></td>
                          </tr>
                        ) : null}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Button variant="outline" onClick={exportCasesJSON}>
                      <Download className="h-4 w-4" /> Export bundle
                    </Button>
                    <Button
                      variant="outline"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(JSON.stringify({ audit: filteredAudit }, null, 2));
                          toast({ title: "Copied", message: "Audit JSON copied.", kind: "success" });
                        } catch {
                          toast({ title: "Copy failed", message: "Copy manually.", kind: "warn" });
                        }
                      }}
                    >
                      <Copy className="h-4 w-4" /> Copy JSON
                    </Button>
                  </div>
                </Section>
              </div>
            ) : null}
          </div>

          <footer className="border-t border-slate-200 bg-white/60 py-6">
            <div className="mx-auto max-w-[1400px] px-4 text-xs text-slate-500 md:px-6">
              AA Support and EVzone Admin Tools v2. Core: embedded EVzone support role, auditable sessions, request support, and case tracking. Premium: session recording policy, scoped troubleshooting tools, and incident/status messaging.
            </div>
          </footer>
        </div>
      </div>

      {/* Create case modal */}
      <Modal
        open={caseModalOpen}
        title="Request support"
        subtitle="Core: create a support case."
        onClose={() => setCaseModalOpen(false)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setCaseModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={saveCase}>
              <BadgeCheck className="h-4 w-4" /> Create case
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Title" value={String(caseDraft.title || "")} onChange={(v) => setCaseDraft((p) => ({ ...p, title: v }))} placeholder="Short summary" />
          <Select
            label="Module"
            value={String(caseDraft.module || "Billing")}
            onChange={(v) => setCaseDraft((p) => ({ ...p, module: v as any }))}
            options={MODULES.map((m) => ({ value: m, label: m }))}
          />
          <Select
            label="Marketplace"
            value={String(caseDraft.marketplace || "-")}
            onChange={(v) => setCaseDraft((p) => ({ ...p, marketplace: v as any }))}
            options={[{ value: "-", label: "-" }, ...MARKETPLACES.map((m) => ({ value: m, label: m }))]}
            disabled={caseDraft.module !== "E-Commerce"}
            hint={caseDraft.module !== "E-Commerce" ? "Only for E-Commerce" : undefined}
          />
          <Select
            label="Priority"
            value={String(caseDraft.priority || "Medium")}
            onChange={(v) => setCaseDraft((p) => ({ ...p, priority: v as any }))}
            options={[
              { value: "Low", label: "Low" },
              { value: "Medium", label: "Medium" },
              { value: "High", label: "High" },
              { value: "Critical", label: "Critical" },
            ]}
          />
          <div className="md:col-span-2">
            <TextArea
              label="Description"
              value={String(caseDraft.description || "")}
              onChange={(v) => setCaseDraft((p) => ({ ...p, description: v }))}
              placeholder="Describe the issue, impact, and expected outcome"
              rows={5}
            />
          </div>
          <div className="md:col-span-2 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700 ring-1 ring-slate-200">
            Attachments and evidence can be added in the case timeline (demo).
          </div>
        </div>
      </Modal>

      {/* Case drawer */}
      <Drawer
        open={caseDrawerOpen}
        title={activeCase ? `Case ${activeCase.id}` : "Case"}
        subtitle={activeCase ? `${activeCase.title} • ${activeCase.status}` : ""}
        onClose={() => setCaseDrawerOpen(false)}
        footer={
          activeCase ? (
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
              <div className="text-xs text-slate-600">Core: case tracking. Premium: start a session and use scoped tools.</div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={() => startSession(activeCase.id)} disabled={!isSupport || !supportEnabled}>
                  <Headphones className="h-4 w-4" /> Start session
                </Button>
                <Button variant="primary" onClick={() => setTab("sessions")}>
                  <ChevronRight className="h-4 w-4" /> Sessions
                </Button>
              </div>
            </div>
          ) : null
        }
      >
        {activeCase ? (
          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Pill label={activeCase.priority} tone={toneForPriority(activeCase.priority)} />
                <Pill label={activeCase.status} tone={activeCase.status === "Resolved" ? "good" : activeCase.status === "In Progress" ? "info" : "neutral"} />
                <Pill label={activeCase.module} tone="neutral" />
                {activeCase.marketplace !== "-" ? <Pill label={activeCase.marketplace} tone="neutral" /> : null}
                <Pill label={`Assigned: ${activeCase.assignedTo || "-"}`} tone="info" />
              </div>
              <div className="mt-2 text-sm font-semibold text-slate-900">{activeCase.title}</div>
              <div className="mt-1 text-sm text-slate-700">{activeCase.description}</div>
              <div className="mt-2 text-xs text-slate-500">Created {fmtDateTime(activeCase.createdAt)} • Updated {fmtDateTime(activeCase.updatedAt)}</div>
            </div>

            <Section title="Timeline" subtitle="Messages and system notes" right={<Pill label={`${activeCase.timeline.length}`} tone="neutral" />}>
              <div className="space-y-2">
                {activeCase.timeline.slice().sort((a, b) => a.at - b.at).map((t) => (
                  <div key={t.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Pill label={t.kind} tone={t.kind === "support" ? "info" : t.kind === "customer" ? "neutral" : "neutral"} />
                          <div className="text-sm font-semibold text-slate-900">{t.by}</div>
                          <div className="text-xs text-slate-500">{timeAgo(t.at)}</div>
                        </div>
                        <div className="mt-2 text-sm text-slate-700">{t.message}</div>
                      </div>
                      <button
                        className="rounded-2xl p-2 text-slate-500 hover:bg-slate-100"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(t.message);
                            toast({ title: "Copied", message: "Message copied.", kind: "success" });
                          } catch {
                            toast({ title: "Copy failed", message: "Copy manually.", kind: "warn" });
                          }
                        }}
                        aria-label="Copy"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 grid grid-cols-1 gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    const msg = prompt("Add a note to the case");
                    if (!msg) return;
                    addCaseMessage(activeCase.id, msg, isSupport ? "support" : "customer");
                    toast({ title: "Added", message: "Timeline updated.", kind: "success" });
                  }}
                >
                  <MessageSquare className="h-4 w-4" /> Add message
                </Button>
              </div>
            </Section>
          </div>
        ) : null}
      </Drawer>

      {/* Session drawer */}
      <Drawer
        open={sessionDrawerOpen}
        title={activeSession ? `Session ${activeSession.id}` : "Session"}
        subtitle={activeSession ? `${activeSession.mode} • ${activeSession.endedAt ? "Ended" : "Active"}` : ""}
        onClose={() => setSessionDrawerOpen(false)}
        footer={
          activeSession ? (
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
              <div className="text-xs text-slate-600">Premium: scoped tools and recording policy controlled.</div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={requestRecordingToggle} disabled={!!activeSession.endedAt}>
                  <Video className="h-4 w-4" /> Recording
                </Button>
                {!activeSession.endedAt ? (
                  <Button variant="outline" onClick={() => endSession(activeSession.id)}>
                    <X className="h-4 w-4" /> End
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null
        }
      >
        {activeSession ? (
          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Pill label={activeSession.mode} tone={activeSession.mode === "Guided actions" ? "info" : "neutral"} />
                <Pill label={activeSession.recordingEnabled ? "Recording" : "Not recording"} tone={activeSession.recordingEnabled ? "warn" : "neutral"} />
                <Pill label={activeSession.toolsScope.guidedActionsAllowed ? "Guided allowed" : "Guided off"} tone={activeSession.toolsScope.guidedActionsAllowed ? "info" : "neutral"} />
                <Pill label={activeSession.orgVisible ? "Org-visible" : "Hidden"} tone={activeSession.orgVisible ? "good" : "warn"} />
              </div>
              <div className="mt-2 text-sm font-semibold text-slate-900">Started by {activeSession.startedBy}</div>
              <div className="mt-1 text-xs text-slate-500">Started {fmtDateTime(activeSession.startedAt)}{activeSession.endedAt ? ` • Ended ${fmtDateTime(activeSession.endedAt)}` : ""}</div>
              <div className="mt-2 text-xs text-slate-600">Case: {activeSession.relatedCaseId || "-"}</div>

              <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                No silent actions: every tool execution creates an audit entry.
              </div>
            </div>

            <Section title="Actions log" subtitle="Executed checks and guided actions" right={<Pill label={`${activeSession.actions.length}`} tone="neutral" />}>
              <div className="space-y-2">
                {activeSession.actions.map((a) => (
                  <div key={a.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Pill label={a.type} tone={a.type === "Guided action" ? "warn" : "good"} />
                          <Pill label={a.outcome} tone={a.outcome === "OK" ? "good" : a.outcome === "Failed" ? "warn" : "neutral"} />
                          <div className="text-xs text-slate-500">{timeAgo(a.at)}</div>
                        </div>
                        <div className="mt-1 text-sm font-semibold text-slate-900">{a.label}</div>
                        <div className="mt-1 text-sm text-slate-700">{a.notes}</div>
                      </div>
                      <div className="text-xs text-slate-500">By {a.by}</div>
                    </div>
                  </div>
                ))}
                {!activeSession.actions.length ? <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">No actions yet. Run a tool from Tools tab.</div> : null}
              </div>
            </Section>

            <Section title="Permissions" subtitle="Scoped troubleshooting tools" right={<Pill label="Premium" tone="info" />}>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-3xl border border-slate-200 bg-white p-4">
                  <div className="text-sm font-semibold text-slate-900">Read-only tools</div>
                  <div className="mt-1 text-xs text-slate-500">Enabled</div>
                  <Pill label={activeSession.toolsScope.readOnly ? "On" : "Off"} tone={activeSession.toolsScope.readOnly ? "good" : "warn"} />
                </div>
                <div className="rounded-3xl border border-slate-200 bg-white p-4">
                  <div className="text-sm font-semibold text-slate-900">Guided actions</div>
                  <div className="mt-1 text-xs text-slate-500">Approval required</div>
                  <Pill label={activeSession.toolsScope.guidedActionsAllowed ? "Allowed" : "Not allowed"} tone={activeSession.toolsScope.guidedActionsAllowed ? "info" : "neutral"} />
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={() => setTab("tools")}>
                  <ChevronRight className="h-4 w-4" /> Open tools
                </Button>
              </div>
            </Section>
          </div>
        ) : null}
      </Drawer>

      {/* Recording toggle modal */}
      <Modal
        open={recordingRequestOpen}
        title="Toggle session recording"
        subtitle="Premium: policy controlled. Requires reason and may require org approval."
        onClose={() => setRecordingRequestOpen(false)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setRecordingRequestOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={confirmRecordingToggle}>
              <Video className="h-4 w-4" /> Confirm
            </Button>
          </div>
        }
      >
        <TextArea label="Reason" value={recordingReason} onChange={setRecordingReason} placeholder="Example: capture evidence for incident review" rows={4} />
        <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700 ring-1 ring-slate-200">
          Policy: enabled {String(recordingPolicy.enabled)} • support toggle {String(recordingPolicy.allowSupportToToggle)} • org approval {String(recordingPolicy.requireOrgApproval)} • storage {recordingPolicy.storageDays} days.
        </div>
      </Modal>

      {/* Incident modal */}
      <Modal
        open={incidentModalOpen}
        title="New incident or status message"
        subtitle="Premium: incident/status messaging module."
        onClose={() => setIncidentModalOpen(false)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setIncidentModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={saveIncident}>
              <Siren className="h-4 w-4" /> Publish
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Title" value={String(incidentDraft.title || "")} onChange={(v) => setIncidentDraft((p) => ({ ...p, title: v }))} placeholder="Short incident title" />
          <Select
            label="Severity"
            value={String(incidentDraft.severity || "Info")}
            onChange={(v) => setIncidentDraft((p) => ({ ...p, severity: v as any }))}
            options={[{ value: "Info", label: "Info" }, { value: "Degraded", label: "Degraded" }, { value: "Partial Outage", label: "Partial Outage" }, { value: "Major Outage", label: "Major Outage" }]}
          />
          <Select
            label="Status"
            value={String(incidentDraft.status || "Investigating")}
            onChange={(v) => setIncidentDraft((p) => ({ ...p, status: v as any }))}
            options={[{ value: "Investigating", label: "Investigating" }, { value: "Identified", label: "Identified" }, { value: "Monitoring", label: "Monitoring" }, { value: "Resolved", label: "Resolved" }]}
          />
          <Toggle
            enabled={!!incidentDraft.pinned}
            onChange={(v) => setIncidentDraft((p) => ({ ...p, pinned: v }))}
            label="Pinned"
            description="Show at top"
          />
          <div className="md:col-span-2">
            <TextArea label="Message" value={String(incidentDraft.message || "")} onChange={(v) => setIncidentDraft((p) => ({ ...p, message: v }))} placeholder="What is happening, impact, ETA" rows={5} />
          </div>
          <div className="md:col-span-2 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700 ring-1 ring-slate-200">
            In production, status messages can be delivered via email and WhatsApp and show in Notifications Center.
          </div>
        </div>
      </Modal>
    </div>
  );
}
