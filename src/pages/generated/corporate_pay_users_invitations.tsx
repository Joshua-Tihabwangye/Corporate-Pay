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
  Info,
  Mail,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from "lucide-react";

const EVZ = { green: "#03CD8C", orange: "#F77F00" };

type OrgRole = "Viewer" | "Member" | "Approver" | "Finance" | "Admin" | "Owner";

type OrgStatus = "Active" | "Deposit depleted" | "Suspended" | "Needs verification";

type Org = { id: string; name: string; role: OrgRole; status: OrgStatus };

type MemberStatus = "Active" | "Invited" | "Disabled";

type Person = {
  id: string;
  name: string;
  email: string;
  role: OrgRole;
  status: MemberStatus;
  lastActive: string;
  twoFA: boolean;
  trustedDevice: boolean;
  permissions: string[];
};

type Invite = {
  id: string;
  email: string;
  role: OrgRole;
  sentAt: string;
  status: "Pending" | "Accepted" | "Expired";
  note: string;
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
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1", map[tone])}>{label}</span>;
}

function toneForOrgStatus(s: OrgStatus) {
  if (s === "Active") return "good" as const;
  if (s === "Deposit depleted") return "warn" as const;
  if (s === "Needs verification") return "warn" as const;
  return "bad" as const;
}

