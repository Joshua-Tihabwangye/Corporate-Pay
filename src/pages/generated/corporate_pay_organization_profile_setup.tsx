import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BadgeCheck,
  Building2,
  Check,
  ChevronRight,
  Copy,
  Download,
  FileText,
  Globe,
  HelpCircle,
  Image as ImageIcon,
  Info,
  Layers,
  Mail,
  MapPin,
  Pencil,
  Plus,
  Save,
  Shield,
  Trash2,
  Upload,
  Users,
  X,
  MoreVertical,
} from "lucide-react";

// Brand tokens
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

type OrgIndustry = "Corporate" | "Hospital" | "Tour Company" | "Other";

type BillingContact = {
  id: string;
  name: string;
  role: "Finance" | "AP" | "CFO" | "Procurement" | "Ops" | "Other";
  email: string;
  phone: string;
  channels: { email: boolean; whatsapp: boolean; wechat: boolean; sms: boolean };
};

type Entity = {
  id: string;
  name: string;
  country: string;
  city: string;
  address1: string;
  address2: string;
  postal: string;
  currency: string;
  taxId: string;
  vatNo: string;
  isPrimary: boolean;
};

type InvoiceGroup = {
  id: string;
  name: string;
  entityScope: "All" | string; // entity id
  apEmail: string;
  apCode: string;
  ccEmails: string;
  frequency: "Daily" | "Weekly" | "Monthly" | "Custom";
  prefix: string;
  moduleScope: Record<ServiceModule, boolean>;
  marketplaceScope: Record<Marketplace, boolean>; // relevant when E-Commerce is enabled
  notes: string;
};

