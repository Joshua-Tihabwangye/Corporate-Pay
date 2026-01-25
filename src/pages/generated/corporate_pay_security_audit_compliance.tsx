import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BadgeCheck,
  Ban,
  Check,
  ChevronRight,
  Clock,
  Copy,
  Download,
  FileText,
  Info,
  KeyRound,
  Lock,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserCheck,
  X,
} from "lucide-react";

const EVZ = { green: "#03CD8C", orange: "#F77F00" };

type OrgRole = "Viewer" | "Member" | "Approver" | "Finance" | "Admin" | "Owner";

type Org = { id: string; name: string; role: OrgRole };

type Retention = { id: string; dataType: "Transactions" | "Approvals" | "Invoices" | "Webhooks" | "Audit logs"; period: string; legalHold: boolean; note: string };

type AuditEvent = { id: string; when: string; actor: string; action: string; target: string; outcome: "Success" | "Blocked"; why: string };

type LoginEvent = { id: string; when: string; device: string; location: string; ip: string; result: "Success" | "Failed"; risk: "Low" | "Medium" | "High"; reason?: string };

type Device = { id: string; label: string; device: "Android" | "iPhone" | "Windows" | "Mac"; trusted: boolean; lastSeen: string; risk: "Low" | "Medium" | "High" };

type KeyLog = { id: string; keyId: string; when: string; actor: string; action: "Created" | "Rotated" | "Revoked"; note: string };

type DualControl = { id: string; policy: string; enabled: boolean; note: string };

type ForensicExport = { id: string; createdAt: string; scope: string; status: "Queued" | "Running" | "Ready" | "Failed"; includes: string[] };

type Toast = { id: string; title: string; message?: string; kind: "success" | "warn" | "error" | "info" };

function cn(...p: Array<string | false | null | undefined>) {
  return p.filter(Boolean).join(" ");
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
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1", map[tone])}>{label}</span>;
}

