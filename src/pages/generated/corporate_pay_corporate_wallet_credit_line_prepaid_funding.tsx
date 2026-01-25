import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BadgeCheck,
  Banknote,
  Building2,
  Check,
  ChevronRight,
  CreditCard,
  DollarSign,
  Globe,
  Info,
  Lock,
  Plus,
  RefreshCcw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Timer,
  Wallet as WalletIcon,
  X,
} from "lucide-react";

const EVZ = { green: "#03CD8C", orange: "#F77F00" };

type Currency = "UGX" | "USD" | "CNY" | "KES";

type OrgRole = "Viewer" | "Member" | "Approver" | "Finance" | "Admin" | "Owner";

type OrgStatus = "Active" | "Paused" | "Suspended";

type FundingModel = "Wallet" | "Prepaid" | "Credit" | "Wallet + Credit";

type EnforcementFlag = "Billing delinquency" | "Deposit depleted" | "Credit exceeded" | "Risk hold" | "Compliance lock";

type RiskEvent = { id: string; when: string; severity: "Info" | "Warning" | "Critical"; title: string; detail: string };

type FundingRequest = {
  id: string;
  when: string;
  type: "Top up prepaid" | "Increase credit" | "Unlock wallet";
  amountUGX: number;
  status: "Pending" | "Approved" | "Rejected";
  requestedBy: string;
  note: string;
};

type AutoTopUpRule = {
  id: string;
  enabled: boolean;
  triggerBelowUGX: number;
  topUpAmountUGX: number;
  method: "Bank transfer" | "Card" | "Mobile money";
  cooldown: string;
  note: string;
};

type SettlementRule = {
  id: string;
  scope: "Beneficiary" | "Module" | "Organization";
  target: string;
  currency: Currency;
  note: string;
};

type Org = {
  id: string;
  name: string;
  role: OrgRole;
  status: OrgStatus;
  model: FundingModel;
  walletBalances: Record<Currency, number>;
  prepaidBalanceUGX: number;
  creditLimitUGX: number;
  creditUsedUGX: number;
  enforcement: Array<{ flag: EnforcementFlag; severity: "Info" | "Warning" | "Blocked"; reason: string }>;
};

type Toast = { id: string; title: string; message?: string; kind: "success" | "warn" | "error" | "info" };

function cn(...p: Array<string | false | null | undefined>) {
  return p.filter(Boolean).join(" ");
}
function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}
function formatUGX(amount: number) {
  const n = Math.abs(amount).toLocaleString(undefined, { maximumFractionDigits: 0 });
  const sign = amount < 0 ? "-" : "";
  return `${sign}UGX ${n}`;
}
function formatMoney(amount: number, currency: Currency) {
  const abs = Math.abs(amount);
  const isUGX = currency === "UGX";
  const decimals = isUGX ? 0 : 2;
  const num = abs.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  const sign = amount < 0 ? "-" : "";
  return `${sign}${currency} ${num}`;
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
  children,
  onClick,
  disabled,
  className,
  title,
}: {
  variant?: "primary" | "accent" | "outline" | "ghost" | "danger";
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
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
  const w = Math.round(pct * 100);
  const color = w >= 85 ? EVZ.orange : EVZ.green;
  return (
    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div className="h-full rounded-full" style={{ width: `${w}%`, background: color }} />
    </div>
  );
}

function toneForEnforcement(sev: "Info" | "Warning" | "Blocked") {
  if (sev === "Blocked") return "bad" as const;
  if (sev === "Warning") return "warn" as const;
  return "info" as const;
}

