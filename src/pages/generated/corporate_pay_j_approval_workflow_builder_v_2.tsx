import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BadgeCheck,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Copy,
  Download,
  FileText,
  Globe,
  Layers,
  Lock,
  Mail,
  MessageCircle,
  Plus,
  Save,
  Settings2,
  Shield,
  Smartphone,
  Sparkles,
  Store,
  Timer,
  TrendingUp,
  Users,
  X,
} from "lucide-react";

const EVZ = {
  green: "#03CD8C",
  orange: "#F77F00",
  grey: "#A6A6A6",
  light: "#F2F2F2",
};

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

type FlowScopeType = "Module" | "Marketplace" | "RFQ";

type PolicyTemplate =
  | "Org default"
  | "Conservative"
  | "Balanced"
  | "Flexible"
  | "Strict compliance";

type ApprovalFlowKind =
  | "Org default"
  | "Auto under threshold"
  | "Manager approval"
  | "Finance approval"
  | "CFO approval"
  | "Multi-level escalation";

type StageRole =
  | "Manager"
  | "Approver"
  | "Procurement"
  | "Accountant"
  | "Finance"
  | "CFO"
  | "Org Admin"
  | "Travel Coordinator"
  | "EVzone Support"
  | "Custom";

type AssignmentStrategy = "Round robin" | "Least load" | "First available" | "Specific user";

type EscalationTarget = "Next stage" | "Org Admin" | "CFO" | "Finance Desk" | "Approver Desk";

type DelegationMode = "Delegate user" | "Role pool" | "Skip to next stage";

type Channel = "Email" | "WhatsApp" | "WeChat" | "SMS";

type Risk = "Low" | "Medium" | "High";

type ApprovalStage = {
  id: string;
  name: string;
  minAmountUGX: number;
  role: StageRole;
  assignment: AssignmentStrategy;
  specificUser?: string;
  slaHours: number;
  escalation: {
    enabled: boolean;
    afterHours: number;
    target: EscalationTarget;
  };
  delegation: {
    enabled: boolean;
    mode: DelegationMode;
    delegateUser?: string;
    delegateRole?: StageRole;
  };
};

type ApprovalFlow = {
  id: string;
  name: string;
  enabled: boolean;
  scopeType: FlowScopeType;
  module?: ServiceModule;
  marketplace?: Marketplace;
  // rule engine
  rule: {
    autoApprove: {
      enabled: boolean;
      thresholdUGX: number;
      eligibleOnly: boolean;
    };
    requireApprovalOverUGX: number;
    // requirements
    requireAttachmentsOverUGX: number;
    requireCommentOverUGX: number;
  };
  stages: ApprovalStage[];
  defaults: {
    policyTemplate: PolicyTemplate;
    approvalFlowKind: ApprovalFlowKind;
  };
  sla: {
    breachAlertsEnabled: boolean;
    breachNotifyChannels: Channel[];
    remindBeforeMinutes: number;
  };
  loadBalancing: {
    enabled: boolean;
    strategy: "Round robin" | "Least load" | "First available";
  };
  meta: {
    industryTemplate?: "Corporate" | "Hospital" | "Tour Company";
    notes: string;
  };
};

type Approver = { id: string; name: string; role: StageRole; load: number; ooo: boolean };

type Scenario = {
  amountUGX: number;
  module: ServiceModule;
  marketplace?: Marketplace | "-";
  userAutoApprovalEligible: boolean;
  attachmentsProvided: boolean;
  commentProvided: boolean;
  elapsedHours: number;
  oooRoles: StageRole[];
};

