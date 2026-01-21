import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BadgeCheck,
  BarChart3,
  Building2,
  CalendarClock,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Download,
  FileText,
  Info,
  Mail,
  MessageSquare,
  Paperclip,
  Plus,
  Search,
  Shield,
  Star,
  Tag,
  Timer,
  Upload,
  Users,
  Wallet,
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

type VendorStatus = "Pending" | "Approved" | "Blocked";

type RiskLevel = "Low" | "Medium" | "High";

type RFQStatus = "Draft" | "Approval pending" | "Approved" | "Sent" | "Awarded" | "Closed";

type QuoteStatus = "Submitted" | "Withdrawn";

type ApprovalStatus = "Pending" | "Approved" | "Rejected";

type FundingType = "OpEx" | "CapEx";

type MilestoneStatus = "Planned" | "Invoiced" | "Paid";

type AssetType = "Vehicle" | "Equipment" | "Other";

type Attachment = { id: string; name: string; note: string; uploadedAt: number; uploadedBy: string };

type Vendor = {
  id: string;
  name: string;
  country: string;
  rating: number; // 0..5
  status: VendorStatus;
  riskLevel: RiskLevel;
  riskScore: number; // 0..100 high safer
  categories: string[];
  modules: ServiceModule[];
  marketplaces: Marketplace[];
  negotiatedDiscountPct: number;
  slaOnTimePct: number;
};

type ApprovalStep = {
  id: string;
  role: "Manager" | "Finance" | "CFO" | "CEO" | "EVzone Support";
  assignee: string;
  status: ApprovalStatus;
  slaHours: number;
  requestedAt: number;
  decidedAt?: number;
  decisionNote?: string;
};

type ApprovalTemplate = {
  id: string;
  name: string;
  appliesTo: "Any" | FundingType;
  minAmountUGX: number;
  description: string;
  steps: Array<{ role: ApprovalStep["role"]; slaHours: number }>;
};

type VendorInvite = {
  vendorId: string;
  status: "Not invited" | "Invited" | "Viewed" | "Quoted" | "Declined";
  invitedAt?: number;
  lastSeenAt?: number;
};

type QnaMessage = {
  id: string;
  at: number;
  by: "Buyer" | "Vendor";
  vendorId?: string;
  message: string;
  attachments: Attachment[];
};

type Quote = {
  id: string;
  rfqId: string;
  vendorId: string;
  createdAt: number;
  status: QuoteStatus;
  currency: "UGX" | "USD" | "EUR" | "CNY";
  total: number;
  leadTimeDays: number;
  warrantyMonths: number;
  paymentTerms: string;
  notes: string;
  attachments: Attachment[];
  lineItems: Array<{ description: string; qty: number; unitPrice: number }>; // currency implied
};

type Milestone = {
  id: string;
  name: string;
  pct: number; // 0..100
  dueInDays: number;
  status: MilestoneStatus;
};

type PurchaseOrder = {
  id: string;
  rfqId: string;
  vendorId: string;
  createdAt: number;
  status: "Draft" | "Issued" | "Accepted" | "Closed";
  total: number;
  currency: Quote["currency"];
  deliverTo: string;
  deliverByDays: number;
  shippingTerms: string;
  milestones: Milestone[];
  notes: string;
};

type HandoverItem = { id: string; label: string; done: boolean };

type AssetRecord = {
  id: string;
  tag: string;
  type: AssetType;
  description: string;
  serialNo: string;
  location: string;
  assignedTo: string;
  createdAt: number;
  checklist: HandoverItem[];
  attachments: Attachment[];
};

