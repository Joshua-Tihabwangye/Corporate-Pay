import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BadgeCheck,
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Download,
  FileText,
  Globe,
  Image as ImageIcon,
  Info,
  Lock,
  Mail,
  MapPin,
  Settings,
  ShieldCheck,
  Sparkles,
  Upload,
  Users,
  X,
  MoreVertical,
} from "lucide-react";

const EVZ = {
  green: "#03CD8C",
  orange: "#F77F00",
};

type OrgRole = "Viewer" | "Member" | "Approver" | "Finance" | "Admin" | "Owner";

type KYBStatus = "Not started" | "In review" | "Approved" | "Needs action";

type ProgramStatus = "Draft" | "Active" | "Paused" | "Suspended";

type Currency = "UGX" | "USD" | "CNY" | "KES";

type Org = {
  id: string;
  name: string;
  country: string;
  city: string;
  role: OrgRole;
  kyb: KYBStatus;
  program: ProgramStatus;
  legalName: string;
  tradingName: string;
  regNo: string;
  taxId: string;
  billingEmail: string;
  billingPhone: string;
  billingAddress: string;
  brandPrimary: string;
  brandAccent: string;
  entities: Array<{ id: string; name: string; country: string; currency: Currency; isDefault: boolean }>;
  invoiceGroups: Array<{ id: string; name: string; entityId: string; billingEmail: string }>;
  modules: Array<{ key: string; enabled: boolean; note: string }>;
  readiness: Array<{ key: string; label: string; done: boolean; hint: string }>;
  documents: Array<{ id: string; name: string; kind: string; status: "Pending" | "Approved" | "Rejected"; note: string }>;
};

