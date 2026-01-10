import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BadgeCheck,
  CalendarClock,
  Check,
  Copy,
  Download,
  Fingerprint,
  Globe,
  HelpCircle,
  KeyRound,
  Laptop,
  Lock,
  LogOut,
  Shield,
  Smartphone,
  Sparkles,
  Trash2,
  User,
  Users,
  X,
  FileText,
  Info,
  Plus,
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

function formatDateTime(ts: number) {
  return new Date(ts).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function timeAgo(ts?: number | null) {
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

function Pill({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "good" | "warn" | "bad" | "info" | "neutral";
}) {
  const map: Record<string, string> = {
    good: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    warn: "bg-amber-50 text-amber-800 ring-amber-200",
    bad: "bg-rose-50 text-rose-700 ring-rose-200",
    info: "bg-blue-50 text-blue-700 ring-blue-200",
    neutral: "bg-slate-50 text-slate-700 ring-slate-200",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1",
        map[tone]
      )}
    >
      {label}
    </span>
  );
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
  const base =
    "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-4";
  const variants: Record<string, string> = {
    primary:
      "text-white shadow-[0_12px_24px_rgba(3,205,140,0.22)] hover:opacity-95 focus:ring-emerald-200",
    accent:
      "text-white shadow-[0_12px_24px_rgba(247,127,0,0.22)] hover:opacity-95 focus:ring-orange-200",
    outline:
      "border border-slate-200 bg-white text-slate-800 shadow-sm hover:bg-slate-50 focus:ring-slate-200",
    ghost:
      "bg-transparent text-slate-700 hover:bg-slate-100 focus:ring-slate-200",
    danger:
      "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 focus:ring-rose-100",
  };
  const style =
    variant === "primary"
      ? { background: EVZ.green }
      : variant === "accent"
      ? { background: EVZ.orange }
      : undefined;

  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      style={style}
      className={cn(
        base,
        variants[variant],
        disabled && "cursor-not-allowed opacity-60",
        className
      )}
    >
      {children}
    </button>
  );
}

