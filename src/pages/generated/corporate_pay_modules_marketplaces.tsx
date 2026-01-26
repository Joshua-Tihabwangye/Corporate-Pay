import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BadgeCheck,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Download,
  FileText,
  Layers,
  Lock,
  Plus,
  Save,
  Shield,
  Sparkles,
  Store,
  Users,
  X,
  MoreVertical,
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

type Risk = "Low" | "Medium" | "High";

type PolicyTemplate =
  | "Org default"
  | "Conservative"
  | "Balanced"
  | "Flexible"
  | "Strict compliance";

type ApprovalFlow =
  | "Org default"
  | "Auto under threshold"
  | "Manager approval"
  | "Finance approval"
  | "CFO approval"
  | "Multi-level escalation";

type Group = "Operations" | "Sales" | "Finance" | "Admin" | "Procurement";

type RolloutStage = "Pilot" | "All";

type ModuleCfg = {
  enabled: boolean;
  risk: Risk;
  policy: PolicyTemplate;
  approval: ApprovalFlow;
};

type MarketplaceCfg = {
  enabled: boolean;
  inheritFromModule: boolean;
  policy: PolicyTemplate;
  approval: ApprovalFlow;
};

type RolloutCfg = {
  stage: RolloutStage;
  pilotGroups: Group[];
  plannedGoAllDate: string;
  notes: string;
};

type DraftCfg = {
  modules: Record<ServiceModule, ModuleCfg>;
  marketplaces: Record<Marketplace, MarketplaceCfg>;
  labels: {
    otherModuleLabel: string;
    otherMarketplaceLabel: string;
  };
  rollout: RolloutCfg;
};

type UserRow = {
  id: string;
  name: string;
  group: Group;
  title: string;
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

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
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
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1", map[tone])}>
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
      className={cn(base, variants[variant], disabled && "cursor-not-allowed opacity-60", className)}
    >
      {children}
    </button>
  );
}

function TogglePill({
  enabled,
  onChange,
  label,
  disabled,
}: {
  enabled: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => !disabled && onChange(!enabled)}
      className={cn(
        "flex items-center justify-between gap-3 rounded-2xl border px-3 py-2 text-left text-sm font-semibold transition",
        enabled ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white hover:bg-slate-50",
        disabled && "opacity-60 cursor-not-allowed"
      )}
    >
      <span>{label}</span>
      <span className={cn("relative h-6 w-10 rounded-full border transition", enabled ? "border-emerald-300 bg-emerald-200" : "border-slate-200 bg-white")}>
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition",
            enabled ? "left-[18px]" : "left-1"
          )}
        />
      </span>
    </button>
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

