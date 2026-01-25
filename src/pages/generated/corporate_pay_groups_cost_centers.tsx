import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BadgeCheck,
  Building2,
  Check,
  ChevronRight,
  Copy,
  Info,
  Layers,
  Plus,
  ShieldCheck,
  Sparkles,
  Tag,
  Users,
  X,
} from "lucide-react";

const EVZ = { green: "#03CD8C", orange: "#F77F00" };

type OrgRole = "Viewer" | "Member" | "Approver" | "Finance" | "Admin" | "Owner";

type OrgStatus = "Active" | "Deposit depleted" | "Suspended" | "Needs verification";

type Org = { id: string; name: string; role: OrgRole; status: OrgStatus };

type Group = {
  id: string;
  name: string;
  description: string;
  defaultCostCenterId?: string;
  membersCount: number;
  visibility: "All" | "Group only" | "Managers only";
  taggingEnforced: boolean;
};

type CostCenter = {
  id: string;
  code: string;
  name: string;
  defaultFor?: string; // group id
  spendLimitUGX?: number;
  tagsRequired: boolean;
};

type Mapping = {
  id: string;
  rule: string;
  targetCostCenterId: string;
  default: boolean;
  note: string;
};

type Toast = { id: string; title: string; message?: string; kind: "success" | "warn" | "error" | "info" };

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}
function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}
function formatUGX(amount: number) {
  const num = Math.abs(amount).toLocaleString(undefined, { maximumFractionDigits: 0 });
  const sign = amount < 0 ? "-" : "";
  return `${sign}UGX ${num}`;
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

function toneForOrgStatus(s: OrgStatus) {
  if (s === "Active") return "good" as const;
  if (s === "Deposit depleted") return "warn" as const;
  if (s === "Needs verification") return "warn" as const;
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
  variant?: "primary" | "accent" | "outline" | "ghost";
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
          >
            <div className="flex items-start gap-3">
              <div className={cn("mt-0.5 grid h-9 w-9 place-items-center rounded-2xl", t.kind === "success" ? "bg-emerald-50 text-emerald-700" : t.kind === "warn" ? "bg-amber-50 text-amber-800" : t.kind === "error" ? "bg-rose-50 text-rose-700" : "bg-blue-50 text-blue-700")}>
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

function Modal({
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

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-100"
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

function Input({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-100"
    />
  );
}

export default function GroupsCostCenters() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = (t: Omit<Toast, "id">) => {
    const id = uid("toast");
    setToasts((p) => [{ id, ...t }, ...p].slice(0, 4));
    window.setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 3200);
  };

  const orgs = useMemo<Org[]>(
    () => [
      { id: "org_acme", name: "Acme Group Ltd", role: "Admin", status: "Active" },
      { id: "org_khl", name: "Kampala Holdings", role: "Viewer", status: "Deposit depleted" },
    ],
    []
  );

  const [orgId, setOrgId] = useState(orgs[0].id);
  const org = useMemo(() => orgs.find((o) => o.id === orgId) || orgs[0], [orgs, orgId]);

  const canAdmin = useMemo(() => ["Owner", "Admin", "Finance"].includes(org.role), [org.role]);

  const [groups, setGroups] = useState<Group[]>([
    {
      id: "G-OPS",
      name: "Operations",
      description: "Daily operations spend",
      defaultCostCenterId: "CC-OPS",
      membersCount: 12,
      visibility: "Managers only",
      taggingEnforced: true,
    },
    {
      id: "G-PROC",
      name: "Procurement",
      description: "Purchases and vendor payments",
      defaultCostCenterId: "CC-PROC",
      membersCount: 8,
      visibility: "Group only",
      taggingEnforced: true,
    },
    {
      id: "G-MKT",
      name: "Marketing",
      description: "Campaigns and Shoppable Adz",
      defaultCostCenterId: "CC-MKT",
      membersCount: 6,
      visibility: "All",
      taggingEnforced: false,
    },
  ]);

  const [costCenters, setCostCenters] = useState<CostCenter[]>([
    { id: "CC-OPS", code: "OPS-001", name: "Operations", defaultFor: "G-OPS", spendLimitUGX: 3000000, tagsRequired: true },
    { id: "CC-PROC", code: "PRC-001", name: "Procurement", defaultFor: "G-PROC", spendLimitUGX: 5000000, tagsRequired: true },
    { id: "CC-MKT", code: "MKT-001", name: "Marketing", defaultFor: "G-MKT", spendLimitUGX: 2000000, tagsRequired: false },
    { id: "CC-RND", code: "RND-001", name: "R&D", spendLimitUGX: 2500000, tagsRequired: true },
  ]);

  const [mappings, setMappings] = useState<Mapping[]>([
    { id: "M-1", rule: "Module: CorporatePay", targetCostCenterId: "CC-PROC", default: true, note: "Corporate purchases map to procurement" },
    { id: "M-2", rule: "Module: Shoppable Adz", targetCostCenterId: "CC-MKT", default: true, note: "Ad spend maps to marketing" },
    { id: "M-3", rule: "Vendor: EV Charging", targetCostCenterId: "CC-OPS", default: false, note: "Charging ops spend" },
  ]);

  const [activeGroupId, setActiveGroupId] = useState<string>(groups[0].id);
  const activeGroup = useMemo(() => groups.find((g) => g.id === activeGroupId) || groups[0], [groups, activeGroupId]);

  const activeCC = useMemo(() => costCenters.find((c) => c.id === activeGroup.defaultCostCenterId) || null, [costCenters, activeGroup.defaultCostCenterId]);

  const [addOpen, setAddOpen] = useState(false);
  const [addType, setAddType] = useState<"Group" | "Cost Center" | "Mapping">("Group");

  const [draftName, setDraftName] = useState("");
  const [draftDesc, setDraftDesc] = useState("New item");
  const [draftCode, setDraftCode] = useState("NEW-001");
  const [draftLimit, setDraftLimit] = useState("1000000");
  const [draftRule, setDraftRule] = useState("Module: E-Commerce");
  const [draftTarget, setDraftTarget] = useState(costCenters[0].id);

  const openAdmin = () => toast({ kind: "info", title: "Open Admin Console", message: "Deep link to full cost center editor." });

  const addItem = () => {
    if (!draftName.trim()) {
      toast({ kind: "warn", title: "Name required" });
      return;
    }

    if (addType === "Group") {
      const id = `G-${draftName.trim().slice(0, 3).toUpperCase()}-${Math.floor(Math.random() * 100)}`;
      setGroups((p) => [
        {
          id,
          name: draftName.trim(),
          description: draftDesc.trim(),
          defaultCostCenterId: costCenters[0]?.id,
          membersCount: 0,
          visibility: "Group only",
          taggingEnforced: true,
        },
        ...p,
      ]);
      toast({ kind: "success", title: "Group created", message: draftName.trim() });
    }

    if (addType === "Cost Center") {
      const id = `CC-${draftCode.trim().replace(/\s+/g, "-")}`;
      const limit = Number(draftLimit.replace(/[^0-9]/g, "")) || 0;
      setCostCenters((p) => [
        {
          id,
          code: draftCode.trim(),
          name: draftName.trim(),
          spendLimitUGX: limit,
          tagsRequired: true,
        },
        ...p,
      ]);
      toast({ kind: "success", title: "Cost center created", message: draftCode.trim() });
    }

    if (addType === "Mapping") {
      const id = `M-${Math.floor(10 + Math.random() * 90)}`;
      setMappings((p) => [
        {
          id,
          rule: draftRule.trim(),
          targetCostCenterId: draftTarget,
          default: false,
          note: draftDesc.trim(),
        },
        ...p,
      ]);
      toast({ kind: "success", title: "Mapping created" });
    }

    setDraftName("");
    setDraftDesc("New item");
    setAddOpen(false);
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ kind: "success", title: "Copied" });
    } catch {
      toast({ kind: "warn", title: "Copy failed", message: "Clipboard access blocked." });
    }
  };

  const resolveMappingTargetName = (id: string) => costCenters.find((c) => c.id === id)?.name || id;

  const setDefaultMapping = (id: string) => {
    setMappings((p) => p.map((m) => ({ ...m, default: m.id === id ? true : m.default && m.rule !== (p.find((x) => x.id === id)?.rule ?? "") ? m.default : m.default })));
    toast({ kind: "success", title: "Default mapping updated" });
  };

  const toggleEnforceTags = (groupId: string) => {
    setGroups((p) => p.map((g) => (g.id === groupId ? { ...g, taggingEnforced: !g.taggingEnforced } : g)));
    toast({ kind: "success", title: "Tag enforcement updated" });
  };

  return (
    <div className="min-h-screen" style={{ background: "radial-gradient(90% 60% at 50% 0%, rgba(3,205,140,0.18), rgba(255,255,255,0))" }}>
      <ToastStack toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((x) => x.id !== id))} />

      <div className="mx-auto max-w-[95%] px-4 py-5 md:px-6">
        <div className="rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(2,8,23,0.10)]">
          <div className="border-b border-slate-200 px-4 py-4 md:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl text-white" style={{ background: EVZ.green }}>
                  <Layers className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">Groups & Cost Centers</div>
                  <div className="mt-1 text-xs text-slate-500">Spend segmentation, defaults, mapping, and tagging enforcement</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Pill label={`Org: ${org.name}`} tone="info" />
                    <Pill label={`Role: ${org.role}`} tone={canAdmin ? "info" : "neutral"} />
                    <Pill label={org.status} tone={toneForOrgStatus(org.status)} />
                    <Pill label={`Groups: ${groups.length}`} tone="neutral" />
                    <Pill label={`Cost centers: ${costCenters.length}`} tone="neutral" />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="min-w-[220px]">
                  <Select value={orgId} onChange={setOrgId} options={orgs.map((o) => o.id)} />
                </div>
                <Button variant="outline" onClick={() => toast({ kind: "info", title: "Switch", message: "Open wallet switcher" })}>
                  <ChevronRight className="h-4 w-4" /> Switch
                </Button>
                <Button variant="outline" onClick={openAdmin}>
                  <ChevronRight className="h-4 w-4" /> Admin Console
                </Button>
                <Button variant="primary" disabled={!canAdmin} title={!canAdmin ? "Admin role required" : "Add"} onClick={() => setAddOpen(true)}>
                  <Plus className="h-4 w-4" /> Add
                </Button>
              </div>
            </div>

            {!canAdmin ? (
              <div className="mt-4 rounded-3xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-amber-800">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">View-only access</div>
                    <div className="mt-1 text-sm text-amber-900">Editing groups, mappings, and enforcement requires Admin or Finance role.</div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="bg-slate-50 px-4 py-5 md:px-6">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              <div className="space-y-4 lg:col-span-8">
                <Section
                  title="Groups"
                  subtitle="Visibility rules and tagging enforcement"
                  right={<Pill label={`Active: ${activeGroup.name}`} tone="info" />}
                >
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      {groups.map((g) => (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => setActiveGroupId(g.id)}
                          className={cn(
                            "w-full rounded-3xl border bg-white p-4 text-left shadow-sm hover:bg-slate-50",
                            activeGroupId === g.id ? "border-emerald-200 ring-2 ring-emerald-100" : "border-slate-200"
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="text-sm font-semibold text-slate-900">{g.name}</div>
                                <Pill label={g.visibility} tone="neutral" />
                                <Pill label={g.taggingEnforced ? "Tag required" : "Tag optional"} tone={g.taggingEnforced ? "warn" : "neutral"} />
                              </div>
                              <div className="mt-1 text-sm text-slate-600">{g.description}</div>
                              <div className="mt-2 text-xs text-slate-500">Members: {g.membersCount}</div>
                            </div>
                            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-50 text-slate-700">
                              <Users className="h-5 w-5" />
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white p-4">
                      <div className="text-sm font-semibold text-slate-900">Group details</div>
                      <div className="mt-2 text-sm text-slate-600">{activeGroup.description}</div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Pill label={`Visibility: ${activeGroup.visibility}`} tone="neutral" />
                        <Pill label={`Members: ${activeGroup.membersCount}`} tone="neutral" />
                      </div>

                      <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                        <div className="flex items-start gap-2">
                          <Info className="mt-0.5 h-4 w-4" />
                          <div>
                            If tagging is enforced, purchases and payouts require cost center and tags before approval.
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Button variant={activeGroup.taggingEnforced ? "primary" : "outline"} disabled={!canAdmin} title={!canAdmin ? "Admin required" : "Toggle"} onClick={() => toggleEnforceTags(activeGroup.id)}>
                          <Tag className="h-4 w-4" /> {activeGroup.taggingEnforced ? "Enforced" : "Enforce tags"}
                        </Button>
                        <Button variant="outline" onClick={openAdmin}>
                          <ChevronRight className="h-4 w-4" /> Manage members
                        </Button>
                      </div>
                    </div>
                  </div>
                </Section>

                <Section
                  title="Cost centers"
                  subtitle="Defaults, spend limits, and tag requirements"
                  right={<Pill label={activeCC ? `Default: ${activeCC.code}` : "No default"} tone={activeCC ? "info" : "warn"} />}
                >
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      {costCenters.map((c) => (
                        <div key={c.id} className={cn("rounded-3xl border border-slate-200 bg-white p-4", c.id === activeGroup.defaultCostCenterId ? "ring-2 ring-emerald-100 border-emerald-200" : "")}> 
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="text-sm font-semibold text-slate-900">{c.code}</div>
                                <Pill label={c.name} tone="neutral" />
                                {c.id === activeGroup.defaultCostCenterId ? <Pill label="Default" tone="info" /> : null}
                                <Pill label={c.tagsRequired ? "Tags required" : "Tags optional"} tone={c.tagsRequired ? "warn" : "neutral"} />
                              </div>
                              {typeof c.spendLimitUGX === "number" ? (
                                <div className="mt-1 text-sm text-slate-600">Limit: {formatUGX(c.spendLimitUGX)}</div>
                              ) : (
                                <div className="mt-1 text-sm text-slate-600">No limit configured</div>
                              )}
                            </div>
                            <Button variant="outline" onClick={openAdmin} className="px-3 py-2">
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white p-4">
                      <div className="text-sm font-semibold text-slate-900">Cost center preview</div>
                      {activeCC ? (
                        <>
                          <div className="mt-2 text-sm text-slate-600">{activeCC.name} ({activeCC.code})</div>
                          {typeof activeCC.spendLimitUGX === "number" ? (
                            <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3">
                              <div className="text-xs font-semibold text-slate-500">Spend limit</div>
                              <div className="mt-1 text-sm font-semibold text-slate-900">{formatUGX(activeCC.spendLimitUGX)}</div>
                              <div className="mt-2 text-xs text-slate-500">Tag requirement: {activeCC.tagsRequired ? "Required" : "Optional"}</div>
                            </div>
                          ) : null}
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <Button variant="outline" onClick={() => toast({ kind: "info", title: "Set default", message: "This would set default for group." })} disabled={!canAdmin}>
                              <ChevronRight className="h-4 w-4" /> Set default
                            </Button>
                            <Button variant="outline" onClick={openAdmin}>
                              <ChevronRight className="h-4 w-4" /> Edit
                            </Button>
                          </div>
                        </>
                      ) : (
                        <div className="mt-2 text-sm text-slate-600">No default cost center assigned for this group.</div>
                      )}
                    </div>
                  </div>
                </Section>

                <Section
                  title="Mapping rules"
                  subtitle="Automatic mapping from module/vendor to cost center"
                  right={<Pill label={`${mappings.length} rule(s)`} tone="neutral" />}
                >
                  <div className="space-y-2">
                    {mappings.map((m) => (
                      <div key={m.id} className={cn("rounded-3xl border border-slate-200 bg-white p-4", m.default ? "ring-2 ring-emerald-100 border-emerald-200" : "")}> 
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="text-sm font-semibold text-slate-900">{m.rule}</div>
                              <Pill label={`→ ${resolveMappingTargetName(m.targetCostCenterId)}`} tone="neutral" />
                              {m.default ? <Pill label="Default" tone="info" /> : null}
                            </div>
                            <div className="mt-1 text-sm text-slate-600">{m.note}</div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Button variant="outline" className="px-3 py-2" onClick={() => setDefaultMapping(m.id)} disabled={!canAdmin} title={!canAdmin ? "Admin required" : "Set default"}>
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" className="px-3 py-2" onClick={openAdmin}>
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}

                    <div className="pt-2 flex flex-wrap items-center gap-2">
                      <Button variant="primary" disabled={!canAdmin} title={!canAdmin ? "Admin required" : "Add"} onClick={() => { setAddType("Mapping"); setAddOpen(true); }}>
                        <Plus className="h-4 w-4" /> Add mapping
                      </Button>
                      <Button variant="outline" onClick={() => toast({ kind: "info", title: "Simulate", message: "This would simulate mapping for a checkout." })}>
                        <ChevronRight className="h-4 w-4" /> Simulate
                      </Button>
                      <Button variant="outline" onClick={openAdmin}>
                        <ChevronRight className="h-4 w-4" /> Advanced
                      </Button>
                    </div>
                  </div>
                </Section>
              </div>

              <div className="space-y-4 lg:col-span-4">
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="text-sm font-semibold text-slate-900">Tagging enforcement</div>
                  <div className="mt-1 text-xs text-slate-500">Visibility and compliance on spend</div>
                  <div className="mt-4 space-y-2">
                    <div className={cn("rounded-3xl border p-4", activeGroup.taggingEnforced ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50")}>
                      <div className="flex items-start gap-3">
                        <div className={cn("grid h-10 w-10 place-items-center rounded-2xl", activeGroup.taggingEnforced ? "bg-white text-emerald-700" : "bg-white text-amber-800")}>
                          {activeGroup.taggingEnforced ? <BadgeCheck className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-900">{activeGroup.taggingEnforced ? "Enforced" : "Not enforced"}</div>
                          <div className="mt-1 text-sm text-slate-700">Cost center tags {activeGroup.taggingEnforced ? "required" : "optional"} for this group.</div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
                      <div className="flex items-start gap-2">
                        <Info className="mt-0.5 h-4 w-4" />
                        <div>
                          Policies can block out-of-policy purchases if cost center is missing. Approval workflows can request attestation.
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button variant="outline" onClick={() => toast({ kind: "info", title: "Policy builder", message: "Deep link to policy builder" })}>
                        <ChevronRight className="h-4 w-4" /> Policy builder
                      </Button>
                      <Button variant="outline" onClick={() => toast({ kind: "info", title: "Approvals", message: "Deep link to approval builder" })}>
                        <ChevronRight className="h-4 w-4" /> Approval builder
                      </Button>
                    </div>
                  </div>
                </div>

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
                      <div className="text-sm font-semibold text-slate-900">Premium segmentation</div>
                      <div className="mt-1 text-sm text-slate-600">Cost centers create clear accountability across modules.</div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Pill label="Defaults" tone="neutral" />
                        <Pill label="Mappings" tone="neutral" />
                        <Pill label="Enforcement" tone="neutral" />
                      </div>
                      <div className="mt-3">
                        <Button variant="outline" onClick={openAdmin}>
                          <ChevronRight className="h-4 w-4" /> Admin Console
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
                    <div className="mt-1 text-sm text-slate-600">Use mapping rules to auto-apply correct cost centers and reduce approval delays.</div>
                  </div>
                </div>
                <Button variant="primary" disabled={!canAdmin} title={!canAdmin ? "Admin required" : "Add"} onClick={() => setAddOpen(true)}>
                  <Plus className="h-4 w-4" /> Add
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={addOpen}
        title={`Add ${addType}`}
        subtitle="Create groups, cost centers, or mapping rules"
        onClose={() => setAddOpen(false)}
        footer={
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm text-slate-600"><Info className="h-4 w-4" /> Changes are audited.</div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={addItem}><Check className="h-4 w-4" /> Create</Button>
            </div>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="text-sm font-semibold text-slate-900">Type</div>
            <div className="mt-3">
              <Select value={addType} onChange={(v) => setAddType(v as any)} options={["Group", "Cost Center", "Mapping"]} />
            </div>

            <div className="mt-3 space-y-3">
              <div>
                <div className="text-xs font-semibold text-slate-600">Name</div>
                <div className="mt-1"><Input value={draftName} onChange={setDraftName} placeholder={addType === "Cost Center" ? "Marketing" : "Operations"} /></div>
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-600">Description / Note</div>
                <div className="mt-1"><Input value={draftDesc} onChange={setDraftDesc} placeholder="Description" /></div>
              </div>

              {addType === "Cost Center" ? (
                <>
                  <div>
                    <div className="text-xs font-semibold text-slate-600">Code</div>
                    <div className="mt-1"><Input value={draftCode} onChange={setDraftCode} placeholder="MKT-002" /></div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-600">Spend limit (UGX)</div>
                    <div className="mt-1"><Input value={draftLimit} onChange={setDraftLimit} placeholder="1000000" /></div>
                  </div>
                </>
              ) : null}

              {addType === "Mapping" ? (
                <>
                  <div>
                    <div className="text-xs font-semibold text-slate-600">Rule</div>
                    <div className="mt-1"><Input value={draftRule} onChange={setDraftRule} placeholder="Module: CorporatePay" /></div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-600">Target cost center</div>
                    <div className="mt-1"><Select value={draftTarget} onChange={setDraftTarget} options={costCenters.map((c) => c.id)} /></div>
                  </div>
                </>
              ) : null}

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                <div className="flex items-start gap-2"><Info className="mt-0.5 h-4 w-4" /><div>Use Policy Builder to enforce required cost centers for approvals.</div></div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-semibold text-slate-900">Preview</div>
            <div className="mt-3 space-y-2 text-sm text-slate-700">
              <div className="flex items-center justify-between"><span className="text-slate-500">Type</span><span className="font-semibold">{addType}</span></div>
              <div className="flex items-center justify-between"><span className="text-slate-500">Name</span><span className="font-semibold">{draftName || "—"}</span></div>
              <div className="flex items-center justify-between"><span className="text-slate-500">Note</span><span className="font-semibold">{draftDesc}</span></div>
              {addType === "Cost Center" ? (
                <>
                  <div className="flex items-center justify-between"><span className="text-slate-500">Code</span><span className="font-semibold">{draftCode}</span></div>
                  <div className="flex items-center justify-between"><span className="text-slate-500">Limit</span><span className="font-semibold">UGX {draftLimit}</span></div>
                </>
              ) : null}
              {addType === "Mapping" ? (
                <>
                  <div className="flex items-center justify-between"><span className="text-slate-500">Rule</span><span className="font-semibold">{draftRule}</span></div>
                  <div className="flex items-center justify-between"><span className="text-slate-500">Target</span><span className="font-semibold">{resolveMappingTargetName(draftTarget)}</span></div>
                </>
              ) : null}
            </div>
            <div className="mt-4">
              <Button variant="outline" onClick={openAdmin}><ChevronRight className="h-4 w-4" /> Advanced</Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
