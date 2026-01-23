import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BadgeCheck,
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
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

export default function OrganizationProfileKYB() {
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
    toast({ kind: "info", title: "Open Admin Console", message: "Deep link to CorporatePay Admin Console for editing." });
  };

  return (
    <div className="min-h-screen" style={{ background: "radial-gradient(90% 60% at 50% 0%, rgba(3,205,140,0.18), rgba(255,255,255,0))" }}>
      <ToastStack toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((x) => x.id !== id))} />

      <div className="mx-auto max-w-[1180px] px-4 py-5 md:px-6">
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
                <Button variant="outline" onClick={() => toast({ kind: "info", title: "Wallet Switcher", message: "This would open Wallet Switcher." })}>
                  <ChevronRight className="h-4 w-4" /> Switch
                </Button>
                <Button variant="primary" onClick={openAdminConsole}>
                  <ChevronRight className="h-4 w-4" /> Admin Console
                </Button>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="bg-slate-50 px-4 py-5 md:px-6">
            {!canAdmin ? (
              <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
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
                      <Button variant="outline" onClick={() => toast({ kind: "info", title: "Contact Admin", message: "This would show org Admin contacts." })}>
                        <ChevronRight className="h-4 w-4" /> Contact Admin
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              {/* Left */}
              <div className="space-y-4 lg:col-span-8">
                <Section
                  title="Company profile"
                  subtitle="Legal details, contacts, and branding"
                  right={<Pill label={org.country} tone="neutral" />}
                >
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                    <div className="md:col-span-8 rounded-3xl border border-slate-200 bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-xs font-semibold text-slate-500">Legal name</div>
                          <div className="mt-1 text-sm font-semibold text-slate-900">{org.legalName}</div>
                          <div className="mt-3 text-xs font-semibold text-slate-500">Trading name</div>
                          <div className="mt-1 text-sm font-semibold text-slate-900">{org.tradingName}</div>

                          <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                            <div className="rounded-2xl border border-slate-200 bg-white p-3">
                              <div className="text-xs font-semibold text-slate-500">Registration</div>
                              <div className="mt-1 flex items-center justify-between gap-2">
                                <div className="text-sm font-semibold text-slate-900">{org.regNo}</div>
                                <Button variant="outline" className="px-3 py-2" onClick={() => copy(org.regNo)}>
                                  <Copy className="h-4 w-4" /> Copy
                                </Button>
                              </div>
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-white p-3">
                              <div className="text-xs font-semibold text-slate-500">Tax ID</div>
                              <div className="mt-1 flex items-center justify-between gap-2">
                                <div className="text-sm font-semibold text-slate-900">{org.taxId}</div>
                                <Button variant="outline" className="px-3 py-2" onClick={() => copy(org.taxId)}>
                                  <Copy className="h-4 w-4" /> Copy
                                </Button>
                              </div>
                            </div>
                          </div>

                          <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                            <div className="rounded-2xl border border-slate-200 bg-white p-3">
                              <div className="text-xs font-semibold text-slate-500">Billing email</div>
                              <div className="mt-1 flex items-center justify-between gap-2">
                                <div className="text-sm font-semibold text-slate-900">{org.billingEmail}</div>
                                <Button variant="outline" className="px-3 py-2" onClick={() => copy(org.billingEmail)}>
                                  <Copy className="h-4 w-4" /> Copy
                                </Button>
                              </div>
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-white p-3">
                              <div className="text-xs font-semibold text-slate-500">Billing phone</div>
                              <div className="mt-1 text-sm font-semibold text-slate-900">{org.billingPhone}</div>
                            </div>
                          </div>

                          <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                            <div className="flex items-start gap-2">
                              <MapPin className="mt-0.5 h-4 w-4" />
                              <div>
                                <div className="font-semibold text-slate-800">Billing address</div>
                                <div className="mt-1">{org.billingAddress}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-50 text-slate-700">
                          <Building2 className="h-6 w-6" />
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-4 space-y-3">
                      <div className="rounded-3xl border border-slate-200 bg-white p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-slate-900">Branding</div>
                            <div className="mt-1 text-xs text-slate-500">Logo and colors</div>
                          </div>
                          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-50 text-slate-700">
                            <ImageIcon className="h-5 w-5" />
                          </div>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <div className="rounded-2xl border border-slate-200 bg-white p-3">
                            <div className="text-xs font-semibold text-slate-500">Primary</div>
                            <div className="mt-2 h-9 w-full rounded-xl" style={{ background: org.brandPrimary }} />
                            <div className="mt-2 text-xs text-slate-600">{org.brandPrimary}</div>
                          </div>
                          <div className="rounded-2xl border border-slate-200 bg-white p-3">
                            <div className="text-xs font-semibold text-slate-500">Accent</div>
                            <div className="mt-2 h-9 w-full rounded-xl" style={{ background: org.brandAccent }} />
                            <div className="mt-2 text-xs text-slate-600">{org.brandAccent}</div>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <Button variant="outline" onClick={openAdminConsole}>
                            <ChevronRight className="h-4 w-4" /> Edit branding
                          </Button>
                          <Button variant="outline" onClick={() => toast({ kind: "info", title: "Upload logo", message: "This would open logo upload." })}>
                            <Upload className="h-4 w-4" /> Upload
                          </Button>
                        </div>
                      </div>

                      <div className={cn("rounded-3xl border p-4", org.kyb === "Approved" ? "border-emerald-200 bg-emerald-50" : org.kyb === "Needs action" ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white")}>
                        <div className="flex items-start gap-3">
                          <div className={cn("grid h-10 w-10 place-items-center rounded-2xl", org.kyb === "Approved" ? "bg-white text-emerald-700" : org.kyb === "Needs action" ? "bg-white text-amber-800" : "bg-slate-50 text-slate-700")}>
                            {org.kyb === "Approved" ? <BadgeCheck className="h-5 w-5" /> : org.kyb === "Needs action" ? <AlertTriangle className="h-5 w-5" /> : <Info className="h-5 w-5" />}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-slate-900">KYB status</div>
                            <div className="mt-1 text-sm text-slate-700">{org.kyb}</div>
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <Button variant={org.kyb === "Needs action" ? "accent" : "outline"} onClick={openAdminConsole}>
                                <ChevronRight className="h-4 w-4" /> Manage KYB
                              </Button>
                              <Button variant="outline" onClick={() => toast({ kind: "info", title: "Requirements", message: "This would show KYB requirements." })}>
                                <ChevronRight className="h-4 w-4" /> Requirements
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Section>

                <Section
                  title="Entities and invoice groups"
                  subtitle="Multi-entity setup and invoice group mapping"
                  right={<Pill label={`${org.entities.length} entities`} tone="neutral" />}
                >
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="rounded-3xl border border-slate-200 bg-white p-4">
                      <div className="text-sm font-semibold text-slate-900">Entities</div>
                      <div className="mt-3 space-y-2">
                        {org.entities.map((e) => (
                          <div key={e.id} className="rounded-2xl border border-slate-200 bg-white p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <div className="text-sm font-semibold text-slate-900">{e.name}</div>
                                  <Pill label={e.currency} tone="neutral" />
                                  {e.isDefault ? <Pill label="Default" tone="info" /> : null}
                                </div>
                                <div className="mt-1 text-xs text-slate-500">{e.country}</div>
                              </div>
                              <Button variant="outline" className="px-3 py-2" onClick={openAdminConsole}>
                                <ChevronRight className="h-4 w-4" /> Edit
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Button variant="outline" onClick={openAdminConsole}>
                          <ChevronRight className="h-4 w-4" /> Add entity
                        </Button>
                        <Button variant="outline" onClick={() => toast({ kind: "info", title: "Export", message: "This would export entity list." })}>
                          <FileText className="h-4 w-4" /> Export
                        </Button>
                      </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white p-4">
                      <div className="text-sm font-semibold text-slate-900">Invoice groups</div>
                      <div className="mt-3 space-y-2">
                        {org.invoiceGroups.map((g) => (
                          <div key={g.id} className="rounded-2xl border border-slate-200 bg-white p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="text-sm font-semibold text-slate-900">{g.name}</div>
                                <div className="mt-1 text-xs text-slate-500">Entity: {org.entities.find((e) => e.id === g.entityId)?.name ?? g.entityId}</div>
                                <div className="mt-1 text-xs text-slate-500">Billing: {g.billingEmail}</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button variant="outline" className="px-3 py-2" onClick={() => copy(g.billingEmail)}>
                                  <Copy className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" className="px-3 py-2" onClick={openAdminConsole}>
                                  <ChevronRight className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Button variant="outline" onClick={openAdminConsole}>
                          <ChevronRight className="h-4 w-4" /> Add group
                        </Button>
                        <Button variant="outline" onClick={() => toast({ kind: "info", title: "Invoice settings", message: "This would open invoice settings." })}>
                          <Settings className="h-4 w-4" /> Settings
                        </Button>
                      </div>
                    </div>
                  </div>
                </Section>

                <Section
                  title="Module enablement and scope"
                  subtitle="Enable modules and define marketplace scope"
                  right={<Pill label={`${org.modules.filter((m) => m.enabled).length}/${org.modules.length} enabled`} tone="neutral" />}
                >
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
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
                          <Button variant="outline" onClick={openAdminConsole}>
                            <ChevronRight className="h-4 w-4" /> Manage
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>

                <Section
                  title="Go-live readiness"
                  subtitle="Checklist with progress"
                  right={<Pill label={`${Math.round((readinessDone / readinessTotal) * 100)}%`} tone={readinessDone === readinessTotal ? "good" : "warn"} />}
                >
                  <div className="rounded-3xl border border-slate-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">Readiness progress</div>
                        <div className="mt-1 text-sm text-slate-600">{readinessDone} of {readinessTotal} completed</div>
                        <TinyBar value={readinessDone} max={readinessTotal} />
                      </div>
                      <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-50 text-slate-700">
                        <ShieldCheck className="h-5 w-5" />
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      {org.readiness.map((r) => (
                        <div key={r.key} className="rounded-2xl border border-slate-200 bg-white p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="text-sm font-semibold text-slate-900">{r.label}</div>
                                <Pill label={r.done ? "Done" : "Pending"} tone={r.done ? "good" : "warn"} />
                              </div>
                              {r.hint ? <div className="mt-1 text-xs text-slate-500">{r.hint}</div> : null}
                            </div>
                            <Button variant="outline" onClick={openAdminConsole} className="px-3 py-2">
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Button variant="primary" onClick={() => toast({ kind: "info", title: "Run checks", message: "This would run go-live checks." })}>
                        <ChevronRight className="h-4 w-4" /> Run checks
                      </Button>
                      <Button variant="outline" onClick={openAdminConsole}>
                        <ChevronRight className="h-4 w-4" /> Open checklist
                      </Button>
                    </div>
                  </div>
                </Section>
              </div>

              {/* Right */}
              <div className="space-y-4 lg:col-span-4">
                <Section
                  title="Document upload"
                  subtitle="KYB documents and review statuses"
                  right={<Pill label={`${org.documents.length} file(s)`} tone="neutral" />}
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
                          <Button variant="outline" className="px-3 py-2" onClick={() => toast({ kind: "info", title: "Preview", message: d.name })}>
                            <ChevronRight className="h-4 w-4" />
                          </Button>
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

                    <div className="pt-2 flex flex-wrap items-center gap-2">
                      <Button variant="primary" onClick={() => toast({ kind: "info", title: "Upload", message: "This would open document uploader." })}>
                        <Upload className="h-4 w-4" /> Upload
                      </Button>
                      <Button variant="outline" onClick={openAdminConsole}>
                        <ChevronRight className="h-4 w-4" /> Manage
                      </Button>
                      <Button variant="outline" onClick={() => toast({ kind: "info", title: "Download package", message: "This would download KYB package." })}>
                        <FileText className="h-4 w-4" /> Package
                      </Button>
                    </div>
                  </div>
                </Section>

                <Section
                  title="Quick deep links"
                  subtitle="Open Admin Console sections"
                  right={<Pill label="Deep links" tone="info" />}
                >
                  <div className="grid grid-cols-1 gap-2">
                    <Button variant="outline" onClick={openAdminConsole}>
                      <ChevronRight className="h-4 w-4" /> Company profile
                    </Button>
                    <Button variant="outline" onClick={openAdminConsole}>
                      <ChevronRight className="h-4 w-4" /> KYB and documents
                    </Button>
                    <Button variant="outline" onClick={openAdminConsole}>
                      <ChevronRight className="h-4 w-4" /> Entities and invoice groups
                    </Button>
                    <Button variant="outline" onClick={openAdminConsole}>
                      <ChevronRight className="h-4 w-4" /> Module enablement
                    </Button>
                    <Button variant="outline" onClick={openAdminConsole}>
                      <ChevronRight className="h-4 w-4" /> Go-live checklist
                    </Button>
                  </div>
                </Section>

                <div
                  className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                  style={{
                    background:
                      "radial-gradient(90% 80% at 10% 0%, rgba(247,127,0,0.20), rgba(255,255,255,0)), radial-gradient(90% 80% at 90% 0%, rgba(3,205,140,0.16), rgba(255,255,255,0))",
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-2xl text-white" style={{ background: EVZ.orange }}>
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Premium org admin access</div>
                      <div className="mt-1 text-sm text-slate-600">This page is a fast summary. Editing happens in the Admin Console.</div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Pill label="KYB" tone="neutral" />
                        <Pill label="Entities" tone="neutral" />
                        <Pill label="Go-live" tone="neutral" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
                    <BadgeCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Tip</div>
                    <div className="mt-1 text-sm text-slate-600">Complete settlement verification and policy setup to pass go-live checks.</div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" onClick={() => toast({ kind: "info", title: "Support", message: "Open support" })}>
                    <ChevronRight className="h-4 w-4" /> Support
                  </Button>
                  <Button variant="primary" onClick={openAdminConsole}>
                    <ChevronRight className="h-4 w-4" /> Admin Console
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