type Toast = { id: string; title: string; message?: string; kind: "success" | "warn" | "error" | "info" };

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function Pill({ label, tone = "neutral" }: { label: string; tone?: "good" | "warn" | "bad" | "info" | "neutral" }) {
  const map: Record<string, string> = {
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

function toneForKYB(s: KYBStatus) {
  if (s === "Approved") return "good" as const;
  if (s === "In review") return "info" as const;
  if (s === "Needs action") return "warn" as const;
  return "neutral" as const;
}

function toneForProgram(s: ProgramStatus) {
  if (s === "Active") return "good" as const;
  if (s === "Draft") return "neutral" as const;
  if (s === "Paused") return "warn" as const;
  return "bad" as const;
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
    <button type="button" title={title} disabled={disabled} onClick={onClick} style={style} className={cn(base, variants[variant], disabled && "cursor-not-allowed opacity-60", className)}>
      {children}
    </button>
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

function ToastStack({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
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
                {t.kind === "warn" || t.kind === "error" ? <AlertTriangle className="h-5 w-5" /> : <BadgeCheck className="h-5 w-5" />}
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

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: Array<{ value: string; label: string }> }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-100"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function TinyBar({ value, max }: { value: number; max: number }) {
  const pct = max <= 0 ? 0 : Math.max(0, Math.min(1, value / max));
  const width = Math.round(pct * 100);
  const color = width >= 85 ? EVZ.orange : EVZ.green;
  return (
    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div className="h-full rounded-full" style={{ width: `${width}%`, background: color }} />
    </div>
  );
}

function copyToClipboardSafe(text: string) {
  return navigator.clipboard.writeText(text);
}


function Modal({
  open,
  title,
  subtitle,
  children,
  onClose,
  footer,
  maxW = "600px",
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
    icon?: React.ReactNode;
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
            className="fixed inset-x-0 top-[10vh] z-50 mx-auto overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(2,8,23,0.22)]"
            style={{ maxWidth: maxW, width: "calc(100vw - 2rem)" }}
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

function TextArea({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-slate-500">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 transition focus:outline-none focus:ring-4 focus:ring-emerald-100"
      />
    </div>
  );
}

function FileUploader({ onDrop }: { onDrop: (f: File) => void }) {
  return (
    <div className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 py-10 text-center transition hover:bg-slate-100" onClick={() => onDrop(new File([""], "example.pdf"))}>
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-emerald-600 shadow-sm">
        <Upload className="h-6 w-6" />
      </div>
      <div className="mt-4 text-sm font-semibold text-slate-900">Click to upload or drag and drop</div>
      <div className="mt-1 text-xs text-slate-500">PDF, PNG, JPG up to 10MB</div>
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
  const menuRef = React.useRef<HTMLDivElement>(null);

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

export default function OrganizationProfileKYB() {
  const navigate = useNavigate();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = (t: Omit<Toast, "id">) => {
    const id = uid("toast");
    setToasts((p) => [{ id, ...t }, ...p].slice(0, 4));
    window.setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 3200);
  };

  const orgs = useMemo<Org[]>(
    () => [
      {
        id: "org_acme",
        name: "Acme Group Ltd",
        country: "Uganda",
        city: "Kampala",
        role: "Admin",
        kyb: "In review",
        program: "Draft",
        legalName: "Acme Group Limited",
        tradingName: "Acme Group",
        regNo: "80020001234567",
        taxId: "TIN-10101010",
        billingEmail: "billing@acme.ug",
        billingPhone: "+256 7XX XXX XXX",
        billingAddress: "Millennium House, Nsambya Road 472, Kampala, Uganda",
        brandPrimary: "#0B1220",
        brandAccent: EVZ.green,
        entities: [
          { id: "ent_ug", name: "Acme Uganda", country: "Uganda", currency: "UGX", isDefault: true },
          { id: "ent_cn", name: "Acme China", country: "China", currency: "CNY", isDefault: false },
        ],
        invoiceGroups: [
          { id: "inv_g1", name: "UG Operations", entityId: "ent_ug", billingEmail: "billing-ug@acme.ug" },
          { id: "inv_g2", name: "CN Procurement", entityId: "ent_cn", billingEmail: "billing-cn@acme.ug" },
        ],
        modules: [
          { key: "CorporatePay", enabled: true, note: "Approvals and policies enabled" },
          { key: "Wallet", enabled: true, note: "Multi-currency balances enabled" },
          { key: "Marketplace", enabled: true, note: "Checkout and refunds enabled" },
          { key: "Services", enabled: true, note: "Bookings and payouts enabled" },
          { key: "EV Charging", enabled: false, note: "Enable when charging rollout starts" },
        ],
        readiness: [
          { key: "profile", label: "Company profile complete", done: true, hint: "Legal details and contacts" },
          { key: "docs", label: "KYB documents uploaded", done: true, hint: "All required documents" },
          { key: "bank", label: "Settlement method verified", done: false, hint: "Verify bank or payout rail" },
          { key: "roles", label: "Admin roles assigned", done: true, hint: "Owner, Admin, Finance" },
          { key: "policy", label: "Policies configured", done: false, hint: "Approval thresholds and limits" },
          { key: "goLive", label: "Go-live checks passed", done: false, hint: "All checks complete" },
        ],
        documents: [
          { id: "d1", name: "Certificate of Incorporation.pdf", kind: "Incorporation", status: "Approved", note: "Approved" },
          { id: "d2", name: "Director ID.pdf", kind: "Identity", status: "Pending", note: "Under review" },
          { id: "d3", name: "Proof of Address.pdf", kind: "Address", status: "Pending", note: "Under review" },
        ],
      },
      {
        id: "org_khl",
        name: "Kampala Holdings",
        country: "Uganda",
        city: "Kampala",
        role: "Member",
        kyb: "Approved",
        program: "Paused",
        legalName: "Kampala Holdings Ltd",
        tradingName: "KHL",
        regNo: "80020007654321",
        taxId: "TIN-20202020",
        billingEmail: "billing@khl.africa",
        billingPhone: "+256 7XX XXX XXX",
        billingAddress: "Kampala, Uganda",
        brandPrimary: "#0B1220",
        brandAccent: EVZ.orange,
        entities: [{ id: "ent_ug2", name: "KHL Uganda", country: "Uganda", currency: "UGX", isDefault: true }],
        invoiceGroups: [{ id: "inv_k1", name: "KHL Billing", entityId: "ent_ug2", billingEmail: "billing@khl.africa" }],
        modules: [
          { key: "CorporatePay", enabled: true, note: "Paused due to deposit depleted" },
          { key: "Wallet", enabled: true, note: "Organization wallet exists" },
          { key: "Marketplace", enabled: true, note: "Refunds enabled" },
        ],
        readiness: [
          { key: "profile", label: "Company profile complete", done: true, hint: "" },
          { key: "docs", label: "KYB documents uploaded", done: true, hint: "" },
          { key: "bank", label: "Settlement method verified", done: true, hint: "" },
          { key: "roles", label: "Admin roles assigned", done: true, hint: "" },
          { key: "policy", label: "Policies configured", done: true, hint: "" },
          { key: "goLive", label: "Go-live checks passed", done: true, hint: "" },
        ],
        documents: [{ id: "k1", name: "KYB Package.zip", kind: "KYB", status: "Approved", note: "Approved" }],
      },
    ],
    []
  );

  const [orgId, setOrgId] = useState(orgs[0].id);
  const org = useMemo(() => orgs.find((o) => o.id === orgId) || orgs[0], [orgs, orgId]);

  const canAdmin = useMemo(() => ["Owner", "Admin", "Finance"].includes(org.role), [org.role]);

  const readinessDone = useMemo(() => org.readiness.filter((r) => r.done).length, [org.readiness]);
  const readinessTotal = useMemo(() => org.readiness.length, [org.readiness]);

  const copy = async (txt: string) => {
    try {
      await copyToClipboardSafe(txt);
      toast({ kind: "success", title: "Copied" });
    } catch {
      toast({ kind: "warn", title: "Copy failed", message: "Clipboard access blocked." });
    }
  };

  const openAdminConsole = () => {
    navigate("/console/admin");
  };

  const [activeTab, setActiveTab] = useState<"Overview" | "Structure" | "Configuration" | "Compliance">("Overview");

  // Modal states
  const [uploadOpen, setUploadOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState<string | null>(null);
  const [contactMsg, setContactMsg] = useState("");

  return (
    <div className="min-h-screen" style={{ background: "radial-gradient(90% 60% at 50% 0%, rgba(3,205,140,0.18), rgba(255,255,255,0))" }}>
      <ToastStack toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((x) => x.id !== id))} />

      {/* Upload Modal */}
      <Modal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        title="Upload Document"
        subtitle="Securely upload required verification documents."
        footer={
          <div className="flex justify-end gap-3">
             <Button variant="ghost" onClick={() => setUploadOpen(false)}>Cancel</Button>
             <Button variant="primary" onClick={() => {
               toast({ kind: "success", title: "Upload complete", message: "Document sent for verification." });
               setUploadOpen(false);
             }}>Upload</Button>
          </div>
        }
      >
         <FileUploader onDrop={(f) => toast({ kind: "info", title: "File selected", message: f.name })} />
         <div className="mt-4">
            <TextArea label="Notes (Optional)" value="" onChange={() => {}} placeholder="Any additional context..." />
         </div>
      </Modal>

      {/* Contact Admin Modal */}
      <Modal
        open={contactOpen}
        onClose={() => setContactOpen(false)}
        title="Contact Organization Admin"
        subtitle="Send a secure message to the organization administrators."
        footer={
          <div className="flex justify-end gap-3">
             <Button variant="ghost" onClick={() => setContactOpen(false)}>Cancel</Button>
             <Button variant="primary" onClick={() => {
               toast({ kind: "success", title: "Message sent", message: "Admins have been notified." });
               setContactOpen(false);
               setContactMsg("");
             }}>Send Message</Button>
          </div>
        }
      >
         <div className="space-y-4">
           <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
              <div className="flex gap-3">
                 <Info className="h-5 w-5 text-blue-700" />
                 <div className="text-sm text-blue-800">Your message will be sent to <strong>3</strong> active admins via email and in-app notification.</div>
              </div>
           </div>
           <TextArea label="Message" value={contactMsg} onChange={setContactMsg} placeholder="Describe your request..." rows={5} />
         </div>
      </Modal>

       {/* Details Modal */}
      <Modal
        open={!!detailsOpen}
        onClose={() => setDetailsOpen(null)}
        title="Item Details"
        subtitle={detailsOpen || ""}
      >
         <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-500">
               Preview not available for this item type.
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <div className="text-xs text-slate-500">Created On</div>
                  <div className="font-semibold text-slate-900">Oct 12, 2023</div>
               </div>
               <div>
                  <div className="text-xs text-slate-500">Last Modified</div>
                  <div className="font-semibold text-slate-900">2 mins ago</div>
               </div>
            </div>
         </div>
      </Modal>

      <div className="mx-auto max-w-[95%] px-4 py-5 md:px-6">
        <div className="rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(2,8,23,0.10)]">
          {/* Header */}
          <div className="border-b border-slate-200 px-4 py-4 md:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl text-white" style={{ background: EVZ.green }}>
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">Organization Profile & KYB</div>
                  <div className="mt-1 text-xs text-slate-500">Summary and deep links to Admin Console for editing</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Pill label={`Role: ${org.role}`} tone={canAdmin ? "info" : "neutral"} />
                    <Pill label={`KYB: ${org.kyb}`} tone={toneForKYB(org.kyb)} />
                    <Pill label={`Program: ${org.program}`} tone={toneForProgram(org.program)} />
                    <Pill label={`Readiness: ${readinessDone}/${readinessTotal}`} tone={readinessDone === readinessTotal ? "good" : "warn"} />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="min-w-[220px]">
                  <Select
                    value={orgId}
                    onChange={setOrgId}
                    options={orgs.map((o) => ({ value: o.id, label: o.name }))}
                  />
                </div>
                <ActionMenu
                  actions={[
                    { label: "Switch Wallet", onClick: () => navigate("/console/wallet-switch"), icon: <ChevronRight className="h-4 w-4" /> },
                    { label: "Admin Console", onClick: openAdminConsole, icon: <Settings className="h-4 w-4" /> },
                  ]}
                />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {(["Overview", "Structure", "Configuration", "Compliance"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                    activeTab === tab ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-slate-50 ring-1 ring-slate-200"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Body */}
          <div className="bg-slate-50 px-4 py-5 md:px-6">
            {!canAdmin ? (
              <div className="mb-6 rounded-3xl border border-amber-200 bg-amber-50 p-5">
                <div className="flex items-start gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-amber-800">
                    <Lock className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-slate-900">Admin access required</div>
                    <div className="mt-1 text-sm text-amber-900">You can view summary details, but editing requires Admin or Finance role.</div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Button variant="accent" onClick={() => toast({ kind: "info", title: "Request access", message: "This would open the access request workflow." })}>
                        <ChevronRight className="h-4 w-4" /> Request access
                      </Button>
                      <Button variant="outline" onClick={() => setContactOpen(true)}>
                        <ChevronRight className="h-4 w-4" /> Contact Admin
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {activeTab === "Overview" && (
              <div className="space-y-6">
                {/* Company Profile - Full Width */}
                <Section
                  title="Company profile"
                  subtitle="Legal details, contacts, and branding"
                  right={<Pill label={org.country} tone="neutral" />}
                >
                  <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
                    <div className="xl:col-span-8 rounded-3xl border border-slate-200 bg-white p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="w-full">
                          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Legal Information</div>
                          <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
                             <div>
                                <div className="text-xs text-slate-500">Legal Name</div>
                                <div className="font-semibold text-slate-900">{org.legalName}</div>
                             </div>
                             <div>
                                <div className="text-xs text-slate-500">Trading Name</div>
                                <div className="font-semibold text-slate-900">{org.tradingName}</div>
                             </div>
                          </div>

                          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                              <div className="text-xs font-semibold text-slate-500">Registration</div>
                              <div className="mt-1 flex items-center justify-between gap-2">
                                <div className="font-mono text-sm font-semibold text-slate-900">{org.regNo}</div>
                                <Button variant="ghost" className="h-6 w-6 p-0" onClick={() => copy(org.regNo)}>
                                  <Copy className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                              <div className="text-xs font-semibold text-slate-500">Tax ID</div>
                              <div className="mt-1 flex items-center justify-between gap-2">
                                <div className="font-mono text-sm font-semibold text-slate-900">{org.taxId}</div>
                                <Button variant="ghost" className="h-6 w-6 p-0" onClick={() => copy(org.taxId)}>
                                  <Copy className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          </div>

                          <div className="mt-6">
                            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Contact Information</div>
                             <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                              <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3">
                                <div className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-slate-500"><Mail className="h-4 w-4" /></div>
                                <div>
                                  <div className="text-xs text-slate-500">Billing Email</div>
                                  <div className="text-sm font-semibold text-slate-900">{org.billingEmail}</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3">
                                <div className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-slate-500"><Building2 className="h-4 w-4" /></div>
                                <div>
                                  <div className="text-xs text-slate-500">Billing Address</div>
                                  <div className="text-sm font-semibold text-slate-900 truncate">{org.billingAddress}</div>
                                </div>
                              </div>
                             </div>
                          </div>
                        </div>
                        
                      </div>
                    </div>

                    <div className="xl:col-span-4 space-y-4">
                      {/* KYB Status Card */}
                       <div className={cn("rounded-3xl border p-5", org.kyb === "Approved" ? "border-emerald-200 bg-emerald-50" : org.kyb === "Needs action" ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white")}>
                        <div className="flex items-start gap-4">
                          <div className={cn("grid h-12 w-12 shrink-0 place-items-center rounded-2xl", org.kyb === "Approved" ? "bg-white text-emerald-700" : org.kyb === "Needs action" ? "bg-white text-amber-800" : "bg-slate-50 text-slate-700")}>
                            {org.kyb === "Approved" ? <BadgeCheck className="h-6 w-6" /> : org.kyb === "Needs action" ? <AlertTriangle className="h-6 w-6" /> : <Info className="h-6 w-6" />}
                          </div>
                          <div>
                            <div className="text-base font-semibold text-slate-900">KYB Status: {org.kyb}</div>
                            <div className="mt-1 text-sm text-slate-700">Verification is required for full feature access.</div>
                            <div className="mt-4 flex flex-wrap items-center gap-2">
                              <Button variant={org.kyb === "Needs action" ? "accent" : "outline"} onClick={openAdminConsole} className="text-xs h-8">
                                Manage KYB
                              </Button>
                              <Button variant="outline" onClick={() => toast({ kind: "info", title: "Requirements", message: "Shown" })} className="text-xs h-8">
                                Requirements
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Branding Card */}
                      <div className="rounded-3xl border border-slate-200 bg-white p-5">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-slate-900">Brand Identity</div>
                              <div className="mt-1 text-xs text-slate-500">Primary and Accent colors</div>
                            </div>
                            <Button variant="ghost" className="px-2 py-1 text-xs" onClick={openAdminConsole}><Settings className="h-4 w-4" /></Button>
                          </div>
                          <div className="mt-4 grid grid-cols-2 gap-3">
                            <div>
                               <div className="h-12 w-full rounded-xl border border-slate-100 shadow-sm" style={{ background: org.brandPrimary }} />
                               <div className="mt-1 text-center text-xs font-mono text-slate-500">{org.brandPrimary}</div>
                            </div>
                            <div>
                               <div className="h-12 w-full rounded-xl border border-slate-100 shadow-sm" style={{ background: org.brandAccent }} />
                               <div className="mt-1 text-center text-xs font-mono text-slate-500">{org.brandAccent}</div>
                            </div>
                          </div>
                      </div>
                    </div>
                  </div>
                </Section>

                {/* Go-live Readiness - Full Width */}
                <Section
                  title="Go-live readiness"
                  subtitle="Checklist with progress"
                  right={<Pill label={`${Math.round((readinessDone / readinessTotal) * 100)}%`} tone={readinessDone === readinessTotal ? "good" : "warn"} />}
                >
                  <div className="rounded-3xl border border-slate-200 bg-white p-6">
                    <div className="flex items-center justify-between gap-6 mb-6">
                       <div className="flex-1">
                          <div className="flex justify-between text-sm font-semibold mb-2">
                            <span text-slate-900>Readiness Progress</span>
                            <span className="text-slate-600">{readinessDone}/{readinessTotal}</span>
                          </div>
                          <TinyBar value={readinessDone} max={readinessTotal} />
                       </div>
                       <Button variant="primary" onClick={() => toast({ kind: "info", title: "Run checks", message: "Running..." })}>
                          <Sparkles className="h-4 w-4" /> Run Checks
                       </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {org.readiness.map((r) => (
                        <div key={r.key} className={cn("flex flex-col justify-between rounded-2xl border p-4 transition-all hover:bg-slate-50", r.done ? "border-emerald-100 bg-emerald-50/30" : "border-slate-200 bg-white")}>
                          <div>
                            <div className="flex items-start justify-between gap-2">
                               <div className="font-semibold text-slate-900 text-sm">{r.label}</div>
                               <div className={cn("grid h-5 w-5 place-items-center rounded-full", r.done ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400")}>
                                  <Check className="h-3 w-3" />
                               </div>
                            </div>
                            {r.hint && <div className="mt-1 text-xs text-slate-500">{r.hint}</div>}
                          </div>
                          <div className="mt-3 pt-3 border-t border-slate-100/50">
                             <button className="text-xs font-medium text-emerald-600 hover:underline flex items-center gap-1" onClick={openAdminConsole}>
                                Resolve <ChevronRight className="h-3 w-3" />
                             </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Section>

                {/* Quick Links - Horizontal at Bottom */}
                <div className="pt-4 border-t border-slate-200">
                    <div className="text-sm font-semibold text-slate-900 mb-4 px-1">Quick Actions & Deep Links</div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                      {[
                        { label: "Company Profile", icon: <Building2 className="h-4 w-4" />, path: "/settings/org/setup" },
                        { label: "KYB Documents", icon: <FileText className="h-4 w-4" />, path: "/settings/org/kyb" },
                        { label: "Entities & Groups", icon: <Globe className="h-4 w-4" />, path: "/settings/org/entities" },
                        { label: "Module Settings", icon: <Settings className="h-4 w-4" />, path: "/settings/modules" },
                        { label: "Go-live Checklist", icon: <ShieldCheck className="h-4 w-4" />, path: "/settings/org/go-live" },
                      ].map((link, i) => (
                        <button
                          key={i}
                          onClick={() => navigate(link.path)}
                          className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:-translate-y-1 hover:shadow-md hover:border-emerald-200 group"
                        >
                          <div className="grid h-10 w-10 place-items-center rounded-full bg-slate-50 text-slate-600 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                            {link.icon}
                          </div>
                          <div className="text-xs font-semibold text-slate-700 group-hover:text-slate-900">{link.label}</div>
                        </button>
                      ))}
                    </div>
                </div>
              </div>
            )}

            {activeTab === "Structure" && (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Section
                  title="Entities"
                  subtitle="Legal entities under this organization"
                  right={<Button variant="primary" onClick={openAdminConsole} className="px-3 py-1 text-xs">Add Entity</Button>}
                >
                  <div className="space-y-3">
                    {org.entities.map((e) => (
                      <div key={e.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="font-semibold text-slate-900">{e.name}</div>
                              <Pill label={e.currency} tone="neutral" />
                              {e.isDefault ? <Pill label="Default" tone="info" /> : null}
                            </div>
                            <div className="mt-1 text-sm text-slate-500">{e.country}</div>
                          </div>
                          <ActionMenu
                            actions={[
                              { label: "Edit", onClick: openAdminConsole, icon: <Settings className="h-4 w-4" /> },
                              { label: "View Details", onClick: () => setDetailsOpen(e.name), icon: <FileText className="h-4 w-4" /> },
                            ]}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>

                <Section
                  title="Invoice Groups"
                  subtitle="Billing groupings mapped to entities"
                  right={<Button variant="primary" onClick={openAdminConsole} className="px-3 py-1 text-xs">Add Group</Button>}
                >
                  <div className="space-y-3">
                    {org.invoiceGroups.map((g) => (
                      <div key={g.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-semibold text-slate-900">{g.name}</div>
                            <div className="mt-1 text-sm text-slate-500">Entity: {org.entities.find((e) => e.id === g.entityId)?.name ?? g.entityId}</div>
                            <div className="mt-1 text-sm text-slate-500">Billing: {g.billingEmail}</div>
                          </div>
                          <ActionMenu
                            actions={[
                              { label: "Copy Email", onClick: () => copy(g.billingEmail), icon: <Copy className="h-4 w-4" /> },
                              { label: "Settings", onClick: openAdminConsole, icon: <Settings className="h-4 w-4" /> },
                            ]}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>
              </div>
            )}

            {activeTab === "Configuration" && (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Section
                  title="Module Enablement"
                  subtitle="Active modules for this organization"
                  right={<Pill label={`${org.modules.filter((m) => m.enabled).length} Enabled`} tone="good" />}
                >
                  <div className="grid grid-cols-1 gap-3">
                    {org.modules.map((m) => (
                      <div key={m.key} className={cn("rounded-3xl border p-4", m.enabled ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white")}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="text-sm font-semibold text-slate-900">{m.key}</div>
                              <Pill label={m.enabled ? "Enabled" : "Disabled"} tone={m.enabled ? "good" : "neutral"} />
                            </div>
                            <div className="mt-1 text-sm text-slate-700">{m.note}</div>
                          </div>
                          <Button variant="outline" onClick={openAdminConsole} className="px-3 py-2 text-xs">
                            Manage
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                   <div className="flex items-start gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-50 text-slate-700">
                      <Settings className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Advanced Configuration</div>
                      <div className="mt-1 text-sm text-slate-600">
                        Additional settings for APIs, Webhooks, and SSO are available in the integration settings.
                      </div>
                      <div className="mt-4">
                         <Button variant="outline" onClick={() => toast({ kind: "info", title: "Integrations", message: "Redirecting..." })}>
                            Go to Integrations
                         </Button>
                      </div>
                    </div>
                   </div>
                </div>
              </div>
            )}

            {activeTab === "Compliance" && (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-8 space-y-4">
                  <Section
                    title="KYB Documents"
                    subtitle="Verification documents and status"
                    right={<Button variant="primary" onClick={() => setUploadOpen(true)} className="px-3 py-1 text-xs"><Upload className="h-3 w-3 mr-1" /> Upload</Button>}
                  >
                    <div className="space-y-2">
                      {org.documents.map((d) => (
                        <div key={d.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="text-sm font-semibold text-slate-900">{d.name}</div>
                                <Pill label={d.status} tone={d.status === "Approved" ? "good" : d.status === "Rejected" ? "bad" : "warn"} />
                                <Pill label={d.kind} tone="neutral" />
                              </div>
                              <div className="mt-1 text-sm text-slate-600">{d.note}</div>
                            </div>
                            <ActionMenu
                              actions={[
                                { label: "Preview", onClick: () => setDetailsOpen(d.name), icon: <FileText className="h-4 w-4" /> },
                                { label: "Download", onClick: () => toast({ kind: "success", title: "Download", message: "Downloading..." }), icon: <Download className="h-4 w-4" /> },
                              ]}
                            />
                          </div>
                          {d.status === "Rejected" ? (
                            <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                              <div className="flex items-start gap-2">
                                <AlertTriangle className="mt-0.5 h-4 w-4" />
                                <div>
                                  <div className="font-semibold">Action required</div>
                                  <div className="mt-1 text-xs text-amber-800">Re-upload with correct details.</div>
                                </div>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </Section>
                </div>
                <div className="lg:col-span-4">
                   <div className={cn("rounded-3xl border p-5", org.kyb === "Approved" ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50")}>
                      <div className="flex items-start gap-3">
                        <div className={cn("grid h-10 w-10 place-items-center rounded-2xl bg-white", org.kyb === "Approved" ? "text-emerald-700" : "text-amber-800")}>
                          {org.kyb === "Approved" ? <BadgeCheck className="h-5 w-5" /> : <Info className="h-5 w-5" />}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-900">KYB Status: {org.kyb}</div>
                          <div className="mt-1 text-sm text-slate-700">
                            {org.kyb === "Approved" ? "Your organization is fully verified." : "Please complete the required document uploads."}
                          </div>
                        </div>
                      </div>
                   </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