function Field({
  label,
  value,
  onChange,
  placeholder,
  hint,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
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
  const [isOpen, setIsOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
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
  maxW = "920px",
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
              <div className="flex items-center gap-2">
                {actions && <ActionMenu actions={actions} />}
                <button className="rounded-2xl p-2 text-slate-600 hover:bg-slate-100" onClick={onClose} aria-label="Close">
                  <X className="h-5 w-5" />
                </button>
              </div>
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
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.18 }}
            className={cn(
              "fixed z-50 flex flex-col overflow-hidden border border-slate-200 bg-white shadow-[0_30px_90px_rgba(2,8,23,0.22)]",
              "left-2 right-2 bottom-2 top-[14vh] rounded-[28px]",
              "lg:left-auto lg:right-4 lg:top-4 lg:bottom-4 lg:w-[560px]"
            )}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4 shrink-0">
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
            <div className="flex-1 min-h-0 overflow-auto px-5 py-4">{children}</div>
            {footer ? <div className="border-t border-slate-200 px-5 py-4 shrink-0 bg-white">{footer}</div> : null}
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

function riskScore(r: Risk) {
  return r === "High" ? 90 : r === "Medium" ? 55 : 20;
}

function sumScore(items: Risk[]) {
  const score = items.reduce((a, r) => a + riskScore(r), 0);
  const avg = score / Math.max(1, items.length);
  const label: Risk = avg >= 70 ? "High" : avg >= 40 ? "Medium" : "Low";
  return { avg, label };
}

function cmpSet(a: string[], b: string[]) {
  const as = [...a].sort().join("|");
  const bs = [...b].sort().join("|");
  return as === bs;
}

function defaultConfig(): DraftCfg {
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

  const defaultRisk: Record<ServiceModule, Risk> = {
    "E-Commerce": "Medium",
    "EVs & Charging": "Medium",
    "Rides & Logistics": "Medium",
    "School & E-Learning": "Medium",
    "Medical & Health Care": "High",
    "Travel & Tourism": "Medium",
    "Green Investments": "High",
    "FaithHub": "Medium",
    "Virtual Workspace": "Low",
    "Finance & Payments": "High",
    "Other Service Module": "Medium",
  };

  const modules: Record<ServiceModule, ModuleCfg> = {} as any;
  SERVICE_MODULES.forEach((m) => {
    modules[m] = {
      enabled: m !== "Other Service Module" && m !== "Green Investments" ? true : false,
      risk: defaultRisk[m],
      policy: m === "Finance & Payments" || m === "Medical & Health Care" ? "Strict compliance" : "Balanced",
      approval: m === "Finance & Payments" ? "Finance approval" : m === "Medical & Health Care" ? "Manager approval" : "Auto under threshold",
    };
  });

  const marketplaces: Record<Marketplace, MarketplaceCfg> = {} as any;
  MARKETPLACES.forEach((m) => {
    marketplaces[m] = {
      enabled:
        m === "MyLiveDealz" ||
        m === "EVmart" ||
        m === "ServiceMart" ||
        m === "GadgetMart" ||
        m === "ExpressMart" ||
        m === "Other Marketplace"
          ? true
          : false,
      inheritFromModule: true,
      policy: "Org default",
      approval: "Org default",
    };
  });

  return {
    modules,
    marketplaces,
    labels: {
      otherModuleLabel: "Other Service Module",
      otherMarketplaceLabel: "Other Marketplace",
    },
    rollout: {
      stage: "Pilot",
      pilotGroups: ["Operations", "Finance"],
      plannedGoAllDate: "2026-01-14",
      notes: "Pilot with Operations and Finance, then expand to all groups.",
    },
  };
}

export default function CorporatePayModulesMarketplacesEnablementV2() {
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

  const GROUPS: Array<{ id: Group; users: number }> = [
    { id: "Operations", users: 34 },
    { id: "Sales", users: 22 },
    { id: "Finance", users: 10 },
    { id: "Admin", users: 8 },
    { id: "Procurement", users: 6 },
  ];

  const USERS: UserRow[] = [
    { id: "U-1001", name: "Mary N.", group: "Operations", title: "Operations Manager" },
    { id: "U-1002", name: "Finance Desk", group: "Finance", title: "Accountant" },
    { id: "U-1003", name: "John S.", group: "Sales", title: "Sales Executive" },
    { id: "U-1004", name: "Admin Team", group: "Admin", title: "Org Admin" },
    { id: "U-1005", name: "Procurement Desk", group: "Procurement", title: "Approver" },
    { id: "U-1006", name: "Irene K.", group: "Operations", title: "Travel Coordinator" },
    { id: "U-1007", name: "Samuel A.", group: "Sales", title: "Manager" },
    { id: "U-1008", name: "Daisy O.", group: "Finance", title: "Finance Officer" },
  ];

  const POLICY_TEMPLATES: PolicyTemplate[] = [
    "Org default",
    "Conservative",
    "Balanced",
    "Flexible",
    "Strict compliance",
  ];

  const APPROVAL_FLOWS: ApprovalFlow[] = [
    "Org default",
    "Auto under threshold",
    "Manager approval",
    "Finance approval",
    "CFO approval",
    "Multi-level escalation",
  ];

  const [toasts, setToasts] = useState<Array<{ id: string; title: string; message?: string; kind: string }>>([]);
  const toast = (t: { title: string; message?: string; kind: string }) => {
    const id = uid("toast");
    setToasts((p) => [{ id, ...t }, ...p].slice(0, 4));
    window.setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 3200);
  };

  const [tab, setTab] = useState<"enablement" | "defaults" | "rollout" | "impact">("enablement");

  const [draft, setDraft] = useState<DraftCfg>(() => defaultConfig());
  const [published, setPublished] = useState<DraftCfg>(() => deepClone(defaultConfig()));

  const [selected, setSelected] = useState<{ kind: "module" | "marketplace"; key: string } | null>({ kind: "module", key: "E-Commerce" });

  const [publishOpen, setPublishOpen] = useState(false);
  const [publishReason, setPublishReason] = useState("");
  const [publishAck, setPublishAck] = useState(false);

  const [exportOpen, setExportOpen] = useState(false);
  const [confirmData, setConfirmData] = useState<{
    open: boolean;
    title: string;
    message: string;
    action: () => void;
    actionLabel?: string;
    variant?: "default" | "danger";
  }>({
    open: false,
    title: "",
    message: "",
    action: () => {},
  });

  const totalUsers = useMemo(() => GROUPS.reduce((a, g) => a + g.users, 0), [GROUPS]);

  // Selection helpers
  const selectedModule = useMemo(() => {
    if (selected?.kind === "module") return selected.key as ServiceModule;
    return null;
  }, [selected]);

  const selectedMarketplace = useMemo(() => {
    if (selected?.kind === "marketplace") return selected.key as Marketplace;
    return null;
  }, [selected]);

  const effectiveMarketplaceLabel = (m: Marketplace) => {
    if (m === "Other Marketplace") return draft.labels.otherMarketplaceLabel || "Other Marketplace";
    return m;
  };

  const effectiveModuleLabel = (m: ServiceModule) => {
    if (m === "Other Service Module") return draft.labels.otherModuleLabel || "Other Service Module";
    return m;
  };

  const eCommerceEnabled = draft.modules["E-Commerce"].enabled;

  // Risk profile scoring
  const enabledRisks = useMemo(() => {
    const list: Risk[] = [];
    SERVICE_MODULES.forEach((m) => {
      if (draft.modules[m].enabled) list.push(draft.modules[m].risk);
    });
    return list;
  }, [draft, SERVICE_MODULES]);

  const orgRisk = useMemo(() => sumScore(enabledRisks), [enabledRisks]);

  // Controlled rollout
  const rollout = draft.rollout;
  const rolloutAllows = (u: UserRow) => (rollout.stage === "All" ? true : rollout.pilotGroups.includes(u.group));

  // Access evaluation
  const canUseModule = (cfg: DraftCfg, u: UserRow, m: ServiceModule) => {
    if (!cfg.modules[m].enabled) return false;
    const allow = cfg.rollout.stage === "All" ? true : cfg.rollout.pilotGroups.includes(u.group);
    return allow;
  };

  const canUseMarketplace = (cfg: DraftCfg, u: UserRow, mkt: Marketplace) => {
    if (!cfg.modules["E-Commerce"].enabled) return false;
    if (!cfg.marketplaces[mkt].enabled) return false;
    const allow = cfg.rollout.stage === "All" ? true : cfg.rollout.pilotGroups.includes(u.group);
    return allow;
  };

  // Diff counters
  const diffSummary = useMemo(() => {
    let changes = 0;

    SERVICE_MODULES.forEach((m) => {
      const a = draft.modules[m];
      const b = published.modules[m];
      if (a.enabled !== b.enabled) changes += 1;
      if (a.risk !== b.risk) changes += 1;
      if (a.policy !== b.policy) changes += 1;
      if (a.approval !== b.approval) changes += 1;
    });

    MARKETPLACES.forEach((m) => {
      const a = draft.marketplaces[m];
      const b = published.marketplaces[m];
      if (a.enabled !== b.enabled) changes += 1;
      if (a.inheritFromModule !== b.inheritFromModule) changes += 1;
      if (a.policy !== b.policy) changes += 1;
      if (a.approval !== b.approval) changes += 1;
    });

    if (draft.labels.otherModuleLabel !== published.labels.otherModuleLabel) changes += 1;
    if (draft.labels.otherMarketplaceLabel !== published.labels.otherMarketplaceLabel) changes += 1;

    if (draft.rollout.stage !== published.rollout.stage) changes += 1;
    if (!cmpSet(draft.rollout.pilotGroups, published.rollout.pilotGroups)) changes += 1;
    if (draft.rollout.plannedGoAllDate !== published.rollout.plannedGoAllDate) changes += 1;

    return changes;
  }, [draft, published, SERVICE_MODULES, MARKETPLACES]);

  // Impact preview
  const impact = useMemo(() => {
    const changedUsers: Array<{
      user: UserRow;
      gained: string[];
      lost: string[];
    }> = [];

    USERS.forEach((u) => {
      const gained: string[] = [];
      const lost: string[] = [];

      SERVICE_MODULES.forEach((m) => {
        const before = canUseModule(published, u, m);
        const after = canUseModule(draft, u, m);
        if (!before && after) gained.push(`Module: ${effectiveModuleLabel(m)}`);
        if (before && !after) lost.push(`Module: ${effectiveModuleLabel(m)}`);
      });

      MARKETPLACES.forEach((mk) => {
        const before = canUseMarketplace(published, u, mk);
        const after = canUseMarketplace(draft, u, mk);
        if (!before && after) gained.push(`Marketplace: ${effectiveMarketplaceLabel(mk)}`);
        if (before && !after) lost.push(`Marketplace: ${effectiveMarketplaceLabel(mk)}`);
      });

      if (gained.length || lost.length) changedUsers.push({ user: u, gained, lost });
    });

    const gains = changedUsers.reduce((a, x) => a + x.gained.length, 0);
    const losses = changedUsers.reduce((a, x) => a + x.lost.length, 0);

    return {
      changedUsers,
      gains,
      losses,
      changedCount: changedUsers.length,
    };
  }, [draft, published, USERS, SERVICE_MODULES, MARKETPLACES]);

  // Rollout impact preview (who has access now under draft)
  const rolloutAccess = useMemo(() => {
    const pilotUsers = USERS.filter((u) => rolloutAllows(u));
    const nonPilot = USERS.filter((u) => !rolloutAllows(u));
    return { pilotUsers, nonPilot };
  }, [USERS, rolloutAllows]);

  // Helpers
  const resetToPublished = () => {
    setDraft(deepClone(published));
    toast({ title: "Reverted", message: "Draft reverted to last published settings.", kind: "info" });
  };

  const saveDraft = () => {
    toast({ title: "Saved", message: "Draft saved (demo).", kind: "success" });
  };

  const openPublish = () => {
    setPublishReason("");
    setPublishAck(false);
    setPublishOpen(true);
  };

  const publish = () => {
    if (publishReason.trim().length < 8 || !publishAck) {
      toast({ title: "Publish blocked", message: "Add a clear reason and confirm acknowledgement.", kind: "warn" });
      return;
    }
    setPublished(deepClone(draft));
    setPublishOpen(false);
    toast({ title: "Published", message: "Enablement settings published.", kind: "success" });
  };

  const exportJSON = async () => {
    const payload = { draft, exportedAt: new Date().toISOString() };
    const text = JSON.stringify(payload, null, 2);
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied", message: "Config JSON copied to clipboard.", kind: "success" });
      setExportOpen(false);
    } catch {
      toast({ title: "Copy failed", message: "Copy manually.", kind: "warn" });
    }
  };

  const bulkApplyModuleDefaults = () => {
    if (!selectedModule) {
      toast({ title: "Select module", message: "Select a module first.", kind: "warn" });
      return;
    }
    setDraft((prev) => {
      const next = deepClone(prev);
      const src = next.modules[selectedModule];
      SERVICE_MODULES.forEach((m) => {
        next.modules[m].policy = src.policy;
        next.modules[m].approval = src.approval;
      });
      return next;
    });
    toast({ title: "Applied", message: "Module defaults applied to all modules.", kind: "success" });
  };

  const bulkApplyMarketplacesFromECommerce = () => {
    setDraft((prev) => {
      const next = deepClone(prev);
      MARKETPLACES.forEach((m) => {
        next.marketplaces[m].inheritFromModule = true;
        next.marketplaces[m].policy = "Org default";
        next.marketplaces[m].approval = "Org default";
      });
      return next;
    });
    toast({ title: "Applied", message: "Marketplaces set to inherit from E-Commerce defaults.", kind: "success" });
  };

  // Drawer editor
  const drawerOpen = !!selected;
  const drawerTitle = selectedModule
    ? `Module: ${effectiveModuleLabel(selectedModule)}`
    : selectedMarketplace
    ? `Marketplace: ${effectiveMarketplaceLabel(selectedMarketplace)}`
    : "";

  const drawerSubtitle = selectedModule
    ? `Risk: ${draft.modules[selectedModule].risk} • Enabled: ${draft.modules[selectedModule].enabled ? "Yes" : "No"}`
    : selectedMarketplace
    ? `Enabled: ${draft.marketplaces[selectedMarketplace].enabled ? "Yes" : "No"} • Inherit: ${draft.marketplaces[selectedMarketplace].inheritFromModule ? "Yes" : "No"}`
    : "";

  // Risk explanation
  const riskExplain: Record<ServiceModule, string[]> = {
    "E-Commerce": ["High vendor variability", "Category restrictions may apply", "Marketplace-specific rules"],
    "EVs & Charging": ["Energy transactions", "Station policies and credits", "Operational fraud risk"],
    "Rides & Logistics": ["High volume", "Policy breaches (time/geo)", "Safety and chargeback"],
    "School & E-Learning": ["Payments and subscriptions", "Youth safety policies", "Refund rules"],
    "Medical & Health Care": ["Sensitive categories", "Compliance requirements", "Higher audit expectations"],
    "Travel & Tourism": ["High variability", "Airport rules", "Large bookings"],
    "Green Investments": ["Regulatory sensitivity", "Large amounts", "Enhanced approvals"],
    "FaithHub": ["Content sensitivity", "Donations/refunds", "Policy controls"],
    "Virtual Workspace": ["Low monetary risk", "Mostly operational", "Permissions sensitive"],
    "Finance & Payments": ["Direct money movement", "Fraud risk", "Always audited"],
    "Other Service Module": ["Unknown risk", "Default to Medium", "Review before enabling"],
  };

  const enabledModulesCount = SERVICE_MODULES.filter((m) => draft.modules[m].enabled).length;
  const enabledMarketplacesCount = MARKETPLACES.filter((m) => draft.marketplaces[m].enabled).length;

  return (
    <div className="min-h-screen" style={{ background: "radial-gradient(90% 60% at 50% 0%, rgba(3,205,140,0.18), rgba(255,255,255,0))" }}>
      <ToastStack toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((x) => x.id !== id))} />

      <div className="mx-auto max-w-[95%] px-4 py-6 md:px-6">
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(2,8,23,0.12)]">
          {/* Header */}
          <div className="border-b border-slate-200 bg-white px-4 py-4 md:px-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl text-white" style={{ background: EVZ.green }}>
                  <Layers className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">Modules and Marketplaces Enablement</div>
                  <div className="mt-1 text-xs text-slate-500">Enable services and marketplaces. Map default policies and approval flows. Use pilot rollout before enabling for everyone.</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Pill label={`Modules enabled: ${enabledModulesCount}/${SERVICE_MODULES.length}`} tone="neutral" />
                    <Pill label={`Marketplaces enabled: ${enabledMarketplacesCount}/${MARKETPLACES.length}`} tone={eCommerceEnabled ? "neutral" : "warn"} />
                    <Pill label={`Rollout: ${draft.rollout.stage}`} tone={draft.rollout.stage === "Pilot" ? "warn" : "good"} />
                    <Pill label={`Org risk: ${orgRisk.label}`} tone={riskTone(orgRisk.label)} />
                    {diffSummary ? <Pill label={`Draft changes: ${diffSummary}`} tone="info" /> : <Pill label="No draft changes" tone="good" />}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={() => setExportOpen(true)}>
                  <Download className="h-4 w-4" /> Export
                </Button>
                <Button variant="outline" onClick={() => {
                  if (diffSummary) {
                    setConfirmData({
                      open: true,
                      title: "Revert Changes",
                      message: "Are you sure you want to revert all draft changes to the last published version?",
                      action: resetToPublished,
                      actionLabel: "Revert",
                      variant: "danger"
                    });
                  }
                }} disabled={!diffSummary}>
                  <X className="h-4 w-4" /> Revert
                </Button>
                <Button variant="outline" onClick={() => {
                  saveDraft();
                }}>
                  <Save className="h-4 w-4" /> Save draft
                </Button>
                <Button variant="primary" onClick={openPublish} disabled={!diffSummary}>
                  <BadgeCheck className="h-4 w-4" /> Publish
                </Button>
              </div>
            </div>

            {/* Tabs */}
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                { id: "enablement", label: "Enablement" },
                { id: "defaults", label: "Default policies and approvals" },
                { id: "rollout", label: "Controlled rollout" },
                { id: "impact", label: "Change impact" },
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
          </div>

          {/* Body */}
          <div className="bg-slate-50 px-4 py-5 md:px-6">
            {tab === "enablement" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Service modules</div>
                      <div className="mt-1 text-xs text-slate-500">Enable or disable modules. Click to edit defaults.</div>
                    </div>
                    <Pill label="Core" tone="neutral" />
                  </div>

                  <div className="mt-4 space-y-2">
                    {SERVICE_MODULES.map((m) => {
                      const cfg = draft.modules[m];
                      const isSel = selectedModule === m;
                      const label = effectiveModuleLabel(m);
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setSelected({ kind: "module", key: m })}
                          className={cn(
                            "w-full rounded-3xl border p-4 text-left transition",
                            isSel ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white hover:bg-slate-50"
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="truncate text-sm font-semibold text-slate-900">{label}</div>
                                <Pill label={cfg.enabled ? "Enabled" : "Off"} tone={cfg.enabled ? "good" : "neutral"} />
                                <Pill label={`Risk: ${cfg.risk}`} tone={riskTone(cfg.risk)} />
                              </div>
                              <div className="mt-1 text-xs text-slate-500">Policy: {cfg.policy} • Approval: {cfg.approval}</div>
                            </div>
                            <ChevronRight className="mt-0.5 h-4 w-4 text-slate-500" />
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                    Premium: risk profile scoring is shown per module and aggregated for the org.
                  </div>

                  <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4">
                    <div className="text-sm font-semibold text-slate-900">Other labels</div>
                    <div className="mt-1 text-xs text-slate-500">Optional: rename the “Other” slots.</div>
                    <div className="mt-3 space-y-3">
                      <Field
                        label="Other Service Module label"
                        value={draft.labels.otherModuleLabel}
                        onChange={(v) => setDraft((p) => ({ ...p, labels: { ...p.labels, otherModuleLabel: v } }))}
                        placeholder="Other Service Module"
                      />
                      <Field
                        label="Other Marketplace label"
                        value={draft.labels.otherMarketplaceLabel}
                        onChange={(v) => setDraft((p) => ({ ...p, labels: { ...p.labels, otherMarketplaceLabel: v } }))}
                        placeholder="Other Marketplace"
                      />
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-2 space-y-4">
                  <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">Marketplaces (within E-Commerce)</div>
                        <div className="mt-1 text-xs text-slate-500">Enable or disable marketplaces. Applies when E-Commerce is enabled.</div>
                      </div>
                      <Pill label={eCommerceEnabled ? "E-Commerce enabled" : "E-Commerce off"} tone={eCommerceEnabled ? "good" : "warn"} />
                    </div>

                    <div className={cn("mt-4 grid grid-cols-1 gap-2 md:grid-cols-2", !eCommerceEnabled && "opacity-70")}>
                      {MARKETPLACES.map((m) => {
                        const cfg = draft.marketplaces[m];
                        const isSel = selectedMarketplace === m;
                        const label = effectiveMarketplaceLabel(m);
                        return (
                          <button
                            key={m}
                            type="button"
                            disabled={!eCommerceEnabled}
                            onClick={() => setSelected({ kind: "marketplace", key: m })}
                            className={cn(
                              "rounded-3xl border p-4 text-left transition",
                              isSel ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white hover:bg-slate-50",
                              !eCommerceEnabled && "cursor-not-allowed"
                            )}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <div className="truncate text-sm font-semibold text-slate-900">{label}</div>
                                  <Pill label={cfg.enabled ? "Enabled" : "Off"} tone={cfg.enabled ? "good" : "neutral"} />
                                  <Pill label={cfg.inheritFromModule ? "Inherit" : "Override"} tone={cfg.inheritFromModule ? "neutral" : "info"} />
                                </div>
                                <div className="mt-1 text-xs text-slate-500">
                                  {cfg.inheritFromModule ? "Uses E-Commerce defaults" : `Policy: ${cfg.policy} • Approval: ${cfg.approval}`}
                                </div>
                              </div>
                              <ChevronRight className="mt-0.5 h-4 w-4 text-slate-500" />
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {!eCommerceEnabled ? (
                      <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                        Enable E-Commerce to use marketplace toggles.
                      </div>
                    ) : null}

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Button variant="outline" onClick={() => {
                        setConfirmData({
                          open: true,
                          title: "Set All to Inherit",
                          message: "Set all marketplaces to inherit settings from E-Commerce?",
                          action: bulkApplyMarketplacesFromECommerce,
                          actionLabel: "Set Inherit",
                          variant: "default"
                        });
                      }} disabled={!eCommerceEnabled}>
                        <Sparkles className="h-4 w-4" /> Set all to inherit
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setConfirmData({
                            open: true,
                            title: "Enable All Marketplaces",
                            message: "Are you sure you want to enable all marketplaces?",
                            action: () => {
                              setDraft((prev) => {
                                const next = deepClone(prev);
                                MARKETPLACES.forEach((m) => {
                                  if (m !== "Other Marketplace") next.marketplaces[m].enabled = true;
                                });
                                return next;
                              });
                              toast({ title: "Enabled", message: "All marketplaces enabled.", kind: "success" });
                            },
                            actionLabel: "Enable All",
                            variant: "default"
                          });
                        }}
                        disabled={!eCommerceEnabled}
                      >
                        <Plus className="h-4 w-4" /> Enable all
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setConfirmData({
                            open: true,
                            title: "Disable All Marketplaces",
                            message: "Are you sure you want to disable all marketplaces (except 'Other')?",
                            action: () => {
                              setDraft((prev) => {
                                const next = deepClone(prev);
                                MARKETPLACES.forEach((m) => (next.marketplaces[m].enabled = false));
                                // keep Other on by default
                                next.marketplaces["Other Marketplace"].enabled = true;
                                return next;
                              });
                              toast({ title: "Disabled", message: "All marketplaces disabled (except Other).", kind: "info" });
                            },
                            actionLabel: "Disable All",
                            variant: "danger"
                          });
                        }}
                        disabled={!eCommerceEnabled}
                      >
                        <X className="h-4 w-4" /> Disable all
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">Module risk profile scoring</div>
                        <div className="mt-1 text-xs text-slate-500">High sensitivity modules should have stricter policies and approvals.</div>
                      </div>
                      <Pill label={`Org risk: ${orgRisk.label}`} tone={riskTone(orgRisk.label)} />
                    </div>
                    <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                      <RiskTile title="Enabled modules" value={`${enabledModulesCount}`} icon={<Layers className="h-5 w-5" />} tone="neutral" />
                      <RiskTile title="Avg risk score" value={`${Math.round(orgRisk.avg)}/100`} icon={<AlertTriangle className="h-5 w-5" />} tone={riskTone(orgRisk.label)} />
                      <RiskTile title="Stage" value={draft.rollout.stage} icon={<Users className="h-5 w-5" />} tone={draft.rollout.stage === "Pilot" ? "warn" : "good"} />
                    </div>
                    <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                      Premium: risk score influences recommended approval flows and alert routing.
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {tab === "defaults" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Bulk tools</div>
                      <div className="mt-1 text-xs text-slate-500">Apply defaults quickly.</div>
                    </div>
                    <Pill label="Premium" tone="info" />
                  </div>
                  <div className="mt-4 space-y-2">
                    <Button variant="outline" className="w-full" onClick={() => {
                      setConfirmData({
                        open: true,
                        title: "Apply Module Defaults",
                        message: "Apply defaults from the selected module to ALL other modules?",
                        action: bulkApplyModuleDefaults,
                        actionLabel: "Apply",
                        variant: "default"
                      });
                    }}>
                      <Sparkles className="h-4 w-4" /> Apply selected module defaults to all
                    </Button>
                    <Button variant="outline" className="w-full" onClick={() => {
                       setConfirmData({
                         open: true,
                         title: "Bulk Inherit Marketplaces",
                         message: "Set ALL marketplaces to inherit settings from E-Commerce?",
                         action: bulkApplyMarketplacesFromECommerce,
                         actionLabel: "Set to Inherit",
                         variant: "default"
                       });
                    }} disabled={!eCommerceEnabled}>
                      <Sparkles className="h-4 w-4" /> Set all marketplaces to inherit
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setConfirmData({
                          open: true,
                          title: "Apply Balanced Template",
                          message: "Apply 'Balanced' policy template to all modules (with specific overrides for Finance & Medical)?",
                          action: () => {
                            setDraft((prev) => {
                              const next = deepClone(prev);
                              SERVICE_MODULES.forEach((m) => {
                                next.modules[m].policy = "Balanced";
                                next.modules[m].approval = "Auto under threshold";
                              });
                              next.modules["Finance & Payments"].policy = "Strict compliance";
                              next.modules["Finance & Payments"].approval = "Finance approval";
                              return next;
                            });
                            toast({ title: "Template", message: "Balanced defaults applied.", kind: "success" });
                          },
                          actionLabel: "Apply Template",
                          variant: "default"
                        });
                      }}
                    >
                      <Layers className="h-4 w-4" /> Apply Balanced template
                    </Button>
                  </div>
                  <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                    Defaults are used when users do not have group or user overrides.
                  </div>
                </div>

                <div className="lg:col-span-2 space-y-4">
                  <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">Per-module defaults</div>
                        <div className="mt-1 text-xs text-slate-500">Default policy template and approval flow mapping.</div>
                      </div>
                      <Pill label="Core" tone="neutral" />
                    </div>

                    <div className="mt-4 overflow-x-auto">
                      <table className="min-w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs text-slate-600">
                          <tr>
                            <th className="px-4 py-3 font-semibold">Module</th>
                            <th className="px-4 py-3 font-semibold">Enabled</th>
                            <th className="px-4 py-3 font-semibold">Risk</th>
                            <th className="px-4 py-3 font-semibold">Default policy</th>
                            <th className="px-4 py-3 font-semibold">Default approval</th>
                            <th className="px-4 py-3 font-semibold">Edit</th>
                          </tr>
                        </thead>
                        <tbody>
                          {SERVICE_MODULES.map((m) => {
                            const cfg = draft.modules[m];
                            return (
                              <tr key={m} className="border-t border-slate-100 hover:bg-slate-50/60">
                                <td className="px-4 py-3 font-semibold text-slate-900">{effectiveModuleLabel(m)}</td>
                                <td className="px-4 py-3"><Pill label={cfg.enabled ? "Yes" : "No"} tone={cfg.enabled ? "good" : "neutral"} /></td>
                                <td className="px-4 py-3"><Pill label={cfg.risk} tone={riskTone(cfg.risk)} /></td>
                                <td className="px-4 py-3 text-slate-700">{cfg.policy}</td>
                                <td className="px-4 py-3 text-slate-700">{cfg.approval}</td>
                                <td className="px-4 py-3">
                                  <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => setSelected({ kind: "module", key: m })}>
                                    Edit
                                  </Button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                      Best practice: Finance & Payments and Medical & Health Care should use strict compliance defaults.
                    </div>
                  </div>

                  <div className={cn("rounded-3xl border border-slate-200 bg-white p-4 shadow-sm", !eCommerceEnabled && "opacity-70")}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">Per-marketplace overrides</div>
                        <div className="mt-1 text-xs text-slate-500">If not inheriting, set marketplace-specific policy and approvals.</div>
                      </div>
                      <Pill label={eCommerceEnabled ? "E-Commerce on" : "E-Commerce off"} tone={eCommerceEnabled ? "good" : "warn"} />
                    </div>

                    <div className="mt-4 overflow-x-auto">
                      <table className="min-w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs text-slate-600">
                          <tr>
                            <th className="px-4 py-3 font-semibold">Marketplace</th>
                            <th className="px-4 py-3 font-semibold">Enabled</th>
                            <th className="px-4 py-3 font-semibold">Inherit</th>
                            <th className="px-4 py-3 font-semibold">Policy</th>
                            <th className="px-4 py-3 font-semibold">Approval</th>
                            <th className="px-4 py-3 font-semibold">Edit</th>
                          </tr>
                        </thead>
                        <tbody>
                          {MARKETPLACES.map((m) => {
                            const cfg = draft.marketplaces[m];
                            return (
                              <tr key={m} className="border-t border-slate-100 hover:bg-slate-50/60">
                                <td className="px-4 py-3 font-semibold text-slate-900">{effectiveMarketplaceLabel(m)}</td>
                                <td className="px-4 py-3"><Pill label={cfg.enabled ? "Yes" : "No"} tone={cfg.enabled ? "good" : "neutral"} /></td>
                                <td className="px-4 py-3"><Pill label={cfg.inheritFromModule ? "Yes" : "No"} tone={cfg.inheritFromModule ? "neutral" : "info"} /></td>
                                <td className="px-4 py-3 text-slate-700">{cfg.inheritFromModule ? "(inherits)" : cfg.policy}</td>
                                <td className="px-4 py-3 text-slate-700">{cfg.inheritFromModule ? "(inherits)" : cfg.approval}</td>
                                <td className="px-4 py-3">
                                  <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => setSelected({ kind: "marketplace", key: m })} disabled={!eCommerceEnabled}>
                                    Edit
                                  </Button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                      Tip: set MyLiveDealz to stricter approvals if you allow high-value deals.
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {tab === "rollout" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Controlled rollout</div>
                      <div className="mt-1 text-xs text-slate-500">Pilot group first, then expand to all.</div>
                    </div>
                    <Pill label="Premium" tone="info" />
                  </div>

                  <div className="mt-4 space-y-3">
                    <Select
                      label="Stage"
                      value={draft.rollout.stage}
                      onChange={(v) => setDraft((p) => ({ ...p, rollout: { ...p.rollout, stage: v as RolloutStage } }))}
                      options={["Pilot", "All"]}
                      hint="Pilot limits access"
                    />

                    <Field
                      label="Planned go-all date"
                      value={draft.rollout.plannedGoAllDate}
                      onChange={(v) => setDraft((p) => ({ ...p, rollout: { ...p.rollout, plannedGoAllDate: v } }))}
                      placeholder="YYYY-MM-DD"
                      hint="Roadmap"
                    />

                    <Field
                      label="Notes"
                      value={draft.rollout.notes}
                      onChange={(v) => setDraft((p) => ({ ...p, rollout: { ...p.rollout, notes: v } }))}
                      placeholder="Explain rollout plan"
                    />

                    <div className={cn("rounded-3xl border border-slate-200 bg-white p-4", draft.rollout.stage === "All" && "opacity-70")}>
                      <div className="text-sm font-semibold text-slate-900">Pilot groups</div>
                      <div className="mt-1 text-xs text-slate-500">Select groups to receive access during pilot stage.</div>
                      <div className="mt-3 space-y-2">
                        {GROUPS.map((g) => {
                          const on = draft.rollout.pilotGroups.includes(g.id);
                          return (
                            <button
                              key={g.id}
                              type="button"
                              disabled={draft.rollout.stage === "All"}
                              onClick={() => {
                                if (draft.rollout.stage === "All") return;
                                setDraft((p) => {
                                  const next = deepClone(p);
                                  const cur = new Set(next.rollout.pilotGroups);
                                  let msg = "";
                                  if (cur.has(g.id)) {
                                     cur.delete(g.id);
                                     msg = `Removed ${g.id} from pilot`;
                                  } else {
                                     cur.add(g.id);
                                     msg = `Added ${g.id} to pilot`;
                                  }
                                  next.rollout.pilotGroups = Array.from(cur) as Group[];
                                  toast({ title: "Updated", message: msg, kind: "info" });
                                  return next;
                                });
                              }}
                              className={cn(
                                "flex w-full items-center justify-between rounded-2xl border px-3 py-2 text-left text-sm font-semibold",
                                on ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white hover:bg-slate-50",
                                draft.rollout.stage === "All" && "cursor-not-allowed"
                              )}
                            >
                              <span>{g.id}</span>
                              <div className="flex items-center gap-2">
                                <Pill label={`${g.users} users`} tone="neutral" />
                                <Pill label={on ? "Pilot" : "Off"} tone={on ? "good" : "neutral"} />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="primary"
                        onClick={() => {
                          setDraft((p) => ({ ...p, rollout: { ...p.rollout, stage: "All" } }));
                          toast({ title: "Expanded", message: "Rollout expanded to all groups (draft).", kind: "success" });
                        }}
                      >
                        <Users className="h-4 w-4" /> Expand to all
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setDraft((p) => ({ ...p, rollout: { ...p.rollout, stage: "Pilot" } }));
                          toast({ title: "Pilot", message: "Returned to pilot stage (draft).", kind: "info" });
                        }}
                      >
                        <ChevronRight className="h-4 w-4" /> Pilot stage
                      </Button>
                    </div>

                    <div className="mt-2 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                      Premium: pilot rollout is recommended for high-risk modules like Finance & Payments.
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-2 space-y-4">
                  <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">Pilot preview</div>
                        <div className="mt-1 text-xs text-slate-500">Who has access now under draft rollout settings.</div>
                      </div>
                      <Pill label={`Pilot users: ${rolloutAccess.pilotUsers.length}`} tone={draft.rollout.stage === "Pilot" ? "warn" : "neutral"} />
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div className="rounded-2xl border border-slate-200 bg-white p-3">
                        <div className="text-xs font-semibold text-slate-600">Allowed groups</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {(draft.rollout.stage === "All" ? GROUPS.map((g) => g.id) : draft.rollout.pilotGroups).map((g) => (
                            <Pill key={g} label={g} tone="neutral" />
                          ))}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white p-3">
                        <div className="text-xs font-semibold text-slate-600">Pilot coverage</div>
                        <div className="mt-1 text-2xl font-semibold text-slate-900">
                          {draft.rollout.stage === "All" ? "100%" : `${Math.round((rolloutAccess.pilotUsers.length / Math.max(1, USERS.length)) * 100)}%`}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">Sample users list, full list in production</div>
                      </div>
                    </div>

                    <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                      <table className="min-w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs text-slate-600">
                          <tr>
                            <th className="px-4 py-3 font-semibold">User</th>
                            <th className="px-4 py-3 font-semibold">Group</th>
                            <th className="px-4 py-3 font-semibold">Rollout access</th>
                          </tr>
                        </thead>
                        <tbody>
                          {USERS.map((u) => {
                            const allowed = rolloutAllows(u);
                            return (
                              <tr key={u.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                                <td className="px-4 py-3 font-semibold text-slate-900">{u.name}</td>
                                <td className="px-4 py-3 text-slate-700">{u.group}</td>
                                <td className="px-4 py-3"><Pill label={draft.rollout.stage === "All" ? "Allowed" : allowed ? "Pilot" : "Not yet"} tone={draft.rollout.stage === "All" ? "good" : allowed ? "warn" : "neutral"} /></td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                      Controlled rollout does not remove individual permissions. It limits availability until pilot is complete.
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">Recommended rollout strategy</div>
                        <div className="mt-1 text-xs text-slate-500">Based on enabled modules risk.</div>
                      </div>
                      <Pill label={`Org risk: ${orgRisk.label}`} tone={riskTone(orgRisk.label)} />
                    </div>
                    <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700">
                      Suggested:
                      <ul className="mt-2 space-y-1 text-xs text-slate-600">
                        <li>1) Pilot Finance & Payments with Finance group only</li>
                        <li>2) Pilot MyLiveDealz purchases with Procurement approvals</li>
                        <li>3) Expand to all when approval SLAs stabilize</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {tab === "impact" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Change impact preview</div>
                      <div className="mt-1 text-xs text-slate-500">Compares draft against last published configuration.</div>
                    </div>
                    <Pill label={diffSummary ? "Draft has changes" : "No changes"} tone={diffSummary ? "warn" : "good"} />
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3">
                    <ImpactTile title="Users affected" value={`${impact.changedCount}`} tone={impact.changedCount ? "warn" : "good"} icon={<Users className="h-5 w-5" />} />
                    <ImpactTile title="Access gains" value={`${impact.gains}`} tone={impact.gains ? "good" : "neutral"} icon={<Sparkles className="h-5 w-5" />} />
                    <ImpactTile title="Access losses" value={`${impact.losses}`} tone={impact.losses ? "warn" : "neutral"} icon={<Lock className="h-5 w-5" />} />
                  </div>

                  <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                    Tip: publish changes after reviewing impact. Use pilot rollout to reduce disruption.
                  </div>

                  <Button variant="primary" className="mt-4 w-full" disabled={!diffSummary} onClick={openPublish}>
                    <BadgeCheck className="h-4 w-4" /> Publish changes
                  </Button>

                  <Button variant="outline" className="mt-2 w-full" disabled={!diffSummary} onClick={resetToPublished}>
                    <X className="h-4 w-4" /> Revert
                  </Button>
                </div>

                <div className="lg:col-span-2 space-y-4">
                  <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">Users impacted</div>
                        <div className="mt-1 text-xs text-slate-500">Sample list (demo). In production, this lists all users.</div>
                      </div>
                      <Pill label={`${impact.changedUsers.length}`} tone={impact.changedUsers.length ? "warn" : "good"} />
                    </div>

                    {impact.changedUsers.length ? (
                      <div className="mt-4 space-y-3">
                        {impact.changedUsers.map((x) => (
                          <div key={x.user.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                              <div>
                                <div className="text-sm font-semibold text-slate-900">{x.user.name}</div>
                                <div className="mt-1 text-xs text-slate-500">{x.user.title} • Group: {x.user.group} • {x.user.id}</div>
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                {x.gained.length ? <Pill label={`Gains: ${x.gained.length}`} tone="good" /> : null}
                                {x.lost.length ? <Pill label={`Losses: ${x.lost.length}`} tone="warn" /> : null}
                              </div>
                            </div>

                            {x.gained.length ? (
                              <div className="mt-3">
                                <div className="text-xs font-semibold text-slate-600">Gained access</div>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {x.gained.slice(0, 8).map((g) => (
                                    <Pill key={g} label={g} tone="good" />
                                  ))}
                                  {x.gained.length > 8 ? <Pill label={`+${x.gained.length - 8}`} tone="good" /> : null}
                                </div>
                              </div>
                            ) : null}

                            {x.lost.length ? (
                              <div className="mt-3">
                                <div className="text-xs font-semibold text-slate-600">Lost access</div>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {x.lost.slice(0, 8).map((g) => (
                                    <Pill key={g} label={g} tone="warn" />
                                  ))}
                                  {x.lost.length > 8 ? <Pill label={`+${x.lost.length - 8}`} tone="warn" /> : null}
                                </div>
                              </div>
                            ) : null}

                            <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                              Premium: impact preview can include historical spend risk scoring for each user.
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-4 rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center">
                        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-700">
                          <Check className="h-6 w-6" />
                        </div>
                        <div className="mt-3 text-sm font-semibold text-slate-900">No impact</div>
                        <div className="mt-1 text-sm text-slate-600">Draft matches last published configuration.</div>
                      </div>
                    )}
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">What changes in the apps</div>
                        <div className="mt-1 text-xs text-slate-500">Employees use normal EVzone apps. CorporatePay appears at checkout based on enablement.</div>
                      </div>
                      <Pill label="Explanation" tone="info" />
                    </div>
                    <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700">
                      <ul className="space-y-1 text-xs text-slate-600">
                        <li>1) If a module is disabled, CorporatePay is not available for that module at checkout.</li>
                        <li>2) For E-Commerce, marketplaces must be enabled for CorporatePay to appear on those purchases.</li>
                        <li>3) Controlled rollout limits access to pilot groups until expanded.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <footer className="border-t border-slate-200 bg-white/60 py-6">
            <div className="mx-auto max-w-[95%] px-4 text-xs text-slate-500 md:px-6">
              E Modules & Marketplaces Enablement v2: module toggles, marketplace toggles, per-module and per-marketplace defaults, risk scoring, controlled rollout, and impact preview.
            </div>
          </footer>
        </div>
      </div>

      {/* Drawer editor */}
      <Drawer
        open={drawerOpen}
        title={drawerTitle}
        subtitle={drawerSubtitle}
        onClose={() => setSelected(null)}
        footer={
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs text-slate-600">Edit is draft-only until published.</div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={() => setSelected(null)}>
                Close
              </Button>
              <Button variant="primary" onClick={() => { saveDraft(); setSelected(null); }}>
                <Save className="h-4 w-4" /> Save
              </Button>
            </div>
          </div>
        }
      >
        {selectedModule ? (
          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">Enablement</div>
                  <div className="mt-1 text-xs text-slate-500">Toggle availability for this module at checkout.</div>
                </div>
                <Pill label={draft.modules[selectedModule].enabled ? "Enabled" : "Off"} tone={draft.modules[selectedModule].enabled ? "good" : "neutral"} />
              </div>
              <div className="mt-3">
                <TogglePill
                  enabled={draft.modules[selectedModule].enabled}
                  onChange={(v) => setDraft((p) => ({ ...p, modules: { ...p.modules, [selectedModule]: { ...p.modules[selectedModule], enabled: v } } }))}
                  label={draft.modules[selectedModule].enabled ? "Disable module" : "Enable module"}
                />
              </div>
              {selectedModule === "E-Commerce" && !draft.modules[selectedModule].enabled ? (
                <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                  Disabling E-Commerce disables all marketplace purchases via CorporatePay.
                </div>
              ) : null}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">Risk profile</div>
                  <div className="mt-1 text-xs text-slate-500">Premium: scoring guides defaults and rollout strategy.</div>
                </div>
                <Pill label={`Score ${riskScore(draft.modules[selectedModule].risk)}/100`} tone={riskTone(draft.modules[selectedModule].risk)} />
              </div>
              <div className="mt-3">
                <Select
                  label="Risk rating"
                  value={draft.modules[selectedModule].risk}
                  onChange={(v) => setDraft((p) => ({ ...p, modules: { ...p.modules, [selectedModule]: { ...p.modules[selectedModule], risk: v as Risk } } }))}
                  options={["Low", "Medium", "High"]}
                  hint="Override if needed"
                />
                <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700">
                  Signals:
                  <ul className="mt-2 space-y-1 text-xs text-slate-600">
                    {riskExplain[selectedModule].map((x) => (
                      <li key={x}>• {x}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="text-sm font-semibold text-slate-900">Default mappings</div>
              <div className="mt-1 text-xs text-slate-500">Applied unless overridden by group/user policies.</div>
              <div className="mt-3 grid grid-cols-1 gap-4">
                <Select
                  label="Default policy template"
                  value={draft.modules[selectedModule].policy}
                  onChange={(v) => setDraft((p) => ({ ...p, modules: { ...p.modules, [selectedModule]: { ...p.modules[selectedModule], policy: v as PolicyTemplate } } }))}
                  options={POLICY_TEMPLATES}
                />
                <Select
                  label="Default approval flow"
                  value={draft.modules[selectedModule].approval}
                  onChange={(v) => setDraft((p) => ({ ...p, modules: { ...p.modules, [selectedModule]: { ...p.modules[selectedModule], approval: v as ApprovalFlow } } }))}
                  options={APPROVAL_FLOWS}
                />
              </div>
              <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                Recommendation: high risk modules should use Finance approval or Multi-level escalation.
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="text-sm font-semibold text-slate-900">Quick apply</div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={bulkApplyModuleDefaults}>
                  <Sparkles className="h-4 w-4" /> Apply to all modules
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setDraft((p) => {
                      const next = deepClone(p);
                      next.modules[selectedModule].policy = "Strict compliance";
                      next.modules[selectedModule].approval = "Multi-level escalation";
                      return next;
                    });
                    toast({ title: "Applied", message: "Strict defaults set for this module.", kind: "success" });
                  }}
                >
                  <Shield className="h-4 w-4" /> Strict preset
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        {selectedMarketplace ? (
          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">Enablement</div>
                  <div className="mt-1 text-xs text-slate-500">Availability for this marketplace at checkout.</div>
                </div>
                <Pill label={draft.marketplaces[selectedMarketplace].enabled ? "Enabled" : "Off"} tone={draft.marketplaces[selectedMarketplace].enabled ? "good" : "neutral"} />
              </div>
              <div className="mt-3 space-y-2">
                <TogglePill
                  enabled={draft.marketplaces[selectedMarketplace].enabled}
                  onChange={(v) => setDraft((p) => ({ ...p, marketplaces: { ...p.marketplaces, [selectedMarketplace]: { ...p.marketplaces[selectedMarketplace], enabled: v } } }))}
                  label={draft.marketplaces[selectedMarketplace].enabled ? "Disable marketplace" : "Enable marketplace"}
                  disabled={!draft.modules["E-Commerce"].enabled}
                />
                <TogglePill
                  enabled={draft.marketplaces[selectedMarketplace].inheritFromModule}
                  onChange={(v) => setDraft((p) => ({ ...p, marketplaces: { ...p.marketplaces, [selectedMarketplace]: { ...p.marketplaces[selectedMarketplace], inheritFromModule: v } } }))}
                  label={draft.marketplaces[selectedMarketplace].inheritFromModule ? "Inheriting from E-Commerce" : "Override defaults"}
                  disabled={!draft.modules["E-Commerce"].enabled}
                />
              </div>
              {!draft.modules["E-Commerce"].enabled ? (
                <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                  Enable E-Commerce module first.
                </div>
              ) : null}
            </div>

            <div className={cn(!draft.marketplaces[selectedMarketplace].inheritFromModule ? "" : "opacity-70")}>
              <div className="rounded-3xl border border-slate-200 bg-white p-4">
                <div className="text-sm font-semibold text-slate-900">Marketplace defaults</div>
                <div className="mt-1 text-xs text-slate-500">Only applies when overrides are enabled.</div>
                <div className="mt-3 grid grid-cols-1 gap-4">
                  <Select
                    label="Policy template"
                    value={draft.marketplaces[selectedMarketplace].policy}
                    onChange={(v) => setDraft((p) => ({ ...p, marketplaces: { ...p.marketplaces, [selectedMarketplace]: { ...p.marketplaces[selectedMarketplace], policy: v as PolicyTemplate } } }))}
                    options={POLICY_TEMPLATES}
                    disabled={draft.marketplaces[selectedMarketplace].inheritFromModule}
                  />
                  <Select
                    label="Approval flow"
                    value={draft.marketplaces[selectedMarketplace].approval}
                    onChange={(v) => setDraft((p) => ({ ...p, marketplaces: { ...p.marketplaces, [selectedMarketplace]: { ...p.marketplaces[selectedMarketplace], approval: v as ApprovalFlow } } }))}
                    options={APPROVAL_FLOWS}
                    disabled={draft.marketplaces[selectedMarketplace].inheritFromModule}
                  />
                </div>
                <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                  Tip: use stricter approvals for marketplaces that allow high-value assets or services.
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="text-sm font-semibold text-slate-900">Shortcuts</div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={() => {
                   if (window.confirm("Set all marketplaces to inherit from E-Commerce settings?")) {
                     bulkApplyMarketplacesFromECommerce();
                   }
                }}>
                  <Sparkles className="h-4 w-4" /> Set all to inherit
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setDraft((p) => {
                      const next = deepClone(p);
                      next.marketplaces[selectedMarketplace].inheritFromModule = false;
                      next.marketplaces[selectedMarketplace].policy = "Strict compliance";
                      next.marketplaces[selectedMarketplace].approval = "Multi-level escalation";
                      return next;
                    });
                    toast({ title: "Applied", message: "Strict marketplace overrides set.", kind: "success" });
                  }}
                  disabled={!draft.modules["E-Commerce"].enabled}
                >
                  <Shield className="h-4 w-4" /> Strict override
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </Drawer>

      {/* Publish modal */}
      <Modal
        open={publishOpen}
        title="Publish enablement changes"
        subtitle="Provide a reason. This will be audit logged in production."
        onClose={() => setPublishOpen(false)}
        actions={[{ label: "Publish", onClick: publish, disabled: publishReason.trim().length < 8 || !publishAck }]}

        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setPublishOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={publish} disabled={publishReason.trim().length < 8 || !publishAck}>
              <BadgeCheck className="h-4 w-4" /> Publish
            </Button>
          </div>
        }
      >
        <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-700">
          Draft changes: <span className="font-semibold text-slate-900">{diffSummary}</span> • Users impacted: <span className="font-semibold text-slate-900">{impact.changedCount}</span>
        </div>
        <div className="mt-4">
          <div className="text-xs font-semibold text-slate-600">Reason</div>
          <textarea
            value={publishReason}
            onChange={(e) => setPublishReason(e.target.value)}
            placeholder="Example: enable MyLiveDealz for pilot groups; keep Finance & Payments strict; approvals routed to Finance Desk"
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

      {/* Export modal */}
      <Modal
        open={exportOpen}
        title="Export configuration"
        subtitle="Copy JSON to clipboard (demo)."
        onClose={() => setExportOpen(false)}
        actions={[{ label: "Copy JSON", onClick: exportJSON }]}

        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setExportOpen(false)}>Close</Button>
            <Button variant="primary" onClick={exportJSON}>
              <Copy className="h-4 w-4" /> Copy JSON
            </Button>
          </div>
        }
      >
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
          This export includes modules, marketplaces, labels, and rollout settings.
        </div>
        <pre className="mt-3 max-h-[360px] overflow-auto rounded-2xl border border-slate-200 bg-white p-3 text-xs text-slate-800">{JSON.stringify(draft, null, 2)}</pre>
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        open={confirmData.open}
        title={confirmData.title}
        subtitle={confirmData.message}
        onClose={() => setConfirmData((p) => ({ ...p, open: false }))}
        actions={[{
          label: confirmData.actionLabel || "Confirm",
          onClick: () => {
            confirmData.action();
            setConfirmData((p) => ({ ...p, open: false }));
          },
          variant: confirmData.variant
        }]}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setConfirmData((p) => ({ ...p, open: false }))}>Cancel</Button>
            <Button
              variant={confirmData.variant === "danger" ? "danger" : "primary"}
              onClick={() => {
                confirmData.action();
                setConfirmData((p) => ({ ...p, open: false }));
              }}
            >
              {confirmData.actionLabel || "Confirm"}
            </Button>
          </div>
        }
      >
        <div className="text-sm text-slate-600">
          This action will update your draft configuration. Changes are not live until published.
        </div>
      </Modal>

      <footer className="border-t border-slate-200 bg-white/60 py-6">
        <div className="mx-auto max-w-[95%] px-4 text-xs text-slate-500 md:px-6">
          E Modules & Marketplaces Enablement v2: enablement, default mappings, risk scoring, controlled rollout, and change impact preview.
        </div>
      </footer>
    </div>
  );

  function RiskTile({ title, value, icon, tone }: { title: string; value: string; icon: React.ReactNode; tone: any }) {
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

  function ImpactTile({ title, value, icon, tone }: { title: string; value: string; icon: React.ReactNode; tone: any }) {
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