type Decision = {
  status: "Auto-approved" | "Requires approval" | "Blocked";
  reasons: string[];
  stages: Array<{
    stage: ApprovalStage;
    assignedTo: string;
    slaDueInHours: number;
    breached: boolean;
    escalationTo: string;
  }>;
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

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
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

function NumberField({
  label,
  value,
  onChange,
  hint,
  disabled,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  hint?: string;
  disabled?: boolean;
}) {
  return (
    <div className={cn(disabled && "opacity-70")}>
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-semibold text-slate-600">{label}</div>
        {hint ? <div className="text-xs text-slate-500">{hint}</div> : null}
      </div>
      <input
        type="number"
        value={value}
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
  options: string[];
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
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
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
  children,
  onClose,
  footer,
  maxW = "920px",
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
                <div className="text-lg font-semibold text-slate-900">{title}</div>
                {subtitle ? <div className="mt-1 text-sm text-slate-600">{subtitle}</div> : null}
              </div>
              <button className="rounded-2xl p-2 text-slate-600 hover:bg-slate-100" onClick={onClose} aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto px-5 py-4">{children}</div>
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
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.18 }}
            className={cn(
              "fixed z-50 overflow-hidden border border-slate-200 bg-white shadow-[0_30px_90px_rgba(2,8,23,0.22)]",
              "left-2 right-2 bottom-2 top-[14vh] rounded-[28px]",
              "lg:left-auto lg:right-4 lg:top-4 lg:bottom-4 lg:w-[560px]"
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

function riskTone(r: Risk) {
  if (r === "High") return "bad" as const;
  if (r === "Medium") return "warn" as const;
  return "good" as const;
}

function stageRoleTone(role: StageRole) {
  if (role === "CFO" || role === "Org Admin") return "warn" as const;
  if (role === "Finance" || role === "Accountant") return "info" as const;
  if (role === "EVzone Support") return "bad" as const;
  return "neutral" as const;
}

function channelIcon(c: Channel) {
  if (c === "Email") return <Mail className="h-4 w-4" />;
  if (c === "WhatsApp") return <MessageCircle className="h-4 w-4" />;
  if (c === "WeChat") return <Globe className="h-4 w-4" />;
  return <Smartphone className="h-4 w-4" />;
}

function pickAssignee(stage: ApprovalStage, pool: Approver[]) {
  if (stage.assignment === "Specific user" && stage.specificUser) return stage.specificUser;
  const candidates = pool.filter((p) => p.role === stage.role);
  if (!candidates.length) return "(No approver pool)";
  if (stage.assignment === "First available") {
    const online = candidates.find((x) => !x.ooo);
    return online ? online.name : candidates[0].name;
  }
  if (stage.assignment === "Least load") {
    const sorted = [...candidates].sort((a, b) => a.load - b.load);
    const best = sorted.find((x) => !x.ooo) || sorted[0];
    return best.name;
  }
  // Round robin deterministic by stage id hash
  const idx = Math.abs(hashCode(stage.id)) % candidates.length;
  const rr = candidates[(idx + 0) % candidates.length];
  const rr2 = !rr.ooo ? rr : candidates.find((x) => !x.ooo) || rr;
  return rr2.name;
}

function hashCode(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return h | 0;
}

function evaluate(flow: ApprovalFlow, scenario: Scenario, approvers: Approver[]): Decision {
  if (!flow.enabled) {
    return { status: "Blocked", reasons: ["Flow is disabled"], stages: [] };
  }

  const reasons: string[] = [];

  // Scope check
  if (flow.scopeType === "Module") {
    if (flow.module && flow.module !== scenario.module) {
      return { status: "Blocked", reasons: ["Scenario module does not match flow scope"], stages: [] };
    }
  }
  if (flow.scopeType === "Marketplace") {
    if (flow.module !== "E-Commerce") {
      return { status: "Blocked", reasons: ["Marketplace flow must be under E-Commerce"], stages: [] };
    }
    if ((scenario.marketplace || "-") === "-") {
      return { status: "Blocked", reasons: ["Scenario has no marketplace"], stages: [] };
    }
    if (flow.marketplace && flow.marketplace !== scenario.marketplace) {
      return { status: "Blocked", reasons: ["Scenario marketplace does not match flow scope"], stages: [] };
    }
  }
  if (flow.scopeType === "RFQ") {
    // RFQ is independent of module in this simplified builder.
  }

  // Requirements
  if (scenario.amountUGX >= flow.rule.requireAttachmentsOverUGX && !scenario.attachmentsProvided) {
    return { status: "Blocked", reasons: ["Attachments required above threshold"], stages: [] };
  }
  if (scenario.amountUGX >= flow.rule.requireCommentOverUGX && !scenario.commentProvided) {
    return { status: "Blocked", reasons: ["Comment required above threshold"], stages: [] };
  }

  // Auto approval
  if (flow.rule.autoApprove.enabled) {
    if (scenario.amountUGX <= flow.rule.autoApprove.thresholdUGX) {
      if (!flow.rule.autoApprove.eligibleOnly || scenario.userAutoApprovalEligible) {
        reasons.push("Auto-approved under threshold");
        if (flow.rule.autoApprove.eligibleOnly) reasons.push("Auto-approval eligibility satisfied");
        return { status: "Auto-approved", reasons, stages: [] };
      }
      reasons.push("Auto-approve blocked: user not eligible");
    }
  }

  // Approval required rule
  if (scenario.amountUGX <= flow.rule.requireApprovalOverUGX) {
    // Under approval trigger but not auto-approved
    reasons.push("Under approval trigger. Allowed without approval.");
    return { status: "Auto-approved", reasons, stages: [] };
  }

  // Determine active stages
  const activeStages = [...flow.stages]
    .filter((s) => scenario.amountUGX >= s.minAmountUGX)
    .sort((a, b) => a.minAmountUGX - b.minAmountUGX);

  if (!activeStages.length) {
    reasons.push("No stages configured for this amount");
    return { status: "Requires approval", reasons, stages: [] };
  }

  const computed = activeStages.map((s, idx) => {
    const baseAssignee = pickAssignee(s, approvers);
    const roleOOO = scenario.oooRoles.includes(s.role);

    let assignedTo = baseAssignee;
    let escalationTo = s.escalation.enabled
      ? s.escalation.target === "Next stage"
        ? idx < activeStages.length - 1
          ? activeStages[idx + 1].role
          : "Org Admin"
        : s.escalation.target
      : "(none)";

    if (roleOOO && s.delegation.enabled) {
      if (s.delegation.mode === "Delegate user" && s.delegation.delegateUser) {
        assignedTo = s.delegation.delegateUser;
        escalationTo = "(delegate)";
      } else if (s.delegation.mode === "Role pool") {
        const role = s.delegation.delegateRole || s.role;
        const proxyStage: ApprovalStage = { ...s, role, assignment: "Least load" };
        assignedTo = pickAssignee(proxyStage, approvers);
        escalationTo = "(role pool)";
      } else if (s.delegation.mode === "Skip to next stage") {
        assignedTo = "(skipped)";
        escalationTo = "Next stage";
      }
    }

    const slaDueIn = Math.max(0, s.slaHours - scenario.elapsedHours);
    const breached = scenario.elapsedHours > s.slaHours;

    return {
      stage: s,
      assignedTo,
      slaDueInHours: slaDueIn,
      breached,
      escalationTo: String(escalationTo),
    };
  });

  if (computed.some((c) => c.assignedTo === "(skipped)")) {
    reasons.push("Out-of-office delegation skipped one or more stages");
  }

  return { status: "Requires approval", reasons, stages: computed };
}

function createStage(partial: Partial<ApprovalStage> & { name: string }): ApprovalStage {
  return {
    id: uid("STG"),
    name: partial.name,
    minAmountUGX: partial.minAmountUGX ?? 0,
    role: partial.role ?? "Manager",
    assignment: partial.assignment ?? "Least load",
    specificUser: partial.specificUser,
    slaHours: partial.slaHours ?? 8,
    escalation: partial.escalation ?? { enabled: true, afterHours: 8, target: "Next stage" },
    delegation: partial.delegation ?? { enabled: true, mode: "Role pool", delegateRole: partial.role ?? "Manager" },
  };
}

function initialFlows(): ApprovalFlow[] {
  const f: ApprovalFlow[] = [];

  f.push({
    id: uid("FLOW"),
    name: "Rides & Logistics approvals",
    enabled: true,
    scopeType: "Module",
    module: "Rides & Logistics",
    rule: {
      autoApprove: { enabled: true, thresholdUGX: 200000, eligibleOnly: true },
      requireApprovalOverUGX: 200000,
      requireAttachmentsOverUGX: 2000000,
      requireCommentOverUGX: 800000,
    },
    stages: [
      createStage({ name: "Manager approval", minAmountUGX: 200000, role: "Manager", slaHours: 6, assignment: "First available" }),
      createStage({ name: "Finance approval", minAmountUGX: 1000000, role: "Finance", slaHours: 8, assignment: "Least load" }),
      createStage({ name: "CFO approval", minAmountUGX: 5000000, role: "CFO", slaHours: 12, assignment: "Least load" }),
    ],
    defaults: { policyTemplate: "Balanced", approvalFlowKind: "Multi-level escalation" },
    sla: { breachAlertsEnabled: true, breachNotifyChannels: ["Email", "WhatsApp"], remindBeforeMinutes: 30 },
    loadBalancing: { enabled: true, strategy: "Least load" },
    meta: { industryTemplate: "Corporate", notes: "Default ride approvals. Tighten for premium rides in Policy Builder." },
  });

  f.push({
    id: uid("FLOW"),
    name: "EVs & Charging approvals",
    enabled: true,
    scopeType: "Module",
    module: "EVs & Charging",
    rule: {
      autoApprove: { enabled: true, thresholdUGX: 300000, eligibleOnly: true },
      requireApprovalOverUGX: 300000,
      requireAttachmentsOverUGX: 3000000,
      requireCommentOverUGX: 1000000,
    },
    stages: [
      createStage({ name: "Manager approval", minAmountUGX: 300000, role: "Manager", slaHours: 8, assignment: "Least load" }),
      createStage({ name: "Finance approval", minAmountUGX: 2000000, role: "Finance", slaHours: 12, assignment: "Least load" }),
    ],
    defaults: { policyTemplate: "Balanced", approvalFlowKind: "Manager approval" },
    sla: { breachAlertsEnabled: true, breachNotifyChannels: ["Email"], remindBeforeMinutes: 45 },
    loadBalancing: { enabled: true, strategy: "Least load" },
    meta: { industryTemplate: "Corporate", notes: "Credits and station services. Consider stricter policy for refunds." },
  });

  f.push({
    id: uid("FLOW"),
    name: "Medical & Health Care approvals",
    enabled: true,
    scopeType: "Module",
    module: "Medical & Health Care",
    rule: {
      autoApprove: { enabled: true, thresholdUGX: 100000, eligibleOnly: true },
      requireApprovalOverUGX: 100000,
      requireAttachmentsOverUGX: 500000,
      requireCommentOverUGX: 250000,
    },
    stages: [
      createStage({ name: "Manager approval", minAmountUGX: 100000, role: "Manager", slaHours: 4, assignment: "First available" }),
      createStage({ name: "Finance approval", minAmountUGX: 800000, role: "Finance", slaHours: 8, assignment: "Least load" }),
    ],
    defaults: { policyTemplate: "Strict compliance", approvalFlowKind: "Multi-level escalation" },
    sla: { breachAlertsEnabled: true, breachNotifyChannels: ["Email", "SMS"], remindBeforeMinutes: 20 },
    loadBalancing: { enabled: true, strategy: "First available" },
    meta: { industryTemplate: "Hospital", notes: "Higher sensitivity. Keep attachments and comments strict." },
  });

  f.push({
    id: uid("FLOW"),
    name: "Travel & Tourism approvals",
    enabled: true,
    scopeType: "Module",
    module: "Travel & Tourism",
    rule: {
      autoApprove: { enabled: true, thresholdUGX: 250000, eligibleOnly: true },
      requireApprovalOverUGX: 250000,
      requireAttachmentsOverUGX: 2000000,
      requireCommentOverUGX: 800000,
    },
    stages: [
      createStage({ name: "Manager approval", minAmountUGX: 250000, role: "Manager", slaHours: 8, assignment: "Least load" }),
      createStage({ name: "Finance approval", minAmountUGX: 2000000, role: "Finance", slaHours: 12, assignment: "Least load" }),
    ],
    defaults: { policyTemplate: "Balanced", approvalFlowKind: "Manager approval" },
    sla: { breachAlertsEnabled: true, breachNotifyChannels: ["Email", "WhatsApp"], remindBeforeMinutes: 30 },
    loadBalancing: { enabled: true, strategy: "Least load" },
    meta: { industryTemplate: "Tour Company", notes: "Airport and hotel bookings. Consider vendor allowlist." },
  });

  f.push({
    id: uid("FLOW"),
    name: "Finance & Payments approvals",
    enabled: true,
    scopeType: "Module",
    module: "Finance & Payments",
    rule: {
      autoApprove: { enabled: false, thresholdUGX: 0, eligibleOnly: true },
      requireApprovalOverUGX: 0,
      requireAttachmentsOverUGX: 0,
      requireCommentOverUGX: 0,
    },
    stages: [
      createStage({ name: "Finance approval", minAmountUGX: 0, role: "Finance", slaHours: 6, assignment: "Least load" }),
      createStage({ name: "CFO approval", minAmountUGX: 10000000, role: "CFO", slaHours: 12, assignment: "Least load" }),
    ],
    defaults: { policyTemplate: "Strict compliance", approvalFlowKind: "Finance approval" },
    sla: { breachAlertsEnabled: true, breachNotifyChannels: ["Email", "SMS"], remindBeforeMinutes: 15 },
    loadBalancing: { enabled: true, strategy: "Least load" },
    meta: { industryTemplate: "Corporate", notes: "Direct money movement. Always audited." },
  });

  f.push({
    id: uid("FLOW"),
    name: "E-Commerce default approvals",
    enabled: true,
    scopeType: "Module",
    module: "E-Commerce",
    rule: {
      autoApprove: { enabled: true, thresholdUGX: 150000, eligibleOnly: true },
      requireApprovalOverUGX: 150000,
      requireAttachmentsOverUGX: 3000000,
      requireCommentOverUGX: 900000,
    },
    stages: [
      createStage({ name: "Procurement approval", minAmountUGX: 150000, role: "Procurement", slaHours: 10, assignment: "Least load" }),
      createStage({ name: "Finance approval", minAmountUGX: 2000000, role: "Finance", slaHours: 12, assignment: "Least load" }),
      createStage({ name: "CFO approval", minAmountUGX: 12000000, role: "CFO", slaHours: 24, assignment: "Least load" }),
    ],
    defaults: { policyTemplate: "Balanced", approvalFlowKind: "Multi-level escalation" },
    sla: { breachAlertsEnabled: true, breachNotifyChannels: ["Email"], remindBeforeMinutes: 45 },
    loadBalancing: { enabled: true, strategy: "Least load" },
    meta: { industryTemplate: "Corporate", notes: "Marketplace specifics can override, e.g., MyLiveDealz." },
  });

  f.push({
    id: uid("FLOW"),
    name: "MyLiveDealz approvals (override)",
    enabled: true,
    scopeType: "Marketplace",
    module: "E-Commerce",
    marketplace: "MyLiveDealz",
    rule: {
      autoApprove: { enabled: true, thresholdUGX: 100000, eligibleOnly: true },
      requireApprovalOverUGX: 100000,
      requireAttachmentsOverUGX: 1000000,
      requireCommentOverUGX: 500000,
    },
    stages: [
      createStage({ name: "Procurement approval", minAmountUGX: 100000, role: "Procurement", slaHours: 8, assignment: "Least load" }),
      createStage({ name: "Finance approval", minAmountUGX: 1500000, role: "Finance", slaHours: 10, assignment: "Least load" }),
      createStage({ name: "CFO approval", minAmountUGX: 5000000, role: "CFO", slaHours: 16, assignment: "Least load" }),
    ],
    defaults: { policyTemplate: "Conservative", approvalFlowKind: "Multi-level escalation" },
    sla: { breachAlertsEnabled: true, breachNotifyChannels: ["Email", "WhatsApp"], remindBeforeMinutes: 30 },
    loadBalancing: { enabled: true, strategy: "Least load" },
    meta: { industryTemplate: "Corporate", notes: "Deal pages can have high-value assets. Keep stricter approvals." },
  });

  f.push({
    id: uid("FLOW"),
    name: "RFQ / High-value assets approvals",
    enabled: true,
    scopeType: "RFQ",
    rule: {
      autoApprove: { enabled: false, thresholdUGX: 0, eligibleOnly: true },
      requireApprovalOverUGX: 0,
      requireAttachmentsOverUGX: 0,
      requireCommentOverUGX: 0,
    },
    stages: [
      createStage({ name: "Manager approval", minAmountUGX: 0, role: "Manager", slaHours: 6, assignment: "First available" }),
      createStage({ name: "Finance approval", minAmountUGX: 0, role: "Finance", slaHours: 8, assignment: "Least load" }),
      createStage({ name: "CFO approval", minAmountUGX: 0, role: "CFO", slaHours: 12, assignment: "Least load" }),
    ],
    defaults: { policyTemplate: "Strict compliance", approvalFlowKind: "Multi-level escalation" },
    sla: { breachAlertsEnabled: true, breachNotifyChannels: ["Email", "SMS"], remindBeforeMinutes: 20 },
    loadBalancing: { enabled: true, strategy: "Least load" },
    meta: { industryTemplate: "Corporate", notes: "RFQs always require approvals and are tracked by SLA." },
  });

  return f;
}

function templatePack(industry: "Corporate" | "Hospital" | "Tour Company"): ApprovalFlow[] {
  const base = initialFlows();
  const next = base.map((f) => ({ ...f, id: uid("FLOW"), meta: { ...f.meta, industryTemplate: industry } }));

  if (industry === "Hospital") {
    // tighten medical and finance
    next.forEach((f) => {
      if (f.module === "Medical & Health Care") {
        f.rule.autoApprove.thresholdUGX = 80000;
        f.rule.requireAttachmentsOverUGX = 300000;
        f.sla.remindBeforeMinutes = 15;
        f.sla.breachNotifyChannels = ["Email", "SMS", "WhatsApp"];
        f.stages.forEach((s) => (s.slaHours = Math.max(2, Math.min(8, s.slaHours - 2))));
      }
      if (f.module === "Finance & Payments") {
        f.sla.remindBeforeMinutes = 10;
        f.sla.breachNotifyChannels = ["Email", "SMS"];
      }
    });
  }

  if (industry === "Tour Company") {
    next.forEach((f) => {
      if (f.module === "Travel & Tourism") {
        f.rule.autoApprove.thresholdUGX = 300000;
        f.rule.requireCommentOverUGX = 500000;
        f.sla.breachNotifyChannels = ["Email", "WhatsApp"];
      }
    });
  }

  return next;
}

function ms(n: number) {
  return `${n} min`;
}

export default function CorporatePayApprovalWorkflowBuilderV2() {
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

  const POLICY_TEMPLATES: PolicyTemplate[] = ["Org default", "Conservative", "Balanced", "Flexible", "Strict compliance"];
  const APPROVAL_FLOW_KINDS: ApprovalFlowKind[] = [
    "Org default",
    "Auto under threshold",
    "Manager approval",
    "Finance approval",
    "CFO approval",
    "Multi-level escalation",
  ];
  const ROLE_OPTIONS: StageRole[] = [
    "Manager",
    "Approver",
    "Procurement",
    "Accountant",
    "Finance",
    "CFO",
    "Org Admin",
    "Travel Coordinator",
    "EVzone Support",
    "Custom",
  ];
  const STRATEGIES: AssignmentStrategy[] = ["Round robin", "Least load", "First available", "Specific user"];
  const ESC_TARGETS: EscalationTarget[] = ["Next stage", "Org Admin", "CFO", "Finance Desk", "Approver Desk"];
  const DELEGATION_MODES: DelegationMode[] = ["Delegate user", "Role pool", "Skip to next stage"];
  const CHANNELS: Channel[] = ["Email", "WhatsApp", "WeChat", "SMS"];

  const [toasts, setToasts] = useState<Array<{ id: string; title: string; message?: string; kind: string }>>([]);
  const toast = (t: { title: string; message?: string; kind: string }) => {
    const id = uid("toast");
    setToasts((p) => [{ id, ...t }, ...p].slice(0, 4));
    window.setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 3200);
  };

  const [tab, setTab] = useState<"builder" | "templates" | "analytics">("builder");

  const [flows, setFlows] = useState<ApprovalFlow[]>(() => initialFlows());
  const [published, setPublished] = useState<ApprovalFlow[]>(() => deepClone(initialFlows()));

  const [query, setQuery] = useState("");
  const [scopeFilter, setScopeFilter] = useState<"All" | FlowScopeType>("All");

  const [selectedId, setSelectedId] = useState<string>(() => initialFlows()[0]?.id || "");
  const selectedFlow = useMemo(() => flows.find((f) => f.id === selectedId) || null, [flows, selectedId]);

  // Approver pools for load balancing preview
  const [approvers, setApprovers] = useState<Approver[]>(() => [
    { id: "AP-1", name: "Ops Manager", role: "Manager", load: 2, ooo: false },
    { id: "AP-2", name: "Sales Manager", role: "Manager", load: 5, ooo: false },
    { id: "AP-3", name: "Procurement Desk", role: "Procurement", load: 7, ooo: false },
    { id: "AP-4", name: "Approver Desk", role: "Approver", load: 4, ooo: false },
    { id: "AP-5", name: "Finance Desk", role: "Finance", load: 6, ooo: false },
    { id: "AP-6", name: "Accountant", role: "Accountant", load: 3, ooo: false },
    { id: "AP-7", name: "CFO", role: "CFO", load: 1, ooo: false },
    { id: "AP-8", name: "Org Admin", role: "Org Admin", load: 2, ooo: false },
  ]);

  // Simulator
  const [scenario, setScenario] = useState<Scenario>({
    amountUGX: 650000,
    module: "Rides & Logistics",
    marketplace: "-",
    userAutoApprovalEligible: true,
    attachmentsProvided: true,
    commentProvided: true,
    elapsedHours: 0,
    oooRoles: [],
  });

  // Modals
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishReason, setPublishReason] = useState("");
  const [publishAck, setPublishAck] = useState(false);

  const [cloneOpen, setCloneOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [newKind, setNewKind] = useState<FlowScopeType>("Module");
  const [newName, setNewName] = useState("New approval flow");
  const [newModule, setNewModule] = useState<ServiceModule>("Rides & Logistics");
  const [newMarketplace, setNewMarketplace] = useState<Marketplace>("MyLiveDealz");

  const [templateOpen, setTemplateOpen] = useState(false);
  const [templateIndustry, setTemplateIndustry] = useState<"Corporate" | "Hospital" | "Tour Company">("Corporate");
  const [templateMode, setTemplateMode] = useState<"append" | "replace">("append");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [stageEditId, setStageEditId] = useState<string | null>(null);

  const diffCount = useMemo(() => {
    // quick diff based on JSON length changes, but stable enough for UI
    const a = JSON.stringify(flows);
    const b = JSON.stringify(published);
    return a === b ? 0 : 1;
  }, [flows, published]);

  const filteredFlows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return flows
      .filter((f) => (scopeFilter === "All" ? true : f.scopeType === scopeFilter))
      .filter((f) => {
        if (!q) return true;
        const blob = `${f.name} ${f.scopeType} ${f.module || ""} ${f.marketplace || ""} ${f.defaults.policyTemplate} ${f.defaults.approvalFlowKind}`.toLowerCase();
        return blob.includes(q);
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [flows, query, scopeFilter]);

  // If selected flow disappears (deleted), select first.
  useEffect(() => {
    if (!selectedId) return;
    if (!flows.some((f) => f.id === selectedId)) {
      setSelectedId(flows[0]?.id || "");
    }
  }, [flows, selectedId]);

  const decision = useMemo(() => {
    if (!selectedFlow) return null;
    // Align scenario scope for marketplace flows
    const sc = { ...scenario };
    if (selectedFlow.scopeType === "Marketplace") {
      sc.module = "E-Commerce";
      sc.marketplace = selectedFlow.marketplace || "MyLiveDealz";
    }
    if (selectedFlow.scopeType === "Module" && selectedFlow.module) {
      sc.module = selectedFlow.module;
      sc.marketplace = selectedFlow.module === "E-Commerce" ? (sc.marketplace === "-" ? "MyLiveDealz" : sc.marketplace) : "-";
    }
    if (selectedFlow.scopeType === "RFQ") {
      sc.module = "Rides & Logistics";
      sc.marketplace = "-";
    }
    return evaluate(selectedFlow, sc, approvers);
  }, [selectedFlow, scenario, approvers]);

  const openStageEditor = (stageId: string) => {
    setStageEditId(stageId);
    setDrawerOpen(true);
  };

  const stageBeingEdited = useMemo(() => {
    if (!selectedFlow || !stageEditId) return null;
    return selectedFlow.stages.find((s) => s.id === stageEditId) || null;
  }, [selectedFlow, stageEditId]);

  const setSelectedFlowPatch = (patch: (f: ApprovalFlow) => ApprovalFlow) => {
    if (!selectedFlow) return;
    setFlows((prev) => prev.map((f) => (f.id === selectedFlow.id ? patch(f) : f)));
  };

  const addStage = () => {
    if (!selectedFlow) return;
    const stage = createStage({ name: "New stage", minAmountUGX: selectedFlow.rule.requireApprovalOverUGX, role: "Manager", slaHours: 8 });
    setSelectedFlowPatch((f) => ({ ...f, stages: [...f.stages, stage] }));
    toast({ title: "Stage added", message: `Added ${stage.name}.`, kind: "success" });
  };

  const moveStage = (id: string, dir: -1 | 1) => {
    if (!selectedFlow) return;
    const idx = selectedFlow.stages.findIndex((s) => s.id === id);
    const nextIdx = idx + dir;
    if (idx < 0 || nextIdx < 0 || nextIdx >= selectedFlow.stages.length) return;
    setSelectedFlowPatch((f) => {
      const stages = [...f.stages];
      const tmp = stages[idx];
      stages[idx] = stages[nextIdx];
      stages[nextIdx] = tmp;
      return { ...f, stages };
    });
  };

  const deleteStage = (id: string) => {
    if (!selectedFlow) return;
    setSelectedFlowPatch((f) => ({ ...f, stages: f.stages.filter((s) => s.id !== id) }));
    toast({ title: "Stage removed", message: `Removed stage ${id}.`, kind: "info" });
  };

  const cloneFlow = () => {
    if (!selectedFlow) return;
    const copy = deepClone(selectedFlow);
    copy.id = uid("FLOW");
    copy.name = `${selectedFlow.name} (Copy)`;
    copy.meta.notes = `${selectedFlow.meta.notes}\nCloned from ${selectedFlow.id}`;
    setFlows((p) => [copy, ...p]);
    setSelectedId(copy.id);
    setCloneOpen(false);
    toast({ title: "Cloned", message: "Flow cloned.", kind: "success" });
  };

  const deleteFlow = () => {
    if (!selectedFlow) return;
    setFlows((p) => p.filter((x) => x.id !== selectedFlow.id));
    toast({ title: "Deleted", message: "Flow deleted.", kind: "info" });
  };

  const newFlow = () => {
    const f: ApprovalFlow = {
      id: uid("FLOW"),
      name: newName.trim() || "New approval flow",
      enabled: true,
      scopeType: newKind,
      module: newKind === "Module" ? newModule : newKind === "Marketplace" ? "E-Commerce" : undefined,
      marketplace: newKind === "Marketplace" ? newMarketplace : undefined,
      rule: {
        autoApprove: { enabled: true, thresholdUGX: 200000, eligibleOnly: true },
        requireApprovalOverUGX: 200000,
        requireAttachmentsOverUGX: 2000000,
        requireCommentOverUGX: 800000,
      },
      stages: [
        createStage({ name: "Manager approval", minAmountUGX: 200000, role: "Manager", slaHours: 8, assignment: "Least load" }),
      ],
      defaults: { policyTemplate: "Balanced", approvalFlowKind: "Manager approval" },
      sla: { breachAlertsEnabled: true, breachNotifyChannels: ["Email"], remindBeforeMinutes: 30 },
      loadBalancing: { enabled: true, strategy: "Least load" },
      meta: { notes: "", industryTemplate: newKind === "RFQ" ? "Corporate" : undefined },
    };

    if (newKind === "RFQ") {
      f.rule.autoApprove.enabled = false;
      f.rule.requireApprovalOverUGX = 0;
      f.rule.requireAttachmentsOverUGX = 0;
      f.rule.requireCommentOverUGX = 0;
      f.stages = [
        createStage({ name: "Manager approval", minAmountUGX: 0, role: "Manager", slaHours: 6, assignment: "First available" }),
        createStage({ name: "Finance approval", minAmountUGX: 0, role: "Finance", slaHours: 8, assignment: "Least load" }),
        createStage({ name: "CFO approval", minAmountUGX: 0, role: "CFO", slaHours: 12, assignment: "Least load" }),
      ];
      f.defaults = { policyTemplate: "Strict compliance", approvalFlowKind: "Multi-level escalation" };
    }

    setFlows((p) => [f, ...p]);
    setSelectedId(f.id);
    setNewOpen(false);
    toast({ title: "Created", message: "New flow created.", kind: "success" });
  };

  const openPublish = () => {
    setPublishReason("");
    setPublishAck(false);
    setPublishOpen(true);
  };

  const publish = () => {
    if (!publishAck || publishReason.trim().length < 8) {
      toast({ title: "Publish blocked", message: "Add a reason and confirm acknowledgement.", kind: "warn" });
      return;
    }
    setPublished(deepClone(flows));
    setPublishOpen(false);
    toast({ title: "Published", message: "Approval workflows published.", kind: "success" });
  };

  const saveDraft = () => {
    toast({ title: "Saved", message: "Draft saved (demo).", kind: "success" });
  };

  const revert = () => {
    setFlows(deepClone(published));
    toast({ title: "Reverted", message: "Reverted to last published.", kind: "info" });
  };

  const applyTemplate = () => {
    const pack = templatePack(templateIndustry);
    if (templateMode === "replace") {
      setFlows(pack);
      setSelectedId(pack[0]?.id || "");
    } else {
      setFlows((p) => [...pack, ...p]);
      setSelectedId(pack[0]?.id || selectedId);
    }
    setTemplateOpen(false);
    toast({ title: "Template applied", message: `${templateIndustry} template applied (${templateMode}).`, kind: "success" });
  };

  // Analytics (logic-based)
  const analytics = useMemo(() => {
    // Synthetic historical approval dataset based on stages
    const samples = flows.flatMap((f) =>
      f.stages.map((s) => {
        const base = s.role === "CFO" ? 9 : s.role === "Finance" ? 6 : s.role === "Procurement" ? 5 : 3;
        const avgHours = base + (s.minAmountUGX / 10000000) * 2;
        const reworkRate = s.role === "Procurement" ? 0.14 : 0.08;
        const breachRate = Math.min(0.4, Math.max(0.02, (avgHours - s.slaHours) / Math.max(1, s.slaHours)));
        return {
          flowId: f.id,
          flowName: f.name,
          stageId: s.id,
          stageName: s.name,
          role: s.role,
          avgHours: Number(avgHours.toFixed(1)),
          slaHours: s.slaHours,
          breachRate: Number(clamp(breachRate, 0, 1).toFixed(2)),
          reworkRate: Number(reworkRate.toFixed(2)),
        };
      })
    );

    const overallAvg = samples.reduce((a, x) => a + x.avgHours, 0) / Math.max(1, samples.length);
    const overallBreach = samples.reduce((a, x) => a + x.breachRate, 0) / Math.max(1, samples.length);
    const overallRework = samples.reduce((a, x) => a + x.reworkRate, 0) / Math.max(1, samples.length);

    const bottleneck = [...samples].sort((a, b) => b.avgHours - a.avgHours)[0];

    // bottleneck by role
    const byRole = ROLE_OPTIONS.map((r) => {
      const rs = samples.filter((x) => x.role === r);
      if (!rs.length) return null;
      const avg = rs.reduce((a, x) => a + x.avgHours, 0) / rs.length;
      return { role: r, avgHours: Number(avg.toFixed(1)), count: rs.length };
    }).filter(Boolean) as Array<{ role: StageRole; avgHours: number; count: number }>;

    byRole.sort((a, b) => b.avgHours - a.avgHours);

    return {
      samples,
      overall: {
        avgHours: Number(overallAvg.toFixed(1)),
        breachRate: Number(overallBreach.toFixed(2)),
        reworkRate: Number(overallRework.toFixed(2)),
      },
      bottleneck,
      byRole,
    };
  }, [flows]);

  const scopeLabel = (f: ApprovalFlow) => {
    if (f.scopeType === "RFQ") return "RFQ";
    if (f.scopeType === "Marketplace") return `E-Commerce • ${f.marketplace}`;
    return f.module || "Module";
  };

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
                  <BadgeCheck className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">Approval Workflow Builder</div>
                  <div className="mt-1 text-xs text-slate-500">Rules, multi-level approvals, SLAs, delegation, load balancing, and templates.</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Pill label={`Flows: ${flows.length}`} tone="neutral" />
                    <Pill label={`Draft: ${diffCount ? "Changed" : "Clean"}`} tone={diffCount ? "warn" : "good"} />
                    <Pill label={`SLA alerts: ${flows.filter((f) => f.sla.breachAlertsEnabled).length}`} tone="info" />
                    <Pill label="Premium" tone="info" />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={() => setTemplateOpen(true)}>
                  <Sparkles className="h-4 w-4" /> Templates
                </Button>
                <Button variant="outline" onClick={() => setNewOpen(true)}>
                  <Plus className="h-4 w-4" /> New flow
                </Button>
                <Button variant="outline" onClick={revert} disabled={!diffCount}>
                  <X className="h-4 w-4" /> Revert
                </Button>
                <Button variant="outline" onClick={saveDraft}>
                  <Save className="h-4 w-4" /> Save
                </Button>
                <Button variant="primary" onClick={openPublish} disabled={!diffCount}>
                  <BadgeCheck className="h-4 w-4" /> Publish
                </Button>
              </div>
            </div>

            {/* Tabs */}
            <div className="mt-4 flex flex-wrap gap-2">
              {[{ id: "builder", label: "Builder" }, { id: "templates", label: "Templates" }, { id: "analytics", label: "Analytics" }].map((t) => (
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
          </div>

          {/* Body */}
          <div className="bg-slate-50 px-4 py-5 md:px-6">
            {tab === "builder" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                {/* Left: flow list */}
                <div className="lg:col-span-4 space-y-4">
                  <Section
                    title="Flows"
                    subtitle="Search and select a flow to edit."
                    right={<Pill label={`${filteredFlows.length}`} tone="neutral" />}
                  >
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-1">
                      <Field label="Search" value={query} onChange={setQuery} placeholder="MyLiveDealz, Finance, RFQ..." />
                      <Select
                        label="Scope"
                        value={scopeFilter}
                        onChange={(v) => setScopeFilter(v as any)}
                        options={["All", "Module", "Marketplace", "RFQ"]}
                      />
                      <Button variant="outline" onClick={() => { setQuery(""); setScopeFilter("All"); toast({ title: "Reset", message: "Filters reset.", kind: "info" }); }}>
                        <Settings2 className="h-4 w-4" /> Reset
                      </Button>
                    </div>

                    <div className="mt-4 space-y-2">
                      {filteredFlows.map((f) => {
                        const isSel = f.id === selectedId;
                        return (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => setSelectedId(f.id)}
                            className={cn(
                              "w-full rounded-3xl border p-4 text-left transition",
                              isSel ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white hover:bg-slate-50"
                            )}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <div className="truncate text-sm font-semibold text-slate-900">{f.name}</div>
                                  <Pill label={f.enabled ? "Enabled" : "Off"} tone={f.enabled ? "good" : "neutral"} />
                                </div>
                                <div className="mt-1 text-xs text-slate-500">{scopeLabel(f)} • {f.stages.length} stage(s)</div>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  <Pill label={f.defaults.policyTemplate} tone="neutral" />
                                  <Pill label={f.defaults.approvalFlowKind} tone="info" />
                                  {f.sla.breachAlertsEnabled ? <Pill label="SLA alerts" tone="warn" /> : <Pill label="No SLA" tone="neutral" />}
                                </div>
                              </div>
                              <ChevronRight className="mt-1 h-5 w-5 text-slate-400" />
                            </div>
                          </button>
                        );
                      })}
                      {!filteredFlows.length ? (
                        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center">
                          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-700">
                            <Layers className="h-6 w-6" />
                          </div>
                          <div className="mt-3 text-sm font-semibold text-slate-900">No flows</div>
                          <div className="mt-1 text-sm text-slate-600">Create a new flow or change filters.</div>
                        </div>
                      ) : null}
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <Button variant="outline" className="w-full" onClick={() => setNewOpen(true)}>
                        <Plus className="h-4 w-4" /> New flow
                      </Button>
                    </div>
                  </Section>

                  <Section title="Approver load" subtitle="Premium: preview load balancing inputs.">
                    <div className="space-y-2">
                      {approvers.map((a) => (
                        <div key={a.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-slate-900">{a.name}</div>
                            <div className="mt-0.5 text-xs text-slate-500">Role: {a.role}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Pill label={`Load: ${a.load}`} tone={a.load >= 6 ? "warn" : "neutral"} />
                            <button
                              type="button"
                              className={cn(
                                "relative h-7 w-12 rounded-full border transition",
                                a.ooo ? "border-amber-300 bg-amber-200" : "border-slate-200 bg-white"
                              )}
                              onClick={() => setApprovers((p) => p.map((x) => (x.id === a.id ? { ...x, ooo: !x.ooo } : x)))}
                              aria-label="Toggle out of office"
                            >
                              <span className={cn("absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition", a.ooo ? "left-[22px]" : "left-1")} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">Toggle OOO to test delegation handling in the simulator.</div>
                  </Section>
                </div>

                {/* Main editor */}
                <div className="lg:col-span-5 space-y-4">
                  {selectedFlow ? (
                    <>
                      <Section
                        title="Flow settings"
                        subtitle="Rule engine: if amount > X then approval required."
                        right={<Pill label={selectedFlow.scopeType} tone="info" />}
                      >
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <Field label="Flow name" value={selectedFlow.name} onChange={(v) => setSelectedFlowPatch((f) => ({ ...f, name: v }))} placeholder="Approval flow name" />
                          <div className="rounded-2xl border border-slate-200 bg-white p-3">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <div className="text-sm font-semibold text-slate-900">Enabled</div>
                                <div className="mt-1 text-xs text-slate-600">Enable at checkout</div>
                              </div>
                              <button
                                type="button"
                                className={cn(
                                  "relative h-7 w-12 rounded-full border transition",
                                  selectedFlow.enabled ? "border-emerald-300 bg-emerald-200" : "border-slate-200 bg-white"
                                )}
                                onClick={() => setSelectedFlowPatch((f) => ({ ...f, enabled: !f.enabled }))}
                                aria-label="Toggle enabled"
                              >
                                <span className={cn("absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition", selectedFlow.enabled ? "left-[22px]" : "left-1")} />
                              </button>
                            </div>
                          </div>

                          <Select
                            label="Policy template"
                            value={selectedFlow.defaults.policyTemplate}
                            onChange={(v) => setSelectedFlowPatch((f) => ({ ...f, defaults: { ...f.defaults, policyTemplate: v as PolicyTemplate } }))}
                            options={POLICY_TEMPLATES}
                            hint="Maps to Policy Builder"
                          />
                          <Select
                            label="Default approval flow kind"
                            value={selectedFlow.defaults.approvalFlowKind}
                            onChange={(v) => setSelectedFlowPatch((f) => ({ ...f, defaults: { ...f.defaults, approvalFlowKind: v as ApprovalFlowKind } }))}
                            options={APPROVAL_FLOW_KINDS}
                            hint="Classifies this flow"
                          />

                          <div className="md:col-span-2 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="text-sm font-semibold text-slate-900">Scope</div>
                                <div className="mt-1 text-xs text-slate-600">Different flows per module and per marketplace, plus RFQ.</div>
                              </div>
                              <Pill label={scopeLabel(selectedFlow)} tone="neutral" />
                            </div>
                            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                              <Select
                                label="Scope type"
                                value={selectedFlow.scopeType}
                                onChange={(v) => {
                                  const t = v as FlowScopeType;
                                  setSelectedFlowPatch((f) => {
                                    const next = deepClone(f);
                                    next.scopeType = t;
                                    if (t === "Module") {
                                      next.module = next.module || "Rides & Logistics";
                                      next.marketplace = undefined;
                                    }
                                    if (t === "Marketplace") {
                                      next.module = "E-Commerce";
                                      next.marketplace = next.marketplace || "MyLiveDealz";
                                    }
                                    if (t === "RFQ") {
                                      next.module = undefined;
                                      next.marketplace = undefined;
                                      next.rule.autoApprove.enabled = false;
                                      next.rule.requireApprovalOverUGX = 0;
                                      next.rule.requireAttachmentsOverUGX = 0;
                                      next.rule.requireCommentOverUGX = 0;
                                    }
                                    return next;
                                  });
                                }}
                                options={["Module", "Marketplace", "RFQ"]}
                              />
                              <Select
                                label="Module"
                                value={selectedFlow.scopeType === "Marketplace" ? "E-Commerce" : selectedFlow.module || "Rides & Logistics"}
                                onChange={(v) => setSelectedFlowPatch((f) => ({ ...f, module: v as ServiceModule }))}
                                options={SERVICE_MODULES}
                                disabled={selectedFlow.scopeType === "RFQ" || selectedFlow.scopeType === "Marketplace"}
                                hint={selectedFlow.scopeType === "Marketplace" ? "Fixed: E-Commerce" : ""}
                              />
                              <Select
                                label="Marketplace"
                                value={selectedFlow.marketplace || "MyLiveDealz"}
                                onChange={(v) => setSelectedFlowPatch((f) => ({ ...f, marketplace: v as Marketplace }))}
                                options={MARKETPLACES}
                                disabled={selectedFlow.scopeType !== "Marketplace"}
                                hint={selectedFlow.scopeType === "Marketplace" ? "E-Commerce only" : ""}
                              />
                              <div className="rounded-2xl border border-slate-200 bg-white p-3">
                                <div className="text-xs font-semibold text-slate-600">Industry tag</div>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  <Pill label={selectedFlow.meta.industryTemplate || "(none)"} tone="neutral" />
                                  <Pill label="Cloneable" tone="info" />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <Button variant="outline" onClick={() => setCloneOpen(true)}>
                            <Copy className="h-4 w-4" /> Clone
                          </Button>
                          <Button variant="danger" onClick={deleteFlow}>
                            <X className="h-4 w-4" /> Delete
                          </Button>
                        </div>
                      </Section>

                      <Section
                        title="Rule engine"
                        subtitle="Auto-approve under threshold (if eligible). Above threshold routes to multi-level approvals."
                        right={<Pill label="Core" tone="neutral" />}
                      >
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <Toggle
                            enabled={selectedFlow.rule.autoApprove.enabled}
                            onChange={(v) => setSelectedFlowPatch((f) => ({ ...f, rule: { ...f.rule, autoApprove: { ...f.rule.autoApprove, enabled: v } } }))}
                            label="Enable auto-approve"
                            description="Uses eligibility flag and threshold."
                          />
                          <Toggle
                            enabled={selectedFlow.rule.autoApprove.eligibleOnly}
                            onChange={(v) => setSelectedFlowPatch((f) => ({ ...f, rule: { ...f.rule, autoApprove: { ...f.rule.autoApprove, eligibleOnly: v } } }))}
                            label="Eligibility required"
                            description="Only auto-approve for eligible users."
                          />
                          <NumberField
                            label="Auto-approve threshold (UGX)"
                            value={selectedFlow.rule.autoApprove.thresholdUGX}
                            onChange={(v) => setSelectedFlowPatch((f) => ({ ...f, rule: { ...f.rule, autoApprove: { ...f.rule.autoApprove, thresholdUGX: v } } }))}
                            hint={`Preview: ${formatUGX(selectedFlow.rule.autoApprove.thresholdUGX)}`}
                            disabled={!selectedFlow.rule.autoApprove.enabled}
                          />
                          <NumberField
                            label="Approval required when amount is over (UGX)"
                            value={selectedFlow.rule.requireApprovalOverUGX}
                            onChange={(v) => setSelectedFlowPatch((f) => ({ ...f, rule: { ...f.rule, requireApprovalOverUGX: v } }))}
                            hint={`Rule: if amount > ${formatUGX(selectedFlow.rule.requireApprovalOverUGX)} then approvals`}
                          />

                          <NumberField
                            label="Require comment above (UGX)"
                            value={selectedFlow.rule.requireCommentOverUGX}
                            onChange={(v) => setSelectedFlowPatch((f) => ({ ...f, rule: { ...f.rule, requireCommentOverUGX: v } }))}
                            hint="Adds accountability"
                          />
                          <NumberField
                            label="Require attachments above (UGX)"
                            value={selectedFlow.rule.requireAttachmentsOverUGX}
                            onChange={(v) => setSelectedFlowPatch((f) => ({ ...f, rule: { ...f.rule, requireAttachmentsOverUGX: v } }))}
                            hint="Specs, invoices, PDFs"
                          />
                        </div>

                        <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700">
                          Effective rule:
                          <ul className="mt-2 space-y-1 text-xs text-slate-600">
                            <li>1) If amount ≤ auto-approve threshold and eligible, approve automatically</li>
                            <li>2) If amount > approval trigger, route to approval stages</li>
                            <li>3) Above comment/attachment thresholds, enforce requirements</li>
                          </ul>
                        </div>
                      </Section>

                      <Section
                        title="Approval stages"
                        subtitle="Multi-level approvals with escalation paths and delegation handling."
                        right={
                          <div className="flex flex-wrap items-center gap-2">
                            <Pill label={`${selectedFlow.stages.length} stages`} tone="neutral" />
                            <Button variant="outline" onClick={addStage}>
                              <Plus className="h-4 w-4" /> Add stage
                            </Button>
                          </div>
                        }
                      >
                        <div className="space-y-3">
                          {selectedFlow.stages.map((s, idx) => (
                            <div key={s.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <div className="text-sm font-semibold text-slate-900">{s.name}</div>
                                    <Pill label={`Min: ${formatUGX(s.minAmountUGX)}`} tone="neutral" />
                                    <Pill label={s.role} tone={stageRoleTone(s.role)} />
                                    <Pill label={`SLA: ${s.slaHours}h`} tone={s.slaHours <= 4 ? "warn" : "neutral"} />
                                  </div>
                                  <div className="mt-1 text-xs text-slate-500">Assignment: {s.assignment}{s.assignment === "Specific user" && s.specificUser ? ` (${s.specificUser})` : ""}</div>
                                  <div className="mt-1 text-xs text-slate-500">Escalation: {s.escalation.enabled ? `${s.escalation.target} after ${s.escalation.afterHours}h` : "Off"}</div>
                                  <div className="mt-1 text-xs text-slate-500">Delegation: {s.delegation.enabled ? `${s.delegation.mode}` : "Off"}</div>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => openStageEditor(s.id)}>
                                    <Settings2 className="h-4 w-4" /> Edit
                                  </Button>
                                  <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => moveStage(s.id, -1)} disabled={idx === 0}>
                                    <ChevronUp className="h-4 w-4" />
                                  </Button>
                                  <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => moveStage(s.id, 1)} disabled={idx === selectedFlow.stages.length - 1}>
                                    <ChevronDown className="h-4 w-4" />
                                  </Button>
                                  <Button variant="danger" className="px-3 py-2 text-xs" onClick={() => deleteStage(s.id)}>
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                          {!selectedFlow.stages.length ? (
                            <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center">
                              <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-700">
                                <Layers className="h-6 w-6" />
                              </div>
                              <div className="mt-3 text-sm font-semibold text-slate-900">No stages</div>
                              <div className="mt-1 text-sm text-slate-600">Add a stage to enforce approvals.</div>
                            </div>
                          ) : null}
                        </div>

                        <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                          Premium: load balancing strategies distribute approvals and reduce bottlenecks.
                        </div>
                      </Section>

                      <Section
                        title="SLA alerts and breach handling"
                        subtitle="Premium: SLA timers, reminders, and breach alerts."
                        right={<Pill label={selectedFlow.sla.breachAlertsEnabled ? "Enabled" : "Off"} tone={selectedFlow.sla.breachAlertsEnabled ? "warn" : "neutral"} />}
                      >
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <Toggle
                            enabled={selectedFlow.sla.breachAlertsEnabled}
                            onChange={(v) => setSelectedFlowPatch((f) => ({ ...f, sla: { ...f.sla, breachAlertsEnabled: v } }))}
                            label="SLA breach alerts"
                            description="Notify configured channels when SLA is breached."
                          />
                          <NumberField
                            label="Reminder before (minutes)"
                            value={selectedFlow.sla.remindBeforeMinutes}
                            onChange={(v) => setSelectedFlowPatch((f) => ({ ...f, sla: { ...f.sla, remindBeforeMinutes: v } }))}
                            hint={`Example: ${ms(selectedFlow.sla.remindBeforeMinutes)}`}
                          />
                        </div>

                        <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="text-sm font-semibold text-slate-900">Notify channels</div>
                          <div className="mt-1 text-xs text-slate-500">Email, WhatsApp, WeChat, SMS.</div>
                          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                            {CHANNELS.map((c) => {
                              const on = selectedFlow.sla.breachNotifyChannels.includes(c);
                              return (
                                <button
                                  key={c}
                                  type="button"
                                  className={cn(
                                    "flex items-center justify-between gap-2 rounded-2xl border px-3 py-2 text-sm font-semibold",
                                    on ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white hover:bg-slate-50"
                                  )}
                                  onClick={() => {
                                    setSelectedFlowPatch((f) => {
                                      const next = deepClone(f);
                                      const set = new Set(next.sla.breachNotifyChannels);
                                      if (set.has(c)) set.delete(c);
                                      else set.add(c);
                                      next.sla.breachNotifyChannels = Array.from(set) as Channel[];
                                      return next;
                                    });
                                  }}
                                  disabled={!selectedFlow.sla.breachAlertsEnabled}
                                >
                                  <span className="flex items-center gap-2">
                                    <span className={cn("text-slate-600", on && "text-emerald-700")}>{channelIcon(c)}</span>
                                    {c}
                                  </span>
                                  <Pill label={on ? "On" : "Off"} tone={on ? "good" : "neutral"} />
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </Section>
                    </>
                  ) : (
                    <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center">
                      <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-700">
                        <BadgeCheck className="h-6 w-6" />
                      </div>
                      <div className="mt-3 text-sm font-semibold text-slate-900">Select a flow</div>
                      <div className="mt-1 text-sm text-slate-600">Choose a flow on the left to edit rules and stages.</div>
                    </div>
                  )}
                </div>

                {/* Right: Simulator */}
                <div className="lg:col-span-3 space-y-4">
                  <Section
                    title="Simulator"
                    subtitle="Premium: test scenarios and preview decisions."
                    right={decision ? <Pill label={decision.status} tone={decision.status === "Auto-approved" ? "good" : decision.status === "Blocked" ? "bad" : "warn"} /> : null}
                  >
                    <div className="grid grid-cols-1 gap-4">
                      <NumberField
                        label="Amount (UGX)"
                        value={scenario.amountUGX}
                        onChange={(v) => setScenario((p) => ({ ...p, amountUGX: v }))}
                        hint={`Preview: ${formatUGX(scenario.amountUGX)}`}
                      />
                      <Select
                        label="Service Module"
                        value={scenario.module}
                        onChange={(v) => setScenario((p) => ({ ...p, module: v as ServiceModule }))}
                        options={SERVICE_MODULES}
                        disabled={!!selectedFlow && (selectedFlow.scopeType === "Marketplace" || selectedFlow.scopeType === "RFQ")}
                        hint={selectedFlow?.scopeType === "Marketplace" ? "Driven by flow" : selectedFlow?.scopeType === "RFQ" ? "Driven by RFQ" : ""}
                      />
                      <Select
                        label="Marketplace"
                        value={scenario.marketplace === "-" ? "MyLiveDealz" : (scenario.marketplace as string)}
                        onChange={(v) => setScenario((p) => ({ ...p, marketplace: v as Marketplace }))}
                        options={MARKETPLACES}
                        disabled={scenario.module !== "E-Commerce" || selectedFlow?.scopeType === "RFQ"}
                        hint={scenario.module !== "E-Commerce" ? "Applies to E-Commerce only" : ""}
                      />

                      <Toggle
                        enabled={scenario.userAutoApprovalEligible}
                        onChange={(v) => setScenario((p) => ({ ...p, userAutoApprovalEligible: v }))}
                        label="User is auto-approval eligible"
                        description="Set by org admin when creating the user."
                      />

                      <Toggle
                        enabled={scenario.attachmentsProvided}
                        onChange={(v) => setScenario((p) => ({ ...p, attachmentsProvided: v }))}
                        label="Attachments provided"
                        description="Required above configured threshold."
                      />

                      <Toggle
                        enabled={scenario.commentProvided}
                        onChange={(v) => setScenario((p) => ({ ...p, commentProvided: v }))}
                        label="Comment provided"
                        description="Required above configured threshold."
                      />

                      <NumberField
                        label="Elapsed time (hours)"
                        value={scenario.elapsedHours}
                        onChange={(v) => setScenario((p) => ({ ...p, elapsedHours: v }))}
                        hint="Used to show SLA breach previews"
                      />

                      <div className="rounded-3xl border border-slate-200 bg-white p-4">
                        <div className="text-sm font-semibold text-slate-900">Out-of-office simulation</div>
                        <div className="mt-1 text-xs text-slate-500">Delegation handling routes tasks if approver is OOO.</div>
                        <div className="mt-3 grid grid-cols-1 gap-2">
                          {(["Manager", "Procurement", "Finance", "CFO"] as StageRole[]).map((r) => {
                            const on = scenario.oooRoles.includes(r);
                            return (
                              <button
                                key={r}
                                type="button"
                                className={cn(
                                  "flex items-center justify-between rounded-2xl border px-3 py-2 text-sm font-semibold",
                                  on ? "border-amber-300 bg-amber-50" : "border-slate-200 bg-white hover:bg-slate-50"
                                )}
                                onClick={() => {
                                  setScenario((p) => {
                                    const set = new Set(p.oooRoles);
                                    if (set.has(r)) set.delete(r);
                                    else set.add(r);
                                    return { ...p, oooRoles: Array.from(set) as StageRole[] };
                                  });
                                }}
                              >
                                <span>{r}</span>
                                <Pill label={on ? "OOO" : "OK"} tone={on ? "warn" : "good"} />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {decision ? (
                      <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4">
                        <div className="text-sm font-semibold text-slate-900">Decision</div>
                        <div className="mt-2 text-sm text-slate-700">{decision.status}</div>
                        {decision.reasons.length ? (
                          <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700">
                            <div className="font-semibold">Reasons</div>
                            <ul className="mt-2 space-y-1 text-xs text-slate-600">
                              {decision.reasons.map((r, i) => (
                                <li key={i}>• {r}</li>
                              ))}
                            </ul>
                          </div>
                        ) : null}

                        {decision.stages.length ? (
                          <div className="mt-3">
                            <div className="text-xs font-semibold text-slate-600">Approval path</div>
                            <div className="mt-2 space-y-2">
                              {decision.stages.map((s) => (
                                <div key={s.stage.id} className="rounded-2xl border border-slate-200 bg-white p-3">
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <div className="text-sm font-semibold text-slate-900">{s.stage.name}</div>
                                      <div className="mt-1 text-xs text-slate-500">Role: {s.stage.role} • Assigned: {s.assignedTo}</div>
                                      <div className="mt-1 text-xs text-slate-500">SLA: {s.stage.slaHours}h • Due in: {Math.round(s.slaDueInHours * 10) / 10}h</div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                      <Pill label={s.breached ? "Breached" : "OK"} tone={s.breached ? "bad" : "good"} />
                                      <Pill label={`Escalate: ${s.escalationTo}`} tone="neutral" />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {selectedFlow?.sla.breachAlertsEnabled ? (
                              <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                                SLA breach alerts enabled. Channels: {selectedFlow.sla.breachNotifyChannels.join(", ")}
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </Section>

                  <Section title="Approval templates" subtitle="Premium: industry templates and cloning.">
                    <div className="grid grid-cols-1 gap-2">
                      {([
                        { id: "Corporate", desc: "Balanced enterprise approvals." },
                        { id: "Hospital", desc: "Strict compliance, faster SLAs." },
                        { id: "Tour Company", desc: "Travel heavy defaults." },
                      ] as const).map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          className="rounded-3xl border border-slate-200 bg-white p-4 text-left hover:bg-slate-50"
                          onClick={() => {
                            setTemplateIndustry(t.id);
                            setTemplateMode("append");
                            setTemplateOpen(true);
                          }}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-slate-900">{t.id}</div>
                              <div className="mt-1 text-xs text-slate-500">{t.desc}</div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-slate-400" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </Section>
                </div>
              </div>
            ) : null}

            {tab === "templates" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <Section title="Template library" subtitle="Premium: apply a template set and then customize.">
                  <div className="space-y-3">
                    <Select
                      label="Industry"
                      value={templateIndustry}
                      onChange={(v) => setTemplateIndustry(v as any)}
                      options={["Corporate", "Hospital", "Tour Company"]}
                    />
                    <Select
                      label="Apply mode"
                      value={templateMode}
                      onChange={(v) => setTemplateMode(v as any)}
                      options={["append", "replace"]}
                      hint="Append adds new flows; replace overwrites all."
                    />
                    <Button variant="primary" className="w-full" onClick={() => setTemplateOpen(true)}>
                      <Sparkles className="h-4 w-4" /> Apply template
                    </Button>
                    <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                      Templates include per-module and per-marketplace flows, plus RFQ.
                    </div>
                  </div>
                </Section>

                <div className="lg:col-span-2 space-y-4">
                  <Section title="Preview" subtitle="What gets added by the selected template.">
                    {templatePack(templateIndustry).map((f) => (
                      <div key={f.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-slate-900">{f.name}</div>
                            <div className="mt-1 text-xs text-slate-500">Scope: {scopeLabel(f)} • Stages: {f.stages.length}</div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <Pill label={f.defaults.policyTemplate} tone="neutral" />
                              <Pill label={f.defaults.approvalFlowKind} tone="info" />
                              <Pill label={`SLA alerts: ${f.sla.breachAlertsEnabled ? "On" : "Off"}`} tone={f.sla.breachAlertsEnabled ? "warn" : "neutral"} />
                            </div>
                          </div>
                          <Pill label={templateIndustry} tone="info" />
                        </div>
                      </div>
                    ))}
                  </Section>

                  <Section title="Cloning" subtitle="Premium: clone a flow to create a variant for a different module or marketplace.">
                    <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-700">
                      Recommended use:
                      <ul className="mt-2 space-y-1 text-xs text-slate-600">
                        <li>1) Clone “E-Commerce default” into “EVmart override”</li>
                        <li>2) Tighten thresholds and add extra stage (Finance or CFO)</li>
                        <li>3) Publish and preview impact</li>
                      </ul>
                    </div>
                    <Button variant="outline" className="mt-3" onClick={() => setCloneOpen(true)} disabled={!selectedFlow}>
                      <Copy className="h-4 w-4" /> Clone selected flow
                    </Button>
                  </Section>
                </div>
              </div>
            ) : null}

            {tab === "analytics" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <Section title="Approval analytics" subtitle="Premium: cycle time, bottlenecks, and rework rate.">
                  <div className="grid grid-cols-1 gap-3">
                    <Metric title="Average cycle time" value={`${analytics.overall.avgHours}h`} icon={<TrendingUp className="h-5 w-5" />} tone="neutral" />
                    <Metric title="SLA breach rate" value={`${Math.round(analytics.overall.breachRate * 100)}%`} icon={<Timer className="h-5 w-5" />} tone={analytics.overall.breachRate > 0.25 ? "warn" : "good"} />
                    <Metric title="Rework rate" value={`${Math.round(analytics.overall.reworkRate * 100)}%`} icon={<AlertTriangle className="h-5 w-5" />} tone={analytics.overall.reworkRate > 0.12 ? "warn" : "neutral"} />
                  </div>

                  <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700">
                    Bottleneck stage:
                    <div className="mt-2 font-semibold text-slate-900">{analytics.bottleneck?.stageName}</div>
                    <div className="mt-1 text-xs text-slate-600">Role: {analytics.bottleneck?.role} • Avg: {analytics.bottleneck?.avgHours}h • SLA: {analytics.bottleneck?.slaHours}h</div>
                  </div>

                  <div className="mt-4 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                    Premium: analytics should use real historical approvals. This demo uses synthetic data.
                  </div>
                </Section>

                <div className="lg:col-span-2 space-y-4">
                  <Section title="Bottlenecks by role" subtitle="Average stage time by approver role.">
                    <div className="space-y-2">
                      {analytics.byRole.slice(0, 10).map((r) => (
                        <div key={r.role} className="rounded-2xl border border-slate-200 bg-white p-3">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-slate-900">{r.role}</div>
                              <div className="mt-1 text-xs text-slate-500">Stages: {r.count}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Pill label={`Avg ${r.avgHours}h`} tone={r.avgHours >= 8 ? "warn" : "neutral"} />
                              <div className="h-2 w-40 overflow-hidden rounded-full bg-slate-100">
                                <div className="h-full rounded-full" style={{ width: `${clamp((r.avgHours / 12) * 100, 0, 100)}%`, background: EVZ.green }} />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Section>

                  <Section title="Flow health" subtitle="Identify risky flows and tighten defaults.">
                    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                      <table className="min-w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs text-slate-600">
                          <tr>
                            <th className="px-4 py-3 font-semibold">Flow</th>
                            <th className="px-4 py-3 font-semibold">Scope</th>
                            <th className="px-4 py-3 font-semibold">Stages</th>
                            <th className="px-4 py-3 font-semibold">Auto-approve</th>
                            <th className="px-4 py-3 font-semibold">SLA alerts</th>
                          </tr>
                        </thead>
                        <tbody>
                          {flows.map((f) => (
                            <tr key={f.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                              <td className="px-4 py-3 font-semibold text-slate-900">{f.name}</td>
                              <td className="px-4 py-3 text-slate-700">{scopeLabel(f)}</td>
                              <td className="px-4 py-3"><Pill label={`${f.stages.length}`} tone="neutral" /></td>
                              <td className="px-4 py-3"><Pill label={f.rule.autoApprove.enabled ? "On" : "Off"} tone={f.rule.autoApprove.enabled ? "good" : "neutral"} /></td>
                              <td className="px-4 py-3"><Pill label={f.sla.breachAlertsEnabled ? "On" : "Off"} tone={f.sla.breachAlertsEnabled ? "warn" : "neutral"} /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                      Use templates and cloning to improve bottlenecks and reduce rework.
                    </div>
                  </Section>
                </div>
              </div>
            ) : null}
          </div>

          <footer className="border-t border-slate-200 bg-white/60 py-6">
            <div className="mx-auto max-w-[1400px] px-4 text-xs text-slate-500 md:px-6">
              J Approval Workflow Builder v2: rule engine, multi-level approvals, per-module and per-marketplace flows, auto-approve eligibility, attachments/comments thresholds, delegation, SLA alerts, load balancing, analytics, templates and cloning.
            </div>
          </footer>
        </div>
      </div>

      {/* Stage editor drawer */}
      <Drawer
        open={drawerOpen}
        title={stageBeingEdited ? `Edit stage: ${stageBeingEdited.name}` : "Edit stage"}
        subtitle={stageBeingEdited ? `${stageBeingEdited.role} • Min ${formatUGX(stageBeingEdited.minAmountUGX)} • SLA ${stageBeingEdited.slaHours}h` : ""}
        onClose={() => setDrawerOpen(false)}
        footer={
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs text-slate-600">Changes are draft-only until published.</div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setDrawerOpen(false)}>Close</Button>
              <Button variant="primary" onClick={saveDraft}><Save className="h-4 w-4" /> Save</Button>
            </div>
          </div>
        }
      >
        {selectedFlow && stageBeingEdited ? (
          <div className="space-y-4">
            <Field
              label="Stage name"
              value={stageBeingEdited.name}
              onChange={(v) => setSelectedFlowPatch((f) => ({
                ...f,
                stages: f.stages.map((s) => (s.id === stageBeingEdited.id ? { ...s, name: v } : s)),
              }))}
              placeholder="Manager approval"
            />

            <NumberField
              label="Minimum amount (UGX)"
              value={stageBeingEdited.minAmountUGX}
              onChange={(v) => setSelectedFlowPatch((f) => ({
                ...f,
                stages: f.stages.map((s) => (s.id === stageBeingEdited.id ? { ...s, minAmountUGX: v } : s)),
              }))}
              hint={`Stage applies when amount ≥ ${formatUGX(stageBeingEdited.minAmountUGX)}`}
            />

            <Select
              label="Approver role"
              value={stageBeingEdited.role}
              onChange={(v) => setSelectedFlowPatch((f) => ({
                ...f,
                stages: f.stages.map((s) => (s.id === stageBeingEdited.id ? { ...s, role: v as StageRole } : s)),
              }))}
              options={ROLE_OPTIONS}
              hint="Role pool"
            />

            <Select
              label="Assignment strategy"
              value={stageBeingEdited.assignment}
              onChange={(v) => setSelectedFlowPatch((f) => ({
                ...f,
                stages: f.stages.map((s) => (s.id === stageBeingEdited.id ? { ...s, assignment: v as AssignmentStrategy } : s)),
              }))}
              options={STRATEGIES}
              hint="Premium load balancing"
            />

            <Field
              label="Specific user"
              value={stageBeingEdited.specificUser || ""}
              onChange={(v) => setSelectedFlowPatch((f) => ({
                ...f,
                stages: f.stages.map((s) => (s.id === stageBeingEdited.id ? { ...s, specificUser: v } : s)),
              }))}
              placeholder="Name"
              disabled={stageBeingEdited.assignment !== "Specific user"}
              hint="Used only when strategy is Specific user"
            />

            <NumberField
              label="SLA (hours)"
              value={stageBeingEdited.slaHours}
              onChange={(v) => setSelectedFlowPatch((f) => ({
                ...f,
                stages: f.stages.map((s) => (s.id === stageBeingEdited.id ? { ...s, slaHours: v } : s)),
              }))}
              hint="Premium: SLA timers and breach alerts"
            />

            <Section title="Escalation" subtitle="Escalate when SLA is breached.">
              <Toggle
                enabled={stageBeingEdited.escalation.enabled}
                onChange={(v) => setSelectedFlowPatch((f) => ({
                  ...f,
                  stages: f.stages.map((s) => (s.id === stageBeingEdited.id ? { ...s, escalation: { ...s.escalation, enabled: v } } : s)),
                }))}
                label="Enable escalation"
                description="Escalates after the configured time"
              />
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                <NumberField
                  label="Escalate after (hours)"
                  value={stageBeingEdited.escalation.afterHours}
                  onChange={(v) => setSelectedFlowPatch((f) => ({
                    ...f,
                    stages: f.stages.map((s) => (s.id === stageBeingEdited.id ? { ...s, escalation: { ...s.escalation, afterHours: v } } : s)),
                  }))}
                  disabled={!stageBeingEdited.escalation.enabled}
                />
                <Select
                  label="Escalation target"
                  value={stageBeingEdited.escalation.target}
                  onChange={(v) => setSelectedFlowPatch((f) => ({
                    ...f,
                    stages: f.stages.map((s) => (s.id === stageBeingEdited.id ? { ...s, escalation: { ...s.escalation, target: v as EscalationTarget } } : s)),
                  }))}
                  options={ESC_TARGETS}
                  disabled={!stageBeingEdited.escalation.enabled}
                />
              </div>
            </Section>

            <Section title="Delegation" subtitle="Out-of-office routing.">
              <Toggle
                enabled={stageBeingEdited.delegation.enabled}
                onChange={(v) => setSelectedFlowPatch((f) => ({
                  ...f,
                  stages: f.stages.map((s) => (s.id === stageBeingEdited.id ? { ...s, delegation: { ...s.delegation, enabled: v } } : s)),
                }))}
                label="Enable delegation"
                description="Routes tasks when approver is OOO"
              />

              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                <Select
                  label="Delegation mode"
                  value={stageBeingEdited.delegation.mode}
                  onChange={(v) => setSelectedFlowPatch((f) => ({
                    ...f,
                    stages: f.stages.map((s) => (s.id === stageBeingEdited.id ? { ...s, delegation: { ...s.delegation, mode: v as DelegationMode } } : s)),
                  }))}
                  options={DELEGATION_MODES}
                  disabled={!stageBeingEdited.delegation.enabled}
                />

                <Select
                  label="Delegate role"
                  value={stageBeingEdited.delegation.delegateRole || stageBeingEdited.role}
                  onChange={(v) => setSelectedFlowPatch((f) => ({
                    ...f,
                    stages: f.stages.map((s) => (s.id === stageBeingEdited.id ? { ...s, delegation: { ...s.delegation, delegateRole: v as StageRole } } : s)),
                  }))}
                  options={ROLE_OPTIONS}
                  disabled={!stageBeingEdited.delegation.enabled || stageBeingEdited.delegation.mode !== "Role pool"}
                />

                <Field
                  label="Delegate user"
                  value={stageBeingEdited.delegation.delegateUser || ""}
                  onChange={(v) => setSelectedFlowPatch((f) => ({
                    ...f,
                    stages: f.stages.map((s) => (s.id === stageBeingEdited.id ? { ...s, delegation: { ...s.delegation, delegateUser: v } } : s)),
                  }))}
                  placeholder="Name"
                  disabled={!stageBeingEdited.delegation.enabled || stageBeingEdited.delegation.mode !== "Delegate user"}
                />
              </div>

              <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                Delegation behavior is previewed in the Simulator panel.
              </div>
            </Section>
          </div>
        ) : null}
      </Drawer>

      {/* New flow modal */}
      <Modal
        open={newOpen}
        title="New approval flow"
        subtitle="Create a per-module, per-marketplace, or RFQ flow."
        onClose={() => setNewOpen(false)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setNewOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={newFlow}>
              <Plus className="h-4 w-4" /> Create
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Name" value={newName} onChange={setNewName} placeholder="New flow" />
          <Select label="Scope type" value={newKind} onChange={(v) => setNewKind(v as FlowScopeType)} options={["Module", "Marketplace", "RFQ"]} />
          <Select label="Module" value={newModule} onChange={(v) => setNewModule(v as ServiceModule)} options={SERVICE_MODULES} disabled={newKind !== "Module"} />
          <Select label="Marketplace" value={newMarketplace} onChange={(v) => setNewMarketplace(v as Marketplace)} options={MARKETPLACES} disabled={newKind !== "Marketplace"} />
          <div className="md:col-span-2 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
            Marketplace flows are always under E-Commerce.
          </div>
        </div>
      </Modal>

      {/* Clone modal */}
      <Modal
        open={cloneOpen}
        title="Clone flow"
        subtitle="Premium: clone and then tweak thresholds, stages, or scope."
        onClose={() => setCloneOpen(false)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setCloneOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={cloneFlow} disabled={!selectedFlow}>
              <Copy className="h-4 w-4" /> Clone
            </Button>
          </div>
        }
      >
        {selectedFlow ? (
          <div className="space-y-3">
            <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-700">
              Selected: <span className="font-semibold text-slate-900">{selectedFlow.name}</span>
              <div className="mt-1 text-slate-600">Scope: {scopeLabel(selectedFlow)} • Stages: {selectedFlow.stages.length}</div>
            </div>
            <div className="rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
              Cloning is best for marketplace overrides and custom high-value approval paths.
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Template modal */}
      <Modal
        open={templateOpen}
        title="Apply template"
        subtitle="Premium: industry templates with cloning support."
        onClose={() => setTemplateOpen(false)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setTemplateOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={applyTemplate}>
              <Sparkles className="h-4 w-4" /> Apply
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Select label="Industry" value={templateIndustry} onChange={(v) => setTemplateIndustry(v as any)} options={["Corporate", "Hospital", "Tour Company"]} />
          <Select label="Apply mode" value={templateMode} onChange={(v) => setTemplateMode(v as any)} options={["append", "replace"]} hint="Append adds; replace overwrites." />
        </div>
        <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
          Templates generate flows per service module, marketplaces under E-Commerce, and RFQ.
        </div>
      </Modal>

      {/* Publish modal */}
      <Modal
        open={publishOpen}
        title="Publish approval workflows"
        subtitle="Provide a reason. This would be audit logged in production."
        onClose={() => setPublishOpen(false)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setPublishOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={publish} disabled={!publishAck || publishReason.trim().length < 8}>
              <BadgeCheck className="h-4 w-4" /> Publish
            </Button>
          </div>
        }
      >
        <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-700">Draft contains changes compared to published configuration.</div>
        <div className="mt-4">
          <div className="text-xs font-semibold text-slate-600">Reason</div>
          <textarea
            value={publishReason}
            onChange={(e) => setPublishReason(e.target.value)}
            placeholder="Example: enable stricter MyLiveDealz approvals; add CFO stage for high-value purchases; keep pilot rollout"
            rows={4}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-emerald-100"
          />
          <label className="mt-3 flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3">
            <input type="checkbox" checked={publishAck} onChange={(e) => setPublishAck(e.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-300" />
            <div className="text-sm font-semibold text-slate-800">I confirm this change is authorized and should be logged.</div>
          </label>
          <div className="mt-2 text-xs text-slate-500">Minimum reason length: 8 characters.</div>
        </div>
      </Modal>
    </div>
  );

  function Metric({ title, value, icon, tone }: { title: string; value: string; icon: React.ReactNode; tone: any }) {
    const t = tone === "bad" ? "bg-rose-50 text-rose-700" : tone === "warn" ? "bg-amber-50 text-amber-800" : tone === "good" ? "bg-emerald-50 text-emerald-700" : "bg-slate-50 text-slate-700";
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-semibold text-slate-500">{title}</div>
            <div className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{value}</div>
          </div>
          <div className={cn("grid h-10 w-10 place-items-center rounded-2xl", t)}>{icon}</div>
        </div>
      </div>
    );
  }
}