export default function OrgWalletFundingEnforcement() {
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
        role: "Admin",
        status: "Active",
        model: "Wallet + Credit",
        walletBalances: { UGX: 9800000, USD: 0, CNY: 1800, KES: 0 },
        prepaidBalanceUGX: 0,
        creditLimitUGX: 10000000,
        creditUsedUGX: 4200000,
        enforcement: [
          { flag: "Risk hold", severity: "Warning", reason: "Large payouts require maker-checker" },
          { flag: "Compliance lock", severity: "Info", reason: "KYC in review for one entity" },
        ],
      },
      {
        id: "org_khl",
        name: "Kampala Holdings",
        role: "Finance",
        status: "Paused",
        model: "Prepaid",
        walletBalances: { UGX: 0, USD: 0, CNY: 0, KES: 0 },
        prepaidBalanceUGX: 0,
        creditLimitUGX: 0,
        creditUsedUGX: 0,
        enforcement: [{ flag: "Deposit depleted", severity: "Blocked", reason: "Prepaid deposit is depleted. CorporatePay paused." }],
      },
      {
        id: "org_demo",
        name: "EVzone Demo Org",
        role: "Approver",
        status: "Suspended",
        model: "Credit",
        walletBalances: { UGX: 0, USD: 0, CNY: 0, KES: 0 },
        prepaidBalanceUGX: 0,
        creditLimitUGX: 5000000,
        creditUsedUGX: 5400000,
        enforcement: [{ flag: "Credit exceeded", severity: "Blocked", reason: "Credit limit exceeded or invoices overdue" }],
      },
    ],
    []
  );

  const [orgId, setOrgId] = useState(orgs[0].id);
  const org = useMemo(() => orgs.find((o) => o.id === orgId) || orgs[0], [orgs, orgId]);

  const canAdmin = useMemo(() => ["Owner", "Admin", "Finance"].includes(org.role), [org.role]);

  const creditAvailable = Math.max(0, org.creditLimitUGX - org.creditUsedUGX);
  const creditPct = org.creditLimitUGX > 0 ? org.creditUsedUGX / org.creditLimitUGX : 0;

  const [autoRules, setAutoRules] = useState<AutoTopUpRule[]>([
    {
      id: "AT-1",
      enabled: true,
      triggerBelowUGX: 200000,
      topUpAmountUGX: 1000000,
      method: "Bank transfer",
      cooldown: "24h",
      note: "Top up prepaid when balance is low",
    },
  ]);

  const [settlementRules, setSettlementRules] = useState<SettlementRule[]>([
    { id: "SR-1", scope: "Organization", target: "Acme Group Ltd", currency: "USD", note: "Reporting and settlement default" },
    { id: "SR-2", scope: "Module", target: "CorporatePay", currency: "UGX", note: "Local procurement" },
    { id: "SR-3", scope: "Beneficiary", target: "China settlement", currency: "CNY", note: "Supplier settlement" },
  ]);

  const [riskFeed] = useState<RiskEvent[]>([
    { id: "R-1", when: "Today 09:10", severity: "Warning", title: "High value payout attempt", detail: "Payout above threshold triggered maker-checker" },
    { id: "R-2", when: "Yesterday", severity: "Info", title: "Provider delay", detail: "Bank payouts delayed due to maintenance" },
    { id: "R-3", when: "Last week", severity: "Critical", title: "Billing delinquency", detail: "Invoice overdue. Credit line paused." },
  ]);

  const [fundingRequests, setFundingRequests] = useState<FundingRequest[]>([
    { id: "FR-101", when: "Today 08:40", type: "Top up prepaid", amountUGX: 2000000, status: "Pending", requestedBy: "Member", note: "Deposit depleted" },
    { id: "FR-102", when: "Yesterday", type: "Increase credit", amountUGX: 5000000, status: "Pending", requestedBy: "Finance Desk", note: "Scaling procurement" },
    { id: "FR-103", when: "2 weeks ago", type: "Unlock wallet", amountUGX: 0, status: "Approved", requestedBy: "Owner", note: "Lock cleared" },
  ]);

  const openAdminConsole = () => toast({ kind: "info", title: "Open Admin Console", message: "Deep link to CorporatePay Admin Console." });

  const approveRequest = (id: string) => {
    setFundingRequests((p) => p.map((r) => (r.id === id ? { ...r, status: "Approved" } : r)));
    toast({ kind: "success", title: "Approved", message: id });
  };
  const rejectRequest = (id: string) => {
    setFundingRequests((p) => p.map((r) => (r.id === id ? { ...r, status: "Rejected" } : r)));
    toast({ kind: "info", title: "Rejected", message: id });
  };

  const toggleAuto = (id: string) => {
    setAutoRules((p) => p.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
    toast({ kind: "success", title: "Auto top-up updated" });
  };

  const [simSpend, setSimSpend] = useState("8000000");
  const [simDays, setSimDays] = useState("30");
  const sim = useMemo(() => {
    const spend = Number(simSpend.replace(/[^0-9]/g, "")) || 0;
    const days = Number(simDays.replace(/[^0-9]/g, "")) || 30;
    const perDay = days > 0 ? Math.round(spend / days) : 0;
    const trigger = autoRules[0]?.triggerBelowUGX ?? 0;
    const topUp = autoRules[0]?.topUpAmountUGX ?? 0;
    const expectedTopUps = topUp > 0 ? Math.max(0, Math.round((spend - trigger) / topUp)) : 0;
    return { spend, days, perDay, expectedTopUps };
  }, [simSpend, simDays, autoRules]);

  const [addRuleOpen, setAddRuleOpen] = useState(false);
  const [draftScope, setDraftScope] = useState<SettlementRule["scope"]>("Module");
  const [draftTarget, setDraftTarget] = useState("E-Commerce");
  const [draftCurrency, setDraftCurrency] = useState<Currency>("UGX");
  const [draftNote, setDraftNote] = useState("Default");

  const addSettlementRule = () => {
    if (!draftTarget.trim()) {
      toast({ kind: "warn", title: "Target required" });
      return;
    }
    setSettlementRules((p) => [{ id: uid("SR"), scope: draftScope, target: draftTarget.trim(), currency: draftCurrency, note: draftNote.trim() }, ...p]);
    setAddRuleOpen(false);
    toast({ kind: "success", title: "Rule added" });
  };

  const riskTone = (s: RiskEvent["severity"]) => (s === "Critical" ? "bad" : s === "Warning" ? "warn" : "info");

  return (
    <div className="min-h-screen" style={{ background: "radial-gradient(90% 60% at 50% 0%, rgba(3,205,140,0.18), rgba(255,255,255,0))" }}>
      <ToastStack toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((x) => x.id !== id))} />

      <div className="mx-auto max-w-[95%] px-4 py-5 md:px-6">
        <div className="rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(2,8,23,0.10)]">
          <div className="border-b border-slate-200 px-4 py-4 md:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl text-white" style={{ background: EVZ.green }}>
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">Organization Wallet, Funding Models & Enforcement</div>
                  <div className="mt-1 text-xs text-slate-500">Manage wallet, credit, prepaid, enforcement, multi-currency, and settlement rules</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Pill label={`Org: ${org.name}`} tone="info" />
                    <Pill label={`Role: ${org.role}`} tone={canAdmin ? "info" : "neutral"} />
                    <Pill label={`Status: ${org.status}`} tone={org.status === "Active" ? "good" : org.status === "Paused" ? "warn" : "bad"} />
                    <Pill label={`Model: ${org.model}`} tone="neutral" />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="min-w-[260px]">
                  <Select value={orgId} onChange={setOrgId} options={orgs.map((o) => ({ value: o.id, label: o.name }))} />
                </div>
                <Button variant="outline" onClick={() => toast({ kind: "info", title: "Wallet Switcher", message: "This would open Wallet Switcher." })}>
                  <ChevronRight className="h-4 w-4" /> Switch
                </Button>
                <Button variant="outline" onClick={openAdminConsole}>
                  <ChevronRight className="h-4 w-4" /> Admin Console
                </Button>
                <Button variant="primary" onClick={() => toast({ kind: "success", title: "Refreshed" })}>
                  <RefreshCcw className="h-4 w-4" /> Refresh
                </Button>
              </div>
            </div>

            {!canAdmin ? (
              <div className="mt-4 rounded-3xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-amber-800">
                    <Lock className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">View-only</div>
                    <div className="mt-1 text-sm text-amber-900">Editing funding model and enforcement requires Admin or Finance role.</div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="bg-slate-50 px-4 py-5 md:px-6">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              <div className="space-y-4 lg:col-span-8">
                <Section
                  title="Funding model"
                  subtitle="Wallet, prepaid, credit and combined models"
                  right={<Pill label={org.model} tone="neutral" />}
                >
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="rounded-3xl border border-slate-200 bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">Prepaid</div>
                          <div className="mt-1 text-sm text-slate-600">Deposit-backed funding</div>
                        </div>
                        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-50 text-slate-700">
                          <WalletIcon className="h-5 w-5" />
                        </div>
                      </div>
                      <div className="mt-3 text-sm font-semibold text-slate-900">Balance: {formatUGX(org.prepaidBalanceUGX)}</div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Button variant="outline" disabled={!canAdmin} title={!canAdmin ? "Admin required" : "Request top-up"} onClick={() => toast({ kind: "info", title: "Funding request", message: "Create prepaid top-up request" })}>
                          <ChevronRight className="h-4 w-4" /> Request top-up
                        </Button>
                        <Button variant="outline" onClick={() => toast({ kind: "info", title: "History", message: "Open funding history" })}>
                          <ChevronRight className="h-4 w-4" /> History
                        </Button>
                      </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">Credit line</div>
                          <div className="mt-1 text-sm text-slate-600">Invoice-backed funding</div>
                        </div>
                        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-50 text-slate-700">
                          <CreditCard className="h-5 w-5" />
                        </div>
                      </div>
                      <div className="mt-3 text-sm font-semibold text-slate-900">Limit: {formatUGX(org.creditLimitUGX)}</div>
                      <div className="mt-1 text-sm text-slate-600">Used: {formatUGX(org.creditUsedUGX)} • Available: {formatUGX(creditAvailable)}</div>
                      <TinyBar value={org.creditUsedUGX} max={org.creditLimitUGX || 1} />
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Button variant="outline" disabled={!canAdmin} title={!canAdmin ? "Admin required" : "Request increase"} onClick={() => toast({ kind: "info", title: "Funding request", message: "Create credit increase request" })}>
                          <ChevronRight className="h-4 w-4" /> Increase
                        </Button>
                        <Button variant="outline" onClick={() => toast({ kind: "info", title: "Statements", message: "Open credit statements" })}>
                          <ChevronRight className="h-4 w-4" /> Statements
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                    <div className="flex items-start gap-2">
                      <Info className="mt-0.5 h-4 w-4" />
                      <div>Funding model affects checkout eligibility, approvals, and enforcement. Show reasons in receipt drawer.</div>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Button variant="outline" onClick={() => toast({ kind: "info", title: "Policy builder", message: "Deep link to Policy Builder" })}>
                      <ChevronRight className="h-4 w-4" /> Policy
                    </Button>
                    <Button variant="outline" onClick={() => toast({ kind: "info", title: "Approvals", message: "Deep link to Approval Inbox" })}>
                      <ChevronRight className="h-4 w-4" /> Approvals
                    </Button>
                    <Button variant="outline" onClick={openAdminConsole}>
                      <ChevronRight className="h-4 w-4" /> Advanced
                    </Button>
                  </div>
                </Section>

                <Section
                  title="Multi-currency balances"
                  subtitle="Recommended extension: show balances and settlement currency rules"
                  right={<Pill label="Multi-currency" tone="info" />}
                >
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {(Object.keys(org.walletBalances) as Currency[]).map((c) => (
                      <div key={c} className="rounded-3xl border border-slate-200 bg-white p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="text-sm font-semibold text-slate-900">{c}</div>
                              {c === "UGX" ? <Pill label="Primary" tone="info" /> : <Pill label="Other" tone="neutral" />}
                            </div>
                            <div className="mt-2 text-sm font-semibold text-slate-900">{formatMoney(org.walletBalances[c], c)}</div>
                            <div className="mt-1 text-xs text-slate-500">Available balance</div>
                          </div>
                          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-50 text-slate-700">
                            <Globe className="h-5 w-5" />
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <Button variant="outline" onClick={() => toast({ kind: "info", title: "FX", message: "Open FX & Multi-Currency" })}>
                            <ChevronRight className="h-4 w-4" /> FX
                          </Button>
                          <Button variant="outline" onClick={() => toast({ kind: "info", title: "Settlement", message: "Scroll to settlement rules" })}>
                            <ChevronRight className="h-4 w-4" /> Settlement
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>

                <Section
                  title="Settlement currency rules"
                  subtitle="Preferences to control payout and reporting currency"
                  right={<Button variant="primary" disabled={!canAdmin} title={!canAdmin ? "Admin required" : "Add"} onClick={() => setAddRuleOpen(true)}><Plus className="h-4 w-4" /> Add</Button>}
                >
                  <div className="space-y-2">
                    {settlementRules.map((r) => (
                      <div key={r.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="text-sm font-semibold text-slate-900">{r.target}</div>
                              <Pill label={r.scope} tone="neutral" />
                              <Pill label={r.currency} tone="info" />
                            </div>
                            <div className="mt-1 text-sm text-slate-600">{r.note}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" onClick={() => toast({ kind: "info", title: "Edit", message: "Edit rule in Admin Console" })}>
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              disabled={!canAdmin}
                              title={!canAdmin ? "Admin required" : "Delete"}
                              onClick={() => {
                                setSettlementRules((p) => p.filter((x) => x.id !== r.id));
                                toast({ kind: "info", title: "Deleted", message: r.id });
                              }}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}

                    <div className="pt-2 flex flex-wrap items-center gap-2">
                      <Button variant="outline" onClick={() => toast({ kind: "info", title: "Learn", message: "Explain rule precedence" })}>
                        <ChevronRight className="h-4 w-4" /> Learn
                      </Button>
                      <Button variant="outline" onClick={() => toast({ kind: "info", title: "Open FX", message: "Open FX & Multi-Currency" })}>
                        <ChevronRight className="h-4 w-4" /> FX
                      </Button>
                    </div>
                  </div>
                </Section>

                <Section
                  title="Funding requests"
                  subtitle="Requests, approvals, and audit"
                  right={<Pill label={`${fundingRequests.filter((r) => r.status === "Pending").length} pending`} tone={fundingRequests.some((r) => r.status === "Pending") ? "warn" : "neutral"} />}
                >
                  <div className="space-y-2">
                    {fundingRequests.map((r) => (
                      <div key={r.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="text-sm font-semibold text-slate-900">{r.type}</div>
                              <Pill label={r.status} tone={r.status === "Approved" ? "good" : r.status === "Rejected" ? "bad" : "warn"} />
                              <Pill label={r.id} tone="neutral" />
                            </div>
                            <div className="mt-1 text-sm text-slate-600">Requested by {r.requestedBy} • {r.when}</div>
                            <div className="mt-1 text-xs text-slate-500">{r.note}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-slate-900">{r.amountUGX ? formatUGX(r.amountUGX) : "No amount"}</div>
                            <div className="mt-2 flex flex-wrap items-center justify-end gap-2">
                              <Button variant="primary" disabled={!canAdmin || r.status !== "Pending"} title={!canAdmin ? "Admin required" : "Approve"} onClick={() => approveRequest(r.id)}>
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button variant="accent" disabled={!canAdmin || r.status !== "Pending"} title={!canAdmin ? "Admin required" : "Reject"} onClick={() => rejectRequest(r.id)}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    <div className="pt-2 flex flex-wrap items-center gap-2">
                      <Button variant="outline" onClick={() => toast({ kind: "info", title: "Approvals", message: "Open Approvals Inbox" })}>
                        <ChevronRight className="h-4 w-4" /> Approvals inbox
                      </Button>
                      <Button variant="outline" onClick={() => toast({ kind: "info", title: "New request", message: "Create funding request" })}>
                        <ChevronRight className="h-4 w-4" /> New
                      </Button>
                    </div>
                  </div>
                </Section>
              </div>

              <div className="space-y-4 lg:col-span-4">
                <Section
                  title="Enforcement summary"
                  subtitle="Reasons why org wallet may be blocked"
                  right={<Pill label={`${org.enforcement.length} signal(s)`} tone={org.enforcement.some((e) => e.severity === "Blocked") ? "bad" : org.enforcement.some((e) => e.severity === "Warning") ? "warn" : "neutral"} />}
                >
                  <div className="space-y-2">
                    {org.enforcement.map((e, idx) => (
                      <div key={idx} className={cn("rounded-3xl border p-4", e.severity === "Blocked" ? "border-rose-200 bg-rose-50" : e.severity === "Warning" ? "border-amber-200 bg-amber-50" : "border-blue-200 bg-blue-50")}>
                        <div className="flex items-start gap-3">
                          <div className={cn("grid h-10 w-10 place-items-center rounded-2xl", e.severity === "Blocked" ? "bg-white text-rose-700" : e.severity === "Warning" ? "bg-white text-amber-800" : "bg-white text-blue-700")}>
                            {e.severity === "Blocked" ? <Lock className="h-5 w-5" /> : e.severity === "Warning" ? <ShieldAlert className="h-5 w-5" /> : <Info className="h-5 w-5" />}
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="text-sm font-semibold text-slate-900">{e.flag}</div>
                              <Pill label={e.severity} tone={toneForEnforcement(e.severity)} />
                            </div>
                            <div className="mt-1 text-sm text-slate-800">{e.reason}</div>
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <Button variant={e.severity === "Blocked" ? "accent" : "outline"} onClick={() => toast({ kind: "info", title: "Resolve", message: "Open resolution steps" })}>
                                <ChevronRight className="h-4 w-4" /> Resolve
                              </Button>
                              <Button variant="outline" onClick={() => toast({ kind: "info", title: "Policy", message: "Show enforcement policy" })}>
                                <ChevronRight className="h-4 w-4" /> Policy
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {!org.enforcement.length ? <div className="text-sm text-slate-600">No enforcement signals.</div> : null}
                  </div>
                </Section>

                <Section title="Auto top-up" subtitle="Rules and simulation" right={<Pill label={autoRules.some((r) => r.enabled) ? "Enabled" : "Disabled"} tone={autoRules.some((r) => r.enabled) ? "info" : "neutral"} />}>
                  <div className="space-y-2">
                    {autoRules.map((r) => (
                      <div key={r.id} className={cn("rounded-3xl border p-4", r.enabled ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white")}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="text-sm font-semibold text-slate-900">Rule {r.id}</div>
                              <Pill label={r.enabled ? "Enabled" : "Disabled"} tone={r.enabled ? "good" : "neutral"} />
                            </div>
                            <div className="mt-1 text-sm text-slate-700">Trigger below {formatUGX(r.triggerBelowUGX)} then top up {formatUGX(r.topUpAmountUGX)}</div>
                            <div className="mt-1 text-xs text-slate-600">Method: {r.method} • Cooldown: {r.cooldown}</div>
                            <div className="mt-2 text-xs text-slate-600">{r.note}</div>
                          </div>
                          <Button variant={r.enabled ? "primary" : "outline"} disabled={!canAdmin} title={!canAdmin ? "Admin required" : "Toggle"} onClick={() => toggleAuto(r.id)} className="px-3 py-2">
                            {r.enabled ? "ON" : "OFF"}
                          </Button>
                        </div>
                      </div>
                    ))}

                    <div className="rounded-3xl border border-slate-200 bg-white p-4">
                      <div className="text-sm font-semibold text-slate-900">Simulation</div>
                      <div className="mt-2 text-sm text-slate-600">Estimate how often auto top-up would run</div>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <div>
                          <div className="text-xs font-semibold text-slate-600">Spend per period (UGX)</div>
                          <input value={simSpend} onChange={(e) => setSimSpend(e.target.value)} className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-emerald-100" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-600">Days</div>
                          <input value={simDays} onChange={(e) => setSimDays(e.target.value)} className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-emerald-100" />
                        </div>
                      </div>
                      <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                        <div className="flex items-start gap-2">
                          <Info className="mt-0.5 h-4 w-4" />
                          <div>
                            <div>Estimated daily spend: {formatUGX(sim.perDay)}</div>
                            <div className="mt-1">Expected top-ups: {sim.expectedTopUps} per period</div>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Button variant="outline" onClick={() => toast({ kind: "info", title: "Simulate", message: "Run simulation suite" })}>
                          <ChevronRight className="h-4 w-4" /> Scenario suite
                        </Button>
                        <Button variant="outline" onClick={openAdminConsole}>
                          <ChevronRight className="h-4 w-4" /> Advanced
                        </Button>
                      </div>
                    </div>
                  </div>
                </Section>

                <Section title="Risk event feed" subtitle="Signals across funding and enforcement" right={<Pill label={`${riskFeed.length}`} tone="neutral" />}>
                  <div className="space-y-2">
                    {riskFeed.map((e) => (
                      <div key={e.id} className={cn("rounded-3xl border p-4", e.severity === "Critical" ? "border-rose-200 bg-rose-50" : e.severity === "Warning" ? "border-amber-200 bg-amber-50" : "border-blue-200 bg-blue-50")}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="text-sm font-semibold text-slate-900">{e.title}</div>
                              <Pill label={e.severity} tone={riskTone(e.severity)} />
                            </div>
                            <div className="mt-1 text-sm text-slate-800">{e.detail}</div>
                            <div className="mt-2 text-xs text-slate-500">{e.when}</div>
                          </div>
                          <Button variant="outline" onClick={() => toast({ kind: "info", title: "Open", message: e.id })} className="px-3 py-2">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <div className="pt-2">
                      <Button variant="outline" onClick={() => toast({ kind: "info", title: "Export", message: "Export risk feed" })}>
                        <ChevronRight className="h-4 w-4" /> Export
                      </Button>
                    </div>
                  </div>
                </Section>

                <div
                  className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                  style={{ background: "radial-gradient(90% 80% at 10% 0%, rgba(247,127,0,0.20), rgba(255,255,255,0)), radial-gradient(90% 80% at 90% 0%, rgba(3,205,140,0.16), rgba(255,255,255,0))" }}
                >
                  <div className="flex items-start gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-2xl text-white" style={{ background: EVZ.orange }}>
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Premium org wallet management</div>
                      <div className="mt-1 text-sm text-slate-600">Multi-currency, settlement rules, enforcement reasons, and auto top-up simulations.</div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Pill label="Multi-currency" tone="neutral" />
                        <Pill label="Settlement rules" tone="neutral" />
                        <Pill label="Enforcement" tone="neutral" />
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Button variant="outline" onClick={openAdminConsole}>
                          <ChevronRight className="h-4 w-4" /> Admin Console
                        </Button>
                        <Button variant="outline" onClick={() => toast({ kind: "info", title: "Approvals", message: "Open Approvals Inbox" })}>
                          <ChevronRight className="h-4 w-4" /> Approvals
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
                    <BadgeCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Tip</div>
                    <div className="mt-1 text-sm text-slate-600">Expose settlement rules and multi-currency balances in wallet.evzone.app to match your wallet plan.</div>
                  </div>
                </div>
                <Button variant="outline" onClick={() => toast({ kind: "info", title: "Help", message: "Open help" })}>
                  <ChevronRight className="h-4 w-4" /> Help
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add settlement rule modal */}
      <ModalSimple
        open={addRuleOpen}
        title="Add settlement rule"
        subtitle="Set settlement currency by beneficiary, module, or organization"
        onClose={() => setAddRuleOpen(false)}
        footer={
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm text-slate-600"><Info className="h-4 w-4" /> Rules apply in order of specificity.</div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setAddRuleOpen(false)}>Cancel</Button>
              <Button variant="primary" disabled={!canAdmin} title={!canAdmin ? "Admin required" : "Add"} onClick={addSettlementRule}>
                <Check className="h-4 w-4" /> Add
              </Button>
            </div>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="text-sm font-semibold text-slate-900">Rule</div>
            <div className="mt-3 space-y-3">
              <div>
                <div className="text-xs font-semibold text-slate-600">Scope</div>
                <select
                  value={draftScope}
                  onChange={(e) => setDraftScope(e.target.value as any)}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-emerald-100"
                >
                  {["Beneficiary", "Module", "Organization"].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-600">Target</div>
                <input
                  value={draftTarget}
                  onChange={(e) => setDraftTarget(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-emerald-100"
                  placeholder="CorporatePay"
                />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-600">Currency</div>
                <select
                  value={draftCurrency}
                  onChange={(e) => setDraftCurrency(e.target.value as Currency)}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-emerald-100"
                >
                  {(["UGX", "USD", "CNY", "KES"] as Currency[]).map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-600">Note</div>
                <input
                  value={draftNote}
                  onChange={(e) => setDraftNote(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-emerald-100"
                  placeholder="Reason"
                />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-semibold text-slate-900">Preview</div>
            <div className="mt-3 space-y-2 text-sm text-slate-700">
              <div className="flex items-center justify-between"><span className="text-slate-500">Scope</span><span className="font-semibold">{draftScope}</span></div>
              <div className="flex items-center justify-between"><span className="text-slate-500">Target</span><span className="font-semibold">{draftTarget || ""}</span></div>
              <div className="flex items-center justify-between"><span className="text-slate-500">Currency</span><span className="font-semibold">{draftCurrency}</span></div>
              <div className="flex items-center justify-between"><span className="text-slate-500">Note</span><span className="font-semibold">{draftNote}</span></div>
              <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3 text-xs text-slate-600">
                <div className="flex items-start gap-2"><Info className="mt-0.5 h-4 w-4" /><div>Beneficiary rules override module rules. Module rules override org defaults.</div></div>
              </div>
            </div>
          </div>
        </div>
      </ModalSimple>
    </div>
  );
}

function ModalSimple({
  open,
  title,
  subtitle,
  onClose,
  children,
  footer,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => (e.key === "Escape" ? onClose() : null);
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
            className="fixed inset-x-0 top-[10vh] z-50 mx-auto w-[min(980px,calc(100vw-2rem))] overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(2,8,23,0.22)]"
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
            {footer ? <div className="border-t border-slate-200 bg-slate-50 px-5 py-4">{footer}</div> : null}
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