type StepId =
  | "profile"
  | "entities"
  | "billing"
  | "branding"
  | "modules"
  | "invoiceGroups"
  | "support"
  | "goLive";

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
  children,
  onClick,
  className,
  disabled,
  title,
}: {
  variant?: "primary" | "accent" | "outline" | "ghost" | "danger";
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
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
      className={cn(base, variants[variant], disabled && "cursor-not-allowed opacity-60", className)}
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
        {description ? <div className="mt-1 text-xs text-slate-600">{description}</div> : null}
      </div>
      <button
        type="button"
        className={cn(
          "relative h-7 w-12 rounded-full border transition",
          enabled ? "border-emerald-300 bg-emerald-200" : "border-slate-200 bg-white"
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
  label,
  value,
  onChange,
  placeholder,
  hint,
  required,
  type = "text",
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  required?: boolean;
  type?: string;
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
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
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

function Select({
  label,
  value,
  onChange,
  options,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
  hint?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-semibold text-slate-600">{label}</div>
        {hint ? <div className="text-xs text-slate-500">{hint}</div> : null}
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-emerald-100"
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

function ProgressRing({ value }: { value: number }) {
  const pct = clamp(value, 0, 100);
  const size = 76;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;
  return (
    <div className="relative grid place-items-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#E2E8F0" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={EVZ.green}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${dash} ${c}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute text-sm font-semibold text-slate-900">{Math.round(pct)}%</div>
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
                {t.kind === "error" || t.kind === "warn" ? <Info className="h-5 w-5" /> : <Check className="h-5 w-5" />}
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

function Section({ title, subtitle, children, right }: { title: string; subtitle?: string; children: React.ReactNode; right?: React.ReactNode }) {
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
        <Layers className="h-6 w-6" />
      </div>
      <div className="mt-3 text-sm font-semibold text-slate-900">{title}</div>
      <div className="mt-1 text-sm text-slate-600">{subtitle}</div>
    </div>
  );
}

function ChecklistRow({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2">
      <div className="text-sm font-semibold text-slate-800">{label}</div>
      {ok ? <Pill label="Done" tone="good" /> : <Pill label="Pending" tone="warn" />}
    </div>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove?: () => void }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
      {label}
      {onRemove ? (
        <button type="button" className="rounded-full p-1 hover:bg-slate-200" onClick={onRemove} aria-label={`Remove ${label}`}>
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </span>
  );
}

function baseModuleScope(modules: ServiceModule[]) {
  const out: Record<ServiceModule, boolean> = {} as any;
  modules.forEach((m) => (out[m] = true));
  return out;
}

function baseMarketplaceScope(mkts: Marketplace[]) {
  const out: Record<Marketplace, boolean> = {} as any;
  mkts.forEach((m) => (out[m] = m !== "Other Marketplace"));
  return out;
}

export default function CorporatePayOrgProgramSetupV2() {
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

  const [toasts, setToasts] = useState<Array<{ id: string; title: string; message?: string; kind: string }>>([]);
  const toast = (t: { title: string; message?: string; kind: string }) => {
    const id = uid("toast");
    setToasts((p) => [{ id, ...t }, ...p].slice(0, 4));
    window.setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 3200);
  };

  const [step, setStep] = useState<StepId>("profile");

  const steps: Array<{ id: StepId; label: string; subtitle: string }> = [
    { id: "profile", label: "Company profile", subtitle: "Identity and basics" },
    { id: "entities", label: "Entities and branches", subtitle: "Multi-country setup" },
    { id: "billing", label: "Billing contacts", subtitle: "AP and finance distribution" },
    { id: "branding", label: "Branding and invoice", subtitle: "Logo and invoice text" },
    { id: "modules", label: "Modules and defaults", subtitle: "Enable modules and policy defaults" },
    { id: "invoiceGroups", label: "Invoice groups", subtitle: "AP codes and routing" },
    { id: "support", label: "EVzone support", subtitle: "Support mode toggle" },
    { id: "goLive", label: "Go-live", subtitle: "Readiness and publish" },
  ];

  // Org profile
  const [org, setOrg] = useState({
    displayName: "Acme Group Ltd",
    legalName: "Acme Group Limited",
    registrationNo: "80020012345678",
    website: "",
    industry: "Corporate" as OrgIndustry,
    baseCurrency: "UGX",
  });

  // Entities / branches
  const [entities, setEntities] = useState<Entity[]>([
    {
      id: uid("ENT"),
      name: "Uganda HQ",
      country: "Uganda",
      city: "Kampala",
      address1: "Plot 12, Nkrumah Road",
      address2: "Suite 5",
      postal: "P.O. Box 12345",
      currency: "UGX",
      taxId: "TIN-123-456-789",
      vatNo: "VAT-UG-00991",
      isPrimary: true,
    },
    {
      id: uid("ENT"),
      name: "China Branch",
      country: "China",
      city: "Wuxi",
      address1: "Room 265, No. 3 Gaolang East Road",
      address2: "Xinwu District",
      postal: "214000",
      currency: "CNY",
      taxId: "CN-TAX-0001",
      vatNo: "CN-VAT-0001",
      isPrimary: false,
    },
  ]);

  // Billing contacts
  const [billingContacts, setBillingContacts] = useState<BillingContact[]>([
    {
      id: uid("BC"),
      name: "Finance Desk",
      role: "Finance",
      email: "finance@acme.com",
      phone: "+256 700 000 000",
      channels: { email: true, whatsapp: true, wechat: false, sms: true },
    },
    {
      id: uid("BC"),
      name: "Accounts Payable",
      role: "AP",
      email: "ap@acme.com",
      phone: "+256 701 000 000",
      channels: { email: true, whatsapp: false, wechat: false, sms: true },
    },
  ]);

  // Branding
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [invoiceFooter, setInvoiceFooter] = useState("Thank you for partnering with Acme Group Ltd.");
  const [paymentTerms, setPaymentTerms] = useState("Net 7");
  const [paymentInstructions, setPaymentInstructions] = useState("Pay via bank transfer to Acme Group Ltd. Bank: Example Bank, Account: 0123456789.");

  // Module enablement (high-level)
  const [modulesEnabled, setModulesEnabled] = useState<Record<ServiceModule, boolean>>(() => {
    const out: Record<ServiceModule, boolean> = {} as any;
    SERVICE_MODULES.forEach((m) => (out[m] = m !== "Other Service Module"));
    return out;
  });

  // Policy defaults
  const [policy, setPolicy] = useState({
    allowedRegions: ["Kampala", "Entebbe", "Wakiso"],
    workStart: "06:00",
    workEnd: "22:00",
    days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    defaultTripCap: "UGX 250,000",
    defaultDailyCap: "UGX 1,200,000",
    defaultMonthlyCap: "UGX 12,000,000",
    autoApproveUnder: "UGX 200,000",
  });

  const [regionDraft, setRegionDraft] = useState("");

  // Invoice groups
  const [invoiceGroups, setInvoiceGroups] = useState<InvoiceGroup[]>(() => {
    const firstEntity = "All";
    return [
      {
        id: uid("IG"),
        name: "Main corporate",
        entityScope: firstEntity,
        apEmail: "ap@acme.com",
        apCode: "ACME-MAIN",
        ccEmails: "finance@acme.com",
        frequency: "Weekly",
        prefix: "ACME",
        moduleScope: baseModuleScope(SERVICE_MODULES),
        marketplaceScope: baseMarketplaceScope(MARKETPLACES),
        notes: "Consolidated invoice for all enabled modules.",
      },
      {
        id: uid("IG"),
        name: "Sales travel",
        entityScope: firstEntity,
        apEmail: "sales-ap@acme.com",
        apCode: "ACME-SALES",
        ccEmails: "sales@acme.com, finance@acme.com",
        frequency: "Monthly",
        prefix: "ACME-SALES",
        moduleScope: {
          ...baseModuleScope(SERVICE_MODULES),
          "E-Commerce": false,
          "EVs & Charging": false,
          "School & E-Learning": false,
          "Medical & Health Care": false,
          "Travel & Tourism": false,
          "Green Investments": false,
          "FaithHub": false,
          "Virtual Workspace": false,
          "Finance & Payments": false,
          "Other Service Module": false,
        },
        marketplaceScope: baseMarketplaceScope(MARKETPLACES),
        notes: "Rides only, charged to Sales travel cost center.",
      },
    ];
  });

  // EVzone support mode
  const [supportEnabled, setSupportEnabled] = useState(true);
  const [supportModal, setSupportModal] = useState<"enable" | "disable" | null>(null);
  const [supportReason, setSupportReason] = useState("");

  // Premium: templates
  const [templateOpen, setTemplateOpen] = useState(false);
  const [templateId, setTemplateId] = useState<"corporate" | "hospital" | "tour" | null>(null);

  const templates = useMemo(() => {
    return [
      {
        id: "corporate" as const,
        name: "Corporate",
        desc: "General corporate spend: rides, e-commerce, services, approvals.",
        apply: () => {
          setOrg((p) => ({ ...p, industry: "Corporate" }));
          setModulesEnabled((prev) => ({
            ...prev,
            "Rides & Logistics": true,
            "E-Commerce": true,
            "Finance & Payments": true,
            "EVs & Charging": true,
            "Medical & Health Care": false,
            "Travel & Tourism": true,
            "Green Investments": false,
            "FaithHub": false,
            "Virtual Workspace": true,
          }));
          setPolicy((p) => ({
            ...p,
            allowedRegions: ["Kampala", "Entebbe"],
            workStart: "06:00",
            workEnd: "22:00",
            days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
            autoApproveUnder: "UGX 200,000",
          }));
        },
      },
      {
        id: "hospital" as const,
        name: "Hospital",
        desc: "Medical operations: stronger controls, 24/7 exceptions, higher audit sensitivity.",
        apply: () => {
          setOrg((p) => ({ ...p, industry: "Hospital" }));
          setModulesEnabled((prev) => ({
            ...prev,
            "Medical & Health Care": true,
            "Rides & Logistics": true,
            "E-Commerce": true,
            "Finance & Payments": true,
            "EVs & Charging": false,
            "Travel & Tourism": false,
            "Virtual Workspace": true,
          }));
          setPolicy((p) => ({
            ...p,
            allowedRegions: ["Kampala", "Entebbe"],
            workStart: "00:00",
            workEnd: "23:59",
            days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            autoApproveUnder: "UGX 100,000",
          }));
        },
      },
      {
        id: "tour" as const,
        name: "Tour Company",
        desc: "Travel heavy: airports and geo controls, stronger vendor rules, higher ride usage.",
        apply: () => {
          setOrg((p) => ({ ...p, industry: "Tour Company" }));
          setModulesEnabled((prev) => ({
            ...prev,
            "Travel & Tourism": true,
            "Rides & Logistics": true,
            "E-Commerce": true,
            "Finance & Payments": true,
            "EVs & Charging": false,
            "Medical & Health Care": false,
            "Virtual Workspace": true,
          }));
          setPolicy((p) => ({
            ...p,
            allowedRegions: ["Kampala", "Entebbe", "Jinja"],
            workStart: "05:00",
            workEnd: "23:00",
            days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            autoApproveUnder: "UGX 250,000",
          }));
        },
      },
    ];
  }, [setOrg, setModulesEnabled, setPolicy]);

  // Modals
  const [entityModalOpen, setEntityModalOpen] = useState(false);
  const [entityDraft, setEntityDraft] = useState<Entity>({
    id: "",
    name: "",
    country: "",
    city: "",
    address1: "",
    address2: "",
    postal: "",
    currency: "UGX",
    taxId: "",
    vatNo: "",
    isPrimary: false,
  });

  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactDraft, setContactDraft] = useState<BillingContact>({
    id: "",
    name: "",
    role: "Finance",
    email: "",
    phone: "",
    channels: { email: true, whatsapp: false, wechat: false, sms: true },
  });

  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [invoiceDraft, setInvoiceDraft] = useState<InvoiceGroup>({
    id: "",
    name: "",
    entityScope: "All",
    apEmail: "",
    apCode: "",
    ccEmails: "",
    frequency: "Weekly",
    prefix: "",
    moduleScope: baseModuleScope(SERVICE_MODULES),
    marketplaceScope: baseMarketplaceScope(MARKETPLACES),
    notes: "",
  });

  // Derived readiness
  const readiness = useMemo(() => {
    const profileOk = !!org.displayName.trim() && !!org.legalName.trim();
    const entityOk = entities.length > 0 && entities.some((e) => e.isPrimary);
    const billingOk = billingContacts.length > 0;
    const brandingOk = !!invoiceFooter.trim() && !!paymentTerms.trim() && !!paymentInstructions.trim();
    const moduleOk = Object.values(modulesEnabled).some(Boolean);
    const policyOk = policy.allowedRegions.length > 0 && !!policy.workStart && !!policy.workEnd;
    const invoiceOk = invoiceGroups.length > 0;
    const supportOk = typeof supportEnabled === "boolean";

    const items = [profileOk, entityOk, billingOk, brandingOk, moduleOk, policyOk, invoiceOk, supportOk];
    const pct = (items.filter(Boolean).length / items.length) * 100;

    return { pct, profileOk, entityOk, billingOk, brandingOk, moduleOk, policyOk, invoiceOk, supportOk };
  }, [org, entities, billingContacts, invoiceFooter, paymentTerms, paymentInstructions, modulesEnabled, policy, invoiceGroups, supportEnabled]);

  const goLiveReady = readiness.pct === 100;

  const exportJSON = () => {
    const payload = {
      org,
      entities,
      billingContacts,
      branding: { logoUrl: !!logoUrl, invoiceFooter, paymentTerms, paymentInstructions },
      modulesEnabled,
      policy,
      invoiceGroups,
      supportEnabled,
      exportedAt: new Date().toISOString(),
    };
    const text = JSON.stringify(payload, null, 2);
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "corporatepay-org-setup.json";
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported", message: "Downloaded JSON config.", kind: "success" });
  };

  const saveDraft = () => {
    toast({ title: "Saved", message: "Draft saved. Audit entry recorded (demo).", kind: "success" });
  };

  const goLive = () => {
    if (!goLiveReady) {
      toast({ title: "Not ready", message: "Complete the go-live checklist first.", kind: "warn" });
      setStep("goLive");
      return;
    }
    toast({ title: "Go-live", message: "Organization setup published. CorporatePay enabled.", kind: "success" });
  };

  const onLogoFile = (file?: File | null) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setLogoUrl(url);
    toast({ title: "Logo updated", message: "Logo preview refreshed.", kind: "success" });
  };

  const openNewEntity = () => {
    setEntityDraft({
      id: "",
      name: "",
      country: "",
      city: "",
      address1: "",
      address2: "",
      postal: "",
      currency: org.baseCurrency || "UGX",
      taxId: "",
      vatNo: "",
      isPrimary: entities.length === 0,
    });
    setEntityModalOpen(true);
  };

  const openEditEntity = (e: Entity) => {
    setEntityDraft({ ...e });
    setEntityModalOpen(true);
  };

  const saveEntity = () => {
    if (!entityDraft.name.trim() || !entityDraft.country.trim() || !entityDraft.city.trim() || !entityDraft.address1.trim()) {
      toast({ title: "Missing fields", message: "Name, country, city, and address line 1 are required.", kind: "warn" });
      return;
    }

    setEntities((prev) => {
      if (entityDraft.isPrimary) {
        prev = prev.map((x) => ({ ...x, isPrimary: false }));
      }
      if (entityDraft.id) {
        return prev.map((x) => (x.id === entityDraft.id ? entityDraft : x));
      }
      return [{ ...entityDraft, id: uid("ENT") }, ...prev];
    });

    toast({ title: "Saved", message: "Entity saved.", kind: "success" });
    setEntityModalOpen(false);
  };

  const deleteEntity = (id: string) => {
    const isPrimary = entities.find((e) => e.id === id)?.isPrimary;
    if (isPrimary) {
      toast({ title: "Blocked", message: "You cannot delete the primary entity. Set another as primary first.", kind: "warn" });
      return;
    }
    setEntities((prev) => prev.filter((x) => x.id !== id));
    toast({ title: "Deleted", message: "Entity removed.", kind: "info" });
  };

  const openNewContact = () => {
    setContactDraft({
      id: "",
      name: "",
      role: "Finance",
      email: "",
      phone: "",
      channels: { email: true, whatsapp: false, wechat: false, sms: true },
    });
    setContactModalOpen(true);
  };

  const saveContact = () => {
    if (!contactDraft.name.trim() || !contactDraft.email.trim()) {
      toast({ title: "Missing fields", message: "Name and email are required.", kind: "warn" });
      return;
    }
    setBillingContacts((prev) => {
      if (contactDraft.id) return prev.map((x) => (x.id === contactDraft.id ? contactDraft : x));
      return [{ ...contactDraft, id: uid("BC") }, ...prev];
    });
    toast({ title: "Saved", message: "Billing contact saved.", kind: "success" });
    setContactModalOpen(false);
  };

  const deleteContact = (id: string) => {
    setBillingContacts((prev) => prev.filter((x) => x.id !== id));
    toast({ title: "Deleted", message: "Contact removed.", kind: "info" });
  };

  const openNewInvoiceGroup = () => {
    setInvoiceDraft({
      id: "",
      name: "",
      entityScope: "All",
      apEmail: "",
      apCode: "",
      ccEmails: "",
      frequency: "Weekly",
      prefix: "",
      moduleScope: baseModuleScope(SERVICE_MODULES),
      marketplaceScope: baseMarketplaceScope(MARKETPLACES),
      notes: "",
    });
    setInvoiceModalOpen(true);
  };

  const openEditInvoiceGroup = (g: InvoiceGroup) => {
    setInvoiceDraft(JSON.parse(JSON.stringify(g)));
    setInvoiceModalOpen(true);
  };

  const saveInvoiceGroup = () => {
    if (!invoiceDraft.name.trim() || !invoiceDraft.apEmail.trim() || !invoiceDraft.apCode.trim() || !invoiceDraft.prefix.trim()) {
      toast({ title: "Missing fields", message: "Name, AP email, AP code, and prefix are required.", kind: "warn" });
      return;
    }
    setInvoiceGroups((prev) => {
      if (invoiceDraft.id) return prev.map((x) => (x.id === invoiceDraft.id ? invoiceDraft : x));
      return [{ ...invoiceDraft, id: uid("IG") }, ...prev];
    });
    toast({ title: "Saved", message: "Invoice group saved.", kind: "success" });
    setInvoiceModalOpen(false);
  };

  const deleteInvoiceGroup = (id: string) => {
    setInvoiceGroups((prev) => prev.filter((x) => x.id !== id));
    toast({ title: "Deleted", message: "Invoice group removed.", kind: "info" });
  };

  const applyTemplate = () => {
    if (!templateId) return;
    const t = templates.find((x) => x.id === templateId);
    if (!t) return;
    t.apply();
    toast({ title: "Template applied", message: `${t.name} template applied.",`, kind: "success" });
    setTemplateOpen(false);
  };

  const requestSupportToggle = (mode: "enable" | "disable") => {
    setSupportReason("");
    setSupportModal(mode);
  };

  const confirmSupportToggle = () => {
    if (!supportReason.trim()) {
      toast({ title: "Reason required", message: "Provide a reason for this change (audit).", kind: "warn" });
      return;
    }
    const enable = supportModal === "enable";
    setSupportEnabled(enable);
    setSupportModal(null);
    toast({ title: enable ? "Support enabled" : "Support disabled", message: "Change recorded in audit log.", kind: "success" });
  };

  const stepIndex = steps.findIndex((s) => s.id === step);

  const nextStep = () => {
    const i = steps.findIndex((s) => s.id === step);
    const n = steps[Math.min(steps.length - 1, i + 1)];
    setStep(n.id);
  };

  const prevStep = () => {
    const i = steps.findIndex((s) => s.id === step);
    const p = steps[Math.max(0, i - 1)];
    setStep(p.id);
  };

  return (
    <div className="min-h-screen" style={{ background: "radial-gradient(90% 60% at 50% 0%, rgba(3,205,140,0.18), rgba(255,255,255,0))" }}>
      <ToastStack toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((x) => x.id !== id))} />

      <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-6">
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(2,8,23,0.12)]">
          {/* Header */}
          <div className="border-b border-slate-200 bg-white">
            <div className="flex flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
              <div className="flex items-start gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl text-white" style={{ background: EVZ.green }}>
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">Organization Profile and Program Setup</div>
                  <div className="mt-1 text-xs text-slate-500">Configure profile, billing, modules, policy defaults, invoice routing, and EVzone support.</div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 rounded-3xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <ProgressRing value={readiness.pct} />
                  <div>
                    <div className="text-xs font-semibold text-slate-600">Go-live readiness</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">{Math.round(readiness.pct)}%</div>
                    <div className="mt-1 text-xs text-slate-500">{goLiveReady ? "Ready" : "Complete checklist"}</div>
                  </div>
                </div>

                <Button variant="outline" onClick={exportJSON}>
                  <Download className="h-4 w-4" /> Export JSON
                </Button>
                <Button variant="outline" onClick={saveDraft}>
                  <Save className="h-4 w-4" /> Save draft
                </Button>
                <Button variant="primary" disabled={!goLiveReady} onClick={goLive} title={!goLiveReady ? "Complete readiness checklist" : "Go live"}>
                  <BadgeCheck className="h-4 w-4" /> Go live
                </Button>
              </div>
            </div>

            {/* Wizard steps */}
            <div className="px-4 pb-4 md:px-6">
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-8">
                {steps.map((s, idx) => {
                  const active = s.id === step;
                  const done = idx < stepIndex;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setStep(s.id)}
                      className={cn(
                        "rounded-2xl border px-3 py-3 text-left transition",
                        active
                          ? "border-emerald-300 bg-emerald-50"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-xs font-semibold text-slate-600">Step {idx + 1}</div>
                          <div className="mt-1 text-sm font-semibold text-slate-900">{s.label}</div>
                          <div className="mt-1 text-xs text-slate-500">{s.subtitle}</div>
                        </div>
                        {done ? <BadgeCheck className="h-5 w-5 text-emerald-700" /> : active ? <ChevronRight className="h-5 w-5 text-emerald-700" /> : null}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                <Button variant="outline" onClick={prevStep} disabled={stepIndex === 0}>
                  Back
                </Button>
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" onClick={() => { setTemplateOpen(true); setTemplateId("corporate"); }}>
                    <Layers className="h-4 w-4" /> Templates
                  </Button>
                  <Button variant="primary" onClick={nextStep} disabled={stepIndex === steps.length - 1}>
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="bg-slate-50 px-4 py-5 md:px-6">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {/* Main */}
              <div className="lg:col-span-2">
                <AnimatePresence mode="wait">
                  {step === "profile" ? (
                    <motion.div key="profile" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }} className="space-y-4">
                      <Section title="Company profile" subtitle="Identity fields used for invoices, exports, and compliance.">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <Field label="Display name" required value={org.displayName} onChange={(v) => setOrg((p) => ({ ...p, displayName: v }))} placeholder="Organization name" />
                          <Field label="Legal name" required value={org.legalName} onChange={(v) => setOrg((p) => ({ ...p, legalName: v }))} placeholder="Legal registered name" />
                          <Field label="Registration number" value={org.registrationNo} onChange={(v) => setOrg((p) => ({ ...p, registrationNo: v }))} placeholder="Business registration" />
                          <Field label="Website" value={org.website} onChange={(v) => setOrg((p) => ({ ...p, website: v }))} placeholder="https://" />

                          <Select
                            label="Industry"
                            value={org.industry}
                            onChange={(v) => setOrg((p) => ({ ...p, industry: v as OrgIndustry }))}
                            options={["Corporate", "Hospital", "Tour Company", "Other"].map((x) => ({ value: x, label: x }))}
                            hint="Premium templates" 
                          />

                          <Select
                            label="Base currency"
                            value={org.baseCurrency}
                            onChange={(v) => setOrg((p) => ({ ...p, baseCurrency: v }))}
                            options={["UGX", "USD", "EUR", "CNY", "KES", "TZS"].map((x) => ({ value: x, label: x }))}
                            hint="Can be per entity" 
                          />
                        </div>

                        <div className="mt-4 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                          Premium: Use the industry templates to apply best-practice defaults for Hospital, Tour Company, or Corporate.
                        </div>
                      </Section>
                    </motion.div>
                  ) : null}

                  {step === "entities" ? (
                    <motion.div key="entities" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }} className="space-y-4">
                      <Section
                        title="Entities and branches"
                        subtitle="Premium: multi-country entities under one organization. One must be primary."
                        right={
                          <Button variant="primary" onClick={openNewEntity}>
                            <Plus className="h-4 w-4" /> Add entity
                          </Button>
                        }
                      >
                        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                          <table className="min-w-full text-left text-sm">
                            <thead className="bg-slate-50 text-xs text-slate-600">
                              <tr>
                                <th className="px-4 py-3 font-semibold">Name</th>
                                <th className="px-4 py-3 font-semibold">Country</th>
                                <th className="px-4 py-3 font-semibold">City</th>
                                <th className="px-4 py-3 font-semibold">Currency</th>
                                <th className="px-4 py-3 font-semibold">Tax</th>
                                <th className="px-4 py-3 font-semibold">Primary</th>
                                <th className="px-4 py-3 font-semibold">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {entities.map((e) => (
                                <tr key={e.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                                  <td className="px-4 py-3 font-semibold text-slate-900">{e.name}</td>
                                  <td className="px-4 py-3 text-slate-700">{e.country}</td>
                                  <td className="px-4 py-3 text-slate-700">{e.city}</td>
                                  <td className="px-4 py-3 text-slate-700">{e.currency}</td>
                                  <td className="px-4 py-3 text-slate-700">{e.taxId || "-"}</td>
                                  <td className="px-4 py-3">
                                    <Pill label={e.isPrimary ? "Yes" : "No"} tone={e.isPrimary ? "good" : "neutral"} />
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => openEditEntity(e)}>
                                        <Pencil className="h-4 w-4" /> Edit
                                      </Button>
                                      <Button variant="danger" className="px-3 py-2 text-xs" onClick={() => deleteEntity(e.id)}>
                                        <Trash2 className="h-4 w-4" /> Delete
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                              {!entities.length ? (
                                <tr>
                                  <td colSpan={7} className="px-4 py-10">
                                    <Empty title="No entities" subtitle="Add at least one entity and mark it primary." />
                                  </td>
                                </tr>
                              ) : null}
                            </tbody>
                          </table>
                        </div>

                        <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                          Best practice: invoice groups can route per entity using AP codes.
                        </div>
                      </Section>
                    </motion.div>
                  ) : null}

                  {step === "billing" ? (
                    <motion.div key="billing" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }} className="space-y-4">
                      <Section
                        title="Billing contacts and AP distribution"
                        subtitle="Used for invoice delivery, reminders, and billing escalation."
                        right={
                          <Button variant="primary" onClick={openNewContact}>
                            <Plus className="h-4 w-4" /> Add contact
                          </Button>
                        }
                      >
                        <div className="space-y-2">
                          {billingContacts.map((c) => (
                            <div key={c.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <div className="text-sm font-semibold text-slate-900">{c.name}</div>
                                    <Pill label={c.role} tone="neutral" />
                                  </div>
                                  <div className="mt-1 text-xs text-slate-500">{c.email} • {c.phone}</div>
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    <Pill label={c.channels.email ? "Email" : "Email off"} tone={c.channels.email ? "good" : "neutral"} />
                                    <Pill label={c.channels.whatsapp ? "WhatsApp" : "WhatsApp off"} tone={c.channels.whatsapp ? "good" : "neutral"} />
                                    <Pill label={c.channels.wechat ? "WeChat" : "WeChat off"} tone={c.channels.wechat ? "good" : "neutral"} />
                                    <Pill label={c.channels.sms ? "SMS" : "SMS off"} tone={c.channels.sms ? "good" : "neutral"} />
                                  </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => { setContactDraft(c); setContactModalOpen(true); }}>
                                    <Pencil className="h-4 w-4" /> Edit
                                  </Button>
                                  <Button variant="danger" className="px-3 py-2 text-xs" onClick={() => deleteContact(c.id)}>
                                    <Trash2 className="h-4 w-4" /> Remove
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                          {!billingContacts.length ? <Empty title="No billing contacts" subtitle="Add at least one contact for invoice delivery." /> : null}
                        </div>

                        <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                          Premium: routing rules can send finance alerts to Accountants and approval reminders to Approvers.
                        </div>
                      </Section>
                    </motion.div>
                  ) : null}

                  {step === "branding" ? (
                    <motion.div key="branding" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }} className="space-y-4">
                      <Section title="Branding" subtitle="Logo and invoice styling.">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <div className="rounded-3xl border border-slate-200 bg-white p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="text-sm font-semibold text-slate-900">Logo</div>
                                <div className="mt-1 text-xs text-slate-500">Displayed on invoices and PDF exports.</div>
                              </div>
                              <input
                                ref={fileRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => onLogoFile(e.target.files?.[0] || null)}
                              />
                              <div className="flex flex-wrap items-center gap-2">
                                <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => fileRef.current?.click()}>
                                  <Upload className="h-4 w-4" /> Upload
                                </Button>
                                <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => { setLogoUrl(""); toast({ title: "Logo cleared", message: "Using placeholder.", kind: "info" }); }}>
                                  <Trash2 className="h-4 w-4" /> Clear
                                </Button>
                              </div>
                            </div>

                            <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                              <div className="text-xs font-semibold text-slate-600">Preview</div>
                              <div className="mt-3 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3">
                                <div className="grid h-12 w-12 place-items-center overflow-hidden rounded-2xl bg-slate-100 text-slate-700">
                                  {logoUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={logoUrl} alt="Logo" className="h-full w-full object-cover" />
                                  ) : (
                                    <ImageIcon className="h-6 w-6" />
                                  )}
                                </div>
                                <div>
                                  <div className="text-sm font-semibold text-slate-900">{org.displayName || "Organization"}</div>
                                  <div className="mt-1 text-xs text-slate-500">Invoice header</div>
                                </div>
                              </div>
                              <div className="mt-3 text-xs text-slate-600">Logos are stored securely in production.</div>
                            </div>
                          </div>

                          <div className="rounded-3xl border border-slate-200 bg-white p-4">
                            <TextArea label="Invoice footer" value={invoiceFooter} onChange={setInvoiceFooter} hint="Shown on all invoices" rows={5} />
                          </div>
                        </div>
                      </Section>

                      <Section title="Payment terms and instructions" subtitle="What appears on invoices and statements.">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <Field label="Payment terms" value={paymentTerms} onChange={setPaymentTerms} placeholder="Net 7" hint="Net 7, Net 14, Due on receipt" />
                          <Field label="Invoice subject prefix" value={org.displayName ? org.displayName.split(" ")[0].toUpperCase() : "ORG"} onChange={() => {}} placeholder="ACME" disabled hint="Derived" />
                          <div className="md:col-span-2">
                            <TextArea label="Payment instructions" value={paymentInstructions} onChange={setPaymentInstructions} hint="Bank transfer, mobile money, etc" rows={5} />
                          </div>
                        </div>
                        <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                          Premium: invoice templates can be customized per invoice group.
                        </div>
                      </Section>
                    </motion.div>
                  ) : null}

                  {step === "modules" ? (
                    <motion.div key="modules" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }} className="space-y-4">
                      <Section title="Module enablement" subtitle="High-level toggles. Detailed marketplace controls are on the next page (E).">
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          {SERVICE_MODULES.map((m) => (
                            <Toggle
                              key={m}
                              enabled={modulesEnabled[m]}
                              onChange={(v) => setModulesEnabled((p) => ({ ...p, [m]: v }))}
                              label={m}
                              description={m === "E-Commerce" ? "Includes marketplaces like MyLiveDealz and marts." : "Enable CorporatePay for this service module."}
                            />
                          ))}
                        </div>
                        <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                          Note: "Other Service Module" is a future expansion slot. You can label it later.
                        </div>
                      </Section>

                      <Section title="Policy defaults" subtitle="Regions, working hours, and default spend caps applied to new users and groups.">
                        <div className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-slate-900">Allowed regions</div>
                              <div className="mt-1 text-xs text-slate-500">Used for default geo restrictions.</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => toast({ title: "Tip", message: "Advanced geo-fences live in Policy Builder (I).", kind: "info" })}>
                                <Info className="h-4 w-4" /> Geo-fences
                              </Button>
                            </div>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2">
                            {policy.allowedRegions.map((r) => (
                              <Chip
                                key={r}
                                label={r}
                                onRemove={() => setPolicy((p) => ({ ...p, allowedRegions: p.allowedRegions.filter((x) => x !== r) }))}
                              />
                            ))}
                            {!policy.allowedRegions.length ? <Pill label="No regions" tone="warn" /> : null}
                          </div>

                          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                            <div className="md:col-span-2">
                              <Field label="Add region" value={regionDraft} onChange={setRegionDraft} placeholder="Example: Jinja" />
                            </div>
                            <div className="flex items-end">
                              <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => {
                                  const v = regionDraft.trim();
                                  if (!v) {
                                    toast({ title: "Missing", message: "Enter a region.", kind: "warn" });
                                    return;
                                  }
                                  if (policy.allowedRegions.map((x) => x.toLowerCase()).includes(v.toLowerCase())) {
                                    toast({ title: "Exists", message: "Region already listed.", kind: "info" });
                                    return;
                                  }
                                  setPolicy((p) => ({ ...p, allowedRegions: [v, ...p.allowedRegions] }));
                                  setRegionDraft("");
                                }}
                              >
                                <Plus className="h-4 w-4" /> Add
                              </Button>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <Section title="Working hours" subtitle="Default time window for eligible transactions.">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                              <Field label="Start" value={policy.workStart} onChange={(v) => setPolicy((p) => ({ ...p, workStart: v }))} type="time" />
                              <Field label="End" value={policy.workEnd} onChange={(v) => setPolicy((p) => ({ ...p, workEnd: v }))} type="time" />
                            </div>
                            <div className="mt-3">
                              <div className="text-xs font-semibold text-slate-600">Allowed days</div>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {"Mon,Tue,Wed,Thu,Fri,Sat,Sun".split(",").map((d) => {
                                  const on = policy.days.includes(d);
                                  return (
                                    <button
                                      key={d}
                                      type="button"
                                      className={cn(
                                        "rounded-full px-4 py-2 text-sm font-semibold ring-1 transition",
                                        on ? "text-white ring-emerald-600" : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
                                      )}
                                      style={on ? { background: EVZ.green } : undefined}
                                      onClick={() => {
                                        setPolicy((p) => ({
                                          ...p,
                                          days: on ? p.days.filter((x) => x !== d) : [...p.days, d],
                                        }));
                                      }}
                                    >
                                      {d}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </Section>

                          <Section title="Default spend caps" subtitle="Baseline limits applied to new users.">
                            <div className="grid grid-cols-1 gap-4">
                              <Field label="Default trip cap" value={policy.defaultTripCap} onChange={(v) => setPolicy((p) => ({ ...p, defaultTripCap: v }))} placeholder="UGX 250,000" />
                              <Field label="Default daily cap" value={policy.defaultDailyCap} onChange={(v) => setPolicy((p) => ({ ...p, defaultDailyCap: v }))} placeholder="UGX 1,200,000" />
                              <Field label="Default monthly cap" value={policy.defaultMonthlyCap} onChange={(v) => setPolicy((p) => ({ ...p, defaultMonthlyCap: v }))} placeholder="UGX 12,000,000" />
                              <Field label="Auto-approve under" value={policy.autoApproveUnder} onChange={(v) => setPolicy((p) => ({ ...p, autoApproveUnder: v }))} placeholder="UGX 200,000" hint="Above this routes to approval chain" />
                            </div>
                          </Section>
                        </div>
                      </Section>
                    </motion.div>
                  ) : null}

                  {step === "invoiceGroups" ? (
                    <motion.div key="invoiceGroups" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }} className="space-y-4">
                      <Section
                        title="Invoice groups"
                        subtitle="Enterprise billing distribution: route invoices to different AP emails and codes."
                        right={
                          <Button variant="primary" onClick={openNewInvoiceGroup}>
                            <Plus className="h-4 w-4" /> Add invoice group
                          </Button>
                        }
                      >
                        <div className="space-y-2">
                          {invoiceGroups.map((g) => (
                            <div key={g.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <div className="text-sm font-semibold text-slate-900">{g.name}</div>
                                    <Pill label={g.frequency} tone="neutral" />
                                    <Pill label={g.apCode} tone="info" />
                                    <Pill label={`Prefix: ${g.prefix}`} tone="neutral" />
                                  </div>
                                  <div className="mt-1 text-xs text-slate-500">AP: {g.apEmail} • CC: {g.ccEmails || "-"}</div>
                                  <div className="mt-1 text-xs text-slate-500">Entity: {g.entityScope === "All" ? "All entities" : (entities.find((e) => e.id === g.entityScope)?.name || "Entity")}</div>
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {Object.entries(g.moduleScope)
                                      .filter(([, on]) => on)
                                      .slice(0, 6)
                                      .map(([m]) => (
                                        <Pill key={m} label={m} tone="neutral" />
                                      ))}
                                    {Object.entries(g.moduleScope).filter(([, on]) => on).length > 6 ? <Pill label="+more" tone="neutral" /> : null}
                                  </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => openEditInvoiceGroup(g)}>
                                    <Pencil className="h-4 w-4" /> Edit
                                  </Button>
                                  <Button variant="danger" className="px-3 py-2 text-xs" onClick={() => deleteInvoiceGroup(g.id)}>
                                    <Trash2 className="h-4 w-4" /> Delete
                                  </Button>
                                </div>
                              </div>
                              {g.notes ? <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">{g.notes}</div> : null}
                            </div>
                          ))}
                          {!invoiceGroups.length ? (
                            <Empty title="No invoice groups" subtitle="Create at least one invoice group for AP distribution." />
                          ) : null}
                        </div>
                        <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                          Best practice: create invoice groups by department, region, or entity. Use AP codes for ERP mapping.
                        </div>
                      </Section>
                    </motion.div>
                  ) : null}

                  {step === "support" ? (
                    <motion.div key="support" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }} className="space-y-4">
                      <Section title="EVzone support access" subtitle="Enable or disable support mode for this organization.">
                        <div className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-slate-900">Support mode</div>
                              <div className="mt-1 text-xs text-slate-500">When enabled, EVzone support can sign in with a role-gated account.</div>
                            </div>
                            <Pill label={supportEnabled ? "Enabled" : "Disabled"} tone={supportEnabled ? "good" : "neutral"} />
                          </div>

                          <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                            Support safety:
                            <ul className="mt-2 space-y-1">
                              <li>1) View-only by default</li>
                              <li>2) No silent actions</li>
                              <li>3) Step-up authentication for write actions</li>
                              <li>4) Always audited and visible to org admins</li>
                            </ul>
                          </div>

                          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                            <Button variant="primary" disabled={supportEnabled} onClick={() => requestSupportToggle("enable")}>
                              <Shield className="h-4 w-4" /> Enable support
                            </Button>
                            <Button variant="danger" disabled={!supportEnabled} onClick={() => requestSupportToggle("disable")}>
                              <Shield className="h-4 w-4" /> Disable support
                            </Button>
                          </div>
                        </div>
                      </Section>
                    </motion.div>
                  ) : null}

                  {step === "goLive" ? (
                    <motion.div key="goLive" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }} className="space-y-4">
                      <Section title="Go-live readiness" subtitle="Premium: setup wizard and readiness checklist.">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <div className="rounded-3xl border border-slate-200 bg-white p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="text-sm font-semibold text-slate-900">Checklist</div>
                                <div className="mt-1 text-xs text-slate-500">Complete all items to enable go-live.</div>
                              </div>
                              <Pill label={`${Math.round(readiness.pct)}%`} tone={goLiveReady ? "good" : "warn"} />
                            </div>
                            <div className="mt-3 space-y-2">
                              <ChecklistRow ok={readiness.profileOk} label="Company profile" />
                              <ChecklistRow ok={readiness.entityOk} label="Primary entity" />
                              <ChecklistRow ok={readiness.billingOk} label="Billing contacts" />
                              <ChecklistRow ok={readiness.brandingOk} label="Branding and payment instructions" />
                              <ChecklistRow ok={readiness.moduleOk} label="At least one module enabled" />
                              <ChecklistRow ok={readiness.policyOk} label="Policy defaults" />
                              <ChecklistRow ok={readiness.invoiceOk} label="Invoice groups" />
                              <ChecklistRow ok={readiness.supportOk} label="Support mode set" />
                            </div>
                          </div>

                          <div className="rounded-3xl border border-slate-200 bg-white p-4">
                            <div className="text-sm font-semibold text-slate-900">Go-live actions</div>
                            <div className="mt-1 text-xs text-slate-500">Publish to enable CorporatePay at checkout.</div>

                            <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700">
                              Before go-live:
                              <ul className="mt-2 space-y-1 text-xs text-slate-600">
                                <li>1) Confirm invoice groups and AP emails</li>
                                <li>2) Confirm module enablement and policy defaults</li>
                                <li>3) Confirm support mode preference</li>
                              </ul>
                            </div>

                            <div className="mt-3 flex flex-col gap-2">
                              <Button variant="outline" onClick={exportJSON}>
                                <Download className="h-4 w-4" /> Export JSON
                              </Button>
                              <Button variant="outline" onClick={saveDraft}>
                                <Save className="h-4 w-4" /> Save draft
                              </Button>
                              <Button variant="primary" disabled={!goLiveReady} onClick={goLive}>
                                <BadgeCheck className="h-4 w-4" /> Go live
                              </Button>
                            </div>

                            {!goLiveReady ? (
                              <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                                Some items are pending. Use the wizard steps above to complete setup.
                              </div>
                            ) : (
                              <div className="mt-3 rounded-2xl bg-emerald-50 p-3 text-xs text-emerald-900 ring-1 ring-emerald-200">
                                Ready. CorporatePay can be enabled for employees at checkout.
                              </div>
                            )}
                          </div>
                        </div>
                      </Section>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>

              {/* Right rail */}
              <div className="space-y-4">
                <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Go-live readiness</div>
                      <div className="mt-1 text-xs text-slate-500">Quick view</div>
                    </div>
                    <Pill label={goLiveReady ? "Ready" : "Pending"} tone={goLiveReady ? "good" : "warn"} />
                  </div>
                  <div className="mt-3 space-y-2">
                    <ChecklistRow ok={readiness.profileOk} label="Profile" />
                    <ChecklistRow ok={readiness.entityOk} label="Entities" />
                    <ChecklistRow ok={readiness.billingOk} label="Billing" />
                    <ChecklistRow ok={readiness.brandingOk} label="Branding" />
                    <ChecklistRow ok={readiness.invoiceOk} label="Invoice groups" />
                  </div>
                  <Button variant="outline" className="mt-3 w-full" onClick={() => setStep("goLive")}>
                    <BadgeCheck className="h-4 w-4" /> Open checklist
                  </Button>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Template library</div>
                      <div className="mt-1 text-xs text-slate-500">Premium: Hospital, Tour, Corporate</div>
                    </div>
                    <Pill label="Premium" tone="info" />
                  </div>

                  <div className="mt-3 space-y-2">
                    {templates.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        className="w-full rounded-3xl border border-slate-200 bg-white p-4 text-left hover:bg-slate-50"
                        onClick={() => {
                          setTemplateId(t.id);
                          setTemplateOpen(true);
                        }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-slate-900">{t.name}</div>
                            <div className="mt-1 text-xs text-slate-500">{t.desc}</div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-slate-400" />
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                    Applying a template updates industry, module enablement, and policy defaults.
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Help</div>
                      <div className="mt-1 text-xs text-slate-500">Setup guidance</div>
                    </div>
                    <Pill label="Docs" tone="neutral" />
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-2">
                    <Button variant="outline" onClick={() => toast({ title: "Help Center", message: "Opening help center (demo).", kind: "info" })}>
                      <HelpCircle className="h-4 w-4" /> Help Center
                    </Button>
                    <Button variant="outline" onClick={() => toast({ title: "Support", message: "Creating a support ticket (demo).", kind: "info" })}>
                      <Mail className="h-4 w-4" /> Contact support
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <footer className="border-t border-slate-200 bg-white/60 py-6">
            <div className="mx-auto max-w-[1400px] px-4 text-xs text-slate-500 md:px-6">
              D Organization Profile and Program Setup v2: includes setup wizard, multi-entity branches, billing contacts, branding, module enablement, policy defaults, invoice groups, and EVzone support toggle.
            </div>
          </footer>
        </div>
      </div>

      {/* Entity modal */}
      <Modal
        open={entityModalOpen}
        title={entityDraft.id ? "Edit entity" : "New entity"}
        subtitle="Add a legal entity or branch. One entity must be primary."
        onClose={() => setEntityModalOpen(false)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setEntityModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={saveEntity}>
              <Save className="h-4 w-4" /> Save
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Entity name" required value={entityDraft.name} onChange={(v) => setEntityDraft((p) => ({ ...p, name: v }))} placeholder="Uganda HQ" />
          <Select
            label="Currency"
            value={entityDraft.currency}
            onChange={(v) => setEntityDraft((p) => ({ ...p, currency: v }))}
            options={["UGX", "USD", "EUR", "CNY", "KES", "TZS"].map((x) => ({ value: x, label: x }))}
          />
          <Field label="Country" required value={entityDraft.country} onChange={(v) => setEntityDraft((p) => ({ ...p, country: v }))} placeholder="Uganda" />
          <Field label="City" required value={entityDraft.city} onChange={(v) => setEntityDraft((p) => ({ ...p, city: v }))} placeholder="Kampala" />
          <Field label="Address line 1" required value={entityDraft.address1} onChange={(v) => setEntityDraft((p) => ({ ...p, address1: v }))} placeholder="Street, building" />
          <Field label="Address line 2" value={entityDraft.address2} onChange={(v) => setEntityDraft((p) => ({ ...p, address2: v }))} placeholder="Suite, floor" />
          <Field label="Postal / P.O. Box" value={entityDraft.postal} onChange={(v) => setEntityDraft((p) => ({ ...p, postal: v }))} placeholder="P.O. Box" />
          <Field label="Tax ID" value={entityDraft.taxId} onChange={(v) => setEntityDraft((p) => ({ ...p, taxId: v }))} placeholder="TIN..." />
          <Field label="VAT number" value={entityDraft.vatNo} onChange={(v) => setEntityDraft((p) => ({ ...p, vatNo: v }))} placeholder="VAT..." />

          <div className="md:col-span-2 rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-900">Primary entity</div>
                <div className="mt-1 text-xs text-slate-600">Primary is used as default for invoices.</div>
              </div>
              <button
                type="button"
                className={cn(
                  "relative h-7 w-12 rounded-full border transition",
                  entityDraft.isPrimary ? "border-emerald-300 bg-emerald-200" : "border-slate-200 bg-white"
                )}
                onClick={() => setEntityDraft((p) => ({ ...p, isPrimary: !p.isPrimary }))}
                aria-label="Toggle primary"
              >
                <span className={cn("absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition", entityDraft.isPrimary ? "left-[22px]" : "left-1")} />
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Billing contact modal */}
      <Modal
        open={contactModalOpen}
        title={contactDraft.id ? "Edit billing contact" : "Add billing contact"}
        subtitle="Configure invoice recipients and reminder channels."
        onClose={() => setContactModalOpen(false)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setContactModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={saveContact}>
              <Save className="h-4 w-4" /> Save
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Name" required value={contactDraft.name} onChange={(v) => setContactDraft((p) => ({ ...p, name: v }))} placeholder="Finance Desk" />
          <Select
            label="Role"
            value={contactDraft.role}
            onChange={(v) => setContactDraft((p) => ({ ...p, role: v as any }))}
            options={["Finance", "AP", "CFO", "Procurement", "Ops", "Other"].map((x) => ({ value: x, label: x }))}
          />
          <Field label="Email" required value={contactDraft.email} onChange={(v) => setContactDraft((p) => ({ ...p, email: v }))} placeholder="finance@company.com" />
          <Field label="Phone" value={contactDraft.phone} onChange={(v) => setContactDraft((p) => ({ ...p, phone: v }))} placeholder="+256..." />

          <div className="md:col-span-2 rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-semibold text-slate-900">Delivery channels</div>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { k: "email", label: "Email" },
                { k: "whatsapp", label: "WhatsApp" },
                { k: "wechat", label: "WeChat" },
                { k: "sms", label: "SMS" },
              ].map((x) => (
                <label key={x.k} className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={(contactDraft.channels as any)[x.k]}
                    onChange={(e) => setContactDraft((p) => ({ ...p, channels: { ...p.channels, [x.k]: e.target.checked } as any }))}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  {x.label}
                </label>
              ))}
            </div>
            <div className="mt-2 text-xs text-slate-600">Delivery logs appear in Notifications Center (B).</div>
          </div>
        </div>
      </Modal>

      {/* Invoice group modal */}
      <Modal
        open={invoiceModalOpen}
        title={invoiceDraft.id ? "Edit invoice group" : "New invoice group"}
        subtitle="Route invoices to AP recipients with codes and module scopes."
        onClose={() => setInvoiceModalOpen(false)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setInvoiceModalOpen(false)}>Cancel</Button>
            <div className="flex flex-wrap items-center gap-2">
              {invoiceDraft.id ? (
                <Button variant="danger" onClick={() => { deleteInvoiceGroup(invoiceDraft.id); setInvoiceModalOpen(false); }}>
                  <Trash2 className="h-4 w-4" /> Delete
                </Button>
              ) : null}
              <Button variant="primary" onClick={saveInvoiceGroup}>
                <Save className="h-4 w-4" /> Save
              </Button>
            </div>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Group name" required value={invoiceDraft.name} onChange={(v) => setInvoiceDraft((p) => ({ ...p, name: v }))} placeholder="Sales travel" />
          <Select
            label="Entity scope"
            value={invoiceDraft.entityScope}
            onChange={(v) => setInvoiceDraft((p) => ({ ...p, entityScope: v }))}
            options={[
              { value: "All", label: "All entities" },
              ...entities.map((e) => ({ value: e.id, label: e.name })),
            ]}
          />
          <Field label="AP email" required value={invoiceDraft.apEmail} onChange={(v) => setInvoiceDraft((p) => ({ ...p, apEmail: v }))} placeholder="ap@company.com" />
          <Field label="AP code" required value={invoiceDraft.apCode} onChange={(v) => setInvoiceDraft((p) => ({ ...p, apCode: v }))} placeholder="ACME-SALES" hint="ERP mapping" />
          <Field label="Invoice prefix" required value={invoiceDraft.prefix} onChange={(v) => setInvoiceDraft((p) => ({ ...p, prefix: v }))} placeholder="ACME-SALES" />
          <Field label="CC emails" value={invoiceDraft.ccEmails} onChange={(v) => setInvoiceDraft((p) => ({ ...p, ccEmails: v }))} placeholder="finance@company.com" hint="Comma separated" />

          <div className="rounded-2xl border border-slate-200 bg-white p-3">
            <div className="text-xs font-semibold text-slate-600">Frequency</div>
            <select
              value={invoiceDraft.frequency}
              onChange={(e) => setInvoiceDraft((p) => ({ ...p, frequency: e.target.value as any }))}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none"
            >
              {(["Daily", "Weekly", "Monthly", "Custom"] as const).map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
            <div className="mt-2 text-xs text-slate-600">Invoice cycle can be independent of budget periods.</div>
          </div>

          <div className="md:col-span-2 rounded-3xl border border-slate-200 bg-white p-4">
            <div className="text-sm font-semibold text-slate-900">Module scope</div>
            <div className="mt-2 text-xs text-slate-600">Select which modules are included in this invoice group.</div>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {SERVICE_MODULES.map((m) => (
                <button
                  key={m}
                  type="button"
                  className={cn(
                    "rounded-2xl border px-3 py-3 text-left",
                    invoiceDraft.moduleScope[m] ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white hover:bg-slate-50"
                  )}
                  onClick={() => setInvoiceDraft((p) => ({ ...p, moduleScope: { ...p.moduleScope, [m]: !p.moduleScope[m] } }))}
                >
                  <div className="text-sm font-semibold text-slate-900">{m}</div>
                  <div className="mt-1 text-xs text-slate-600">{invoiceDraft.moduleScope[m] ? "Included" : "Excluded"}</div>
                </button>
              ))}
            </div>

            <div className={cn("mt-4", invoiceDraft.moduleScope["E-Commerce"] ? "" : "opacity-60")}>
              <div className="text-sm font-semibold text-slate-900">Marketplace scope</div>
              <div className="mt-1 text-xs text-slate-600">Applies when E-Commerce is included.</div>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {MARKETPLACES.map((m) => (
                  <button
                    key={m}
                    type="button"
                    disabled={!invoiceDraft.moduleScope["E-Commerce"]}
                    className={cn(
                      "rounded-2xl border px-3 py-3 text-left",
                      invoiceDraft.marketplaceScope[m] ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white hover:bg-slate-50",
                      !invoiceDraft.moduleScope["E-Commerce"] && "cursor-not-allowed"
                    )}
                    onClick={() => {
                      if (!invoiceDraft.moduleScope["E-Commerce"]) return;
                      setInvoiceDraft((p) => ({ ...p, marketplaceScope: { ...p.marketplaceScope, [m]: !p.marketplaceScope[m] } }));
                    }}
                  >
                    <div className="text-sm font-semibold text-slate-900">{m}</div>
                    <div className="mt-1 text-xs text-slate-600">{invoiceDraft.marketplaceScope[m] ? "Included" : "Excluded"}</div>
                  </button>
                ))}
              </div>
              <div className="mt-2 text-xs text-slate-600">"Other Marketplace" is a future expansion slot.</div>
            </div>
          </div>

          <div className="md:col-span-2">
            <TextArea label="Notes" value={invoiceDraft.notes} onChange={(v) => setInvoiceDraft((p) => ({ ...p, notes: v }))} placeholder="Explain how this invoice group is used" rows={4} />
          </div>
        </div>
      </Modal>

      {/* Support toggle modal */}
      <Modal
        open={supportModal !== null}
        title={supportModal === "enable" ? "Enable EVzone support mode" : "Disable EVzone support mode"}
        subtitle="Provide a reason. This change is audit logged."
        onClose={() => setSupportModal(null)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setSupportModal(null)}>Cancel</Button>
            <Button variant={supportModal === "disable" ? "danger" : "primary"} onClick={confirmSupportToggle}>
              <Shield className="h-4 w-4" /> Confirm
            </Button>
          </div>
        }
      >
        <TextArea label="Reason" value={supportReason} onChange={setSupportReason} placeholder="Example: enable support for troubleshooting invoice delivery" rows={4} />
        <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
          Support sessions are visible to org admins and never silent.
        </div>
      </Modal>

      {/* Template confirm modal */}
      <Modal
        open={templateOpen}
        title="Apply industry template"
        subtitle="This updates industry, module toggles, and policy defaults."
        onClose={() => setTemplateOpen(false)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setTemplateOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={applyTemplate}>
              <Layers className="h-4 w-4" /> Apply
            </Button>
          </div>
        }
      >
        {(() => {
          const t = templates.find((x) => x.id === templateId);
          if (!t) return null;
          return (
            <div className="space-y-3">
              <div className="rounded-3xl border border-slate-200 bg-white p-4">
                <div className="text-sm font-semibold text-slate-900">{t.name}</div>
                <div className="mt-1 text-sm text-slate-700">{t.desc}</div>
              </div>
              <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-amber-800 ring-1 ring-amber-200">
                    <Info className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">What changes</div>
                    <div className="mt-1 text-sm text-slate-700">Industry, module enablement, working hours, regions, and auto-approval threshold.</div>
                    <div className="mt-2 text-xs text-slate-600">You can edit everything after applying.</div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
