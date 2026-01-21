import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BadgeCheck,
  CalendarClock,
  Check,
  ChevronRight,
  Copy,
  Database,
  Download,
  FileText,
  Filter,
  Fingerprint,
  Globe,
  Key,
  Laptop,
  Lock,
  RefreshCcw,
  Search,
  Settings2,
  Shield,
  Smartphone,
  Terminal,
  Trash2,
  Users,
  User,
  X,
  Info,
  Plus,
  MoreVertical,
} from "lucide-react";

const EVZ = {
  green: "#03CD8C",
  orange: "#F77F00",
  grey: "#A6A6A6",
  light: "#F2F2F2",
};

type Env = "Production" | "Sandbox";

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

type Severity = "Info" | "Warning" | "Critical";

type ActorRole = "Org Admin" | "Manager" | "Finance" | "Approver" | "Employee" | "EVzone Support" | "System";

type AuditEventType =
  | "Auth.Login"
  | "Auth.MFA.Enabled"
  | "Auth.MFA.Disabled"
  | "Auth.Device.Trusted"
  | "Auth.Device.Revoked"
  | "Policy.Retention.Updated"
  | "Policy.DualControl.Updated"
  | "Support.Session.Start"
  | "Support.Session.End"
  | "Support.Action.Requested"
  | "Support.Action.Executed"
  | "Export.Forensic.Created"
  | "Export.Forensic.Verified"
  | "Compliance.Attestation.Completed"
  | "Compliance.VendorDoc.Updated"
  | "Security.Key.Rotated"
  | "Security.Key.Revoked";

type AuditLogEntry = {
  id: string;
  ts: number;
  env: Env;
  severity: Severity;
  actor: string;
  role: ActorRole;
  ip: string;
  device: string;
  module: ServiceModule | "Security" | "Billing" | "System";
  marketplace: Marketplace | "-";
  event: AuditEventType;
  targetType: string;
  targetId: string;
  summary: string;
  metadata: Record<string, any>;
  diff?: { before: Record<string, any>; after: Record<string, any> };
};

type DeviceTrustStatus = "Trusted" | "Untrusted" | "Revoked";

type DeviceRow = {
  id: string;
  user: string;
  role: ActorRole;
  device: string;
  deviceType: "Phone" | "Laptop" | "Other";
  firstSeenAt: number;
  lastSeenAt: number;
  status: DeviceTrustStatus;
  trustedUntil?: number;
  ipLast: string;
  geoLast: string;
  riskSignals: string[];
};

type LoginEvent = {
  id: string;
  at: number;
  user: string;
  role: ActorRole;
  ip: string;
  geo: string;
  device: string;
  outcome: "Success" | "Blocked" | "Step-up required";
  note: string;
};

type RetentionCategory =
  | "Audit logs"
  | "Invoices and statements"
  | "Transaction ledger"
  | "Approvals"
  | "Webhook deliveries"
  | "API access logs"
  | "Support sessions"
  | "Exports";

type RetentionRule = {
  id: string;
  category: RetentionCategory;
  retentionDays: number;
  legalHold: boolean;
  purgeMode: "Soft delete" | "Hard delete" | "Archive";
  lastPurgeAt?: number;
  notes: string;
};

type SensitiveActionKey =
  | "retention_change"
  | "mfa_policy_change"
  | "support_write_action"
  | "rotate_prod_key"
  | "forensic_export_prod"
  | "disable_support_mode";

type DualControlPolicy = {
  id: string;
  actionKey: SensitiveActionKey;
  title: string;
  enabled: boolean;
  approversRequired: 2 | 3;
  stepUpMfaRequired: boolean;
  allowBreakGlass: boolean;
  notes: string;
};

type DualControlRequestStatus = "Pending" | "Approved" | "Rejected";

type DualControlRequest = {
  id: string;
  createdAt: number;
  requestedBy: string;
  requesterRole: ActorRole;
  env: Env;
  actionKey: SensitiveActionKey;
  reason: string;
  status: DualControlRequestStatus;
  approvals: Array<{ by: string; role: ActorRole; at: number }>;
  required: number;
};

type ForensicExportStatus = "Ready" | "Failed";

type ForensicExport = {
  id: string;
  createdAt: number;
  createdBy: string;
  env: Env;
  rangeLabel: string;
  recordCount: number;
  algo: "SHA-256" | "FNV-1a";
  finalHash: string;
  status: ForensicExportStatus;
  verifiedAt?: number;
  verifiedOk?: boolean;
  manifest: Record<string, any>;
  // store entries used, for demo verification
  entries: AuditLogEntry[];
};

type PolicyAttestation = {
  id: string;
  policyName: string;
  version: string;
  requiredForRoles: ActorRole[];
  dueBy?: number;
  lastUpdatedAt: number;
  completion: Array<{ user: string; role: ActorRole; at: number }>;
};

type VendorDocType = "License" | "Insurance" | "Tax" | "Safety" | "Other";

type VendorDocStatus = "Valid" | "Expiring" | "Expired" | "Missing";

type VendorComplianceDoc = {
  id: string;
  vendor: string;
  docType: VendorDocType;
  fileName: string;
  verified: boolean;
  expiryDate?: number;
  status: VendorDocStatus;
  uploadedAt: number;
  uploadedBy: string;
  notes: string;
};

type SupportSession = {
  id: string;
  startedAt: number;
  endedAt?: number;
  env: Env;
  agent: string;
  reason: string;
  writeEnabled: boolean;
  writeRequests: string[]; // dual-control request ids
};

type Toast = { id: string; title: string; message?: string; kind: "success" | "warn" | "error" | "info" };

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

function formatNumber(n: number) {
  const v = Math.round(Number(n || 0));
  return v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
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

function toneForSeverity(s: Severity) {
  if (s === "Critical") return "bad" as const;
  if (s === "Warning") return "warn" as const;
  return "info" as const;
}

function toneForDocStatus(s: VendorDocStatus) {
  if (s === "Valid") return "good" as const;
  if (s === "Expiring") return "warn" as const;
  if (s === "Expired" || s === "Missing") return "bad" as const;
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
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      style={style}
      className={cn(base, variants[variant], disabled && "cursor-not-allowed opacity-60", className)}
    >
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

function NumberField({
  label,
  value,
  onChange,
  hint,
  disabled,
  min = 0,
  max = 3650,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  hint?: string;
  disabled?: boolean;
  min?: number;
  max?: number;
}) {
  return (
    <div className={cn(disabled && "opacity-70")}>
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-semibold text-slate-600">{label}</div>
        {hint ? <div className="text-xs text-slate-500">{hint}</div> : null}
      </div>
      <input
        type="number"
        min={min}
        max={max}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Number(e.target.value || 0))}
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  rows?: number;
}) {
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



function ActionMenu({
  actions,
}: {
  actions: Array<{
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
    variant?: "default" | "danger";
    disabled?: boolean;
  }>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!actions.length) return null;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
      >
        <MoreVertical className="h-5 w-5" />
      </button>
      {isOpen && (
        <div className="absolute right-0 top-full mt-1 z-50 w-48 rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
          {actions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => {
                action.onClick();
                setIsOpen(false);
              }}
              disabled={action.disabled}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50",
                action.variant === "danger"
                  ? "text-rose-600 hover:bg-rose-50"
                  : "text-slate-700 hover:bg-slate-50"
              )}
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>
      )}
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
  actions,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onClose: () => void;
  footer?: React.ReactNode;
  maxW?: string;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: "default" | "danger";
    disabled?: boolean;
  }>;
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
              <div className="flex items-center gap-2">
                {actions && <ActionMenu actions={actions} />}
                <button className="rounded-2xl p-2 text-slate-600 hover:bg-slate-100" onClick={onClose} aria-label="Close">
                  <X className="h-5 w-5" />
                </button>
              </div>
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
  actions,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onClose: () => void;
  footer?: React.ReactNode;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: "default" | "danger";
    disabled?: boolean;
  }>;
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
              <div className="flex items-center gap-2">
                {actions && <ActionMenu actions={actions} />}
                <button className="rounded-2xl p-2 text-slate-600 hover:bg-slate-100" onClick={onClose} aria-label="Close">
                  <X className="h-5 w-5" />
                </button>
              </div>
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
        <Shield className="h-6 w-6" />
      </div>
      <div className="mt-3 text-sm font-semibold text-slate-900">{title}</div>
      <div className="mt-1 text-sm text-slate-600">{subtitle}</div>
    </div>
  );
}

// Hash helpers (browser)
function fnv1a(str: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  // unsigned
  return (h >>> 0).toString(16).padStart(8, "0");
}

async function sha256Hex(str: string): Promise<string> {
  try {
    const enc = new TextEncoder();
    const buf = enc.encode(str);
    if (!crypto?.subtle) return fnv1a(str);
    const hash = await crypto.subtle.digest("SHA-256", buf);
    const bytes = Array.from(new Uint8Array(hash));
    return bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    return fnv1a(str);
  }
}

function canonicalize(obj: any) {
  // Stable JSON stringify (basic, deterministic)
  const seen = new WeakSet();
  const sorter = (x: any): any => {
    if (x && typeof x === "object") {
      if (seen.has(x)) return "[Circular]";
      seen.add(x);
      if (Array.isArray(x)) return x.map(sorter);
      const keys = Object.keys(x).sort();
      const out: any = {};
      for (const k of keys) out[k] = sorter(x[k]);
      return out;
    }
    return x;
  };
  return JSON.stringify(sorter(obj));
}

