import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BadgeCheck,
  Check,
  ChevronRight,
  Copy,
  FileCheck,
  Globe,
  HelpCircle,
  KeyRound,
  Link2,
  Lock,
  Mail,
  Phone,
  Shield,
  Sparkles,
  Ticket,
  User,
  Users,
  Wallet,
  X,
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

function formatDateTime(ts: number) {
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

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
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
      {bad ? <div className="mt-1 text-xs text-rose-600">Required</div> : null}
    </div>
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

function StepPill({
  idx,
  active,
  done,
  label,
}: {
  idx: number;
  active: boolean;
  done: boolean;
  label: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold ring-1",
        active
          ? "bg-emerald-600 text-white ring-emerald-600"
          : done
          ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
          : "bg-white text-slate-700 ring-slate-200"
      )}
      style={active ? { background: EVZ.green } : undefined}
    >
      <span
        className={cn(
          "grid h-6 w-6 place-items-center rounded-full",
          active ? "bg-white/20" : done ? "bg-emerald-100" : "bg-slate-100"
        )}
      >
        {done ? <Check className="h-4 w-4" /> : <span>{idx}</span>}
      </span>
      {label}
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
          {subtitle ? <div className="mt-1 text-sm text-slate-600">{subtitle}</div> : null}
        </div>
        {right}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

type Defaults = {
  organization: string;
  group: string;
  role: string;
  spendLimits: {
    daily: string;
    weekly: string;
    monthly: string;
  };
  autoApproval: {
    eligible: boolean;
    under: string;
  };
  defaultCostCenter: string;
  defaultProjectTag: string;
  enforcedModules: string[];
  enforcedMarketplaces: string[];
};

function normalizeDomain(email: string) {
  const parts = email.trim().toLowerCase().split("@");
  return parts.length === 2 ? parts[1] : "";
}

function inferProvisioning(email: string, hrisEnabled: boolean, hrisDepartment: string) {
  // Domain rules (simple + explainable)
  const domain = normalizeDomain(email);
  const local = email.split("@")[0]?.toLowerCase() || "";

  if (hrisEnabled) {
    // HRIS wins if available
    if (hrisDepartment === "Finance") return { group: "Finance", role: "Accountant", reason: "HRIS department = Finance" };
    if (hrisDepartment === "Procurement") return { group: "Procurement", role: "Approver", reason: "HRIS department = Procurement" };
    if (hrisDepartment === "Sales") return { group: "Sales", role: "User", reason: "HRIS department = Sales" };
    if (hrisDepartment === "Operations") return { group: "Operations", role: "Manager", reason: "HRIS department = Operations" };
    return { group: "Admin", role: "User", reason: "HRIS department default" };
  }

  // Domain-based
  if (domain.endsWith("acme.com")) {
    if (local.includes("finance") || local.includes("account")) return { group: "Finance", role: "Accountant", reason: "Matched email local-part pattern" };
    if (local.includes("proc")) return { group: "Procurement", role: "Approver", reason: "Matched email local-part pattern" };
    if (local.includes("admin")) return { group: "Admin", role: "Org Admin", reason: "Admin naming convention" };
    return { group: "Operations", role: "User", reason: "Corporate domain default" };
  }

  return { group: "Operations", role: "User", reason: "Fallback rule" };
}

export default function CorporatePayInviteAcceptanceV2() {
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

  // Steps
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Invite payload (demo)
  const [inviteToken, setInviteToken] = useState("INV-CPAY-8F2K-UG");
  const [inviteEmail, setInviteEmail] = useState("finance@acme.com");
  const [invitePhone, setInvitePhone] = useState("+256 700 000 000");
  const [expiresAt] = useState(Date.now() + 2 * 24 * 60 * 60 * 1000);
  const [expiredSim, setExpiredSim] = useState(false);
  const [emailMatch, setEmailMatch] = useState("finance@acme.com");
  const [phoneMatch, setPhoneMatch] = useState("+256 700 000 000");

  // Link existing vs create
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [lookup, setLookup] = useState("finance@acme.com");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");

  const [fullName, setFullName] = useState("");
  const [newEmail, setNewEmail] = useState("finance@acme.com");
  const [newPhone, setNewPhone] = useState("+256 700 000 000");
  const [newPassword, setNewPassword] = useState("");

  const [linked, setLinked] = useState(false);
  const [accountId, setAccountId] = useState<string>("");

  // Defaults from admin (demo)
  const baseDefaults: Defaults = useMemo(
    () => ({
      organization: "Acme Group Ltd",
      group: "Finance",
      role: "Accountant",
      spendLimits: {
        daily: "UGX 3,000,000",
        weekly: "UGX 12,000,000",
        monthly: "UGX 30,000,000",
      },
      autoApproval: { eligible: false, under: "UGX 0" },
      defaultCostCenter: "FIN-OPS",
      defaultProjectTag: "Audit-2026",
      enforcedModules: ["Rides & Logistics", "E-Commerce", "EVs & Charging", "Finance & Payments", "Other Service Module"],
      enforcedMarketplaces: [
        "MyLiveDealz",
        "EVmart",
        "ServiceMart",
        "GadgetMart",
        "Other Marketplace",
      ],
    }),
    []
  );

  // Premium: JIT provisioning
  const [jitEnabled, setJitEnabled] = useState(true);
  const [hrisEnabled, setHrisEnabled] = useState(false);
  const [hrisDept, setHrisDept] = useState("Finance");

  const provisioning = useMemo(() => {
    const email = mode === "existing" ? lookup : newEmail;
    return inferProvisioning(email, hrisEnabled, hrisDept);
  }, [mode, lookup, newEmail, hrisEnabled, hrisDept]);

  const effectiveDefaults = useMemo(() => {
    if (!jitEnabled) return baseDefaults;
    // Apply JIT group/role only, keep admin spend defaults (you can extend later)
    return {
      ...baseDefaults,
      group: provisioning.group,
      role: provisioning.role,
    };
  }, [baseDefaults, jitEnabled, provisioning]);

  // Premium: Acceptance checklist + attestations
  const [requireAttestations, setRequireAttestations] = useState(true);
  const [attest, setAttest] = useState({
    businessOnly: false,
    noPersonalUse: false,
    complyPolicy: false,
    dataPrivacy: false,
    antiBribery: false,
  });

  const attestationOk = useMemo(() => {
    if (!requireAttestations) return true;
    return Object.values(attest).every(Boolean);
  }, [requireAttestations, attest]);

  // Premium: Welcome wizard highlights
  const [ackPolicy, setAckPolicy] = useState(false);
  const [ackApprovals, setAckApprovals] = useState(false);
  const [ackCheckout, setAckCheckout] = useState(false);

  const welcomeOk = useMemo(() => {
    return ackPolicy && ackApprovals && ackCheckout;
  }, [ackPolicy, ackApprovals, ackCheckout]);

  const expiresLabel = useMemo(() => formatDateTime(expiresAt), [expiresAt]);

  const inviteValid = useMemo(() => {
    if (!inviteToken.trim()) return { ok: false, reason: "Missing token" };
    if (!inviteEmail.trim() || !invitePhone.trim()) return { ok: false, reason: "Missing invite email/phone" };
    if (expiredSim || Date.now() > expiresAt) return { ok: false, reason: "Invite expired" };
    if (emailMatch.trim().toLowerCase() !== inviteEmail.trim().toLowerCase()) return { ok: false, reason: "Email does not match invite" };
    if (phoneMatch.trim() !== invitePhone.trim()) return { ok: false, reason: "Phone does not match invite" };
    return { ok: true, reason: "Valid" };
  }, [inviteToken, inviteEmail, invitePhone, expiredSim, expiresAt, emailMatch, phoneMatch]);

  const validateInvite = () => {
    if (!inviteValid.ok) {
      toast({ title: "Invite invalid", message: inviteValid.reason, kind: "warn" });
      return;
    }
    toast({ title: "Invite validated", message: "Proceed to link your EVzone account.", kind: "success" });
    setStep(2);
  };

  const sendOtp = () => {
    if (!lookup.trim()) {
      toast({ title: "Missing identifier", message: "Enter email or phone.", kind: "warn" });
      return;
    }
    setOtpSent(true);
    toast({ title: "OTP sent", message: "Verification code sent (demo).", kind: "success" });
  };

  const verifyExisting = () => {
    if (!otpSent) {
      toast({ title: "Send OTP first", message: "Click Send OTP.", kind: "warn" });
      return;
    }
    if (otp.trim().length < 4) {
      toast({ title: "Invalid OTP", message: "Enter the code you received.", kind: "warn" });
      return;
    }
    const id = `EVZ-${Math.floor(100000 + Math.random() * 900000)}`;
    setAccountId(id);
    setLinked(true);
    toast({ title: "Account linked", message: `Linked to EVzone ID ${id}.`, kind: "success" });
    setStep(3);
  };

  const createAccount = () => {
    if (!fullName.trim() || !newEmail.trim() || !newPhone.trim() || !newPassword.trim()) {
      toast({ title: "Missing fields", message: "Name, email, phone and password are required.", kind: "warn" });
      return;
    }
    const id = `EVZ-${Math.floor(100000 + Math.random() * 900000)}`;
    setAccountId(id);
    setLinked(true);
    toast({ title: "Account created", message: `EVzone account created: ${id}.`, kind: "success" });
    setStep(3);
  };

  const acceptInvite = () => {
    if (!linked) {
      toast({ title: "Not linked", message: "Link or create your EVzone account first.", kind: "warn" });
      return;
    }
    if (!attestationOk) {
      toast({ title: "Checklist incomplete", message: "Complete required attestations to continue.", kind: "warn" });
      return;
    }
    toast({ title: "Defaults applied", message: "Group, role, limits and tags have been applied.", kind: "success" });
    setStep(4);
  };

  const finish = () => {
    if (!welcomeOk) {
      toast({ title: "Complete welcome", message: "Confirm the policy highlights first.", kind: "warn" });
      return;
    }
    toast({ title: "Welcome", message: "CorporatePay is active for your EVzone account.", kind: "success" });
    setStep(5);
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied", message: text, kind: "success" });
    } catch {
      toast({ title: "Copy failed", message: "Copy manually.", kind: "warn" });
    }
  };

  const completionPct = useMemo(() => {
    const base = (step - 1) / 4;
    return Math.round(clamp(base * 100, 0, 100));
  }, [step]);

  return (
    <div className="min-h-screen" style={{ background: "radial-gradient(90% 60% at 50% 0%, rgba(3,205,140,0.18), rgba(255,255,255,0))" }}>
      <ToastStack toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((x) => x.id !== id))} />

      <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_30px_90px_rgba(2,8,23,0.10)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl text-white" style={{ background: EVZ.green }}>
                <Link2 className="h-6 w-6" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900">Invite acceptance and EVzone account linking</div>
                <div className="mt-1 text-xs text-slate-500">Validate invite, link/create EVzone account, apply defaults, then complete welcome wizard.</div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Pill label={`Completion: ${completionPct}%`} tone={completionPct >= 75 ? "good" : completionPct >= 40 ? "warn" : "neutral"} />
                  <Pill label={`Expires: ${expiresLabel}`} tone={expiredSim ? "bad" : "warn"} />
                  <Button variant="outline" className="text-xs" onClick={() => setExpiredSim((v) => !v)}>
                    <AlertTriangle className="h-4 w-4" /> Simulate expired
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Pill label={`Org: ${effectiveDefaults.organization}`} tone="neutral" />
              <Pill label={`Role: ${effectiveDefaults.role}`} tone="info" />
              <Pill label={`Group: ${effectiveDefaults.group}`} tone="neutral" />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <StepPill idx={1} active={step === 1} done={step > 1} label="Validate invite" />
            <StepPill idx={2} active={step === 2} done={step > 2} label="Link account" />
            <StepPill idx={3} active={step === 3} done={step > 3} label="Defaults and checklist" />
            <StepPill idx={4} active={step === 4} done={step > 4} label="Welcome" />
            <StepPill idx={5} active={step === 5} done={false} label="Done" />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left rail */}
            <div className="space-y-4">
              <Card
                title="Invite summary"
                subtitle="The invite must match your email and phone"
                right={<Pill label={inviteValid.ok ? "Valid" : "Check"} tone={inviteValid.ok ? "good" : "warn"} />}
              >
                <div className="space-y-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <div className="text-xs font-semibold text-slate-600">Token</div>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <span className="font-mono text-sm font-semibold text-slate-900">{inviteToken}</span>
                      <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => copy(inviteToken)}>
                        <Copy className="h-4 w-4" /> Copy
                      </Button>
                    </div>
                  </div>

                  <MiniRow icon={<Mail className="h-4 w-4" />} label="Invite email" value={inviteEmail} />
                  <MiniRow icon={<Phone className="h-4 w-4" />} label="Invite phone" value={invitePhone} />
                  <MiniRow icon={<BadgeCheck className="h-4 w-4" />} label="Expires" value={expiresLabel} />
                </div>

                <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700">
                  If your invite expires, request a new invite from your organization admin.
                </div>
              </Card>

              <Card title="Just-in-time provisioning" subtitle="Premium: auto role assignment based on domain/HRIS rules" right={<Pill label={jitEnabled ? "On" : "Off"} tone={jitEnabled ? "info" : "neutral"} />}>
                <Toggle
                  enabled={jitEnabled}
                  onChange={setJitEnabled}
                  label="Enable JIT provisioning"
                  description="Applies group and role from rules on acceptance."
                />
                <Toggle
                  enabled={hrisEnabled}
                  onChange={setHrisEnabled}
                  label="HRIS rule (Phase 2)"
                  description="When enabled, HR department drives role assignment."
                />
                <div className={cn("mt-3", !hrisEnabled && "opacity-60")}>
                  <div className="text-xs font-semibold text-slate-600">HR department</div>
                  <select
                    value={hrisDept}
                    onChange={(e) => setHrisDept(e.target.value)}
                    disabled={!hrisEnabled}
                    className={cn(
                      "mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-emerald-100",
                      !hrisEnabled && "bg-slate-50 text-slate-500"
                    )}
                  >
                    {[
                      "Finance",
                      "Procurement",
                      "Sales",
                      "Operations",
                      "Admin",
                    ].map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3">
                  <div className="text-xs font-semibold text-slate-600">Matched rule</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">{provisioning.group} • {provisioning.role}</div>
                  <div className="mt-1 text-xs text-slate-500">{provisioning.reason}</div>
                </div>

                <div className="mt-3 text-xs text-slate-500">
                  JIT provisioning modifies group and role only. Spend limits remain admin-defined.
                </div>
              </Card>
            </div>

            {/* Main panel */}
            <div className="lg:col-span-2">
              <AnimatePresence mode="wait">
                {step === 1 ? (
                  <motion.div key="s1" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }} className="space-y-4">
                    <Card title="Validate invite" subtitle="Token, email, and phone must match the invitation" right={<Pill label={inviteValid.ok ? "Ready" : "Needs match"} tone={inviteValid.ok ? "good" : "warn"} />}>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <Field icon={<Link2 className="h-4 w-4" />} label="Invite token" value={inviteToken} onChange={setInviteToken} placeholder="INV-..." required />
                        <Field icon={<Mail className="h-4 w-4" />} label="Invite email" value={inviteEmail} onChange={setInviteEmail} placeholder="you@company.com" required />
                        <Field icon={<Phone className="h-4 w-4" />} label="Invite phone" value={invitePhone} onChange={setInvitePhone} placeholder="+256 ..." required />
                        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                          <div className="text-xs font-semibold text-slate-600">Expiry</div>
                          <div className="mt-2 text-sm font-semibold text-slate-900">{expiresLabel}</div>
                          <div className="mt-1 text-xs text-slate-600">Invite links expire for security.</div>
                        </div>
                      </div>

                      <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4">
                        <div className="text-sm font-semibold text-slate-900">Match details</div>
                        <div className="mt-1 text-xs text-slate-500">To simulate verification, enter the same email and phone as the invite.</div>
                        <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
                          <Field icon={<Mail className="h-4 w-4" />} label="Your email" value={emailMatch} onChange={setEmailMatch} placeholder="finance@acme.com" required />
                          <Field icon={<Phone className="h-4 w-4" />} label="Your phone" value={phoneMatch} onChange={setPhoneMatch} placeholder="+256 700..." required />
                        </div>
                        <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                          Status: <span className="font-semibold text-slate-900">{inviteValid.ok ? "Valid" : inviteValid.reason}</span>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                        <Button variant="outline" onClick={() => toast({ title: "Resend invite", message: "Admin resend flow opened (demo).", kind: "info" })}>
                          <Ticket className="h-4 w-4" /> Request resend
                        </Button>
                        <Button variant="primary" onClick={validateInvite}>
                          <BadgeCheck className="h-4 w-4" /> Validate
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                ) : null}

                {step === 2 ? (
                  <motion.div key="s2" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }} className="space-y-4">
                    <Card title="Link your EVzone account" subtitle="Connect to an existing account or create a new one" right={<Pill label={linked ? "Linked" : "Not linked"} tone={linked ? "good" : "warn"} />}>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <SelectCard
                          title="Link existing"
                          desc="Use OTP to verify ownership of your EVzone account."
                          active={mode === "existing"}
                          onClick={() => setMode("existing")}
                          icon={<Link2 className="h-4 w-4" />}
                        />
                        <SelectCard
                          title="Create new"
                          desc="Create an EVzone account and link it to this organization."
                          active={mode === "new"}
                          onClick={() => setMode("new")}
                          icon={<User className="h-4 w-4" />}
                        />
                      </div>

                      {mode === "existing" ? (
                        <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-slate-900">Verify existing account</div>
                              <div className="mt-1 text-xs text-slate-500">Enter email/phone and receive an OTP.</div>
                            </div>
                            {linked ? <Pill label={`Linked: ${accountId}`} tone="good" /> : <Pill label="OTP required" tone="warn" />}
                          </div>

                          <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
                            <Field icon={<Mail className="h-4 w-4" />} label="Email or phone" value={lookup} onChange={setLookup} placeholder="you@company.com or +256..." required />
                            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                              <div className="text-xs font-semibold text-slate-600">OTP</div>
                              <div className="mt-2 flex items-center gap-2">
                                <input
                                  value={otp}
                                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                  placeholder="123456"
                                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-emerald-100"
                                />
                                <Button variant="outline" className="px-3 py-2 text-xs" onClick={sendOtp}>
                                  <KeyRound className="h-4 w-4" /> Send
                                </Button>
                              </div>
                              <div className="mt-2 text-xs text-slate-500">Demo: any 4+ digits verify.</div>
                            </div>
                          </div>

                          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                            <Button variant="outline" onClick={() => setStep(1)}>
                              Back
                            </Button>
                            <Button variant="primary" onClick={verifyExisting}>
                              <BadgeCheck className="h-4 w-4" /> Verify and link
                            </Button>
                          </div>
                        </div>
                      ) : null}

                      {mode === "new" ? (
                        <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-slate-900">Create new EVzone account</div>
                              <div className="mt-1 text-xs text-slate-500">Account will be linked to the organization on acceptance.</div>
                            </div>
                            <Pill label="New" tone="info" />
                          </div>

                          <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
                            <Field icon={<User className="h-4 w-4" />} label="Full name" value={fullName} onChange={setFullName} placeholder="Your name" required />
                            <Field icon={<Mail className="h-4 w-4" />} label="Email" value={newEmail} onChange={setNewEmail} placeholder="you@company.com" required />
                            <Field icon={<Phone className="h-4 w-4" />} label="Phone" value={newPhone} onChange={setNewPhone} placeholder="+256..." required />
                            <Field icon={<Lock className="h-4 w-4" />} label="Password" value={newPassword} onChange={setNewPassword} type="password" placeholder="••••••••" required />
                          </div>

                          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                            <Button variant="outline" onClick={() => setStep(1)}>
                              Back
                            </Button>
                            <Button variant="primary" onClick={createAccount}>
                              <User className="h-4 w-4" /> Create and link
                            </Button>
                          </div>
                        </div>
                      ) : null}

                      <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700">
                        After linking, the system applies admin defaults (group, role, limits, tags) to your CorporatePay profile.
                      </div>
                    </Card>
                  </motion.div>
                ) : null}

                {step === 3 ? (
                  <motion.div key="s3" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }} className="space-y-4">
                    <Card title="Review defaults and accept" subtitle="Admin-defined defaults applied on acceptance" right={<Pill label="Ready" tone={linked ? "good" : "warn"} />}>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <DefaultCard icon={<Users className="h-4 w-4" />} label="Group" value={effectiveDefaults.group} />
                        <DefaultCard icon={<Shield className="h-4 w-4" />} label="Role" value={effectiveDefaults.role} />
                        <DefaultCard icon={<Wallet className="h-4 w-4" />} label="Spend limits" value={`${effectiveDefaults.spendLimits.daily} daily • ${effectiveDefaults.spendLimits.monthly} monthly`} />
                        <DefaultCard icon={<BadgeCheck className="h-4 w-4" />} label="Auto-approval" value={effectiveDefaults.autoApproval.eligible ? `Eligible under ${effectiveDefaults.autoApproval.under}` : "Not eligible"} />
                        <DefaultCard icon={<Sparkles className="h-4 w-4" />} label="Default cost center" value={effectiveDefaults.defaultCostCenter} />
                        <DefaultCard icon={<Sparkles className="h-4 w-4" />} label="Default project tag" value={effectiveDefaults.defaultProjectTag} />
                      </div>

                      <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4">
                        <div className="text-sm font-semibold text-slate-900">Enabled modules and marketplaces</div>
                        <div className="mt-1 text-xs text-slate-500">These are the default CorporatePay-enabled areas for your organization.</div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {effectiveDefaults.enforcedModules.map((m) => (
                            <Pill key={m} label={m} tone="neutral" />
                          ))}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {effectiveDefaults.enforcedMarketplaces.map((m) => (
                            <Pill key={m} label={m} tone={m === "MyLiveDealz" ? "info" : "neutral"} />
                          ))}
                        </div>
                        <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                          Note: "Other Service Module" and "Other Marketplace" slots allow future expansion without redesign.
                        </div>
                      </div>

                      <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-slate-900">Acceptance checklist</div>
                            <div className="mt-1 text-xs text-slate-500">Premium: compliance attestations can be required by policy.</div>
                          </div>
                          <Toggle enabled={requireAttestations} onChange={setRequireAttestations} label="Require attestations" description="If on, all boxes must be checked" />
                        </div>

                        <div className={cn("mt-4 space-y-2", !requireAttestations && "opacity-70")}>
                          <CheckRow label="I will use CorporatePay for business purposes only" checked={attest.businessOnly} onChange={(v) => setAttest((p) => ({ ...p, businessOnly: v }))} disabled={!requireAttestations} />
                          <CheckRow label="I will not use CorporatePay for personal spending" checked={attest.noPersonalUse} onChange={(v) => setAttest((p) => ({ ...p, noPersonalUse: v }))} disabled={!requireAttestations} />
                          <CheckRow label="I agree to follow corporate spending policies" checked={attest.complyPolicy} onChange={(v) => setAttest((p) => ({ ...p, complyPolicy: v }))} disabled={!requireAttestations} />
                          <CheckRow label="I understand data privacy and audit logging" checked={attest.dataPrivacy} onChange={(v) => setAttest((p) => ({ ...p, dataPrivacy: v }))} disabled={!requireAttestations} />
                          <CheckRow label="I will comply with anti-bribery and compliance rules" checked={attest.antiBribery} onChange={(v) => setAttest((p) => ({ ...p, antiBribery: v }))} disabled={!requireAttestations} />
                        </div>

                        <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                          {attestationOk ? "Checklist complete." : "Complete the checklist to proceed."}
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                        <Button variant="outline" onClick={() => setStep(2)}>
                          Back
                        </Button>
                        <Button variant="primary" onClick={acceptInvite}>
                          <BadgeCheck className="h-4 w-4" /> Accept invite
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                ) : null}

                {step === 4 ? (
                  <motion.div key="s4" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }} className="space-y-4">
                    <Card title="Welcome wizard" subtitle="Policy highlights, do/don’t rules, and what changes in the app" right={<Pill label="Premium" tone="info" />}>
                      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        <div className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="text-sm font-semibold text-slate-900">CorporatePay available in the EVzone app</div>
                          <div className="mt-1 text-xs text-slate-500">You continue using the normal EVzone apps. Only the payment method changes.</div>
                          <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <div className="text-xs font-semibold text-slate-600">Checkout behavior</div>
                            <ul className="mt-2 space-y-1 text-xs text-slate-700">
                              <li>1) You choose a ride/service/purchase as usual.</li>
                              <li>2) At checkout, select <span className="font-semibold text-slate-900">CorporatePay</span>.</li>
                              <li>3) Policies and approvals may apply.</li>
                              <li>4) Spend maps to your group and cost center automatically.</li>
                            </ul>
                          </div>

                          <div className="mt-3">
                            <CheckRow label="I understand CorporatePay appears at checkout" checked={ackCheckout} onChange={setAckCheckout} />
                          </div>
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="text-sm font-semibold text-slate-900">Policy highlights</div>
                          <div className="mt-1 text-xs text-slate-500">Key rules you should follow.</div>

                          <div className="mt-3 grid grid-cols-1 gap-3">
                            <DoDontCard
                              kind="do"
                              title="Do"
                              items={[
                                "Use correct purpose tags (airport, client meeting, etc.)",
                                `Stay within spend limits (${effectiveDefaults.spendLimits.daily} daily)` ,
                                "Use approved vendors and marketplaces",
                              ]}
                            />
                            <DoDontCard
                              kind="dont"
                              title="Don’t"
                              items={[
                                "Use CorporatePay for personal purchases",
                                "Bypass approvals or split purchases to avoid thresholds",
                                "Buy restricted categories (example: alcohol)",
                              ]}
                            />
                          </div>

                          <div className="mt-3 space-y-2">
                            <CheckRow label="I understand the policy do/don’t rules" checked={ackPolicy} onChange={setAckPolicy} />
                            <CheckRow label="I understand approvals can be required above thresholds" checked={ackApprovals} onChange={setAckApprovals} />
                          </div>

                          <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                            Tip: if you need an exception, request approval in-app. All actions are audited.
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                        <Button variant="outline" onClick={() => setStep(3)}>
                          Back
                        </Button>
                        <Button variant="primary" onClick={finish}>
                          <ChevronRight className="h-4 w-4" /> Finish
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                ) : null}

                {step === 5 ? (
                  <motion.div key="s5" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }} className="space-y-4">
                    <Card title="You’re all set" subtitle="CorporatePay is now active for your EVzone account" right={<Pill label="Completed" tone="good" />}>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <SuccessCard icon={<Wallet className="h-5 w-5" />} title="CorporatePay enabled" desc="CorporatePay can now be selected at checkout for eligible transactions." />
                        <SuccessCard icon={<Shield className="h-5 w-5" />} title="Policies enforced" desc="Some transactions will require approval depending on rules and thresholds." />
                        <SuccessCard icon={<Users className="h-5 w-5" />} title="Org mapping" desc={`Spend maps to group ${effectiveDefaults.group} and cost center ${effectiveDefaults.defaultCostCenter}.`} />
                        <SuccessCard icon={<FileCheck className="h-5 w-5" />} title="Audit ready" desc="All approvals and changes are logged for compliance." />
                      </div>

                      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3">
                        <div className="flex items-start gap-2">
                          <Sparkles className="mt-0.5 h-4 w-4 text-emerald-700" />
                          <div className="text-xs text-slate-600">
                            EVzone ID: <span className="font-semibold text-slate-900">{accountId}</span> • Organization: <span className="font-semibold text-slate-900">{effectiveDefaults.organization}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                        <Button variant="outline" onClick={() => toast({ title: "Guide", message: "Opening onboarding guide (demo).", kind: "info" })}>
                          <HelpCircle className="h-4 w-4" /> View guide
                        </Button>
                        <Button variant="primary" onClick={() => toast({ title: "Dashboard", message: "Opening CorporatePay Admin Console (demo).", kind: "success" })}>
                          <ChevronRight className="h-4 w-4" /> Open dashboard
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </div>

          <div className="mt-6 text-xs text-slate-500">X3: validates invite token/email/phone/expiry, links or creates EVzone account, applies admin defaults (group/role/limits/auto-approval/cost center/project tags), and completes a premium welcome wizard.</div>
        </div>
      </div>

      <footer className="border-t border-slate-200 bg-white/60 py-6">
        <div className="mx-auto max-w-7xl px-4 text-xs text-slate-500 md:px-6">
          X3 Invite Acceptance: includes JIT provisioning (domain/HRIS rules), compliance checklist, and welcome wizard for policy highlights.
        </div>
      </footer>
    </div>
  );
}

function MiniRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
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

function SelectCard({
  title,
  desc,
  icon,
  active,
  onClick,
}: {
  title: string;
  desc: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-3xl border p-4 text-left transition",
        active ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white hover:bg-slate-50"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <span className="text-slate-600">{icon}</span>
            {title}
          </div>
          <div className="mt-2 text-sm text-slate-600">{desc}</div>
        </div>
        {active ? <BadgeCheck className="h-5 w-5 text-emerald-700" /> : null}
      </div>
    </button>
  );
}

function DefaultCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-slate-600">{icon}</span>
          <span className="text-xs font-semibold text-slate-600">{label}</span>
        </div>
        <Pill label="Applied" tone="good" />
      </div>
      <div className="mt-2 text-sm font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function CheckRow({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className={cn("flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3", disabled && "opacity-60")}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 rounded border-slate-300"
      />
      <div className="text-sm font-semibold text-slate-800">{label}</div>
    </label>
  );
}

function DoDontCard({
  kind,
  title,
  items,
}: {
  kind: "do" | "dont";
  title: string;
  items: string[];
}) {
  const tone = kind === "do" ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50";
  const dot = kind === "do" ? "#10B981" : "#F43F5E";
  return (
    <div className={cn("rounded-3xl border p-4", tone)}>
      <div className="text-sm font-semibold text-slate-900">{title}</div>
      <ul className="mt-2 space-y-1 text-sm text-slate-700">
        {items.map((it) => (
          <li key={it} className="flex items-start gap-2">
            <span className="mt-2 h-1.5 w-1.5 rounded-full" style={{ background: dot }} />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SuccessCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2">
        <div className="grid h-9 w-9 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
          {icon}
        </div>
        <div>
          <div className="text-sm font-semibold text-slate-900">{title}</div>
          <div className="mt-1 text-xs text-slate-600">{desc}</div>
        </div>
      </div>
    </div>
  );
}
