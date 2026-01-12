import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BadgeCheck,
  Bell,
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  Fingerprint,
  Globe,
  HelpCircle,
  KeyRound,
  Laptop,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Shield,
  Smartphone,
  Ticket,
  User,
  Users,
  X,
  Layers,
  Search,
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

function formatDateTime(ts: number) {
  return new Date(ts).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
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

function Field({
  icon,
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  hint,
  required,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  const bad = !!required && !value.trim();
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-semibold text-slate-600">
          {label}
          {required ? <span className="text-rose-600"> *</span> : null}
        </div>
        {hint ? <div className="text-xs text-slate-500">{hint}</div> : null}
      </div>
      <div
        className={cn(
          "mt-2 flex items-center gap-2 rounded-2xl border bg-white px-3 py-2.5 shadow-sm focus-within:ring-4",
          disabled
            ? "border-slate-200 bg-slate-50 text-slate-500"
            : bad
              ? "border-rose-300 focus-within:ring-rose-100"
              : "border-slate-200 focus-within:ring-emerald-100"
        )}
      >
        <span className="text-slate-500">{icon}</span>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400",
            disabled && "text-slate-500"
          )}
        />
      </div>
      {bad ? (
        <div className="mt-1 text-xs text-rose-600">Required</div>
      ) : null}
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
  maxW = "720px",
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
            className="fixed inset-x-0 top-[10vh] z-50 mx-auto w-[min(820px,calc(100vw-2rem))] overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(2,8,23,0.22)]"
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

type SessionRow = {
  id: string;
  device: string;
  location: string;
  ip: string;
  trusted: boolean;
  lastSeenTs: number;
  current: boolean;
};

type AccessTicket = {
  id: string;
  org: string;
  requester: string;
  email: string;
  roleNeeded: string;
  reason: string;
  createdAt: number;
  status: "Submitted" | "In review" | "Approved" | "Denied";
};

export default function CorporatePayLoginOrgSelectorV2() {
  const navigate = useNavigate();
  const [toasts, setToasts] = useState<
    Array<{ id: string; title: string; message?: string; kind: string }>
  >([]);
  const toast = (t: { title: string; message?: string; kind: string }) => {
    const id = uid("toast");
    setToasts((p) => [{ id, ...t }, ...p].slice(0, 4));
    window.setTimeout(
      () => setToasts((p) => p.filter((x) => x.id !== id)),
      3200
    );
  };

  const [screen, setScreen] = useState<"login" | "org" | "ready">("login");

  const [email, setEmail] = useState("admin@acme.com");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);

  // Risk signals (demo)
  const [sigNewDevice, setSigNewDevice] = useState(true);
  const [sigNewGeo, setSigNewGeo] = useState(false);
  const [sigImpossibleTravel, setSigImpossibleTravel] = useState(false);

  const [ipSim, setIpSim] = useState("196.43.199.81");
  const [locationSim, setLocationSim] = useState("Kampala, UG");
  const [deviceSim, setDeviceSim] = useState("Windows Chrome");
  const [lastLoginSim, setLastLoginSim] = useState({
    location: "Kampala, UG",
    ts: Date.now() - 26 * 60 * 60 * 1000,
  });

  const riskScore = useMemo(() => {
    let score = 5;
    if (sigNewDevice) score += 35;
    if (sigNewGeo) score += 25;
    if (sigImpossibleTravel) score += 45;
    // boost if email looks sensitive
    const lower = email.toLowerCase();
    if (lower.includes("finance") || lower.includes("account")) score += 15;
    return clamp(score, 0, 100);
  }, [sigNewDevice, sigNewGeo, sigImpossibleTravel, email]);

  const riskLevel = useMemo(() => {
    if (riskScore >= 70) return { label: "High", tone: "bad" as const };
    if (riskScore >= 40) return { label: "Medium", tone: "warn" as const };
    return { label: "Low", tone: "good" as const };
  }, [riskScore]);

  // MFA step-up modal
  const [stepUpOpen, setStepUpOpen] = useState(false);
  const [mfaCode, setMfaCode] = useState("");
  const [stepUpReason, setStepUpReason] = useState("");
  const [pendingAuth, setPendingAuth] = useState<
    | null
    | {
      email: string;
      role: string;
      isSupport: boolean;
      needsOrgSelect: boolean;
    }
  >(null);

  // Org selection
  const [orgSearch, setOrgSearch] = useState("");
  const [orgs] = useState([
    "Acme Group Ltd",
    "Kampala Holdings",
    "EVzone Demo Org",
  ]);
  const [selectedOrg, setSelectedOrg] = useState("Acme Group Ltd");

  const needsOrgSelect = useMemo(() => {
    // Demo: "admin" accounts are multi-org
    return email.toLowerCase().includes("admin");
  }, [email]);

  // Support mode
  const [supportOpen, setSupportOpen] = useState(false);
  const [supportEmail, setSupportEmail] = useState("support@evzone.com");
  const [supportKey, setSupportKey] = useState("");
  const [supportMode, setSupportMode] = useState(false);
  const [supportSessionId, setSupportSessionId] = useState<string>("");
  const [watermark, setWatermark] = useState(true);

  const canUseSupportEntry = useMemo(() => {
    const okDomain = supportEmail.trim().toLowerCase().endsWith("@evzone.com");
    return okDomain && supportKey.trim().length >= 6;
  }, [supportEmail, supportKey]);

  // Sessions
  const [sessions, setSessions] = useState<SessionRow[]>(() => [
    {
      id: "S-001",
      device: "Windows Chrome",
      location: "Kampala, UG",
      ip: "196.43.199.81",
      trusted: false,
      lastSeenTs: Date.now() - 2 * 60 * 1000,
      current: true,
    },
    {
      id: "S-002",
      device: "Android App",
      location: "Kampala, UG",
      ip: "41.190.31.12",
      trusted: true,
      lastSeenTs: Date.now() - 6 * 60 * 60 * 1000,
      current: false,
    },
    {
      id: "S-003",
      device: "Mac Safari",
      location: "Wuxi, CN",
      ip: "103.42.111.9",
      trusted: false,
      lastSeenTs: Date.now() - 6 * 24 * 60 * 60 * 1000,
      current: false,
    },
  ]);

  // Access requests
  const [requestOpen, setRequestOpen] = useState(false);
  const [reqOrg, setReqOrg] = useState("");
  const [reqName, setReqName] = useState("");
  const [reqRole, setReqRole] = useState("Manager");
  const [reqReason, setReqReason] = useState("");
  const [tickets, setTickets] = useState<AccessTicket[]>([]);

  const roles = [
    "Org Admin",
    "Manager",
    "Accountant",
    "Approver",
    "Travel Coordinator",
    "User",
  ];

  const inferredRole = useMemo(() => {
    const e = email.toLowerCase();
    if (e.includes("finance") || e.includes("account")) return "Accountant";
    if (e.includes("approver")) return "Approver";
    if (e.includes("travel")) return "Travel Coordinator";
    if (e.includes("admin")) return "Org Admin";
    return "Manager";
  }, [email]);

  const requiresStepUp = useMemo(() => {
    // Policy: Accountants and Approvers require MFA. Also high risk requires step-up.
    const sensitiveRole = inferredRole === "Accountant" || inferredRole === "Approver";
    return riskScore >= 40 || sensitiveRole;
  }, [riskScore, inferredRole]);

  const startLogin = () => {
    if (!email.trim() || !password.trim()) {
      toast({
        title: "Missing details",
        message: "Enter your email and password to continue.",
        kind: "warn",
      });
      return;
    }

    // Simulate credential check
    toast({ title: "Credentials verified", message: "Checking session risk...", kind: "success" });

    const pending = {
      email,
      role: inferredRole,
      isSupport: false,
      needsOrgSelect,
    };

    if (requiresStepUp) {
      setPendingAuth(pending);
      setStepUpOpen(true);
      return;
    }

    // No step-up
    proceedAfterAuth(pending);
  };

  const proceedAfterAuth = (pending: { email: string; role: string; isSupport: boolean; needsOrgSelect: boolean }) => {
    if (pending.needsOrgSelect) {
      setScreen("org");
      return;
    }
    setSelectedOrg(selectedOrg);
    setScreen("ready");
    toast({ title: "Signed in", message: `Role: ${pending.role}`, kind: "success" });
  };

  const completeStepUp = () => {
    if (!pendingAuth) return;
    if (mfaCode.trim().length < 6) {
      toast({ title: "Invalid code", message: "Enter a 6-digit code.", kind: "warn" });
      return;
    }
    if (supportMode && !stepUpReason.trim()) {
      toast({ title: "Justification required", message: "Provide a reason for support session actions.", kind: "warn" });
      return;
    }

    setStepUpOpen(false);
    setMfaCode("");

    toast({
      title: "Step-up verified",
      message: "Security check passed. Continuing...",
      kind: "success",
    });

    proceedAfterAuth(pendingAuth);
    setPendingAuth(null);
  };

  const openSupport = () => {
    setSupportOpen(true);
  };

  const startSupportSession = () => {
    if (!canUseSupportEntry) {
      toast({ title: "Not allowed", message: "Use an EVzone email and valid key.", kind: "warn" });
      return;
    }

    const sessionId = `SUP-${Math.floor(100000 + Math.random() * 900000)}`;
    setSupportSessionId(sessionId);
    setSupportMode(true);

    setSupportOpen(false);

    // Support sign-in always step-up
    setPendingAuth({
      email: supportEmail,
      role: "EVzone Support",
      isSupport: true,
      needsOrgSelect: true,
    });
    setStepUpReason("Troubleshooting request");
    setStepUpOpen(true);

    toast({
      title: "Support mode requested",
      message: "Step-up authentication required.",
      kind: "info",
    });
  };

  const selectOrgAndContinue = () => {
    setScreen("ready");
    toast({
      title: "Organization selected",
      message: `Opening ${selectedOrg}.`,
      kind: "success",
    });
  };

  const createTicket = () => {
    if (!reqOrg.trim() || !reqName.trim() || !email.trim()) {
      toast({
        title: "Missing fields",
        message: "Organization, your name, and email are required.",
        kind: "warn",
      });
      return;
    }
    const id = `TCK-${Math.floor(100000 + Math.random() * 900000)}`;
    const t: AccessTicket = {
      id,
      org: reqOrg.trim(),
      requester: reqName.trim(),
      email: email.trim(),
      roleNeeded: reqRole,
      reason: reqReason.trim(),
      createdAt: Date.now(),
      status: "Submitted",
    };
    setTickets((p) => [t, ...p]);
    setRequestOpen(false);
    setReqOrg("");
    setReqName("");
    setReqReason("");
    toast({
      title: "Request submitted",
      message: `Ticket created: ${id}. Org admin notified.`,
      kind: "success",
    });
  };

  const revokeSession = (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    toast({ title: "Session revoked", message: `Device session ${id} revoked.`, kind: "success" });
  };

  const revokeAllOther = () => {
    setSessions((prev) => prev.filter((s) => s.current));
    toast({ title: "Sessions revoked", message: "All other sessions revoked.", kind: "success" });
  };

  const endSupport = () => {
    setSupportMode(false);
    setSupportSessionId("");
    toast({ title: "Support session ended", message: "Support mode disabled.", kind: "info" });
  };

  const orgFiltered = useMemo(() => {
    const q = orgSearch.trim().toLowerCase();
    return q ? orgs.filter((o) => o.toLowerCase().includes(q)) : orgs;
  }, [orgSearch, orgs]);

  const riskSignals = useMemo(() => {
    const items = [] as Array<{ label: string; on: boolean; tone: "warn" | "bad" | "neutral" }>;
    items.push({ label: "New device", on: sigNewDevice, tone: "warn" });
    items.push({ label: "New location", on: sigNewGeo, tone: "warn" });
    items.push({ label: "Impossible travel", on: sigImpossibleTravel, tone: "bad" });
    return items;
  }, [sigNewDevice, sigNewGeo, sigImpossibleTravel]);

  const headerBadge = useMemo(() => {
    if (supportMode) return { label: `Support Session: ${supportSessionId}`, tone: "warn" as const };
    return { label: `Risk: ${riskLevel.label} (${riskScore})`, tone: riskLevel.tone };
  }, [supportMode, supportSessionId, riskLevel, riskScore]);

  return (
    <div className="min-h-screen" style={{ background: "radial-gradient(90% 60% at 50% 0%, rgba(3,205,140,0.18), rgba(255,255,255,0))" }}>
      <ToastStack toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((x) => x.id !== id))} />

      {/* Support watermark */}
      {supportMode && watermark ? (
        <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.08]">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "repeating-linear-gradient(-22deg, rgba(2,6,23,1) 0, rgba(2,6,23,1) 1px, transparent 1px, transparent 240px)",
            }}
          />
          <div className="absolute inset-0 grid place-items-center">
            <div className="text-center">
              <div className="text-4xl font-black tracking-tight text-slate-900">
                EVzone Support Session
              </div>
              <div className="mt-2 text-sm font-semibold text-slate-900">
                Audited • No silent actions
              </div>
              <div className="mt-1 text-xs text-slate-700">{supportSessionId}</div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Support banner */}
      {supportMode ? (
        <div className="sticky top-0 z-20 border-b border-amber-200 bg-amber-50">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-3 md:flex-row md:items-center md:justify-between md:px-6">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-amber-800 ring-1 ring-amber-200">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900">Support mode active</div>
                <div className="mt-1 text-xs text-slate-700">
                  Session {supportSessionId}. View-only by default. Any write action requires justification and is audit logged.
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" className="text-xs" onClick={() => setWatermark((v) => !v)}>
                <Fingerprint className="h-4 w-4" /> {watermark ? "Hide" : "Show"} watermark
              </Button>
              <Button variant="danger" className="text-xs" onClick={endSupport}>
                <LogOut className="h-4 w-4" /> End session
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-10 md:px-6">
        {/* Top header */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl text-white" style={{ background: EVZ.green }}>
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900">EVzone CorporatePay</div>
              <div className="mt-1 text-xs text-slate-500">Login and organization selection</div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Pill label={headerBadge.label} tone={headerBadge.tone} />
            <Button variant="outline" onClick={() => setRequestOpen(true)}>
              <Ticket className="h-4 w-4" /> Request access
            </Button>
            <Button variant="outline" onClick={openSupport}>
              <Shield className="h-4 w-4" /> EVzone Support
            </Button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {screen === "login" ? (
            <motion.div key="login" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Left: Security and info */}
                <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_30px_90px_rgba(2,8,23,0.10)]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Session security</div>
                      <div className="mt-1 text-xs text-slate-500">Risk-based step-up prompts, device trust, and audit visibility.</div>
                    </div>
                    <Pill label={`Risk: ${riskLevel.label}`} tone={riskLevel.tone} />
                  </div>

                  <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">Risk signals</div>
                        <div className="mt-1 text-xs text-slate-600">Toggle to preview step-up prompts.</div>
                      </div>
                      <Pill label={`Score ${riskScore}/100`} tone={riskLevel.tone} />
                    </div>
                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <Toggle enabled={sigNewDevice} onChange={setSigNewDevice} label="New device" description="Unseen device" />
                      <Toggle enabled={sigNewGeo} onChange={setSigNewGeo} label="New geo" description="New region" />
                      <Toggle enabled={sigImpossibleTravel} onChange={setSigImpossibleTravel} label="Impossible travel" description="Too fast" />
                    </div>
                    <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                      <MiniKpi icon={<MapPin className="h-4 w-4" />} label="Current location" value={locationSim} />
                      <MiniKpi icon={<Globe className="h-4 w-4" />} label="IP" value={ipSim} />
                      <MiniKpi icon={<Laptop className="h-4 w-4" />} label="Device" value={deviceSim} />
                    </div>
                    <div className="mt-3 rounded-2xl bg-white p-3 text-xs text-slate-600">
                      Last sign-in: <span className="font-semibold text-slate-900">{lastLoginSim.location}</span> • {timeAgo(lastLoginSim.ts)}
                    </div>
                  </div>

                  <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4">
                    <div className="text-sm font-semibold text-slate-900">What happens when risk is high</div>
                    <ul className="mt-3 space-y-2 text-sm text-slate-700">
                      <li className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full" style={{ background: EVZ.green }} />
                        Step-up prompt (MFA code)
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full" style={{ background: EVZ.orange }} />
                        Support sessions require justification and show a watermark
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full" style={{ background: EVZ.green }} />
                        Active sessions can be revoked instantly
                      </li>
                    </ul>
                    <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                      Policy default: Finance and Approver roles require MFA.
                    </div>
                  </div>

                  {tickets.length ? (
                    <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">Recent access requests</div>
                          <div className="mt-1 text-xs text-slate-500">Tickets created from this login page.</div>
                        </div>
                        <Pill label={`${tickets.length}`} tone="neutral" />
                      </div>
                      <div className="mt-3 space-y-2">
                        {tickets.slice(0, 2).map((t) => (
                          <div key={t.id} className="rounded-2xl border border-slate-200 bg-white p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="text-sm font-semibold text-slate-900">{t.id}</div>
                                <div className="mt-1 text-xs text-slate-500">{t.org} • Role: {t.roleNeeded}</div>
                              </div>
                              <Pill label={t.status} tone={t.status === "Submitted" ? "info" : "neutral"} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* Right: Login */}
                <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_30px_90px_rgba(2,8,23,0.10)]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Sign in</div>
                      <div className="mt-1 text-xs text-slate-500">Email and password. SSO is Phase 2.</div>
                    </div>
                    <Pill label={`Role detected: ${inferredRole}`} tone="info" />
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-4">
                    <Field icon={<Mail className="h-4 w-4" />} label="Email" required value={email} onChange={setEmail} placeholder="you@company.com" />
                    <Field icon={<Lock className="h-4 w-4" />} label="Password" required value={password} onChange={setPassword} type="password" placeholder="••••••••" />

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
                        Remember me
                      </label>
                      <button
                        className="text-sm font-semibold text-emerald-700 hover:underline"
                        onClick={() => toast({ title: "Reset password", message: "Password reset flow opened (demo).", kind: "info" })}
                        type="button"
                      >
                        Forgot password?
                      </button>
                    </div>

                    <Button variant="primary" className="w-full" onClick={startLogin}>
                      <KeyRound className="h-4 w-4" /> Sign in
                    </Button>

                    <div className="relative py-2">
                      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
                      <div className="relative flex justify-center"><span className="bg-white px-3 text-xs font-semibold text-slate-500">OR</span></div>
                    </div>

                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <Button variant="outline" disabled title="Phase 2">
                        <span className="grid h-6 w-6 place-items-center rounded-xl bg-slate-100 text-slate-700">G</span>
                        Continue with Google
                      </Button>
                      <Button variant="outline" disabled title="Phase 2">
                        <span className="grid h-6 w-6 place-items-center rounded-xl bg-slate-100 text-slate-700">M</span>
                        Continue with Microsoft
                      </Button>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">EVzone Support entry</div>
                          <div className="mt-1 text-xs text-slate-600">Role-gated sign-in with watermark and audited session.</div>
                        </div>
                        <Pill label="Support" tone="warn" />
                      </div>
                      <Button variant="outline" className="mt-3 w-full" onClick={openSupport}>
                        <Shield className="h-4 w-4" /> Sign in as EVzone Support
                      </Button>
                      <div className="mt-2 text-xs text-slate-600">Support mode actions are never silent and always logged.</div>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white p-4">
                      <div className="text-sm font-semibold text-slate-900">Need access?</div>
                      <div className="mt-1 text-xs text-slate-500">Create a request ticket for your organization admin.</div>
                      <Button variant="accent" className="mt-3 w-full" onClick={() => setRequestOpen(true)}>
                        <Ticket className="h-4 w-4" /> Request access
                      </Button>
                    </div>

                    <div className="text-xs text-slate-500">If your account belongs to multiple organizations, you will pick one after sign-in.</div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : null}

          {screen === "org" ? (
            <motion.div key="org" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
              <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_30px_90px_rgba(2,8,23,0.10)]">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Select organization</div>
                    <div className="mt-1 text-xs text-slate-500">Your account belongs to multiple organizations. Choose one to continue.</div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill label={`Signed in as ${supportMode ? "EVzone Support" : inferredRole}`} tone={supportMode ? "warn" : "info"} />
                    <Button variant="outline" onClick={() => { setScreen("login"); toast({ title: "Signed out", message: "Returned to login.", kind: "info" }); }}>
                      <LogOut className="h-4 w-4" /> Sign out
                    </Button>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-sm font-semibold text-slate-900">Search org</div>
                    <div className="mt-3 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm focus-within:ring-4 focus-within:ring-emerald-100">
                      <Search className="h-4 w-4 text-slate-500" />
                      <input
                        value={orgSearch}
                        onChange={(e) => setOrgSearch(e.target.value)}
                        placeholder="Type to filter..."
                        className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
                      />
                    </div>
                    <div className="mt-3 text-xs text-slate-600">Support sessions display a banner and watermark after you enter the org.</div>
                  </div>

                  <div className="lg:col-span-2">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {orgFiltered.map((o) => (
                        <button
                          key={o}
                          type="button"
                          onClick={() => setSelectedOrg(o)}
                          className={cn(
                            "rounded-3xl border p-4 text-left transition",
                            selectedOrg === o ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white hover:bg-slate-50"
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <div className={cn("grid h-11 w-11 place-items-center rounded-2xl", selectedOrg === o ? "bg-white text-emerald-700 ring-1 ring-emerald-200" : "bg-slate-100 text-slate-700")}
                              >
                                <Building2 className="h-5 w-5" />
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-slate-900">{o}</div>
                                <div className="mt-1 text-xs text-slate-500">Admin Console access</div>
                              </div>
                            </div>
                            {selectedOrg === o ? <BadgeCheck className="h-5 w-5 text-emerald-700" /> : <ChevronRight className="h-5 w-5 text-slate-400" />}
                          </div>
                        </button>
                      ))}
                    </div>

                    <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                      <Button variant="outline" onClick={() => setScreen("login")}>
                        Back
                      </Button>
                      <Button variant="primary" onClick={selectOrgAndContinue}>
                        <Building2 className="h-4 w-4" /> Continue
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : null}

          {screen === "ready" ? (
            <motion.div key="ready" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
              <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_30px_90px_rgba(2,8,23,0.10)]">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Welcome</div>
                    <div className="mt-1 text-xs text-slate-500">Organization: {selectedOrg}</div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Pill label={supportMode ? "EVzone Support" : inferredRole} tone={supportMode ? "warn" : "info"} />
                      <Pill label={`Email: ${supportMode ? supportEmail : email}`} tone="neutral" />
                      <Pill label={`Risk: ${riskLevel.label}`} tone={riskLevel.tone} />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" onClick={revokeAllOther}>
                      <LogOut className="h-4 w-4" /> Revoke other sessions
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => {
                        toast({ title: "Continue", message: "Routing to Corporate Dashboard...", kind: "success" });
                        navigate("/console/dashboard");
                      }}
                    >
                      <ChevronRight className="h-4 w-4" /> Continue to dashboard
                    </Button>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
                  <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">Session badge</div>
                        <div className="mt-1 text-xs text-slate-500">Visibility and audit watermark for support sessions</div>
                      </div>
                      <Pill label={supportMode ? "Support" : "Standard"} tone={supportMode ? "warn" : "good"} />
                    </div>
                    <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700">
                      {supportMode ? (
                        <>
                          Support session <span className="font-semibold">{supportSessionId}</span> is visible to organization admins. No silent actions.
                        </>
                      ) : (
                        <>Standard admin session. Security events are still logged.</>
                      )}
                    </div>
                    <Toggle
                      enabled={supportMode ? watermark : false}
                      onChange={(v) => setWatermark(v)}
                      label="Audit watermark"
                      description="Shown when support mode is active"
                    />
                  </div>

                  <div className="lg:col-span-2 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">Active sessions</div>
                        <div className="mt-1 text-xs text-slate-500">Revoke devices and manage trust settings.</div>
                      </div>
                      <Pill label={`${sessions.length}`} tone="neutral" />
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
                                <div className="flex flex-wrap items-center gap-2">
                                  <Button
                                    variant="outline"
                                    className="px-3 py-2 text-xs"
                                    onClick={() => {
                                      if (!s.current) {
                                        setSessions((prev) => prev.map((x) => (x.id === s.id ? { ...x, trusted: !x.trusted } : x)));
                                        toast({ title: "Updated", message: "Device trust updated.", kind: "success" });
                                      } else {
                                        setSessions((prev) => prev.map((x) => (x.id === s.id ? { ...x, trusted: !x.trusted } : x)));
                                        toast({ title: "Updated", message: "Current device trust updated.", kind: "success" });
                                      }
                                    }}
                                  >
                                    <Fingerprint className="h-4 w-4" /> {s.trusted ? "Untrust" : "Trust"}
                                  </Button>
                                  {!s.current ? (
                                    <Button
                                      variant="danger"
                                      className="px-3 py-2 text-xs"
                                      onClick={() => revokeSession(s.id)}
                                    >
                                      <LogOut className="h-4 w-4" /> Revoke
                                    </Button>
                                  ) : (
                                    <Pill label="Current" tone="info" />
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="border-t border-slate-200 px-4 py-3 text-xs text-slate-500">
                      In production, session actions require audit logging and may require step-up authentication.
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-2 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-sm font-semibold text-slate-900">Sign out</div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setScreen("login");
                      toast({ title: "Signed out", message: "Returned to login.", kind: "info" });
                    }}
                  >
                    <LogOut className="h-4 w-4" /> Sign out
                  </Button>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Step-up modal */}
      <Modal
        open={stepUpOpen}
        title="Step-up authentication"
        subtitle="Risk-based prompt. Complete MFA to continue."
        onClose={() => {
          setStepUpOpen(false);
          setPendingAuth(null);
        }}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setStepUpOpen(false);
                setPendingAuth(null);
                toast({ title: "Cancelled", message: "Step-up cancelled.", kind: "info" });
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={completeStepUp}>
              <Check className="h-4 w-4" /> Verify
            </Button>
          </div>
        }
        maxW="820px"
      >
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-900">Risk summary</div>
              <div className="mt-1 text-xs text-slate-600">Signals that triggered this prompt.</div>
            </div>
            <Pill label={`Risk ${riskScore}/100`} tone={riskLevel.tone} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {riskSignals.map((s) => (
              <Pill
                key={s.label}
                label={`${s.label}: ${s.on ? "Yes" : "No"}`}
                tone={s.on ? s.tone : "neutral"}
              />
            ))}
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <MiniKpi icon={<MapPin className="h-4 w-4" />} label="Location" value={locationSim} />
            <MiniKpi icon={<Globe className="h-4 w-4" />} label="IP" value={ipSim} />
            <MiniKpi icon={<Laptop className="h-4 w-4" />} label="Device" value={deviceSim} />
          </div>
        </div>

        {pendingAuth?.isSupport ? (
          <div className="mt-4 rounded-3xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-amber-800 ring-1 ring-amber-200">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900">Support session rules</div>
                <div className="mt-1 text-sm text-slate-700">No silent actions. Any write action requires justification.</div>
                <div className="mt-3 text-xs text-slate-600">Session ID: {supportSessionId}</div>
              </div>
            </div>
            <div className="mt-3">
              <div className="text-xs font-semibold text-slate-700">Justification (required)</div>
              <textarea
                value={stepUpReason}
                onChange={(e) => setStepUpReason(e.target.value)}
                placeholder="Example: troubleshooting an invoice delivery failure"
                className="mt-2 w-full rounded-2xl border border-amber-200 bg-white p-3 text-sm font-semibold text-slate-900 shadow-sm outline-none focus:ring-4 focus:ring-amber-100"
                rows={3}
              />
            </div>
          </div>
        ) : null}

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="text-sm font-semibold text-slate-900">Authenticator code</div>
            <div className="mt-1 text-xs text-slate-500">Enter a 6-digit code from your authenticator app.</div>
            <input
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="123456"
              className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 shadow-sm outline-none focus:ring-4 focus:ring-emerald-100"
            />
            <div className="mt-2 text-xs text-slate-500">Demo: any 6 digits are accepted.</div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="text-sm font-semibold text-slate-900">Help</div>
            <div className="mt-1 text-xs text-slate-500">If you cannot access your authenticator, use backup codes (X2 page).</div>
            <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700">
              Finance and Approver roles require MFA.
            </div>
            <Button
              variant="outline"
              className="mt-3 w-full"
              onClick={() => toast({ title: "Help", message: "Open MFA help article (demo).", kind: "info" })}
            >
              <HelpCircle className="h-4 w-4" /> MFA help
            </Button>
          </div>
        </div>
      </Modal>

      {/* Support sign-in modal */}
      <Modal
        open={supportOpen}
        title="EVzone Support sign-in"
        subtitle="Role-gated entry. Support sessions are visible and audited."
        onClose={() => setSupportOpen(false)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setSupportOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" disabled={!canUseSupportEntry} onClick={startSupportSession}>
              <Shield className="h-4 w-4" /> Continue
            </Button>
          </div>
        }
        maxW="820px"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field
            icon={<Mail className="h-4 w-4" />}
            label="EVzone email"
            value={supportEmail}
            onChange={setSupportEmail}
            placeholder="support@evzone.com"
            required
          />
          <Field
            icon={<KeyRound className="h-4 w-4" />}
            label="Support key"
            value={supportKey}
            onChange={setSupportKey}
            placeholder="Enter key"
            type="password"
            required
            hint="Demo: 6+ chars"
          />
        </div>

        <div className="mt-4 rounded-3xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-amber-800 ring-1 ring-amber-200">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900">Support safety</div>
              <ul className="mt-2 space-y-1 text-xs text-slate-700">
                <li>1) View-only by default</li>
                <li>2) Step-up authentication required</li>
                <li>3) Justification required for write actions</li>
                <li>4) Visible banner and watermark</li>
              </ul>
            </div>
          </div>
        </div>
      </Modal>

      {/* Request access modal */}
      <Modal
        open={requestOpen}
        title="Request access"
        subtitle="Creates a ticket for the organization admin and logs the request."
        onClose={() => setRequestOpen(false)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setRequestOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={createTicket}>
              <Ticket className="h-4 w-4" /> Submit
            </Button>
          </div>
        }
        maxW="820px"
      >
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <span className="font-semibold">Email used</span>: {email || "(enter email on login page)"}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field icon={<Building2 className="h-4 w-4" />} label="Organization" required value={reqOrg} onChange={setReqOrg} placeholder="Example: Acme Group Ltd" />
          <Field icon={<User className="h-4 w-4" />} label="Your name" required value={reqName} onChange={setReqName} placeholder="Full name" />
          <div>
            <div className="text-xs font-semibold text-slate-600">Role needed</div>
            <select
              value={reqRole}
              onChange={(e) => setReqRole(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-emerald-100"
            >
              {roles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <div className="mt-1 text-xs text-slate-500">The org admin will approve this request.</div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="text-xs font-semibold text-slate-600">Delivery</div>
            <div className="mt-2 flex flex-wrap gap-2">
              <Pill label="Email" tone="neutral" />
              <Pill label="WhatsApp" tone="good" />
              <Pill label="SMS" tone="info" />
            </div>
            <div className="mt-2 text-xs text-slate-500">In production, delivery logs appear in Notifications Center.</div>
          </div>
          <div className="md:col-span-2">
            <div className="text-xs font-semibold text-slate-600">Reason</div>
            <textarea
              value={reqReason}
              onChange={(e) => setReqReason(e.target.value)}
              placeholder="Explain why you need access"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-900 shadow-sm outline-none focus:ring-4 focus:ring-emerald-100"
              rows={4}
            />
            <div className="mt-2 text-xs text-slate-500">Tip: include urgency and your responsibilities.</div>
          </div>
        </div>
      </Modal>

      <footer className="border-t border-slate-200 bg-white/60 py-6">
        <div className="mx-auto max-w-7xl px-4 text-xs text-slate-500 md:px-6">
          X1 Login: email/password, org selector, EVzone support entry, risk-based step-up prompts, session management, and support-mode banner + watermark.
        </div>
      </footer>
    </div>
  );
}

function MiniKpi({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-slate-600">{icon}</span>
          <span className="text-xs font-semibold text-slate-600">{label}</span>
        </div>
        <span className="text-xs font-semibold text-slate-900">{value}</span>
      </div>
    </div>
  );
}
