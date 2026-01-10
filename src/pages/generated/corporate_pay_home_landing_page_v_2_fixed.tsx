import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BadgeCheck,
  BarChart3,
  Building2,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  CreditCard,
  Download,
  FileText,
  GitBranch,
  Globe,
  Headphones,
  Key,
  Leaf,
  LayoutDashboard,
  Lock,
  Menu,
  MessagesSquare,
  Package,
  Rocket,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
  X,
} from "lucide-react";

const EVZ = {
  green: "#03CD8C",
  orange: "#F77F00",
  slate: "#0F172A",
  light: "#F2F2F2",
};

type NavKey = "product" | "solutions" | "how" | "modules" | "security" | "integrations" | "esg" | "faq";

type AccordionItem = { q: string; a: string };

type ModuleName =
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

type MarketplaceName =
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

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function downloadText(filename: string, content: string, mime = "text/plain") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function Pill({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "good" | "warn" | "bad" | "info" | "accent";
}) {
  const map: Record<string, string> = {
    good: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    warn: "bg-amber-50 text-amber-800 ring-amber-200",
    bad: "bg-rose-50 text-rose-700 ring-rose-200",
    info: "bg-blue-50 text-blue-700 ring-blue-200",
    accent: "bg-orange-50 text-orange-800 ring-orange-200",
    neutral: "bg-slate-50 text-slate-700 ring-slate-200",
  };
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1", map[tone])}>{label}</span>;
}

function Button({
  variant = "outline",
  className,
  children,
  onClick,
  href,
}: {
  variant?: "primary" | "accent" | "outline" | "ghost";
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
}) {
  const base = "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-4";
  const variants: Record<string, string> = {
    primary: "text-white shadow-[0_12px_24px_rgba(3,205,140,0.22)] hover:opacity-95 focus:ring-emerald-200",
    accent: "text-white shadow-[0_12px_24px_rgba(247,127,0,0.22)] hover:opacity-95 focus:ring-orange-200",
    outline: "border border-slate-200 bg-white text-slate-800 shadow-sm hover:bg-slate-50 focus:ring-slate-200",
    ghost: "bg-transparent text-slate-700 hover:bg-slate-100 focus:ring-slate-200",
  };
  const style = variant === "primary" ? { background: EVZ.green } : variant === "accent" ? { background: EVZ.orange } : undefined;

  if (href) {
    return (
      <a
        href={href}
        onClick={(e) => {
          if (onClick) {
            e.preventDefault();
            onClick();
          }
        }}
        className={cn(base, variants[variant], className)}
        style={style}
      >
        {children}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} className={cn(base, variants[variant], className)} style={style}>
      {children}
    </button>
  );
}

function Section({
  id,
  eyebrow,
  title,
  subtitle,
  right,
  children,
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          {eyebrow ? <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{eyebrow}</div> : null}
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">{title}</h2>
          {subtitle ? <p className="mt-2 max-w-3xl text-sm text-slate-600 md:text-base">{subtitle}</p> : null}
        </div>
        {right}
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
  chips,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  chips?: Array<{ label: string; tone?: any }>;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">{icon}</div>
        {chips?.length ? (
          <div className="flex flex-wrap items-center gap-2">
            {chips.map((c) => (
              <Pill key={c.label} label={c.label} tone={c.tone} />
            ))}
          </div>
        ) : null}
      </div>
      <div className="mt-4 text-base font-semibold text-slate-900">{title}</div>
      <div className="mt-2 text-sm text-slate-600">{desc}</div>
    </div>
  );
}

function StatChip({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-2xl font-semibold tracking-tight text-slate-900">{value}</div>
      <div className="mt-1 text-xs text-slate-500">{label}</div>
    </div>
  );
}