function toneForMemberStatus(s: MemberStatus) {
  if (s === "Active") return "good" as const;
  if (s === "Invited") return "info" as const;
  return "warn" as const;
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

function permissionTemplate(role: OrgRole) {
  const map: Record<OrgRole, string[]> = {
    Owner: ["All access", "Change policies", "Manage users", "Manage funding"],
    Admin: ["Manage users", "Manage policies", "View reports"],
    Finance: ["Approve payouts", "Export reports", "Reconcile"],
    Approver: ["Approve purchases", "Approve payouts"],
    Member: ["Create requests", "View own items"],
    Viewer: ["View only"],
  };
  return map[role];
}

export default function UsersInvitations() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = (t: Omit<Toast, "id">) => {
    const id = uid("toast");
    setToasts((p) => [{ id, ...t }, ...p].slice(0, 4));
    window.setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 3200);
  };

  const orgs = useMemo<Org[]>(
    () => [
      { id: "org_acme", name: "Acme Group Ltd", role: "Finance", status: "Active" },
      { id: "org_khl", name: "Kampala Holdings", role: "Member", status: "Deposit depleted" },
    ],
    []
  );

  const [orgId, setOrgId] = useState(orgs[0].id);
  const org = useMemo(() => orgs.find((o) => o.id === orgId) || orgs[0], [orgs, orgId]);
  const canAdmin = useMemo(() => ["Owner", "Admin", "Finance"].includes(org.role), [org.role]);

  const membersSeed = useMemo<Person[]>(
    () => [
      {
        id: "U-1",
        name: "Ronald Isabirye",
        email: "ronald@acme.ug",
        role: "Owner",
        status: "Active",
        lastActive: "Now",
        twoFA: true,
        trustedDevice: true,
        permissions: permissionTemplate("Owner"),
      },
      {
        id: "U-2",
        name: "Finance Desk",
        email: "finance@acme.ug",
        role: "Finance",
        status: "Active",
        lastActive: "12m ago",
        twoFA: true,
        trustedDevice: true,
        permissions: permissionTemplate("Finance"),
      },
      {
        id: "U-3",
        name: "Procurement",
        email: "procurement@acme.ug",
        role: "Approver",
        status: "Active",
        lastActive: "2h ago",
        twoFA: false,
        trustedDevice: false,
        permissions: permissionTemplate("Approver"),
      },
      {
        id: "U-4",
        name: "Auditor",
        email: "audit@acme.ug",
        role: "Viewer",
        status: "Disabled",
        lastActive: "1w ago",
        twoFA: false,
        trustedDevice: false,
        permissions: permissionTemplate("Viewer"),
      },
    ],
    []
  );

  const invitesSeed = useMemo<Invite[]>(
    () => [
      { id: "I-1", email: "ops@acme.ug", role: "Admin", sentAt: "Today 09:05", status: "Pending", note: "Operations admin" },
      { id: "I-2", email: "viewer@acme.ug", role: "Viewer", sentAt: "Yesterday", status: "Expired", note: "Read-only" },
    ],
    []
  );

  const [members, setMembers] = useState<Person[]>(membersSeed);
  const [invites, setInvites] = useState<Invite[]>(invitesSeed);

  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | OrgRole>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | MemberStatus>("ALL");

  const filteredMembers = useMemo(() => {
    const s = q.trim().toLowerCase();
    return members
      .filter((m) => (!s ? true : `${m.name} ${m.email}`.toLowerCase().includes(s)))
      .filter((m) => (roleFilter === "ALL" ? true : m.role === roleFilter))
      .filter((m) => (statusFilter === "ALL" ? true : m.status === statusFilter));
  }, [members, q, roleFilter, statusFilter]);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<OrgRole>("Member");
  const [inviteNote, setInviteNote] = useState("Team member");

  const [detail, setDetail] = useState<Person | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const openAdmin = () => toast({ kind: "info", title: "Open Admin Console", message: "Deep link to Admin for full management." });

  const sendInvite = () => {
    if (!inviteEmail.trim() || !inviteEmail.includes("@")) {
      toast({ kind: "warn", title: "Enter valid email" });
      return;
    }
    const id = `I-${Math.floor(10 + Math.random() * 90)}`;
    setInvites((p) => [{ id, email: inviteEmail.trim(), role: inviteRole, sentAt: "Just now", status: "Pending", note: inviteNote }, ...p]);
    setInviteOpen(false);
    setInviteEmail("");
    toast({ kind: "success", title: "Invite sent", message: `${inviteEmail} as ${inviteRole}` });
  };

  const acceptInviteSim = (id: string) => {
    const inv = invites.find((i) => i.id === id);
    if (!inv) return;
    setInvites((p) => p.map((x) => (x.id === id ? { ...x, status: "Accepted" } : x)));
    setMembers((p) => [
      {
        id: `U-${Math.floor(10 + Math.random() * 90)}`,
        name: inv.email.split("@")[0].replace(/\./g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        email: inv.email,
        role: inv.role,
        status: "Active",
        lastActive: "Just now",
        twoFA: false,
        trustedDevice: false,
        permissions: permissionTemplate(inv.role),
      },
      ...p,
    ]);
    toast({ kind: "success", title: "Invite accepted", message: inv.email });
  };

  const toggleDisable = (id: string) => {
    setMembers((p) => p.map((m) => (m.id === id ? { ...m, status: m.status === "Disabled" ? "Active" : "Disabled" } : m)));
    toast({ kind: "success", title: "Status updated" });
  };

  const openPerson = (p: Person) => {
    setDetail(p);
    setDetailOpen(true);
  };

  const accessReview = useMemo(
    () => ({ last: "Oct 10", dueInDays: 12, next: "Feb 02", note: "Quarterly access review recommended" }),
    []
  );

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ kind: "success", title: "Copied" });
    } catch {
      toast({ kind: "warn", title: "Copy failed", message: "Clipboard access blocked." });
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "radial-gradient(90% 60% at 50% 0%, rgba(3,205,140,0.18), rgba(255,255,255,0))" }}>
      <ToastStack toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((x) => x.id !== id))} />

      <div className="mx-auto max-w-[1180px] px-4 py-5 md:px-6">
        <div className="rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(2,8,23,0.10)]">
          <div className="border-b border-slate-200 px-4 py-4 md:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl text-white" style={{ background: EVZ.green }}>
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">Users & Invitations</div>
                  <div className="mt-1 text-xs text-slate-500">Team directory, invite flows, and access reviews</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Pill label={`Org: ${org.name}`} tone="info" />
                    <Pill label={`Role: ${org.role}`} tone={canAdmin ? "info" : "neutral"} />
                    <Pill label={org.status} tone={toneForOrgStatus(org.status)} />
                    <Pill label={`${filteredMembers.length} members`} tone="neutral" />
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
                <Button
                  variant="primary"
                  disabled={!canAdmin}
                  title={!canAdmin ? "Admin role required" : "Invite"}
                  onClick={() => setInviteOpen(true)}
                >
                  <Plus className="h-4 w-4" /> Invite
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
                    <div className="text-sm font-semibold text-slate-900">Limited access</div>
                    <div className="mt-1 text-sm text-amber-900">You can view the team directory, but invites and role edits require Admin or Finance role.</div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Button variant="accent" onClick={() => toast({ kind: "info", title: "Request access", message: "Open access request flow" })}>
                        <ChevronRight className="h-4 w-4" /> Request access
                      </Button>
                      <Button variant="outline" onClick={() => toast({ kind: "info", title: "Contact Admin", message: "Show org Admin contacts" })}>
                        <ChevronRight className="h-4 w-4" /> Contact Admin
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="bg-slate-50 px-4 py-5 md:px-6">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              <div className="space-y-4 lg:col-span-8">
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Team directory</div>
                      <div className="mt-1 text-xs text-slate-500">Status, last active, and permission boundaries</div>
                    </div>
                    <div className="flex flex-col gap-2 md:flex-row md:items-center">
                      <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5">
                        <Search className="h-4 w-4 text-slate-500" />
                        <input
                          value={q}
                          onChange={(e) => setQ(e.target.value)}
                          placeholder="Search name or email"
                          className="w-[min(320px,70vw)] bg-transparent text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none"
                        />
                      </div>
                      <div className="min-w-[160px]">
                        <Select value={roleFilter} onChange={(v) => setRoleFilter(v as any)} options={["ALL", "Owner", "Admin", "Finance", "Approver", "Member", "Viewer"]} />
                      </div>
                      <div className="min-w-[160px]">
                        <Select value={statusFilter} onChange={(v) => setStatusFilter(v as any)} options={["ALL", "Active", "Invited", "Disabled"]} />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    {filteredMembers.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => openPerson(m)}
                        className="w-full rounded-3xl border border-slate-200 bg-white p-4 text-left hover:bg-slate-50"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="text-sm font-semibold text-slate-900">{m.name}</div>
                              <Pill label={m.role} tone={m.role === "Owner" || m.role === "Admin" ? "info" : "neutral"} />
                              <Pill label={m.status} tone={toneForMemberStatus(m.status)} />
                              <Pill label={m.twoFA ? "2FA" : "No 2FA"} tone={m.twoFA ? "good" : "warn"} />
                              <Pill label={m.trustedDevice ? "Trusted" : "Untrusted"} tone={m.trustedDevice ? "good" : "neutral"} />
                            </div>
                            <div className="mt-1 text-sm text-slate-600">{m.email}</div>
                            <div className="mt-2 text-xs text-slate-500">Last active: {m.lastActive}</div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Button variant="outline" className="px-3 py-2" onClick={() => copy(m.email)}>
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" className="px-3 py-2" onClick={() => toast({ kind: "info", title: "Open profile", message: m.id })}>
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {m.permissions.slice(0, 3).map((p) => (
                            <Pill key={p} label={p} tone="neutral" />
                          ))}
                          {m.permissions.length > 3 ? <Pill label={`+${m.permissions.length - 3} more`} tone="neutral" /> : null}
                        </div>
                      </button>
                    ))}

                    {!filteredMembers.length ? (
                      <div className="rounded-3xl border border-slate-200 bg-white p-4 text-sm text-slate-600">No members match filters.</div>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Invitations</div>
                      <div className="mt-1 text-xs text-slate-500">Pending invites and access reviews</div>
                    </div>
                    <Pill label={`${invites.length}`} tone="neutral" />
                  </div>

                  <div className="mt-4 space-y-2">
                    {invites.map((i) => (
                      <div key={i.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="text-sm font-semibold text-slate-900">{i.email}</div>
                              <Pill label={i.role} tone="neutral" />
                              <Pill label={i.status} tone={i.status === "Accepted" ? "good" : i.status === "Pending" ? "warn" : "neutral"} />
                            </div>
                            <div className="mt-1 text-sm text-slate-600">{i.note}</div>
                            <div className="mt-2 text-xs text-slate-500">Sent: {i.sentAt}</div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Button variant="outline" className="px-3 py-2" onClick={() => copy(i.email)}>
                              <Copy className="h-4 w-4" />
                            </Button>
                            {i.status === "Pending" ? (
                              <Button
                                variant="primary"
                                disabled={!canAdmin}
                                title={!canAdmin ? "Admin role required" : "Simulate accept"}
                                onClick={() => acceptInviteSim(i.id)}
                              >
                                <Check className="h-4 w-4" /> Accept
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ))}

                    <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-start gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-slate-700">
                          <Info className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-900">Access review</div>
                          <div className="mt-1 text-sm text-slate-600">Last: {accessReview.last} • Next: {accessReview.next} • Due in {accessReview.dueInDays} days</div>
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <Button variant="outline" onClick={openAdmin}>
                              <ChevronRight className="h-4 w-4" /> Start review
                            </Button>
                            <Button variant="outline" onClick={() => toast({ kind: "info", title: "Export", message: "Export access review report" })}>
                              <ChevronRight className="h-4 w-4" /> Export
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 lg:col-span-4">
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="text-sm font-semibold text-slate-900">Permission boundaries</div>
                  <div className="mt-1 text-xs text-slate-500">What each role can do</div>
                  <div className="mt-4 space-y-2">
                    {(["Owner", "Admin", "Finance", "Approver", "Member", "Viewer"] as OrgRole[]).map((r) => (
                      <div key={r} className="rounded-3xl border border-slate-200 bg-white p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="text-sm font-semibold text-slate-900">{r}</div>
                              <Pill label={`${permissionTemplate(r).length} permissions`} tone="neutral" />
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              {permissionTemplate(r).slice(0, 2).map((p) => (
                                <Pill key={p} label={p} tone="neutral" />
                              ))}
                              {permissionTemplate(r).length > 2 ? <Pill label="More" tone="neutral" /> : null}
                            </div>
                          </div>
                          <Button variant="outline" className="px-3 py-2" onClick={openAdmin}>
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
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
                      <div className="text-sm font-semibold text-slate-900">Admin console deep links</div>
                      <div className="mt-1 text-sm text-slate-600">This page is a fast view. Full management happens in Admin Console.</div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Button variant="outline" onClick={openAdmin}>
                          <ChevronRight className="h-4 w-4" /> Open Admin
                        </Button>
                        <Button variant="outline" onClick={() => toast({ kind: "info", title: "Audit", message: "Open audit log" })}>
                          <ChevronRight className="h-4 w-4" /> Audit
                        </Button>
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
                    <div className="mt-1 text-sm text-slate-600">Encourage 2FA and trusted devices for Finance and Approver roles.</div>
                  </div>
                </div>
                <Button variant="primary" disabled={!canAdmin} title={!canAdmin ? "Admin role required" : "Invite"} onClick={() => setInviteOpen(true)}>
                  <Plus className="h-4 w-4" /> Invite
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Invite modal */}
      <Modal
        open={inviteOpen}
        title="Invite user"
        subtitle={`${org.name} • Role-based permissions`}
        onClose={() => setInviteOpen(false)}
        footer={
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Info className="h-4 w-4" /> Invites are audited.
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={sendInvite}>
                <Mail className="h-4 w-4" /> Send
              </Button>
            </div>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="text-sm font-semibold text-slate-900">Invite</div>
            <div className="mt-3 space-y-3">
              <div>
                <div className="text-xs font-semibold text-slate-600">Email</div>
                <div className="mt-1"><Input value={inviteEmail} onChange={setInviteEmail} placeholder="name@company.com" /></div>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-600">Role</div>
                <div className="mt-1"><Select value={inviteRole} onChange={(v) => setInviteRole(v as OrgRole)} options={["Owner", "Admin", "Finance", "Approver", "Member", "Viewer"]} /></div>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-600">Note</div>
                <div className="mt-1"><Input value={inviteNote} onChange={setInviteNote} placeholder="Reason" /></div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                <div className="flex items-start gap-2">
                  <Info className="mt-0.5 h-4 w-4" />
                  <div>New users should enable 2FA for payouts and approvals.</div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-semibold text-slate-900">Permission preview</div>
            <div className="mt-2 text-sm text-slate-600">Role: {inviteRole}</div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {permissionTemplate(inviteRole).map((p) => (
                <Pill key={p} label={p} tone="neutral" />
              ))}
            </div>
            <div className="mt-4">
              <Button variant="outline" onClick={openAdmin}>
                <ChevronRight className="h-4 w-4" /> Advanced permissions
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Person detail */}
      <Modal
        open={detailOpen}
        title={detail ? detail.name : "Member"}
        subtitle={detail ? `${detail.email} • ${detail.role}` : ""}
        onClose={() => setDetailOpen(false)}
        footer={
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Info className="h-4 w-4" /> Role changes are audited.
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setDetailOpen(false)}>Close</Button>
              {detail ? (
                <Button variant="primary" disabled={!canAdmin} title={!canAdmin ? "Admin role required" : "Toggle"} onClick={() => toggleDisable(detail.id)}>
                  <ChevronRight className="h-4 w-4" /> {detail.status === "Disabled" ? "Enable" : "Disable"}
                </Button>
              ) : null}
            </div>
          </div>
        }
      >
        {detail ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Pill label={detail.role} tone={detail.role === "Owner" || detail.role === "Admin" ? "info" : "neutral"} />
                <Pill label={detail.status} tone={toneForMemberStatus(detail.status)} />
                <Pill label={detail.twoFA ? "2FA" : "No 2FA"} tone={detail.twoFA ? "good" : "warn"} />
                <Pill label={detail.trustedDevice ? "Trusted" : "Untrusted"} tone={detail.trustedDevice ? "good" : "neutral"} />
              </div>
              <div className="mt-3 text-sm text-slate-700">
                <div className="font-semibold text-slate-900">Last active</div>
                <div className="mt-1">{detail.lastActive}</div>
              </div>
              <div className="mt-4">
                <div className="text-sm font-semibold text-slate-900">Permissions</div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {detail.permissions.map((p) => (
                    <Pill key={p} label={p} tone="neutral" />
                  ))}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={() => copy(detail.email)}>
                  <Copy className="h-4 w-4" /> Copy email
                </Button>
                <Button variant="outline" onClick={openAdmin}>
                  <ChevronRight className="h-4 w-4" /> Edit role
                </Button>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-semibold text-slate-900">Recommendations</div>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                <li className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-400" />Enable 2FA for payouts and approvals</li>
                <li className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-400" />Trust devices used frequently</li>
                <li className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-400" />Review access quarterly</li>
              </ul>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={() => toast({ kind: "info", title: "Security", message: "Open Security & Trust" })}>
                  <ChevronRight className="h-4 w-4" /> Security
                </Button>
                <Button variant="outline" onClick={() => toast({ kind: "info", title: "Audit", message: "Open audit log" })}>
                  <ChevronRight className="h-4 w-4" /> Audit
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