export default function CorporatePaySecurityAuditComplianceV2() {
  const SERVICE_MODULES: ServiceModule[] = [
    "E-Commerce",
    "EVs & Charging",
    "Rides & Logistics",
    "School & E-Learning",
    "Medical & Health Care",
    "Travel & Tourism",
    "Green Investments",
    "FaithHub",
    "Virtual Workspace",
    "Finance & Payments",
    "Other Service Module",
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

  const [viewAs, setViewAs] = useState<ActorRole>("Org Admin");
  const [tab, setTab] = useState<"overview" | "audit" | "mfa" | "retention" | "support" | "dual" | "forensics" | "compliance">("overview");

  // Policies
  const [mfaPolicy, setMfaPolicy] = useState(() => ({
    requireMfaOrgAdmin: true,
    requireMfaFinance: true,
    requireMfaApprover: true,
    requireMfaSupport: true,
    trustDeviceDays: 30,
    requireStepUpNewDevice: true,
    requireStepUpSensitive: true,
    ipAllowlist: "",
  }));

  const [supportModeEnabled, setSupportModeEnabled] = useState(true);

  const [retention, setRetention] = useState<RetentionRule[]>(() => {
    const now = Date.now();
    return [
      { id: "RET-01", category: "Audit logs", retentionDays: 365, legalHold: false, purgeMode: "Archive", lastPurgeAt: now - 7 * 24 * 60 * 60 * 1000, notes: "Archive to cold storage after 365 days" },
      { id: "RET-02", category: "Invoices and statements", retentionDays: 2555, legalHold: false, purgeMode: "Archive", lastPurgeAt: now - 30 * 24 * 60 * 60 * 1000, notes: "7 years retention" },
      { id: "RET-03", category: "Transaction ledger", retentionDays: 2555, legalHold: false, purgeMode: "Archive", lastPurgeAt: now - 30 * 24 * 60 * 60 * 1000, notes: "7 years retention" },
      { id: "RET-04", category: "Approvals", retentionDays: 730, legalHold: false, purgeMode: "Archive", lastPurgeAt: now - 14 * 24 * 60 * 60 * 1000, notes: "2 years retention" },
      { id: "RET-05", category: "Webhook deliveries", retentionDays: 90, legalHold: false, purgeMode: "Hard delete", lastPurgeAt: now - 3 * 24 * 60 * 60 * 1000, notes: "Operational logs" },
      { id: "RET-06", category: "API access logs", retentionDays: 180, legalHold: false, purgeMode: "Hard delete", lastPurgeAt: now - 3 * 24 * 60 * 60 * 1000, notes: "Security analytics" },
      { id: "RET-07", category: "Support sessions", retentionDays: 365, legalHold: false, purgeMode: "Archive", lastPurgeAt: now - 14 * 24 * 60 * 60 * 1000, notes: "Support audit trails" },
      { id: "RET-08", category: "Exports", retentionDays: 60, legalHold: false, purgeMode: "Hard delete", lastPurgeAt: now - 3 * 24 * 60 * 60 * 1000, notes: "Reduce sensitive artifacts" },
    ];
  });

  const [dualPolicies, setDualPolicies] = useState<DualControlPolicy[]>(() => [
    {
      id: "DC-01",
      actionKey: "retention_change",
      title: "Change data retention",
      enabled: true,
      approversRequired: 2,
      stepUpMfaRequired: true,
      allowBreakGlass: true,
      notes: "Prevents silent data deletion changes",
    },
    {
      id: "DC-02",
      actionKey: "mfa_policy_change",
      title: "Change MFA policy",
      enabled: true,
      approversRequired: 2,
      stepUpMfaRequired: true,
      allowBreakGlass: true,
      notes: "Protects auth baseline",
    },
    {
      id: "DC-03",
      actionKey: "support_write_action",
      title: "Support write actions",
      enabled: true,
      approversRequired: 2,
      stepUpMfaRequired: true,
      allowBreakGlass: false,
      notes: "EVzone Support cannot write without org approval",
    },
    {
      id: "DC-04",
      actionKey: "rotate_prod_key",
      title: "Rotate production API keys",
      enabled: true,
      approversRequired: 2,
      stepUpMfaRequired: true,
      allowBreakGlass: true,
      notes: "Reduce integration outage risk",
    },
    {
      id: "DC-05",
      actionKey: "forensic_export_prod",
      title: "Generate production forensic exports",
      enabled: true,
      approversRequired: 2,
      stepUpMfaRequired: true,
      allowBreakGlass: true,
      notes: "Sensitive logs export",
    },
    {
      id: "DC-06",
      actionKey: "disable_support_mode",
      title: "Disable support mode",
      enabled: true,
      approversRequired: 2,
      stepUpMfaRequired: true,
      allowBreakGlass: true,
      notes: "Avoid accidental lockout during incident",
    },
  ]);

  const [dualRequests, setDualRequests] = useState<DualControlRequest[]>(() => {
    const now = Date.now();
    return [
      {
        id: "DCR-001",
        createdAt: now - 2 * 60 * 60 * 1000,
        requestedBy: "EVzone Support",
        requesterRole: "EVzone Support",
        env: "Production",
        actionKey: "support_write_action",
        reason: "Need to re-send overdue invoices with corrected AP routing",
        status: "Pending",
        approvals: [{ by: "Org Admin", role: "Org Admin", at: now - 30 * 60 * 1000 }],
        required: 2,
      },
    ];
  });

  const [supportSessions, setSupportSessions] = useState<SupportSession[]>(() => {
    const now = Date.now();
    return [
      {
        id: "SUP-001",
        startedAt: now - 3 * 60 * 60 * 1000,
        env: "Production",
        agent: "EVzone Support",
        reason: "Invoice delivery troubleshooting",
        writeEnabled: false,
        writeRequests: ["DCR-001"],
      },
    ];
  });

  const [devices, setDevices] = useState<DeviceRow[]>(() => {
    const now = Date.now();
    return [
      {
        id: "DEV-001",
        user: "Org Admin",
        role: "Org Admin",
        device: "iPhone 15 Pro",
        deviceType: "Phone",
        firstSeenAt: now - 40 * 24 * 60 * 60 * 1000,
        lastSeenAt: now - 2 * 60 * 60 * 1000,
        status: "Trusted",
        trustedUntil: now + 22 * 24 * 60 * 60 * 1000,
        ipLast: "197.157.0.12",
        geoLast: "Kampala, UG",
        riskSignals: [],
      },
      {
        id: "DEV-002",
        user: "Finance Desk",
        role: "Finance",
        device: "Windows Laptop",
        deviceType: "Laptop",
        firstSeenAt: now - 120 * 24 * 60 * 60 * 1000,
        lastSeenAt: now - 10 * 60 * 1000,
        status: "Trusted",
        trustedUntil: now + 10 * 24 * 60 * 60 * 1000,
        ipLast: "197.157.0.18",
        geoLast: "Kampala, UG",
        riskSignals: ["New IP observed"],
      },
      {
        id: "DEV-003",
        user: "EVzone Support",
        role: "EVzone Support",
        device: "Support Console",
        deviceType: "Other",
        firstSeenAt: now - 12 * 24 * 60 * 60 * 1000,
        lastSeenAt: now - 45 * 60 * 1000,
        status: "Trusted",
        trustedUntil: now + 7 * 24 * 60 * 60 * 1000,
        ipLast: "41.210.0.9",
        geoLast: "Nairobi, KE",
        riskSignals: ["Support mode"],
      },
      {
        id: "DEV-004",
        user: "John S.",
        role: "Employee",
        device: "Android",
        deviceType: "Phone",
        firstSeenAt: now - 9 * 24 * 60 * 60 * 1000,
        lastSeenAt: now - 3 * 24 * 60 * 60 * 1000,
        status: "Revoked",
        ipLast: "102.88.1.11",
        geoLast: "Entebbe, UG",
        riskSignals: ["Password reset"],
      },
    ];
  });

  const [loginHistory, setLoginHistory] = useState<LoginEvent[]>(() => {
    const now = Date.now();
    return [
      { id: "LG-001", at: now - 2 * 60 * 60 * 1000, user: "Org Admin", role: "Org Admin", ip: "197.157.0.12", geo: "Kampala, UG", device: "iPhone 15 Pro", outcome: "Success", note: "Trusted device" },
      { id: "LG-002", at: now - 70 * 60 * 1000, user: "Finance Desk", role: "Finance", ip: "197.157.0.18", geo: "Kampala, UG", device: "Windows Laptop", outcome: "Step-up required", note: "New IP observed" },
      { id: "LG-003", at: now - 45 * 60 * 1000, user: "EVzone Support", role: "EVzone Support", ip: "41.210.0.9", geo: "Nairobi, KE", device: "Support Console", outcome: "Success", note: "Support session" },
      { id: "LG-004", at: now - 2 * 24 * 60 * 60 * 1000, user: "John S.", role: "Employee", ip: "102.88.1.11", geo: "Entebbe, UG", device: "Android", outcome: "Blocked", note: "Device revoked" },
    ];
  });

  const [audit, setAudit] = useState<AuditLogEntry[]>(() => {
    const now = Date.now();
    return [
      {
        id: "AUD-001",
        ts: now - 2 * 60 * 60 * 1000,
        env: "Production",
        severity: "Info",
        actor: "Org Admin",
        role: "Org Admin",
        ip: "197.157.0.12",
        device: "iPhone 15 Pro",
        module: "Security",
        marketplace: "-",
        event: "Auth.Login",
        targetType: "session",
        targetId: "sess_001",
        summary: "Login success",
        metadata: { outcome: "success", method: "password+mfa" },
      },
      {
        id: "AUD-002",
        ts: now - 65 * 60 * 1000,
        env: "Production",
        severity: "Warning",
        actor: "Finance Desk",
        role: "Finance",
        ip: "197.157.0.18",
        device: "Windows Laptop",
        module: "Security",
        marketplace: "-",
        event: "Auth.Login",
        targetType: "session",
        targetId: "sess_002",
        summary: "Step-up required",
        metadata: { outcome: "step-up", reason: "new ip" },
      },
      {
        id: "AUD-003",
        ts: now - 3 * 24 * 60 * 60 * 1000,
        env: "Production",
        severity: "Info",
        actor: "Org Admin",
        role: "Org Admin",
        ip: "197.157.0.12",
        device: "iPhone 15 Pro",
        module: "Security",
        marketplace: "-",
        event: "Policy.Retention.Updated",
        targetType: "retention",
        targetId: "RET-05",
        summary: "Updated retention rule",
        metadata: { category: "Webhook deliveries" },
        diff: { before: { retentionDays: 60 }, after: { retentionDays: 90 } },
      },
      {
        id: "AUD-004",
        ts: now - 3 * 60 * 60 * 1000,
        env: "Production",
        severity: "Warning",
        actor: "EVzone Support",
        role: "EVzone Support",
        ip: "41.210.0.9",
        device: "Support Console",
        module: "System",
        marketplace: "-",
        event: "Support.Session.Start",
        targetType: "support_session",
        targetId: "SUP-001",
        summary: "Support session started",
        metadata: { supportMode: true },
      },
      {
        id: "AUD-005",
        ts: now - 2 * 60 * 60 * 1000,
        env: "Production",
        severity: "Critical",
        actor: "System",
        role: "System",
        ip: "-",
        device: "-",
        module: "Billing",
        marketplace: "-",
        event: "Support.Action.Requested",
        targetType: "dual_control_request",
        targetId: "DCR-001",
        summary: "Support write requested",
        metadata: { action: "resend invoices" },
      },
    ];
  });

  const [forensicExports, setForensicExports] = useState<ForensicExport[]>(() => []);

  const [attestations, setAttestations] = useState<PolicyAttestation[]>(() => {
    const now = Date.now();
    return [
      {
        id: "ATT-001",
        policyName: "CorporatePay Acceptable Use",
        version: "v1.2",
        requiredForRoles: ["Org Admin", "Finance", "Approver", "EVzone Support"],
        dueBy: now + 14 * 24 * 60 * 60 * 1000,
        lastUpdatedAt: now - 14 * 24 * 60 * 60 * 1000,
        completion: [
          { user: "Org Admin", role: "Org Admin", at: now - 10 * 24 * 60 * 60 * 1000 },
          { user: "Finance Desk", role: "Finance", at: now - 9 * 24 * 60 * 60 * 1000 },
        ],
      },
      {
        id: "ATT-002",
        policyName: "Support Mode Rules",
        version: "v2.0",
        requiredForRoles: ["EVzone Support", "Org Admin"],
        dueBy: now + 21 * 24 * 60 * 60 * 1000,
        lastUpdatedAt: now - 30 * 24 * 60 * 60 * 1000,
        completion: [{ user: "EVzone Support", role: "EVzone Support", at: now - 5 * 24 * 60 * 60 * 1000 }],
      },
    ];
  });

  const [vendorDocs, setVendorDocs] = useState<VendorComplianceDoc[]>(() => {
    const now = Date.now();
    const soon = now + 20 * 24 * 60 * 60 * 1000;
    const past = now - 12 * 24 * 60 * 60 * 1000;
    return [
      {
        id: "VD-001",
        vendor: "EVzone Rides",
        docType: "Insurance",
        fileName: "insurance-2026.pdf",
        verified: true,
        expiryDate: soon,
        status: "Expiring",
        uploadedAt: now - 40 * 24 * 60 * 60 * 1000,
        uploadedBy: "Procurement Desk",
        notes: "Renewal requested",
      },
      {
        id: "VD-002",
        vendor: "Shenzhen Store",
        docType: "License",
        fileName: "license.pdf",
        verified: true,
        expiryDate: now + 210 * 24 * 60 * 60 * 1000,
        status: "Valid",
        uploadedAt: now - 70 * 24 * 60 * 60 * 1000,
        uploadedBy: "Procurement Desk",
        notes: "",
      },
      {
        id: "VD-003",
        vendor: "Express CN",
        docType: "Safety",
        fileName: "safety-cert.pdf",
        verified: false,
        expiryDate: past,
        status: "Expired",
        uploadedAt: now - 190 * 24 * 60 * 60 * 1000,
        uploadedBy: "Procurement Desk",
        notes: "Awaiting updated certificate",
      },
      {
        id: "VD-004",
        vendor: "ServicePro",
        docType: "Tax",
        fileName: "tax-clearance.pdf",
        verified: true,
        expiryDate: now + 30 * 24 * 60 * 60 * 1000,
        status: "Valid",
        uploadedAt: now - 10 * 24 * 60 * 60 * 1000,
        uploadedBy: "Procurement Desk",
        notes: "",
      },
    ];
  });

  // Filters and UI state
  const [q, setQ] = useState("");
  const [envFilter, setEnvFilter] = useState<Env | "All">("All");
  const [sevFilter, setSevFilter] = useState<Severity | "All">("All");
  const [roleFilter, setRoleFilter] = useState<ActorRole | "All">("All");
  const [moduleFilter, setModuleFilter] = useState<AuditLogEntry["module"] | "All">("All");

  const [auditDrawerOpen, setAuditDrawerOpen] = useState(false);
  const [activeAuditId, setActiveAuditId] = useState<string | null>(null);
  const activeAudit = useMemo(() => (activeAuditId ? audit.find((a) => a.id === activeAuditId) || null : null), [activeAuditId, audit]);

  const [supportToggleModal, setSupportToggleModal] = useState<"enable" | "disable" | null>(null);
  const [supportReason, setSupportReason] = useState("");

  const [forensicModalOpen, setForensicModalOpen] = useState(false);
  const [forensicDraft, setForensicDraft] = useState(() => ({
    env: "Production" as Env,
    range: "Last 7 days",
    includeSupport: true,
    includeCompliance: true,
    reason: "",
  }));

  const [vendorDocModalOpen, setVendorDocModalOpen] = useState(false);
  const [vendorDocDraft, setVendorDocDraft] = useState(() => ({
    vendor: "",
    docType: "License" as VendorDocType,
    fileName: "",
    expiryDate: "",
    verified: false,
    notes: "",
  }));

  const [attestModalOpen, setAttestModalOpen] = useState(false);
  const [attestDraft, setAttestDraft] = useState<{ attId: string; confirm: boolean; note: string }>({ attId: "ATT-001", confirm: false, note: "" });

  // Helpers: Audit
  const logAudit = (e: Omit<AuditLogEntry, "id" | "ts"> & { ts?: number }) => {
    const row: AuditLogEntry = {
      id: uid("AUD"),
      ts: e.ts ?? Date.now(),
      ...e,
    };
    setAudit((p) => [row, ...p].slice(0, 800));
    return row;
  };

  const policyByAction = useMemo(() => Object.fromEntries(dualPolicies.map((p) => [p.actionKey, p])) as Record<SensitiveActionKey, DualControlPolicy>, [dualPolicies]);

  const requiresDualControl = (actionKey: SensitiveActionKey, env: Env) => {
    const p = policyByAction[actionKey];
    if (!p?.enabled) return false;
    if (actionKey === "forensic_export_prod") return env === "Production";
    if (actionKey === "rotate_prod_key") return env === "Production";
    return true;
  };

  const createDualRequest = (actionKey: SensitiveActionKey, env: Env, reason: string) => {
    const p = policyByAction[actionKey];
    const required = p?.approversRequired ?? 2;
    const row: DualControlRequest = {
      id: uid("DCR"),
      createdAt: Date.now(),
      requestedBy: viewAs,
      requesterRole: viewAs,
      env,
      actionKey,
      reason: reason.trim() || "Policy required",
      status: "Pending",
      approvals: [],
      required,
    };
    setDualRequests((prev) => [row, ...prev]);

    logAudit({
      env,
      severity: "Critical",
      actor: viewAs,
      role: viewAs,
      ip: "-",
      device: "-",
      module: "Security",
      marketplace: "-",
      event: "Support.Action.Requested",
      targetType: "dual_control_request",
      targetId: row.id,
      summary: "Dual control request created",
      metadata: { actionKey, required, reason: row.reason },
    });

    toast({ title: "Approval required", message: `Created request ${row.id}.`, kind: "warn" });
    return row;
  };

  const approveDualRequest = (id: string) => {
    const now = Date.now();
    setDualRequests((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        if (r.status !== "Pending") return r;
        if (r.approvals.some((a) => a.by === viewAs)) return r;
        const approvals = [...r.approvals, { by: viewAs, role: viewAs, at: now }];
        const status: DualControlRequestStatus = approvals.length >= r.required ? "Approved" : "Pending";
        return { ...r, approvals, status };
      })
    );

    logAudit({
      env: "Production",
      severity: "Info",
      actor: viewAs,
      role: viewAs,
      ip: "-",
      device: "-",
      module: "Security",
      marketplace: "-",
      event: "Policy.DualControl.Updated",
      targetType: "dual_control_request",
      targetId: id,
      summary: "Dual control approval recorded",
      metadata: { by: viewAs },
    });

    toast({ title: "Approved", message: "Approval recorded.", kind: "success" });
  };

  const rejectDualRequest = (id: string) => {
    setDualRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: "Rejected" } : r)));
    logAudit({
      env: "Production",
      severity: "Warning",
      actor: viewAs,
      role: viewAs,
      ip: "-",
      device: "-",
      module: "Security",
      marketplace: "-",
      event: "Policy.DualControl.Updated",
      targetType: "dual_control_request",
      targetId: id,
      summary: "Dual control request rejected",
      metadata: { by: viewAs },
    });
    toast({ title: "Rejected", message: "Request rejected.", kind: "info" });
  };

  // Derived counts
  const filteredAudit = useMemo(() => {
    const query = q.trim().toLowerCase();
    return audit
      .filter((a) => (envFilter === "All" ? true : a.env === envFilter))
      .filter((a) => (sevFilter === "All" ? true : a.severity === sevFilter))
      .filter((a) => (roleFilter === "All" ? true : a.role === roleFilter))
      .filter((a) => (moduleFilter === "All" ? true : a.module === moduleFilter))
      .filter((a) => {
        if (!query) return true;
        const blob = `${a.id} ${a.actor} ${a.role} ${a.event} ${a.targetType} ${a.targetId} ${a.summary} ${a.module} ${a.marketplace}`.toLowerCase();
        return blob.includes(query);
      })
      .slice()
      .sort((x, y) => y.ts - x.ts);
  }, [audit, q, envFilter, sevFilter, roleFilter, moduleFilter]);

  const expiringDocs = useMemo(() => vendorDocs.filter((d) => d.status === "Expiring" || d.status === "Expired" || d.status === "Missing"), [vendorDocs]);
  const pendingDual = useMemo(() => dualRequests.filter((r) => r.status === "Pending").length, [dualRequests]);
  const openSupportSessions = useMemo(() => supportSessions.filter((s) => !s.endedAt).length, [supportSessions]);

  const privilegedMfaCoverage = useMemo(() => {
    // Demo coverage: if policy requires, consider it covered
    const requiredRoles: ActorRole[] = [];
    if (mfaPolicy.requireMfaOrgAdmin) requiredRoles.push("Org Admin");
    if (mfaPolicy.requireMfaFinance) requiredRoles.push("Finance");
    if (mfaPolicy.requireMfaApprover) requiredRoles.push("Approver");
    if (mfaPolicy.requireMfaSupport) requiredRoles.push("EVzone Support");

    const unique = Array.from(new Set(requiredRoles));
    const pct = unique.length ? 100 : 0;
    return { requiredRoles: unique, pct };
  }, [mfaPolicy]);

  // Actions
  const exportAuditJSON = () => {
    const payload = { filters: { envFilter, sevFilter, roleFilter, moduleFilter, q }, entries: filteredAudit, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "corporatepay-audit.json";
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported", message: "Audit JSON downloaded.", kind: "success" });
  };

  const exportAuditCSV = () => {
    const columns = ["ts", "env", "severity", "actor", "role", "event", "module", "marketplace", "targetType", "targetId", "summary"];
    const esc = (v: any) => {
      const s = String(v ?? "");
      if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };
    const rows = filteredAudit.map((a) => ({
      ts: fmtDateTime(a.ts),
      env: a.env,
      severity: a.severity,
      actor: a.actor,
      role: a.role,
      event: a.event,
      module: a.module,
      marketplace: a.marketplace,
      targetType: a.targetType,
      targetId: a.targetId,
      summary: a.summary,
    }));
    const head = columns.join(",");
    const body = rows.map((r) => columns.map((c) => esc((r as any)[c])).join(",")).join("\n");
    const csv = `${head}\n${body}`;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "corporatepay-audit.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported", message: "Audit CSV downloaded.", kind: "success" });
  };

  const requestSupportToggle = (mode: "enable" | "disable") => {
    setSupportReason("");
    setSupportToggleModal(mode);
  };

  const confirmSupportToggle = () => {
    if (supportReason.trim().length < 8) {
      toast({ title: "Reason required", message: "Provide a clear reason for audit.", kind: "warn" });
      return;
    }

    const wantEnable = supportToggleModal === "enable";

    if (!wantEnable && requiresDualControl("disable_support_mode", "Production")) {
      createDualRequest("disable_support_mode", "Production", supportReason);
      setSupportToggleModal(null);
      return;
    }

    setSupportModeEnabled(wantEnable);
    setSupportToggleModal(null);

    logAudit({
      env: "Production",
      severity: "Warning",
      actor: viewAs,
      role: viewAs,
      ip: "-",
      device: "-",
      module: "Security",
      marketplace: "-",
      event: wantEnable ? "Support.Session.Start" : "Support.Session.End",
      targetType: "support_mode",
      targetId: "org",
      summary: wantEnable ? "Support mode enabled" : "Support mode disabled",
      metadata: { reason: supportReason.trim() },
    });

    toast({ title: "Updated", message: wantEnable ? "Support enabled." : "Support disabled.", kind: "success" });
  };

  const revokeDevice = (id: string) => {
    const now = Date.now();
    setDevices((prev) => prev.map((d) => (d.id === id ? { ...d, status: "Revoked", trustedUntil: undefined, lastSeenAt: now } : d)));
    logAudit({
      env: "Production",
      severity: "Warning",
      actor: viewAs,
      role: viewAs,
      ip: "-",
      device: "-",
      module: "Security",
      marketplace: "-",
      event: "Auth.Device.Revoked",
      targetType: "device",
      targetId: id,
      summary: "Device revoked",
      metadata: { deviceId: id },
    });
    toast({ title: "Revoked", message: "Device access revoked.", kind: "success" });
  };

  const applyRetentionChanges = () => {
    if (requiresDualControl("retention_change", "Production")) {
      createDualRequest("retention_change", "Production", "Update retention settings");
      return;
    }
    logAudit({
      env: "Production",
      severity: "Info",
      actor: viewAs,
      role: viewAs,
      ip: "-",
      device: "-",
      module: "Security",
      marketplace: "-",
      event: "Policy.Retention.Updated",
      targetType: "retention",
      targetId: "bulk",
      summary: "Retention policy updated",
      metadata: { count: retention.length },
    });
    toast({ title: "Applied", message: "Retention settings applied.", kind: "success" });
  };

  const updateMfaPolicy = () => {
    if (requiresDualControl("mfa_policy_change", "Production")) {
      createDualRequest("mfa_policy_change", "Production", "Update MFA and device trust policy");
      return;
    }
    logAudit({
      env: "Production",
      severity: "Info",
      actor: viewAs,
      role: viewAs,
      ip: "-",
      device: "-",
      module: "Security",
      marketplace: "-",
      event: "Auth.MFA.Enabled",
      targetType: "mfa_policy",
      targetId: "org",
      summary: "MFA policy updated",
      metadata: { ...mfaPolicy },
    });
    toast({ title: "Saved", message: "MFA policy saved.", kind: "success" });
  };

  const openAudit = (id: string) => {
    setActiveAuditId(id);
    setAuditDrawerOpen(true);
  };

  const generateForensicExport = async () => {
    const env = forensicDraft.env;

    if (env === "Production" && requiresDualControl("forensic_export_prod", "Production")) {
      if (!forensicDraft.reason.trim()) {
        toast({ title: "Reason required", message: "Add a reason for production forensic export.", kind: "warn" });
        return;
      }
      createDualRequest("forensic_export_prod", "Production", forensicDraft.reason);
      setForensicModalOpen(false);
      return;
    }

    // Select data
    const selected = filteredAudit.slice(0, 200).slice().reverse(); // oldest to newest

    const start = Date.now();
    const algo: ForensicExport["algo"] = crypto?.subtle ? "SHA-256" : "FNV-1a";

    let prev = await sha256Hex("0");
    for (const e of selected) {
      const canon = canonicalize({
        id: e.id,
        ts: e.ts,
        env: e.env,
        severity: e.severity,
        actor: e.actor,
        role: e.role,
        ip: e.ip,
        device: e.device,
        module: e.module,
        marketplace: e.marketplace,
        event: e.event,
        targetType: e.targetType,
        targetId: e.targetId,
        summary: e.summary,
        metadata: e.metadata,
        diff: e.diff || null,
      });
      prev = await sha256Hex(`${prev}|${canon}`);
    }

    const finalHash = prev;
    const manifest = {
      exportId: uid("FXM"),
      createdAt: new Date().toISOString(),
      env,
      algorithm: algo,
      recordCount: selected.length,
      rangeLabel: forensicDraft.range,
      finalHash,
      disclaimer: algo === "FNV-1a" ? "FNV used because SHA-256 not available." : "SHA-256 used for hash chain.",
    };

    const job: ForensicExport = {
      id: uid("FX"),
      createdAt: Date.now(),
      createdBy: viewAs,
      env,
      rangeLabel: forensicDraft.range,
      recordCount: selected.length,
      algo,
      finalHash,
      status: "Ready",
      manifest,
      entries: selected,
    };

    setForensicExports((p) => [job, ...p]);

    logAudit({
      env,
      severity: "Critical",
      actor: viewAs,
      role: viewAs,
      ip: "-",
      device: "-",
      module: "Security",
      marketplace: "-",
      event: "Export.Forensic.Created",
      targetType: "forensic_export",
      targetId: job.id,
      summary: "Forensic export created",
      metadata: { recordCount: job.recordCount, finalHash: job.finalHash, algo: job.algo, reason: forensicDraft.reason || "" },
    });

    toast({ title: "Created", message: `Forensic export ${job.id} ready.`, kind: "success" });
    setForensicModalOpen(false);

    // Download bundle immediately (premium behavior)
    const bundle = { manifest, entries: selected };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `forensic-export-${job.id}.json`;
    a.click();
    URL.revokeObjectURL(url);

    void start;
  };

  const verifyForensicExport = async (id: string) => {
    const job = forensicExports.find((x) => x.id === id);
    if (!job) return;

    const selected = job.entries.slice().sort((a, b) => a.ts - b.ts);
    let prev = await sha256Hex("0");

    for (const e of selected) {
      const canon = canonicalize({
        id: e.id,
        ts: e.ts,
        env: e.env,
        severity: e.severity,
        actor: e.actor,
        role: e.role,
        ip: e.ip,
        device: e.device,
        module: e.module,
        marketplace: e.marketplace,
        event: e.event,
        targetType: e.targetType,
        targetId: e.targetId,
        summary: e.summary,
        metadata: e.metadata,
        diff: e.diff || null,
      });
      prev = await sha256Hex(`${prev}|${canon}`);
    }

    const ok = prev === job.finalHash;
    setForensicExports((p) => p.map((x) => (x.id === id ? { ...x, verifiedAt: Date.now(), verifiedOk: ok } : x)));

    logAudit({
      env: job.env,
      severity: ok ? "Info" : "Critical",
      actor: viewAs,
      role: viewAs,
      ip: "-",
      device: "-",
      module: "Security",
      marketplace: "-",
      event: "Export.Forensic.Verified",
      targetType: "forensic_export",
      targetId: id,
      summary: ok ? "Forensic export verified" : "Forensic export verification failed",
      metadata: { ok },
    });

    toast({ title: ok ? "Verified" : "Mismatch", message: ok ? "Hash chain valid." : "Hash mismatch detected.", kind: ok ? "success" : "error" });
  };

  const addVendorDoc = () => {
    if (!vendorDocDraft.vendor.trim() || !vendorDocDraft.fileName.trim()) {
      toast({ title: "Missing", message: "Vendor and file name are required.", kind: "warn" });
      return;
    }

    const expiry = vendorDocDraft.expiryDate ? new Date(vendorDocDraft.expiryDate).getTime() : undefined;
    let status: VendorDocStatus = "Valid";
    const now = Date.now();
    if (!expiry) status = "Valid";
    else if (expiry < now) status = "Expired";
    else if (expiry < now + 30 * 24 * 60 * 60 * 1000) status = "Expiring";

    const row: VendorComplianceDoc = {
      id: uid("VD"),
      vendor: vendorDocDraft.vendor.trim(),
      docType: vendorDocDraft.docType,
      fileName: vendorDocDraft.fileName.trim(),
      verified: vendorDocDraft.verified,
      expiryDate: expiry,
      status,
      uploadedAt: now,
      uploadedBy: viewAs,
      notes: vendorDocDraft.notes.trim(),
    };

    setVendorDocs((p) => [row, ...p]);

    logAudit({
      env: "Production",
      severity: status === "Expired" ? "Critical" : status === "Expiring" ? "Warning" : "Info",
      actor: viewAs,
      role: viewAs,
      ip: "-",
      device: "-",
      module: "Security",
      marketplace: "-",
      event: "Compliance.VendorDoc.Updated",
      targetType: "vendor_doc",
      targetId: row.id,
      summary: "Vendor compliance doc added",
      metadata: { vendor: row.vendor, docType: row.docType, status: row.status },
    });

    toast({ title: "Saved", message: "Vendor document saved.", kind: "success" });
    setVendorDocModalOpen(false);
  };

  const attestPolicy = () => {
    if (!attestDraft.confirm) {
      toast({ title: "Confirm required", message: "Confirm your attestation.", kind: "warn" });
      return;
    }

    const now = Date.now();
    setAttestations((prev) =>
      prev.map((a) => {
        if (a.id !== attestDraft.attId) return a;
        if (a.completion.some((c) => c.user === viewAs)) return a;
        return { ...a, completion: [{ user: viewAs, role: viewAs, at: now }, ...a.completion] };
      })
    );

    logAudit({
      env: "Production",
      severity: "Info",
      actor: viewAs,
      role: viewAs,
      ip: "-",
      device: "-",
      module: "Security",
      marketplace: "-",
      event: "Compliance.Attestation.Completed",
      targetType: "policy_attestation",
      targetId: attestDraft.attId,
      summary: "Policy attestation completed",
      metadata: { note: attestDraft.note || "" },
    });

    toast({ title: "Completed", message: "Attestation recorded.", kind: "success" });
    setAttestModalOpen(false);
  };

  const downloadForensicBundle = (id: string) => {
    const job = forensicExports.find((x) => x.id === id);
    if (!job) return;
    const bundle = { manifest: job.manifest, entries: job.entries };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `forensic-export-${job.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Downloaded", message: "Forensic bundle downloaded.", kind: "success" });
  };

  const complianceMissing = useMemo(() => vendorDocs.filter((d) => d.status === "Expired" || d.status === "Missing").length, [vendorDocs]);

  const auditsToday = useMemo(() => {
    const n = new Date();
    const start = new Date(n.getFullYear(), n.getMonth(), n.getDate()).getTime();
    return audit.filter((a) => a.ts >= start).length;
  }, [audit]);

  const securityKpis = useMemo(() => {
    const mfa = privilegedMfaCoverage.pct;
    const trusted = devices.filter((d) => d.status === "Trusted").length;
    const total = devices.length || 1;
    const trustPct = Math.round((trusted / total) * 100);
    return { mfa, trustPct };
  }, [privilegedMfaCoverage.pct, devices]);

  // UI elements
  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "audit", label: "Audit logs" },
    { id: "mfa", label: "MFA and device trust" },
    { id: "retention", label: "Data retention" },
    { id: "support", label: "Support mode" },
    { id: "dual", label: "Dual control" },
    { id: "forensics", label: "Forensic exports" },
    { id: "compliance", label: "Compliance center" },
  ] as const;

  return (
    <div className="min-h-screen" style={{ background: "radial-gradient(90% 60% at 50% 0%, rgba(3,205,140,0.18), rgba(255,255,255,0))" }}>
      <ToastStack toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((x) => x.id !== id))} />

      {/* Support mode banner */}
      {viewAs === "EVzone Support" ? (
        <div className="sticky top-0 z-30 border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
          <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" /> Support session view. No silent actions. Writes require approvals.
            </div>
            <Pill label={supportModeEnabled ? "Support mode enabled" : "Support mode disabled"} tone={supportModeEnabled ? "info" : "warn"} />
          </div>
        </div>
      ) : null}

      <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-6">
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(2,8,23,0.12)]">
          {/* Header */}
          <div className="border-b border-slate-200 bg-white px-4 py-4 md:px-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl text-white" style={{ background: EVZ.green }}>
                  <Shield className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">Security, Audit and Compliance</div>
                  <div className="mt-1 text-xs text-slate-500">Audit logs, MFA policies, device trust, retention, support gating, dual control, forensic exports, and compliance evidence.</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Pill label={`Audit today: ${auditsToday}`} tone="neutral" />
                    <Pill label={`Dual pending: ${pendingDual}`} tone={pendingDual ? "warn" : "good"} />
                    <Pill label={`Support sessions: ${openSupportSessions}`} tone={openSupportSessions ? "info" : "neutral"} />
                    <Pill label={`Docs alerts: ${expiringDocs.length}`} tone={expiringDocs.length ? "warn" : "good"} />
                    <Pill label={`MFA coverage: ${securityKpis.mfa}%`} tone={securityKpis.mfa >= 100 ? "good" : "warn"} />
                    <Pill label={`Trust coverage: ${securityKpis.trustPct}%`} tone={securityKpis.trustPct >= 70 ? "good" : "warn"} />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Select
                  label="View as"
                  value={viewAs}
                  onChange={(v) => setViewAs(v as ActorRole)}
                  options={[
                    { value: "Org Admin", label: "Org Admin" },
                    { value: "Finance", label: "Finance" },
                    { value: "Approver", label: "Approver" },
                    { value: "EVzone Support", label: "EVzone Support" },
                  ]}
                />

                <Button variant="outline" onClick={exportAuditCSV}>
                  <Download className="h-4 w-4" /> Export CSV
                </Button>
                <Button variant="outline" onClick={exportAuditJSON}>
                  <Download className="h-4 w-4" /> Export JSON
                </Button>
                <Button variant="primary" onClick={() => setForensicModalOpen(true)}>
                  <Database className="h-4 w-4" /> Forensic export
                </Button>
              </div>
            </div>

            {/* Tabs */}
            <div className="mt-4 flex flex-wrap gap-2">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-semibold ring-1 transition",
                    tab === (t.id as any) ? "text-white ring-emerald-600" : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
                  )}
                  style={tab === (t.id as any) ? { background: EVZ.green } : undefined}
                  onClick={() => setTab(t.id as any)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Search and filters */}
            <div className="mt-4 grid grid-cols-1 gap-3 rounded-3xl border border-slate-200 bg-white p-4 md:grid-cols-12">
              <div className="md:col-span-4">
                <div className="text-xs font-semibold text-slate-600">Search</div>
                <div className="mt-2 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5">
                  <Search className="h-4 w-4 text-slate-500" />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="audit, device, vendor, request..."
                    className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
                  />
                  {q ? (
                    <button className="rounded-xl p-1 text-slate-500 hover:bg-slate-100" onClick={() => setQ("")} aria-label="Clear">
                      <X className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              </div>
              <div className="md:col-span-2">
                <Select
                  label="Environment"
                  value={envFilter}
                  onChange={(v) => setEnvFilter(v as any)}
                  options={[{ value: "All", label: "All" }, { value: "Production", label: "Production" }, { value: "Sandbox", label: "Sandbox" }]}
                />
              </div>
              <div className="md:col-span-2">
                <Select
                  label="Severity"
                  value={sevFilter}
                  onChange={(v) => setSevFilter(v as any)}
                  options={[{ value: "All", label: "All" }, { value: "Info", label: "Info" }, { value: "Warning", label: "Warning" }, { value: "Critical", label: "Critical" }]}
                />
              </div>
              <div className="md:col-span-2">
                <Select
                  label="Actor role"
                  value={roleFilter}
                  onChange={(v) => setRoleFilter(v as any)}
                  options={[
                    { value: "All", label: "All" },
                    { value: "Org Admin", label: "Org Admin" },
                    { value: "Finance", label: "Finance" },
                    { value: "Approver", label: "Approver" },
                    { value: "EVzone Support", label: "EVzone Support" },
                    { value: "System", label: "System" },
                    { value: "Employee", label: "Employee" },
                  ]}
                />
              </div>
              <div className="md:col-span-2">
                <Select
                  label="Module"
                  value={moduleFilter}
                  onChange={(v) => setModuleFilter(v as any)}
                  options={[
                    { value: "All", label: "All" },
                    { value: "Security", label: "Security" },
                    { value: "Billing", label: "Billing" },
                    { value: "System", label: "System" },
                    ...SERVICE_MODULES.map((m) => ({ value: m, label: m })),
                  ]}
                />
              </div>

              <div className="md:col-span-12 flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs text-slate-500">
                  Filtered audit entries: <span className="font-semibold text-slate-900">{filteredAudit.length}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEnvFilter("All");
                      setSevFilter("All");
                      setRoleFilter("All");
                      setModuleFilter("All");
                      setQ("");
                      toast({ title: "Reset", message: "Filters reset.", kind: "info" });
                    }}
                  >
                    <Filter className="h-4 w-4" /> Reset
                  </Button>
                  <Button variant="outline" onClick={() => setForensicModalOpen(true)}>
                    <Database className="h-4 w-4" /> Forensic export
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="bg-slate-50 px-4 py-5 md:px-6">
            {tab === "overview" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-8 space-y-4">
                  <Section title="Security posture" subtitle="Core controls plus premium compliance." right={<Pill label="Core" tone="neutral" />}>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                      <KPI title="Audit" value={`${auditsToday}`} sub="Today" icon={<FileText className="h-5 w-5" />} tone="neutral" />
                      <KPI title="MFA coverage" value={`${securityKpis.mfa}%`} sub="Privileged roles" icon={<Fingerprint className="h-5 w-5" />} tone={securityKpis.mfa >= 100 ? "good" : "warn"} />
                      <KPI title="Device trust" value={`${securityKpis.trustPct}%`} sub="Trusted devices" icon={<Laptop className="h-5 w-5" />} tone={securityKpis.trustPct >= 70 ? "good" : "warn"} />
                      <KPI title="Compliance" value={`${expiringDocs.length}`} sub="Docs needing action" icon={<Shield className="h-5 w-5" />} tone={expiringDocs.length ? "warn" : "good"} />
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <Section title="Latest audit events" subtitle="Recent security and compliance activity" right={<Pill label="Core" tone="neutral" />}>
                        <div className="space-y-2">
                          {filteredAudit.slice(0, 6).map((a) => (
                            <button
                              key={a.id}
                              type="button"
                              className="w-full rounded-3xl border border-slate-200 bg-white p-4 text-left hover:bg-slate-50"
                              onClick={() => openAudit(a.id)}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <Pill label={a.severity} tone={toneForSeverity(a.severity)} />
                                    <Pill label={a.env} tone={a.env === "Sandbox" ? "info" : "neutral"} />
                                    <Pill label={a.role} tone="neutral" />
                                  </div>
                                  <div className="mt-2 text-sm font-semibold text-slate-900">{a.summary}</div>
                                  <div className="mt-1 text-xs text-slate-500">{timeAgo(a.ts)} • {a.event} • {a.targetId}</div>
                                </div>
                                <ChevronRight className="h-5 w-5 text-slate-400" />
                              </div>
                            </button>
                          ))}
                          {!filteredAudit.length ? <Empty title="No audit data" subtitle="No events found." /> : null}
                        </div>
                        <div className="mt-3">
                          <Button variant="outline" className="w-full" onClick={() => setTab("audit")}> <ChevronRight className="h-4 w-4" /> Open audit logs</Button>
                        </div>
                      </Section>

                      <Section title="Risk hotspots" subtitle="Premium: dual control and expiring docs" right={<Pill label="Premium" tone="info" />}>
                        <div className="space-y-2">
                          <div className="rounded-3xl border border-slate-200 bg-white p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="text-sm font-semibold text-slate-900">Dual control pending</div>
                                <div className="mt-1 text-xs text-slate-500">Sensitive actions awaiting approvals</div>
                              </div>
                              <Pill label={`${pendingDual}`} tone={pendingDual ? "warn" : "good"} />
                            </div>
                            <div className="mt-3">
                              <Button variant="outline" className="w-full" onClick={() => setTab("dual")}> <ChevronRight className="h-4 w-4" /> Review requests</Button>
                            </div>
                          </div>

                          <div className="rounded-3xl border border-slate-200 bg-white p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="text-sm font-semibold text-slate-900">Vendor docs</div>
                                <div className="mt-1 text-xs text-slate-500">Expiring or expired</div>
                              </div>
                              <Pill label={`${expiringDocs.length}`} tone={expiringDocs.length ? "warn" : "good"} />
                            </div>
                            <div className="mt-3">
                              <Button variant="outline" className="w-full" onClick={() => setTab("compliance")}> <ChevronRight className="h-4 w-4" /> Open compliance</Button>
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                          Premium: dual control policies prevent accidental irreversible changes.
                        </div>
                      </Section>
                    </div>
                  </Section>
                </div>

                <div className="lg:col-span-4 space-y-4">
                  <Section title="Quick actions" subtitle="Common security operations" right={<Pill label="Core" tone="neutral" />}>
                    <div className="grid grid-cols-1 gap-2">
                      <Button variant="outline" onClick={() => setTab("mfa")}> <Fingerprint className="h-4 w-4" /> MFA policies</Button>
                      <Button variant="outline" onClick={() => setTab("retention")}> <Database className="h-4 w-4" /> Data retention</Button>
                      <Button variant="outline" onClick={() => setTab("support")}> <Shield className="h-4 w-4" /> Support mode</Button>
                      <Button variant="primary" onClick={() => setForensicModalOpen(true)}> <Database className="h-4 w-4" /> Forensic export</Button>
                    </div>
                    <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                      Tip: use Forensic exports only for investigations and keep dual control enabled.
                    </div>
                  </Section>

                  <Section title="Retention snapshot" subtitle="Top retention rules" right={<Pill label="Core" tone="neutral" />}>
                    <div className="space-y-2">
                      {retention.slice(0, 5).map((r) => (
                        <div key={r.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-slate-900">{r.category}</div>
                              <div className="mt-1 text-xs text-slate-500">{r.retentionDays} days • {r.purgeMode}</div>
                            </div>
                            <Pill label={r.legalHold ? "Legal hold" : "Normal"} tone={r.legalHold ? "warn" : "neutral"} />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3">
                      <Button variant="outline" className="w-full" onClick={() => setTab("retention")}> <ChevronRight className="h-4 w-4" /> Manage retention</Button>
                    </div>
                  </Section>
                </div>
              </div>
            ) : null}

            {tab === "audit" ? (
              <div className="grid grid-cols-1 gap-4">
                <Section title="Audit logs" subtitle="Core: every action is logged. Premium: forensic exports and immutable verification." right={<Pill label={`${filteredAudit.length}`} tone="neutral" />}>
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-slate-50 text-xs text-slate-600">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Time</th>
                          <th className="px-4 py-3 font-semibold">Severity</th>
                          <th className="px-4 py-3 font-semibold">Actor</th>
                          <th className="px-4 py-3 font-semibold">Event</th>
                          <th className="px-4 py-3 font-semibold">Target</th>
                          <th className="px-4 py-3 font-semibold">Module</th>
                          <th className="px-4 py-3 font-semibold">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAudit.slice(0, 60).map((a) => (
                          <tr key={a.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                            <td className="px-4 py-3 text-slate-700">{fmtDateTime(a.ts)}</td>
                            <td className="px-4 py-3"><Pill label={a.severity} tone={toneForSeverity(a.severity)} /></td>
                            <td className="px-4 py-3">
                              <div className="font-semibold text-slate-900">{a.actor}</div>
                              <div className="mt-1 text-xs text-slate-500">{a.role} • {a.env}</div>
                            </td>
                            <td className="px-4 py-3 text-slate-700">{a.event}</td>
                            <td className="px-4 py-3 text-slate-700">{a.targetType} • {a.targetId}</td>
                            <td className="px-4 py-3 text-slate-700">{a.module}{a.marketplace !== "-" ? ` • ${a.marketplace}` : ""}</td>
                            <td className="px-4 py-3">
                              <Button variant="primary" className="px-3 py-2 text-xs" onClick={() => openAudit(a.id)}>
                                <ChevronRight className="h-4 w-4" /> Open
                              </Button>
                            </td>
                          </tr>
                        ))}
                        {!filteredAudit.length ? (
                          <tr>
                            <td colSpan={7} className="px-4 py-10">
                              <Empty title="No events" subtitle="No audit events match your filters." />
                            </td>
                          </tr>
                        ) : null}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Button variant="outline" onClick={exportAuditCSV}>
                      <Download className="h-4 w-4" /> Export CSV
                    </Button>
                    <Button variant="outline" onClick={exportAuditJSON}>
                      <Download className="h-4 w-4" /> Export JSON
                    </Button>
                    <Button variant="primary" onClick={() => setForensicModalOpen(true)}>
                      <Database className="h-4 w-4" /> Forensic export
                    </Button>
                  </div>
                </Section>
              </div>
            ) : null}

            {tab === "mfa" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-5 space-y-4">
                  <Section title="MFA policies" subtitle="Core: MFA policies and device trust" right={<Pill label="Core" tone="neutral" />}>
                    <div className="grid grid-cols-1 gap-3">
                      <Toggle enabled={mfaPolicy.requireMfaOrgAdmin} onChange={(v) => setMfaPolicy((p) => ({ ...p, requireMfaOrgAdmin: v }))} label="Require MFA for Org Admin" description="Strongly recommended" />
                      <Toggle enabled={mfaPolicy.requireMfaFinance} onChange={(v) => setMfaPolicy((p) => ({ ...p, requireMfaFinance: v }))} label="Require MFA for Finance" description="Recommended" />
                      <Toggle enabled={mfaPolicy.requireMfaApprover} onChange={(v) => setMfaPolicy((p) => ({ ...p, requireMfaApprover: v }))} label="Require MFA for Approver" description="Recommended" />
                      <Toggle enabled={mfaPolicy.requireMfaSupport} onChange={(v) => setMfaPolicy((p) => ({ ...p, requireMfaSupport: v }))} label="Require MFA for EVzone Support" description="Required for support mode" />
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                      <NumberField label="Trust device days" value={mfaPolicy.trustDeviceDays} onChange={(v) => setMfaPolicy((p) => ({ ...p, trustDeviceDays: clamp(v, 1, 180) }))} hint="1-180" />
                      <Field label="IP allowlist" value={mfaPolicy.ipAllowlist} onChange={(v) => setMfaPolicy((p) => ({ ...p, ipAllowlist: v }))} placeholder="Optional" hint="CIDR" />
                      <div className="md:col-span-2 grid grid-cols-1 gap-3">
                        <Toggle enabled={mfaPolicy.requireStepUpNewDevice} onChange={(v) => setMfaPolicy((p) => ({ ...p, requireStepUpNewDevice: v }))} label="Step-up on new device" description="Force MFA on new device sign-in" />
                        <Toggle enabled={mfaPolicy.requireStepUpSensitive} onChange={(v) => setMfaPolicy((p) => ({ ...p, requireStepUpSensitive: v }))} label="Step-up on sensitive actions" description="Extra challenge for retention, keys, exports" />
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Button variant="primary" onClick={updateMfaPolicy}>
                        <BadgeCheck className="h-4 w-4" /> Save policy
                      </Button>
                      <Button variant="outline" onClick={() => toast({ title: "Break-glass", message: "Break-glass controls live in admin security console (demo).", kind: "info" })}>
                        <Lock className="h-4 w-4" /> Break-glass
                      </Button>
                    </div>

                    <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                      Premium: conditional access policies like geo allowlist, time restrictions, and tamper alerts.
                    </div>
                  </Section>

                  <Section title="Login history" subtitle="Security events" right={<Pill label={`${loginHistory.length}`} tone="neutral" />}>
                    <div className="space-y-2">
                      {loginHistory.slice(0, 6).map((l) => (
                        <div key={l.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <Pill label={l.outcome} tone={l.outcome === "Success" ? "good" : l.outcome === "Blocked" ? "bad" : "warn"} />
                                <Pill label={l.role} tone="neutral" />
                              </div>
                              <div className="mt-2 text-sm font-semibold text-slate-900">{l.user}</div>
                              <div className="mt-1 text-xs text-slate-500">{fmtDateTime(l.at)} • {l.geo} • {l.ip}</div>
                              <div className="mt-1 text-xs text-slate-600">{l.device} • {l.note}</div>
                            </div>
                            <CalendarClock className="h-5 w-5 text-slate-400" />
                          </div>
                        </div>
                      ))}
                      {!loginHistory.length ? <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">No login events.</div> : null}
                    </div>
                  </Section>
                </div>

                <div className="lg:col-span-7 space-y-4">
                  <Section title="Device trust" subtitle="Trusted devices and session controls" right={<Pill label="Core" tone="neutral" />}>
                    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                      <table className="min-w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs text-slate-600">
                          <tr>
                            <th className="px-4 py-3 font-semibold">User</th>
                            <th className="px-4 py-3 font-semibold">Device</th>
                            <th className="px-4 py-3 font-semibold">Status</th>
                            <th className="px-4 py-3 font-semibold">Last seen</th>
                            <th className="px-4 py-3 font-semibold">Risk</th>
                            <th className="px-4 py-3 font-semibold">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {devices.map((d) => (
                            <tr key={d.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                              <td className="px-4 py-3">
                                <div className="font-semibold text-slate-900">{d.user}</div>
                                <div className="mt-1 text-xs text-slate-500">{d.role} • {d.geoLast}</div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2 text-slate-700">
                                  {d.deviceType === "Phone" ? <Smartphone className="h-4 w-4" /> : d.deviceType === "Laptop" ? <Laptop className="h-4 w-4" /> : <Terminal className="h-4 w-4" />}
                                  {d.device}
                                </div>
                                <div className="mt-1 text-xs text-slate-500">{d.ipLast}</div>
                              </td>
                              <td className="px-4 py-3">
                                <Pill label={d.status} tone={d.status === "Trusted" ? "good" : d.status === "Revoked" ? "bad" : "neutral"} />
                                {d.trustedUntil ? <div className="mt-1 text-xs text-slate-500">Until {fmtDateTime(d.trustedUntil)}</div> : null}
                              </td>
                              <td className="px-4 py-3 text-slate-700">{timeAgo(d.lastSeenAt)}</td>
                              <td className="px-4 py-3">
                                {d.riskSignals.length ? <Pill label={d.riskSignals[0]} tone="warn" /> : <Pill label="None" tone="good" />}
                                {d.riskSignals.length > 1 ? <div className="mt-1 text-xs text-slate-500">+{d.riskSignals.length - 1} more</div> : null}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex flex-wrap items-center gap-2">
                                  <Button
                                    variant="outline"
                                    className="px-3 py-2 text-xs"
                                    onClick={() => {
                                      toast({ title: "Signed out", message: "Forced sign-out executed (demo).", kind: "info" });
                                      logAudit({
                                        env: "Production",
                                        severity: "Warning",
                                        actor: viewAs,
                                        role: viewAs,
                                        ip: "-",
                                        device: "-",
                                        module: "Security",
                                        marketplace: "-",
                                        event: "Auth.Device.Revoked",
                                        targetType: "session",
                                        targetId: d.id,
                                        summary: "Forced sign-out",
                                        metadata: { deviceId: d.id },
                                      });
                                    }}
                                    disabled={d.status === "Revoked"}
                                  >
                                    <Lock className="h-4 w-4" /> Sign out
                                  </Button>
                                  <Button variant="danger" className="px-3 py-2 text-xs" onClick={() => revokeDevice(d.id)} disabled={d.status === "Revoked"}>
                                    <Trash2 className="h-4 w-4" /> Revoke
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {!devices.length ? (
                            <tr>
                              <td colSpan={6} className="px-4 py-10">
                                <Empty title="No devices" subtitle="No device trust records found." />
                              </td>
                            </tr>
                          ) : null}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                      Premium: conditional access includes geo allowlist, impossible travel checks, and tamper alert exports.
                    </div>
                  </Section>
                </div>
              </div>
            ) : null}

            {tab === "retention" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-4 space-y-4">
                  <Section title="Retention settings" subtitle="Core: data retention settings" right={<Pill label="Core" tone="neutral" />}>
                    <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-700 ring-1 ring-slate-200">
                      Retention applies per category. Legal hold prevents deletion. Use archive for audit grade categories.
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Button variant="primary" onClick={applyRetentionChanges}>
                        <BadgeCheck className="h-4 w-4" /> Apply
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          // Preview only
                          const estimate = retention.reduce((a, r) => a + Math.round(2000 / Math.max(30, r.retentionDays)), 0);
                          toast({ title: "Preview", message: `Estimated purge impact: ${formatNumber(estimate)} records.`, kind: "info" });
                        }}
                      >
                        <Search className="h-4 w-4" /> Preview purge
                      </Button>
                    </div>
                    <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                      Premium: forensic exports are tamper-evident and suitable for investigations.
                    </div>
                  </Section>

                  <Section title="Legal hold" subtitle="Prevent deletion" right={<Pill label="Core" tone="neutral" />}>
                    <div className="space-y-2">
                      {retention.filter((r) => r.legalHold).length ? (
                        retention
                          .filter((r) => r.legalHold)
                          .map((r) => (
                            <div key={r.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="text-sm font-semibold text-slate-900">{r.category}</div>
                                  <div className="mt-1 text-xs text-slate-500">Hold active</div>
                                </div>
                                <Pill label="Legal hold" tone="warn" />
                              </div>
                            </div>
                          ))
                      ) : (
                        <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">No legal holds enabled.</div>
                      )}
                    </div>
                  </Section>
                </div>

                <div className="lg:col-span-8 space-y-4">
                  <Section title="Retention rules" subtitle="Edit days, legal hold, and purge mode" right={<Pill label={`${retention.length}`} tone="neutral" />}>
                    <div className="space-y-2">
                      {retention.map((r) => (
                        <div key={r.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="text-sm font-semibold text-slate-900">{r.category}</div>
                                <Pill label={r.purgeMode} tone="neutral" />
                                <Pill label={r.legalHold ? "Legal hold" : "Normal"} tone={r.legalHold ? "warn" : "neutral"} />
                                <Pill label={r.id} tone="neutral" />
                              </div>
                              <div className="mt-1 text-xs text-slate-500">Last purge: {r.lastPurgeAt ? fmtDateTime(r.lastPurgeAt) : "Never"}</div>
                              {r.notes ? <div className="mt-2 text-xs text-slate-600">{r.notes}</div> : null}
                            </div>

                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                              <NumberField
                                label="Days"
                                value={r.retentionDays}
                                onChange={(v) => setRetention((p) => p.map((x) => (x.id === r.id ? { ...x, retentionDays: clamp(v, 1, 3650) } : x)))}
                                hint="1-3650"
                              />
                              <Select
                                label="Mode"
                                value={r.purgeMode}
                                onChange={(v) => setRetention((p) => p.map((x) => (x.id === r.id ? { ...x, purgeMode: v as any } : x)))}
                                options={[{ value: "Soft delete", label: "Soft delete" }, { value: "Hard delete", label: "Hard delete" }, { value: "Archive", label: "Archive" }]}
                              />
                              <div className="mt-6">
                                <Toggle
                                  enabled={r.legalHold}
                                  onChange={(v) => setRetention((p) => p.map((x) => (x.id === r.id ? { ...x, legalHold: v } : x)))}
                                  label="Hold"
                                  description=""
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {!retention.length ? <Empty title="No rules" subtitle="No retention rules configured." /> : null}
                    </div>

                    <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                      Core: retention settings. Premium: dual control for changes and tamper-evident forensic exports.
                    </div>
                  </Section>
                </div>
              </div>
            ) : null}

            {tab === "support" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-5 space-y-4">
                  <Section title="Support mode" subtitle="Core: support mode gating, no silent actions" right={<Pill label="Core" tone="neutral" />}>
                    <div className="rounded-3xl border border-slate-200 bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">EVzone Support access</div>
                          <div className="mt-1 text-xs text-slate-500">Role-gated support sign-in. Writes require approvals.</div>
                        </div>
                        <Pill label={supportModeEnabled ? "Enabled" : "Disabled"} tone={supportModeEnabled ? "good" : "warn"} />
                      </div>
                      <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                        Rules:
                        <ul className="mt-2 space-y-1">
                          <li>1) View-only by default</li>
                          <li>2) No silent actions</li>
                          <li>3) Step-up authentication for sensitive actions</li>
                          <li>4) Always audited and visible to org admins</li>
                        </ul>
                      </div>
                      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                        <Button variant="primary" onClick={() => requestSupportToggle("enable")} disabled={supportModeEnabled}>
                          <Shield className="h-4 w-4" /> Enable
                        </Button>
                        <Button variant="danger" onClick={() => requestSupportToggle("disable")} disabled={!supportModeEnabled}>
                          <Shield className="h-4 w-4" /> Disable
                        </Button>
                      </div>
                    </div>

                    <Section title="Support sessions" subtitle="Active and recent" right={<Pill label={`${supportSessions.length}`} tone="neutral" />}>
                      <div className="space-y-2">
                        {supportSessions.map((s) => (
                          <div key={s.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <Pill label={s.env} tone={s.env === "Sandbox" ? "info" : "neutral"} />
                                  <Pill label={s.endedAt ? "Closed" : "Active"} tone={s.endedAt ? "neutral" : "info"} />
                                  <Pill label={s.writeEnabled ? "Write enabled" : "View only"} tone={s.writeEnabled ? "warn" : "neutral"} />
                                  <Pill label={s.id} tone="neutral" />
                                </div>
                                <div className="mt-2 text-sm font-semibold text-slate-900">{s.agent}</div>
                                <div className="mt-1 text-xs text-slate-500">Started {timeAgo(s.startedAt)} • Reason: {s.reason}</div>
                                {s.writeRequests.length ? <div className="mt-2 text-xs text-slate-600">Write requests: {s.writeRequests.join(", ")}</div> : null}
                              </div>
                              {!s.endedAt ? (
                                <Button
                                  variant="outline"
                                  className="px-3 py-2 text-xs"
                                  onClick={() => {
                                    setSupportSessions((p) => p.map((x) => (x.id === s.id ? { ...x, endedAt: Date.now() } : x)));
                                    logAudit({
                                      env: s.env,
                                      severity: "Info",
                                      actor: viewAs,
                                      role: viewAs,
                                      ip: "-",
                                      device: "-",
                                      module: "System",
                                      marketplace: "-",
                                      event: "Support.Session.End",
                                      targetType: "support_session",
                                      targetId: s.id,
                                      summary: "Support session ended",
                                      metadata: {},
                                    });
                                    toast({ title: "Closed", message: "Session ended.", kind: "success" });
                                  }}
                                >
                                  <X className="h-4 w-4" /> End
                                </Button>
                              ) : null}
                            </div>
                          </div>
                        ))}
                        {!supportSessions.length ? <Empty title="No sessions" subtitle="No support sessions." /> : null}
                      </div>
                    </Section>
                  </Section>
                </div>

                <div className="lg:col-span-7 space-y-4">
                  <Section title="Support write requests" subtitle="Premium: dual control gating" right={<Pill label="Premium" tone="info" />}>
                    <div className="space-y-2">
                      {dualRequests
                        .filter((r) => r.actionKey === "support_write_action")
                        .map((r) => (
                          <div key={r.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <Pill label={r.env} tone={r.env === "Sandbox" ? "info" : "neutral"} />
                                  <Pill label={r.status} tone={r.status === "Approved" ? "good" : r.status === "Rejected" ? "bad" : "warn"} />
                                  <Pill label={r.id} tone="neutral" />
                                  <Pill label={`${r.approvals.length}/${r.required} approvals`} tone="neutral" />
                                </div>
                                <div className="mt-2 text-sm font-semibold text-slate-900">{r.reason}</div>
                                <div className="mt-1 text-xs text-slate-500">Requested {timeAgo(r.createdAt)} by {r.requestedBy}</div>
                                {r.approvals.length ? <div className="mt-2 text-xs text-slate-600">Approvals: {r.approvals.map((a) => `${a.by}`).join(", ")}</div> : <div className="mt-2 text-xs text-slate-600">No approvals yet.</div>}
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                <Button
                                  variant="primary"
                                  className="px-3 py-2 text-xs"
                                  onClick={() => approveDualRequest(r.id)}
                                  disabled={viewAs === "EVzone Support" || r.status !== "Pending"}
                                  title={viewAs === "EVzone Support" ? "Support cannot approve" : "Approve"}
                                >
                                  <Check className="h-4 w-4" /> Approve
                                </Button>
                                <Button
                                  variant="outline"
                                  className="px-3 py-2 text-xs"
                                  onClick={() => rejectDualRequest(r.id)}
                                  disabled={viewAs === "EVzone Support" || r.status !== "Pending"}
                                >
                                  <X className="h-4 w-4" /> Reject
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      {!dualRequests.filter((r) => r.actionKey === "support_write_action").length ? (
                        <Empty title="No requests" subtitle="No support write requests." />
                      ) : null}
                    </div>
                    <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                      Support mode gating: EVzone Support cannot silently change anything. Every write action must be requested and approved.
                    </div>
                  </Section>
                </div>
              </div>
            ) : null}

            {tab === "dual" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-5 space-y-4">
                  <Section title="Dual control policies" subtitle="Premium: two-person control for sensitive actions" right={<Pill label="Premium" tone="info" />}>
                    <div className="space-y-2">
                      {dualPolicies.map((p) => (
                        <div key={p.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="text-sm font-semibold text-slate-900">{p.title}</div>
                                <Pill label={p.enabled ? "Enabled" : "Disabled"} tone={p.enabled ? "good" : "neutral"} />
                                <Pill label={`${p.approversRequired} approver(s)`} tone="neutral" />
                                {p.stepUpMfaRequired ? <Pill label="Step-up MFA" tone="info" /> : <Pill label="No step-up" tone="neutral" />}
                              </div>
                              <div className="mt-2 text-xs text-slate-600">{p.notes}</div>
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                <Toggle
                                  enabled={p.enabled}
                                  onChange={(v) => {
                                    setDualPolicies((prev) => prev.map((x) => (x.id === p.id ? { ...x, enabled: v } : x)));
                                    logAudit({
                                      env: "Production",
                                      severity: "Info",
                                      actor: viewAs,
                                      role: viewAs,
                                      ip: "-",
                                      device: "-",
                                      module: "Security",
                                      marketplace: "-",
                                      event: "Policy.DualControl.Updated",
                                      targetType: "dual_control_policy",
                                      targetId: p.id,
                                      summary: "Dual control policy updated",
                                      metadata: { actionKey: p.actionKey, enabled: v },
                                    });
                                    toast({ title: "Updated", message: "Policy updated.", kind: "success" });
                                  }}
                                  label="Enabled"
                                />
                                <Select
                                  label="Approvers"
                                  value={`${p.approversRequired}`}
                                  onChange={(v) => {
                                    const required = (Number(v) as 2 | 3) || 2;
                                    setDualPolicies((prev) => prev.map((x) => (x.id === p.id ? { ...x, approversRequired: required } : x)));
                                  }}
                                  options={[{ value: "2", label: "2" }, { value: "3", label: "3" }]}
                                />
                              </div>
                            </div>
                            <Shield className="h-5 w-5 text-slate-400" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </Section>

                  <Section title="Simulation" subtitle="See what a sensitive action would require" right={<Pill label="Premium" tone="info" />}>
                    <div className="rounded-3xl border border-slate-200 bg-white p-4">
                      <div className="text-sm font-semibold text-slate-900">Scenario</div>
                      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                        <Select
                          label="Action"
                          value={"forensic_export_prod"}
                          onChange={() => {}}
                          options={[
                            { value: "forensic_export_prod", label: "Forensic export (production)" },
                            { value: "retention_change", label: "Change retention" },
                            { value: "mfa_policy_change", label: "Change MFA policy" },
                            { value: "support_write_action", label: "Support write action" },
                            { value: "rotate_prod_key", label: "Rotate production keys" },
                          ]}
                          disabled
                        />
                        <Select label="Environment" value="Production" onChange={() => {}} options={[{ value: "Production", label: "Production" }]} disabled />
                      </div>
                      <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                        With dual control enabled: two approvals and step-up MFA are required before export.
                      </div>
                    </div>
                  </Section>
                </div>

                <div className="lg:col-span-7 space-y-4">
                  <Section title="Requests" subtitle="Approve or reject" right={<Pill label={`${dualRequests.length}`} tone="neutral" />}>
                    <div className="space-y-2">
                      {dualRequests.map((r) => (
                        <div key={r.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <Pill label={r.env} tone={r.env === "Sandbox" ? "info" : "neutral"} />
                                <Pill label={r.status} tone={r.status === "Approved" ? "good" : r.status === "Rejected" ? "bad" : "warn"} />
                                <Pill label={r.actionKey} tone="neutral" />
                                <Pill label={`${r.approvals.length}/${r.required} approvals`} tone="neutral" />
                                <Pill label={r.id} tone="neutral" />
                              </div>
                              <div className="mt-2 text-sm font-semibold text-slate-900">{r.reason}</div>
                              <div className="mt-1 text-xs text-slate-500">Requested {timeAgo(r.createdAt)} by {r.requestedBy}</div>
                              {r.approvals.length ? (
                                <div className="mt-2 text-xs text-slate-600">Approvals: {r.approvals.map((a) => `${a.by}`).join(", ")}</div>
                              ) : (
                                <div className="mt-2 text-xs text-slate-600">No approvals yet.</div>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Button variant="primary" className="px-3 py-2 text-xs" onClick={() => approveDualRequest(r.id)} disabled={viewAs === "EVzone Support" || r.status !== "Pending"}>
                                <Check className="h-4 w-4" /> Approve
                              </Button>
                              <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => rejectDualRequest(r.id)} disabled={viewAs === "EVzone Support" || r.status !== "Pending"}>
                                <X className="h-4 w-4" /> Reject
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {!dualRequests.length ? <Empty title="No requests" subtitle="No dual control requests." /> : null}
                    </div>
                  </Section>
                </div>
              </div>
            ) : null}

            {tab === "forensics" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-5 space-y-4">
                  <Section title="Forensic exports" subtitle="Premium: tamper-evident exports" right={<Pill label="Premium" tone="info" />}>
                    <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-700 ring-1 ring-slate-200">
                      Forensic exports create a hash chain over selected audit entries. Verification recomputes the chain.
                    </div>
                    <div className="mt-3 grid grid-cols-1 gap-2">
                      <Button variant="primary" onClick={() => setForensicModalOpen(true)}>
                        <Database className="h-4 w-4" /> New forensic export
                      </Button>
                      <Button variant="outline" onClick={() => toast({ title: "Tip", message: "Keep dual control enabled for production exports.", kind: "info" })}>
                        <Info className="h-4 w-4" /> Tip
                      </Button>
                    </div>
                    <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                      Premium: forensic exports can be used for investigations and compliance audits.
                    </div>
                  </Section>
                </div>

                <div className="lg:col-span-7 space-y-4">
                  <Section title="Export jobs" subtitle="Create, download, verify" right={<Pill label={`${forensicExports.length}`} tone="neutral" />}>
                    <div className="space-y-2">
                      {forensicExports.map((f) => (
                        <div key={f.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <Pill label={f.env} tone={f.env === "Sandbox" ? "info" : "neutral"} />
                                <Pill label={f.status} tone={f.status === "Ready" ? "good" : "bad"} />
                                <Pill label={f.algo} tone="neutral" />
                                {typeof f.verifiedOk === "boolean" ? <Pill label={f.verifiedOk ? "Verified" : "Mismatch"} tone={f.verifiedOk ? "good" : "bad"} /> : <Pill label="Not verified" tone="neutral" />}
                                <Pill label={f.id} tone="neutral" />
                              </div>
                              <div className="mt-2 text-sm font-semibold text-slate-900">{f.rangeLabel} • {f.recordCount} record(s)</div>
                              <div className="mt-1 text-xs text-slate-500">Created {timeAgo(f.createdAt)} by {f.createdBy}</div>
                              <div className="mt-2 text-xs text-slate-600">Final hash: <span className="font-mono">{f.finalHash.slice(0, 10)}…</span></div>
                              {f.verifiedAt ? <div className="mt-1 text-xs text-slate-500">Verified {timeAgo(f.verifiedAt)}</div> : null}
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => downloadForensicBundle(f.id)}>
                                <Download className="h-4 w-4" /> Download
                              </Button>
                              <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => verifyForensicExport(f.id)}>
                                <Check className="h-4 w-4" /> Verify
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {!forensicExports.length ? <Empty title="No forensic exports" subtitle="Create a forensic export to start." /> : null}
                    </div>
                  </Section>
                </div>
              </div>
            ) : null}

            {tab === "compliance" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-5 space-y-4">
                  <Section title="Compliance center" subtitle="Premium: attestations and vendor docs" right={<Pill label="Premium" tone="info" />}>
                    <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-700 ring-1 ring-slate-200">
                      Keep policy attestations current and vendor compliance documents valid.
                    </div>
                    <div className="mt-3 grid grid-cols-1 gap-2">
                      <Button
                        variant="primary"
                        onClick={() => {
                          setVendorDocDraft({ vendor: "", docType: "License", fileName: "", expiryDate: "", verified: false, notes: "" });
                          setVendorDocModalOpen(true);
                        }}
                      >
                        <Plus className="h-4 w-4" /> Add vendor doc
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setAttestDraft({ attId: attestations[0]?.id || "ATT-001", confirm: false, note: "" });
                          setAttestModalOpen(true);
                        }}
                      >
                        <BadgeCheck className="h-4 w-4" /> Attest policy
                      </Button>
                    </div>
                    <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                      Premium: store evidence attachments and expiry alerts in Notifications Center.
                    </div>
                  </Section>

                  <Section title="Policy attestations" subtitle="Track completion by role" right={<Pill label={`${attestations.length}`} tone="neutral" />}>
                    <div className="space-y-2">
                      {attestations.map((a) => {
                        const required = a.requiredForRoles.includes(viewAs);
                        const done = a.completion.some((c) => c.user === viewAs);
                        const dueSoon = a.dueBy ? a.dueBy < Date.now() + 7 * 24 * 60 * 60 * 1000 : false;
                        return (
                          <div key={a.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <div className="text-sm font-semibold text-slate-900">{a.policyName}</div>
                                  <Pill label={a.version} tone="neutral" />
                                  {required ? <Pill label="Required" tone="warn" /> : <Pill label="Optional" tone="neutral" />}
                                  {done ? <Pill label="Done" tone="good" /> : <Pill label="Pending" tone={required ? "warn" : "neutral"} />}
                                  {dueSoon ? <Pill label="Due soon" tone="warn" /> : null}
                                </div>
                                <div className="mt-1 text-xs text-slate-500">Updated {timeAgo(a.lastUpdatedAt)} • Completed {a.completion.length}</div>
                                {a.dueBy ? <div className="mt-1 text-xs text-slate-600">Due by {fmtDateTime(a.dueBy)}</div> : null}
                              </div>
                              <Button
                                variant="outline"
                                className="px-3 py-2 text-xs"
                                onClick={() => {
                                  setAttestDraft({ attId: a.id, confirm: false, note: "" });
                                  setAttestModalOpen(true);
                                }}
                                disabled={done}
                              >
                                <BadgeCheck className="h-4 w-4" /> Attest
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                      {!attestations.length ? <Empty title="No policies" subtitle="No attestations configured." /> : null}
                    </div>
                  </Section>
                </div>

                <div className="lg:col-span-7 space-y-4">
                  <Section title="Vendor compliance docs" subtitle="Licenses, insurance, and more" right={<Pill label={`${vendorDocs.length}`} tone="neutral" />}>
                    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                      <table className="min-w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs text-slate-600">
                          <tr>
                            <th className="px-4 py-3 font-semibold">Vendor</th>
                            <th className="px-4 py-3 font-semibold">Doc</th>
                            <th className="px-4 py-3 font-semibold">Status</th>
                            <th className="px-4 py-3 font-semibold">Expiry</th>
                            <th className="px-4 py-3 font-semibold">Verified</th>
                            <th className="px-4 py-3 font-semibold">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {vendorDocs.map((d) => (
                            <tr key={d.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                              <td className="px-4 py-3">
                                <div className="font-semibold text-slate-900">{d.vendor}</div>
                                <div className="mt-1 text-xs text-slate-500">{d.id}</div>
                              </td>
                              <td className="px-4 py-3 text-slate-700">{d.docType} • {d.fileName}</td>
                              <td className="px-4 py-3"><Pill label={d.status} tone={toneForDocStatus(d.status)} /></td>
                              <td className="px-4 py-3 text-slate-700">{d.expiryDate ? fmtDateTime(d.expiryDate) : "-"}</td>
                              <td className="px-4 py-3"><Pill label={d.verified ? "Yes" : "No"} tone={d.verified ? "good" : "warn"} /></td>
                              <td className="px-4 py-3">
                                <div className="flex flex-wrap items-center gap-2">
                                  <Button
                                    variant="outline"
                                    className="px-3 py-2 text-xs"
                                    onClick={() => {
                                      setVendorDocs((p) => p.map((x) => (x.id === d.id ? { ...x, verified: !x.verified, uploadedAt: Date.now(), uploadedBy: viewAs } : x)));
                                      toast({ title: "Updated", message: "Verification updated.", kind: "success" });
                                      logAudit({
                                        env: "Production",
                                        severity: "Info",
                                        actor: viewAs,
                                        role: viewAs,
                                        ip: "-",
                                        device: "-",
                                        module: "Security",
                                        marketplace: "-",
                                        event: "Compliance.VendorDoc.Updated",
                                        targetType: "vendor_doc",
                                        targetId: d.id,
                                        summary: "Vendor doc verification updated",
                                        metadata: { verified: !d.verified },
                                      });
                                    }}
                                  >
                                    <Check className="h-4 w-4" /> Toggle verify
                                  </Button>
                                  <Button
                                    variant="danger"
                                    className="px-3 py-2 text-xs"
                                    onClick={() => {
                                      setVendorDocs((p) => p.filter((x) => x.id !== d.id));
                                      toast({ title: "Deleted", message: "Doc removed.", kind: "info" });
                                      logAudit({
                                        env: "Production",
                                        severity: "Warning",
                                        actor: viewAs,
                                        role: viewAs,
                                        ip: "-",
                                        device: "-",
                                        module: "Security",
                                        marketplace: "-",
                                        event: "Compliance.VendorDoc.Updated",
                                        targetType: "vendor_doc",
                                        targetId: d.id,
                                        summary: "Vendor doc deleted",
                                        metadata: {},
                                      });
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" /> Remove
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {!vendorDocs.length ? (
                            <tr>
                              <td colSpan={6} className="px-4 py-10">
                                <Empty title="No docs" subtitle="Add a vendor compliance doc." />
                              </td>
                            </tr>
                          ) : null}
                        </tbody>
                      </table>
                    </div>

                    {complianceMissing ? (
                      <div className="mt-3 rounded-2xl bg-rose-50 p-3 text-xs text-rose-800 ring-1 ring-rose-200">
                        Attention: {complianceMissing} vendor doc(s) are missing or expired.
                      </div>
                    ) : (
                      <div className="mt-3 rounded-2xl bg-emerald-50 p-3 text-xs text-emerald-900 ring-1 ring-emerald-200">
                        All critical vendor docs look healthy.
                      </div>
                    )}
                  </Section>
                </div>
              </div>
            ) : null}
          </div>

          <footer className="border-t border-slate-200 bg-white/60 py-6">
            <div className="mx-auto max-w-[1400px] px-4 text-xs text-slate-500 md:px-6">
              Z Security, Audit and Compliance v2. Core: audit logs, MFA policies, device trust, retention, support gating. Premium: dual-control policies, tamper-evident forensic exports, and compliance center.
            </div>
          </footer>
        </div>
      </div>

      {/* Audit details drawer */}
      <Drawer
        open={auditDrawerOpen}
        title={activeAudit ? `Audit ${activeAudit.id}` : "Audit"}
        subtitle={activeAudit ? `${activeAudit.event} • ${fmtDateTime(activeAudit.ts)}` : "Details"}
        onClose={() => setAuditDrawerOpen(false)}
        footer={
          activeAudit ? (
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
              <div className="text-xs text-slate-600">Core: every action logged. Premium: forensic exports for investigations.</div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  onClick={async () => {
                    if (!activeAudit) return;
                    try {
                      await navigator.clipboard.writeText(JSON.stringify(activeAudit, null, 2));
                      toast({ title: "Copied", message: "Audit JSON copied.", kind: "success" });
                    } catch {
                      toast({ title: "Copy failed", message: "Copy manually.", kind: "warn" });
                    }
                  }}
                >
                  <Copy className="h-4 w-4" /> Copy JSON
                </Button>
                <Button variant="primary" onClick={() => setForensicModalOpen(true)}>
                  <Database className="h-4 w-4" /> Forensic export
                </Button>
              </div>
            </div>
          ) : null
        }
      >
        {activeAudit ? (
          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Pill label={activeAudit.severity} tone={toneForSeverity(activeAudit.severity)} />
                <Pill label={activeAudit.env} tone={activeAudit.env === "Sandbox" ? "info" : "neutral"} />
                <Pill label={activeAudit.role} tone="neutral" />
                <Pill label={activeAudit.module} tone="neutral" />
                {activeAudit.marketplace !== "-" ? <Pill label={activeAudit.marketplace} tone="neutral" /> : null}
              </div>
              <div className="mt-2 text-sm font-semibold text-slate-900">{activeAudit.summary}</div>
              <div className="mt-1 text-xs text-slate-500">Actor: {activeAudit.actor} • IP {activeAudit.ip} • Device {activeAudit.device}</div>
              <div className="mt-1 text-xs text-slate-500">Target: {activeAudit.targetType} • {activeAudit.targetId}</div>
            </div>

            <Section title="Metadata" subtitle="Raw payload" right={<Pill label="Core" tone="neutral" />}>
              <pre className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800 overflow-auto">{JSON.stringify(activeAudit.metadata, null, 2)}</pre>
            </Section>

            {activeAudit.diff ? (
              <Section title="Diff" subtitle="Before and after" right={<Pill label="Core" tone="neutral" />}>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <pre className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800 overflow-auto">{JSON.stringify(activeAudit.diff.before, null, 2)}</pre>
                  <pre className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800 overflow-auto">{JSON.stringify(activeAudit.diff.after, null, 2)}</pre>
                </div>
              </Section>
            ) : null}

            <div className="rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
              Audit is linked to approvals and support actions. No silent actions are permitted.
            </div>
          </div>
        ) : null}
      </Drawer>

      {/* Support toggle modal */}
      <Modal
        open={supportToggleModal !== null}
        title={supportToggleModal === "enable" ? "Enable support mode" : "Disable support mode"}
        subtitle="Reason is required and always audited."
        onClose={() => setSupportToggleModal(null)}
        actions={[{ label: "Confirm", onClick: confirmSupportToggle, variant: supportToggleModal === "disable" ? "danger" : "default" }]}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setSupportToggleModal(null)}>Cancel</Button>
            <Button variant={supportToggleModal === "disable" ? "danger" : "primary"} onClick={confirmSupportToggle}>
              <Shield className="h-4 w-4" /> Confirm
            </Button>
          </div>
        }
      >
        <TextArea label="Reason" value={supportReason} onChange={setSupportReason} placeholder="Example: troubleshooting billing delivery" rows={4} />
        <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">If dual control is enabled, disabling support requires approvals.</div>
      </Modal>

      {/* Forensic export modal */}
      <Modal
        open={forensicModalOpen}
        title="Create forensic export"
        subtitle="Premium: tamper-evident export of audit logs."
        onClose={() => setForensicModalOpen(false)}
        actions={[{ label: "Generate", onClick: generateForensicExport }]}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setForensicModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={generateForensicExport}>
              <Database className="h-4 w-4" /> Generate
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Select
            label="Environment"
            value={forensicDraft.env}
            onChange={(v) => setForensicDraft((p) => ({ ...p, env: v as Env }))}
            options={[{ value: "Production", label: "Production" }, { value: "Sandbox", label: "Sandbox" }]}
            hint="Production may require approvals"
          />
          <Select
            label="Range"
            value={forensicDraft.range}
            onChange={(v) => setForensicDraft((p) => ({ ...p, range: v }))}
            options={[{ value: "Last 7 days", label: "Last 7 days" }, { value: "Last 30 days", label: "Last 30 days" }, { value: "Custom", label: "Custom" }]}
          />
          <div className="md:col-span-2">
            <TextArea
              label="Reason"
              value={forensicDraft.reason}
              onChange={(v) => setForensicDraft((p) => ({ ...p, reason: v }))}
              placeholder="Required for production exports"
              rows={4}
              hint="Audit logged"
            />
          </div>
          <div className="md:col-span-2 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
            Forensic export bundles include a manifest and a hash chain. Verification recomputes the chain.
          </div>
        </div>
      </Modal>

      {/* Vendor doc modal */}
      <Modal
        open={vendorDocModalOpen}
        title="Add vendor compliance doc"
        subtitle="Premium: store evidence and track expiry."
        onClose={() => setVendorDocModalOpen(false)}
        actions={[{ label: "Save", onClick: addVendorDoc }]}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setVendorDocModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={addVendorDoc}>
              <BadgeCheck className="h-4 w-4" /> Save
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Vendor" value={vendorDocDraft.vendor} onChange={(v) => setVendorDocDraft((p) => ({ ...p, vendor: v }))} placeholder="Vendor name" />
          <Select
            label="Doc type"
            value={vendorDocDraft.docType}
            onChange={(v) => setVendorDocDraft((p) => ({ ...p, docType: v as VendorDocType }))}
            options={[{ value: "License", label: "License" }, { value: "Insurance", label: "Insurance" }, { value: "Tax", label: "Tax" }, { value: "Safety", label: "Safety" }, { value: "Other", label: "Other" }]}
          />
          <Field label="File name" value={vendorDocDraft.fileName} onChange={(v) => setVendorDocDraft((p) => ({ ...p, fileName: v }))} placeholder="doc.pdf" hint="Simulated" />
          <Field label="Expiry" type="date" value={vendorDocDraft.expiryDate} onChange={(v) => setVendorDocDraft((p) => ({ ...p, expiryDate: v }))} hint="Optional" />
          <div className="md:col-span-2">
            <Toggle enabled={vendorDocDraft.verified} onChange={(v) => setVendorDocDraft((p) => ({ ...p, verified: v }))} label="Verified" description="Mark as verified after review" />
          </div>
          <div className="md:col-span-2">
            <TextArea label="Notes" value={vendorDocDraft.notes} onChange={(v) => setVendorDocDraft((p) => ({ ...p, notes: v }))} placeholder="Optional" rows={4} />
          </div>
        </div>
      </Modal>

      {/* Attestation modal */}
      <Modal
        open={attestModalOpen}
        title="Policy attestation"
        subtitle="Premium: policy attestations are auditable."
        onClose={() => setAttestModalOpen(false)}
        actions={[{ label: "Attest", onClick: attestPolicy }]}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setAttestModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={attestPolicy}>
              <BadgeCheck className="h-4 w-4" /> Attest
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4">
          <Select
            label="Policy"
            value={attestDraft.attId}
            onChange={(v) => setAttestDraft((p) => ({ ...p, attId: v }))}
            options={attestations.map((a) => ({ value: a.id, label: `${a.policyName} (${a.version})` }))}
          />
          <label className="flex items-start gap-3 rounded-3xl border border-slate-200 bg-white p-4">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-slate-300"
              checked={attestDraft.confirm}
              onChange={(e) => setAttestDraft((p) => ({ ...p, confirm: e.target.checked }))}
            />
            <div>
              <div className="text-sm font-semibold text-slate-900">Confirm</div>
              <div className="mt-1 text-xs text-slate-600">I have read and agree to follow this policy.</div>
            </div>
          </label>
          <TextArea label="Note" value={attestDraft.note} onChange={(v) => setAttestDraft((p) => ({ ...p, note: v }))} placeholder="Optional" rows={3} />
        </div>
      </Modal>
    </div>
  );

  function KPI({
    title,
    value,
    sub,
    icon,
    tone,
  }: {
    title: string;
    value: string;
    sub: string;
    icon: React.ReactNode;
    tone: "neutral" | "good" | "warn" | "bad" | "info";
  }) {
    const bg =
      tone === "good"
        ? "bg-emerald-50 text-emerald-700"
        : tone === "warn"
        ? "bg-amber-50 text-amber-800"
        : tone === "bad"
        ? "bg-rose-50 text-rose-700"
        : tone === "info"
        ? "bg-blue-50 text-blue-700"
        : "bg-slate-50 text-slate-700";

    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-semibold text-slate-500">{title}</div>
            <div className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{value}</div>
            <div className="mt-1 text-xs text-slate-600">{sub}</div>
          </div>
          <div className={cn("grid h-10 w-10 place-items-center rounded-2xl", bg)}>{icon}</div>
        </div>
      </div>
    );
  }
}
