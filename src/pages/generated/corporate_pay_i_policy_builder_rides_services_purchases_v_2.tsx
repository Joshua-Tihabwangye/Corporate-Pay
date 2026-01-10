import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BadgeCheck,
  Check,
  ChevronRight,
  FileText,
  Filter,
  HelpCircle,
  Layers,
  MapPin,
  Play,
  Plus,
  Search,
  Shield,
  Sparkles,
  Store,
  Ticket,
  Timer,
  Trash2,
  Users,
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

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function formatUGX(n: number) {
  const v = Math.round(Number(n || 0));
  return `UGX ${v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

type Tone = "good" | "warn" | "bad" | "info" | "neutral";

function Pill({ label, tone = "neutral" }: { label: string; tone?: Tone }) {
  const map: Record<Tone, string> = {
    good: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    warn: "bg-amber-50 text-amber-800 ring-amber-200",
    bad: "bg-rose-50 text-rose-700 ring-rose-200",
    info: "bg-blue-50 text-blue-700 ring-blue-200",
    neutral: "bg-slate-50 text-slate-700 ring-slate-200",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1", map[tone])}>{label}</span>
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
          "mt-2 w-full rounded-2xl border px-3 py-2.5 text-sm font-semibold shadow-sm outline-none focus:ring-4",
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
          "mt-2 w-full rounded-2xl border px-3 py-2.5 text-sm font-semibold shadow-sm outline-none focus:ring-4",
          disabled ? "border-slate-200 bg-slate-50 text-slate-500" : "border-slate-200 bg-white text-slate-900 focus:ring-emerald-100"
        )}
      />
    </div>
  );
}

function Toggle({ enabled, onChange, label, description, disabled }: { enabled: boolean; onChange: (v: boolean) => void; label: string; description?: string; disabled?: boolean }) {
  return (
    <div className={cn("flex items-start justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-4", disabled && "opacity-70")}>
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
        <span className={cn("absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition", enabled ? "left-[22px]" : "left-1")} />
      </button>
    </div>
  );
}

function Chip({ label, onRemove, tone = "neutral" }: { label: string; onRemove?: () => void; tone?: Tone }) {
  const toneMap: Record<Tone, string> = {
    neutral: "bg-slate-50 text-slate-700 ring-slate-200",
    good: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    warn: "bg-amber-50 text-amber-800 ring-amber-200",
    bad: "bg-rose-50 text-rose-700 ring-rose-200",
    info: "bg-blue-50 text-blue-700 ring-blue-200",
  };
  return (
    <span className={cn("inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold ring-1", toneMap[tone])}>
      {label}
      {onRemove ? (
        <button type="button" className="rounded-full p-1 hover:bg-black/5" onClick={onRemove} aria-label={`Remove ${label}`}>
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </span>
  );
}

function Card({ title, subtitle, right, children }: { title: string; subtitle?: string; right?: React.ReactNode; children: React.ReactNode }) {
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

function OverrideToggle({ enabled, onToggle }: { enabled: boolean; onToggle: (v: boolean) => void }) {
  return (
    <div className="flex items-center gap-2">
      <Pill label={enabled ? "Override" : "Inherited"} tone={enabled ? "warn" : "neutral"} />
      <button
        type="button"
        className={cn("relative h-7 w-12 rounded-full border transition", enabled ? "border-emerald-300 bg-emerald-200" : "border-slate-200 bg-white")}
        onClick={() => onToggle(!enabled)}
        aria-label="Toggle override"
      >
        <span className={cn("absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition", enabled ? "left-[22px]" : "left-1")} />
      </button>
    </div>
  );
}

function ToastStack({
  toasts,
  onDismiss,
}: {
  toasts: Array<{ id: string; title: string; message?: string; kind: "success" | "warn" | "error" | "info" }>;
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

// Taxonomy

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

type Group = "Operations" | "Sales" | "Finance" | "Admin" | "Procurement";

type UserRow = { id: string; name: string; email: string; groupId: Group };

type GeoFence = { type: "City" | "Office Zone" | "Airport"; name: string };

type RidesPolicy = {
  categories: { standard: boolean; premium: boolean };
  geofences: GeoFence[];
  time: { start: string; end: string; days: string[] };
  purpose: { required: boolean; tags: string[] };
};

type PurchasesPolicy = {
  allowedModules: Record<ServiceModule, boolean>;
  allowedMarketplaces: Record<Marketplace, boolean>;
  vendorAllow: string[];
  vendorDeny: string[];
  categoriesDeny: string[];
  maxBasket: number;
  attachments: { required: boolean; threshold: number };
};

type Policy = { rides: RidesPolicy; purchases: PurchasesPolicy };

type PartialPolicy = Partial<{
  rides: Partial<RidesPolicy>;
  purchases: Partial<PurchasesPolicy>;
}>;

function mergePolicy(org: Policy, groupO?: PartialPolicy | null, userO?: PartialPolicy | null): Policy {
  const out = deepClone(org);

  const apply = (src?: PartialPolicy | null) => {
    if (!src) return;
    if (src.rides) {
      Object.keys(src.rides).forEach((k) => {
        // @ts-ignore
        out.rides[k] = deepClone(src.rides![k]);
      });
    }
    if (src.purchases) {
      Object.keys(src.purchases).forEach((k) => {
        // @ts-ignore
        out.purchases[k] = deepClone(src.purchases![k]);
      });
    }
  };

  apply(groupO);
  apply(userO);
  return out;
}

function hasOverride(o: PartialPolicy | undefined, section: "rides" | "purchases", key: string) {
  // @ts-ignore
  return !!o?.[section] && Object.prototype.hasOwnProperty.call(o[section]!, key);
}

function setOverride(o: PartialPolicy | undefined, section: "rides" | "purchases", key: string, value: any): PartialPolicy {
  const next: PartialPolicy = deepClone(o || {});
  // @ts-ignore
  next[section] = next[section] || {};
  // @ts-ignore
  next[section][key] = deepClone(value);
  return next;
}

function removeOverride(o: PartialPolicy | undefined, section: "rides" | "purchases", key: string): PartialPolicy {
  const next: PartialPolicy = deepClone(o || {});
  // @ts-ignore
  if (next[section] && Object.prototype.hasOwnProperty.call(next[section]!, key)) delete (next[section] as any)[key];
  return next;
}

function sourceForKey(org: Policy, groupO: PartialPolicy | null, userO: PartialPolicy | null, section: "rides" | "purchases", key: string) {
  if (userO && hasOverride(userO, section, key)) return "User";
  if (groupO && hasOverride(groupO, section, key)) return "Group";
  if (org && Object.prototype.hasOwnProperty.call(org[section] as any, key)) return "Org";
  return "Org";
}

function policyRecommendations(eff: Policy) {
  const recs: Array<{ title: string; body: string; tone: Tone }> = [];

  if (eff.rides.categories.premium) {
    recs.push({
      title: "Premium rides are enabled",
      body: "Consider requiring approvals for premium rides or restricting premium to Managers to reduce cost.",
      tone: "info",
    });
  }

  if (!eff.rides.purpose.required) {
    recs.push({
      title: "Purpose tags are not required",
      body: "Enable purpose tags to improve reconciliation and chargeback reporting.",
      tone: "info",
    });
  }

  if (eff.rides.geofences.length === 0) {
    recs.push({
      title: "No geofences configured",
      body: "Add allowed cities, office zones, and airports to prevent unauthorized trips.",
      tone: "warn",
    });
  }

  const allowedModules = Object.entries(eff.purchases.allowedModules).filter(([, on]) => on).map(([k]) => k);
  if (allowedModules.length === 0) {
    recs.push({
      title: "No service modules allowed",
      body: "Enable at least one module for purchases/services to use CorporatePay.",
      tone: "warn",
    });
  }

  const ecomAllowed = eff.purchases.allowedModules["E-Commerce"];
  const allowedMkts = Object.entries(eff.purchases.allowedMarketplaces).filter(([, on]) => on).map(([k]) => k);
  if (ecomAllowed && allowedMkts.length === 0) {
    recs.push({
      title: "E-Commerce is allowed but no marketplaces are allowed",
      body: "Enable MyLiveDealz and the marts you want to allow, or disable E-Commerce in purchase policy.",
      tone: "warn",
    });
  }

  if (ecomAllowed && eff.purchases.vendorAllow.length === 0) {
    recs.push({
      title: "No vendor allowlist",
      body: "Add preferred vendors to an allowlist for better control and negotiated pricing.",
      tone: "info",
    });
  }

  if (eff.purchases.maxBasket > 5_000_000) {
    recs.push({
      title: "High max basket size",
      body: "Consider lowering max basket size or routing baskets above threshold to approvals.",
      tone: "warn",
    });
  }

  if (eff.purchases.attachments.required && eff.purchases.attachments.threshold <= 0) {
    recs.push({
      title: "Attachments required but threshold is not set",
      body: "Set a threshold amount above which attachments are required.",
      tone: "warn",
    });
  }

  if (recs.length === 0) {
    recs.push({
      title: "Policy looks strong",
      body: "No critical recommendations right now. Use the simulator to test edge cases.",
      tone: "good",
    });
  }

  return recs;
}

type SimInput =
  | {
      type: "Ride";
      rideCategory: "standard" | "premium";
      day: string;
      time: string;
      origin: string;
      destination: string;
      purpose: string;
    }
  | {
      type: "Purchase";
      module: ServiceModule;
      marketplace: Marketplace | "-";
      vendor: string;
      category: string;
      total: number;
      attachmentsProvided: boolean;
    }
  | {
      type: "Service";
      module: ServiceModule;
      vendor: string;
      category: string;
      total: number;
      attachmentsProvided: boolean;
    };

function simulateDecision(eff: Policy, input: SimInput) {
  const ok = (reason: string, nextStep: string) => ({ status: "Allowed" as const, reason, nextStep });
  const block = (reason: string, nextStep: string) => ({ status: "Blocked" as const, reason, nextStep });
  const approve = (reason: string, nextStep: string) => ({ status: "Requires approval" as const, reason, nextStep });

  if (input.type === "Ride") {
    if (!eff.rides.categories[input.rideCategory]) {
      return block("Ride category is not allowed by policy.", "Choose an allowed category or request an exception.");
    }

    if (eff.rides.geofences.length) {
      const allowedNames = eff.rides.geofences.map((g) => g.name.toLowerCase());
      const originOk = allowedNames.includes(String(input.origin).toLowerCase());
      const destOk = allowedNames.includes(String(input.destination).toLowerCase());
      if (!originOk || !destOk) {
        return block("Origin or destination is outside allowed geofences.", "Update geofences or use personal payment.");
      }
    }

    const days = eff.rides.time.days || [];
    if (days.length && !days.includes(input.day)) {
      return approve("Ride is outside allowed days.", "Route to manager approval or reschedule.");
    }

    const t = input.time;
    const start = eff.rides.time.start;
    const end = eff.rides.time.end;
    if (start && end && (t < start || t > end)) {
      return approve("Ride is outside allowed working hours.", "Route to approval or reschedule.");
    }

    if (eff.rides.purpose.required && !String(input.purpose || "").trim()) {
      return block("Purpose tag is required.", "Select a purpose tag and try again.");
    }

    return ok("Ride meets policy requirements.", "Proceed to checkout.");
  }

  if (input.type === "Purchase") {
    if (!eff.purchases.allowedModules[input.module]) {
      return block("Service module is not allowed.", "Choose an allowed module or use personal payment.");
    }

    if (input.module === "E-Commerce") {
      if (input.marketplace === "-") return block("Marketplace is required for E-Commerce purchases.", "Select a marketplace.");
      if (!eff.purchases.allowedMarketplaces[input.marketplace as Marketplace]) {
        return block("Marketplace is not allowed.", "Choose an allowed marketplace or request an exception.");
      }
    }

    const vendor = String(input.vendor || "").trim();
    if (!vendor) return block("Vendor is required.", "Select a vendor.");

    if (eff.purchases.vendorDeny.map((v) => v.toLowerCase()).includes(vendor.toLowerCase())) {
      return block("Vendor is denied by policy.", "Choose an approved vendor.");
    }

    if (eff.purchases.vendorAllow.length > 0) {
      const allow = eff.purchases.vendorAllow.map((v) => v.toLowerCase());
      if (!allow.includes(vendor.toLowerCase())) {
        return block("Vendor is not in allowlist.", "Choose an allowlisted vendor or request vendor approval.");
      }
    }

    const cat = String(input.category || "").trim();
    if (cat && eff.purchases.categoriesDeny.map((c) => c.toLowerCase()).includes(cat.toLowerCase())) {
      return block("Category is restricted.", "Remove restricted items or request exception.");
    }

    const total = Number(input.total || 0);

    if (eff.purchases.attachments.required && total >= eff.purchases.attachments.threshold) {
      if (!input.attachmentsProvided) {
        return block("Attachments are required above threshold.", "Attach required documents then retry.");
      }
    }

    if (total > eff.purchases.maxBasket) {
      return approve("Basket total exceeds max basket size.", "Route to approvals or reduce basket size.");
    }

    return ok("Purchase meets policy requirements.", "Proceed to checkout.");
  }

  // Service
  if (!eff.purchases.allowedModules[input.module]) {
    return block("Service module is not allowed.", "Choose an allowed module or use personal payment.");
  }

  const vendor = String(input.vendor || "").trim();
  if (!vendor) return block("Vendor is required.", "Select a vendor.");

  if (eff.purchases.vendorDeny.map((v) => v.toLowerCase()).includes(vendor.toLowerCase())) {
    return block("Vendor is denied by policy.", "Choose an approved vendor.");
  }

  if (eff.purchases.vendorAllow.length > 0) {
    const allow = eff.purchases.vendorAllow.map((v) => v.toLowerCase());
    if (!allow.includes(vendor.toLowerCase())) {
      return block("Vendor is not in allowlist.", "Choose an allowlisted vendor or request vendor approval.");
    }
  }

  const cat = String(input.category || "").trim();
  if (cat && eff.purchases.categoriesDeny.map((c) => c.toLowerCase()).includes(cat.toLowerCase())) {
    return block("Category is restricted.", "Remove restricted items or request exception.");
  }

  const total = Number(input.total || 0);

  if (eff.purchases.attachments.required && total >= eff.purchases.attachments.threshold) {
    if (!input.attachmentsProvided) {
      return block("Attachments are required above threshold.", "Attach required documents then retry.");
    }
  }

  if (total > eff.purchases.maxBasket) {
    return approve("Amount exceeds max basket size.", "Route to approvals or reduce scope.");
  }

  return ok("Service booking meets policy requirements.", "Proceed to booking.");
}

export default function CorporatePayPolicyBuilderI_V2() {
  // Toasts
  const [toasts, setToasts] = useState<Array<{ id: string; title: string; message?: string; kind: "success" | "warn" | "error" | "info" }>>([]);
  const toast = (t: { title: string; message?: string; kind: "success" | "warn" | "error" | "info" }) => {
    const id = uid("toast");
    setToasts((p) => [{ id, ...t }, ...p].slice(0, 4));
    window.setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 3200);
  };

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

  const GROUPS: Array<{ id: Group; name: string }> = [
    { id: "Operations", name: "Operations" },
    { id: "Sales", name: "Sales" },
    { id: "Finance", name: "Finance" },
    { id: "Admin", name: "Admin" },
    { id: "Procurement", name: "Procurement" },
  ];

  const USERS: UserRow[] = [
    { id: "U-1001", name: "Mary N.", email: "mary@acme.com", groupId: "Operations" },
    { id: "U-1002", name: "Finance Desk", email: "finance@acme.com", groupId: "Finance" },
    { id: "U-1003", name: "John S.", email: "john@acme.com", groupId: "Sales" },
    { id: "U-1004", name: "Admin Team", email: "admin@acme.com", groupId: "Admin" },
    { id: "U-1005", name: "Procurement Desk", email: "procurement@acme.com", groupId: "Procurement" },
  ];

  // Tabs
  const [tab, setTab] = useState<"builder" | "inheritance" | "simulator" | "recommendations" | "impact">("builder");

  // Scope
  const [scope, setScope] = useState<"Org" | "Group" | "User">("Org");
  const [groupId, setGroupId] = useState<Group>("Operations");
  const [userId, setUserId] = useState<string>(USERS[0].id);

  useEffect(() => {
    if (scope === "User") {
      const u = USERS.find((x) => x.id === userId);
      if (u) setGroupId(u.groupId);
    }
  }, [scope, userId, USERS]);

  // Base org policy
  const [orgPolicy, setOrgPolicy] = useState<Policy>(() => {
    const allowedModules: Record<ServiceModule, boolean> = {} as any;
    SERVICE_MODULES.forEach((m) => (allowedModules[m] = m !== "Green Investments"));

    const allowedMarketplaces: Record<Marketplace, boolean> = {} as any;
    MARKETPLACES.forEach((m) => (allowedMarketplaces[m] = m !== "Other Marketplace"));

    return {
      rides: {
        categories: { standard: true, premium: true },
        geofences: [
          { type: "City", name: "Kampala" },
          { type: "Airport", name: "Entebbe Airport" },
          { type: "Office Zone", name: "HQ" },
        ],
        time: { start: "06:00", end: "22:00", days: ["Mon", "Tue", "Wed", "Thu", "Fri"] },
        purpose: { required: true, tags: ["Airport", "Client meeting", "Office commute", "Site visit"] },
      },
      purchases: {
        allowedModules,
        allowedMarketplaces,
        vendorAllow: ["Kampala Office Mart", "Shenzhen Store", "City Courier"],
        vendorDeny: ["Unknown Vendor"],
        categoriesDeny: ["Alcohol"],
        maxBasket: 5_000_000,
        attachments: { required: true, threshold: 2_000_000 },
      },
    };
  });

  // Partial overrides
  const [groupOverrides, setGroupOverrides] = useState<Record<Group, PartialPolicy>>(() => ({
    Sales: { rides: { categories: { standard: true, premium: false } } },
  }));

  const [userOverrides, setUserOverrides] = useState<Record<string, PartialPolicy>>(() => ({
    "U-1002": { purchases: { maxBasket: 12_000_000, attachments: { required: true, threshold: 5_000_000 } } },
  }));

  // Published snapshot
  const publishedRef = useRef<{ orgPolicy: Policy; groupOverrides: Record<Group, PartialPolicy>; userOverrides: Record<string, PartialPolicy>; publishedAt: string; note?: string }>(
    {
      orgPolicy: deepClone(orgPolicy),
      groupOverrides: deepClone(groupOverrides),
      userOverrides: deepClone(userOverrides),
      publishedAt: new Date().toISOString(),
    }
  );

  useEffect(() => {
    // keep initial snapshot aligned on first render
    publishedRef.current = {
      orgPolicy: deepClone(orgPolicy),
      groupOverrides: deepClone(groupOverrides),
      userOverrides: deepClone(userOverrides),
      publishedAt: publishedRef.current.publishedAt || new Date().toISOString(),
      note: publishedRef.current.note,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentGroup = useMemo(() => GROUPS.find((g) => g.id === groupId) || GROUPS[0], [GROUPS, groupId]);
  const currentUser = useMemo(() => USERS.find((u) => u.id === userId) || USERS[0], [USERS, userId]);

  const groupO = useMemo(() => (scope === "Group" || scope === "User" ? groupOverrides[groupId] || null : null), [scope, groupId, groupOverrides]);
  const userO = useMemo(() => (scope === "User" ? userOverrides[userId] || null : null), [scope, userId, userOverrides]);

  const effective = useMemo(() => mergePolicy(orgPolicy, groupO, userO), [orgPolicy, groupO, userO]);

  const showOverrideControls = scope !== "Org";

  const scopeLabel = useMemo(() => {
    if (scope === "Org") return "Organization policy";
    if (scope === "Group") return `Group override: ${currentGroup.name}`;
    return `User override: ${currentUser.name}`;
  }, [scope, currentGroup, currentUser]);

  const currentOverrides = useMemo(() => {
    if (scope === "Org") return null;
    if (scope === "Group") return groupOverrides[groupId] || {};
    return userOverrides[userId] || {};
  }, [scope, groupOverrides, groupId, userOverrides, userId]);

  const isOverridden = (section: "rides" | "purchases", key: string) => {
    if (scope === "Org") return true;
    return hasOverride(currentOverrides || {}, section, key);
  };

  const toggleOverrideFor = (section: "rides" | "purchases", key: string, enable: boolean) => {
    if (scope === "Org") return;

    const applyTo = (id: string, setFn: any) => {
      setFn((prev: any) => {
        const next = deepClone(prev);
        const cur = next[id] || {};
        if (enable) {
          const effectiveVal = (effective as any)[section][key];
          next[id] = setOverride(cur, section, key, effectiveVal);
        } else {
          next[id] = removeOverride(cur, section, key);
        }
        return next;
      });
    };

    if (scope === "Group") {
      applyTo(groupId, setGroupOverrides);
    } else if (scope === "User") {
      applyTo(userId, setUserOverrides);
    }
  };

  const setSectionField = (section: "rides" | "purchases", key: string, value: any) => {
    if (scope === "Org") {
      if (section === "rides") setOrgPolicy((p) => ({ ...p, rides: { ...p.rides, [key]: deepClone(value) } as any }));
      else setOrgPolicy((p) => ({ ...p, purchases: { ...p.purchases, [key]: deepClone(value) } as any }));
      return;
    }

    if (!isOverridden(section, key)) return;

    if (scope === "Group") {
      setGroupOverrides((prev) => ({
        ...prev,
        [groupId]: setOverride(prev[groupId], section, key, value),
      }));
    }

    if (scope === "User") {
      setUserOverrides((prev) => ({
        ...prev,
        [userId]: setOverride(prev[userId], section, key, value),
      }));
    }
  };

  const publishNoteRef = useRef("");

  const publish = () => {
    publishedRef.current = {
      orgPolicy: deepClone(orgPolicy),
      groupOverrides: deepClone(groupOverrides),
      userOverrides: deepClone(userOverrides),
      publishedAt: new Date().toISOString(),
      note: publishNoteRef.current,
    };
    publishNoteRef.current = "";
    toast({ title: "Published", message: "Policy published. Impact compares against last published.", kind: "success" });
  };

  const resetToPublished = () => {
    const v = publishedRef.current;
    setOrgPolicy(deepClone(v.orgPolicy));
    setGroupOverrides(deepClone(v.groupOverrides));
    setUserOverrides(deepClone(v.userOverrides));
    toast({ title: "Reverted", message: "Reverted to last published version.", kind: "info" });
  };

  // Builder helpers
  const [geoType, setGeoType] = useState<GeoFence["type"]>("City");
  const [geoName, setGeoName] = useState("");
  const [purposeNew, setPurposeNew] = useState("");

  const [vendorNew, setVendorNew] = useState("");
  const [vendorMode, setVendorMode] = useState<"allow" | "deny">("allow");

  const [catNew, setCatNew] = useState("");

  // Simulator
  const [simUserId, setSimUserId] = useState(USERS[0].id);
  const simUser = useMemo(() => USERS.find((u) => u.id === simUserId) || USERS[0], [USERS, simUserId]);
  const simGroupO = useMemo(() => groupOverrides[simUser.groupId] || null, [groupOverrides, simUser]);
  const simUserO = useMemo(() => userOverrides[simUser.id] || null, [userOverrides, simUser]);
  const simEffective = useMemo(() => mergePolicy(orgPolicy, simGroupO, simUserO), [orgPolicy, simGroupO, simUserO]);

  const [simType, setSimType] = useState<"Ride" | "Purchase" | "Service">("Ride");

  const [simRideCategory, setSimRideCategory] = useState<"standard" | "premium">("standard");
  const [simDay, setSimDay] = useState("Mon");
  const [simTime, setSimTime] = useState("09:00");
  const [simOrigin, setSimOrigin] = useState("Kampala");
  const [simDestination, setSimDestination] = useState("HQ");
  const [simPurpose, setSimPurpose] = useState("Client meeting");

  const [simModule, setSimModule] = useState<ServiceModule>("E-Commerce");
  const [simMarketplace, setSimMarketplace] = useState<Marketplace>("MyLiveDealz");
  const [simVendor, setSimVendor] = useState("Kampala Office Mart");
  const [simCategory, setSimCategory] = useState("Office supplies");
  const [simTotal, setSimTotal] = useState(1_200_000);
  const [simAttachments, setSimAttachments] = useState(false);

  const simInput: SimInput = useMemo(() => {
    if (simType === "Ride") {
      return {
        type: "Ride",
        rideCategory: simRideCategory,
        day: simDay,
        time: simTime,
        origin: simOrigin,
        destination: simDestination,
        purpose: simPurpose,
      };
    }

    if (simType === "Purchase") {
      return {
        type: "Purchase",
        module: simModule,
        marketplace: simModule === "E-Commerce" ? simMarketplace : "-",
        vendor: simVendor,
        category: simCategory,
        total: simTotal,
        attachmentsProvided: simAttachments,
      };
    }

    return {
      type: "Service",
      module: simModule,
      vendor: simVendor,
      category: simCategory,
      total: simTotal,
      attachmentsProvided: simAttachments,
    };
  }, [simType, simRideCategory, simDay, simTime, simOrigin, simDestination, simPurpose, simModule, simMarketplace, simVendor, simCategory, simTotal, simAttachments]);

  const simResult = useMemo(() => simulateDecision(simEffective, simInput), [simEffective, simInput]);

  // Recommendations
  const recs = useMemo(() => policyRecommendations(effective), [effective]);

  // Impact preview (draft vs last published)
  const impact = useMemo(() => {
    const base = publishedRef.current;

    const affectedUsers = (() => {
      if (scope === "Org") return USERS;
      if (scope === "Group") return USERS.filter((u) => u.groupId === groupId);
      return USERS.filter((u) => u.id === userId);
    })();

    const fields: Array<["rides" | "purchases", string]> = [
      ["rides", "categories"],
      ["rides", "geofences"],
      ["rides", "time"],
      ["rides", "purpose"],
      ["purchases", "allowedModules"],
      ["purchases", "allowedMarketplaces"],
      ["purchases", "vendorAllow"],
      ["purchases", "vendorDeny"],
      ["purchases", "categoriesDeny"],
      ["purchases", "maxBasket"],
      ["purchases", "attachments"],
    ];

    const diffs: Array<{ user: UserRow; changed: string[] }> = [];

    const tests: SimInput[] = [
      { type: "Ride", rideCategory: "premium", day: "Tue", time: "20:00", origin: "Kampala", destination: "HQ", purpose: "Client meeting" },
      { type: "Ride", rideCategory: "standard", day: "Sun", time: "09:00", origin: "Kampala", destination: "HQ", purpose: "Office commute" },
      { type: "Purchase", module: "E-Commerce", marketplace: "MyLiveDealz", vendor: "Shenzhen Store", category: "Office supplies", total: 8_000_000, attachmentsProvided: true },
      { type: "Purchase", module: "E-Commerce", marketplace: "ServiceMart", vendor: "Unknown Vendor", category: "Alcohol", total: 200_000, attachmentsProvided: false },
      { type: "Service", module: "EVs & Charging", vendor: "City Courier", category: "Service", total: 2_500_000, attachmentsProvided: false },
    ];

    const behavior = [] as Array<{ user: UserRow; changedDecisions: number }>;

    affectedUsers.forEach((u) => {
      const publishedEffective = mergePolicy(
        base.orgPolicy,
        base.groupOverrides[u.groupId] || null,
        base.userOverrides[u.id] || null
      );

      const currentEffective = mergePolicy(
        orgPolicy,
        groupOverrides[u.groupId] || null,
        userOverrides[u.id] || null
      );

      const changed = fields
        .map(([s, k]) => {
          const a = JSON.stringify((publishedEffective as any)[s][k]);
          const b = JSON.stringify((currentEffective as any)[s][k]);
          return a !== b ? `${s}.${k}` : null;
        })
        .filter(Boolean) as string[];

      if (changed.length) diffs.push({ user: u, changed });

      let cd = 0;
      tests.forEach((t) => {
        const a = simulateDecision(publishedEffective, t).status;
        const b = simulateDecision(currentEffective, t).status;
        if (a !== b) cd += 1;
      });
      behavior.push({ user: u, changedDecisions: cd });
    });

    const totalChangedDecisions = behavior.reduce((a, b) => a + b.changedDecisions, 0);

    return {
      totalAffected: affectedUsers.length,
      changedUsers: diffs.length,
      totalChangedDecisions,
      diffs,
      behavior,
      publishedAt: base.publishedAt,
      note: base.note || "",
    };
  }, [scope, groupId, userId, USERS, orgPolicy, groupOverrides, userOverrides]);

  // Inheritance table view
  const [inspectUserId, setInspectUserId] = useState(USERS[0].id);
  const inspectUser = useMemo(() => USERS.find((u) => u.id === inspectUserId) || USERS[0], [USERS, inspectUserId]);
  const inspectGroupO = useMemo(() => groupOverrides[inspectUser.groupId] || null, [groupOverrides, inspectUser]);
  const inspectUserO = useMemo(() => userOverrides[inspectUser.id] || null, [userOverrides, inspectUser]);
  const inspectEffective = useMemo(() => mergePolicy(orgPolicy, inspectGroupO, inspectUserO), [orgPolicy, inspectGroupO, inspectUserO]);

  const fieldsForInheritance: Array<["rides" | "purchases", string]> = [
    ["rides", "categories"],
    ["rides", "geofences"],
    ["rides", "time"],
    ["rides", "purpose"],
    ["purchases", "allowedModules"],
    ["purchases", "allowedMarketplaces"],
    ["purchases", "vendorAllow"],
    ["purchases", "vendorDeny"],
    ["purchases", "categoriesDeny"],
    ["purchases", "maxBasket"],
    ["purchases", "attachments"],
  ];

  // Small helpers for chips
  const allowedModulesOn = Object.entries(effective.purchases.allowedModules).filter(([, on]) => on).map(([k]) => k as ServiceModule);
  const allowedMarketplacesOn = Object.entries(effective.purchases.allowedMarketplaces).filter(([, on]) => on).map(([k]) => k as Marketplace);

  return (
    <div className="min-h-screen" style={{ background: "radial-gradient(90% 60% at 50% 0%, rgba(3,205,140,0.18), rgba(255,255,255,0))" }}>
      <ToastStack toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((x) => x.id !== id))} />

      <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-6">
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(2,8,23,0.12)]">
          {/* Header */}
          <div className="border-b border-slate-200 bg-white">
            <div className="flex flex-col gap-3 px-4 py-4 md:flex-row md:items-start md:justify-between md:px-6">
              <div className="flex items-start gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl text-white" style={{ background: EVZ.green }}>
                  <Shield className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">Policy Builder (Rides, Services and Purchases)</div>
                  <div className="mt-1 text-xs text-slate-500">Inheritance: Org → Group → User. Simulator, recommendations, and impact preview included.</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Pill label={scopeLabel} tone={scope === "Org" ? "info" : "warn"} />
                    <Pill label={`Allowed modules: ${allowedModulesOn.length}`} tone="neutral" />
                    <Pill label={`Allowed marketplaces: ${allowedMarketplacesOn.length}`} tone="neutral" />
                    <Pill label={`Published: ${new Date(publishedRef.current.publishedAt).toLocaleDateString()}`} tone="neutral" />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={resetToPublished}>
                  <Trash2 className="h-4 w-4" /> Revert
                </Button>
                <Button variant="outline" onClick={() => toast({ title: "Saved", message: "Draft saved (demo).", kind: "success" })}>
                  <Check className="h-4 w-4" /> Save draft
                </Button>
                <Button variant="primary" onClick={publish}>
                  <BadgeCheck className="h-4 w-4" /> Publish
                </Button>
              </div>
            </div>

            {/* Tabs */}
            <div className="px-4 pb-4 md:px-6">
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "builder", label: "Builder" },
                  { id: "inheritance", label: "Inheritance" },
                  { id: "simulator", label: "Simulator" },
                  { id: "recommendations", label: "Recommendations" },
                  { id: "impact", label: "Impact" },
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
          </div>

          {/* Body */}
          <div className="bg-slate-50 px-4 py-5 md:px-6">
            {tab === "builder" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                {/* Scope */}
                <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Policy scope</div>
                      <div className="mt-1 text-xs text-slate-500">Edit org policy or apply group/user overrides.</div>
                    </div>
                    <Pill label={scope} tone={scope === "Org" ? "info" : "warn"} />
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-white p-1 ring-1 ring-slate-200">
                    {(["Org", "Group", "User"] as const).map((s) => (
                      <button
                        key={s}
                        className={cn("rounded-xl px-3 py-2 text-sm font-semibold", scope === s ? "text-white" : "text-slate-700 hover:bg-slate-50")}
                        style={scope === s ? { background: EVZ.green } : undefined}
                        onClick={() => setScope(s)}
                      >
                        {s}
                      </button>
                    ))}
                  </div>

                  {scope !== "Org" ? (
                    <div className="mt-4 space-y-3">
                      <div>
                        <div className="text-xs font-semibold text-slate-600">Group</div>
                        <select
                          value={groupId}
                          disabled={scope === "User"}
                          onChange={(e) => setGroupId(e.target.value as Group)}
                          className={cn(
                            "mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-emerald-100",
                            scope === "User" && "bg-slate-50 text-slate-500"
                          )}
                        >
                          {GROUPS.map((g) => (
                            <option key={g.id} value={g.id}>
                              {g.name}
                            </option>
                          ))}
                        </select>
                        {scope === "User" ? <div className="mt-1 text-xs text-slate-500">Group is derived from selected user.</div> : null}
                      </div>

                      <div>
                        <div className="text-xs font-semibold text-slate-600">User</div>
                        <select
                          value={userId}
                          disabled={scope !== "User"}
                          onChange={(e) => setUserId(e.target.value)}
                          className={cn(
                            "mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-emerald-100",
                            scope !== "User" && "bg-slate-50 text-slate-500"
                          )}
                        >
                          {USERS.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name} ({u.email})
                            </option>
                          ))}
                        </select>
                        {scope !== "User" ? <div className="mt-1 text-xs text-slate-500">Switch to User scope to override user policy.</div> : null}
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-700">
                        <div className="font-semibold">Inheritance</div>
                        <div className="mt-2 text-xs text-slate-600">User overrides override Group overrides override Org policy.</div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700">
                      Organization policy is the default for all users unless overridden.
                    </div>
                  )}

                  <div className="mt-4">
                    <div className="text-xs font-semibold text-slate-600">Publish note (optional)</div>
                    <textarea
                      defaultValue={""}
                      onChange={(e) => (publishNoteRef.current = e.target.value)}
                      placeholder="Example: restrict premium rides for Sales; require attachments above 2M."
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-900 shadow-sm outline-none focus:ring-4 focus:ring-emerald-100"
                      rows={3}
                    />
                  </div>

                  <div className="mt-4 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                    Tip: enable overrides only where needed. Keep most rules at Org or Group for consistency.
                  </div>
                </div>

                {/* Editor */}
                <div className="lg:col-span-2 space-y-4">
                  <Card title="Rides and Logistics policy" subtitle="Categories, geofences, time windows, and purpose tags." right={<Pill label={scopeLabel} tone={scope === "Org" ? "info" : "warn"} />}>
                    {/* Categories */}
                    <div className="rounded-3xl border border-slate-200 bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">Allowed ride categories</div>
                          <div className="mt-1 text-xs text-slate-500">Standard and Premium.</div>
                        </div>
                        {showOverrideControls ? <OverrideToggle enabled={isOverridden("rides", "categories")} onToggle={(v) => toggleOverrideFor("rides", "categories", v)} /> : null}
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {([
                          { key: "standard", label: "Standard" },
                          { key: "premium", label: "Premium" },
                        ] as const).map((c) => {
                          const on = effective.rides.categories[c.key];
                          const locked = showOverrideControls && !isOverridden("rides", "categories");
                          return (
                            <button
                              key={c.key}
                              type="button"
                              disabled={locked}
                              className={cn(
                                "rounded-full px-4 py-2 text-sm font-semibold ring-1 transition",
                                on ? "text-white ring-emerald-600" : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50",
                                locked && "opacity-60 cursor-not-allowed"
                              )}
                              style={on ? { background: EVZ.green } : undefined}
                              onClick={() => {
                                const next = deepClone(effective.rides.categories);
                                next[c.key] = !next[c.key];
                                setSectionField("rides", "categories", next);
                              }}
                            >
                              {c.label}
                            </button>
                          );
                        })}
                      </div>
                      {showOverrideControls && !isOverridden("rides", "categories") ? (
                        <div className="mt-2 text-xs text-slate-500">Enable override to edit.</div>
                      ) : null}
                    </div>

                    {/* Geofences */}
                    <div className="rounded-3xl border border-slate-200 bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">Geofences</div>
                          <div className="mt-1 text-xs text-slate-500">Allowed cities, office zones, and airports.</div>
                        </div>
                        {showOverrideControls ? <OverrideToggle enabled={isOverridden("rides", "geofences")} onToggle={(v) => toggleOverrideFor("rides", "geofences", v)} /> : null}
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {effective.rides.geofences.map((g, idx) => {
                          const locked = showOverrideControls && !isOverridden("rides", "geofences");
                          return (
                            <Chip
                              key={`${g.type}-${g.name}-${idx}`}
                              label={`${g.type}: ${g.name}`}
                              tone={g.type === "Airport" ? "info" : g.type === "Office Zone" ? "good" : "neutral"}
                              onRemove={
                                locked
                                  ? undefined
                                  : () => {
                                      const next = effective.rides.geofences.filter((_, i) => i !== idx);
                                      setSectionField("rides", "geofences", next);
                                    }
                              }
                            />
                          );
                        })}
                        {!effective.rides.geofences.length ? <Pill label="No geofences" tone="warn" /> : null}
                      </div>

                      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                        <div>
                          <div className="text-xs font-semibold text-slate-600">Type</div>
                          <select
                            value={geoType}
                            disabled={showOverrideControls && !isOverridden("rides", "geofences")}
                            onChange={(e) => setGeoType(e.target.value as any)}
                            className={cn(
                              "mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-emerald-100",
                              showOverrideControls && !isOverridden("rides", "geofences") && "bg-slate-50 text-slate-500"
                            )}
                          >
                            {(["City", "Office Zone", "Airport"] as const).map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <Field
                            label="Name"
                            value={geoName}
                            onChange={setGeoName}
                            placeholder="Example: Kampala"
                            disabled={showOverrideControls && !isOverridden("rides", "geofences")}
                          />
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            const locked = showOverrideControls && !isOverridden("rides", "geofences");
                            if (locked) return;
                            const name = geoName.trim();
                            if (!name) {
                              toast({ title: "Missing name", message: "Enter a geofence name.", kind: "warn" });
                              return;
                            }
                            setSectionField("rides", "geofences", [...effective.rides.geofences, { type: geoType, name }]);
                            setGeoName("");
                          }}
                        >
                          <Plus className="h-4 w-4" /> Add
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            const locked = showOverrideControls && !isOverridden("rides", "geofences");
                            if (locked) return;
                            setSectionField("rides", "geofences", [
                              { type: "City", name: "Kampala" },
                              { type: "City", name: "Entebbe" },
                              { type: "Airport", name: "Entebbe Airport" },
                              { type: "Office Zone", name: "HQ" },
                            ]);
                            toast({ title: "Presets", message: "Geofences presets applied.", kind: "info" });
                          }}
                        >
                          <Sparkles className="h-4 w-4" /> Presets
                        </Button>
                      </div>
                      {showOverrideControls && !isOverridden("rides", "geofences") ? (
                        <div className="mt-2 text-xs text-slate-500">Enable override to edit.</div>
                      ) : null}
                    </div>

                    {/* Time */}
                    <div className="rounded-3xl border border-slate-200 bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">Time windows</div>
                          <div className="mt-1 text-xs text-slate-500">Working hours and allowed days.</div>
                        </div>
                        {showOverrideControls ? <OverrideToggle enabled={isOverridden("rides", "time")} onToggle={(v) => toggleOverrideFor("rides", "time", v)} /> : null}
                      </div>

                      <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
                        <Field
                          label="Start"
                          value={effective.rides.time.start}
                          onChange={(v) => setSectionField("rides", "time", { ...effective.rides.time, start: v })}
                          type="time"
                          disabled={showOverrideControls && !isOverridden("rides", "time")}
                        />
                        <Field
                          label="End"
                          value={effective.rides.time.end}
                          onChange={(v) => setSectionField("rides", "time", { ...effective.rides.time, end: v })}
                          type="time"
                          disabled={showOverrideControls && !isOverridden("rides", "time")}
                        />
                      </div>

                      <div className="mt-3">
                        <div className="text-xs font-semibold text-slate-600">Allowed days</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {"Mon,Tue,Wed,Thu,Fri,Sat,Sun".split(",").map((d) => {
                            const on = effective.rides.time.days.includes(d);
                            const locked = showOverrideControls && !isOverridden("rides", "time");
                            return (
                              <button
                                key={d}
                                type="button"
                                disabled={locked}
                                className={cn(
                                  "rounded-full px-4 py-2 text-sm font-semibold ring-1 transition",
                                  on ? "text-white ring-emerald-600" : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50",
                                  locked && "opacity-60 cursor-not-allowed"
                                )}
                                style={on ? { background: EVZ.green } : undefined}
                                onClick={() => {
                                  const days = on ? effective.rides.time.days.filter((x) => x !== d) : [...effective.rides.time.days, d];
                                  setSectionField("rides", "time", { ...effective.rides.time, days });
                                }}
                              >
                                {d}
                              </button>
                            );
                          })}
                        </div>
                        {showOverrideControls && !isOverridden("rides", "time") ? <div className="mt-2 text-xs text-slate-500">Enable override to edit.</div> : null}
                      </div>
                    </div>

                    {/* Purpose */}
                    <div className="rounded-3xl border border-slate-200 bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">Purpose tags</div>
                          <div className="mt-1 text-xs text-slate-500">Require purpose and define allowed tags.</div>
                        </div>
                        {showOverrideControls ? <OverrideToggle enabled={isOverridden("rides", "purpose")} onToggle={(v) => toggleOverrideFor("rides", "purpose", v)} /> : null}
                      </div>

                      <div className="mt-3">
                        <Toggle
                          enabled={effective.rides.purpose.required}
                          disabled={showOverrideControls && !isOverridden("rides", "purpose")}
                          onChange={(v) => setSectionField("rides", "purpose", { ...effective.rides.purpose, required: v })}
                          label="Require purpose at checkout"
                          description="Improves reconciliation and chargeback attribution."
                        />
                      </div>

                      <div className="mt-3">
                        <div className="text-xs font-semibold text-slate-600">Allowed purposes</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {effective.rides.purpose.tags.map((t, idx) => (
                            <Chip
                              key={`${t}-${idx}`}
                              label={t}
                              onRemove={
                                showOverrideControls && !isOverridden("rides", "purpose")
                                  ? undefined
                                  : () => {
                                      const next = effective.rides.purpose.tags.filter((_, i) => i !== idx);
                                      setSectionField("rides", "purpose", { ...effective.rides.purpose, tags: next });
                                    }
                              }
                            />
                          ))}
                          {!effective.rides.purpose.tags.length ? <Pill label="No purposes" tone="warn" /> : null}
                        </div>

                        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                          <div className="md:col-span-2">
                            <Field
                              label="Add purpose"
                              value={purposeNew}
                              onChange={setPurposeNew}
                              placeholder="Example: Airport"
                              disabled={showOverrideControls && !isOverridden("rides", "purpose")}
                            />
                          </div>
                          <div className="flex items-end">
                            <Button
                              variant="outline"
                              className="w-full"
                              onClick={() => {
                                const locked = showOverrideControls && !isOverridden("rides", "purpose");
                                if (locked) return;
                                const v = purposeNew.trim();
                                if (!v) {
                                  toast({ title: "Missing purpose", message: "Enter a purpose tag.", kind: "warn" });
                                  return;
                                }
                                setSectionField("rides", "purpose", { ...effective.rides.purpose, tags: [...effective.rides.purpose.tags, v] });
                                setPurposeNew("");
                              }}
                            >
                              <Plus className="h-4 w-4" /> Add
                            </Button>
                          </div>
                        </div>

                        {showOverrideControls && !isOverridden("rides", "purpose") ? <div className="mt-2 text-xs text-slate-500">Enable override to edit.</div> : null}
                      </div>
                    </div>
                  </Card>

                  <Card title="Purchases and Services policy" subtitle="Cross-module controls: modules, marketplaces, vendors, categories, basket size, and attachments." right={<Pill label={scopeLabel} tone={scope === "Org" ? "info" : "warn"} />}>
                    {/* Allowed modules */}
                    <div className="rounded-3xl border border-slate-200 bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">Allowed Service Modules</div>
                          <div className="mt-1 text-xs text-slate-500">Where CorporatePay can be used for purchases and services.</div>
                        </div>
                        {showOverrideControls ? <OverrideToggle enabled={isOverridden("purchases", "allowedModules")} onToggle={(v) => toggleOverrideFor("purchases", "allowedModules", v)} /> : null}
                      </div>

                      <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                        {SERVICE_MODULES.map((m) => {
                          const on = effective.purchases.allowedModules[m];
                          const locked = showOverrideControls && !isOverridden("purchases", "allowedModules");
                          return (
                            <button
                              key={m}
                              type="button"
                              disabled={locked}
                              className={cn(
                                "rounded-3xl border p-4 text-left transition",
                                on ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white hover:bg-slate-50",
                                locked && "opacity-60 cursor-not-allowed"
                              )}
                              onClick={() => {
                                const next = deepClone(effective.purchases.allowedModules);
                                next[m] = !next[m];
                                // if disabling E-Commerce here, marketplace controls become irrelevant
                                setSectionField("purchases", "allowedModules", next);
                              }}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="text-sm font-semibold text-slate-900">{m}</div>
                                  <div className="mt-1 text-xs text-slate-600">{on ? "Allowed" : "Not allowed"}</div>
                                </div>
                                <Pill label={on ? "On" : "Off"} tone={on ? "good" : "neutral"} />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      {showOverrideControls && !isOverridden("purchases", "allowedModules") ? <div className="mt-2 text-xs text-slate-500">Enable override to edit.</div> : null}
                    </div>

                    {/* Allowed marketplaces */}
                    <div className={cn("rounded-3xl border border-slate-200 bg-white p-4", !effective.purchases.allowedModules["E-Commerce"] && "opacity-70")}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">Allowed Marketplaces (E-Commerce)</div>
                          <div className="mt-1 text-xs text-slate-500">MyLiveDealz and marts, plus Other Marketplace.</div>
                        </div>
                        {showOverrideControls ? <OverrideToggle enabled={isOverridden("purchases", "allowedMarketplaces")} onToggle={(v) => toggleOverrideFor("purchases", "allowedMarketplaces", v)} /> : null}
                      </div>

                      {!effective.purchases.allowedModules["E-Commerce"] ? (
                        <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                          Enable E-Commerce in Allowed Service Modules to use marketplace controls.
                        </div>
                      ) : (
                        <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                          {MARKETPLACES.map((m) => {
                            const on = effective.purchases.allowedMarketplaces[m];
                            const locked = showOverrideControls && !isOverridden("purchases", "allowedMarketplaces");
                            return (
                              <button
                                key={m}
                                type="button"
                                disabled={locked}
                                className={cn(
                                  "rounded-3xl border p-4 text-left transition",
                                  on ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white hover:bg-slate-50",
                                  locked && "opacity-60 cursor-not-allowed"
                                )}
                                onClick={() => {
                                  const next = deepClone(effective.purchases.allowedMarketplaces);
                                  next[m] = !next[m];
                                  setSectionField("purchases", "allowedMarketplaces", next);
                                }}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <div className="text-sm font-semibold text-slate-900">{m}</div>
                                    <div className="mt-1 text-xs text-slate-600">{on ? "Allowed" : "Not allowed"}</div>
                                  </div>
                                  <Pill label={on ? "On" : "Off"} tone={on ? "good" : "neutral"} />
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {showOverrideControls && !isOverridden("purchases", "allowedMarketplaces") ? <div className="mt-2 text-xs text-slate-500">Enable override to edit.</div> : null}
                    </div>

                    {/* Vendor controls */}
                    <div className="rounded-3xl border border-slate-200 bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">Vendor allowlist and denylist</div>
                          <div className="mt-1 text-xs text-slate-500">Allow preferred vendors and block risky ones.</div>
                        </div>
                        {showOverrideControls ? (
                          <OverrideToggle
                            enabled={isOverridden("purchases", "vendorAllow") || isOverridden("purchases", "vendorDeny")}
                            onToggle={(v) => {
                              toggleOverrideFor("purchases", "vendorAllow", v);
                              toggleOverrideFor("purchases", "vendorDeny", v);
                            }}
                          />
                        ) : null}
                      </div>

                      <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="rounded-2xl border border-slate-200 bg-white p-3">
                          <div className="flex items-center justify-between">
                            <div className="text-xs font-semibold text-slate-600">Allowlist</div>
                            <Pill label={effective.purchases.vendorAllow.length ? `${effective.purchases.vendorAllow.length}` : "None"} tone={effective.purchases.vendorAllow.length ? "good" : "neutral"} />
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {effective.purchases.vendorAllow.map((v, idx) => {
                              const locked = showOverrideControls && !(isOverridden("purchases", "vendorAllow") || isOverridden("purchases", "vendorDeny"));
                              return (
                                <Chip
                                  key={`${v}-${idx}`}
                                  label={v}
                                  tone="good"
                                  onRemove={
                                    locked
                                      ? undefined
                                      : () => {
                                          const next = effective.purchases.vendorAllow.filter((_, i) => i !== idx);
                                          setSectionField("purchases", "vendorAllow", next);
                                        }
                                  }
                                />
                              );
                            })}
                          </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-3">
                          <div className="flex items-center justify-between">
                            <div className="text-xs font-semibold text-slate-600">Denylist</div>
                            <Pill label={effective.purchases.vendorDeny.length ? `${effective.purchases.vendorDeny.length}` : "None"} tone={effective.purchases.vendorDeny.length ? "warn" : "neutral"} />
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {effective.purchases.vendorDeny.map((v, idx) => {
                              const locked = showOverrideControls && !(isOverridden("purchases", "vendorAllow") || isOverridden("purchases", "vendorDeny"));
                              return (
                                <Chip
                                  key={`${v}-${idx}`}
                                  label={v}
                                  tone="warn"
                                  onRemove={
                                    locked
                                      ? undefined
                                      : () => {
                                          const next = effective.purchases.vendorDeny.filter((_, i) => i !== idx);
                                          setSectionField("purchases", "vendorDeny", next);
                                        }
                                  }
                                />
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                        <div>
                          <div className="text-xs font-semibold text-slate-600">Add mode</div>
                          <select
                            value={vendorMode}
                            onChange={(e) => setVendorMode(e.target.value as any)}
                            disabled={showOverrideControls && !(isOverridden("purchases", "vendorAllow") || isOverridden("purchases", "vendorDeny"))}
                            className={cn(
                              "mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-emerald-100",
                              showOverrideControls && !(isOverridden("purchases", "vendorAllow") || isOverridden("purchases", "vendorDeny")) && "bg-slate-50 text-slate-500"
                            )}
                          >
                            <option value="allow">Allowlist</option>
                            <option value="deny">Denylist</option>
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <Field
                            label="Vendor name"
                            value={vendorNew}
                            onChange={setVendorNew}
                            placeholder="Example: Shenzhen Store"
                            disabled={showOverrideControls && !(isOverridden("purchases", "vendorAllow") || isOverridden("purchases", "vendorDeny"))}
                          />
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            const locked = showOverrideControls && !(isOverridden("purchases", "vendorAllow") || isOverridden("purchases", "vendorDeny"));
                            if (locked) return;
                            const v = vendorNew.trim();
                            if (!v) {
                              toast({ title: "Missing vendor", message: "Enter a vendor name.", kind: "warn" });
                              return;
                            }
                            if (vendorMode === "allow") setSectionField("purchases", "vendorAllow", [...effective.purchases.vendorAllow, v]);
                            else setSectionField("purchases", "vendorDeny", [...effective.purchases.vendorDeny, v]);
                            setVendorNew("");
                          }}
                        >
                          <Plus className="h-4 w-4" /> Add vendor
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            const locked = showOverrideControls && !(isOverridden("purchases", "vendorAllow") || isOverridden("purchases", "vendorDeny"));
                            if (locked) return;
                            setSectionField("purchases", "vendorAllow", ["Kampala Office Mart", "Shenzhen Store", "City Courier"]);
                            toast({ title: "Presets", message: "Preferred vendors applied.", kind: "info" });
                          }}
                        >
                          <Sparkles className="h-4 w-4" /> Preferred presets
                        </Button>
                      </div>

                      {showOverrideControls && !(isOverridden("purchases", "vendorAllow") || isOverridden("purchases", "vendorDeny")) ? (
                        <div className="mt-2 text-xs text-slate-500">Enable override to edit.</div>
                      ) : null}
                    </div>

                    {/* Categories deny */}
                    <div className="rounded-3xl border border-slate-200 bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">Category restrictions</div>
                          <div className="mt-1 text-xs text-slate-500">Block categories like Alcohol.</div>
                        </div>
                        {showOverrideControls ? <OverrideToggle enabled={isOverridden("purchases", "categoriesDeny")} onToggle={(v) => toggleOverrideFor("purchases", "categoriesDeny", v)} /> : null}
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {effective.purchases.categoriesDeny.map((c, idx) => (
                          <Chip
                            key={`${c}-${idx}`}
                            label={c}
                            tone="warn"
                            onRemove={
                              showOverrideControls && !isOverridden("purchases", "categoriesDeny")
                                ? undefined
                                : () => {
                                    const next = effective.purchases.categoriesDeny.filter((_, i) => i !== idx);
                                    setSectionField("purchases", "categoriesDeny", next);
                                  }
                            }
                          />
                        ))}
                        {!effective.purchases.categoriesDeny.length ? <Pill label="No restrictions" tone="neutral" /> : null}
                      </div>

                      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                        <div className="md:col-span-2">
                          <Field label="Add restricted category" value={catNew} onChange={setCatNew} placeholder="Example: Alcohol" disabled={showOverrideControls && !isOverridden("purchases", "categoriesDeny")} />
                        </div>
                        <div className="flex items-end">
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => {
                              const locked = showOverrideControls && !isOverridden("purchases", "categoriesDeny");
                              if (locked) return;
                              const v = catNew.trim();
                              if (!v) {
                                toast({ title: "Missing category", message: "Enter a category.", kind: "warn" });
                                return;
                              }
                              setSectionField("purchases", "categoriesDeny", [...effective.purchases.categoriesDeny, v]);
                              setCatNew("");
                            }}
                          >
                            <Plus className="h-4 w-4" /> Add
                          </Button>
                        </div>
                      </div>

                      {showOverrideControls && !isOverridden("purchases", "categoriesDeny") ? <div className="mt-2 text-xs text-slate-500">Enable override to edit.</div> : null}
                    </div>

                    {/* Basket size + attachments */}
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                      <div className="rounded-3xl border border-slate-200 bg-white p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-slate-900">Max basket size</div>
                            <div className="mt-1 text-xs text-slate-500">Amounts above this require approval.</div>
                          </div>
                          {showOverrideControls ? <OverrideToggle enabled={isOverridden("purchases", "maxBasket")} onToggle={(v) => toggleOverrideFor("purchases", "maxBasket", v)} /> : null}
                        </div>
                        <div className="mt-3">
                          <NumberField
                            label="Max basket (UGX)"
                            value={effective.purchases.maxBasket}
                            onChange={(v) => setSectionField("purchases", "maxBasket", v)}
                            hint={`Current: ${formatUGX(effective.purchases.maxBasket)}`}
                            disabled={showOverrideControls && !isOverridden("purchases", "maxBasket")}
                          />
                          {showOverrideControls && !isOverridden("purchases", "maxBasket") ? <div className="mt-2 text-xs text-slate-500">Enable override to edit.</div> : null}
                        </div>
                      </div>

                      <div className="rounded-3xl border border-slate-200 bg-white p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-slate-900">Attachments requirement</div>
                            <div className="mt-1 text-xs text-slate-500">Require attachments above threshold.</div>
                          </div>
                          {showOverrideControls ? <OverrideToggle enabled={isOverridden("purchases", "attachments")} onToggle={(v) => toggleOverrideFor("purchases", "attachments", v)} /> : null}
                        </div>

                        <div className="mt-3 space-y-3">
                          <Toggle
                            enabled={effective.purchases.attachments.required}
                            onChange={(v) => setSectionField("purchases", "attachments", { ...effective.purchases.attachments, required: v })}
                            label="Require attachments"
                            description="Applies to purchases and services above threshold"
                            disabled={showOverrideControls && !isOverridden("purchases", "attachments")}
                          />
                          <NumberField
                            label="Threshold amount (UGX)"
                            value={effective.purchases.attachments.threshold}
                            onChange={(v) => setSectionField("purchases", "attachments", { ...effective.purchases.attachments, threshold: v })}
                            hint="If total ≥ threshold, attachments are required"
                            disabled={showOverrideControls && !isOverridden("purchases", "attachments")}
                          />
                          {showOverrideControls && !isOverridden("purchases", "attachments") ? <div className="text-xs text-slate-500">Enable override to edit.</div> : null}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                      Use the Simulator tab to test edge cases: denied vendors, restricted categories, and missing attachments.
                    </div>
                  </Card>
                </div>
              </div>
            ) : null}

            {tab === "inheritance" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="text-sm font-semibold text-slate-900">Pick a user to inspect</div>
                  <div className="mt-1 text-xs text-slate-500">Shows effective values and source (Org/Group/User).</div>
                  <div className="mt-4">
                    <div className="text-xs font-semibold text-slate-600">User</div>
                    <select
                      value={inspectUserId}
                      onChange={(e) => setInspectUserId(e.target.value)}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-emerald-100"
                    >
                      {USERS.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.email})
                        </option>
                      ))}
                    </select>
                    <div className="mt-2 text-xs text-slate-500">Group: {inspectUser.groupId}</div>
                  </div>
                  <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700">
                    Chain: Org → Group ({inspectUser.groupId}) → User
                  </div>
                </div>

                <div className="lg:col-span-2 space-y-4">
                  <Card title="Inheritance summary" subtitle="Source of each effective field" right={<Pill label="Explainable" tone="info" />}>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs text-slate-600">
                          <tr>
                            <th className="px-4 py-3 font-semibold">Field</th>
                            <th className="px-4 py-3 font-semibold">Effective</th>
                            <th className="px-4 py-3 font-semibold">Source</th>
                          </tr>
                        </thead>
                        <tbody>
                          {fieldsForInheritance.map(([s, k]) => {
                            const src = sourceForKey(orgPolicy, inspectGroupO, inspectUserO, s, k);
                            const effVal = (inspectEffective as any)[s][k];
                            const compact = compactValue(k, effVal);
                            return (
                              <tr key={`${s}.${k}`} className="border-t border-slate-100 hover:bg-slate-50/60">
                                <td className="px-4 py-3 font-semibold text-slate-900">{s}.{k}</td>
                                <td className="px-4 py-3 text-slate-700">{compact}</td>
                                <td className="px-4 py-3"><Pill label={src} tone={src === "Org" ? "neutral" : src === "Group" ? "warn" : "info"} /></td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </Card>

                  <Card title="Effective policy JSON" subtitle="Computed policy used for enforcement" right={<Button variant="outline" onClick={() => toast({ title: "Export", message: "Export policy (demo).", kind: "info" })}><FileText className="h-4 w-4" /> Export</Button>}>
                    <pre className="max-h-[360px] overflow-auto rounded-2xl border border-slate-200 bg-white p-3 text-xs text-slate-800">
                      {JSON.stringify(inspectEffective, null, 2)}
                    </pre>
                  </Card>
                </div>
              </div>
            ) : null}

            {tab === "simulator" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="text-sm font-semibold text-slate-900">Simulation context</div>
                  <div className="mt-1 text-xs text-slate-500">Choose a user to simulate with their effective policy.</div>

                  <div className="mt-4">
                    <div className="text-xs font-semibold text-slate-600">User</div>
                    <select
                      value={simUserId}
                      onChange={(e) => setSimUserId(e.target.value)}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-emerald-100"
                    >
                      {USERS.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.email})
                        </option>
                      ))}
                    </select>
                    <div className="mt-2 text-xs text-slate-500">Group: {simUser.groupId}</div>
                  </div>

                  <div className="mt-4">
                    <div className="text-xs font-semibold text-slate-600">Type</div>
                    <div className="mt-2 grid grid-cols-3 gap-2 rounded-2xl bg-white p-1 ring-1 ring-slate-200">
                      {(["Ride", "Purchase", "Service"] as const).map((t) => (
                        <button
                          key={t}
                          className={cn("rounded-xl px-3 py-2 text-sm font-semibold", simType === t ? "text-white" : "text-slate-700 hover:bg-slate-50")}
                          style={simType === t ? { background: EVZ.green } : undefined}
                          onClick={() => setSimType(t)}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700">
                    Simulator rules:
                    <ul className="mt-2 space-y-1 text-xs text-slate-600">
                      <li>1) Denied vendor or restricted category is blocked</li>
                      <li>2) Missing attachments above threshold is blocked</li>
                      <li>3) Over max basket requires approval</li>
                      <li>4) Outside working hours may require approval</li>
                    </ul>
                  </div>
                </div>

                <div className="lg:col-span-2 space-y-4">
                  <Card title="Scenario inputs" subtitle="Set inputs and run the simulator" right={<Button variant="primary" onClick={() => toast({ title: "Simulated", message: `Result: ${simResult.status}`, kind: simResult.status === "Allowed" ? "success" : simResult.status === "Blocked" ? "warn" : "info" })}><Play className="h-4 w-4" /> Run</Button>}>
                    {simType === "Ride" ? (
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <div className="text-xs font-semibold text-slate-600">Ride category</div>
                          <select
                            value={simRideCategory}
                            onChange={(e) => setSimRideCategory(e.target.value as any)}
                            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-emerald-100"
                          >
                            <option value="standard">Standard</option>
                            <option value="premium">Premium</option>
                          </select>
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-600">Day</div>
                          <select
                            value={simDay}
                            onChange={(e) => setSimDay(e.target.value)}
                            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-emerald-100"
                          >
                            {"Mon,Tue,Wed,Thu,Fri,Sat,Sun".split(",").map((d) => (
                              <option key={d} value={d}>
                                {d}
                              </option>
                            ))}
                          </select>
                        </div>
                        <Field label="Time" value={simTime} onChange={setSimTime} type="time" />
                        <Field label="Origin" value={simOrigin} onChange={setSimOrigin} placeholder="Kampala" hint="Match geofence names" />
                        <Field label="Destination" value={simDestination} onChange={setSimDestination} placeholder="HQ" hint="Match geofence names" />
                        <Field label="Purpose" value={simPurpose} onChange={setSimPurpose} placeholder="Client meeting" hint="Required if policy requires" />
                      </div>
                    ) : null}

                    {simType !== "Ride" ? (
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <div className="text-xs font-semibold text-slate-600">Service module</div>
                          <select
                            value={simModule}
                            onChange={(e) => {
                              const v = e.target.value as ServiceModule;
                              setSimModule(v);
                              if (v !== "E-Commerce") setSimMarketplace("MyLiveDealz");
                            }}
                            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-emerald-100"
                          >
                            {SERVICE_MODULES.map((m) => (
                              <option key={m} value={m}>
                                {m}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className={cn(simModule !== "E-Commerce" && "opacity-70")}>
                          <div className="text-xs font-semibold text-slate-600">Marketplace</div>
                          <select
                            value={simMarketplace}
                            onChange={(e) => setSimMarketplace(e.target.value as Marketplace)}
                            disabled={simModule !== "E-Commerce"}
                            className={cn(
                              "mt-2 w-full rounded-2xl border px-3 py-2.5 text-sm font-semibold outline-none",
                              simModule === "E-Commerce" ? "border-slate-200 bg-white text-slate-900 focus:ring-4 focus:ring-emerald-100" : "border-slate-200 bg-slate-50 text-slate-500"
                            )}
                          >
                            {MARKETPLACES.map((m) => (
                              <option key={m} value={m}>
                                {m}
                              </option>
                            ))}
                          </select>
                        </div>

                        <Field label="Vendor" value={simVendor} onChange={setSimVendor} placeholder="Kampala Office Mart" />
                        <Field label="Category" value={simCategory} onChange={setSimCategory} placeholder="Office supplies" hint="Restricted categories are blocked" />
                        <NumberField label="Total amount (UGX)" value={simTotal} onChange={setSimTotal} hint={`Max basket: ${formatUGX(simEffective.purchases.maxBasket)}`} />

                        <div className="rounded-3xl border border-slate-200 bg-white p-4 md:col-span-2">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-slate-900">Attachments provided</div>
                              <div className="mt-1 text-xs text-slate-600">Required above {formatUGX(simEffective.purchases.attachments.threshold)} when enabled.</div>
                            </div>
                            <button
                              type="button"
                              className={cn(
                                "relative h-7 w-12 rounded-full border transition",
                                simAttachments ? "border-emerald-300 bg-emerald-200" : "border-slate-200 bg-white"
                              )}
                              onClick={() => setSimAttachments((v) => !v)}
                              aria-label="Toggle attachments"
                            >
                              <span className={cn("absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition", simAttachments ? "left-[22px]" : "left-1")} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </Card>

                  <Card title="Simulation result" subtitle="Decision, reason, and next step" right={<Pill label={simResult.status} tone={simResult.status === "Allowed" ? "good" : simResult.status === "Blocked" ? "bad" : "warn"} />}>
                    <div className="rounded-3xl border border-slate-200 bg-white p-4">
                      <div className="text-sm font-semibold text-slate-900">Reason</div>
                      <div className="mt-2 text-sm text-slate-700">{simResult.reason}</div>
                      <div className="mt-4 text-sm font-semibold text-slate-900">Next step</div>
                      <div className="mt-2 text-sm text-slate-700">{simResult.nextStep}</div>
                    </div>
                    <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">Simulator is a preview tool. Real enforcement uses policy engine and approvals workflow.</div>
                  </Card>

                  <Card title="Effective policy snapshot" subtitle="Policy used for this simulation" right={<Button variant="outline" onClick={() => setTab("inheritance")}><Layers className="h-4 w-4" /> Inheritance</Button>}>
                    <pre className="max-h-[320px] overflow-auto rounded-2xl border border-slate-200 bg-white p-3 text-xs text-slate-800">
                      {JSON.stringify(simEffective, null, 2)}
                    </pre>
                  </Card>
                </div>
              </div>
            ) : null}

            {tab === "recommendations" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="text-sm font-semibold text-slate-900">Recommendations</div>
                  <div className="mt-1 text-xs text-slate-500">Generated from current effective policy for the selected scope.</div>
                  <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700">Apply changes in Builder and validate in Simulator.</div>
                  <Button variant="primary" className="mt-4 w-full" onClick={() => setTab("builder")}>
                    <Shield className="h-4 w-4" /> Open builder
                  </Button>
                </div>

                <div className="lg:col-span-2 space-y-3">
                  {recs.map((r, idx) => (
                    <div key={idx} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">{r.title}</div>
                          <div className="mt-1 text-sm text-slate-700">{r.body}</div>
                        </div>
                        <Pill label={r.tone === "good" ? "OK" : r.tone === "warn" ? "Warning" : "Info"} tone={r.tone} />
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Button variant="outline" className="text-xs" onClick={() => setTab("builder")}>
                          <ChevronRight className="h-4 w-4" /> Adjust policy
                        </Button>
                        <Button variant="outline" className="text-xs" onClick={() => setTab("simulator")}>
                          <Play className="h-4 w-4" /> Test
                        </Button>
                        <Button variant="outline" className="text-xs" onClick={() => setTab("impact")}>
                          <FileText className="h-4 w-4" /> Preview impact
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {tab === "impact" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="text-sm font-semibold text-slate-900">Impact preview</div>
                  <div className="mt-1 text-xs text-slate-500">Compares current draft against last published version.</div>

                  <div className="mt-4 grid grid-cols-1 gap-3">
                    <ImpactTile title="Affected users" value={String(impact.totalAffected)} icon={<Users className="h-5 w-5" />} tone="neutral" />
                    <ImpactTile title="Users with changes" value={String(impact.changedUsers)} icon={<Sparkles className="h-5 w-5" />} tone={impact.changedUsers ? "warn" : "good"} />
                    <ImpactTile title="Changed decisions" value={String(impact.totalChangedDecisions)} icon={<Play className="h-5 w-5" />} tone={impact.totalChangedDecisions ? "warn" : "good"} />
                  </div>

                  <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700">
                    Published at: {new Date(impact.publishedAt).toLocaleString()}
                    {impact.note ? <div className="mt-2 text-xs text-slate-600">Last note: {impact.note}</div> : null}
                  </div>

                  <Button variant="primary" className="mt-4 w-full" onClick={publish}>
                    <BadgeCheck className="h-4 w-4" /> Publish
                  </Button>
                  <Button variant="outline" className="mt-2 w-full" onClick={resetToPublished}>
                    <Trash2 className="h-4 w-4" /> Revert
                  </Button>
                </div>

                <div className="lg:col-span-2 space-y-4">
                  <Card title="Changed users" subtitle="Who is affected and which fields changed" right={<Pill label={`${impact.changedUsers} users`} tone={impact.changedUsers ? "warn" : "good"} />}>
                    {impact.diffs.length ? (
                      <div className="space-y-2">
                        {impact.diffs.map((d) => (
                          <div key={d.user.id} className="rounded-2xl border border-slate-200 bg-white p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="text-sm font-semibold text-slate-900">{d.user.name}</div>
                                <div className="mt-1 text-xs text-slate-500">{d.user.email} • Group: {d.user.groupId}</div>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {d.changed.slice(0, 8).map((c) => (
                                    <Pill key={c} label={c} tone="neutral" />
                                  ))}
                                  {d.changed.length > 8 ? <Pill label={`+${d.changed.length - 8}`} tone="neutral" /> : null}
                                </div>
                              </div>
                              <Button variant="outline" className="text-xs" onClick={() => { setSimUserId(d.user.id); setTab("simulator"); }}>
                                <Play className="h-4 w-4" /> Simulate
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center">
                        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-700">
                          <Check className="h-6 w-6" />
                        </div>
                        <div className="mt-3 text-sm font-semibold text-slate-900">No impact</div>
                        <div className="mt-1 text-sm text-slate-600">Your draft matches the last published version for this scope.</div>
                      </div>
                    )}
                  </Card>

                  <Card title="Behavior preview" subtitle="How many simulated decisions changed" right={<Pill label={`${impact.totalChangedDecisions} changed`} tone={impact.totalChangedDecisions ? "warn" : "good"} />}>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs text-slate-600">
                          <tr>
                            <th className="px-4 py-3 font-semibold">User</th>
                            <th className="px-4 py-3 font-semibold">Group</th>
                            <th className="px-4 py-3 font-semibold">Changed decisions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {impact.behavior.map((b) => (
                            <tr key={b.user.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                              <td className="px-4 py-3 font-semibold text-slate-900">{b.user.name}</td>
                              <td className="px-4 py-3 text-slate-700">{b.user.groupId}</td>
                              <td className="px-4 py-3"><Pill label={String(b.changedDecisions)} tone={b.changedDecisions ? "warn" : "good"} /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                      This preview uses a small test set. For production, run impact analysis on real historical transactions.
                    </div>
                  </Card>
                </div>
              </div>
            ) : null}
          </div>

          <footer className="border-t border-slate-200 bg-white/60 py-6">
            <div className="mx-auto max-w-[1400px] px-4 text-xs text-slate-500 md:px-6">
              I Policy Builder v2: inheritance (Org → Group → User), rides and purchase/service policies, required attachments above threshold, simulator, recommendations, and change impact preview.
            </div>
          </footer>
        </div>
      </div>
    </div>
  );

  function ImpactTile({ title, value, icon, tone }: { title: string; value: string; icon: React.ReactNode; tone: Tone }) {
    const t = tone === "bad" ? "bg-rose-50 text-rose-700" : tone === "warn" ? "bg-amber-50 text-amber-800" : tone === "good" ? "bg-emerald-50 text-emerald-700" : tone === "info" ? "bg-blue-50 text-blue-700" : "bg-slate-50 text-slate-700";
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

function compactValue(key: string, v: any) {
  try {
    if (key === "maxBasket") return formatUGX(v);
    if (key === "attachments") return `${v.required ? "Required" : "Optional"} (≥ ${formatUGX(v.threshold)})`;
    if (key === "vendorAllow" || key === "vendorDeny" || key === "categoriesDeny") return Array.isArray(v) ? `${v.length} items` : "-";
    if (key === "geofences") return Array.isArray(v) ? `${v.length} fences` : "-";
    if (key === "categories") return JSON.stringify(v);
    if (key === "allowedModules" || key === "allowedMarketplaces") {
      const on = Object.keys(v || {}).filter((k) => v[k]);
      return `${on.length} enabled`;
    }
    if (key === "time") return `${v.start}-${v.end} (${(v.days || []).length} days)`;
    if (key === "purpose") return `${v.required ? "Required" : "Optional"} (${(v.tags || []).length} tags)`;
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}
