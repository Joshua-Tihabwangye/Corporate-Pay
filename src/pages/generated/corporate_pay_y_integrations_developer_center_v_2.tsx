import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BadgeCheck,
  Check,
  ChevronRight,
  Copy,
  Download,
  FileText,
  GitBranch,
  Globe,
  Info,
  Key,
  Lock,
  Mail,
  Plus,
  RefreshCcw,
  Search,
  Settings2,
  Shield,
  Terminal,
  Trash2,
  X,
} from "lucide-react";

const EVZ = {
  green: "#03CD8C",
  orange: "#F77F00",
  grey: "#A6A6A6",
  light: "#F2F2F2",
};

type Env = "Production" | "Sandbox";

type ExportFormat = "CSV" | "JSON";

type ExportKind = "Transactions" | "Invoices" | "Approvals";

type ExportStatus = "Running" | "Ready" | "Failed";

type ApiKeyStatus = "Active" | "Revoked";

type WebhookStatus = "Enabled" | "Disabled";

type DeliveryStatus = "Success" | "Failed" | "Retrying";

type Scope =
  | "read:transactions"
  | "read:invoices"
  | "read:approvals"
  | "write:approvals"
  | "read:budgets"
  | "write:budgets"
  | "webhooks:read"
  | "webhooks:write"
  | "exports:read"
  | "exports:write";

type WebhookEvent =
  | "invoice.created"
  | "invoice.paid"
  | "approval.completed"
  | "limit.breached";

type ExportJob = {
  id: string;
  createdAt: number;
  createdBy: string;
  env: Env;
  kind: ExportKind;
  format: ExportFormat;
  status: ExportStatus;
  rangeLabel: string;
  rows: number;
  sizeKB: number;
  notes: string;
};

type ApiKeyRow = {
  id: string;
  name: string;
  env: Env;
  scopes: Scope[];
  status: ApiKeyStatus;
  createdAt: number;
  lastUsedAt?: number;
  keyPrefix: string;
  ipAllowlist: string;
};

type WebhookEndpoint = {
  id: string;
  env: Env;
  url: string;
  events: WebhookEvent[];
  status: WebhookStatus;
  createdAt: number;
  lastDeliveryAt?: number;
  secretHint: string;
  hmacEnabled: boolean;
  retryCount: number;
};

type WebhookDelivery = {
  id: string;
  env: Env;
  endpointId: string;
  at: number;
  event: WebhookEvent;
  status: DeliveryStatus;
  httpStatus: number;
  attempts: number;
  durationMs: number;
  requestId: string;
  responseSnippet: string;
  bodyPreview: Record<string, any>;
  headersPreview: Record<string, string>;
};

type IntegrationConfig = {
  apiBaseProd: string;
  apiBaseSandbox: string;
  webhookSigningAlgo: "HMAC-SHA256";
  rateLimitRpm: number;
  ipAllowlist: string;
  requireHmac: boolean;
  sandboxEnabled: boolean;
  webhookInspectorEnabled: boolean;
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

function shortId(id: string) {
  return id.length <= 10 ? id : `${id.slice(0, 6)}…${id.slice(-4)}`;
}

function maskSecret(s: string) {
  if (!s) return "";
  if (s.length <= 8) return "••••";
  return `${s.slice(0, 4)}••••${s.slice(-4)}`;
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
        <Terminal className="h-6 w-6" />
      </div>
      <div className="mt-3 text-sm font-semibold text-slate-900">{title}</div>
      <div className="mt-1 text-sm text-slate-600">{subtitle}</div>
    </div>
  );
}

function toneForDelivery(s: DeliveryStatus) {
  if (s === "Success") return "good" as const;
  if (s === "Retrying") return "warn" as const;
  return "bad" as const;
}

function toneForKeyStatus(s: ApiKeyStatus) {
  return s === "Active" ? ("good" as const) : ("neutral" as const);
}

function toneForWebhookStatus(s: WebhookStatus) {
  return s === "Enabled" ? ("good" as const) : ("neutral" as const);
}

function randomSecret(prefix: string) {
  const rand = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  return `${prefix}_${rand.slice(0, 24)}`;
}