function toneForRisk(r: "Low" | "Medium" | "High") {
  if (r === "High") return "bad" as const;
  if (r === "Medium") return "warn" as const;
  return "good" as const;
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

function Toggle({ label, desc, value, onChange }: { label: string; desc: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-sm font-semibold text-slate-900">{label}</div>
            <Pill label={value ? "ON" : "OFF"} tone={value ? "good" : "neutral"} />
          </div>
          <div className="mt-1 text-sm text-slate-600">{desc}</div>
        </div>
        <Button variant={value ? "primary" : "outline"} className="px-3 py-2" onClick={() => onChange(!value)}>
          {value ? "Enabled" : "Enable"}
        </Button>
      </div>
    </div>
  );
}

export default function SecurityAuditCompliance() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = (t: Omit<Toast, "id">) => {
    const id = uid("toast");
    setToasts((p) => [{ id, ...t }, ...p].slice(0, 4));
    window.setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 3200);
  };

  const orgs = useMemo<Org[]>(
    () => [
      { id: "org_acme", name: "Acme Group Ltd", role: "Admin" },
      { id: "org_khl", name: "Kampala Holdings", role: "Viewer" },
    ],
    []
  );

  const [orgId, setOrgId] = useState(orgs[0].id);
  const org = useMemo(() => orgs.find((o) => o.id === orgId) || orgs[0], [orgs, orgId]);
  const canAdmin = useMemo(() => ["Owner", "Admin"].includes(org.role), [org.role]);

  const [tab, setTab] = useState<"Audit" | "Devices" | "Logins" | "Retention" | "Dual-control" | "Keys" | "Forensics">("Audit");

  const [audit] = useState<AuditEvent[]>([
    { id: "A-9001", when: "Today 09:10", actor: "Admin", action: "Changed policy", target: "Approval threshold", outcome: "Success", why: "Dual-control satisfied" },
    { id: "A-9002", when: "Today 08:55", actor: "Finance", action: "Exported statement", target: "Invoices Jan", outcome: "Success", why: "Finance scope" },
    { id: "A-9003", when: "Yesterday", actor: "Viewer", action: "Attempted key rotate", target: "KEY-1", outcome: "Blocked", why: "Permission boundary" },
  ]);

  const [devices, setDevices] = useState<Device[]>([
    { id: "D-1", label: "Chrome on Windows", device: "Windows", trusted: true, lastSeen: "Now", risk: "Low" },
    { id: "D-2", label: "Android phone", device: "Android", trusted: true, lastSeen: "2h ago", risk: "Low" },
    { id: "D-3", label: "iPhone", device: "iPhone", trusted: false, lastSeen: "1w ago", risk: "High" },
  ]);

  const [logins] = useState<LoginEvent[]>([
    { id: "L-1", when: "Today 09:12", device: "Chrome (Windows)", location: "Kampala, UG", ip: "197.157.xxx.xxx", result: "Success", risk: "Low" },
    { id: "L-2", when: "Yesterday 21:40", device: "Android", location: "Kampala, UG", ip: "102.89.xxx.xxx", result: "Success", risk: "Low" },
    { id: "L-3", when: "Last week", device: "iPhone", location: "Nairobi, KE", ip: "196.201.xxx.xxx", result: "Success", risk: "High", reason: "New geo" },
    { id: "L-4", when: "Last week", device: "Safari", location: "Unknown", ip: "45.12.xxx.xxx", result: "Failed", risk: "Medium", reason: "Wrong OTP" },
  ]);

  const [retention, setRetention] = useState<Retention[]>([
    { id: "R-1", dataType: "Transactions", period: "7 years", legalHold: false, note: "Finance retention" },
    { id: "R-2", dataType: "Approvals", period: "7 years", legalHold: true, note: "Legal hold active" },
    { id: "R-3", dataType: "Audit logs", period: "2 years", legalHold: false, note: "Security" },
    { id: "R-4", dataType: "Webhooks", period: "90 days", legalHold: false, note: "Delivery logs" },
  ]);

  const [dual, setDual] = useState<DualControl[]>([
    { id: "DC-1", policy: "Beneficiary edits", enabled: true, note: "Require 2-person approval" },
    { id: "DC-2", policy: "Key rotation", enabled: true, note: "Require Owner + Admin" },
    { id: "DC-3", policy: "Forensics export", enabled: true, note: "Require Admin" },
  ]);

  const [keyLogs, setKeyLogs] = useState<KeyLog[]>([
    { id: "K-1", keyId: "KEY-1", when: "Last month", actor: "Owner", action: "Created", note: "Prod key" },
    { id: "K-2", keyId: "KEY-1", when: "Yesterday", actor: "Admin", action: "Rotated", note: "Routine rotation" },
    { id: "K-3", keyId: "KEY-2", when: "Last week", actor: "Admin", action: "Created", note: "Sandbox key" },
  ]);

  const [forensics, setForensics] = useState<ForensicExport[]>([
    { id: "FZ-101", createdAt: "Today", scope: "Approvals Inbox • 30D", status: "Ready", includes: ["receipts", "audit", "provider reports", "hashes"] },
    { id: "FZ-102", createdAt: "Yesterday", scope: "Payout Operations • Batch run", status: "Running", includes: ["queue", "references", "reconciliation"] },
  ]);

  const [q, setQ] = useState("");
  const filteredAudit = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return audit;
    return audit.filter((a) => `${a.id} ${a.actor} ${a.action} ${a.target} ${a.why}`.toLowerCase().includes(s));
  }, [audit, q]);

  const riskScore = useMemo(() => {
    const high = devices.filter((d) => d.risk === "High").length;
    const med = devices.filter((d) => d.risk === "Medium").length;
    const score = Math.min(100, 35 + high * 30 + med * 15);
    return { score, level: score >= 70 ? "High" : score >= 45 ? "Medium" : "Low" };
  }, [devices]);

  const toggleTrust = (id: string) => {
    setDevices((p) => p.map((d) => (d.id === id ? { ...d, trusted: !d.trusted } : d)));
    toast({ kind: "success", title: "Device trust updated" });
  };

  const revokeDevice = (id: string) => {
    setDevices((p) => p.filter((d) => d.id !== id));
    toast({ kind: "info", title: "Device revoked" });
  };

  const toggleRetentionHold = (id: string) => {
    if (!canAdmin) {
      toast({ kind: "warn", title: "Admin required" });
      return;
    }
    setRetention((p) => p.map((r) => (r.id === id ? { ...r, legalHold: !r.legalHold } : r)));
    toast({ kind: "success", title: "Retention updated" });
  };

  const toggleDual = (id: string) => {
    if (!canAdmin) {
      toast({ kind: "warn", title: "Admin required" });
      return;
    }
    setDual((p) => p.map((d) => (d.id === id ? { ...d, enabled: !d.enabled } : d)));
    toast({ kind: "success", title: "Dual-control updated" });
  };

  const rotateKey = (keyId: string) => {
    if (!canAdmin) {
      toast({ kind: "warn", title: "Admin required" });
      return;
    }
    const log: KeyLog = { id: uid("K"), keyId, when: "Just now", actor: "Admin", action: "Rotated", note: "Manual rotation" };
    setKeyLogs((p) => [log, ...p]);
    toast({ kind: "success", title: "Key rotated", message: keyId });
  };

  const makeForensics = () => {
    if (!canAdmin) {
      toast({ kind: "warn", title: "Admin required" });
      return;
    }
    const id = `FZ-${Math.floor(200 + Math.random() * 900)}`;
    setForensics((p) => [{ id, createdAt: "Just now", scope: "Custom export", status: "Queued", includes: ["audit", "hashes"] }, ...p]);
    toast({ kind: "success", title: "Forensics export queued", message: id });
    window.setTimeout(() => setForensics((p) => p.map((x) => (x.id === id ? { ...x, status: "Running" } : x))), 900);
    window.setTimeout(() => setForensics((p) => p.map((x) => (x.id === id ? { ...x, status: "Ready" } : x))), 2100);
  };

  const downloadForensics = (id: string) => toast({ kind: "info", title: "Download", message: `Would download ${id}` });

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ kind: "success", title: "Copied" });
    } catch {
      toast({ kind: "warn", title: "Copy failed" });
    }
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
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">Security, Audit & Compliance</div>
                  <div className="mt-1 text-xs text-slate-500">Audit logs, device trust, login events, retention, dual-control, forensics, key rotation</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Pill label={`Org: ${org.name}`} tone="info" />
                    <Pill label={`Role: ${org.role}`} tone={canAdmin ? "info" : "neutral"} />
                    <Pill label={`Risk: ${riskScore.level} (${riskScore.score})`} tone={toneForRisk(riskScore.level as any)} />
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="min-w-[260px]">
                  <Select value={orgId} onChange={setOrgId} options={orgs.map((o) => ({ value: o.id, label: o.name }))} />
                </div>
                <Button variant="outline" onClick={() => toast({ kind: "info", title: "Admin Console", message: "Deep link to admin security module" })}>
                  <ChevronRight className="h-4 w-4" /> Admin Console
                </Button>
                <Button variant="primary" onClick={() => toast({ kind: "success", title: "Refreshed" })}>
                  <RefreshCcw className="h-4 w-4" /> Refresh
                </Button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {(
                [
                  ["Audit", "Audit logs"],
                  ["Devices", "Device trust"],
                  ["Logins", "Login events"],
                  ["Retention", "Retention"],
                  ["Dual-control", "Dual-control"],
                  ["Keys", "Key rotation"],
                  ["Forensics", "Forensics"],
                ] as Array<[typeof tab, string]>
              ).map(([k, label]) => (
                <Button key={k} variant={tab === k ? "primary" : "outline"} className="px-3 py-2" onClick={() => setTab(k)}>
                  {label}
                </Button>
              ))}
            </div>

            {!canAdmin ? (
              <div className="mt-4 rounded-3xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-amber-800"><Lock className="h-5 w-5" /></div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Limited access</div>
                    <div className="mt-1 text-sm text-amber-900">Admin/Owner required for retention policies, dual-control, key rotation, and forensics exports.</div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="bg-slate-50 px-4 py-5 md:px-6">
            {tab === "Audit" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="space-y-4 lg:col-span-8">
                  <Section
                    title="Audit logs"
                    subtitle="Search, filter and export audit events"
                    right={<Pill label={`${filteredAudit.length} event(s)`} tone={filteredAudit.length ? "neutral" : "warn"} />}
                  >
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5">
                        <Info className="h-4 w-4 text-slate-500" />
                        <input
                          value={q}
                          onChange={(e) => setQ(e.target.value)}
                          placeholder="Search actor, action, target"
                          className="w-[min(520px,70vw)] bg-transparent text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none"
                        />
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button variant="outline" onClick={() => toast({ kind: "info", title: "Export", message: "Export audit CSV/JSON" })}>
                          <ChevronRight className="h-4 w-4" /> Export
                        </Button>
                        <Button variant="outline" onClick={() => toast({ kind: "info", title: "Legal hold", message: "Open retention tab" })}>
                          <ChevronRight className="h-4 w-4" /> Legal hold
                        </Button>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      {filteredAudit.map((a) => (
                        <div key={a.id} className={cn("rounded-3xl border p-4", a.outcome === "Blocked" ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white")}>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="text-sm font-semibold text-slate-900">{a.action}</div>
                                <Pill label={a.outcome} tone={a.outcome === "Blocked" ? "warn" : "good"} />
                                <Pill label={a.actor} tone="neutral" />
                                <Pill label={a.id} tone="neutral" />
                              </div>
                              <div className="mt-1 text-sm text-slate-700">{a.target}</div>
                              <div className="mt-2 text-xs text-slate-500">{a.when} • {a.why}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant="outline" className="px-3 py-2" onClick={() => copy(a.id)}><Copy className="h-4 w-4" /></Button>
                              <Button variant="outline" className="px-3 py-2" onClick={() => toast({ kind: "info", title: "Open", message: a.id })}><ChevronRight className="h-4 w-4" /></Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Section>
                </div>

                <div className="space-y-4 lg:col-span-4">
                  <SummaryCard title="Compliance posture" subtitle="Key protections enabled" bullets={["Audit logs retained", "Dual-control enabled", "Forensics exports supported", "Key rotation tracked"]} />
                  <QuickActions canAdmin={canAdmin} onForensics={makeForensics} onRotate={() => rotateKey("KEY-1")} />
                </div>
              </div>
            ) : null}

            {tab === "Devices" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="space-y-4 lg:col-span-8">
                  <Section title="Device trust" subtitle="Trust list and revoke sessions" right={<Pill label={`${devices.length} devices`} tone="neutral" />}>
                    <div className="space-y-2">
                      {devices.map((d) => (
                        <div key={d.id} className={cn("rounded-3xl border p-4", d.trusted ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white")}>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="text-sm font-semibold text-slate-900">{d.label}</div>
                                <Pill label={d.device} tone="neutral" />
                                <Pill label={d.trusted ? "Trusted" : "Untrusted"} tone={d.trusted ? "good" : "neutral"} />
                                <Pill label={`Risk ${d.risk}`} tone={toneForRisk(d.risk)} />
                              </div>
                              <div className="mt-1 text-xs text-slate-600">Last seen: {d.lastSeen}</div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Button variant={d.trusted ? "outline" : "primary"} onClick={() => toggleTrust(d.id)}>
                                {d.trusted ? "Untrust" : "Trust"}
                              </Button>
                              <Button variant="outline" onClick={() => revokeDevice(d.id)}>
                                <Trash2 className="h-4 w-4" /> Revoke
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}

                      <div className="pt-2 flex flex-wrap items-center gap-2">
                        <Button variant="outline" onClick={() => toast({ kind: "info", title: "Revoke others", message: "This would revoke other sessions." })}>
                          <ChevronRight className="h-4 w-4" /> Revoke others
                        </Button>
                        <Button variant="outline" onClick={() => toast({ kind: "info", title: "Export", message: "Export device trust list" })}>
                          <ChevronRight className="h-4 w-4" /> Export
                        </Button>
                      </div>
                    </div>
                  </Section>
                </div>
                <div className="space-y-4 lg:col-span-4">
                  <SummaryCard title="Device guidance" subtitle="Reduce takeover risk" bullets={["Trust only known devices", "Revoke high-risk devices", "Enable step-up for payouts", "Monitor geo anomalies"]} />
                </div>
              </div>
            ) : null}

            {tab === "Logins" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="space-y-4 lg:col-span-8">
                  <Section title="Login events" subtitle="Risk scoring and anomalies" right={<Pill label={`${logins.length} events`} tone="neutral" />}>
                    <div className="space-y-2">
                      {logins.map((l) => (
                        <div key={l.id} className={cn("rounded-3xl border p-4", l.risk === "High" ? "border-rose-200 bg-rose-50" : l.risk === "Medium" ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white")}>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="text-sm font-semibold text-slate-900">{l.device}</div>
                                <Pill label={l.result} tone={l.result === "Success" ? "good" : "warn"} />
                                <Pill label={`Risk ${l.risk}`} tone={toneForRisk(l.risk)} />
                                <Pill label={l.id} tone="neutral" />
                              </div>
                              <div className="mt-1 text-sm text-slate-700">{l.location} • IP {l.ip}</div>
                              <div className="mt-2 text-xs text-slate-500">{l.when}{l.reason ? ` • ${l.reason}` : ""}</div>
                            </div>
                            <Button variant="outline" className="px-3 py-2" onClick={() => toast({ kind: "info", title: "Investigate", message: l.id })}>
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Section>
                </div>
                <div className="space-y-4 lg:col-span-4">
                  <SummaryCard title="Response playbook" subtitle="When risk is high" bullets={["Lock withdrawals", "Revoke sessions", "Rotate keys", "Start incident"]} />
                  <QuickActions canAdmin={canAdmin} onForensics={makeForensics} onRotate={() => rotateKey("KEY-1")} />
                </div>
              </div>
            ) : null}

            {tab === "Retention" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="space-y-4 lg:col-span-8">
                  <Section title="Retention policies" subtitle="Retention periods and legal holds" right={<Pill label={`${retention.filter((r) => r.legalHold).length} hold(s)`} tone={retention.some((r) => r.legalHold) ? "warn" : "neutral"} />}>
                    <div className="space-y-2">
                      {retention.map((r) => (
                        <div key={r.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="text-sm font-semibold text-slate-900">{r.dataType}</div>
                                <Pill label={r.period} tone="neutral" />
                                <Pill label={r.legalHold ? "Legal hold" : "No hold"} tone={r.legalHold ? "warn" : "neutral"} />
                                <Pill label={r.id} tone="neutral" />
                              </div>
                              <div className="mt-1 text-sm text-slate-600">{r.note}</div>
                            </div>
                            <Button variant={r.legalHold ? "accent" : "outline"} disabled={!canAdmin} title={!canAdmin ? "Admin required" : "Toggle legal hold"} onClick={() => toggleRetentionHold(r.id)}>
                              {r.legalHold ? "Release" : "Hold"}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                      <div className="flex items-start gap-2"><Info className="mt-0.5 h-4 w-4" /><div>Legal holds prevent deletion of records even after retention period.</div></div>
                    </div>
                  </Section>
                </div>
                <div className="space-y-4 lg:col-span-4">
                  <SummaryCard title="Retention guidance" subtitle="Audit-ready controls" bullets={["Keep finance records 7 years", "Enable legal holds for disputes", "Export forensics when needed", "Log deletions and changes"]} />
                </div>
              </div>
            ) : null}

            {tab === "Dual-control" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="space-y-4 lg:col-span-8">
                  <Section title="Dual-control policies" subtitle="Maker-checker for sensitive actions" right={<Pill label={`${dual.filter((d) => d.enabled).length}/${dual.length} enabled`} tone="info" />}>
                    <div className="space-y-2">
                      {dual.map((d) => (
                        <div key={d.id} className={cn("rounded-3xl border p-4", d.enabled ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white")}>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="text-sm font-semibold text-slate-900">{d.policy}</div>
                                <Pill label={d.enabled ? "Enabled" : "Disabled"} tone={d.enabled ? "good" : "neutral"} />
                                <Pill label={d.id} tone="neutral" />
                              </div>
                              <div className="mt-1 text-sm text-slate-700">{d.note}</div>
                            </div>
                            <Button variant={d.enabled ? "primary" : "outline"} disabled={!canAdmin} title={!canAdmin ? "Admin required" : "Toggle"} onClick={() => toggleDual(d.id)}>
                              {d.enabled ? "ON" : "OFF"}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3">
                      <Button variant="outline" onClick={() => toast({ kind: "info", title: "Approvals", message: "Open Approval Workflow Builder" })}>
                        <ChevronRight className="h-4 w-4" /> Workflow builder
                      </Button>
                    </div>
                  </Section>
                </div>
                <div className="space-y-4 lg:col-span-4">
                  <SummaryCard title="Why dual-control" subtitle="Risk reduction" bullets={["Prevents payout redirection", "Protects key rotation", "Improves auditability", "Reduces insider risk"]} />
                </div>
              </div>
            ) : null}

            {tab === "Keys" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="space-y-4 lg:col-span-8">
                  <Section title="Key rotation" subtitle="Access logs and rotation events" right={<Pill label={`${keyLogs.length} events`} tone="neutral" />}>
                    <div className="space-y-2">
                      {keyLogs.map((k) => (
                        <div key={k.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="text-sm font-semibold text-slate-900">{k.keyId}</div>
                                <Pill label={k.action} tone={k.action === "Revoked" ? "warn" : k.action === "Rotated" ? "info" : "neutral"} />
                                <Pill label={k.actor} tone="neutral" />
                                <Pill label={k.id} tone="neutral" />
                              </div>
                              <div className="mt-1 text-sm text-slate-600">{k.note}</div>
                              <div className="mt-1 text-xs text-slate-500">{k.when}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant="outline" className="px-3 py-2" onClick={() => copy(k.id)}><Copy className="h-4 w-4" /></Button>
                              <Button variant="primary" disabled={!canAdmin} title={!canAdmin ? "Admin required" : "Rotate"} onClick={() => rotateKey(k.keyId)}>
                                <KeyRound className="h-4 w-4" /> Rotate
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                      <div className="flex items-start gap-2"><Info className="mt-0.5 h-4 w-4" /><div>Key rotation events should also appear in audit logs.</div></div>
                    </div>
                  </Section>
                </div>
                <div className="space-y-4 lg:col-span-4">
                  <SummaryCard title="Rotation policy" subtitle="Recommended" bullets={["Rotate prod keys monthly", "Rotate webhook secrets quarterly", "Revoke unused keys", "Log all accesses"]} />
                </div>
              </div>
            ) : null}

            {tab === "Forensics" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="space-y-4 lg:col-span-8">
                  <Section title="Forensic exports" subtitle="Dual-control and retention-friendly" right={<Button variant="primary" disabled={!canAdmin} onClick={makeForensics}><Sparkles className="h-4 w-4" /> New export</Button>}>
                    <div className="space-y-2">
                      {forensics.map((f) => (
                        <div key={f.id} className={cn("rounded-3xl border p-4", f.status === "Ready" ? "border-emerald-200 bg-emerald-50" : f.status === "Failed" ? "border-rose-200 bg-rose-50" : "border-slate-200 bg-white")}>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="text-sm font-semibold text-slate-900">{f.id}</div>
                                <Pill label={f.status} tone={f.status === "Ready" ? "good" : f.status === "Failed" ? "bad" : "neutral"} />
                                <Pill label={f.scope} tone="neutral" />
                              </div>
                              <div className="mt-1 text-xs text-slate-500">{f.createdAt}</div>
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                {f.includes.map((x) => (
                                  <Pill key={x} label={x} tone="neutral" />
                                ))}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant={f.status === "Ready" ? "primary" : "outline"} disabled={f.status !== "Ready"} onClick={() => downloadForensics(f.id)}>
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" onClick={() => toast({ kind: "info", title: "Open", message: f.id })}>
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Section>
                </div>
                <div className="space-y-4 lg:col-span-4">
                  <SummaryCard title="Forensics content" subtitle="What to include" bullets={["Receipts + references", "Provider reports", "Reconciliation matches", "Hashes + audit"]} />
                </div>
              </div>
            ) : null}

            <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-50 text-slate-700"><Info className="h-5 w-5" /></div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Tip</div>
                    <div className="mt-1 text-sm text-slate-600">Treat compliance features as product. Show policy reasons everywhere, and keep exports forensic-ready.</div>
                  </div>
                </div>
                <Button variant="outline" onClick={() => toast({ kind: "info", title: "Support", message: "Open Support & Admin Tools" })}>
                  <ChevronRight className="h-4 w-4" /> Support
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ title, subtitle, bullets }: { title: string; subtitle: string; bullets: string[] }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-sm font-semibold text-slate-900">{title}</div>
      <div className="mt-1 text-xs text-slate-500">{subtitle}</div>
      <ul className="mt-3 space-y-2 text-sm text-slate-700">
        {bullets.map((b) => (
          <li key={b} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-400" />{b}</li>
        ))}
      </ul>
    </div>
  );
}

function QuickActions({ canAdmin, onForensics, onRotate }: { canAdmin: boolean; onForensics: () => void; onRotate: () => void }) {
  return (
    <div
      className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
      style={{ background: "radial-gradient(90% 80% at 10% 0%, rgba(247,127,0,0.20), rgba(255,255,255,0)), radial-gradient(90% 80% at 90% 0%, rgba(3,205,140,0.16), rgba(255,255,255,0))" }}
    >
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl text-white" style={{ background: EVZ.orange }}>
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <div className="text-sm font-semibold text-slate-900">Quick actions</div>
          <div className="mt-1 text-sm text-slate-600">High impact admin actions</div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button variant="primary" disabled={!canAdmin} title={!canAdmin ? "Admin required" : "Forensics"} onClick={onForensics}>
              <ChevronRight className="h-4 w-4" /> Forensics
            </Button>
            <Button variant="outline" disabled={!canAdmin} title={!canAdmin ? "Admin required" : "Rotate"} onClick={onRotate}>
              <KeyRound className="h-4 w-4" /> Rotate key
            </Button>
            <Button variant="outline" onClick={() => {}}>
              <ChevronRight className="h-4 w-4" /> Incidents
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