function ScrollSpyNav({ active, onJump }: { active: NavKey; onJump: (k: NavKey) => void }) {
  const items: Array<{ k: NavKey; label: string }> = [
    { k: "product", label: "Product" },
    { k: "solutions", label: "Solutions" },
    { k: "how", label: "How it works" },
    { k: "modules", label: "Modules" },
    { k: "security", label: "Security" },
    { k: "integrations", label: "Integrations" },
    { k: "esg", label: "ESG" },
    { k: "faq", label: "FAQ" },
  ];

  return (
    <nav className="hidden items-center gap-1 lg:flex">
      {items.map((i) => (
        <button
          key={i.k}
          type="button"
          onClick={() => onJump(i.k)}
          className={cn(
            "rounded-full px-3 py-2 text-sm font-semibold ring-1 transition",
            active === i.k ? "text-white ring-emerald-600" : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
          )}
          style={active === i.k ? { background: EVZ.green } : undefined}
        >
          {i.label}
        </button>
      ))}
    </nav>
  );
}

function Accordion({ items }: { items: AccordionItem[] }) {
  const [open, setOpen] = useState<number>(0);
  return (
    <div className="space-y-2">
      {items.map((it, idx) => {
        const isOpen = open === idx;
        return (
          <div key={it.q} className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left hover:bg-slate-50"
              onClick={() => setOpen(isOpen ? -1 : idx)}
            >
              <div className="text-sm font-semibold text-slate-900">{it.q}</div>
              <ChevronDown className={cn("h-5 w-5 text-slate-500 transition", isOpen ? "rotate-180" : "rotate-0")} />
            </button>
            <AnimatePresence initial={false}>
              {isOpen ? (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  <div className="border-t border-slate-200 px-5 py-4 text-sm text-slate-700">{it.a}</div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

export default function CorporatePayLandingPageV2Fixed() {
  const modules: ModuleName[] = [
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

  const marketplaces: MarketplaceName[] = [
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

  const faq: AccordionItem[] = [
    {
      q: "Do employees need a separate CorporatePay app?",
      a: "No. Employees use the normal EVzone user apps. At checkout, CorporatePay appears as a payment option when they are linked to an organization and eligible under policy.",
    },
    {
      q: "How do approvals work?",
      a: "Approvals can be auto-approved under thresholds (when allowed), or routed to multi-level approvers based on amount, module, marketplace, vendor, or risk. Decisions are fully audited.",
    },
    {
      q: "Can we buy high-value assets that exceed monthly budgets?",
      a: "Yes. Use RFQ/Quote Requests to request supplier quotes, compare offers, and convert to a purchase order. CapEx vs OpEx and milestone payments can be configured.",
    },
    {
      q: "What payment models are supported?",
      a: "Three models: Pay-as-you-go through the corporate wallet, Credit line with a limit, and Prepaid deposit where services stop when the balance is depleted.",
    },
    {
      q: "Can we export to our ERP?",
      a: "Yes. Export CSV/JSON or connect via secure APIs and webhooks (invoice created/paid, approval completed, limit breached).",
    },
    {
      q: "How is EVzone Support handled?",
      a: "Support is embedded as a role in your console. Support sessions are visible, watermarked, and auditable. No silent actions. Optional session recording is policy-controlled.",
    },
  ];

  const [mobileNav, setMobileNav] = useState(false);
  const [active, setActive] = useState<NavKey>("product");

  const [form, setForm] = useState({ org: "", name: "", email: "", phone: "", note: "" });
  const [submitted, setSubmitted] = useState(false);

  const jumpTo = (k: NavKey) => {
    setMobileNav(false);
    setActive(k);
    const el = document.getElementById(k);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Basic scroll spy (best-effort)
  useEffect(() => {
    const ids: NavKey[] = ["product", "solutions", "how", "modules", "security", "integrations", "esg", "faq"];
    const handler = () => {
      const y = window.scrollY;
      const found = ids
        .map((id) => {
          const el = document.getElementById(id);
          if (!el) return null;
          const top = el.getBoundingClientRect().top + window.scrollY;
          return { id, top };
        })
        .filter(Boolean) as Array<{ id: NavKey; top: number }>;

      let current: NavKey = "product";
      for (const s of found) {
        if (y + 160 >= s.top) current = s.id;
      }
      setActive(current);
    };

    window.addEventListener("scroll", handler, { passive: true });
    handler();
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const submit = () => {
    if (!form.org.trim() || !form.name.trim() || !/\S+@\S+\.\S+/.test(form.email)) {
      return;
    }
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen" style={{ background: "radial-gradient(90% 60% at 50% 0%, rgba(3,205,140,0.18), rgba(255,255,255,0))" }}>
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-3 px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl text-white" style={{ background: EVZ.green }}>
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900">CorporatePay</div>
              <div className="text-xs text-slate-500">EVzone corporate admin console</div>
            </div>
          </div>

          <ScrollSpyNav active={active} onJump={jumpTo} />

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => jumpTo("product")}>
              <ChevronRight className="h-4 w-4" /> Launch console
            </Button>
            <Button variant="primary" onClick={() => jumpTo("faq")}>
              <Rocket className="h-4 w-4" /> Request demo
            </Button>

            <button
              type="button"
              className="rounded-2xl border border-slate-200 bg-white p-2 text-slate-800 shadow-sm hover:bg-slate-50 lg:hidden"
              onClick={() => setMobileNav((v) => !v)}
              aria-label="Open menu"
            >
              {mobileNav ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        <AnimatePresence>
          {mobileNav ? (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="border-t border-slate-200 bg-white lg:hidden"
            >
              <div className="mx-auto max-w-[1200px] px-4 py-3 md:px-6">
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { k: "product", label: "Product" },
                      { k: "solutions", label: "Solutions" },
                      { k: "how", label: "How it works" },
                      { k: "modules", label: "Modules" },
                      { k: "security", label: "Security" },
                      { k: "integrations", label: "Integrations" },
                      { k: "esg", label: "ESG" },
                      { k: "faq", label: "FAQ" },
                    ] as Array<{ k: NavKey; label: string }>
                  ).map((i) => (
                    <button
                      key={i.k}
                      type="button"
                      onClick={() => jumpTo(i.k)}
                      className={cn(
                        "rounded-2xl border px-3 py-3 text-left text-sm font-semibold",
                        active === i.k ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      )}
                    >
                      {i.label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </header>

      {/* Hero */}
      <main>
        <div className="mx-auto max-w-[1200px] px-4 py-10 md:px-6 md:py-14">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <div className="flex flex-wrap items-center gap-2">
                <Pill label="Approvals-first" tone="info" />
                <Pill label="Budget enforcement" tone="good" />
                <Pill label="ERP-ready" tone="neutral" />
                <Pill label="SSO-ready (Phase 2)" tone="neutral" />
              </div>

              <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-900 md:text-5xl">
                Corporate rides, services, and purchases with
                <span className="text-emerald-700"> serious approvals</span>.
              </h1>

              <p className="mt-4 max-w-2xl text-base text-slate-600 md:text-lg">
                CorporatePay is the web admin console that centralizes budgets, approvals, invoicing, and policy enforcement across the EVzone Super App.
                Employees keep using the normal EVzone apps. CorporatePay simply governs how the company pays.
              </p>

              <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center">
                <Button variant="primary" onClick={() => jumpTo("faq")}>
                  <Rocket className="h-4 w-4" /> Request a demo
                </Button>
                <Button variant="outline" onClick={() => jumpTo("how")}>
                  <ChevronRight className="h-4 w-4" /> See how it works
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const text = "CorporatePay one-pager (demo).";
                    downloadText("corporatepay-one-pager.txt", text, "text/plain");
                  }}
                >
                  <Download className="h-4 w-4" /> Download one-pager
                </Button>
              </div>

              <div className="mt-7 grid grid-cols-2 gap-3 md:grid-cols-4">
                <StatChip value="3" label="Payment models" />
                <StatChip value="Daily" label="Invoice options" />
                <StatChip value="4" label="Alert channels" />
                <StatChip value="Audit" label="Every action" />
              </div>

              <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-amber-800 ring-1 ring-amber-200">
                    <BadgeCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Best for organizations without fleets</div>
                    <div className="mt-1 text-sm text-slate-700">Hospitals, tour companies, and corporates can run company-paid mobility and procurement without owning vehicles.</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mock UI panel */}
            <div className="lg:col-span-5">
              <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(2,8,23,0.12)]">
                <div className="border-b border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="grid h-9 w-9 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
                        <LayoutDashboard className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900">Admin console preview</div>
                        <div className="text-xs text-slate-500">Budgets • Approvals • Invoices</div>
                      </div>
                    </div>
                    <Pill label="Live" tone="good" />
                  </div>
                </div>

                <div className="bg-slate-50 p-4">
                  <div className="grid grid-cols-1 gap-3">
                    <FeatureRow icon={<Wallet className="h-4 w-4" />} title="Wallet + Credit + Prepaid" value="Payment models" />
                    <FeatureRow icon={<ClipboardCheck className="h-4 w-4" />} title="Approval workflows" value="Auto + multi-level" />
                    <FeatureRow icon={<FileText className="h-4 w-4" />} title="Invoices" value="Daily/Weekly/Monthly" />
                    <FeatureRow icon={<GitBranch className="h-4 w-4" />} title="Webhooks" value="Invoice/Approvals/Limits" />
                    <FeatureRow icon={<ShieldCheck className="h-4 w-4" />} title="Audit + Compliance" value="Forensic exports" />
                  </div>

                  <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-semibold text-slate-500">Go-live readiness</div>
                        <div className="mt-1 text-lg font-semibold text-slate-900">92%</div>
                      </div>
                      <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full" style={{ width: "92%", background: EVZ.green }} />
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-slate-600">Finish invoice group routing to unlock full automation.</div>
                  </div>
                </div>

                <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full" style={{ background: "rgba(3,205,140,0.18)" }} />
                <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full" style={{ background: "rgba(247,127,0,0.14)" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Product */}
        <div className="mx-auto max-w-[1200px] px-4 pb-10 md:px-6 md:pb-14">
          <Section
            id="product"
            eyebrow="Product"
            title="A single corporate control plane for EVzone"
            subtitle="CorporatePay centralizes financial controls, policies, and approvals across rides, services, marketplaces, and high-value procurement."
            right={
              <div className="flex flex-wrap items-center gap-2">
                <Pill label="Role-based" tone="neutral" />
                <Pill label="Audit-ready" tone="info" />
                <Pill label="Policy-driven" tone="good" />
              </div>
            }
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <FeatureCard
                icon={<ClipboardCheck className="h-6 w-6" />}
                title="Approvals that scale"
                desc="Auto-approve under thresholds (where allowed) and route higher-risk actions to multi-level approvers. All decisions are auditable."
                chips={[{ label: "Core", tone: "neutral" }, { label: "SLA timers", tone: "info" }]}
              />
              <FeatureCard
                icon={<Wallet className="h-6 w-6" />}
                title="Budgets and spend controls"
                desc="Org, group, user, module, and marketplace budgets. Hard vs soft caps, alerts, forecasting, and emergency exceptions."
                chips={[{ label: "Core", tone: "neutral" }, { label: "Forecasting", tone: "info" }]}
              />
              <FeatureCard
                icon={<FileText className="h-6 w-6" />}
                title="Invoicing and reconciliation"
                desc="Daily, weekly, monthly invoicing. Invoice groups for AP routing. Exports for ERP reconciliation with audit trails."
                chips={[{ label: "Core", tone: "neutral" }, { label: "ERP-ready", tone: "neutral" }]}
              />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <FeatureCard
                icon={<Package className="h-6 w-6" />}
                title="RFQ for high-value assets"
                desc="Request quotes for assets that exceed monthly budgets. Compare offers, convert to purchase orders, and manage milestone payments."
                chips={[{ label: "Core", tone: "neutral" }, { label: "CapEx", tone: "info" }]}
              />
              <FeatureCard
                icon={<MessagesSquare className="h-6 w-6" />}
                title="Multi-channel reminders"
                desc="Automated notifications for due invoices, overdue status, pending approvals, and limit breaches via Email, WhatsApp, WeChat, and SMS."
                chips={[{ label: "Core", tone: "neutral" }, { label: "Delivery logs", tone: "info" }]}
              />
              <FeatureCard
                icon={<ShieldCheck className="h-6 w-6" />}
                title="Security and compliance"
                desc="Audit logs for every action, MFA policies, device trust, support mode gating, dual control, and forensic exports."
                chips={[{ label: "Core", tone: "neutral" }, { label: "Forensics", tone: "info" }]}
              />
            </div>
          </Section>

          {/* Solutions */}
          <div className="mt-12">
            <Section
              id="solutions"
              eyebrow="Solutions"
              title="Built for corporates, hospitals, and tour companies"
              subtitle="Use the same control plane across industries, while applying policy templates and risk controls per program."
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <SolutionCard
                  title="Corporate"
                  icon={<Building2 className="h-5 w-5" />}
                  bullets={["Group budgets and chargeback", "Procurement approvals", "Consolidated invoicing", "ERP exports and mapping"]}
                />
                <SolutionCard
                  title="Hospital"
                  icon={<ShieldCheck className="h-5 w-5" />}
                  bullets={["Stricter approvals and audit", "24/7 exceptions", "Emergency travel rules", "Vendor compliance docs"]}
                />
                <SolutionCard
                  title="Tour company"
                  icon={<Globe className="h-5 w-5" />}
                  bullets={["Airport routes and geo rules", "Event manifests", "Visitor scheduling", "Approved vendor catalogs"]}
                />
              </div>
            </Section>
          </div>

          {/* How it works */}
          <div className="mt-12">
            <Section
              id="how"
              eyebrow="How it works"
              title="Employees keep the normal EVzone apps"
              subtitle="CorporatePay lives in your web admin console. For employees, CorporatePay appears as a payment option at checkout only when eligible under policy."
              right={
                <Button variant="outline" onClick={() => jumpTo("modules")}>
                  <ChevronRight className="h-4 w-4" /> See supported modules
                </Button>
              }
            >
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-7 space-y-3">
                  <StepRow n={1} title="Create your organization" desc="Add entities, billing contacts, invoice groups, and enable modules and marketplaces." />
                  <StepRow n={2} title="Invite employees and assign groups" desc="Assign roles, group membership, cost centers, spend limits, and auto-approval eligibility." />
                  <StepRow n={3} title="Define budgets and approval rules" desc="Set org, group, user, module, and marketplace budgets. Configure approval workflows per module and marketplace." />
                  <StepRow n={4} title="Go live" desc="Employees see CorporatePay at checkout. Invoices run on your chosen schedule and exports are audit-ready." />
                </div>

                <div className="lg:col-span-5">
                  <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">Billing models</div>
                        <div className="mt-1 text-xs text-slate-500">Choose per organization</div>
                      </div>
                      <Pill label="Core" tone="neutral" />
                    </div>
                    <div className="mt-4 space-y-2">
                      <MiniP title="Pay-as-you-go wallet" desc="Company-funded wallet used at checkout." icon={<Wallet className="h-4 w-4" />} />
                      <MiniP title="Credit line" desc="Company credit limit with controls." icon={<CreditCard className="h-4 w-4" />} />
                      <MiniP title="Prepaid deposit" desc="Spend-down balance. Services stop when depleted." icon={<CircleDollarSign className="h-4 w-4" />} />
                    </div>
                    <div className="mt-4 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                      Invoicing frequency can be daily, weekly, monthly, or custom by invoice group.
                    </div>
                  </div>
                </div>
              </div>
            </Section>
          </div>

          {/* Modules and marketplaces */}
          <div className="mt-12">
            <Section
              id="modules"
              eyebrow="Coverage"
              title="Modules and marketplaces supported"
              subtitle="CorporatePay can govern spending across service modules and marketplaces, with an expansion slot for future modules and marketplaces."
            >
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-6">
                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">Service modules</div>
                        <div className="mt-1 text-xs text-slate-500">Enable/disable per org and pilot group</div>
                      </div>
                      <Pill label="Core" tone="neutral" />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {modules.map((m) => (
                        <Pill key={m} label={m} tone={m === "Other Service Module" ? "neutral" : "good"} />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-6">
                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">Marketplaces</div>
                        <div className="mt-1 text-xs text-slate-500">Under E-Commerce (including MyLiveDealz)</div>
                      </div>
                      <Pill label="Core" tone="neutral" />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {marketplaces.map((m) => (
                        <Pill key={m} label={m} tone={m === "MyLiveDealz" ? "accent" : m === "Other Marketplace" ? "neutral" : "good"} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">High-value procurement</div>
                    <div className="mt-1 text-sm text-slate-600">RFQ flow for assets that do not fit within monthly budgets.</div>
                  </div>
                  <Pill label="RFQ" tone="info" />
                </div>
                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
                  <MiniStep n={1} title="Create RFQ" desc="Specs, quantities, delivery location" />
                  <MiniStep n={2} title="Get quotes" desc="Invite vendors + Q&A thread" />
                  <MiniStep n={3} title="Compare" desc="Table view + approvals" />
                  <MiniStep n={4} title="Convert" desc="PO → invoice → payments" />
                </div>
              </div>
            </Section>
          </div>

          {/* Security */}
          <div className="mt-12">
            <Section
              id="security"
              eyebrow="Security"
              title="Security, audit, and support controls"
              subtitle="Designed for enterprise-grade governance with auditable actions, policy enforcement, and support-mode safeguards."
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <FeatureCard
                  icon={<Lock className="h-6 w-6" />}
                  title="MFA and device trust"
                  desc="Require MFA for finance and approvers. Trust devices with expiry and trigger step-up prompts for risk signals."
                  chips={[{ label: "Core", tone: "neutral" }, { label: "Conditional access", tone: "info" }]}
                />
                <FeatureCard
                  icon={<ShieldCheck className="h-6 w-6" />}
                  title="Dual-control for sensitive actions"
                  desc="Two-person approval for production key rotation, retention changes, support write actions, and forensic exports."
                  chips={[{ label: "Premium", tone: "info" }, { label: "Forensics", tone: "info" }]}
                />
                <FeatureCard
                  icon={<Headphones className="h-6 w-6" />}
                  title="Support mode gating"
                  desc="EVzone Support is an embedded role. Sessions are visible, watermarked, and never silent. Optional recording is policy-controlled."
                  chips={[{ label: "Core", tone: "neutral" }, { label: "Premium recording", tone: "info" }]}
                />
              </div>
            </Section>
          </div>

          {/* Integrations */}
          <div className="mt-12">
            <Section
              id="integrations"
              eyebrow="Integrations"
              title="ERP exports, APIs, and webhooks"
              subtitle="Sync invoices and ledger data to your ERP with secure APIs, scoped keys, and operational webhooks."
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <FeatureCard
                  icon={<FileText className="h-6 w-6" />}
                  title="CSV and JSON exports"
                  desc="Export transactions, invoices, and approvals. Use invoice group codes and GL mappings for clean accounting workflows."
                  chips={[{ label: "Core", tone: "neutral" }]}
                />
                <FeatureCard
                  icon={<Key className="h-6 w-6" />}
                  title="Secure API keys and scopes"
                  desc="Least-privilege scopes, rotation, revocation, IP allowlists, and audit trails for all access."
                  chips={[{ label: "Core", tone: "neutral" }]}
                />
                <FeatureCard
                  icon={<Globe className="h-6 w-6" />}
                  title="Webhooks"
                  desc="Invoice created/paid, approval completed, and limit breached events with delivery logs and retries."
                  chips={[{ label: "Core", tone: "neutral" }, { label: "Inspector", tone: "info" }]}
                />
              </div>

              <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Phase 2</div>
                    <div className="mt-1 text-sm text-slate-600">SSO (Google/Microsoft) and HRIS imports to automate user provisioning.</div>
                  </div>
                  <Pill label="Phase 2" tone="neutral" />
                </div>
              </div>
            </Section>
          </div>

          {/* ESG */}
          <div className="mt-12">
            <Section
              id="esg"
              eyebrow="Sustainability"
              title="Sustainability and ESG reporting"
              subtitle="Measure EV usage and charging utilization across your corporate activity, with emissions estimates and template-aligned exports."
              right={<Pill label="Premium" tone="info" />}
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <FeatureCard icon={<Leaf className="h-6 w-6" />} title="EV usage metrics" desc="Track EV share, charging sessions, off-peak ratio, and utilization by site or group." />
                <FeatureCard icon={<BarChart3 className="h-6 w-6" />} title="Scorecards" desc="Simple, explainable scorecards that your team can adapt to internal sustainability programs." />
                <FeatureCard icon={<FileText className="h-6 w-6" />} title="Template exports" desc="CSV/JSON exports aligned to your internal ESG templates, plus Print-to-PDF packs." />
              </div>

              <div className="mt-4 rounded-2xl bg-emerald-50 p-3 text-xs text-emerald-900 ring-1 ring-emerald-200">Tip: ESG reporting is strongest when purpose tags and cost centers are enforced in policies.</div>
            </Section>
          </div>

          {/* FAQ + demo request */}
          <div className="mt-12">
            <Section
              id="faq"
              eyebrow="FAQ"
              title="Questions and demo request"
              subtitle="Send your requirements and we will tailor policy templates for your organization."
              right={<Pill label="Fast setup" tone="good" />}
            >
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                <div className="lg:col-span-7">
                  <Accordion items={faq} />
                </div>

                <div className="lg:col-span-5">
                  <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">Request a demo</div>
                        <div className="mt-1 text-xs text-slate-500">We will reply with a tailored walkthrough.</div>
                      </div>
                      <Pill label="Free" tone="neutral" />
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3">
                      <Input label="Organization" value={form.org} onChange={(v) => setForm((p) => ({ ...p, org: v }))} placeholder="Company name" required />
                      <Input label="Your name" value={form.name} onChange={(v) => setForm((p) => ({ ...p, name: v }))} placeholder="Full name" required />
                      <Input label="Work email" value={form.email} onChange={(v) => setForm((p) => ({ ...p, email: v }))} placeholder="name@company.com" required />
                      <Input label="Phone" value={form.phone} onChange={(v) => setForm((p) => ({ ...p, phone: v }))} placeholder="Optional" />
                      <TextArea
                        label="What do you want to control?"
                        value={form.note}
                        onChange={(v) => setForm((p) => ({ ...p, note: v }))}
                        placeholder="Example: approvals for rides, RFQ for vehicles, invoice groups for 3 departments"
                        rows={4}
                      />

                      <Button variant="primary" onClick={submit}>
                        <Rocket className="h-4 w-4" /> Submit request
                      </Button>

                      {submitted ? (
                        <div className="rounded-2xl bg-emerald-50 p-3 text-xs text-emerald-900 ring-1 ring-emerald-200">Submitted. We will reach out soon.</div>
                      ) : (
                        <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
                          By submitting, you confirm you want CorporatePay onboarding. In production, this creates a ticket and onboarding checklist.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Section>
          </div>

          {/* Footer */}
          <footer className="mt-12 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl text-white" style={{ background: EVZ.green }}>
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">CorporatePay</div>
                    <div className="text-xs text-slate-500">EVzone Super App</div>
                  </div>
                </div>
                <div className="mt-3 max-w-md text-sm text-slate-600">
                  CorporatePay is the corporate admin console that governs how organizations pay for rides, services, and purchases across EVzone.
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Pill label="Audit-ready" tone="info" />
                  <Pill label="Approvals-first" tone="good" />
                  <Pill label="ERP exports" tone="neutral" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <FooterCol title="Product" links={["Dashboard", "Approvals", "Budgets", "Invoices", "RFQ"]} />
                <FooterCol title="Security" links={["MFA", "Device trust", "Dual control", "Forensic exports"]} />
                <FooterCol title="Integrations" links={["CSV/JSON", "Webhooks", "API keys", "Sandbox"]} />
              </div>
            </div>

            <div className="mt-6 border-t border-slate-200 pt-4 text-xs text-slate-500">© {new Date().getFullYear()} EVzone CorporatePay. All rights reserved.</div>
          </footer>
        </div>
      </main>
    </div>
  );
}

function FeatureRow({ icon, title, value }: { icon: React.ReactNode; title: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white p-3">
      <div className="flex items-center gap-2">
        <div className="grid h-9 w-9 place-items-center rounded-2xl bg-slate-50 text-slate-700">{icon}</div>
        <div>
          <div className="text-sm font-semibold text-slate-900">{title}</div>
          <div className="text-xs text-slate-500">{value}</div>
        </div>
      </div>
      <ChevronRight className="h-5 w-5 text-slate-400" />
    </div>
  );
}

function SolutionCard({ title, icon, bullets }: { title: string; icon: React.ReactNode; bullets: string[] }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-50 text-slate-700">{icon}</div>
        <Pill label="Template" tone="neutral" />
      </div>
      <div className="mt-4 text-base font-semibold text-slate-900">{title}</div>
      <ul className="mt-3 space-y-2 text-sm text-slate-700">
        {bullets.map((b) => (
          <li key={b} className="flex items-start gap-2">
            <span className="mt-2 h-1.5 w-1.5 rounded-full" style={{ background: EVZ.green }} />
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StepRow({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-2xl text-white" style={{ background: EVZ.green }}>
          <span className="text-sm font-black">{n}</span>
        </div>
        <div>
          <div className="text-sm font-semibold text-slate-900">{title}</div>
          <div className="mt-1 text-sm text-slate-600">{desc}</div>
        </div>
      </div>
    </div>
  );
}

function MiniP({ title, desc, icon }: { title: string; desc: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">{title}</div>
          <div className="mt-1 text-xs text-slate-600">{desc}</div>
        </div>
        <div className="grid h-9 w-9 place-items-center rounded-2xl bg-slate-50 text-slate-700">{icon}</div>
      </div>
    </div>
  );
}

function MiniStep({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <Pill label={`Step ${n}`} tone="neutral" />
        <ChevronRight className="h-4 w-4 text-slate-400" />
      </div>
      <div className="mt-3 text-sm font-semibold text-slate-900">{title}</div>
      <div className="mt-1 text-sm text-slate-600">{desc}</div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  const bad = !!required && !value.trim();
  return (
    <label>
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold text-slate-600">
          {label}
          {required ? <span className="text-rose-600"> *</span> : null}
        </div>
        {bad ? <div className="text-xs font-semibold text-rose-600">Required</div> : null}
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "mt-2 w-full rounded-2xl border px-3 py-2.5 text-sm font-semibold outline-none focus:ring-4",
          bad ? "border-rose-300 bg-white text-slate-900 focus:ring-rose-100" : "border-slate-200 bg-white text-slate-900 focus:ring-emerald-100"
        )}
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <label>
      <div className="text-xs font-semibold text-slate-600">{label}</div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-900 shadow-sm outline-none focus:ring-4 focus:ring-emerald-100"
      />
    </label>
  );
}

function FooterCol({ title, links }: { title: string; links: string[] }) {
  return (
    <div>
      <div className="text-sm font-semibold text-slate-900">{title}</div>
      <ul className="mt-3 space-y-2 text-sm text-slate-600">
        {links.map((l) => (
          <li key={l}>
            <a href="#" className="hover:text-slate-900">
              {l}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