function makeRequestId() {
  return `req_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

export default function CorporatePayIntegrationsDeveloperCenterV2() {
  const ALL_SCOPES: Array<{ scope: Scope; label: string; desc: string }> = [
    { scope: "read:transactions", label: "Read transactions", desc: "View wallet, charging, rides, and purchase ledger events" },
    { scope: "read:invoices", label: "Read invoices", desc: "Fetch invoices, statements, and line items" },
    { scope: "read:approvals", label: "Read approvals", desc: "Fetch approval requests and decision history" },
    { scope: "write:approvals", label: "Write approvals", desc: "Approve or reject requests via API" },
    { scope: "read:budgets", label: "Read budgets", desc: "Read group and user budgets, caps, and alerts" },
    { scope: "write:budgets", label: "Write budgets", desc: "Update budgets (recommended to restrict)" },
    { scope: "webhooks:read", label: "Read webhooks", desc: "List webhook endpoints and deliveries" },
    { scope: "webhooks:write", label: "Write webhooks", desc: "Create, update, rotate secrets, and delete endpoints" },
    { scope: "exports:read", label: "Read exports", desc: "List ERP export jobs and download results" },
    { scope: "exports:write", label: "Write exports", desc: "Create ERP export jobs" },
  ];

  const ALL_EVENTS: Array<{ ev: WebhookEvent; desc: string }> = [
    { ev: "invoice.created", desc: "Triggered when an invoice is created" },
    { ev: "invoice.paid", desc: "Triggered when an invoice is marked paid" },
    { ev: "approval.completed", desc: "Triggered when an approval flow completes" },
    { ev: "limit.breached", desc: "Triggered when a hard/soft limit is breached" },
  ];

  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = (t: Omit<Toast, "id">) => {
    const id = uid("toast");
    setToasts((p) => [{ id, ...t }, ...p].slice(0, 4));
    window.setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 3200);
  };

  const [cfg, setCfg] = useState<IntegrationConfig>(() => ({
    apiBaseProd: "https://api.evzone.example/corporatepay/v1",
    apiBaseSandbox: "https://sandbox-api.evzone.example/corporatepay/v1",
    webhookSigningAlgo: "HMAC-SHA256",
    rateLimitRpm: 300,
    ipAllowlist: "",
    requireHmac: true,
    sandboxEnabled: true,
    webhookInspectorEnabled: true,
  }));

  const [tab, setTab] = useState<"overview" | "exports" | "keys" | "webhooks" | "sandbox" | "sso">("overview");

  // Data
  const [exports, setExports] = useState<ExportJob[]>(() => {
    const now = Date.now();
    return [
      {
        id: "EXP-001",
        createdAt: now - 3 * 24 * 60 * 60 * 1000,
        createdBy: "Finance Desk",
        env: "Production",
        kind: "Invoices",
        format: "CSV",
        status: "Ready",
        rangeLabel: "Last 30 days",
        rows: 84,
        sizeKB: 92,
        notes: "Weekly AP pack",
      },
      {
        id: "EXP-002",
        createdAt: now - 1 * 24 * 60 * 60 * 1000,
        createdBy: "Finance Desk",
        env: "Production",
        kind: "Transactions",
        format: "JSON",
        status: "Ready",
        rangeLabel: "Last 7 days",
        rows: 260,
        sizeKB: 210,
        notes: "ERP sync",
      },
    ];
  });

  const [keys, setKeys] = useState<ApiKeyRow[]>(() => {
    const now = Date.now();
    return [
      {
        id: "KEY-001",
        name: "ERP sync",
        env: "Production",
        scopes: ["read:transactions", "read:invoices", "exports:read"],
        status: "Active",
        createdAt: now - 18 * 24 * 60 * 60 * 1000,
        lastUsedAt: now - 6 * 60 * 60 * 1000,
        keyPrefix: "cp_live_4f8a…",
        ipAllowlist: "10.0.0.0/24",
      },
      {
        id: "KEY-002",
        name: "Ops dashboard",
        env: "Sandbox",
        scopes: ["read:transactions", "read:approvals", "webhooks:read"],
        status: "Active",
        createdAt: now - 6 * 24 * 60 * 60 * 1000,
        lastUsedAt: now - 2 * 24 * 60 * 60 * 1000,
        keyPrefix: "cp_test_c21b…",
        ipAllowlist: "",
      },
      {
        id: "KEY-003",
        name: "Legacy key",
        env: "Production",
        scopes: ["read:transactions"],
        status: "Revoked",
        createdAt: now - 120 * 24 * 60 * 60 * 1000,
        lastUsedAt: now - 90 * 24 * 60 * 60 * 1000,
        keyPrefix: "cp_live_9a1c…",
        ipAllowlist: "",
      },
    ];
  });

  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>(() => {
    const now = Date.now();
    return [
      {
        id: "WH-001",
        env: "Production",
        url: "https://erp.acme.com/webhooks/evzone",
        events: ["invoice.created", "invoice.paid", "approval.completed"],
        status: "Enabled",
        createdAt: now - 25 * 24 * 60 * 60 * 1000,
        lastDeliveryAt: now - 45 * 60 * 1000,
        secretHint: "••••a9c3",
        hmacEnabled: true,
        retryCount: 5,
      },
      {
        id: "WH-002",
        env: "Sandbox",
        url: "https://requestbin.example/sandbox",
        events: ["limit.breached", "approval.completed"],
        status: "Enabled",
        createdAt: now - 3 * 24 * 60 * 60 * 1000,
        lastDeliveryAt: now - 10 * 60 * 1000,
        secretHint: "••••7b1d",
        hmacEnabled: true,
        retryCount: 3,
      },
    ];
  });

  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>(() => {
    const now = Date.now();
    return [
      {
        id: "DLV-1001",
        env: "Production",
        endpointId: "WH-001",
        at: now - 45 * 60 * 1000,
        event: "invoice.created",
        status: "Success",
        httpStatus: 200,
        attempts: 1,
        durationMs: 240,
        requestId: makeRequestId(),
        responseSnippet: "OK",
        bodyPreview: { event: "invoice.created", invoiceId: "INV-0083", amountUGX: 1280000, status: "sent" },
        headersPreview: { "x-evzone-signature": "sha256=…", "x-evzone-env": "production" },
      },
      {
        id: "DLV-1002",
        env: "Production",
        endpointId: "WH-001",
        at: now - 41 * 60 * 1000,
        event: "approval.completed",
        status: "Retrying",
        httpStatus: 502,
        attempts: 2,
        durationMs: 900,
        requestId: makeRequestId(),
        responseSnippet: "Bad gateway",
        bodyPreview: { event: "approval.completed", approvalId: "APR-221", outcome: "approved", amountUGX: 450000 },
        headersPreview: { "x-evzone-signature": "sha256=…", "x-evzone-env": "production" },
      },
      {
        id: "DLV-2001",
        env: "Sandbox",
        endpointId: "WH-002",
        at: now - 10 * 60 * 1000,
        event: "limit.breached",
        status: "Success",
        httpStatus: 200,
        attempts: 1,
        durationMs: 160,
        requestId: makeRequestId(),
        responseSnippet: "OK",
        bodyPreview: { event: "limit.breached", scope: "group", group: "Finance", pct: 102 },
        headersPreview: { "x-evzone-signature": "sha256=…", "x-evzone-env": "sandbox" },
      },
    ];
  });

  // UI helpers
  const activeKeys = useMemo(() => keys.filter((k) => k.status === "Active").length, [keys]);
  const activeWebhooks = useMemo(() => webhooks.filter((w) => w.status === "Enabled").length, [webhooks]);
  const lastExport = useMemo(() => exports.slice().sort((a, b) => b.createdAt - a.createdAt)[0] || null, [exports]);

  const [q, setQ] = useState("");
  const [envFilter, setEnvFilter] = useState<Env | "All">("All");

  // Key modal
  const [keyModalOpen, setKeyModalOpen] = useState(false);
  const [keyDraft, setKeyDraft] = useState<{ name: string; env: Env; ipAllowlist: string; scopes: Record<Scope, boolean> }>(() => {
    const base: Record<Scope, boolean> = {} as any;
    ALL_SCOPES.forEach((s) => (base[s.scope] = ["read:transactions", "read:invoices"].includes(s.scope)));
    return { name: "", env: "Production", ipAllowlist: "", scopes: base };
  });

  const [secretModalOpen, setSecretModalOpen] = useState(false);
  const [secretPayload, setSecretPayload] = useState<{ title: string; secret: string; hint: string } | null>(null);

  // Webhook modal
  const [whModalOpen, setWhModalOpen] = useState(false);
  const [whDraft, setWhDraft] = useState<{ env: Env; url: string; hmac: boolean; retryCount: number; events: Record<WebhookEvent, boolean> }>(() => {
    const base: Record<WebhookEvent, boolean> = {
      "invoice.created": true,
      "invoice.paid": true,
      "approval.completed": true,
      "limit.breached": true,
    };
    return { env: "Production", url: "", hmac: true, retryCount: 5, events: base };
  });

  // Export modal
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportDraft, setExportDraft] = useState<{ env: Env; kind: ExportKind; format: ExportFormat; range: "7d" | "30d" | "90d" | "custom"; from: string; to: string }>(() => {
    const to = new Date().toISOString().slice(0, 10);
    const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    return { env: "Production", kind: "Transactions", format: "CSV", range: "30d", from, to };
  });

  // Webhook inspector drawer
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [activeDeliveryId, setActiveDeliveryId] = useState<string | null>(null);
  const activeDelivery = useMemo(() => (activeDeliveryId ? deliveries.find((d) => d.id === activeDeliveryId) || null : null), [activeDeliveryId, deliveries]);

  // Sandbox
  const [sandbox, setSandbox] = useState(() => ({
    enabled: cfg.sandboxEnabled,
    routeWebhooksToInspector: true,
    testModeBanner: true,
  }));

  // Phase 2
  const [phase2, setPhase2] = useState(() => ({
    ssoGoogle: false,
    ssoMicrosoft: false,
    hrisImport: false,
  }));

  // Derived lists with filtering
  const filteredKeys = useMemo(() => {
    const query = q.trim().toLowerCase();
    return keys
      .filter((k) => (envFilter === "All" ? true : k.env === envFilter))
      .filter((k) => {
        if (!query) return true;
        const blob = `${k.name} ${k.id} ${k.env} ${k.status} ${k.scopes.join(" ")} ${k.ipAllowlist}`.toLowerCase();
        return blob.includes(query);
      })
      .slice()
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [keys, q, envFilter]);

  const filteredWebhooks = useMemo(() => {
    const query = q.trim().toLowerCase();
    return webhooks
      .filter((w) => (envFilter === "All" ? true : w.env === envFilter))
      .filter((w) => {
        if (!query) return true;
        const blob = `${w.url} ${w.id} ${w.env} ${w.events.join(" ")} ${w.status}`.toLowerCase();
        return blob.includes(query);
      })
      .slice()
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [webhooks, q, envFilter]);

  const filteredDeliveries = useMemo(() => {
    const query = q.trim().toLowerCase();
    return deliveries
      .filter((d) => (envFilter === "All" ? true : d.env === envFilter))
      .filter((d) => {
        if (!query) return true;
        const blob = `${d.id} ${d.endpointId} ${d.event} ${d.status} ${d.httpStatus} ${d.requestId}`.toLowerCase();
        return blob.includes(query);
      })
      .slice()
      .sort((a, b) => b.at - a.at);
  }, [deliveries, q, envFilter]);

  const filteredExports = useMemo(() => {
    const query = q.trim().toLowerCase();
    return exports
      .filter((e) => (envFilter === "All" ? true : e.env === envFilter))
      .filter((e) => {
        if (!query) return true;
        const blob = `${e.id} ${e.kind} ${e.format} ${e.status} ${e.rangeLabel} ${e.createdBy} ${e.notes}`.toLowerCase();
        return blob.includes(query);
      })
      .slice()
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [exports, q, envFilter]);

  // Actions
  const openCreateKey = () => {
    const base: Record<Scope, boolean> = {} as any;
    ALL_SCOPES.forEach((s) => (base[s.scope] = ["read:transactions", "read:invoices", "exports:read"].includes(s.scope)));
    setKeyDraft({ name: "", env: "Production", ipAllowlist: cfg.ipAllowlist, scopes: base });
    setKeyModalOpen(true);
  };

  const createKey = () => {
    if (keyDraft.name.trim().length < 3) {
      toast({ title: "Name required", message: "Enter a key name.", kind: "warn" });
      return;
    }

    const scopes = Object.entries(keyDraft.scopes)
      .filter(([, on]) => on)
      .map(([k]) => k as Scope);

    if (!scopes.length) {
      toast({ title: "Scopes required", message: "Select at least one scope.", kind: "warn" });
      return;
    }

    const secret = randomSecret(keyDraft.env === "Production" ? "cp_live" : "cp_test");
    const hint = maskSecret(secret);

    const row: ApiKeyRow = {
      id: uid("KEY"),
      name: keyDraft.name.trim(),
      env: keyDraft.env,
      scopes,
      status: "Active",
      createdAt: Date.now(),
      lastUsedAt: undefined,
      keyPrefix: `${secret.slice(0, 10)}…`,
      ipAllowlist: keyDraft.ipAllowlist.trim(),
    };

    setKeys((p) => [row, ...p]);

    setSecretPayload({ title: "API key created", secret, hint });
    setSecretModalOpen(true);

    toast({ title: "Created", message: "API key created. Copy the secret now.", kind: "success" });
    setKeyModalOpen(false);
  };

  const revokeKey = (id: string) => {
    setKeys((p) => p.map((k) => (k.id === id ? { ...k, status: "Revoked" } : k)));
    toast({ title: "Revoked", message: "API key revoked.", kind: "info" });
  };

  const rotateKey = (id: string) => {
    const k = keys.find((x) => x.id === id);
    if (!k) return;
    const secret = randomSecret(k.env === "Production" ? "cp_live" : "cp_test");
    const hint = maskSecret(secret);

    setKeys((p) =>
      p.map((x) =>
        x.id === id
          ? {
              ...x,
              keyPrefix: `${secret.slice(0, 10)}…`,
              lastUsedAt: undefined,
            }
          : x
      )
    );

    setSecretPayload({ title: "API key rotated", secret, hint });
    setSecretModalOpen(true);
    toast({ title: "Rotated", message: "Secret rotated. Copy the new secret.", kind: "success" });
  };

  const openCreateWebhook = () => {
    const base: Record<WebhookEvent, boolean> = {
      "invoice.created": true,
      "invoice.paid": true,
      "approval.completed": true,
      "limit.breached": true,
    };
    setWhDraft({ env: "Production", url: "", hmac: true, retryCount: 5, events: base });
    setWhModalOpen(true);
  };

  const createWebhook = () => {
    if (!whDraft.url.trim().startsWith("http")) {
      toast({ title: "Invalid URL", message: "Enter a valid https URL.", kind: "warn" });
      return;
    }

    const evs = Object.entries(whDraft.events)
      .filter(([, on]) => on)
      .map(([k]) => k as WebhookEvent);

    if (!evs.length) {
      toast({ title: "Events required", message: "Select at least one event.", kind: "warn" });
      return;
    }

    const secret = randomSecret(whDraft.env === "Production" ? "wh_live" : "wh_test");
    const hint = maskSecret(secret);

    const row: WebhookEndpoint = {
      id: uid("WH"),
      env: whDraft.env,
      url: whDraft.url.trim(),
      events: evs,
      status: "Enabled",
      createdAt: Date.now(),
      lastDeliveryAt: undefined,
      secretHint: hint,
      hmacEnabled: whDraft.hmac,
      retryCount: clamp(whDraft.retryCount, 0, 12),
    };

    setWebhooks((p) => [row, ...p]);
    setSecretPayload({ title: "Webhook secret created", secret, hint });
    setSecretModalOpen(true);

    toast({ title: "Created", message: "Webhook endpoint created.", kind: "success" });
    setWhModalOpen(false);
  };

  const toggleWebhook = (id: string) => {
    setWebhooks((p) => p.map((w) => (w.id === id ? { ...w, status: w.status === "Enabled" ? "Disabled" : "Enabled" } : w)));
  };

  const rotateWebhookSecret = (id: string) => {
    const w = webhooks.find((x) => x.id === id);
    if (!w) return;
    const secret = randomSecret(w.env === "Production" ? "wh_live" : "wh_test");
    const hint = maskSecret(secret);
    setWebhooks((p) => p.map((x) => (x.id === id ? { ...x, secretHint: hint } : x)));
    setSecretPayload({ title: "Webhook secret rotated", secret, hint });
    setSecretModalOpen(true);
    toast({ title: "Rotated", message: "Webhook secret rotated.", kind: "success" });
  };

  const deleteWebhook = (id: string) => {
    setWebhooks((p) => p.filter((w) => w.id !== id));
    setDeliveries((p) => p.filter((d) => d.endpointId !== id));
    toast({ title: "Deleted", message: "Webhook endpoint deleted.", kind: "info" });
  };

  const sendTestEvent = (endpointId: string, ev: WebhookEvent) => {
    const w = webhooks.find((x) => x.id === endpointId);
    if (!w) return;

    const ok = Math.random() < 0.86;
    const status: DeliveryStatus = ok ? "Success" : Math.random() < 0.5 ? "Retrying" : "Failed";
    const httpStatus = ok ? 200 : status === "Retrying" ? 502 : 400;
    const attempts = status === "Retrying" ? 2 : 1;

    const d: WebhookDelivery = {
      id: uid("DLV"),
      env: w.env,
      endpointId: w.id,
      at: Date.now(),
      event: ev,
      status,
      httpStatus,
      attempts,
      durationMs: Math.round(120 + Math.random() * 900),
      requestId: makeRequestId(),
      responseSnippet: ok ? "OK" : status === "Retrying" ? "Bad gateway" : "Bad request",
      bodyPreview:
        ev === "invoice.created"
          ? { event: ev, invoiceId: "INV-NEW", amountUGX: 980000, status: "sent" }
          : ev === "invoice.paid"
          ? { event: ev, invoiceId: "INV-NEW", paidAt: new Date().toISOString() }
          : ev === "approval.completed"
          ? { event: ev, approvalId: "APR-NEW", outcome: "approved", amountUGX: 250000 }
          : { event: ev, scope: "group", group: "Finance", pct: 101 },
      headersPreview: {
        "x-evzone-env": w.env.toLowerCase(),
        "x-evzone-signature": cfg.requireHmac ? "sha256=…" : "(disabled)",
        "x-evzone-request-id": makeRequestId(),
      },
    };

    setDeliveries((p) => [d, ...p].slice(0, 250));
    setWebhooks((p) => p.map((x) => (x.id === w.id ? { ...x, lastDeliveryAt: d.at } : x)));

    toast({ title: "Test sent", message: `${ev} sent to ${w.id}.`, kind: "success" });
  };

  const openExport = () => {
    const to = new Date().toISOString().slice(0, 10);
    const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    setExportDraft({ env: "Production", kind: "Transactions", format: "CSV", range: "30d", from, to });
    setExportModalOpen(true);
  };

  const runExport = () => {
    const id = uid("EXP");
    const rangeLabel =
      exportDraft.range === "custom" ? `${exportDraft.from} to ${exportDraft.to}` : exportDraft.range === "7d" ? "Last 7 days" : exportDraft.range === "90d" ? "Last 90 days" : "Last 30 days";

    const job: ExportJob = {
      id,
      createdAt: Date.now(),
      createdBy: "You",
      env: exportDraft.env,
      kind: exportDraft.kind,
      format: exportDraft.format,
      status: "Running",
      rangeLabel,
      rows: 0,
      sizeKB: 0,
      notes: "",
    };

    setExports((p) => [job, ...p]);
    setExportModalOpen(false);
    toast({ title: "Started", message: "Export job started.", kind: "info" });

    // simulate completion
    window.setTimeout(() => {
      setExports((p) =>
        p.map((x) => {
          if (x.id !== id) return x;
          const ok = Math.random() < 0.93;
          return {
            ...x,
            status: ok ? "Ready" : "Failed",
            rows: ok ? Math.round(80 + Math.random() * 600) : 0,
            sizeKB: ok ? Math.round(60 + Math.random() * 400) : 0,
            notes: ok ? "Ready for download" : "Exporter error (demo)",
          };
        })
      );
      toast({ title: "Export finished", message: okText(exports, id), kind: "success" });
    }, 850);
  };

  function okText(list: ExportJob[], id: string) {
    const row = list.find((x) => x.id === id);
    if (!row) return "Completed.";
    return "Completed.";
  }

  const downloadExport = (id: string) => {
    const e = exports.find((x) => x.id === id);
    if (!e || e.status !== "Ready") return;

    const payload = {
      meta: {
        exportId: e.id,
        env: e.env,
        kind: e.kind,
        format: e.format,
        range: e.rangeLabel,
        generatedAt: new Date().toISOString(),
      },
      rows: Array.from({ length: Math.min(20, Math.max(3, Math.round(3 + Math.random() * 8))) }).map((_, i) => ({
        id: `row_${i + 1}`,
        amountUGX: Math.round(10000 + Math.random() * 1200000),
        costCenter: "OPS-001",
        vendor: "EVzone",
        createdAt: new Date(Date.now() - i * 3600000).toISOString(),
      })),
    };

    if (e.format === "JSON") {
      const text = JSON.stringify(payload, null, 2);
      const blob = new Blob([text], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `export-${e.id}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Downloaded", message: "JSON export downloaded.", kind: "success" });
      return;
    }

    // CSV
    const cols = [
      { key: "id", label: "id" },
      { key: "amountUGX", label: "amount_ugx" },
      { key: "costCenter", label: "cost_center" },
      { key: "vendor", label: "vendor" },
      { key: "createdAt", label: "created_at" },
    ];
    const esc = (v: any) => {
      const s = String(v ?? "");
      if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };
    const head = cols.map((c) => esc(c.label)).join(",");
    const body = payload.rows.map((r) => cols.map((c) => esc((r as any)[c.key])).join(",")).join("\n");
    const csv = `${head}\n${body}`;

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `export-${e.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Downloaded", message: "CSV export downloaded.", kind: "success" });
  };

  const printOpenApi = () => {
    const payload = {
      openapi: "3.0.0",
      info: { title: "EVzone CorporatePay API", version: "v1" },
      servers: [{ url: cfg.apiBaseProd }, { url: cfg.apiBaseSandbox }],
      paths: {
        "/transactions": { get: { summary: "List transactions", security: [{ apiKey: [] }] } },
        "/invoices": { get: { summary: "List invoices", security: [{ apiKey: [] }] } },
        "/approvals": { get: { summary: "List approvals", security: [{ apiKey: [] }] } },
        "/webhooks": { get: { summary: "List webhooks", security: [{ apiKey: [] }] }, post: { summary: "Create webhook" } },
      },
      components: { securitySchemes: { apiKey: { type: "apiKey", in: "header", name: "Authorization" } } },
    };

    const text = JSON.stringify(payload, null, 2);
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "openapi-corporatepay.json";
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Downloaded", message: "OpenAPI JSON downloaded.", kind: "success" });
  };

  const copyToClipboard = async (text: string, okMsg: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied", message: okMsg, kind: "success" });
    } catch {
      toast({ title: "Copy failed", message: "Copy manually.", kind: "warn" });
    }
  };

  const keyCountByEnv = useMemo(() => {
    const prod = keys.filter((k) => k.env === "Production" && k.status === "Active").length;
    const sand = keys.filter((k) => k.env === "Sandbox" && k.status === "Active").length;
    return { prod, sand };
  }, [keys]);

  const whCountByEnv = useMemo(() => {
    const prod = webhooks.filter((w) => w.env === "Production" && w.status === "Enabled").length;
    const sand = webhooks.filter((w) => w.env === "Sandbox" && w.status === "Enabled").length;
    return { prod, sand };
  }, [webhooks]);

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
                  <Terminal className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">Integrations and Developer Center</div>
                  <div className="mt-1 text-xs text-slate-500">ERP exports, secure API keys, webhook automation, sandbox tools, and phase 2 SSO and HRIS.</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Pill label={`API keys: ${activeKeys} active`} tone={activeKeys ? "good" : "neutral"} />
                    <Pill label={`Webhooks: ${activeWebhooks} enabled`} tone={activeWebhooks ? "good" : "neutral"} />
                    <Pill label={`Sandbox: ${cfg.sandboxEnabled ? "On" : "Off"}`} tone={cfg.sandboxEnabled ? "info" : "neutral"} />
                    <Pill label={`HMAC: ${cfg.requireHmac ? "Required" : "Optional"}`} tone={cfg.requireHmac ? "info" : "neutral"} />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={printOpenApi}>
                  <Download className="h-4 w-4" /> OpenAPI
                </Button>
                <Button variant="outline" onClick={openExport}>
                  <Download className="h-4 w-4" /> New export
                </Button>
                <Button variant="outline" onClick={openCreateWebhook}>
                  <GitBranch className="h-4 w-4" /> New webhook
                </Button>
                <Button variant="primary" onClick={openCreateKey}>
                  <Key className="h-4 w-4" /> New API key
                </Button>
              </div>
            </div>

            {/* Tabs */}
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                { id: "overview", label: "Overview" },
                { id: "exports", label: "ERP exports" },
                { id: "keys", label: "API keys" },
                { id: "webhooks", label: "Webhooks" },
                { id: "sandbox", label: "Sandbox" },
                { id: "sso", label: "SSO and HRIS" },
              ].map((t) => (
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

            {/* Search */}
            <div className="mt-4 grid grid-cols-1 gap-3 rounded-3xl border border-slate-200 bg-white p-4 md:grid-cols-12">
              <div className="md:col-span-4">
                <div className="text-xs font-semibold text-slate-600">Search</div>
                <div className="mt-2 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5">
                  <Search className="h-4 w-4 text-slate-500" />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="key, webhook, export..."
                    className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
                  />
                  {q ? (
                    <button className="rounded-xl p-1 text-slate-500 hover:bg-slate-100" onClick={() => setQ("")} aria-label="Clear">
                      <X className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              </div>
              <div className="md:col-span-3">
                <Select
                  label="Environment"
                  value={envFilter}
                  onChange={(v) => setEnvFilter(v as any)}
                  options={[
                    { value: "All", label: "All" },
                    { value: "Production", label: "Production" },
                    { value: "Sandbox", label: "Sandbox" },
                  ]}
                />
              </div>
              <div className="md:col-span-5">
                <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-700 ring-1 ring-slate-200">
                  Base URLs: <span className="font-semibold">Prod</span> {cfg.apiBaseProd} • <span className="font-semibold">Sandbox</span> {cfg.apiBaseSandbox}
                </div>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="bg-slate-50 px-4 py-5 md:px-6">
            {tab === "overview" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-8 space-y-4">
                  <Section
                    title="Developer posture"
                    subtitle="Security, observability, and operational readiness."
                    right={<Pill label="Core" tone="neutral" />}
                  >
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                      <Stat title="Production keys" value={`${keyCountByEnv.prod}`} icon={<Key className="h-5 w-5" />} tone={keyCountByEnv.prod ? "good" : "neutral"} sub="Active" />
                      <Stat title="Sandbox keys" value={`${keyCountByEnv.sand}`} icon={<Terminal className="h-5 w-5" />} tone={cfg.sandboxEnabled ? "info" : "neutral"} sub="Active" />
                      <Stat title="Prod webhooks" value={`${whCountByEnv.prod}`} icon={<GitBranch className="h-5 w-5" />} tone={whCountByEnv.prod ? "good" : "neutral"} sub="Enabled" />
                      <Stat title="HMAC signing" value={cfg.requireHmac ? "On" : "Off"} icon={<Shield className="h-5 w-5" />} tone={cfg.requireHmac ? "info" : "neutral"} sub={cfg.webhookSigningAlgo} />
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                      <Section
                        title="ERP and accounting exports"
                        subtitle="CSV and JSON exports for ERP systems."
                        right={<Pill label="Core" tone="neutral" />}
                      >
                        <div className="space-y-2">
                          {filteredExports.slice(0, 4).map((e) => (
                            <div key={e.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <Pill label={e.env} tone={e.env === "Production" ? "neutral" : "info"} />
                                    <Pill label={e.kind} tone="neutral" />
                                    <Pill label={e.format} tone="info" />
                                    <Pill label={e.status} tone={e.status === "Ready" ? "good" : e.status === "Failed" ? "bad" : "warn"} />
                                  </div>
                                  <div className="mt-2 text-sm font-semibold text-slate-900">{e.id} • {e.rangeLabel}</div>
                                  <div className="mt-1 text-xs text-slate-500">Created {timeAgo(e.createdAt)} • {e.createdBy}</div>
                                </div>
                                <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => downloadExport(e.id)} disabled={e.status !== "Ready"}>
                                  <Download className="h-4 w-4" /> Download
                                </Button>
                              </div>
                              <div className="mt-2 text-xs text-slate-600">Rows {e.rows} • Size {e.sizeKB} KB • {e.notes || ""}</div>
                            </div>
                          ))}
                          {!filteredExports.length ? <Empty title="No exports" subtitle="Create an export job to begin." /> : null}
                        </div>
                      </Section>

                      <Section
                        title="Webhook inspector"
                        subtitle="Premium: inspect deliveries and payloads."
                        right={<Pill label={cfg.webhookInspectorEnabled ? "Premium" : "Off"} tone={cfg.webhookInspectorEnabled ? "info" : "neutral"} />}
                      >
                        <div className="space-y-2">
                          {filteredDeliveries.slice(0, 5).map((d) => (
                            <button
                              key={d.id}
                              type="button"
                              className="w-full rounded-3xl border border-slate-200 bg-white p-4 text-left hover:bg-slate-50"
                              onClick={() => {
                                setActiveDeliveryId(d.id);
                                setInspectorOpen(true);
                              }}
                              disabled={!cfg.webhookInspectorEnabled}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <Pill label={d.env} tone={d.env === "Production" ? "neutral" : "info"} />
                                    <Pill label={d.event} tone="neutral" />
                                    <Pill label={d.status} tone={toneForDelivery(d.status)} />
                                    <Pill label={`HTTP ${d.httpStatus}`} tone={d.httpStatus >= 200 && d.httpStatus < 300 ? "good" : "warn"} />
                                  </div>
                                  <div className="mt-1 text-xs text-slate-500">{timeAgo(d.at)} • Attempts {d.attempts} • {d.durationMs}ms</div>
                                </div>
                                <ChevronRight className="h-5 w-5 text-slate-400" />
                              </div>
                            </button>
                          ))}
                          {!filteredDeliveries.length ? <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">No deliveries yet.</div> : null}
                        </div>
                        <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                          Premium: inspector shows request and response with retry traces. Use Sandbox to test safely.
                        </div>
                      </Section>
                    </div>
                  </Section>

                  <Section title="Security controls" subtitle="Keys, scopes, and network restrictions." right={<Pill label="Core" tone="neutral" />}>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="rounded-3xl border border-slate-200 bg-white p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-slate-900">API keys</div>
                            <div className="mt-1 text-xs text-slate-500">Rotate and revoke keys. Use least privilege scopes.</div>
                          </div>
                          <Key className="h-5 w-5 text-slate-400" />
                        </div>
                        <div className="mt-3 text-xs text-slate-600">
                          Best practice: create separate keys per integration (ERP, BI, approvals automation). Restrict by IP allowlist where possible.
                        </div>
                      </div>
                      <div className="rounded-3xl border border-slate-200 bg-white p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-slate-900">Webhook signing</div>
                            <div className="mt-1 text-xs text-slate-500">HMAC signature verification to prevent spoofing.</div>
                          </div>
                          <Lock className="h-5 w-5 text-slate-400" />
                        </div>
                        <div className="mt-3 text-xs text-slate-600">
                          Use header <span className="font-semibold">x-evzone-signature</span> to verify payload integrity.
                        </div>
                      </div>
                    </div>
                  </Section>
                </div>

                <div className="lg:col-span-4 space-y-4">
                  <Section title="Quick actions" subtitle="Common tasks" right={<Pill label="Core" tone="neutral" />}>
                    <div className="grid grid-cols-1 gap-2">
                      <Button variant="primary" onClick={openCreateKey}>
                        <Key className="h-4 w-4" /> Create API key
                      </Button>
                      <Button variant="outline" onClick={openCreateWebhook}>
                        <GitBranch className="h-4 w-4" /> Create webhook
                      </Button>
                      <Button variant="outline" onClick={openExport}>
                        <Download className="h-4 w-4" /> Create ERP export
                      </Button>
                      <Button variant="outline" onClick={printOpenApi}>
                        <FileText className="h-4 w-4" /> Download OpenAPI
                      </Button>
                    </div>
                    <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                      Premium: sandbox and webhook inspector available under Sandbox tab.
                    </div>
                  </Section>

                  <Section title="Environment" subtitle="Production vs sandbox" right={<Pill label="Premium" tone="info" />}>
                    <div className="space-y-2">
                      <Toggle
                        enabled={cfg.sandboxEnabled}
                        onChange={(v) => {
                          setCfg((p) => ({ ...p, sandboxEnabled: v }));
                          toast({ title: "Updated", message: `Sandbox ${v ? "enabled" : "disabled"}.`, kind: "success" });
                        }}
                        label="Sandbox enabled"
                        description="Allows test keys and test webhook events"
                      />
                      <Toggle
                        enabled={cfg.webhookInspectorEnabled}
                        onChange={(v) => {
                          setCfg((p) => ({ ...p, webhookInspectorEnabled: v }));
                          toast({ title: "Updated", message: `Inspector ${v ? "enabled" : "disabled"}.`, kind: "success" });
                        }}
                        label="Webhook inspector"
                        description="Premium debugging for payloads and retries"
                      />
                    </div>
                  </Section>
                </div>
              </div>
            ) : null}

            {tab === "exports" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-4 space-y-4">
                  <Section title="ERP exports" subtitle="Core: CSV/JSON exports" right={<Pill label="Core" tone="neutral" />}>
                    <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-700 ring-1 ring-slate-200">
                      Supported export types:
                      <ul className="mt-2 space-y-1">
                        <li>• Transactions (ledger)</li>
                        <li>• Invoices and line items</li>
                        <li>• Approvals history</li>
                      </ul>
                    </div>
                    <div className="mt-3 grid grid-cols-1 gap-2">
                      <Button variant="primary" onClick={openExport}>
                        <Download className="h-4 w-4" /> New export
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          const mapping = {
                            version: 1,
                            gl_code: "string",
                            cost_center: "string",
                            vendor_code: "string",
                            tax_code: "string",
                            amount_ugx: "number",
                            module: "string",
                            marketplace: "string",
                            invoice_group_code: "string",
                          };
                          const blob = new Blob([JSON.stringify(mapping, null, 2)], { type: "application/json" });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = "erp-mapping-template.json";
                          a.click();
                          URL.revokeObjectURL(url);
                          toast({ title: "Downloaded", message: "ERP mapping template downloaded.", kind: "success" });
                        }}
                      >
                        <FileText className="h-4 w-4" /> Mapping template
                      </Button>
                    </div>
                    <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                      Best practice: include AP codes and invoice group codes for clean ERP routing.
                    </div>
                  </Section>
                </div>

                <div className="lg:col-span-8 space-y-4">
                  <Section
                    title="Export jobs"
                    subtitle="Downloadable jobs for ERP sync"
                    right={<Pill label={`${filteredExports.length}`} tone="neutral" />}
                  >
                    <div className="space-y-2">
                      {filteredExports.map((e) => (
                        <div key={e.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <Pill label={e.env} tone={e.env === "Production" ? "neutral" : "info"} />
                                <Pill label={e.kind} tone="neutral" />
                                <Pill label={e.format} tone="info" />
                                <Pill label={e.status} tone={e.status === "Ready" ? "good" : e.status === "Failed" ? "bad" : "warn"} />
                              </div>
                              <div className="mt-2 text-sm font-semibold text-slate-900">{e.id} • {e.rangeLabel}</div>
                              <div className="mt-1 text-xs text-slate-500">Created {timeAgo(e.createdAt)} • {e.createdBy}</div>
                              <div className="mt-2 text-xs text-slate-600">Rows {e.rows} • Size {e.sizeKB} KB • {e.notes || ""}</div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => downloadExport(e.id)} disabled={e.status !== "Ready"}>
                                <Download className="h-4 w-4" /> Download
                              </Button>
                              <Button
                                variant="outline"
                                className="px-3 py-2 text-xs"
                                onClick={() => {
                                  setExports((p) => p.filter((x) => x.id !== e.id));
                                  toast({ title: "Removed", message: "Export job removed.", kind: "info" });
                                }}
                              >
                                <Trash2 className="h-4 w-4" /> Remove
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {!filteredExports.length ? <Empty title="No export jobs" subtitle="Create an export job to begin." /> : null}
                    </div>
                  </Section>

                  <Section title="Export formats" subtitle="CSV and JSON" right={<Pill label="Core" tone="neutral" />}>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div className="rounded-3xl border border-slate-200 bg-white p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-slate-900">CSV</div>
                            <div className="mt-1 text-xs text-slate-500">Good for spreadsheets and ERP imports</div>
                          </div>
                          <FileText className="h-5 w-5 text-slate-400" />
                        </div>
                        <div className="mt-3 text-xs text-slate-600">Includes stable column names for mapping.</div>
                      </div>
                      <div className="rounded-3xl border border-slate-200 bg-white p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-slate-900">JSON</div>
                            <div className="mt-1 text-xs text-slate-500">Best for API based ingestion</div>
                          </div>
                          <Globe className="h-5 w-5 text-slate-400" />
                        </div>
                        <div className="mt-3 text-xs text-slate-600">Includes meta block and structured rows.</div>
                      </div>
                    </div>
                  </Section>
                </div>
              </div>
            ) : null}

            {tab === "keys" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-4 space-y-4">
                  <Section title="API keys" subtitle="Core: secure endpoints, keys, scopes" right={<Pill label="Core" tone="neutral" />}>
                    <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-700 ring-1 ring-slate-200">
                      <div className="font-semibold text-slate-900">How auth works</div>
                      <ul className="mt-2 space-y-1">
                        <li>1) Create an API key</li>
                        <li>2) Assign least-privilege scopes</li>
                        <li>3) Use Authorization: Bearer &lt;key&gt;</li>
                        <li>4) Rotate periodically and revoke on compromise</li>
                      </ul>
                    </div>
                    <div className="mt-3 grid grid-cols-1 gap-2">
                      <Button variant="primary" onClick={openCreateKey}>
                        <Key className="h-4 w-4" /> New API key
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => copyToClipboard(cfg.apiBaseProd, "Production base URL copied")}
                      >
                        <Copy className="h-4 w-4" /> Copy API base
                      </Button>
                    </div>
                    <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                      Security tip: restrict integrations to IP allowlist and scope only the endpoints needed.
                    </div>
                  </Section>
                </div>

                <div className="lg:col-span-8 space-y-4">
                  <Section
                    title="Keys list"
                    subtitle="Create, rotate, revoke"
                    right={<Pill label={`${filteredKeys.length}`} tone="neutral" />}
                  >
                    <div className="space-y-2">
                      {filteredKeys.map((k) => (
                        <div key={k.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <Pill label={k.env} tone={k.env === "Production" ? "neutral" : "info"} />
                                <Pill label={k.status} tone={toneForKeyStatus(k.status)} />
                                <Pill label={k.id} tone="neutral" />
                              </div>
                              <div className="mt-2 text-sm font-semibold text-slate-900">{k.name}</div>
                              <div className="mt-1 text-xs text-slate-500">Created {timeAgo(k.createdAt)} • Last used {k.lastUsedAt ? timeAgo(k.lastUsedAt) : "Never"}</div>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {k.scopes.slice(0, 6).map((s) => (
                                  <Pill key={`${k.id}-${s}`} label={s} tone="neutral" />
                                ))}
                                {k.scopes.length > 6 ? <Pill label="+more" tone="neutral" /> : null}
                              </div>
                              <div className="mt-2 text-xs text-slate-600">Key prefix: {k.keyPrefix}{k.ipAllowlist ? ` • IP allowlist: ${k.ipAllowlist}` : ""}</div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <Button
                                variant="outline"
                                className="px-3 py-2 text-xs"
                                onClick={() => rotateKey(k.id)}
                                disabled={k.status !== "Active"}
                                title={k.status !== "Active" ? "Revoked" : "Rotate secret"}
                              >
                                <RefreshCcw className="h-4 w-4" /> Rotate
                              </Button>
                              <Button
                                variant="outline"
                                className="px-3 py-2 text-xs"
                                onClick={() => revokeKey(k.id)}
                                disabled={k.status !== "Active"}
                              >
                                <Trash2 className="h-4 w-4" /> Revoke
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {!filteredKeys.length ? <Empty title="No keys" subtitle="Create an API key to start." /> : null}
                    </div>
                  </Section>

                  <Section title="Scopes reference" subtitle="What each scope allows" right={<Pill label="Core" tone="neutral" />}>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {ALL_SCOPES.map((s) => (
                        <div key={s.scope} className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-slate-900">{s.label}</div>
                              <div className="mt-1 text-xs text-slate-500">{s.scope}</div>
                              <div className="mt-2 text-xs text-slate-600">{s.desc}</div>
                            </div>
                            <Lock className="h-5 w-5 text-slate-400" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </Section>
                </div>
              </div>
            ) : null}

            {tab === "webhooks" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-4 space-y-4">
                  <Section title="Webhooks" subtitle="Core: invoice, approvals, limits" right={<Pill label="Core" tone="neutral" />}>
                    <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-700 ring-1 ring-slate-200">
                      <div className="font-semibold text-slate-900">Events</div>
                      <ul className="mt-2 space-y-1">
                        {ALL_EVENTS.map((e) => (
                          <li key={e.ev}>• <span className="font-semibold">{e.ev}</span>: {e.desc}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="mt-3 grid grid-cols-1 gap-2">
                      <Button variant="primary" onClick={openCreateWebhook}>
                        <GitBranch className="h-4 w-4" /> New webhook
                      </Button>
                      <Button variant="outline" onClick={() => setInspectorOpen(true)} disabled={!cfg.webhookInspectorEnabled}>
                        <Terminal className="h-4 w-4" /> Webhook inspector
                      </Button>
                    </div>
                    <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                      Security tip: verify HMAC signature and implement idempotency using requestId.
                    </div>
                  </Section>

                  <Section title="Webhook security" subtitle="HMAC and retries" right={<Pill label="Core" tone="neutral" />}>
                    <div className="space-y-2">
                      <Toggle
                        enabled={cfg.requireHmac}
                        onChange={(v) => {
                          setCfg((p) => ({ ...p, requireHmac: v }));
                          toast({ title: "Updated", message: `HMAC ${v ? "required" : "optional"}.`, kind: "success" });
                        }}
                        label="Require HMAC signatures"
                        description="Adds x-evzone-signature and rejects unsigned payloads"
                      />
                      <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-700 ring-1 ring-slate-200">
                        Signing algorithm: <span className="font-semibold">{cfg.webhookSigningAlgo}</span>
                        <div className="mt-2">Header: <span className="font-semibold">x-evzone-signature</span></div>
                        <div className="mt-1">Header: <span className="font-semibold">x-evzone-request-id</span></div>
                      </div>
                    </div>
                  </Section>
                </div>

                <div className="lg:col-span-8 space-y-4">
                  <Section title="Webhook endpoints" subtitle="Manage endpoints" right={<Pill label={`${filteredWebhooks.length}`} tone="neutral" />}>
                    <div className="space-y-2">
                      {filteredWebhooks.map((w) => (
                        <div key={w.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <Pill label={w.env} tone={w.env === "Production" ? "neutral" : "info"} />
                                <Pill label={w.status} tone={toneForWebhookStatus(w.status)} />
                                <Pill label={w.id} tone="neutral" />
                                <Pill label={`Retries ${w.retryCount}`} tone="neutral" />
                                <Pill label={w.hmacEnabled ? "HMAC" : "No HMAC"} tone={w.hmacEnabled ? "info" : "neutral"} />
                              </div>
                              <div className="mt-2 text-sm font-semibold text-slate-900">{w.url}</div>
                              <div className="mt-1 text-xs text-slate-500">Created {timeAgo(w.createdAt)} • Last delivery {w.lastDeliveryAt ? timeAgo(w.lastDeliveryAt) : "Never"}</div>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {w.events.map((e) => (
                                  <Pill key={`${w.id}-${e}`} label={e} tone="neutral" />
                                ))}
                              </div>
                              <div className="mt-2 text-xs text-slate-600">Secret: {w.secretHint}</div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <Button
                                variant="outline"
                                className="px-3 py-2 text-xs"
                                onClick={() => {
                                  // send a test event to first enabled event
                                  const ev = w.events[0] || "invoice.created";
                                  sendTestEvent(w.id, ev);
                                }}
                                disabled={w.status !== "Enabled"}
                              >
                                <Check className="h-4 w-4" /> Test
                              </Button>
                              <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => rotateWebhookSecret(w.id)}>
                                <RefreshCcw className="h-4 w-4" /> Rotate
                              </Button>
                              <Button
                                variant="outline"
                                className="px-3 py-2 text-xs"
                                onClick={() => {
                                  toggleWebhook(w.id);
                                  toast({ title: "Updated", message: `Webhook ${w.status === "Enabled" ? "disabled" : "enabled"}.`, kind: "success" });
                                }}
                              >
                                <Settings2 className="h-4 w-4" /> Toggle
                              </Button>
                              <Button variant="danger" className="px-3 py-2 text-xs" onClick={() => deleteWebhook(w.id)}>
                                <Trash2 className="h-4 w-4" /> Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {!filteredWebhooks.length ? <Empty title="No webhooks" subtitle="Create a webhook endpoint." /> : null}
                    </div>

                    <Section title="Delivery logs" subtitle="Recent deliveries" right={<Pill label={cfg.webhookInspectorEnabled ? "Premium" : "Off"} tone={cfg.webhookInspectorEnabled ? "info" : "neutral"} />}>
                      <div className="space-y-2">
                        {filteredDeliveries.slice(0, 10).map((d) => (
                          <button
                            key={d.id}
                            type="button"
                            className="w-full rounded-3xl border border-slate-200 bg-white p-4 text-left hover:bg-slate-50"
                            onClick={() => {
                              setActiveDeliveryId(d.id);
                              setInspectorOpen(true);
                            }}
                            disabled={!cfg.webhookInspectorEnabled}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <Pill label={d.env} tone={d.env === "Production" ? "neutral" : "info"} />
                                  <Pill label={d.event} tone="neutral" />
                                  <Pill label={d.status} tone={toneForDelivery(d.status)} />
                                  <Pill label={`HTTP ${d.httpStatus}`} tone={d.httpStatus >= 200 && d.httpStatus < 300 ? "good" : "warn"} />
                                </div>
                                <div className="mt-1 text-xs text-slate-500">{timeAgo(d.at)} • {d.endpointId} • Attempts {d.attempts} • {d.durationMs}ms</div>
                                <div className="mt-1 text-xs text-slate-600">Response: {d.responseSnippet}</div>
                              </div>
                              <ChevronRight className="h-5 w-5 text-slate-400" />
                            </div>
                          </button>
                        ))}
                        {!filteredDeliveries.length ? <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">No deliveries found.</div> : null}
                      </div>
                      <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                        Premium: open a delivery to see payload, headers, and retry traces.
                      </div>
                    </Section>
                  </Section>
                </div>
              </div>
            ) : null}

            {tab === "sandbox" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-5 space-y-4">
                  <Section title="Sandbox mode" subtitle="Premium: safe testing" right={<Pill label="Premium" tone="info" />}>
                    <Toggle
                      enabled={cfg.sandboxEnabled}
                      onChange={(v) => {
                        setCfg((p) => ({ ...p, sandboxEnabled: v }));
                        toast({ title: "Updated", message: `Sandbox ${v ? "enabled" : "disabled"}.`, kind: "success" });
                      }}
                      label="Enable sandbox"
                      description="Allows test keys, test exports, and test webhook deliveries"
                    />

                    <Toggle
                      enabled={sandbox.routeWebhooksToInspector}
                      onChange={(v) => setSandbox((p) => ({ ...p, routeWebhooksToInspector: v }))}
                      label="Route test deliveries to inspector"
                      description="Sends sandbox events into the inspector feed"
                    />

                    <Toggle
                      enabled={cfg.webhookInspectorEnabled}
                      onChange={(v) => setCfg((p) => ({ ...p, webhookInspectorEnabled: v }))}
                      label="Webhook inspector"
                      description="Inspect payloads, retries, and signatures"
                    />

                    <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700 ring-1 ring-slate-200">
                      Sandbox base: <span className="font-semibold">{cfg.apiBaseSandbox}</span>
                      <div className="mt-2">Use keys with prefix <span className="font-semibold">cp_test_…</span></div>
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          const wh = webhooks.find((w) => w.env === "Sandbox" && w.status === "Enabled");
                          if (!wh) {
                            toast({ title: "No sandbox webhook", message: "Create a sandbox webhook first.", kind: "warn" });
                            return;
                          }
                          sendTestEvent(wh.id, "invoice.created");
                        }}
                        disabled={!cfg.sandboxEnabled}
                      >
                        <Check className="h-4 w-4" /> Send test invoice.created
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          const wh = webhooks.find((w) => w.env === "Sandbox" && w.status === "Enabled");
                          if (!wh) {
                            toast({ title: "No sandbox webhook", message: "Create a sandbox webhook first.", kind: "warn" });
                            return;
                          }
                          sendTestEvent(wh.id, "limit.breached");
                        }}
                        disabled={!cfg.sandboxEnabled}
                      >
                        <AlertTriangle className="h-4 w-4" /> Simulate limit breach
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setActiveDeliveryId(filteredDeliveries[0]?.id || null);
                          setInspectorOpen(true);
                        }}
                        disabled={!cfg.webhookInspectorEnabled}
                      >
                        <Terminal className="h-4 w-4" /> Open inspector
                      </Button>
                    </div>

                    <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                      Premium: sandbox/test mode + webhook inspector.
                    </div>
                  </Section>
                </div>

                <div className="lg:col-span-7 space-y-4">
                  <Section title="Sandbox exports" subtitle="Test ERP exports" right={<Pill label="Core" tone="neutral" />}>
                    <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-700 ring-1 ring-slate-200">
                      You can run exports in sandbox to validate mappings before production.
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Button
                        variant="primary"
                        onClick={() => {
                          setExportDraft((p) => ({ ...p, env: "Sandbox" }));
                          setExportModalOpen(true);
                        }}
                        disabled={!cfg.sandboxEnabled}
                      >
                        <Download className="h-4 w-4" /> New sandbox export
                      </Button>
                      <Button variant="outline" onClick={printOpenApi}>
                        <FileText className="h-4 w-4" /> OpenAPI
                      </Button>
                    </div>

                    <div className="mt-3 space-y-2">
                      {exports
                        .filter((e) => e.env === "Sandbox")
                        .slice(0, 6)
                        .map((e) => (
                          <div key={e.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <Pill label={e.env} tone="info" />
                                  <Pill label={e.kind} tone="neutral" />
                                  <Pill label={e.format} tone="info" />
                                  <Pill label={e.status} tone={e.status === "Ready" ? "good" : e.status === "Failed" ? "bad" : "warn"} />
                                </div>
                                <div className="mt-2 text-sm font-semibold text-slate-900">{e.id} • {e.rangeLabel}</div>
                                <div className="mt-1 text-xs text-slate-500">Created {timeAgo(e.createdAt)} • {e.createdBy}</div>
                              </div>
                              <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => downloadExport(e.id)} disabled={e.status !== "Ready"}>
                                <Download className="h-4 w-4" /> Download
                              </Button>
                            </div>
                          </div>
                        ))}
                      {!exports.some((e) => e.env === "Sandbox") ? <Empty title="No sandbox exports" subtitle="Create a sandbox export job." /> : null}
                    </div>
                  </Section>
                </div>
              </div>
            ) : null}

            {tab === "sso" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-5 space-y-4">
                  <Section title="SSO (Phase 2)" subtitle="Premium: Google and Microsoft" right={<Pill label="Phase 2" tone="info" />}>
                    <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-700 ring-1 ring-slate-200">
                      SSO is planned for phase 2 and will support:
                      <ul className="mt-2 space-y-1">
                        <li>• Google Workspace and Microsoft Entra ID</li>
                        <li>• Domain allowlist and just-in-time provisioning</li>
                        <li>• Optional SCIM user sync</li>
                      </ul>
                    </div>

                    <Toggle
                      enabled={phase2.ssoGoogle}
                      onChange={(v) => {
                        setPhase2((p) => ({ ...p, ssoGoogle: v }));
                        toast({ title: "Phase 2", message: "SSO configuration placeholder toggled (demo).", kind: "info" });
                      }}
                      label="Google SSO"
                      description="Coming soon"
                    />
                    <Toggle
                      enabled={phase2.ssoMicrosoft}
                      onChange={(v) => {
                        setPhase2((p) => ({ ...p, ssoMicrosoft: v }));
                        toast({ title: "Phase 2", message: "SSO configuration placeholder toggled (demo).", kind: "info" });
                      }}
                      label="Microsoft SSO"
                      description="Coming soon"
                    />

                    <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                      Phase 2: when enabled, login pages (X1/X2) will show SSO buttons.
                    </div>
                  </Section>
                </div>

                <div className="lg:col-span-7 space-y-4">
                  <Section title="HRIS import (Phase 2)" subtitle="Premium: HRIS connectors" right={<Pill label="Phase 2" tone="info" />}>
                    <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-700 ring-1 ring-slate-200">
                      HRIS import will support scheduled user sync and group assignment rules.
                    </div>

                    <Toggle
                      enabled={phase2.hrisImport}
                      onChange={(v) => {
                        setPhase2((p) => ({ ...p, hrisImport: v }));
                        toast({ title: "Phase 2", message: "HRIS import placeholder toggled (demo).", kind: "info" });
                      }}
                      label="Enable HRIS import"
                      description="Coming soon"
                    />

                    <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                      {[
                        { name: "Workday", desc: "User sync and cost centers" },
                        { name: "BambooHR", desc: "Employee directory import" },
                        { name: "SAP SuccessFactors", desc: "Org structure and roles" },
                        { name: "Custom CSV", desc: "Fallback import for any HRIS" },
                      ].map((x) => (
                        <div key={x.name} className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-slate-900">{x.name}</div>
                              <div className="mt-1 text-xs text-slate-500">{x.desc}</div>
                            </div>
                            <Pill label="Phase 2" tone="info" />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                      Best practice: even before HRIS sync, bulk import (C) can seed users with groups and cost centers.
                    </div>
                  </Section>
                </div>
              </div>
            ) : null}
          </div>

          <footer className="border-t border-slate-200 bg-white/60 py-6">
            <div className="mx-auto max-w-[1400px] px-4 text-xs text-slate-500 md:px-6">
              Y Integrations & Developer Center v2. Core: ERP exports (CSV/JSON), secure API keys and scopes, webhooks for invoices, approvals, and limit breaches. Premium: sandbox and webhook inspector, plus phase 2 SSO and HRIS import placeholders.
            </div>
          </footer>
        </div>
      </div>

      {/* Create API key modal */}
      <Modal
        open={keyModalOpen}
        title="Create API key"
        subtitle="Secrets are shown once. Use least privilege scopes."
        onClose={() => setKeyModalOpen(false)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setKeyModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={createKey}>
              <BadgeCheck className="h-4 w-4" /> Create
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Key name" value={keyDraft.name} onChange={(v) => setKeyDraft((p) => ({ ...p, name: v }))} placeholder="Example: ERP sync" />
          <Select
            label="Environment"
            value={keyDraft.env}
            onChange={(v) => setKeyDraft((p) => ({ ...p, env: v as Env }))}
            options={[{ value: "Production", label: "Production" }, { value: "Sandbox", label: "Sandbox" }]}
          />
          <div className="md:col-span-2">
            <Field
              label="IP allowlist"
              value={keyDraft.ipAllowlist}
              onChange={(v) => setKeyDraft((p) => ({ ...p, ipAllowlist: v }))}
              placeholder="Example: 10.0.0.0/24"
              hint="Optional"
            />
          </div>

          <div className="md:col-span-2 rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-semibold text-slate-900">Scopes</div>
            <div className="mt-1 text-xs text-slate-600">Select what this key can do.</div>
            <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
              {ALL_SCOPES.map((s) => (
                <label key={s.scope} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded border-slate-300"
                    checked={keyDraft.scopes[s.scope]}
                    onChange={(e) => setKeyDraft((p) => ({ ...p, scopes: { ...p.scopes, [s.scope]: e.target.checked } }))}
                  />
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{s.label}</div>
                    <div className="mt-1 text-xs text-slate-600">{s.scope}</div>
                    <div className="mt-1 text-xs text-slate-500">{s.desc}</div>
                  </div>
                </label>
              ))}
            </div>
            <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
              Best practice: avoid write scopes unless needed. Prefer separate keys per system.
            </div>
          </div>
        </div>
      </Modal>

      {/* Create webhook modal */}
      <Modal
        open={whModalOpen}
        title="Create webhook"
        subtitle="Receive event callbacks (HMAC recommended)."
        onClose={() => setWhModalOpen(false)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setWhModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={createWebhook}>
              <BadgeCheck className="h-4 w-4" /> Create
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Select
            label="Environment"
            value={whDraft.env}
            onChange={(v) => setWhDraft((p) => ({ ...p, env: v as Env }))}
            options={[{ value: "Production", label: "Production" }, { value: "Sandbox", label: "Sandbox" }]}
          />
          <Field label="Endpoint URL" value={whDraft.url} onChange={(v) => setWhDraft((p) => ({ ...p, url: v }))} placeholder="https://your-system.com/webhooks/evzone" />
          <Select
            label="Retry count"
            value={`${whDraft.retryCount}`}
            onChange={(v) => setWhDraft((p) => ({ ...p, retryCount: clamp(Number(v), 0, 12) }))}
            options={Array.from({ length: 13 }, (_, i) => ({ value: `${i}`, label: `${i}` }))}
            hint="0 to 12"
          />
          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <Toggle enabled={whDraft.hmac} onChange={(v) => setWhDraft((p) => ({ ...p, hmac: v }))} label="HMAC signing" description="Adds x-evzone-signature header" />
          </div>

          <div className="md:col-span-2 rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-semibold text-slate-900">Events</div>
            <div className="mt-1 text-xs text-slate-600">Choose which events to receive.</div>
            <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
              {ALL_EVENTS.map((e) => (
                <label key={e.ev} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded border-slate-300"
                    checked={whDraft.events[e.ev]}
                    onChange={(ev) => setWhDraft((p) => ({ ...p, events: { ...p.events, [e.ev]: ev.target.checked } }))}
                  />
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{e.ev}</div>
                    <div className="mt-1 text-xs text-slate-500">{e.desc}</div>
                  </div>
                </label>
              ))}
            </div>
            <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
              Secrets are shown once on create and can be rotated later.
            </div>
          </div>
        </div>
      </Modal>

      {/* Export modal */}
      <Modal
        open={exportModalOpen}
        title="Create ERP export"
        subtitle="CSV/JSON exports for accounting systems."
        onClose={() => setExportModalOpen(false)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setExportModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={runExport}>
              <Download className="h-4 w-4" /> Run export
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Select
            label="Environment"
            value={exportDraft.env}
            onChange={(v) => setExportDraft((p) => ({ ...p, env: v as Env }))}
            options={[{ value: "Production", label: "Production" }, { value: "Sandbox", label: "Sandbox" }]}
          />
          <Select
            label="Export kind"
            value={exportDraft.kind}
            onChange={(v) => setExportDraft((p) => ({ ...p, kind: v as ExportKind }))}
            options={[
              { value: "Transactions", label: "Transactions" },
              { value: "Invoices", label: "Invoices" },
              { value: "Approvals", label: "Approvals" },
            ]}
          />
          <Select
            label="Format"
            value={exportDraft.format}
            onChange={(v) => setExportDraft((p) => ({ ...p, format: v as ExportFormat }))}
            options={[{ value: "CSV", label: "CSV" }, { value: "JSON", label: "JSON" }]}
          />
          <Select
            label="Range"
            value={exportDraft.range}
            onChange={(v) => setExportDraft((p) => ({ ...p, range: v as any }))}
            options={[
              { value: "7d", label: "Last 7 days" },
              { value: "30d", label: "Last 30 days" },
              { value: "90d", label: "Last 90 days" },
              { value: "custom", label: "Custom" },
            ]}
          />
          <div className={cn(exportDraft.range !== "custom" && "opacity-60")}>
            <Field label="From" type="date" value={exportDraft.from} onChange={(v) => setExportDraft((p) => ({ ...p, from: v }))} disabled={exportDraft.range !== "custom"} />
          </div>
          <div className={cn(exportDraft.range !== "custom" && "opacity-60")}>
            <Field label="To" type="date" value={exportDraft.to} onChange={(v) => setExportDraft((p) => ({ ...p, to: v }))} disabled={exportDraft.range !== "custom"} />
          </div>

          <div className="md:col-span-2 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700 ring-1 ring-slate-200">
            In production, exports can also push directly to ERP via secure API endpoints.
          </div>
        </div>
      </Modal>

      {/* Secret reveal modal */}
      <Modal
        open={secretModalOpen}
        title={secretPayload?.title || "Secret"}
        subtitle="Copy now. You will not be able to view this secret again."
        onClose={() => {
          setSecretModalOpen(false);
          setSecretPayload(null);
        }}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="primary"
              onClick={() => {
                setSecretModalOpen(false);
                setSecretPayload(null);
              }}
            >
              <Check className="h-4 w-4" /> Done
            </Button>
          </div>
        }
      >
        <div className="rounded-3xl border border-slate-200 bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-slate-500">Secret</div>
              <div className="mt-2 font-mono text-sm font-semibold text-slate-900 break-all">{secretPayload?.secret || ""}</div>
              <div className="mt-2 text-xs text-slate-500">Hint: {secretPayload?.hint || ""}</div>
            </div>
            <Button
              variant="outline"
              className="px-3 py-2 text-xs"
              onClick={() => copyToClipboard(secretPayload?.secret || "", "Secret copied")}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
          Store this in your secrets manager. If lost, rotate to generate a new secret.
        </div>
      </Modal>

      {/* Webhook inspector drawer */}
      <Drawer
        open={inspectorOpen}
        title={activeDelivery ? `Webhook delivery ${activeDelivery.id}` : "Webhook inspector"}
        subtitle={activeDelivery ? `${activeDelivery.event} • ${activeDelivery.env} • ${fmtDateTime(activeDelivery.at)}` : "Inspect deliveries and payloads"}
        onClose={() => {
          setInspectorOpen(false);
          setActiveDeliveryId(null);
        }}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <div className="text-xs text-slate-600">Inspector is premium and intended for debugging.</div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setActiveDeliveryId(null);
                  toast({ title: "Cleared", message: "Selection cleared.", kind: "info" });
                }}
              >
                <X className="h-4 w-4" /> Clear
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setInspectorOpen(false);
                }}
              >
                <Check className="h-4 w-4" /> Close
              </Button>
            </div>
          </div>
        }
      >
        {!activeDelivery ? (
          <div className="space-y-2">
            <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">Select a delivery from Webhooks or Overview to see full details.</div>
            <div className="space-y-2">
              {filteredDeliveries.slice(0, 30).map((d) => (
                <button
                  key={d.id}
                  type="button"
                  className="w-full rounded-3xl border border-slate-200 bg-white p-4 text-left hover:bg-slate-50"
                  onClick={() => setActiveDeliveryId(d.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Pill label={d.env} tone={d.env === "Production" ? "neutral" : "info"} />
                        <Pill label={d.event} tone="neutral" />
                        <Pill label={d.status} tone={toneForDelivery(d.status)} />
                        <Pill label={`HTTP ${d.httpStatus}`} tone={d.httpStatus >= 200 && d.httpStatus < 300 ? "good" : "warn"} />
                      </div>
                      <div className="mt-1 text-xs text-slate-500">{timeAgo(d.at)} • {d.endpointId} • Attempts {d.attempts}</div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-400" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Pill label={activeDelivery.env} tone={activeDelivery.env === "Production" ? "neutral" : "info"} />
                <Pill label={activeDelivery.event} tone="neutral" />
                <Pill label={activeDelivery.status} tone={toneForDelivery(activeDelivery.status)} />
                <Pill label={`HTTP ${activeDelivery.httpStatus}`} tone={activeDelivery.httpStatus >= 200 && activeDelivery.httpStatus < 300 ? "good" : "warn"} />
                <Pill label={`Attempts ${activeDelivery.attempts}`} tone="neutral" />
                <Pill label={`${activeDelivery.durationMs}ms`} tone="neutral" />
              </div>
              <div className="mt-2 text-xs text-slate-500">Endpoint: {activeDelivery.endpointId} • Request: {activeDelivery.requestId}</div>
              <div className="mt-2 text-sm text-slate-700">Response: <span className="font-semibold">{activeDelivery.responseSnippet}</span></div>
            </div>

            <Section title="Headers" subtitle="Preview" right={<Pill label="Premium" tone="info" />}>
              <pre className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800 overflow-auto">{JSON.stringify(activeDelivery.headersPreview, null, 2)}</pre>
              <Button variant="outline" onClick={() => copyToClipboard(JSON.stringify(activeDelivery.headersPreview, null, 2), "Headers copied")}> <Copy className="h-4 w-4" /> Copy</Button>
            </Section>

            <Section title="Body" subtitle="Payload" right={<Pill label="Premium" tone="info" />}>
              <pre className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800 overflow-auto">{JSON.stringify(activeDelivery.bodyPreview, null, 2)}</pre>
              <Button variant="outline" onClick={() => copyToClipboard(JSON.stringify(activeDelivery.bodyPreview, null, 2), "Body copied")}> <Copy className="h-4 w-4" /> Copy</Button>
            </Section>

            <div className="rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
              Best practice: implement idempotency in your receiver using x-evzone-request-id.
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );

  function Stat({ title, value, sub, icon, tone }: { title: string; value: string; sub: string; icon: React.ReactNode; tone: "neutral" | "good" | "warn" | "bad" | "info" }) {
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