type RFQ = {
  id: string;
  title: string;
  createdAt: number;
  createdBy: string;
  status: RFQStatus;
  fundingType: FundingType;
  serviceModule: ServiceModule;
  marketplace?: Marketplace;
  category: string;
  specs: string;
  quantity: number;
  unit: string;
  deliveryLocation: string;
  warrantyNeeds: string;
  attachments: Attachment[];
  estimatedBudgetUGX: number;
  capexJustification: string;
  approvalTemplateId: string;
  approvals: ApprovalStep[];
  invited: VendorInvite[];
  qna: QnaMessage[];
  quotes: Quote[];
  selectedQuoteId?: string;
  po?: PurchaseOrder;
  assets: AssetRecord[];
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

function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
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

function formatUGX(n: number) {
  const v = Math.round(Number(n || 0));
  return `UGX ${v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

function formatMoney(n: number, currency: Quote["currency"]) {
  const v = Math.round(Number(n || 0));
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 0 }).format(v);
  } catch {
    return `${currency} ${v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
  }
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
        <FileText className="h-6 w-6" />
      </div>
      <div className="mt-3 text-sm font-semibold text-slate-900">{title}</div>
      <div className="mt-1 text-sm text-slate-600">{subtitle}</div>
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
            className="fixed inset-x-0 top-[7vh] z-50 mx-auto w-[min(1020px,calc(100vw-2rem))] overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(2,8,23,0.22)]"
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
              "lg:left-auto lg:right-4 lg:top-4 lg:bottom-4 lg:w-[740px]"
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

function makeChecklist(): HandoverItem[] {
  const labels = [
    "Delivery inspection completed",
    "Warranty documents received",
    "Commissioning completed",
    "Training provided",
    "Acceptance signed",
  ];
  return labels.map((l) => ({ id: uid("CHK"), label: l, done: false }));
}

function genAssetTag() {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `ASSET-${n}`;
}

function buildApprovalsFromTemplate(template: ApprovalTemplate, requestedAt: number, fundingType: FundingType, estimateUGX: number): ApprovalStep[] {
  const defaultAssigneeByRole: Record<ApprovalStep["role"], string> = {
    Manager: "Manager",
    Finance: "Finance Desk",
    CFO: "CFO",
    CEO: "CEO",
    "EVzone Support": "EVzone Support",
  };

  // If template applies to Any but high estimate, optionally add CFO
  let steps = template.steps.slice();
  if (template.appliesTo === "Any" && estimateUGX >= 15000000 && !steps.some((s) => s.role === "CFO")) {
    steps = [...steps, { role: "CFO", slaHours: 24 }];
  }

  // If CapEx, ensure CFO+CEO exist
  if (fundingType === "CapEx") {
    const hasCFO = steps.some((s) => s.role === "CFO");
    const hasCEO = steps.some((s) => s.role === "CEO");
    if (!hasCFO) steps = [...steps, { role: "CFO", slaHours: 24 }];
    if (!hasCEO) steps = [...steps, { role: "CEO", slaHours: 24 }];
  }

  return steps.map((s) => ({
    id: uid("APR"),
    role: s.role,
    assignee: defaultAssigneeByRole[s.role] || s.role,
    status: "Pending",
    slaHours: s.slaHours,
    requestedAt,
  }));
}

export default function CorporatePayRFQQuoteRequestsV2() {
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

  const [approvalTemplates, setApprovalTemplates] = useState<ApprovalTemplate[]>(() => [
    {
      id: "TPL-OPEX",
      name: "Standard OpEx",
      appliesTo: "OpEx",
      minAmountUGX: 0,
      description: "Manager then Finance approval. Suitable for routine procurement.",
      steps: [
        { role: "Manager", slaHours: 8 },
        { role: "Finance", slaHours: 12 },
      ],
    },
    {
      id: "TPL-CAPEX",
      name: "Executive CapEx",
      appliesTo: "CapEx",
      minAmountUGX: 0,
      description: "Manager then CFO then CEO. For high value assets and CapEx.",
      steps: [
        { role: "Manager", slaHours: 8 },
        { role: "CFO", slaHours: 24 },
        { role: "CEO", slaHours: 24 },
      ],
    },
    {
      id: "TPL-HIGH",
      name: "High Value OpEx",
      appliesTo: "Any",
      minAmountUGX: 10000000,
      description: "Manager and Finance. CFO added automatically when estimate is high.",
      steps: [
        { role: "Manager", slaHours: 8 },
        { role: "Finance", slaHours: 12 },
      ],
    },
  ]);

  const [vendors] = useState<Vendor[]>(() => [
    {
      id: "V-001",
      name: "EVzone Rides",
      country: "Uganda",
      rating: 4.6,
      status: "Approved",
      riskLevel: "Low",
      riskScore: 88,
      categories: ["Mobility", "Corporate transport"],
      modules: ["Rides & Logistics"],
      marketplaces: [],
      negotiatedDiscountPct: 7,
      slaOnTimePct: 93,
    },
    {
      id: "V-002",
      name: "EVzone Charging",
      country: "Uganda",
      rating: 4.3,
      status: "Approved",
      riskLevel: "Low",
      riskScore: 83,
      categories: ["Energy", "EV infrastructure"],
      modules: ["EVs & Charging"],
      marketplaces: [],
      negotiatedDiscountPct: 5,
      slaOnTimePct: 90,
    },
    {
      id: "V-010",
      name: "Shenzhen EV Motors",
      country: "China",
      rating: 4.2,
      status: "Approved",
      riskLevel: "Medium",
      riskScore: 74,
      categories: ["Vehicles", "Fleet"],
      modules: ["E-Commerce"],
      marketplaces: ["MyLiveDealz", "EVmart"],
      negotiatedDiscountPct: 10,
      slaOnTimePct: 84,
    },
    {
      id: "V-011",
      name: "Kampala Auto Supplier",
      country: "Uganda",
      rating: 4.0,
      status: "Approved",
      riskLevel: "Medium",
      riskScore: 70,
      categories: ["Vehicles", "Service"],
      modules: ["E-Commerce"],
      marketplaces: ["EVmart", "ServiceMart"],
      negotiatedDiscountPct: 4,
      slaOnTimePct: 86,
    },
    {
      id: "V-020",
      name: "Express CN",
      country: "China",
      rating: 2.9,
      status: "Blocked",
      riskLevel: "High",
      riskScore: 34,
      categories: ["Logistics"],
      modules: ["E-Commerce"],
      marketplaces: ["ExpressMart"],
      negotiatedDiscountPct: 0,
      slaOnTimePct: 62,
    },
  ]);

  // Budgets for premium CapEx vs OpEx scenario
  const [budgets] = useState(() => ({
    opExMonthlyLimitUGX: 12000000,
    opExMonthlyUsedUGX: 9800000,
    capExAnnualLimitUGX: 150000000,
    capExAnnualUsedUGX: 42000000,
  }));

  const opExRemaining = Math.max(0, budgets.opExMonthlyLimitUGX - budgets.opExMonthlyUsedUGX);
  const capExRemaining = Math.max(0, budgets.capExAnnualLimitUGX - budgets.capExAnnualUsedUGX);

  const [rfqs, setRfqs] = useState<RFQ[]>(() => {
    const now = Date.now();
    const rfq1: RFQ = {
      id: "RFQ-001",
      title: "Company vehicle procurement",
      createdAt: now - 6 * 24 * 60 * 60 * 1000,
      createdBy: "Procurement Desk",
      status: "Sent",
      fundingType: "CapEx",
      serviceModule: "E-Commerce",
      marketplace: "EVmart",
      category: "Vehicle",
      specs: "Electric SUV. Minimum 400km range. Right-hand drive. Warranty 5 years.",
      quantity: 1,
      unit: "Unit",
      deliveryLocation: "Millennium House, Nsambya Road 472, Kampala",
      warrantyNeeds: "5 years vehicle, 8 years battery",
      attachments: [
        { id: uid("AT"), name: "Vehicle specs.pdf", note: "Initial specs", uploadedAt: now - 6 * 24 * 60 * 60 * 1000, uploadedBy: "Procurement Desk" },
      ],
      estimatedBudgetUGX: 90000000,
      capexJustification: "High value asset cannot fit monthly OpEx. Requires CapEx approval.",
      approvalTemplateId: "TPL-CAPEX",
      approvals: buildApprovalsFromTemplate(
        {
          id: "TPL-CAPEX",
          name: "Executive CapEx",
          appliesTo: "CapEx",
          minAmountUGX: 0,
          description: "",
          steps: [
            { role: "Manager", slaHours: 8 },
            { role: "CFO", slaHours: 24 },
            { role: "CEO", slaHours: 24 },
          ],
        },
        now - 6 * 24 * 60 * 60 * 1000,
        "CapEx",
        90000000
      ).map((s, idx) => ({
        ...s,
        status: idx < 3 ? "Approved" : "Pending",
        decidedAt: now - 5 * 24 * 60 * 60 * 1000,
        decisionNote: "Approved",
      })),
      invited: [
        { vendorId: "V-010", status: "Invited", invitedAt: now - 5 * 24 * 60 * 60 * 1000, lastSeenAt: now - 4 * 24 * 60 * 60 * 1000 },
        { vendorId: "V-011", status: "Quoted", invitedAt: now - 5 * 24 * 60 * 60 * 1000, lastSeenAt: now - 2 * 24 * 60 * 60 * 1000 },
      ],
      qna: [
        { id: uid("QNA"), at: now - 4 * 24 * 60 * 60 * 1000, by: "Buyer", message: "Confirm charging standard and warranty terms.", attachments: [] },
        { id: uid("QNA"), at: now - 4 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000, by: "Vendor", vendorId: "V-011", message: "Supports CCS2. Warranty 5y vehicle and 8y battery.", attachments: [] },
      ],
      quotes: [
        {
          id: "QT-001",
          rfqId: "RFQ-001",
          vendorId: "V-011",
          createdAt: now - 2 * 24 * 60 * 60 * 1000,
          status: "Submitted",
          currency: "UGX",
          total: 88000000,
          leadTimeDays: 30,
          warrantyMonths: 60,
          paymentTerms: "30% deposit, 60% on delivery, 10% commissioning",
          notes: "Includes delivery and registration assistance.",
          attachments: [{ id: uid("AT"), name: "Quote.pdf", note: "Quotation", uploadedAt: now - 2 * 24 * 60 * 60 * 1000, uploadedBy: "Kampala Auto Supplier" }],
          lineItems: [{ description: "Electric SUV", qty: 1, unitPrice: 88000000 }],
        },
      ],
      selectedQuoteId: "QT-001",
      po: {
        id: "PO-001",
        rfqId: "RFQ-001",
        vendorId: "V-011",
        createdAt: now - 1 * 24 * 60 * 60 * 1000,
        status: "Issued",
        total: 88000000,
        currency: "UGX",
        deliverTo: "Millennium House, Nsambya Road 472, Kampala",
        deliverByDays: 30,
        shippingTerms: "DAP Kampala",
        milestones: [
          { id: uid("MS"), name: "Deposit", pct: 30, dueInDays: 2, status: "Invoiced" },
          { id: uid("MS"), name: "Delivery", pct: 60, dueInDays: 30, status: "Planned" },
          { id: uid("MS"), name: "Commissioning", pct: 10, dueInDays: 40, status: "Planned" },
        ],
        notes: "Milestone payments required.",
      },
      assets: [],
    };

    const rfq2: RFQ = {
      id: "RFQ-002",
      title: "Office generator replacement",
      createdAt: now - 3 * 24 * 60 * 60 * 1000,
      createdBy: "Admin",
      status: "Approval pending",
      fundingType: "OpEx",
      serviceModule: "E-Commerce",
      marketplace: "ServiceMart",
      category: "Equipment",
      specs: "Backup generator 50kVA, installation required.",
      quantity: 1,
      unit: "Unit",
      deliveryLocation: "Kampala HQ",
      warrantyNeeds: "Minimum 1 year",
      attachments: [],
      estimatedBudgetUGX: 18000000,
      capexJustification: "",
      approvalTemplateId: "TPL-HIGH",
      approvals: buildApprovalsFromTemplate(
        {
          id: "TPL-HIGH",
          name: "High Value OpEx",
          appliesTo: "Any",
          minAmountUGX: 10000000,
          description: "",
          steps: [
            { role: "Manager", slaHours: 8 },
            { role: "Finance", slaHours: 12 },
          ],
        },
        now - 3 * 24 * 60 * 60 * 1000,
        "OpEx",
        18000000
      ),
      invited: [],
      qna: [],
      quotes: [],
      assets: [],
    };

    return [rfq1, rfq2];
  });

  const [activeRfqId, setActiveRfqId] = useState<string>(() => "RFQ-001");
  const activeRfq = useMemo(() => rfqs.find((r) => r.id === activeRfqId) || null, [rfqs, activeRfqId]);

  const [pageTab, setPageTab] = useState<"rfqs" | "create" | "templates">("rfqs");
  const [detailTab, setDetailTab] = useState<"Overview" | "Approvals" | "Vendors" | "Quotes" | "PO" | "Assets">("Overview");

  // Create RFQ wizard
  const [createStep, setCreateStep] = useState<0 | 1 | 2 | 3 | 4>(0);
  const [draft, setDraft] = useState(() => ({
    title: "",
    fundingType: "OpEx" as FundingType,
    serviceModule: "E-Commerce" as ServiceModule,
    marketplace: "EVmart" as Marketplace,
    category: "Vehicle",
    specs: "",
    quantity: 1,
    unit: "Unit",
    deliveryLocation: "",
    warrantyNeeds: "",
    estimatedBudgetUGX: 0,
    capexJustification: "",
    approvalTemplateId: "TPL-OPEX",
    vendorIds: [] as string[],
    attachments: [] as Attachment[],
  }));

  const [addAttachmentOpen, setAddAttachmentOpen] = useState(false);
  const [attachmentDraft, setAttachmentDraft] = useState<{ name: string; note: string }>({ name: "", note: "" });

  const [sendInviteOpen, setSendInviteOpen] = useState(false);
  const [inviteNote, setInviteNote] = useState("Please submit your quotation with lead time and warranty.");

  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [quoteDraft, setQuoteDraft] = useState<{ vendorId: string; total: number; leadTimeDays: number; warrantyMonths: number; paymentTerms: string; notes: string }>({
    vendorId: "",
    total: 0,
    leadTimeDays: 30,
    warrantyMonths: 12,
    paymentTerms: "Net 14",
    notes: "",
  });

  const [assetModalOpen, setAssetModalOpen] = useState(false);
  const [assetDraft, setAssetDraft] = useState<{ type: AssetType; description: string; serialNo: string; location: string; assignedTo: string }>({
    type: "Vehicle",
    description: "",
    serialNo: "",
    location: "Kampala HQ",
    assignedTo: "",
  });

  const [qnaMessage, setQnaMessage] = useState("");
  const [qnaVendor, setQnaVendor] = useState<string>("");

  const kpis = useMemo(() => {
    const active = rfqs.filter((r) => r.status !== "Closed").length;
    const pendingApprovals = rfqs.filter((r) => r.status === "Approval pending").length;
    const quotes = rfqs.reduce((a, r) => a + r.quotes.length, 0);
    const capex = rfqs.filter((r) => r.fundingType === "CapEx").length;
    return { active, pendingApprovals, quotes, capex };
  }, [rfqs]);

  const canFitOpEx = useMemo(() => {
    const estimate = draft.estimatedBudgetUGX || 0;
    return estimate <= opExRemaining;
  }, [draft.estimatedBudgetUGX, opExRemaining]);

  const suggestedFundingType = useMemo<FundingType>(() => {
    const estimate = draft.estimatedBudgetUGX || 0;
    if (estimate <= 0) return draft.fundingType;
    if (estimate > opExRemaining) return "CapEx";
    return "OpEx";
  }, [draft.fundingType, draft.estimatedBudgetUGX, opExRemaining]);

  // Helpers
  const updateRfq = (rfqId: string, patch: Partial<RFQ>) => {
    setRfqs((prev) => prev.map((r) => (r.id === rfqId ? { ...r, ...patch } : r)));
  };

  const addRfqAttachment = (rfqId: string, att: Attachment) => {
    setRfqs((prev) => prev.map((r) => (r.id === rfqId ? { ...r, attachments: [att, ...r.attachments] } : r)));
  };

  const addToastExport = (title: string) => toast({ title, message: "Downloaded file.", kind: "success" });

  const exportRfqJSON = () => {
    if (!activeRfq) return;
    const payload = { rfq: activeRfq, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rfq-${activeRfq.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToastExport("Exported");
  };

  const exportQuotesCSV = () => {
    if (!activeRfq) return;
    const rows = activeRfq.quotes.map((q) => {
      const v = vendors.find((x) => x.id === q.vendorId);
      return {
        rfqId: activeRfq.id,
        vendor: v?.name || q.vendorId,
        currency: q.currency,
        total: q.total,
        leadTimeDays: q.leadTimeDays,
        warrantyMonths: q.warrantyMonths,
        paymentTerms: q.paymentTerms,
        notes: q.notes,
      };
    });
    const esc = (s: any) => {
      const v = String(s ?? "");
      if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
      return v;
    };
    const head = ["rfqId", "vendor", "currency", "total", "leadTimeDays", "warrantyMonths", "paymentTerms", "notes"].join(",");
    const body = rows.map((r) => [r.rfqId, r.vendor, r.currency, r.total, r.leadTimeDays, r.warrantyMonths, r.paymentTerms, r.notes].map(esc).join(",")).join("\n");
    const csv = `${head}\n${body}`;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rfq-${activeRfq.id}-quotes.csv`;
    a.click();
    URL.revokeObjectURL(url);
    addToastExport("Exported");
  };

  const printRfq = () => {
    if (!activeRfq) return;
    const html = `
      <html>
        <head>
          <title>RFQ ${activeRfq.id}</title>
          <style>
            body{font-family: ui-sans-serif, system-ui; padding:24px;}
            .muted{color:#64748b;font-size:12px}
            h2{margin:0}
            table{width:100%; border-collapse:collapse; margin-top:16px}
            th,td{border:1px solid #e2e8f0; padding:10px; font-size:12px}
            th{background:#f8fafc; text-align:left}
          </style>
        </head>
        <body>
          <h2>RFQ ${activeRfq.id} - ${activeRfq.title}</h2>
          <div class="muted">Status: ${activeRfq.status} • Funding: ${activeRfq.fundingType} • Created: ${fmtDate(activeRfq.createdAt)}</div>
          <div class="muted">Module: ${activeRfq.serviceModule}${activeRfq.marketplace ? ` • Marketplace: ${activeRfq.marketplace}` : ""}</div>
          <div class="muted">Delivery: ${activeRfq.deliveryLocation}</div>
          <h3 style="margin-top:16px">Specs</h3>
          <div>${activeRfq.specs}</div>
          <h3 style="margin-top:16px">Quotes</h3>
          <table>
            <thead>
              <tr><th>Vendor</th><th>Total</th><th>Lead time</th><th>Warranty</th><th>Terms</th></tr>
            </thead>
            <tbody>
              ${activeRfq.quotes
        .map((q) => {
          const v = vendors.find((x) => x.id === q.vendorId);
          return `<tr><td>${v?.name || q.vendorId}</td><td>${q.currency} ${q.total}</td><td>${q.leadTimeDays} days</td><td>${q.warrantyMonths} months</td><td>${q.paymentTerms}</td></tr>`;
        })
        .join("")}
            </tbody>
          </table>
          <div class="muted" style="margin-top:16px">Generated by EVzone CorporatePay</div>
        </body>
      </html>
    `;
    const w = window.open("", "_blank");
    if (!w) {
      toast({ title: "Popup blocked", message: "Allow popups to print/export PDF.", kind: "warn" });
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
    toast({ title: "Print ready", message: "Use Print to PDF to save.", kind: "info" });
  };

  const requestApprovalsForDraft = () => {
    if (!draft.title.trim()) {
      toast({ title: "Missing", message: "Add an RFQ title.", kind: "warn" });
      return;
    }
    if (!draft.deliveryLocation.trim()) {
      toast({ title: "Missing", message: "Add a delivery location.", kind: "warn" });
      return;
    }
    if (!draft.specs.trim()) {
      toast({ title: "Missing", message: "Add specifications.", kind: "warn" });
      return;
    }
    if (draft.estimatedBudgetUGX <= 0) {
      toast({ title: "Missing", message: "Add an estimated budget.", kind: "warn" });
      return;
    }

    const now = Date.now();
    const id = `RFQ-${String(100 + Math.floor(Math.random() * 900))}`;

    const tpl = approvalTemplates.find((t) => t.id === draft.approvalTemplateId) || approvalTemplates[0];
    const fundingType: FundingType = draft.fundingType;

    const approvals = buildApprovalsFromTemplate(tpl, now, fundingType, draft.estimatedBudgetUGX);

    const invited: VendorInvite[] = (draft.vendorIds.length ? draft.vendorIds : vendors.filter((v) => v.status === "Approved").slice(0, 2).map((v) => v.id)).map((vid) => ({
      vendorId: vid,
      status: "Not invited",
    }));

    const rfq: RFQ = {
      id,
      title: draft.title.trim(),
      createdAt: now,
      createdBy: "You",
      status: "Approval pending",
      fundingType,
      serviceModule: draft.serviceModule,
      marketplace: draft.serviceModule === "E-Commerce" ? draft.marketplace : undefined,
      category: draft.category.trim() || "High value asset",
      specs: draft.specs.trim(),
      quantity: Math.max(1, draft.quantity),
      unit: draft.unit.trim() || "Unit",
      deliveryLocation: draft.deliveryLocation.trim(),
      warrantyNeeds: draft.warrantyNeeds.trim(),
      attachments: draft.attachments,
      estimatedBudgetUGX: draft.estimatedBudgetUGX,
      capexJustification: fundingType === "CapEx" ? draft.capexJustification.trim() : "",
      approvalTemplateId: tpl.id,
      approvals,
      invited,
      qna: [],
      quotes: [],
      assets: [],
    };

    setRfqs((prev) => [rfq, ...prev]);
    setActiveRfqId(id);
    setPageTab("rfqs");
    setDetailTab("Approvals");
    toast({ title: "Submitted", message: "RFQ created and sent for approval.", kind: "success" });
  };

  const approveNext = (rfqId: string) => {
    const now = Date.now();
    setRfqs((prev) =>
      prev.map((r) => {
        if (r.id !== rfqId) return r;
        const idx = r.approvals.findIndex((a) => a.status === "Pending");
        if (idx < 0) return r;
        const approvals = r.approvals.slice();
        approvals[idx] = { ...approvals[idx], status: "Approved", decidedAt: now, decisionNote: "Approved" };
        const allApproved = approvals.every((a) => a.status === "Approved");
        return { ...r, approvals, status: allApproved ? "Approved" : r.status };
      })
    );
    toast({ title: "Approved", message: "Approval step approved.", kind: "success" });
  };

  const rejectApproval = (rfqId: string) => {
    const now = Date.now();
    setRfqs((prev) =>
      prev.map((r) => {
        if (r.id !== rfqId) return r;
        const idx = r.approvals.findIndex((a) => a.status === "Pending");
        if (idx < 0) return r;
        const approvals = r.approvals.slice();
        approvals[idx] = { ...approvals[idx], status: "Rejected", decidedAt: now, decisionNote: "Rejected" };
        return { ...r, approvals, status: "Draft" };
      })
    );
    toast({ title: "Rejected", message: "Approval rejected. RFQ moved back to Draft.", kind: "warn" });
  };

  const sendRFQToVendors = (rfqId: string) => {
    const now = Date.now();
    setRfqs((prev) =>
      prev.map((r) => {
        if (r.id !== rfqId) return r;
        if (r.status !== "Approved" && r.status !== "Sent") return r;
        const invited = r.invited.map((i) => {
          if (i.status === "Not invited") return { ...i, status: "Invited" as const, invitedAt: now, lastSeenAt: now };
          return i;
        });
        return { ...r, invited, status: "Sent" };
      })
    );
    toast({ title: "Sent", message: "RFQ sent to invited vendors.", kind: "success" });
  };

  const markVendorViewed = (rfqId: string, vendorId: string) => {
    const now = Date.now();
    setRfqs((prev) =>
      prev.map((r) => {
        if (r.id !== rfqId) return r;
        const invited = r.invited.map((i) => (i.vendorId === vendorId ? { ...i, status: i.status === "Invited" ? ("Viewed" as const) : i.status, lastSeenAt: now } : i));
        return { ...r, invited };
      })
    );
    toast({ title: "Updated", message: "Vendor marked as viewed.", kind: "info" });
  };

  const openNewQuote = (vendorId: string) => {
    if (!activeRfq) return;
    setQuoteDraft({ vendorId, total: activeRfq.estimatedBudgetUGX || 0, leadTimeDays: 30, warrantyMonths: 24, paymentTerms: "30/60/10", notes: "" });
    setQuoteModalOpen(true);
  };

  const submitQuote = () => {
    if (!activeRfq) return;
    if (!quoteDraft.vendorId) {
      toast({ title: "Missing", message: "Select a vendor.", kind: "warn" });
      return;
    }
    if (quoteDraft.total <= 0) {
      toast({ title: "Missing", message: "Add a quote total.", kind: "warn" });
      return;
    }
    const now = Date.now();
    const q: Quote = {
      id: uid("QT"),
      rfqId: activeRfq.id,
      vendorId: quoteDraft.vendorId,
      createdAt: now,
      status: "Submitted",
      currency: "UGX",
      total: quoteDraft.total,
      leadTimeDays: Math.max(1, quoteDraft.leadTimeDays),
      warrantyMonths: Math.max(0, quoteDraft.warrantyMonths),
      paymentTerms: quoteDraft.paymentTerms.trim() || "Net 14",
      notes: quoteDraft.notes.trim(),
      attachments: [{ id: uid("AT"), name: "Quote.pdf", note: "Uploaded", uploadedAt: now, uploadedBy: "Vendor" }],
      lineItems: [{ description: activeRfq.category || "Item", qty: activeRfq.quantity, unitPrice: quoteDraft.total / Math.max(1, activeRfq.quantity) }],
    };

    setRfqs((prev) =>
      prev.map((r) => {
        if (r.id !== activeRfq.id) return r;
        const quotes = [q, ...r.quotes];
        const invited = r.invited.map((i) => (i.vendorId === q.vendorId ? { ...i, status: "Quoted" as const, lastSeenAt: now } : i));
        return { ...r, quotes, invited };
      })
    );

    toast({ title: "Submitted", message: "Quote added.", kind: "success" });
    setQuoteModalOpen(false);
    setDetailTab("Quotes");
  };

  const selectWinningQuote = (quoteId: string) => {
    if (!activeRfq) return;
    updateRfq(activeRfq.id, { selectedQuoteId: quoteId });
    toast({ title: "Selected", message: "Winning quote selected.", kind: "success" });
  };

  const convertToPO = () => {
    if (!activeRfq) return;
    const q = activeRfq.quotes.find((x) => x.id === activeRfq.selectedQuoteId);
    if (!q) {
      toast({ title: "Select quote", message: "Select a winning quote first.", kind: "warn" });
      return;
    }
    const now = Date.now();
    const po: PurchaseOrder = {
      id: uid("PO"),
      rfqId: activeRfq.id,
      vendorId: q.vendorId,
      createdAt: now,
      status: "Draft",
      total: q.total,
      currency: q.currency,
      deliverTo: activeRfq.deliveryLocation,
      deliverByDays: q.leadTimeDays,
      shippingTerms: "DAP",
      milestones: [
        { id: uid("MS"), name: "Deposit", pct: 30, dueInDays: 2, status: "Planned" },
        { id: uid("MS"), name: "Delivery", pct: 60, dueInDays: q.leadTimeDays, status: "Planned" },
        { id: uid("MS"), name: "Commissioning", pct: 10, dueInDays: q.leadTimeDays + 10, status: "Planned" },
      ],
      notes: "Milestone payments required.",
    };

    setRfqs((prev) =>
      prev.map((r) => (r.id === activeRfq.id ? { ...r, po, status: "Awarded" } : r))
    );

    toast({ title: "Created", message: "Purchase order created.", kind: "success" });
    setDetailTab("PO");
  };

  const setPoStatus = (status: PurchaseOrder["status"]) => {
    if (!activeRfq?.po) return;
    setRfqs((prev) => prev.map((r) => (r.id === activeRfq.id ? { ...r, po: { ...r.po!, status } } : r)));
    toast({ title: "Updated", message: `PO status set to ${status}.`, kind: "info" });
  };

  const toggleMilestonePaid = (milestoneId: string) => {
    if (!activeRfq?.po) return;
    setRfqs((prev) =>
      prev.map((r) => {
        if (r.id !== activeRfq.id || !r.po) return r;
        const milestones = r.po.milestones.map((m) =>
          m.id === milestoneId ? { ...m, status: (m.status === "Paid" ? "Planned" : "Paid") as MilestoneStatus } : m
        );
        return { ...r, po: { ...r.po, milestones } };
      })
    );
    toast({ title: "Updated", message: "Milestone updated.", kind: "success" });
  };

  const addAsset = () => {
    if (!activeRfq?.po) {
      toast({ title: "PO required", message: "Create a PO before adding assets.", kind: "warn" });
      return;
    }
    setAssetDraft({ type: activeRfq.category.toLowerCase().includes("vehicle") ? "Vehicle" : "Equipment", description: activeRfq.title, serialNo: "", location: activeRfq.deliveryLocation, assignedTo: "" });
    setAssetModalOpen(true);
  };

  const saveAsset = () => {
    if (!activeRfq) return;
    if (!assetDraft.description.trim()) {
      toast({ title: "Missing", message: "Asset description is required.", kind: "warn" });
      return;
    }
    const now = Date.now();
    const rec: AssetRecord = {
      id: uid("AS"),
      tag: genAssetTag(),
      type: assetDraft.type,
      description: assetDraft.description.trim(),
      serialNo: assetDraft.serialNo.trim(),
      location: assetDraft.location.trim() || activeRfq.deliveryLocation,
      assignedTo: assetDraft.assignedTo.trim(),
      createdAt: now,
      checklist: makeChecklist(),
      attachments: [],
    };
    setRfqs((prev) => prev.map((r) => (r.id === activeRfq.id ? { ...r, assets: [rec, ...r.assets] } : r)));
    toast({ title: "Created", message: "Asset record created.", kind: "success" });
    setAssetModalOpen(false);
    setDetailTab("Assets");
  };

  const toggleChecklist = (assetId: string, itemId: string) => {
    if (!activeRfq) return;
    setRfqs((prev) =>
      prev.map((r) => {
        if (r.id !== activeRfq.id) return r;
        const assets = r.assets.map((a) => {
          if (a.id !== assetId) return a;
          const checklist = a.checklist.map((c) => (c.id === itemId ? { ...c, done: !c.done } : c));
          return { ...a, checklist };
        });
        return { ...r, assets };
      })
    );
  };

  const addQna = () => {
    if (!activeRfq) return;
    if (!qnaMessage.trim()) {
      toast({ title: "Empty", message: "Write a message.", kind: "warn" });
      return;
    }
    const now = Date.now();
    const msg: QnaMessage = {
      id: uid("QNA"),
      at: now,
      by: qnaVendor ? "Vendor" : "Buyer",
      vendorId: qnaVendor || undefined,
      message: qnaMessage.trim(),
      attachments: [],
    };
    setRfqs((prev) => prev.map((r) => (r.id === activeRfq.id ? { ...r, qna: [...r.qna, msg] } : r)));
    setQnaMessage("");
    toast({ title: "Sent", message: "Message added.", kind: "success" });
  };

  const addAttachmentToDraft = () => {
    if (!attachmentDraft.name.trim()) {
      toast({ title: "Missing", message: "Attachment name required.", kind: "warn" });
      return;
    }
    const now = Date.now();
    const att: Attachment = { id: uid("AT"), name: attachmentDraft.name.trim(), note: attachmentDraft.note.trim(), uploadedAt: now, uploadedBy: "You" };
    setDraft((p) => ({ ...p, attachments: [att, ...p.attachments] }));
    setAttachmentDraft({ name: "", note: "" });
    setAddAttachmentOpen(false);
    toast({ title: "Added", message: "Attachment added to draft.", kind: "success" });
  };

  const addAttachmentToActiveRfq = () => {
    if (!activeRfq) return;
    if (!attachmentDraft.name.trim()) {
      toast({ title: "Missing", message: "Attachment name required.", kind: "warn" });
      return;
    }
    const now = Date.now();
    const att: Attachment = { id: uid("AT"), name: attachmentDraft.name.trim(), note: attachmentDraft.note.trim(), uploadedAt: now, uploadedBy: "You" };
    addRfqAttachment(activeRfq.id, att);
    setAttachmentDraft({ name: "", note: "" });
    setAddAttachmentOpen(false);
    toast({ title: "Added", message: "Attachment added.", kind: "success" });
  };

  const ensureDraftFundingType = () => {
    if (draft.estimatedBudgetUGX > 0 && draft.estimatedBudgetUGX > opExRemaining) {
      setDraft((p) => ({ ...p, fundingType: "CapEx" }));
      toast({ title: "Suggested", message: "Estimate exceeds monthly OpEx. Switched to CapEx.", kind: "info" });
    }
  };

  // UI helpers
  const toneForStatus = (s: RFQStatus) => {
    if (s === "Approved" || s === "Awarded") return "good" as const;
    if (s === "Approval pending") return "warn" as const;
    if (s === "Sent") return "info" as const;
    if (s === "Closed") return "neutral" as const;
    return "neutral" as const;
  };

  const toneForVendor = (s: VendorInvite["status"]) => {
    if (s === "Quoted") return "good" as const;
    if (s === "Invited" || s === "Viewed") return "info" as const;
    if (s === "Declined") return "bad" as const;
    return "neutral" as const;
  };

  const toneForApproval = (s: ApprovalStatus) => {
    if (s === "Approved") return "good" as const;
    if (s === "Rejected") return "bad" as const;
    return "warn" as const;
  };

  const bestQuote = useMemo(() => {
    if (!activeRfq?.quotes.length) return null;
    return activeRfq.quotes.slice().sort((a, b) => a.total - b.total)[0];
  }, [activeRfq]);

  const selectedQuote = useMemo(() => {
    if (!activeRfq?.selectedQuoteId) return null;
    return activeRfq.quotes.find((q) => q.id === activeRfq.selectedQuoteId) || null;
  }, [activeRfq]);

  const savings = useMemo(() => {
    if (!activeRfq || !selectedQuote) return null;
    const b = bestQuote;
    if (!b) return null;
    const diff = selectedQuote.total - b.total;
    return { best: b.total, selected: selectedQuote.total, diff };
  }, [activeRfq, selectedQuote, bestQuote]);

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
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">RFQ and Quote Requests (High Value Assets)</div>
                  <div className="mt-1 text-xs text-slate-500">RFQ creation, approvals, vendor Q and A, quote comparison, PO conversion, milestone payments, and asset handover.</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Pill label={`Active RFQs: ${kpis.active}`} tone="neutral" />
                    <Pill label={`Approvals pending: ${kpis.pendingApprovals}`} tone={kpis.pendingApprovals ? "warn" : "good"} />
                    <Pill label={`Quotes received: ${kpis.quotes}`} tone={kpis.quotes ? "info" : "neutral"} />
                    <Pill label={`CapEx: ${kpis.capex}`} tone="info" />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={() => setPageTab("rfqs")}>
                  <ChevronRight className="h-4 w-4" /> RFQs
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    setPageTab("create");
                    setCreateStep(0);
                    toast({ title: "Create", message: "Start RFQ creation.", kind: "info" });
                  }}
                >
                  <Plus className="h-4 w-4" /> New RFQ
                </Button>
                <Button variant="outline" onClick={() => setPageTab("templates")}>
                  <Shield className="h-4 w-4" /> Approval templates
                </Button>
              </div>
            </div>

            {/* KPI strip */}
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4">
              <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold text-slate-500">OpEx remaining</div>
                    <div className="mt-1 text-2xl font-semibold text-slate-900">{formatUGX(opExRemaining)}</div>
                    <div className="mt-1 text-xs text-slate-600">Monthly budget</div>
                  </div>
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-50 text-slate-700 ring-1 ring-slate-200">
                    <Wallet className="h-5 w-5" />
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold text-slate-500">CapEx remaining</div>
                    <div className="mt-1 text-2xl font-semibold text-slate-900">{formatUGX(capExRemaining)}</div>
                    <div className="mt-1 text-xs text-slate-600">Annual allocation</div>
                  </div>
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-200">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold text-slate-500">Preferred vendors</div>
                    <div className="mt-1 text-2xl font-semibold text-slate-900">{vendors.filter((v) => v.status === "Approved" && v.riskLevel !== "High").length}</div>
                    <div className="mt-1 text-xs text-slate-600">Allowlisted vendors</div>
                  </div>
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-50 text-amber-800 ring-1 ring-amber-200">
                    <Star className="h-5 w-5" />
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold text-slate-500">High value workflow</div>
                    <div className="mt-1 text-2xl font-semibold text-slate-900">CapEx and milestones</div>
                    <div className="mt-1 text-xs text-slate-600">Executive approvals</div>
                  </div>
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                    <BadgeCheck className="h-5 w-5" />
                  </div>
                </div>
              </div>
            </div>

            {/* Page tabs */}
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                { id: "rfqs", label: "RFQs" },
                { id: "create", label: "Create RFQ" },
                { id: "templates", label: "Approval templates" },
              ].map((t) => (
                <button
                  key={t.id}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-semibold ring-1 transition",
                    pageTab === (t.id as any) ? "text-white ring-emerald-600" : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
                  )}
                  style={pageTab === (t.id as any) ? { background: EVZ.green } : undefined}
                  onClick={() => setPageTab(t.id as any)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Body */}
          <div className="bg-slate-50 px-4 py-5 md:px-6">
            {pageTab === "rfqs" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                {/* RFQ list */}
                <div className="lg:col-span-4 space-y-4">
                  <Section
                    title="RFQ list"
                    subtitle="Select an RFQ to manage approvals, vendors, quotes, and conversion."
                    right={<Pill label={`${rfqs.length} total`} tone="neutral" />}
                  >
                    <div className="space-y-2">
                      {rfqs.map((r) => {
                        const active = r.id === activeRfqId;
                        return (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => {
                              setActiveRfqId(r.id);
                              setDetailTab("Overview");
                            }}
                            className={cn(
                              "w-full rounded-3xl border bg-white p-4 text-left hover:bg-slate-50",
                              active ? "border-emerald-300 ring-4 ring-emerald-100" : "border-slate-200"
                            )}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <div className="truncate text-sm font-semibold text-slate-900">{r.title}</div>
                                  <Pill label={r.status} tone={toneForStatus(r.status)} />
                                  <Pill label={r.fundingType} tone={r.fundingType === "CapEx" ? "info" : "neutral"} />
                                </div>
                                <div className="mt-1 text-xs text-slate-500">{r.id} • Created {timeAgo(r.createdAt)} • By {r.createdBy}</div>
                                <div className="mt-1 text-xs text-slate-500">{r.serviceModule}{r.marketplace ? ` • ${r.marketplace}` : ""}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs text-slate-500">Estimate</div>
                                <div className="mt-1 text-sm font-semibold text-slate-900">{formatUGX(r.estimatedBudgetUGX)}</div>
                                <div className="mt-1 text-xs text-slate-500">Quotes {r.quotes.length}</div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                      {!rfqs.length ? <Empty title="No RFQs" subtitle="Create an RFQ to start procurement." /> : null}
                    </div>
                  </Section>

                  <Section title="Quick actions" subtitle="Common flows." right={<Pill label="Premium" tone="info" />}>
                    <div className="grid grid-cols-1 gap-2">
                      <Button
                        variant="primary"
                        onClick={() => {
                          setPageTab("create");
                          setCreateStep(0);
                        }}
                      >
                        <Plus className="h-4 w-4" /> New RFQ
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          if (!activeRfq) return;
                          setDetailTab("Approvals");
                          toast({ title: "Approvals", message: "Open approvals tab.", kind: "info" });
                        }}
                        disabled={!activeRfq}
                      >
                        <Shield className="h-4 w-4" /> Approvals
                      </Button>
                      <Button variant="outline" onClick={() => setDetailTab("Quotes")} disabled={!activeRfq}>
                        <BarChart3 className="h-4 w-4" /> Quote comparison
                      </Button>
                      <Button variant="outline" onClick={() => setDetailTab("PO")} disabled={!activeRfq}>
                        <FileText className="h-4 w-4" /> PO and invoices
                      </Button>
                    </div>
                  </Section>
                </div>

                {/* RFQ details */}
                <div className="lg:col-span-8 space-y-4">
                  <Section
                    title="RFQ details"
                    subtitle="Manage the selected RFQ."
                    right={
                      <div className="flex flex-wrap items-center gap-2">
                        <Button variant="outline" onClick={exportRfqJSON} disabled={!activeRfq}>
                          <Download className="h-4 w-4" /> Export JSON
                        </Button>
                        <Button variant="outline" onClick={printRfq} disabled={!activeRfq}>
                          <FileText className="h-4 w-4" /> Export PDF
                        </Button>
                      </div>
                    }
                  >
                    {!activeRfq ? (
                      <Empty title="Select an RFQ" subtitle="Choose an RFQ from the list to view details." />
                    ) : (
                      <>
                        <div className="flex flex-wrap gap-2">
                          {(["Overview", "Approvals", "Vendors", "Quotes", "PO", "Assets"] as const).map((t) => (
                            <button
                              key={t}
                              className={cn(
                                "rounded-full px-4 py-2 text-sm font-semibold ring-1 transition",
                                detailTab === t ? "text-white ring-emerald-600" : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
                              )}
                              style={detailTab === t ? { background: EVZ.green } : undefined}
                              onClick={() => setDetailTab(t)}
                            >
                              {t}
                            </button>
                          ))}
                        </div>

                        {/* Overview */}
                        {detailTab === "Overview" ? (
                          <div className="mt-4 space-y-4">
                            <div className="rounded-3xl border border-slate-200 bg-white p-4">
                              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <div className="text-sm font-semibold text-slate-900">{activeRfq.title}</div>
                                    <Pill label={activeRfq.status} tone={toneForStatus(activeRfq.status)} />
                                    <Pill label={activeRfq.fundingType} tone={activeRfq.fundingType === "CapEx" ? "info" : "neutral"} />
                                  </div>
                                  <div className="mt-1 text-xs text-slate-500">{activeRfq.id} • Created {fmtDateTime(activeRfq.createdAt)} • By {activeRfq.createdBy}</div>
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    <Pill label={activeRfq.serviceModule} tone="neutral" />
                                    {activeRfq.marketplace ? <Pill label={activeRfq.marketplace} tone="neutral" /> : null}
                                    <Pill label={`Qty ${activeRfq.quantity} ${activeRfq.unit}`} tone="neutral" />
                                    <Pill label={`Estimate ${formatUGX(activeRfq.estimatedBudgetUGX)}`} tone="info" />
                                  </div>
                                  <div className="mt-3 text-sm text-slate-700">Delivery: <span className="font-semibold">{activeRfq.deliveryLocation}</span></div>
                                  {activeRfq.warrantyNeeds ? <div className="mt-1 text-sm text-slate-700">Warranty: <span className="font-semibold">{activeRfq.warrantyNeeds}</span></div> : null}
                                </div>

                                <div className="flex flex-col items-start gap-2 md:items-end">
                                  <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-700 ring-1 ring-slate-200">
                                    <div className="font-semibold text-slate-900">Budget check</div>
                                    <div className="mt-1">OpEx remaining: <span className="font-semibold">{formatUGX(opExRemaining)}</span></div>
                                    <div className="mt-1">CapEx remaining: <span className="font-semibold">{formatUGX(capExRemaining)}</span></div>
                                    {activeRfq.fundingType === "OpEx" && activeRfq.estimatedBudgetUGX > opExRemaining ? (
                                      <div className="mt-2 text-rose-700 font-semibold">Does not fit OpEx. Consider CapEx.</div>
                                    ) : null}
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <Button
                                      variant="primary"
                                      onClick={() => approveNext(activeRfq.id)}
                                      disabled={activeRfq.status !== "Approval pending" || !activeRfq.approvals.some((a) => a.status === "Pending")}
                                    >
                                      <Check className="h-4 w-4" /> Approve next
                                    </Button>
                                    <Button
                                      variant="outline"
                                      onClick={() => sendRFQToVendors(activeRfq.id)}
                                      disabled={!(activeRfq.status === "Approved" || activeRfq.status === "Sent")}
                                    >
                                      <Mail className="h-4 w-4" /> Send RFQ
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <Section title="Specifications" subtitle="What vendors will quote against." right={<Pill label="Core" tone="neutral" />}>
                              <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-700 ring-1 ring-slate-200 whitespace-pre-wrap">{activeRfq.specs}</div>
                            </Section>

                            <Section
                              title="Attachments"
                              subtitle="Specs, drawings, or requirements."
                              right={
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setAttachmentDraft({ name: "", note: "" });
                                    setAddAttachmentOpen(true);
                                  }}
                                >
                                  <Upload className="h-4 w-4" /> Add
                                </Button>
                              }
                            >
                              <div className="space-y-2">
                                {activeRfq.attachments.map((a) => (
                                  <div key={a.id} className="rounded-2xl border border-slate-200 bg-white p-3">
                                    <div className="flex items-start justify-between gap-3">
                                      <div>
                                        <div className="text-sm font-semibold text-slate-900">{a.name}</div>
                                        <div className="mt-1 text-xs text-slate-500">{fmtDateTime(a.uploadedAt)} • {a.uploadedBy}</div>
                                        {a.note ? <div className="mt-1 text-xs text-slate-600">Note: {a.note}</div> : null}
                                      </div>
                                      <Button
                                        variant="outline"
                                        className="px-3 py-2 text-xs"
                                        onClick={async () => {
                                          try {
                                            await navigator.clipboard.writeText(a.name);
                                            toast({ title: "Copied", message: "Attachment name copied.", kind: "success" });
                                          } catch {
                                            toast({ title: "Copy failed", message: "Copy manually.", kind: "warn" });
                                          }
                                        }}
                                      >
                                        <Copy className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                                {!activeRfq.attachments.length ? <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">No attachments.</div> : null}
                              </div>
                            </Section>
                          </div>
                        ) : null}

                        {/* Approvals */}
                        {detailTab === "Approvals" ? (
                          <div className="mt-4 space-y-4">
                            <Section
                              title="Approval chain"
                              subtitle="Required approvals before sending RFQ."
                              right={<Pill label={approvalTemplates.find((t) => t.id === activeRfq.approvalTemplateId)?.name || activeRfq.approvalTemplateId} tone="info" />}
                            >
                              <div className="space-y-2">
                                {activeRfq.approvals.map((a, idx) => (
                                  <div key={a.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                                    <div className="flex items-start justify-between gap-3">
                                      <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                          <Pill label={`Step ${idx + 1}`} tone="neutral" />
                                          <Pill label={a.role} tone="neutral" />
                                          <Pill label={a.status} tone={toneForApproval(a.status)} />
                                          <Pill label={`SLA ${a.slaHours}h`} tone="info" />
                                        </div>
                                        <div className="mt-2 text-sm font-semibold text-slate-900">Assignee: {a.assignee}</div>
                                        <div className="mt-1 text-xs text-slate-500">Requested {fmtDateTime(a.requestedAt)}</div>
                                        {a.decidedAt ? <div className="mt-1 text-xs text-slate-500">Decided {fmtDateTime(a.decidedAt)} • {a.decisionNote || ""}</div> : null}
                                      </div>
                                      <div className="flex flex-wrap items-center gap-2">
                                        <Button
                                          variant="primary"
                                          className="px-3 py-2 text-xs"
                                          onClick={() => approveNext(activeRfq.id)}
                                          disabled={a.status !== "Pending" || activeRfq.status !== "Approval pending"}
                                        >
                                          <Check className="h-4 w-4" /> Approve
                                        </Button>
                                        <Button
                                          variant="outline"
                                          className="px-3 py-2 text-xs"
                                          onClick={() => rejectApproval(activeRfq.id)}
                                          disabled={a.status !== "Pending" || activeRfq.status !== "Approval pending"}
                                        >
                                          <X className="h-4 w-4" /> Reject
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                                {!activeRfq.approvals.length ? <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">No approvals configured.</div> : null}
                              </div>
                              <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                                Premium: Executive approval chain templates are used for CapEx and very high value purchases.
                              </div>
                            </Section>

                            <Section title="Send readiness" subtitle="RFQ can only be sent after approval." right={<Pill label="Core" tone="neutral" />}>
                              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                <div className="rounded-3xl border border-slate-200 bg-white p-4">
                                  <div className="text-sm font-semibold text-slate-900">Checklist</div>
                                  <div className="mt-2 space-y-2">
                                    <RowOk ok={!!activeRfq.specs.trim()} label="Specs provided" />
                                    <RowOk ok={!!activeRfq.deliveryLocation.trim()} label="Delivery location" />
                                    <RowOk ok={activeRfq.invited.length > 0} label="Vendors selected" />
                                    <RowOk ok={activeRfq.approvals.every((a) => a.status === "Approved")} label="Approvals completed" />
                                  </div>
                                </div>
                                <div className="rounded-3xl border border-slate-200 bg-white p-4">
                                  <div className="text-sm font-semibold text-slate-900">Actions</div>
                                  <div className="mt-2 text-xs text-slate-600">Only available once approved.</div>
                                  <div className="mt-3 flex flex-wrap items-center gap-2">
                                    <Button
                                      variant="primary"
                                      onClick={() => sendRFQToVendors(activeRfq.id)}
                                      disabled={!activeRfq.approvals.every((a) => a.status === "Approved")}
                                    >
                                      <Mail className="h-4 w-4" /> Send RFQ
                                    </Button>
                                    <Button variant="outline" onClick={() => setDetailTab("Vendors")}>
                                      <Users className="h-4 w-4" /> Vendors
                                    </Button>
                                  </div>
                                  {activeRfq.fundingType === "CapEx" ? (
                                    <div className="mt-3 rounded-2xl bg-blue-50 p-3 text-xs text-blue-700 ring-1 ring-blue-200">
                                      CapEx: milestone payments and asset handover will be enabled after quote award.
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                            </Section>
                          </div>
                        ) : null}

                        {/* Vendors */}
                        {detailTab === "Vendors" ? (
                          <div className="mt-4 space-y-4">
                            <Section
                              title="Vendor invitations"
                              subtitle="Invite vendors to quote and track status."
                              right={
                                <div className="flex flex-wrap items-center gap-2">
                                  <Button variant="outline" onClick={() => setSendInviteOpen(true)}>
                                    <Mail className="h-4 w-4" /> Invite
                                  </Button>
                                  <Button variant="outline" onClick={() => toast({ title: "Tip", message: "Use vendor allowlist from Vendor Management (R).", kind: "info" })}>
                                    <Info className="h-4 w-4" /> Tip
                                  </Button>
                                </div>
                              }
                            >
                              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                                <table className="min-w-full text-left text-sm">
                                  <thead className="bg-slate-50 text-xs text-slate-600">
                                    <tr>
                                      <th className="px-4 py-3 font-semibold">Vendor</th>
                                      <th className="px-4 py-3 font-semibold">Status</th>
                                      <th className="px-4 py-3 font-semibold">Rating</th>
                                      <th className="px-4 py-3 font-semibold">Risk</th>
                                      <th className="px-4 py-3 font-semibold">Last seen</th>
                                      <th className="px-4 py-3 font-semibold">Actions</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {activeRfq.invited.map((i) => {
                                      const v = vendors.find((x) => x.id === i.vendorId);
                                      const riskTone = v?.riskLevel === "High" ? "bad" : v?.riskLevel === "Medium" ? "warn" : "good";
                                      return (
                                        <tr key={i.vendorId} className="border-t border-slate-100 hover:bg-slate-50/60">
                                          <td className="px-4 py-3">
                                            <div className="font-semibold text-slate-900">{v?.name || i.vendorId}</div>
                                            <div className="mt-1 text-xs text-slate-500">{v?.country || "-"}</div>
                                          </td>
                                          <td className="px-4 py-3"><Pill label={i.status} tone={toneForVendor(i.status)} /></td>
                                          <td className="px-4 py-3 text-slate-700">{v ? `${v.rating.toFixed(1)} / 5` : "-"}</td>
                                          <td className="px-4 py-3">
                                            {v ? <Pill label={`${v.riskLevel} (${v.riskScore})`} tone={riskTone} /> : <Pill label="-" tone="neutral" />}
                                          </td>
                                          <td className="px-4 py-3 text-slate-700">{i.lastSeenAt ? timeAgo(i.lastSeenAt) : "-"}</td>
                                          <td className="px-4 py-3">
                                            <div className="flex flex-wrap items-center gap-2">
                                              <Button
                                                variant="outline"
                                                className="px-3 py-2 text-xs"
                                                onClick={() => markVendorViewed(activeRfq.id, i.vendorId)}
                                                disabled={i.status !== "Invited"}
                                              >
                                                <ChevronRight className="h-4 w-4" /> Mark viewed
                                              </Button>
                                              <Button
                                                variant="primary"
                                                className="px-3 py-2 text-xs"
                                                onClick={() => openNewQuote(i.vendorId)}
                                                disabled={i.status === "Declined"}
                                              >
                                                <Plus className="h-4 w-4" /> Add quote
                                              </Button>
                                            </div>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                    {!activeRfq.invited.length ? (
                                      <tr>
                                        <td colSpan={6} className="px-4 py-10"><Empty title="No vendors" subtitle="Invite vendors to start receiving quotes." /></td>
                                      </tr>
                                    ) : null}
                                  </tbody>
                                </table>
                              </div>
                            </Section>

                            <Section
                              title="Q and A thread"
                              subtitle="Clarify requirements with vendors."
                              right={<Pill label="Premium" tone="info" />}
                            >
                              <div className="space-y-2">
                                {activeRfq.qna.map((m) => {
                                  const v = m.vendorId ? vendors.find((x) => x.id === m.vendorId) : null;
                                  const bubble = m.by === "Buyer" ? "bg-emerald-50 border-emerald-200" : "bg-white border-slate-200";
                                  return (
                                    <div key={m.id} className={cn("rounded-3xl border p-4", bubble)}>
                                      <div className="flex items-start justify-between gap-3">
                                        <div>
                                          <div className="flex flex-wrap items-center gap-2">
                                            <Pill label={m.by} tone={m.by === "Buyer" ? "good" : "neutral"} />
                                            {v ? <Pill label={v.name} tone="info" /> : null}
                                          </div>
                                          <div className="mt-2 text-sm text-slate-800 whitespace-pre-wrap">{m.message}</div>
                                          <div className="mt-2 text-xs text-slate-500">{fmtDateTime(m.at)}</div>
                                        </div>
                                        <MessageSquare className="h-5 w-5 text-slate-400" />
                                      </div>
                                    </div>
                                  );
                                })}
                                {!activeRfq.qna.length ? <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">No messages yet.</div> : null}
                              </div>

                              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                                <Select
                                  label="Post as"
                                  value={qnaVendor}
                                  onChange={setQnaVendor}
                                  options={[{ value: "", label: "Buyer" }, ...activeRfq.invited.map((i) => ({ value: i.vendorId, label: vendors.find((v) => v.id === i.vendorId)?.name || i.vendorId }))]}
                                  hint="Simulate vendor reply"
                                />
                                <div className="md:col-span-2">
                                  <TextArea
                                    label="Message"
                                    value={qnaMessage}
                                    onChange={setQnaMessage}
                                    placeholder="Ask a question or reply"
                                    rows={3}
                                  />
                                </div>
                                <div className="md:col-span-3 flex justify-end">
                                  <Button variant="primary" onClick={addQna}>
                                    <Check className="h-4 w-4" /> Send
                                  </Button>
                                </div>
                              </div>

                              <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                                Premium: Q and A can require attachments and can be audit logged.
                              </div>
                            </Section>
                          </div>
                        ) : null}

                        {/* Quotes */}
                        {detailTab === "Quotes" ? (
                          <div className="mt-4 space-y-4">
                            <Section
                              title="Quote comparison"
                              subtitle="Compare vendor quotes and select a winner."
                              right={
                                <div className="flex flex-wrap items-center gap-2">
                                  <Button variant="outline" onClick={exportQuotesCSV}>
                                    <Download className="h-4 w-4" /> Export CSV
                                  </Button>
                                  <Button variant="primary" onClick={convertToPO}>
                                    <FileText className="h-4 w-4" /> Convert to PO
                                  </Button>
                                </div>
                              }
                            >
                              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                                <table className="min-w-full text-left text-sm">
                                  <thead className="bg-slate-50 text-xs text-slate-600">
                                    <tr>
                                      <th className="px-4 py-3 font-semibold">Vendor</th>
                                      <th className="px-4 py-3 font-semibold">Total</th>
                                      <th className="px-4 py-3 font-semibold">Lead time</th>
                                      <th className="px-4 py-3 font-semibold">Warranty</th>
                                      <th className="px-4 py-3 font-semibold">Terms</th>
                                      <th className="px-4 py-3 font-semibold">Status</th>
                                      <th className="px-4 py-3 font-semibold">Select</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {activeRfq.quotes
                                      .slice()
                                      .sort((a, b) => a.total - b.total)
                                      .map((q) => {
                                        const v = vendors.find((x) => x.id === q.vendorId);
                                        const selected = activeRfq.selectedQuoteId === q.id;
                                        const best = bestQuote?.id === q.id;
                                        return (
                                          <tr key={q.id} className={cn("border-t border-slate-100 hover:bg-slate-50/60", selected && "bg-emerald-50/40")}>
                                            <td className="px-4 py-3">
                                              <div className="font-semibold text-slate-900">{v?.name || q.vendorId}</div>
                                              <div className="mt-1 text-xs text-slate-500">{q.id}{best ? " • Best" : ""}</div>
                                            </td>
                                            <td className="px-4 py-3 font-semibold text-slate-900">{formatMoney(q.total, q.currency)}</td>
                                            <td className="px-4 py-3 text-slate-700">{q.leadTimeDays} days</td>
                                            <td className="px-4 py-3 text-slate-700">{q.warrantyMonths} months</td>
                                            <td className="px-4 py-3 text-slate-700">{q.paymentTerms}</td>
                                            <td className="px-4 py-3"><Pill label={q.status} tone="neutral" /></td>
                                            <td className="px-4 py-3">
                                              <Button
                                                variant={selected ? "primary" : "outline"}
                                                className="px-3 py-2 text-xs"
                                                onClick={() => selectWinningQuote(q.id)}
                                              >
                                                <Check className="h-4 w-4" /> {selected ? "Selected" : "Select"}
                                              </Button>
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    {!activeRfq.quotes.length ? (
                                      <tr>
                                        <td colSpan={7} className="px-4 py-10"><Empty title="No quotes" subtitle="Invite vendors and add quotes." /></td>
                                      </tr>
                                    ) : null}
                                  </tbody>
                                </table>
                              </div>

                              {savings ? (
                                <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700 ring-1 ring-slate-200">
                                  <div className="font-semibold text-slate-900">Savings analysis</div>
                                  <div className="mt-1">Best quote: <span className="font-semibold">{formatMoney(savings.best, "UGX")}</span></div>
                                  <div className="mt-1">Selected: <span className="font-semibold">{formatMoney(savings.selected, "UGX")}</span></div>
                                  <div className="mt-1">Difference: <span className={cn("font-semibold", savings.diff <= 0 ? "text-emerald-700" : "text-rose-700")}>{formatMoney(savings.diff, "UGX")}</span></div>
                                </div>
                              ) : null}

                              <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                                Premium: quote comparison can include compliance and contract checks and can recommend preferred vendors.
                              </div>
                            </Section>
                          </div>
                        ) : null}

                        {/* PO */}
                        {detailTab === "PO" ? (
                          <div className="mt-4 space-y-4">
                            <Section
                              title="Purchase order"
                              subtitle="Convert quote to PO then track milestone payments and invoices."
                              right={
                                <div className="flex flex-wrap items-center gap-2">
                                  <Button variant="outline" onClick={convertToPO}>
                                    <Plus className="h-4 w-4" /> Create PO
                                  </Button>
                                  <Button
                                    variant="outline"
                                    onClick={() => toast({ title: "Invoices", message: "In production, each milestone generates an invoice.", kind: "info" })}
                                  >
                                    <FileText className="h-4 w-4" /> Invoice schedule
                                  </Button>
                                </div>
                              }
                            >
                              {!activeRfq.po ? (
                                <Empty title="No PO" subtitle="Select a winning quote and convert to a purchase order." />
                              ) : (
                                <div className="space-y-4">
                                  <div className="rounded-3xl border border-slate-200 bg-white p-4">
                                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                      <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                          <div className="text-sm font-semibold text-slate-900">{activeRfq.po.id}</div>
                                          <Pill label={activeRfq.po.status} tone={activeRfq.po.status === "Accepted" ? "good" : activeRfq.po.status === "Issued" ? "info" : "neutral"} />
                                          {selectedQuote ? <Pill label={vendors.find((v) => v.id === selectedQuote.vendorId)?.name || selectedQuote.vendorId} tone="neutral" /> : null}
                                        </div>
                                        <div className="mt-1 text-xs text-slate-500">Created {fmtDateTime(activeRfq.po.createdAt)} • Deliver by {activeRfq.po.deliverByDays} day(s)</div>
                                        <div className="mt-2 text-sm text-slate-700">Deliver to: <span className="font-semibold">{activeRfq.po.deliverTo}</span></div>
                                        <div className="mt-1 text-sm text-slate-700">Shipping: <span className="font-semibold">{activeRfq.po.shippingTerms}</span></div>
                                      </div>
                                      <div className="text-right">
                                        <div className="text-xs text-slate-500">Total</div>
                                        <div className="mt-1 text-lg font-semibold text-slate-900">{formatMoney(activeRfq.po.total, activeRfq.po.currency)}</div>
                                        <div className="mt-2 flex flex-wrap justify-end gap-2">
                                          <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => setPoStatus("Issued")}>
                                            <Mail className="h-4 w-4" /> Issue
                                          </Button>
                                          <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => setPoStatus("Accepted")}>
                                            <BadgeCheck className="h-4 w-4" /> Accept
                                          </Button>
                                          <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => setPoStatus("Closed")}>
                                            <Check className="h-4 w-4" /> Close
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  <Section title="Milestone payments" subtitle="Premium: deposit, delivery, commissioning." right={<Pill label="Premium" tone="info" />}>
                                    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                                      <table className="min-w-full text-left text-sm">
                                        <thead className="bg-slate-50 text-xs text-slate-600">
                                          <tr>
                                            <th className="px-4 py-3 font-semibold">Milestone</th>
                                            <th className="px-4 py-3 font-semibold">Percent</th>
                                            <th className="px-4 py-3 font-semibold">Due in</th>
                                            <th className="px-4 py-3 font-semibold">Amount</th>
                                            <th className="px-4 py-3 font-semibold">Status</th>
                                            <th className="px-4 py-3 font-semibold">Action</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {activeRfq.po.milestones.map((m) => {
                                            const amt = Math.round((activeRfq.po!.total * m.pct) / 100);
                                            const tone = m.status === "Paid" ? "good" : m.status === "Invoiced" ? "info" : "neutral";
                                            return (
                                              <tr key={m.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                                                <td className="px-4 py-3 font-semibold text-slate-900">{m.name}</td>
                                                <td className="px-4 py-3 text-slate-700">{m.pct}%</td>
                                                <td className="px-4 py-3 text-slate-700">{m.dueInDays} day(s)</td>
                                                <td className="px-4 py-3 font-semibold text-slate-900">{formatMoney(amt, activeRfq.po!.currency)}</td>
                                                <td className="px-4 py-3"><Pill label={m.status} tone={tone} /></td>
                                                <td className="px-4 py-3">
                                                  <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => toggleMilestonePaid(m.id)}>
                                                    <Timer className="h-4 w-4" /> Toggle paid
                                                  </Button>
                                                </td>
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                    </div>

                                    <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                                      In production, each milestone produces an invoice and reconciles in Transactions.
                                    </div>
                                  </Section>
                                </div>
                              )}
                            </Section>
                          </div>
                        ) : null}

                        {/* Assets */}
                        {detailTab === "Assets" ? (
                          <div className="mt-4 space-y-4">
                            <Section
                              title="Assets and handover"
                              subtitle="Premium: asset tagging and handover checklist for vehicles and equipment."
                              right={
                                <Button variant="primary" onClick={addAsset}>
                                  <Tag className="h-4 w-4" /> New asset
                                </Button>
                              }
                            >
                              <div className="space-y-3">
                                {activeRfq.assets.map((a) => {
                                  const done = a.checklist.filter((c) => c.done).length;
                                  const total = a.checklist.length;
                                  return (
                                    <div key={a.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                        <div>
                                          <div className="flex flex-wrap items-center gap-2">
                                            <Pill label={a.type} tone="neutral" />
                                            <Pill label={a.tag} tone="info" />
                                            <div className="text-sm font-semibold text-slate-900">{a.description}</div>
                                          </div>
                                          <div className="mt-1 text-xs text-slate-500">Created {fmtDateTime(a.createdAt)}</div>
                                          <div className="mt-2 text-xs text-slate-600">Serial: {a.serialNo || "-"} • Location: {a.location}</div>
                                          <div className="mt-1 text-xs text-slate-600">Assigned to: {a.assignedTo || "-"}</div>
                                        </div>
                                        <div className="text-right">
                                          <Pill label={`${done}/${total} complete`} tone={done === total ? "good" : done > 0 ? "warn" : "neutral"} />
                                        </div>
                                      </div>

                                      <div className="mt-4 grid grid-cols-1 gap-2">
                                        {a.checklist.map((c) => (
                                          <label key={c.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2">
                                            <span className={cn("text-sm font-semibold", c.done ? "text-emerald-700" : "text-slate-800")}>{c.label}</span>
                                            <input type="checkbox" checked={c.done} onChange={() => toggleChecklist(a.id, c.id)} className="h-4 w-4 rounded border-slate-300" />
                                          </label>
                                        ))}
                                      </div>

                                      <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                                        Premium: handover checklist can require uploads, signatures, and audit trails.
                                      </div>
                                    </div>
                                  );
                                })}
                                {!activeRfq.assets.length ? (
                                  <Empty title="No assets" subtitle="Create an asset record after PO award to track tagging and handover." />
                                ) : null}
                              </div>
                            </Section>
                          </div>
                        ) : null}
                      </>
                    )}
                  </Section>
                </div>
              </div>
            ) : null}

            {pageTab === "create" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-4 space-y-4">
                  <Section title="Create RFQ" subtitle="Wizard for high value procurement." right={<Pill label={`Step ${createStep + 1}/5`} tone="info" />}>
                    <div className="space-y-2">
                      {[
                        { i: 0, label: "Basics" },
                        { i: 1, label: "Specs" },
                        { i: 2, label: "Vendors" },
                        { i: 3, label: "Budget and approvals" },
                        { i: 4, label: "Review" },
                      ].map((s) => (
                        <button
                          key={s.i}
                          type="button"
                          className={cn(
                            "w-full rounded-3xl border bg-white p-4 text-left hover:bg-slate-50",
                            createStep === s.i ? "border-emerald-300 ring-4 ring-emerald-100" : "border-slate-200"
                          )}
                          onClick={() => setCreateStep(s.i as any)}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-slate-900">{s.label}</div>
                              <div className="mt-1 text-xs text-slate-500">Configure {s.label.toLowerCase()}</div>
                            </div>
                            {createStep === s.i ? <ChevronRight className="h-5 w-5 text-emerald-700" /> : null}
                          </div>
                        </button>
                      ))}
                    </div>

                    <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                      Premium: if estimate exceeds OpEx remaining, CapEx is recommended with executive approvals and milestones.
                    </div>
                  </Section>

                  <Section title="Budget snapshot" subtitle="Helps decide OpEx vs CapEx." right={<Pill label="Premium" tone="info" />}>
                    <div className="rounded-3xl border border-slate-200 bg-white p-4">
                      <div className="text-xs text-slate-500">OpEx remaining</div>
                      <div className="mt-1 text-lg font-semibold text-slate-900">{formatUGX(opExRemaining)}</div>
                      <div className="mt-3 text-xs text-slate-500">CapEx remaining</div>
                      <div className="mt-1 text-lg font-semibold text-slate-900">{formatUGX(capExRemaining)}</div>
                      {draft.estimatedBudgetUGX > 0 ? (
                        <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700 ring-1 ring-slate-200">
                          Estimate: <span className="font-semibold">{formatUGX(draft.estimatedBudgetUGX)}</span>
                          <div className="mt-1">Suggested: <span className="font-semibold">{suggestedFundingType}</span></div>
                          {suggestedFundingType === "CapEx" ? <div className="mt-1 text-rose-700 font-semibold">Does not fit monthly OpEx.</div> : <div className="mt-1 text-emerald-700 font-semibold">Fits monthly OpEx.</div>}
                        </div>
                      ) : null}
                    </div>
                  </Section>
                </div>

                <div className="lg:col-span-8 space-y-4">
                  <Section
                    title="RFQ draft"
                    subtitle="Complete all steps then request approvals."
                    right={
                      <div className="flex flex-wrap items-center gap-2">
                        <Button variant="outline" onClick={() => { setAttachmentDraft({ name: "", note: "" }); setAddAttachmentOpen(true); }}>
                          <Upload className="h-4 w-4" /> Attachment
                        </Button>
                        <Button
                          variant="primary"
                          onClick={requestApprovalsForDraft}
                          title="Creates RFQ and sends for approvals"
                        >
                          <Shield className="h-4 w-4" /> Request approvals
                        </Button>
                      </div>
                    }
                  >
                    {createStep === 0 ? (
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <Field label="Title" value={draft.title} onChange={(v) => setDraft((p) => ({ ...p, title: v }))} placeholder="Example: Company vehicle procurement" />
                        <Select
                          label="Funding type"
                          value={draft.fundingType}
                          onChange={(v) => setDraft((p) => ({ ...p, fundingType: v as FundingType }))}
                          options={[{ value: "OpEx", label: "OpEx" }, { value: "CapEx", label: "CapEx" }]}
                          hint={draft.estimatedBudgetUGX > 0 ? `Suggested: ${suggestedFundingType}` : ""}
                        />
                        <Select
                          label="Service module"
                          value={draft.serviceModule}
                          onChange={(v) => setDraft((p) => ({ ...p, serviceModule: v as ServiceModule }))}
                          options={SERVICE_MODULES.map((m) => ({ value: m, label: m }))}
                        />
                        <Select
                          label="Marketplace"
                          value={draft.marketplace}
                          onChange={(v) => setDraft((p) => ({ ...p, marketplace: v as Marketplace }))}
                          options={MARKETPLACES.map((m) => ({ value: m, label: m }))}
                          disabled={draft.serviceModule !== "E-Commerce"}
                          hint={draft.serviceModule !== "E-Commerce" ? "Only for E-Commerce" : ""}
                        />
                        <Field label="Category" value={draft.category} onChange={(v) => setDraft((p) => ({ ...p, category: v }))} placeholder="Vehicle, equipment, service" />
                        <NumberField label="Quantity" value={draft.quantity} onChange={(v) => setDraft((p) => ({ ...p, quantity: Math.max(1, v) }))} />
                        <Field label="Unit" value={draft.unit} onChange={(v) => setDraft((p) => ({ ...p, unit: v }))} placeholder="Unit" />
                        <NumberField label="Estimated budget (UGX)" value={draft.estimatedBudgetUGX} onChange={(v) => setDraft((p) => ({ ...p, estimatedBudgetUGX: Math.max(0, v) }))} hint="Used for approvals" />
                        <div className="md:col-span-2">
                          <Button variant="outline" onClick={ensureDraftFundingType}>
                            <Info className="h-4 w-4" /> Apply suggested funding
                          </Button>
                        </div>
                      </div>
                    ) : null}

                    {createStep === 1 ? (
                      <div className="grid grid-cols-1 gap-4">
                        <TextArea label="Specifications" value={draft.specs} onChange={(v) => setDraft((p) => ({ ...p, specs: v }))} placeholder="Detailed requirements" rows={8} />
                        <Field label="Delivery location" value={draft.deliveryLocation} onChange={(v) => setDraft((p) => ({ ...p, deliveryLocation: v }))} placeholder="Address" />
                        <Field label="Warranty needs" value={draft.warrantyNeeds} onChange={(v) => setDraft((p) => ({ ...p, warrantyNeeds: v }))} placeholder="Warranty requirements" />
                      </div>
                    ) : null}

                    {createStep === 2 ? (
                      <div className="space-y-3">
                        <div className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="text-sm font-semibold text-slate-900">Select vendors</div>
                          <div className="mt-1 text-xs text-slate-500">Only approved vendors are recommended.</div>
                          <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                            {vendors
                              .filter((v) => v.status !== "Blocked")
                              .map((v) => {
                                const selected = draft.vendorIds.includes(v.id);
                                return (
                                  <button
                                    key={v.id}
                                    type="button"
                                    className={cn(
                                      "rounded-3xl border p-4 text-left",
                                      selected ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white hover:bg-slate-50"
                                    )}
                                    onClick={() =>
                                      setDraft((p) => ({
                                        ...p,
                                        vendorIds: selected ? p.vendorIds.filter((id) => id !== v.id) : [...p.vendorIds, v.id],
                                      }))
                                    }
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                          <div className="text-sm font-semibold text-slate-900">{v.name}</div>
                                          <Pill label={v.riskLevel} tone={v.riskLevel === "High" ? "bad" : v.riskLevel === "Medium" ? "warn" : "good"} />
                                          <Pill label={`${v.rating.toFixed(1)}★`} tone="neutral" />
                                        </div>
                                        <div className="mt-1 text-xs text-slate-500">{v.country} • SLA {v.slaOnTimePct}% • Discount {v.negotiatedDiscountPct}%</div>
                                      </div>
                                      <Pill label={selected ? "Selected" : "Select"} tone={selected ? "good" : "neutral"} />
                                    </div>
                                  </button>
                                );
                              })}
                          </div>
                        </div>

                        <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                          Selected vendors: {draft.vendorIds.length ? draft.vendorIds.map((id) => vendors.find((v) => v.id === id)?.name || id).join(", ") : "None"}
                        </div>
                      </div>
                    ) : null}

                    {createStep === 3 ? (
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <Select
                          label="Approval template"
                          value={draft.approvalTemplateId}
                          onChange={(v) => setDraft((p) => ({ ...p, approvalTemplateId: v }))}
                          options={approvalTemplates
                            .filter((t) => t.appliesTo === "Any" || t.appliesTo === draft.fundingType)
                            .map((t) => ({ value: t.id, label: `${t.name} (min ${formatUGX(t.minAmountUGX)})` }))}
                          hint="Executive chain for CapEx"
                        />
                        <div className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="text-sm font-semibold text-slate-900">Budget mode</div>
                          <div className="mt-1 text-xs text-slate-600">OpEx uses monthly cap. CapEx uses annual allocation.</div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Pill label={`OpEx remaining ${formatUGX(opExRemaining)}`} tone={opExRemaining ? "neutral" : "warn"} />
                            <Pill label={`CapEx remaining ${formatUGX(capExRemaining)}`} tone={capExRemaining ? "neutral" : "warn"} />
                          </div>
                          {draft.estimatedBudgetUGX > 0 && !canFitOpEx ? (
                            <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                              This estimate does not fit monthly OpEx. Use CapEx with executive approvals.
                            </div>
                          ) : null}
                        </div>

                        <div className="md:col-span-2">
                          <TextArea
                            label="CapEx justification"
                            value={draft.capexJustification}
                            onChange={(v) => setDraft((p) => ({ ...p, capexJustification: v }))}
                            placeholder="Required for CapEx"
                            rows={4}
                            disabled={draft.fundingType !== "CapEx"}
                            hint={draft.fundingType === "CapEx" ? "Explain why monthly budget cannot cover" : "Not required"}
                          />
                        </div>

                        <div className="md:col-span-2 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                          Premium: CapEx vs OpEx budgeting supports assets that cannot fit monthly budgets.
                        </div>
                      </div>
                    ) : null}

                    {createStep === 4 ? (
                      <div className="space-y-4">
                        <div className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="text-sm font-semibold text-slate-900">Review</div>
                          <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                            <ReviewRow label="Title" value={draft.title || "-"} />
                            <ReviewRow label="Funding" value={draft.fundingType} />
                            <ReviewRow label="Service module" value={draft.serviceModule} />
                            <ReviewRow label="Marketplace" value={draft.serviceModule === "E-Commerce" ? draft.marketplace : "-"} />
                            <ReviewRow label="Estimate" value={draft.estimatedBudgetUGX ? formatUGX(draft.estimatedBudgetUGX) : "-"} />
                            <ReviewRow label="Delivery" value={draft.deliveryLocation || "-"} />
                            <ReviewRow label="Quantity" value={`${draft.quantity} ${draft.unit}`} />
                            <ReviewRow label="Vendors" value={draft.vendorIds.length ? draft.vendorIds.map((id) => vendors.find((v) => v.id === id)?.name || id).join(", ") : "Auto pick"} />
                            <ReviewRow label="Template" value={approvalTemplates.find((t) => t.id === draft.approvalTemplateId)?.name || draft.approvalTemplateId} />
                            <ReviewRow label="Attachments" value={`${draft.attachments.length}`} />
                          </div>
                          <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700 ring-1 ring-slate-200 whitespace-pre-wrap">
                            <div className="font-semibold text-slate-900">Specs</div>
                            <div className="mt-2">{draft.specs || "-"}</div>
                          </div>
                        </div>

                        <div className="rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                          Clicking Request approvals will create the RFQ and start the approval workflow.
                        </div>
                      </div>
                    ) : null}
                  </Section>
                </div>
              </div>
            ) : null}

            {pageTab === "templates" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-5 space-y-4">
                  <Section title="Templates" subtitle="Executive approval chain templates." right={<Pill label="Premium" tone="info" />}>
                    <div className="space-y-2">
                      {approvalTemplates
                        .slice()
                        .sort((a, b) => a.minAmountUGX - b.minAmountUGX)
                        .map((t) => (
                          <div key={t.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <div className="text-sm font-semibold text-slate-900">{t.name}</div>
                                  <Pill label={t.appliesTo} tone={t.appliesTo === "CapEx" ? "info" : "neutral"} />
                                  <Pill label={`Min ${formatUGX(t.minAmountUGX)}`} tone="neutral" />
                                </div>
                                <div className="mt-1 text-xs text-slate-500">{t.id}</div>
                                <div className="mt-2 text-xs text-slate-600">{t.description}</div>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {t.steps.map((s, idx) => (
                                    <Pill key={`${t.id}-${idx}`} label={`${idx + 1}. ${s.role} (${s.slaHours}h)`} tone="neutral" />
                                  ))}
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                className="px-3 py-2 text-xs"
                                onClick={() => {
                                  // quick duplicate template
                                  const copy: ApprovalTemplate = {
                                    ...t,
                                    id: uid("TPL"),
                                    name: `${t.name} Copy`,
                                  };
                                  setApprovalTemplates((p) => [copy, ...p]);
                                  toast({ title: "Duplicated", message: "Template duplicated.", kind: "success" });
                                }}
                              >
                                <Copy className="h-4 w-4" /> Duplicate
                              </Button>
                            </div>
                          </div>
                        ))}
                    </div>

                    <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                      Premium: chain templates can vary by module, marketplace, vendor risk, and funding type.
                    </div>
                  </Section>
                </div>

                <div className="lg:col-span-7 space-y-4">
                  <Section title="Template guidance" subtitle="How to choose templates." right={<Pill label="Info" tone="info" />}>
                    <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-700">
                      <ul className="space-y-1">
                        <li>1) OpEx uses Manager then Finance for routine purchases.</li>
                        <li>2) CapEx uses Manager then CFO then CEO for high value assets.</li>
                        <li>3) High value OpEx can add CFO automatically when estimate is above threshold.</li>
                        <li>4) Vendor risk score can require extra approvals.</li>
                      </ul>
                    </div>
                    <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700">
                      <div className="font-semibold text-slate-900">Next suggested additions</div>
                      <ul className="mt-2 space-y-1">
                        <li>• Template per Service Module (Travel, Medical) with stricter SLA</li>
                        <li>• Template that includes EVzone Support for regulated categories</li>
                        <li>• Escalation if SLA breached</li>
                      </ul>
                    </div>
                  </Section>
                </div>
              </div>
            ) : null}
          </div>

          <footer className="border-t border-slate-200 bg-white/60 py-6">
            <div className="mx-auto max-w-[1400px] px-4 text-xs text-slate-500 md:px-6">
              S RFQ and Quote Requests v2. Core: RFQ flow, vendor invitations and Q and A, quote comparison, convert quote to PO and invoice. Premium: CapEx vs OpEx budgeting, milestone payments, asset tagging and handover checklist, executive approval templates.
            </div>
          </footer>
        </div>
      </div>

      {/* Add attachment modal */}
      <Modal
        open={addAttachmentOpen}
        title="Add attachment"
        subtitle={pageTab === "create" ? "Adds attachment to draft." : "Adds attachment to RFQ."}
        onClose={() => setAddAttachmentOpen(false)}
        actions={[{ label: "Add", onClick: () => { if (pageTab === "create") addAttachmentToDraft(); else addAttachmentToActiveRfq(); } }]}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setAddAttachmentOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={() => {
                if (pageTab === "create") addAttachmentToDraft();
                else addAttachmentToActiveRfq();
              }}
            >
              <BadgeCheck className="h-4 w-4" /> Add
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="File name" value={attachmentDraft.name} onChange={(v) => setAttachmentDraft((p) => ({ ...p, name: v }))} placeholder="Specs.pdf" />
          <Field label="Note" value={attachmentDraft.note} onChange={(v) => setAttachmentDraft((p) => ({ ...p, note: v }))} placeholder="Optional" />
          <div className="md:col-span-2 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
            Upload is simulated. In production, files are stored securely with access control.
          </div>
        </div>
      </Modal>

      {/* Invite modal */}
      <Modal
        open={sendInviteOpen}
        title="Invite vendors"
        subtitle="Send RFQ invite with message."
        onClose={() => setSendInviteOpen(false)}
        actions={[{ label: "Send", onClick: () => { if (activeRfq) { sendRFQToVendors(activeRfq.id); setSendInviteOpen(false); } } }]}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setSendInviteOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={() => {
                if (!activeRfq) return;
                sendRFQToVendors(activeRfq.id);
                setSendInviteOpen(false);
              }}
            >
              <Mail className="h-4 w-4" /> Send
            </Button>
          </div>
        }
      >
        <TextArea label="Invite message" value={inviteNote} onChange={setInviteNote} rows={4} />
        <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
          In production, invites are delivered via Email, WhatsApp, WeChat, and SMS, with delivery logs.
        </div>
      </Modal>

      {/* Quote modal */}
      <Modal
        open={quoteModalOpen}
        title="Add quote"
        subtitle="Enter quote details for comparison and award."
        onClose={() => setQuoteModalOpen(false)}
        actions={[{ label: "Save", onClick: submitQuote }]}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setQuoteModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={submitQuote}>
              <BadgeCheck className="h-4 w-4" /> Save
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Select
            label="Vendor"
            value={quoteDraft.vendorId}
            onChange={(v) => setQuoteDraft((p) => ({ ...p, vendorId: v }))}
            options={(activeRfq?.invited || []).map((i) => ({ value: i.vendorId, label: vendors.find((x) => x.id === i.vendorId)?.name || i.vendorId }))}
          />
          <NumberField label="Total (UGX)" value={quoteDraft.total} onChange={(v) => setQuoteDraft((p) => ({ ...p, total: Math.max(0, v) }))} />
          <NumberField label="Lead time (days)" value={quoteDraft.leadTimeDays} onChange={(v) => setQuoteDraft((p) => ({ ...p, leadTimeDays: Math.max(1, v) }))} />
          <NumberField label="Warranty (months)" value={quoteDraft.warrantyMonths} onChange={(v) => setQuoteDraft((p) => ({ ...p, warrantyMonths: Math.max(0, v) }))} />
          <Field label="Payment terms" value={quoteDraft.paymentTerms} onChange={(v) => setQuoteDraft((p) => ({ ...p, paymentTerms: v }))} placeholder="30/60/10 or Net 14" />
          <div className="md:col-span-2">
            <TextArea label="Notes" value={quoteDraft.notes} onChange={(v) => setQuoteDraft((p) => ({ ...p, notes: v }))} rows={4} />
          </div>
          <div className="md:col-span-2 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
            Premium: quotes can include compliance checks and rate card links.
          </div>
        </div>
      </Modal>

      {/* Asset modal */}
      <Modal
        open={assetModalOpen}
        title="Create asset record"
        subtitle="Asset tagging and handover checklist."
        onClose={() => setAssetModalOpen(false)}
        actions={[{ label: "Create", onClick: saveAsset }]}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setAssetModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={saveAsset}>
              <Tag className="h-4 w-4" /> Create
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Select
            label="Asset type"
            value={assetDraft.type}
            onChange={(v) => setAssetDraft((p) => ({ ...p, type: v as AssetType }))}
            options={[{ value: "Vehicle", label: "Vehicle" }, { value: "Equipment", label: "Equipment" }, { value: "Other", label: "Other" }]}
          />
          <Field label="Serial number" value={assetDraft.serialNo} onChange={(v) => setAssetDraft((p) => ({ ...p, serialNo: v }))} placeholder="Optional" />
          <Field label="Description" value={assetDraft.description} onChange={(v) => setAssetDraft((p) => ({ ...p, description: v }))} placeholder="Vehicle or equipment description" />
          <Field label="Location" value={assetDraft.location} onChange={(v) => setAssetDraft((p) => ({ ...p, location: v }))} placeholder="Site" />
          <Field label="Assigned to" value={assetDraft.assignedTo} onChange={(v) => setAssetDraft((p) => ({ ...p, assignedTo: v }))} placeholder="Department or person" />
          <div className="md:col-span-2 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
            After creation, complete the handover checklist and attach warranty documents.
          </div>
        </div>
      </Modal>
    </div>
  );

  function RowOk({ ok, label }: { ok: boolean; label: string }) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2">
        <div className="text-sm font-semibold text-slate-800">{label}</div>
        {ok ? <Pill label="Done" tone="good" /> : <Pill label="Pending" tone="warn" />}
      </div>
    );
  }

  function ReviewRow({ label, value }: { label: string; value: string }) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-3">
        <div className="text-xs font-semibold text-slate-500">{label}</div>
        <div className="mt-1 text-sm font-semibold text-slate-900">{value}</div>
      </div>
    );
  }
}