function Toggle({
  enabled,
  onChange,
  label,
  description,
}: {
  enabled: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-4">
      <div>
        <div className="text-sm font-semibold text-slate-900">{label}</div>
        {description ? (
          <div className="mt-1 text-xs text-slate-600">{description}</div>
        ) : null}
      </div>
      <button
        type="button"
        className={cn(
          "relative h-7 w-12 rounded-full border transition",
          enabled
            ? "border-emerald-300 bg-emerald-200"
            : "border-slate-200 bg-white"
        )}
        onClick={() => onChange(!enabled)}
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

function Modal({
  open,
  title,
  subtitle,
  children,
  onClose,
  footer,
  maxW = "860px",
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
            className="fixed inset-x-0 top-[8vh] z-50 mx-auto w-[min(980px,calc(100vw-2rem))] overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(2,8,23,0.22)]"
            style={{ maxWidth: maxW }}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
              <div>
                <div className="text-lg font-semibold text-slate-900">
                  {title}
                </div>
                {subtitle ? (
                  <div className="mt-1 text-sm text-slate-600">{subtitle}</div>
                ) : null}
              </div>
              <button
                className="rounded-2xl p-2 text-slate-600 hover:bg-slate-100"
                onClick={onClose}
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto px-5 py-4">
              {children}
            </div>
            {footer ? (
              <div className="border-t border-slate-200 px-5 py-4">
                {footer}
              </div>
            ) : null}
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}

function ToastStack({
  toasts,
  onDismiss,
}: {
  toasts: Array<{ id: string; title: string; message?: string; kind: string }>;
  onDismiss: (id: string) => void;
}) {
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
                {t.kind === "error" || t.kind === "warn" ? (
                  <AlertTriangle className="h-5 w-5" />
                ) : (
                  <Check className="h-5 w-5" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-slate-900">
                  {t.title}
                </div>
                {t.message ? (
                  <div className="mt-0.5 text-sm text-slate-600">
                    {t.message}
                  </div>
                ) : null}
              </div>
              <button
                className="rounded-2xl p-2 text-slate-500 hover:bg-slate-100"
                onClick={() => onDismiss(t.id)}
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  type?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-semibold text-slate-600">{label}</div>
        {hint ? <div className="text-xs text-slate-500">{hint}</div> : null}
      </div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 shadow-sm outline-none focus:ring-4 focus:ring-emerald-100"
      />
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  hint?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-semibold text-slate-600">{label}</div>
        {hint ? <div className="text-xs text-slate-500">{hint}</div> : null}
      </div>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value || 0))}
        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 shadow-sm outline-none focus:ring-4 focus:ring-emerald-100"
      />
    </div>
  );
}

type LoginSession = {
  id: string;
  device: string;
  location: string;
  ip: string;
  trusted: boolean;
  lastSeenTs: number;
  status: "Current" | "Active" | "Signed out";
};

type SecurityEvent = {
  id: string;
  ts: number;
  severity: "Info" | "Warning" | "Critical";
  actor: string;
  category: "MFA" | "Device" | "Policy" | "Tamper" | "Break-glass" | "Session";
  title: string;
  detail: string;
  status: "Open" | "Resolved";
};

type BreakGlassAccount = {
  id: string;
  email: string;
  enabled: boolean;
  lastRotatedTs: number;
  lastUsedTs: number | null;
  locked: boolean;
  notes: string;
  emergencyCodes: string[];
};

function generateBackupCodes(n = 8) {
  return Array.from({ length: n }).map(() => {
    const a = Math.random().toString(16).slice(2, 6).toUpperCase();
    const b = Math.random().toString(16).slice(2, 6).toUpperCase();
    return `${a}-${b}`;
  });
}

function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function exportEventsCSV(events: SecurityEvent[]) {
  const headers = ["id", "timestamp", "severity", "actor", "category", "title", "detail", "status"];
  const esc = (v: any) => {
    const s = String(v ?? "");
    if (s.includes(",") || s.includes("\n") || s.includes('"')) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const rows = events.map((e) => [
    e.id,
    formatDateTime(e.ts),
    e.severity,
    e.actor,
    e.category,
    e.title,
    e.detail,
    e.status,
  ].map(esc).join(","));
  return [headers.join(","), ...rows].join("\n");
}

function severityTone(sev: SecurityEvent["severity"]) {
  if (sev === "Critical") return "bad" as const;
  if (sev === "Warning") return "warn" as const;
  return "info" as const;
}

function evaluateConditionalAccess(input: {
  ip: string;
  geo: string;
  day: string;
  time: string;
  ipEnabled: boolean;
  ipAllow: string[];
  geoEnabled: boolean;
  geoAllow: string[];
  timeEnabled: boolean;
  timeStart: string;
  timeEnd: string;
  timeDays: string[];
}) {
  const reasons: string[] = [];

  if (input.ipEnabled) {
    if (!input.ipAllow.includes(input.ip)) {
      reasons.push("IP not in allowlist");
    }
  }

  if (input.geoEnabled) {
    const ok = input.geoAllow.map((g) => g.toLowerCase()).includes(input.geo.toLowerCase());
    if (!ok) reasons.push("Geo not in allowlist");
  }

  if (input.timeEnabled) {
    const dayOk = input.timeDays.includes(input.day);
    if (!dayOk) reasons.push("Day not allowed");
    const t = input.time;
    if (input.timeStart && input.timeEnd && (t < input.timeStart || t > input.timeEnd)) {
      reasons.push("Time outside allowed window");
    }
  }

  if (!reasons.length) {
    return { status: "Allowed" as const, reasons: [] };
  }

  // Conditional access does not hard block by default in this page; it forces step-up.
  return { status: "Step-up required" as const, reasons };
}

export default function CorporatePayMfaDeviceTrustV2() {
  const [toasts, setToasts] = useState<Array<{ id: string; title: string; message?: string; kind: string }>>([]);
  const toast = (t: { title: string; message?: string; kind: string }) => {
    const id = uid("toast");
    setToasts((p) => [{ id, ...t }, ...p].slice(0, 4));
    window.setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 3200);
  };

  const [tab, setTab] = useState<"setup" | "trust" | "conditional" | "breakglass" | "events">("setup");

  // MFA
  const [secret] = useState("EVZ-CPAY-2FA-9X3D-7K1P");
  const [verifyCode, setVerifyCode] = useState("");
  const [mfaEnabled, setMfaEnabled] = useState(false);

  // Backup codes
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  // Trust device
  const [trustThisDevice, setTrustThisDevice] = useState(true);
  const [trustExpiryDays, setTrustExpiryDays] = useState(30);

  // Policy requirements
  const [requireMfa, setRequireMfa] = useState({
    Finance: true,
    Approver: true,
    Admin: true,
    Manager: false,
    User: false,
    "Travel Coordinator": false,
  });

  // Sessions
  const [sessions, setSessions] = useState<LoginSession[]>(() => [
    {
      id: "S-001",
      device: "Windows Chrome",
      location: "Kampala, UG",
      ip: "196.43.199.81",
      trusted: false,
      lastSeenTs: Date.now() - 2 * 60 * 1000,
      status: "Current",
    },
    {
      id: "S-002",
      device: "Android App",
      location: "Kampala, UG",
      ip: "41.190.31.12",
      trusted: true,
      lastSeenTs: Date.now() - 6 * 60 * 60 * 1000,
      status: "Active",
    },
    {
      id: "S-003",
      device: "Mac Safari",
      location: "Wuxi, CN",
      ip: "103.42.111.9",
      trusted: false,
      lastSeenTs: Date.now() - 6 * 24 * 60 * 60 * 1000,
      status: "Signed out",
    },
  ]);

  // Conditional access policies
  const [ipAllowEnabled, setIpAllowEnabled] = useState(false);
  const [ipAllow, setIpAllow] = useState<string[]>(["196.43.199.81", "41.190.31.12"]);
  const [ipNew, setIpNew] = useState("");

  const [geoAllowEnabled, setGeoAllowEnabled] = useState(false);
  const [geoAllow, setGeoAllow] = useState<string[]>(["Kampala, UG", "Entebbe, UG"]);
  const [geoNew, setGeoNew] = useState("");

  const [timeRestrictEnabled, setTimeRestrictEnabled] = useState(false);
  const [timeStart, setTimeStart] = useState("06:00");
  const [timeEnd, setTimeEnd] = useState("22:00");
  const [timeDays, setTimeDays] = useState<string[]>(["Mon", "Tue", "Wed", "Thu", "Fri"]);

  // Simulated current context
  const [ctxIp, setCtxIp] = useState("196.43.199.81");
  const [ctxGeo, setCtxGeo] = useState("Kampala, UG");
  const [ctxDay, setCtxDay] = useState("Wed");
  const [ctxTime, setCtxTime] = useState("10:30");

  // Break-glass
  const [breakGlass, setBreakGlass] = useState<BreakGlassAccount[]>(() => [
    {
      id: "BG-001",
      email: "breakglass-admin@acme.com",
      enabled: true,
      locked: false,
      lastRotatedTs: Date.now() - 60 * 24 * 60 * 60 * 1000,
      lastUsedTs: null,
      notes: "Emergency-only. Dual-control recommended.",
      emergencyCodes: generateBackupCodes(10),
    },
  ]);

  const [bgModalOpen, setBgModalOpen] = useState(false);
  const [bgSelectedId, setBgSelectedId] = useState<string | null>(null);

  // Security events
  const [events, setEvents] = useState<SecurityEvent[]>(() => [
    {
      id: "EVT-9001",
      ts: Date.now() - 20 * 60 * 1000,
      severity: "Warning",
      actor: "System",
      category: "Tamper",
      title: "MFA disable attempt blocked",
      detail: "A user attempted to disable MFA but policy requires MFA for Finance roles.",
      status: "Open",
    },
    {
      id: "EVT-9002",
      ts: Date.now() - 2 * 60 * 60 * 1000,
      severity: "Info",
      actor: "Org Admin",
      category: "Policy",
      title: "Updated MFA policy",
      detail: "Set MFA required for Approver and Admin roles.",
      status: "Resolved",
    },
    {
      id: "EVT-9003",
      ts: Date.now() - 9 * 60 * 60 * 1000,
      severity: "Critical",
      actor: "System",
      category: "Session",
      title: "Unusual login detected",
      detail: "Impossible travel signal. Step-up authentication required.",
      status: "Open",
    },
  ]);

  const [eventFilter, setEventFilter] = useState<"All" | "Open" | "Resolved">("All");
  const [severityFilter, setSeverityFilter] = useState<"All" | "Info" | "Warning" | "Critical">("All");

  const addEvent = (e: Omit<SecurityEvent, "id" | "ts" | "status"> & { status?: SecurityEvent["status"] }) => {
    const event: SecurityEvent = {
      id: uid("EVT"),
      ts: Date.now(),
      status: e.status ?? "Open",
      ...e,
    };
    setEvents((p) => [event, ...p]);
  };

  // Derived
  const conditionalResult = useMemo(() =>
    evaluateConditionalAccess({
      ip: ctxIp,
      geo: ctxGeo,
      day: ctxDay,
      time: ctxTime,
      ipEnabled: ipAllowEnabled,
      ipAllow,
      geoEnabled: geoAllowEnabled,
      geoAllow,
      timeEnabled: timeRestrictEnabled,
      timeStart,
      timeEnd,
      timeDays,
    }),
    [ctxIp, ctxGeo, ctxDay, ctxTime, ipAllowEnabled, ipAllow, geoAllowEnabled, geoAllow, timeRestrictEnabled, timeStart, timeEnd, timeDays]
  );

  const openEventsCount = useMemo(() => events.filter((e) => e.status === "Open").length, [events]);
  const criticalOpenCount = useMemo(() => events.filter((e) => e.status === "Open" && e.severity === "Critical").length, [events]);

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (eventFilter !== "All" && e.status !== eventFilter) return false;
      if (severityFilter !== "All" && e.severity !== severityFilter) return false;
      return true;
    });
  }, [events, eventFilter, severityFilter]);

  const exportEvents = (format: "csv" | "json") => {
    if (format === "json") {
      downloadText("corporatepay-security-events.json", JSON.stringify(events, null, 2));
      toast({ title: "Exported", message: "Security events exported as JSON.", kind: "success" });
      return;
    }
    const csv = exportEventsCSV(events);
    downloadText("corporatepay-security-events.csv", csv);
    toast({ title: "Exported", message: "Security events exported as CSV.", kind: "success" });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied", message: "Copied to clipboard.", kind: "success" });
    } catch {
      toast({ title: "Copy failed", message: "Copy manually.", kind: "warn" });
    }
  };

  // Actions
  const verifyMfa = () => {
    if (verifyCode.trim().length < 6) {
      toast({ title: "Invalid code", message: "Enter a 6-digit code.", kind: "warn" });
      return;
    }
    setMfaEnabled(true);
    addEvent({ severity: "Info", actor: "You", category: "MFA", title: "MFA enabled", detail: "Authenticator verified successfully." });
    toast({ title: "MFA enabled", message: "Authenticator verified.", kind: "success" });
  };

  const genBackup = () => {
    const codes = generateBackupCodes(10);
    setBackupCodes(codes);
    addEvent({ severity: "Info", actor: "You", category: "MFA", title: "Backup codes generated", detail: "Generated 10 backup codes." });
    toast({ title: "Generated", message: "Backup codes generated.", kind: "success" });
  };

  const downloadBackup = () => {
    downloadText("evzone-corporatepay-backup-codes.txt", backupCodes.join("\n"));
    toast({ title: "Downloaded", message: "Backup codes downloaded.", kind: "success" });
  };

  const toggleRolePolicy = (roleKey: string) => {
    setRequireMfa((prev) => {
      const next = { ...prev, [roleKey]: !prev[roleKey as keyof typeof prev] };
      addEvent({
        severity: "Info",
        actor: "Org Admin",
        category: "Policy",
        title: "MFA policy updated",
        detail: `Role ${roleKey}: ${next[roleKey as keyof typeof next] ? "required" : "optional"}`,
      });
      return next;
    });
  };

  const revokeOtherSessions = () => {
    setSessions((prev) => prev.map((s) => (s.status === "Current" ? s : { ...s, status: "Signed out" })));
    addEvent({ severity: "Warning", actor: "You", category: "Session", title: "Forced sign-out", detail: "Signed out all other active sessions." });
    toast({ title: "Signed out", message: "All other sessions were signed out.", kind: "success" });
  };

  const signOutSession = (id: string) => {
    setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, status: "Signed out" } : s)));
    addEvent({ severity: "Info", actor: "You", category: "Session", title: "Session signed out", detail: `Session ${id} signed out.` });
    toast({ title: "Signed out", message: `Session ${id} signed out.",`, kind: "success" });
  };

  const toggleTrust = (id: string) => {
    setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, trusted: !s.trusted } : s)));
    addEvent({ severity: "Info", actor: "You", category: "Device", title: "Device trust changed", detail: `Trust updated for ${id}.` });
    toast({ title: "Updated", message: "Device trust updated.", kind: "success" });
  };

  const addIpAllow = () => {
    const v = ipNew.trim();
    if (!v) {
      toast({ title: "Missing IP", message: "Enter an IP address.", kind: "warn" });
      return;
    }
    if (ipAllow.includes(v)) {
      toast({ title: "Exists", message: "IP already in allowlist.", kind: "info" });
      return;
    }
    setIpAllow((p) => [v, ...p]);
    setIpNew("");
    addEvent({ severity: "Info", actor: "Org Admin", category: "Policy", title: "IP allowlist changed", detail: `Added ${v}.` });
    toast({ title: "Added", message: "IP added to allowlist.", kind: "success" });
  };

  const removeIpAllow = (v: string) => {
    setIpAllow((p) => p.filter((x) => x !== v));
    addEvent({ severity: "Info", actor: "Org Admin", category: "Policy", title: "IP allowlist changed", detail: `Removed ${v}.` });
  };

  const addGeoAllow = () => {
    const v = geoNew.trim();
    if (!v) {
      toast({ title: "Missing geo", message: "Enter a location.", kind: "warn" });
      return;
    }
    if (geoAllow.map((g) => g.toLowerCase()).includes(v.toLowerCase())) {
      toast({ title: "Exists", message: "Location already in allowlist.", kind: "info" });
      return;
    }
    setGeoAllow((p) => [v, ...p]);
    setGeoNew("");
    addEvent({ severity: "Info", actor: "Org Admin", category: "Policy", title: "Geo allowlist changed", detail: `Added ${v}.` });
    toast({ title: "Added", message: "Location added to allowlist.", kind: "success" });
  };

  const removeGeoAllow = (v: string) => {
    setGeoAllow((p) => p.filter((x) => x !== v));
    addEvent({ severity: "Info", actor: "Org Admin", category: "Policy", title: "Geo allowlist changed", detail: `Removed ${v}.` });
  };

  const toggleDay = (d: string) => {
    setTimeDays((prev) => {
      const on = prev.includes(d);
      const next = on ? prev.filter((x) => x !== d) : [...prev, d];
      addEvent({ severity: "Info", actor: "Org Admin", category: "Policy", title: "Time restriction changed", detail: `Allowed days updated: ${next.join(", ")}` });
      return next;
    });
  };

  const resolveEvent = (id: string) => {
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, status: "Resolved" } : e)));
    toast({ title: "Resolved", message: `Event ${id} marked resolved.",`, kind: "success" });
  };

  const openBreakGlass = (id: string) => {
    setBgSelectedId(id);
    setBgModalOpen(true);
  };

  const rotateBreakGlassCodes = (id: string) => {
    setBreakGlass((prev) =>
      prev.map((b) =>
        b.id === id
          ? {
              ...b,
              emergencyCodes: generateBackupCodes(12),
              lastRotatedTs: Date.now(),
            }
          : b
      )
    );
    addEvent({ severity: "Warning", actor: "Org Admin", category: "Break-glass", title: "Emergency codes rotated", detail: `Rotated emergency codes for ${id}.` });
    toast({ title: "Rotated", message: "Emergency codes rotated.", kind: "success" });
  };

  const toggleBreakGlassEnabled = (id: string) => {
    setBreakGlass((prev) => prev.map((b) => (b.id === id ? { ...b, enabled: !b.enabled } : b)));
    addEvent({ severity: "Warning", actor: "Org Admin", category: "Break-glass", title: "Break-glass status changed", detail: `Toggled enabled state for ${id}.` });
  };

  const toggleBreakGlassLock = (id: string) => {
    setBreakGlass((prev) => prev.map((b) => (b.id === id ? { ...b, locked: !b.locked } : b)));
    addEvent({ severity: "Critical", actor: "Org Admin", category: "Break-glass", title: "Break-glass lock changed", detail: `Toggled lock state for ${id}.` });
  };

  const complianceBadges = useMemo(() => {
    const reqCount = Object.values(requireMfa).filter(Boolean).length;
    return {
      policy: `MFA required roles: ${reqCount}`,
      conditional: ipAllowEnabled || geoAllowEnabled || timeRestrictEnabled ? "Conditional access on" : "Conditional access off",
    };
  }, [requireMfa, ipAllowEnabled, geoAllowEnabled, timeRestrictEnabled]);

  return (
    <div className="min-h-screen" style={{ background: "radial-gradient(90% 60% at 50% 0%, rgba(3,205,140,0.18), rgba(255,255,255,0))" }}>
      <ToastStack toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((x) => x.id !== id))} />

      <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
        <div className="rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(2,8,23,0.10)]">
          {/* Header */}
          <div className="border-b border-slate-200 bg-white px-6 py-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="flex items-start gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl text-white" style={{ background: EVZ.green }}>
                  <Fingerprint className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">MFA and Device Trust</div>
                  <div className="mt-1 text-xs text-slate-500">Secure access policies, trusted devices, and exportable security events.</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Pill label={mfaEnabled ? "MFA: Enabled" : "MFA: Not enabled"} tone={mfaEnabled ? "good" : "warn"} />
                    <Pill label={trustThisDevice ? `Trust: ${trustExpiryDays} days` : "Trust: Off"} tone={trustThisDevice ? "info" : "neutral"} />
                    <Pill label={complianceBadges.conditional} tone={ipAllowEnabled || geoAllowEnabled || timeRestrictEnabled ? "warn" : "neutral"} />
                    <Pill label={`Open alerts: ${openEventsCount}`} tone={openEventsCount ? "warn" : "good"} />
                    {criticalOpenCount ? <Pill label={`Critical: ${criticalOpenCount}`} tone="bad" /> : null}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={() => exportEvents("csv")}>
                  <Download className="h-4 w-4" /> Export CSV
                </Button>
                <Button variant="outline" onClick={() => exportEvents("json")}>
                  <FileText className="h-4 w-4" /> Export JSON
                </Button>
                <Button variant="primary" onClick={() => toast({ title: "Saved", message: "Security settings saved (demo).", kind: "success" })}>
                  <Check className="h-4 w-4" /> Save
                </Button>
              </div>
            </div>

            {/* Tabs */}
            <div className="mt-5 flex flex-wrap gap-2">
              {[
                { id: "setup", label: "MFA setup" },
                { id: "trust", label: "Device trust and sessions" },
                { id: "conditional", label: "Conditional access" },
                { id: "breakglass", label: "Break-glass" },
                { id: "events", label: "Tamper alerts and events" },
              ].map((t) => (
                <button
                  key={t.id}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-semibold ring-1 transition",
                    tab === t.id ? "text-white ring-emerald-600" : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
                  )}
                  style={tab === t.id ? { background: EVZ.green } : undefined}
                  onClick={() => setTab(t.id as any)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Body */}
          <div className="bg-slate-50 px-6 py-6">
            <AnimatePresence mode="wait">
              {tab === "setup" ? (
                <motion.div key="setup" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <Card title="Authenticator" subtitle="Scan QR and verify a code" right={<Pill label={mfaEnabled ? "Enabled" : "Setup"} tone={mfaEnabled ? "good" : "warn"} />}>
                      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                        <div className="text-xs font-semibold text-slate-700">QR placeholder</div>
                        <div className="mt-3 grid place-items-center rounded-3xl bg-white p-6 ring-1 ring-slate-200">
                          <div className="grid h-40 w-40 place-items-center rounded-2xl border border-slate-200 bg-white">
                            <div className="text-center">
                              <div className="text-sm font-semibold text-slate-900">QR</div>
                              <div className="mt-1 text-xs text-slate-500">Authenticator setup</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4">
                        <div className="text-xs font-semibold text-slate-600">Secret key</div>
                        <div className="mt-2 flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                          <span className="font-mono text-sm font-semibold text-slate-900">{secret}</span>
                          <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => copyToClipboard(secret)}>
                            <Copy className="h-4 w-4" /> Copy
                          </Button>
                        </div>

                        <div className="mt-3">
                          <div className="text-xs font-semibold text-slate-600">Verification code</div>
                          <input
                            value={verifyCode}
                            onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                            placeholder="123456"
                            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 shadow-sm outline-none focus:ring-4 focus:ring-emerald-100"
                          />
                          <div className="mt-2 text-xs text-slate-500">Demo: any 6 digits enable MFA.</div>
                        </div>

                        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
                          <Button variant="outline" onClick={() => toast({ title: "Help", message: "MFA setup help (demo).", kind: "info" })}>
                            <HelpCircle className="h-4 w-4" /> Help
                          </Button>
                          <Button variant="primary" onClick={verifyMfa} disabled={mfaEnabled}>
                            <Check className="h-4 w-4" /> Verify
                          </Button>
                        </div>
                      </div>

                      <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                        Admin policy can require MFA by role (Finance, Approver, Admin).
                      </div>
                    </Card>

                    <Card title="Backup codes" subtitle="Emergency access if phone is unavailable" right={<Pill label={backupCodes.length ? "Generated" : "Not generated"} tone={backupCodes.length ? "good" : "warn"} />}>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button variant="primary" onClick={genBackup}>
                          <KeyRound className="h-4 w-4" /> Generate
                        </Button>
                        <Button variant="outline" disabled={!backupCodes.length} onClick={() => copyToClipboard(backupCodes.join("\n"))}>
                          <Copy className="h-4 w-4" /> Copy all
                        </Button>
                        <Button variant="outline" disabled={!backupCodes.length} onClick={downloadBackup}>
                          <Download className="h-4 w-4" /> Download
                        </Button>
                        <Button
                          variant="outline"
                          disabled={!backupCodes.length}
                          onClick={() => {
                            setBackupCodes([]);
                            addEvent({ severity: "Warning", actor: "You", category: "MFA", title: "Backup codes cleared", detail: "Backup codes cleared. Generate again if needed." });
                            toast({ title: "Cleared", message: "Backup codes cleared.", kind: "warn" });
                          }}
                        >
                          <Trash2 className="h-4 w-4" /> Clear
                        </Button>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {backupCodes.length ? (
                          backupCodes.map((c) => (
                            <div key={c} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-2">
                              <span className="font-mono text-sm font-semibold text-slate-900">{c}</span>
                              <Pill label="One-time" tone="neutral" />
                            </div>
                          ))
                        ) : (
                          <div className="sm:col-span-2 rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center">
                            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-700">
                              <KeyRound className="h-6 w-6" />
                            </div>
                            <div className="mt-3 text-sm font-semibold text-slate-900">No backup codes</div>
                            <div className="mt-1 text-sm text-slate-600">Generate and store securely.</div>
                          </div>
                        )}
                      </div>

                      <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                        Premium: backup code use should create an audit event and trigger a security alert.
                      </div>
                    </Card>

                    <Card title="Admin MFA policies" subtitle="Require MFA by role" right={<Pill label={complianceBadges.policy} tone="info" />}>
                      <div className="space-y-2">
                        {Object.keys(requireMfa).map((k) => (
                          <div key={k} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-2">
                            <div className="text-sm font-semibold text-slate-800">{k}</div>
                            <button
                              type="button"
                              className={cn(
                                "relative h-7 w-12 rounded-full border transition",
                                requireMfa[k as keyof typeof requireMfa] ? "border-emerald-300 bg-emerald-200" : "border-slate-200 bg-white"
                              )}
                              onClick={() => toggleRolePolicy(k)}
                              aria-label={`Toggle MFA required for ${k}`}
                            >
                              <span
                                className={cn(
                                  "absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition",
                                  requireMfa[k as keyof typeof requireMfa] ? "left-[22px]" : "left-1"
                                )}
                              />
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                        Recommendation: keep MFA required for Finance, Approver, and Admin roles.
                      </div>
                    </Card>
                  </div>
                </motion.div>
              ) : null}

              {tab === "trust" ? (
                <motion.div key="trust" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <Card title="Trust this device" subtitle="Reduce repeated prompts" right={<Pill label={trustThisDevice ? "Enabled" : "Off"} tone={trustThisDevice ? "good" : "neutral"} />}>
                      <Toggle
                        enabled={trustThisDevice}
                        onChange={(v) => {
                          setTrustThisDevice(v);
                          addEvent({ severity: "Info", actor: "You", category: "Device", title: "Trust device toggled", detail: `Trust device ${v ? "enabled" : "disabled"}.` });
                          toast({ title: "Updated", message: "Trust device updated.", kind: "success" });
                        }}
                        label="Trust this device"
                        description="If enabled, step-up prompts are reduced for this device."
                      />

                      <div className="mt-3">
                        <div className="text-xs font-semibold text-slate-600">Expiry</div>
                        <select
                          value={String(trustExpiryDays)}
                          onChange={(e) => {
                            setTrustExpiryDays(Number(e.target.value));
                            addEvent({ severity: "Info", actor: "You", category: "Device", title: "Trust expiry changed", detail: `Trust expiry set to ${e.target.value} days.` });
                          }}
                          disabled={!trustThisDevice}
                          className={cn(
                            "mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-emerald-100",
                            !trustThisDevice && "bg-slate-50 text-slate-500"
                          )}
                        >
                          {[7, 30, 90].map((d) => (
                            <option key={d} value={d}>
                              {d} days
                            </option>
                          ))}
                        </select>
                        <div className="mt-2 text-xs text-slate-500">Admin policy can cap trust duration.</div>
                      </div>

                      <Button
                        variant="danger"
                        className="mt-4 w-full"
                        onClick={() => {
                          setTrustThisDevice(false);
                          addEvent({ severity: "Warning", actor: "You", category: "Device", title: "Trusted device revoked", detail: "Trust revoked for current device." });
                          toast({ title: "Revoked", message: "Trusted device revoked.", kind: "warn" });
                        }}
                      >
                        <Trash2 className="h-4 w-4" /> Revoke trust
                      </Button>

                      <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                        Premium: trust revocation should trigger tamper alerts if unusual.
                      </div>
                    </Card>

                    <div className="lg:col-span-2 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                      <div className="flex flex-col gap-2 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">Login history and sessions</div>
                          <div className="mt-1 text-xs text-slate-500">Review devices, revoke access, and force sign-out.</div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Button variant="outline" className="text-xs" onClick={revokeOtherSessions}>
                            <LogOut className="h-4 w-4" /> Sign out others
                          </Button>
                          <Button
                            variant="danger"
                            className="text-xs"
                            onClick={() => {
                              setSessions((prev) => prev.map((s) => ({ ...s, status: s.status === "Current" ? "Current" : "Signed out" })));
                              addEvent({ severity: "Critical", actor: "You", category: "Session", title: "Global sign-out", detail: "All non-current sessions signed out." });
                              toast({ title: "Global sign-out", message: "All non-current sessions signed out.", kind: "warn" });
                            }}
                          >
                            <Shield className="h-4 w-4" /> Force global sign-out
                          </Button>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                          <thead className="bg-slate-50 text-xs text-slate-600">
                            <tr>
                              <th className="px-4 py-3 font-semibold">Session</th>
                              <th className="px-4 py-3 font-semibold">Device</th>
                              <th className="px-4 py-3 font-semibold">Location</th>
                              <th className="px-4 py-3 font-semibold">IP</th>
                              <th className="px-4 py-3 font-semibold">Trusted</th>
                              <th className="px-4 py-3 font-semibold">Last seen</th>
                              <th className="px-4 py-3 font-semibold">Status</th>
                              <th className="px-4 py-3 font-semibold">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sessions.map((s) => (
                              <tr key={s.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                                <td className="px-4 py-3 font-semibold text-slate-900">{s.id}</td>
                                <td className="px-4 py-3 text-slate-700">{s.device}</td>
                                <td className="px-4 py-3 text-slate-700">{s.location}</td>
                                <td className="px-4 py-3 text-slate-700">{s.ip}</td>
                                <td className="px-4 py-3">
                                  <Pill label={s.trusted ? "Yes" : "No"} tone={s.trusted ? "good" : "neutral"} />
                                </td>
                                <td className="px-4 py-3 text-slate-700">{timeAgo(s.lastSeenTs)}</td>
                                <td className="px-4 py-3">
                                  <Pill label={s.status} tone={s.status === "Current" ? "info" : s.status === "Active" ? "good" : "neutral"} />
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => toggleTrust(s.id)}>
                                      <Fingerprint className="h-4 w-4" /> {s.trusted ? "Untrust" : "Trust"}
                                    </Button>
                                    {s.status !== "Current" && s.status !== "Signed out" ? (
                                      <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => signOutSession(s.id)}>
                                        <LogOut className="h-4 w-4" /> Sign out
                                      </Button>
                                    ) : null}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="border-t border-slate-200 px-4 py-3 text-xs text-slate-500">
                        Forced sign-out controls should be audit logged and may require step-up auth.
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : null}

              {tab === "conditional" ? (
                <motion.div key="conditional" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <Card title="Conditional access policies" subtitle="IP allowlist, geo allowlist, and time restrictions" right={<Pill label={ipAllowEnabled || geoAllowEnabled || timeRestrictEnabled ? "Enabled" : "Off"} tone={ipAllowEnabled || geoAllowEnabled || timeRestrictEnabled ? "warn" : "neutral"} />}>
                      <Toggle
                        enabled={ipAllowEnabled}
                        onChange={(v) => {
                          setIpAllowEnabled(v);
                          addEvent({ severity: "Info", actor: "Org Admin", category: "Policy", title: "IP allowlist toggled", detail: v ? "Enabled" : "Disabled" });
                        }}
                        label="IP allowlist"
                        description="If enabled, IPs outside allowlist trigger step-up authentication."
                      />
                      <Toggle
                        enabled={geoAllowEnabled}
                        onChange={(v) => {
                          setGeoAllowEnabled(v);
                          addEvent({ severity: "Info", actor: "Org Admin", category: "Policy", title: "Geo allowlist toggled", detail: v ? "Enabled" : "Disabled" });
                        }}
                        label="Geo allowlist"
                        description="If enabled, locations outside allowlist trigger step-up authentication."
                      />
                      <Toggle
                        enabled={timeRestrictEnabled}
                        onChange={(v) => {
                          setTimeRestrictEnabled(v);
                          addEvent({ severity: "Info", actor: "Org Admin", category: "Policy", title: "Time restriction toggled", detail: v ? "Enabled" : "Disabled" });
                        }}
                        label="Time restrictions"
                        description="If enabled, access outside allowed hours triggers step-up authentication."
                      />

                      <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                        Premium: you can switch from step-up to block for specific modules (Billing, Security) later.
                      </div>
                    </Card>

                    <div className="lg:col-span-2 space-y-4">
                      <Card title="IP allowlist" subtitle="Manage allowed IP addresses" right={<Pill label={ipAllowEnabled ? "On" : "Off"} tone={ipAllowEnabled ? "warn" : "neutral"} />}>
                        <div className="flex flex-wrap gap-2">
                          {ipAllow.map((ip) => (
                            <span key={ip} className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                              {ip}
                              <button type="button" className="rounded-full p-1 hover:bg-slate-200" onClick={() => removeIpAllow(ip)} aria-label={`Remove ${ip}`}>
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </span>
                          ))}
                          {!ipAllow.length ? <Pill label="No IPs" tone="warn" /> : null}
                        </div>
                        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                          <div className="sm:col-span-2">
                            <Field label="Add IP" value={ipNew} onChange={setIpNew} placeholder="196.43.199.81" />
                          </div>
                          <div className="flex items-end">
                            <Button variant="outline" className="w-full" onClick={addIpAllow}>
                              <Plus className="h-4 w-4" /> Add
                            </Button>
                          </div>
                        </div>
                      </Card>

                      <Card title="Geo allowlist" subtitle="Manage allowed locations" right={<Pill label={geoAllowEnabled ? "On" : "Off"} tone={geoAllowEnabled ? "warn" : "neutral"} />}>
                        <div className="flex flex-wrap gap-2">
                          {geoAllow.map((g) => (
                            <span key={g} className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                              {g}
                              <button type="button" className="rounded-full p-1 hover:bg-slate-200" onClick={() => removeGeoAllow(g)} aria-label={`Remove ${g}`}>
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </span>
                          ))}
                          {!geoAllow.length ? <Pill label="No locations" tone="warn" /> : null}
                        </div>
                        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                          <div className="sm:col-span-2">
                            <Field label="Add location" value={geoNew} onChange={setGeoNew} placeholder="Kampala, UG" />
                          </div>
                          <div className="flex items-end">
                            <Button variant="outline" className="w-full" onClick={addGeoAllow}>
                              <Plus className="h-4 w-4" /> Add
                            </Button>
                          </div>
                        </div>
                      </Card>

                      <Card title="Time restrictions" subtitle="Allowed days and hours" right={<Pill label={timeRestrictEnabled ? "On" : "Off"} tone={timeRestrictEnabled ? "warn" : "neutral"} />}>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <Field label="Start" value={timeStart} onChange={setTimeStart} type="time" />
                          <Field label="End" value={timeEnd} onChange={setTimeEnd} type="time" />
                        </div>
                        <div className="mt-3">
                          <div className="text-xs font-semibold text-slate-600">Allowed days</div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => {
                              const on = timeDays.includes(d);
                              return (
                                <button
                                  key={d}
                                  type="button"
                                  className={cn(
                                    "rounded-full px-4 py-2 text-sm font-semibold ring-1 transition",
                                    on ? "text-white ring-emerald-600" : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
                                  )}
                                  style={on ? { background: EVZ.green } : undefined}
                                  onClick={() => toggleDay(d)}
                                >
                                  {d}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                          Tip: keep restrictions strict for Billing and Security roles.
                        </div>
                      </Card>

                      <Card title="Policy preview" subtitle="Evaluate the current session context" right={<Pill label={conditionalResult.status} tone={conditionalResult.status === "Allowed" ? "good" : "warn"} />}>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <Field label="Current IP" value={ctxIp} onChange={setCtxIp} placeholder="196.43.199.81" />
                          <Field label="Current geo" value={ctxGeo} onChange={setCtxGeo} placeholder="Kampala, UG" />
                          <Field label="Day" value={ctxDay} onChange={setCtxDay} placeholder="Wed" hint="Mon..Sun" />
                          <Field label="Time" value={ctxTime} onChange={setCtxTime} type="time" />
                        </div>
                        {conditionalResult.reasons.length ? (
                          <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                            <div className="font-semibold">Reasons</div>
                            <ul className="mt-2 space-y-1">
                              {conditionalResult.reasons.map((r) => (
                                <li key={r}>• {r}</li>
                              ))}
                            </ul>
                          </div>
                        ) : (
                          <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">
                            Allowed: no step-up required.
                          </div>
                        )}
                      </Card>
                    </div>
                  </div>
                </motion.div>
              ) : null}

              {tab === "breakglass" ? (
                <motion.div key="breakglass" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <Card title="Break-glass overview" subtitle="Emergency-only admin accounts" right={<Pill label="Premium" tone="info" />}>
                      <div className="rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                        Break-glass is for emergencies only. Recommended controls:
                        <ul className="mt-2 space-y-1">
                          <li>1) Dual-control approval to unlock</li>
                          <li>2) Step-up authentication always</li>
                          <li>3) Rotate emergency codes after any use</li>
                        </ul>
                      </div>
                      <Button
                        variant="outline"
                        className="mt-3 w-full"
                        onClick={() => {
                          addEvent({ severity: "Critical", actor: "System", category: "Tamper", title: "Tamper alert test", detail: "Simulated tamper alert triggered." });
                          toast({ title: "Tamper test", message: "Created a simulated tamper alert.", kind: "warn" });
                        }}
                      >
                        <AlertTriangle className="h-4 w-4" /> Trigger tamper test
                      </Button>
                    </Card>

                    <div className="lg:col-span-2 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                      <div className="border-b border-slate-200 px-4 py-3">
                        <div className="text-sm font-semibold text-slate-900">Break-glass accounts</div>
                        <div className="mt-1 text-xs text-slate-500">View codes, rotate, lock, and audit usage.</div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                          <thead className="bg-slate-50 text-xs text-slate-600">
                            <tr>
                              <th className="px-4 py-3 font-semibold">Email</th>
                              <th className="px-4 py-3 font-semibold">Enabled</th>
                              <th className="px-4 py-3 font-semibold">Locked</th>
                              <th className="px-4 py-3 font-semibold">Last rotated</th>
                              <th className="px-4 py-3 font-semibold">Last used</th>
                              <th className="px-4 py-3 font-semibold">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {breakGlass.map((b) => (
                              <tr key={b.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                                <td className="px-4 py-3 font-semibold text-slate-900">{b.email}</td>
                                <td className="px-4 py-3"><Pill label={b.enabled ? "Yes" : "No"} tone={b.enabled ? "good" : "neutral"} /></td>
                                <td className="px-4 py-3"><Pill label={b.locked ? "Locked" : "Open"} tone={b.locked ? "bad" : "neutral"} /></td>
                                <td className="px-4 py-3 text-slate-700">{timeAgo(b.lastRotatedTs)}</td>
                                <td className="px-4 py-3 text-slate-700">{b.lastUsedTs ? timeAgo(b.lastUsedTs) : "Never"}</td>
                                <td className="px-4 py-3">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => openBreakGlass(b.id)}>
                                      <KeyRound className="h-4 w-4" /> View codes
                                    </Button>
                                    <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => rotateBreakGlassCodes(b.id)}>
                                      <Sparkles className="h-4 w-4" /> Rotate
                                    </Button>
                                    <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => toggleBreakGlassEnabled(b.id)}>
                                      <Shield className="h-4 w-4" /> Toggle enabled
                                    </Button>
                                    <Button variant="danger" className="px-3 py-2 text-xs" onClick={() => toggleBreakGlassLock(b.id)}>
                                      <Lock className="h-4 w-4" /> {b.locked ? "Unlock" : "Lock"}
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="border-t border-slate-200 px-4 py-3 text-xs text-slate-500">
                        Premium: break-glass unlock should require dual approval and create tamper alerts.
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : null}

              {tab === "events" ? (
                <motion.div key="events" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <Card title="Tamper alerts" subtitle="Detect and respond to unusual actions" right={<Pill label={`${openEventsCount} open`} tone={openEventsCount ? "warn" : "good"} />}>
                      <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-700">
                        Tamper events include:
                        <ul className="mt-2 space-y-1 text-xs text-slate-600">
                          <li>1) MFA disable attempts</li>
                          <li>2) Break-glass changes</li>
                          <li>3) Conditional access bypass attempts</li>
                          <li>4) Forced sign-out anomalies</li>
                        </ul>
                      </div>
                      <Button
                        variant="outline"
                        className="mt-3 w-full"
                        onClick={() => {
                          addEvent({ severity: "Critical", actor: "System", category: "Tamper", title: "Policy tamper detected", detail: "Attempt to modify allowlist without permission." });
                          toast({ title: "Tamper event", message: "Created a simulated tamper event.", kind: "warn" });
                        }}
                      >
                        <AlertTriangle className="h-4 w-4" /> Simulate tamper
                      </Button>
                    </Card>

                    <div className="lg:col-span-2 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                      <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">Security events</div>
                          <div className="mt-1 text-xs text-slate-500">Exportable logs for audits and incident response.</div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <select
                            value={eventFilter}
                            onChange={(e) => setEventFilter(e.target.value as any)}
                            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none"
                          >
                            {(["All", "Open", "Resolved"] as const).map((x) => (
                              <option key={x} value={x}>
                                {x}
                              </option>
                            ))}
                          </select>
                          <select
                            value={severityFilter}
                            onChange={(e) => setSeverityFilter(e.target.value as any)}
                            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none"
                          >
                            {(["All", "Info", "Warning", "Critical"] as const).map((x) => (
                              <option key={x} value={x}>
                                {x}
                              </option>
                            ))}
                          </select>
                          <Button variant="outline" className="text-xs" onClick={() => exportEvents("csv")}>
                            <Download className="h-4 w-4" /> CSV
                          </Button>
                          <Button variant="outline" className="text-xs" onClick={() => exportEvents("json")}>
                            <FileText className="h-4 w-4" /> JSON
                          </Button>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                          <thead className="bg-slate-50 text-xs text-slate-600">
                            <tr>
                              <th className="px-4 py-3 font-semibold">Time</th>
                              <th className="px-4 py-3 font-semibold">Severity</th>
                              <th className="px-4 py-3 font-semibold">Category</th>
                              <th className="px-4 py-3 font-semibold">Title</th>
                              <th className="px-4 py-3 font-semibold">Actor</th>
                              <th className="px-4 py-3 font-semibold">Status</th>
                              <th className="px-4 py-3 font-semibold">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredEvents.map((e) => (
                              <tr key={e.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                                <td className="px-4 py-3 text-slate-700">{formatDateTime(e.ts)}</td>
                                <td className="px-4 py-3"><Pill label={e.severity} tone={severityTone(e.severity)} /></td>
                                <td className="px-4 py-3 text-slate-700">{e.category}</td>
                                <td className="px-4 py-3">
                                  <div className="font-semibold text-slate-900">{e.title}</div>
                                  <div className="mt-0.5 text-xs text-slate-500">{e.detail}</div>
                                  <div className="mt-0.5 text-xs text-slate-400">{e.id}</div>
                                </td>
                                <td className="px-4 py-3 text-slate-700">{e.actor}</td>
                                <td className="px-4 py-3"><Pill label={e.status} tone={e.status === "Open" ? "warn" : "good"} /></td>
                                <td className="px-4 py-3">
                                  <div className="flex flex-wrap items-center gap-2">
                                    {e.status === "Open" ? (
                                      <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => resolveEvent(e.id)}>
                                        <Check className="h-4 w-4" /> Resolve
                                      </Button>
                                    ) : (
                                      <Pill label="Resolved" tone="good" />
                                    )}
                                    <Button
                                      variant="outline"
                                      className="px-3 py-2 text-xs"
                                      onClick={() => {
                                        toast({ title: "Details", message: "Open event detail panel (demo).", kind: "info" });
                                      }}
                                    >
                                      <Info className="h-4 w-4" /> Details
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                            {!filteredEvents.length ? (
                              <tr>
                                <td colSpan={7} className="px-4 py-10">
                                  <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center">
                                    <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-700">
                                      <Shield className="h-6 w-6" />
                                    </div>
                                    <div className="mt-3 text-sm font-semibold text-slate-900">No events</div>
                                    <div className="mt-1 text-sm text-slate-600">Try changing filters.</div>
                                  </div>
                                </td>
                              </tr>
                            ) : null}
                          </tbody>
                        </table>
                      </div>

                      <div className="border-t border-slate-200 px-4 py-3 text-xs text-slate-500">
                        Events are exportable and audit-friendly. Tamper alerts should be immutable in production.
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Break-glass codes modal */}
      <Modal
        open={bgModalOpen}
        title="Break-glass emergency codes"
        subtitle="Emergency-only. Rotate after any use."
        onClose={() => setBgModalOpen(false)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setBgModalOpen(false)}>
              Close
            </Button>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  const bg = breakGlass.find((b) => b.id === bgSelectedId);
                  if (!bg) return;
                  copyToClipboard(bg.emergencyCodes.join("\n"));
                }}
              >
                <Copy className="h-4 w-4" /> Copy
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const bg = breakGlass.find((b) => b.id === bgSelectedId);
                  if (!bg) return;
                  downloadText(`breakglass-${bg.id}-codes.txt`, bg.emergencyCodes.join("\n"));
                  toast({ title: "Downloaded", message: "Emergency codes downloaded.", kind: "success" });
                }}
              >
                <Download className="h-4 w-4" /> Download
              </Button>
            </div>
          </div>
        }
      >
        {(() => {
          const bg = breakGlass.find((b) => b.id === bgSelectedId);
          if (!bg) return null;
          return (
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Pill label={bg.email} tone="neutral" />
                <Pill label={bg.enabled ? "Enabled" : "Disabled"} tone={bg.enabled ? "good" : "neutral"} />
                <Pill label={bg.locked ? "Locked" : "Open"} tone={bg.locked ? "bad" : "neutral"} />
                <Pill label={`Rotated: ${timeAgo(bg.lastRotatedTs)}`} tone="info" />
              </div>

              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {bg.emergencyCodes.map((c) => (
                  <div key={c} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-2">
                    <span className="font-mono text-sm font-semibold text-slate-900">{c}</span>
                    <Pill label="One-time" tone="neutral" />
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                Do not store these in plain text. Rotate after any use.
              </div>
            </div>
          );
        })()}
      </Modal>

      <footer className="border-t border-slate-200 bg-white/60 py-6">
        <div className="mx-auto max-w-7xl px-4 text-xs text-slate-500 md:px-6">
          X2 MFA page: authenticator setup, backup codes, device trust expiry, role-based MFA policies, session history + forced sign-out, conditional access policies, break-glass controls, tamper alerts, and exportable security events.
        </div>
      </footer>
    </div>
  );
}

function Card({
  title,
  subtitle,
  right,
  children,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
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

function severityTone(sev: "Info" | "Warning" | "Critical") {
  if (sev === "Critical") return "bad" as const;
  if (sev === "Warning") return "warn" as const;
  return "info" as const;
}
