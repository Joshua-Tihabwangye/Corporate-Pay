import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ROUTES } from "../../routes/paths";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  BadgeCheck,
  BarChart3,
  Bell,
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  FileText,
  Gauge,
  Globe,
  HelpCircle,
  LayoutDashboard,
  Leaf,
  Lock,
  LogOut,
  Mail,
  Menu,
  MessagesSquare,
  Plus,
  Search,
  Settings,
  Shield,
  Sparkles,
  Ticket,
  Users,
  Wallet,
  X,
  AlertTriangle,
  Check,
  Headphones,
  Moon,
  Sun,
} from "lucide-react";

import { consolePages } from "../pageRegistry";

const EVZ = {
  green: "#03CD8C",
  orange: "#F77F00",
  light: "#F2F2F2",
};

type Role =
  | "Org Owner"
  | "Org Admin"
  | "Manager"
  | "Accountant"
  | "Approver"
  | "Travel Coordinator"
  | "Employee"
  | "EVzone Support";

type AccountHealth = "Active" | "Past due" | "Suspended";

type Tier = "Core" | "Premium" | "Phase 2";

type Notice = {
  id: string;
  title: string;
  message: string;
  when: string;
  tone: "info" | "warning" | "danger" | "success";
  channel?: "Email" | "WhatsApp" | "WeChat" | "SMS";
};

type NavItem = { id: string; label: string; icon: React.ReactNode; badge?: string; children?: NavItem[] };

type PageDef = {
  id: string;
  title: string;
  subtitle: string;
  tier: Tier;
  roles: Role[];
  keywords: string[];
  status?: "Ready" | "Planned";
  bullets?: string[];
};

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function useMedia(query: string) {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  });
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    onChange();
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, [query]);
  return matches;
}

function Pill({ label, tone }: { label: string; tone: "good" | "warn" | "bad" | "neutral" | "info" }) {
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
    <button type="button" title={title} disabled={disabled} onClick={onClick} style={style} className={cn(base, variants[variant], disabled && "cursor-not-allowed opacity-60", className)}>
      {children}
    </button>
  );
}

function ChannelChip({ channel }: { channel: NonNullable<Notice["channel"]> }) {
  const map: Record<string, { bg: string; fg: string; icon: React.ReactNode }> = {
    Email: { bg: "bg-slate-50", fg: "text-slate-700", icon: <Mail className="h-3.5 w-3.5" /> },
    WhatsApp: { bg: "bg-emerald-50", fg: "text-emerald-700", icon: <MessagesSquare className="h-3.5 w-3.5" /> },
    WeChat: { bg: "bg-green-50", fg: "text-green-700", icon: <MessagesSquare className="h-3.5 w-3.5" /> },
    SMS: { bg: "bg-blue-50", fg: "text-blue-700", icon: <MessagesSquare className="h-3.5 w-3.5" /> },
  };
  const s = map[channel];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-semibold", s.bg, s.fg)}>
      {s.icon}
      {channel}
    </span>
  );
}

function Dropdown({
  open,
  onClose,
  anchorRef,
  children,
  width = 360,
}: {
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement>;
  children: React.ReactNode;
  width?: number;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const rect = anchorRef.current?.getBoundingClientRect();
  const right = rect ? Math.max(16, window.innerWidth - rect.right) : 16;
  const top = rect ? rect.bottom + 10 : 54;

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div className="fixed inset-0 z-40" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className="fixed z-50 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_24px_70px_rgba(2,8,23,0.18)]"
            style={{ width, right, top }}
            role="menu"
          >
            {children}
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}

function Sidebar({
  nav,
  active,
  onSelect,
  collapsed,
  theme,
  onToggleTheme,
}: {
  nav: NavItem[];
  active: string;
  onSelect: (id: string) => void;
  collapsed: boolean;
  theme: "light" | "dark";
  onToggleTheme: () => void;
}) {
  const bg = theme === "dark" ? "bg-slate-900" : "bg-slate-50";
  const borderColor = theme === "dark" ? "border-slate-800" : "border-slate-200";
  const textPrimary = theme === "dark" ? "text-white" : "text-slate-900";
  const textSecondary = theme === "dark" ? "text-slate-400" : "text-slate-500";

  return (
    <div className={cn("flex h-full flex-col", collapsed ? "px-1" : "px-2", bg)}>
      {/* Logo */}
      <div className={cn("flex items-center gap-2 border-b py-3", borderColor, collapsed ? "justify-center px-1" : "px-2")}>
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl text-white" style={{ background: EVZ.green }}>
          <Sparkles className="h-4 w-4" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className={cn("truncate text-xs font-bold", textPrimary)}>CorporatePay</div>
            <div className={cn("truncate text-[10px]", textSecondary)}>Console</div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-2">
        <div className="space-y-0.5">
          {nav.map((item) => (
            <NavRow key={item.id} item={item} active={active} onSelect={onSelect} collapsed={collapsed} theme={theme} />
          ))}
        </div>
      </div>

      {/* Bottom section: Theme toggle + Help */}
      <div className={cn("border-t py-2", borderColor)}>
        {/* Theme toggle */}
        <button
          onClick={onToggleTheme}
          className={cn(
            "flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left transition-colors",
            theme === "dark" ? "text-slate-300 hover:bg-slate-800" : "text-slate-700 hover:bg-slate-100",
            collapsed && "justify-center"
          )}
          title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
        >
          {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          {!collapsed && <span className="text-xs font-medium">{theme === "light" ? "Dark mode" : "Light mode"}</span>}
        </button>

        {/* Help */}
        <button
          onClick={() => onSelect("support_tools")}
          className={cn(
            "flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left transition-colors",
            theme === "dark" ? "text-slate-300 hover:bg-slate-800" : "text-slate-700 hover:bg-slate-100",
            collapsed && "justify-center"
          )}
        >
          <HelpCircle className="h-4 w-4" />
          {!collapsed && <span className="text-xs font-medium">Help & Support</span>}
        </button>
      </div>
    </div>
  );
}

function NavRow({
  item,
  active,
  onSelect,
  collapsed,
  theme,
}: {
  item: NavItem;
  active: string;
  onSelect: (id: string) => void;
  collapsed: boolean;
  theme: "light" | "dark";
}) {
  const isActive = active === item.id || item.children?.some((c) => c.id === active);
  const isDirectActive = active === item.id;
  const hasChildren = !!item.children?.length;
  const [open, setOpen] = useState(isActive);

  const textColor = isDirectActive
    ? "text-white"
    : theme === "dark"
      ? "text-slate-300 hover:bg-slate-800"
      : "text-slate-700 hover:bg-slate-100";
  const iconColor = isDirectActive ? "text-white" : theme === "dark" ? "text-slate-400" : "text-slate-500";

  return (
    <div>
      <button
        onClick={() => {
          if (hasChildren) setOpen((v) => !v);
          else onSelect(item.id);
        }}
        className={cn(
          "flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left text-xs font-medium transition-all hover-lift",
          textColor,
          collapsed && "justify-center px-1"
        )}
        style={isDirectActive ? { background: EVZ.green } : undefined}
      >
        <div className={cn("shrink-0", iconColor)}>{item.icon}</div>
        {!collapsed && (
          <div className="min-w-0 flex-1 truncate">{item.label}</div>
        )}
        {!collapsed && item.badge && (
          <span className={cn(
            "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
            isDirectActive ? "bg-white/20 text-white" : theme === "dark" ? "bg-slate-700 text-slate-300" : "bg-slate-200 text-slate-600"
          )}>
            {item.badge}
          </span>
        )}
        {!collapsed && hasChildren && (
          <ChevronDown className={cn("h-3 w-3 transition-transform", open ? "rotate-0" : "-rotate-90")} />
        )}
      </button>

      {!collapsed && hasChildren && (
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.12 }}
              className="ml-4 mt-0.5 space-y-0.5 border-l border-slate-200 pl-2 dark:border-slate-700"
            >
              {item.children!.map((c) => (
                <button
                  key={c.id}
                  onClick={() => onSelect(c.id)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-2 py-1 text-left text-xs transition-colors hover-lift",
                    active === c.id
                      ? "bg-emerald-50 font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      : theme === "dark" ? "text-slate-400 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-100"
                  )}
                >
                  <span className="truncate">{c.label}</span>
                  {c.badge && (
                    <span className={cn(
                      "ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                      theme === "dark" ? "bg-slate-700 text-slate-300" : "bg-slate-200 text-slate-600"
                    )}>
                      {c.badge}
                    </span>
                  )}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
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
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onClose: () => void;
  footer?: React.ReactNode;
  maxW?: string;
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
              <button className="rounded-2xl p-2 text-slate-600 hover:bg-slate-100" onClick={onClose} aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto px-5 py-4">{children}</div>
            {footer ? <div className="border-t border-slate-200 px-5 py-4">{footer}</div> : null}
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
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

function QuickStat({ icon, title, value, sub }: { icon: React.ReactNode; title: string; value: string; sub: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold text-slate-500">{title}</div>
          <div className="mt-1 text-xl font-semibold text-slate-900">{value}</div>
          <div className="mt-1 text-xs text-slate-600">{sub}</div>
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">{icon}</div>
      </div>
    </div>
  );
}

function PlaceholderPage({
  title,
  subtitle,
  tier,
  bullets,
  onPrimary,
  primaryLabel,
}: {
  title: string;
  subtitle: string;
  tier: Tier;
  bullets?: string[];
  onPrimary?: () => void;
  primaryLabel?: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-xs font-semibold text-slate-500">Page</div>
          <div className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{title}</div>
          <div className="mt-2 max-w-2xl text-sm text-slate-600">{subtitle}</div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Pill label={tier} tone={tier === "Premium" ? "info" : tier === "Phase 2" ? "neutral" : "neutral"} />
            <Pill label="Shell ready" tone="good" />
          </div>
        </div>
        {onPrimary ? (
          <Button variant="primary" onClick={onPrimary}>
            <ChevronRight className="h-4 w-4" /> {primaryLabel || "Open"}
          </Button>
        ) : null}
      </div>

      {bullets?.length ? (
        <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-sm font-semibold text-slate-900">Included features</div>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            {bullets.map((b) => (
              <li key={b} className="flex items-start gap-2">
                <span className="mt-2 h-1.5 w-1.5 rounded-full" style={{ background: EVZ.green }} />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-4 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
        This AppShell is designed so each route can be replaced with the full page component when you integrate files into your codebase.
      </div>
    </div>
  );
}

function AccessDenied({ pageTitle, role, onRequest }: { pageTitle: string; role: Role; onRequest: () => void }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-rose-50 text-rose-700">
          <Lock className="h-6 w-6" />
        </div>
        <div>
          <div className="text-lg font-semibold text-slate-900">Access denied</div>
          <div className="mt-1 text-sm text-slate-600">
            Your role <span className="font-semibold">{role}</span> cannot access <span className="font-semibold">{pageTitle}</span>.
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button variant="primary" onClick={onRequest}>
              <Ticket className="h-4 w-4" /> Request access
            </Button>
            <div className="text-xs text-slate-500">Requests should be auditable and time-bounded in production.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AuthLogin({
  onLogin,
  orgs,
  roles,
}: {
  onLogin: (org: string, role: Role) => void;
  orgs: string[];
  roles: Role[];
}) {
  const [org, setOrg] = useState(orgs[0] || "Organization");
  const [role, setRole] = useState<Role>(roles[0] || "Org Admin");
  const [email, setEmail] = useState("admin@company.com");
  const [pw, setPw] = useState("demo");
  const [agree, setAgree] = useState(true);

  return (
    <div className="min-h-screen bg-[radial-gradient(90%_60%_at_50%_0%,rgba(3,205,140,0.18),rgba(255,255,255,0))]">
      <div className="mx-auto max-w-[980px] px-4 py-10 md:px-6">
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(2,8,23,0.12)]">
          <div className="border-b border-slate-200 bg-white px-6 py-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl text-white" style={{ background: EVZ.green }}>
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">CorporatePay</div>
                  <div className="mt-1 text-xs text-slate-500">Login and org selector</div>
                </div>
              </div>
              <Pill label="SSO-ready" tone="info" />
            </div>
          </div>

          <div className="bg-slate-50 px-6 py-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <div className="text-sm font-semibold text-slate-900">Sign in</div>
                <div className="mt-1 text-xs text-slate-500">Email and password. SSO buttons can be added in phase 2.</div>

                <div className="mt-4 space-y-3">
                  <label className="block">
                    <div className="text-xs font-semibold text-slate-600">Email</div>
                    <input value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-emerald-100" />
                  </label>
                  <label className="block">
                    <div className="text-xs font-semibold text-slate-600">Password</div>
                    <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-emerald-100" />
                  </label>

                  <label className="flex items-start gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-3">
                    <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-300" />
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Device trust notice</div>
                      <div className="mt-1 text-xs text-slate-600">Unusual logins may require step-up prompts (MFA).</div>
                    </div>
                  </label>

                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={() => {
                      if (!email.trim() || !pw.trim()) return;
                      if (!agree) return;
                      onLogin(org, role);
                    }}
                    disabled={!email.trim() || !pw.trim() || !agree}
                  >
                    <BadgeCheck className="h-4 w-4" /> Sign in
                  </Button>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <div className="text-sm font-semibold text-slate-900">Select organization</div>
                <div className="mt-1 text-xs text-slate-500">Shown when your user belongs to multiple orgs.</div>

                <div className="mt-4 space-y-3">
                  <label className="block">
                    <div className="text-xs font-semibold text-slate-600">Organization</div>
                    <select value={org} onChange={(e) => setOrg(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-emerald-100">
                      {orgs.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <div className="text-xs font-semibold text-slate-600">Role (demo)</div>
                    <select value={role} onChange={(e) => setRole(e.target.value as Role)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-emerald-100">
                      {roles.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                    In production, role and org membership is resolved from access policy and invites.
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    <Button variant="outline" onClick={() => alert("Request access: creates ticket for org admin (demo).")}> <Ticket className="h-4 w-4" /> Request access</Button>
                    <Button variant="outline" onClick={() => alert("MFA setup happens after login in X2 (demo).")}> <Lock className="h-4 w-4" /> MFA and device trust</Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4">
              <div className="text-sm font-semibold text-slate-900">EVzone Support sign-in entry</div>
              <div className="mt-1 text-xs text-slate-600">Support role is embedded. Support sessions are always audited, visible, and watermarked.</div>
            </div>
          </div>

          <footer className="border-t border-slate-200 bg-white/60 px-6 py-5 text-xs text-slate-500">
            Access and onboarding screens are part of the complete system. This login page is a premium shell starter.
          </footer>
        </div>
      </div>
    </div>
  );
}

export default function CorporatePayFinalAppShellV3() {
  const isDesktop = useMedia("(min-width: 1024px)");
  const { pageId } = useParams<{ pageId?: string }>();
  const navigate = useNavigate();

  const [authed, setAuthed] = useState(true);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawer, setMobileDrawer] = useState(false);

  const active = pageId || "dashboard";
  const [health, setHealth] = useState<AccountHealth>("Active");

  const [role, setRole] = useState<Role>("Org Admin");
  const [org, setOrg] = useState("Acme Group Ltd");

  const [toasts, setToasts] = useState<Array<{ id: string; title: string; message?: string; kind: "success" | "warn" | "error" | "info" }>>([]);
  const toast = (t: Omit<(typeof toasts)[number], "id">) => {
    const id = uid("toast");
    setToasts((p) => [{ id, ...t }, ...p].slice(0, 4));
    window.setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 3200);
  };

  // Theme
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("theme") as "light" | "dark") || "light";
    }
    return "light";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Global UI state
  const [query, setQuery] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);
  const [orgOpen, setOrgOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const notifRef = useRef<HTMLButtonElement | null>(null);
  const roleRef = useRef<HTMLButtonElement | null>(null);
  const orgRef = useRef<HTMLButtonElement | null>(null);
  const createRef = useRef<HTMLButtonElement | null>(null);

  // Request access modal
  const [accessModalOpen, setAccessModalOpen] = useState(false);
  const [accessReason, setAccessReason] = useState("");

  const pages = useMemo<Record<string, PageDef>>(
    () => ({
      dashboard: {
        id: "dashboard",
        title: "Corporate Dashboard",
        subtitle: "KPIs, account health, issues, and next best admin actions.",
        tier: "Core",
        roles: ["Org Owner", "Org Admin", "Manager", "Accountant", "Approver", "Travel Coordinator", "Employee", "EVzone Support"],
        keywords: ["kpi", "spend", "approvals", "budget", "health"],
        status: "Ready",
        bullets: [
          "Spend today/week/month, approvals pending, budget remaining",
          "Account health: wallet balance, credit usage, prepaid runway",
          "Top issues: failed payments, breaches, overdue invoices",
          "Quick actions: add funds, approve queue, create RFQ",
        ],
      },
      notifications_activity: {
        id: "notifications_activity",
        title: "Notifications and Activity Center",
        subtitle: "Unified feed for approvals, reminders, alerts, and vendor updates with channel delivery logs.",
        tier: "Core",
        roles: ["Org Owner", "Org Admin", "Manager", "Accountant", "Approver", "Travel Coordinator", "Employee", "EVzone Support"],
        keywords: ["alerts", "reminders", "activity", "logs", "whatsapp", "wechat", "sms"],
        status: "Ready",
      },
      command_center: {
        id: "command_center",
        title: "Global Search and Command Center",
        subtitle: "Search users, invoices, approvals, vendors and run quick admin actions.",
        tier: "Core",
        roles: ["Org Owner", "Org Admin", "Manager", "Accountant", "Approver", "Travel Coordinator", "Employee", "EVzone Support"],
        keywords: ["search", "command", "operator", "shortcuts"],
        status: "Ready",
      },
      org_setup: {
        id: "org_setup",
        title: "Organization Profile and Program Setup",
        subtitle: "Company profile, entities, branding, billing contacts, invoice groups, support toggle and go-live readiness.",
        tier: "Core",
        roles: ["Org Owner", "Org Admin"],
        keywords: ["profile", "entities", "billing", "branding", "go-live"],
        status: "Ready",
      },
      modules_enablement: {
        id: "modules_enablement",
        title: "Modules and Marketplaces Enablement",
        subtitle: "Enable service modules and marketplaces including MyLiveDealz. Includes Other slots.",
        tier: "Core",
        roles: ["Org Owner", "Org Admin"],
        keywords: ["modules", "marketplaces", "mylivedealz", "enable"],
        status: "Planned",
        bullets: [
          "Enable/disable service modules",
          "Enable/disable marketplaces under E-Commerce",
          "Controlled rollout: pilot group then expand",
          "Change impact preview",
        ],
      },
      users: {
        id: "users",
        title: "Users and Invitations",
        subtitle: "Invite users, assign roles, groups and spend limits. Bulk import and offboarding.",
        tier: "Core",
        roles: ["Org Owner", "Org Admin", "Manager", "Accountant"],
        keywords: ["users", "invites", "csv", "hris"],
        status: "Planned",
        bullets: [
          "Users list: Invited/Active/Suspended/Offboarded",
          "Bulk import CSV, HRIS import in phase 2",
          "Offboarding: revoke CorporatePay immediately, keep audit",
        ],
      },
      groups: {
        id: "groups",
        title: "Groups and Cost Centers",
        subtitle: "Departments (groups), cost centers, project tags and chargeback rules.",
        tier: "Core",
        roles: ["Org Owner", "Org Admin", "Accountant"],
        keywords: ["groups", "cost center", "tags"],
        status: "Planned",
      },
      roles_permissions: {
        id: "roles_permissions",
        title: "Roles, Permissions and Governance",
        subtitle: "RBAC, custom roles, approval delegation and two-admin model controls.",
        tier: "Core",
        roles: ["Org Owner", "Org Admin"],
        keywords: ["rbac", "permissions", "governance"],
        status: "Planned",
      },
      policies: {
        id: "policies",
        title: "Policies",
        subtitle: "Ride, services and purchases policies with inheritance and simulator.",
        tier: "Core",
        roles: ["Org Owner", "Org Admin", "Manager", "Approver"],
        keywords: ["policy", "rides", "purchases", "services"],
        status: "Planned",
      },
      approval_workflows: {
        id: "approval_workflows",
        title: "Approval Workflow Builder",
        subtitle: "Rule engine and multi-level approvals per module and marketplace including RFQs.",
        tier: "Core",
        roles: ["Org Owner", "Org Admin", "Approver"],
        keywords: ["workflow", "approvals", "sla"],
        status: "Planned",
      },
      approvals_inbox: {
        id: "approvals_inbox",
        title: "Approvals Inbox",
        subtitle: "Unified queue for rides, purchases, services, RFQs and exceptions.",
        tier: "Core",
        roles: ["Org Owner", "Org Admin", "Approver", "Accountant", "Manager"],
        keywords: ["approve", "queue", "sla"],
        status: "Planned",
      },
      budgets: {
        id: "budgets",
        title: "Budgets, Spend Limits and Controls",
        subtitle: "Org, group, module and marketplace budgets with forecasting and emergency exceptions.",
        tier: "Core",
        roles: ["Org Owner", "Org Admin", "Accountant"],
        keywords: ["budget", "cap", "limits", "exceptions"],
        status: "Ready",
      },
      wallet_billing: {
        id: "wallet_billing",
        title: "Corporate Wallet, Credit Line and Prepaid Funding",
        subtitle: "Pay-as-you-go wallet, credit with limit, and prepaid deposit with hard stop.",
        tier: "Core",
        roles: ["Org Owner", "Org Admin", "Accountant"],
        keywords: ["wallet", "credit", "prepaid"],
        status: "Planned",
      },
      billing_setup: {
        id: "billing_setup",
        title: "Billing Setup and Invoice Groups",
        subtitle: "Invoice frequency, invoice groups, tax settings, and billing simulations.",
        tier: "Core",
        roles: ["Org Owner", "Org Admin", "Accountant"],
        keywords: ["invoice groups", "billing", "tax"],
        status: "Planned",
      },
      invoices: {
        id: "invoices",
        title: "Invoices and Statements",
        subtitle: "Invoice list, line item explorer, disputes, exports.",
        tier: "Core",
        roles: ["Org Owner", "Org Admin", "Accountant"],
        keywords: ["invoice", "statement", "dispute"],
        status: "Planned",
      },
      collections: {
        id: "collections",
        title: "Collections, Reminders and Enforcement",
        subtitle: "Automated reminders and service suspension rules.",
        tier: "Core",
        roles: ["Org Owner", "Org Admin", "Accountant"],
        keywords: ["reminders", "dunning", "enforcement"],
        status: "Planned",
      },
      reconciliation: {
        id: "reconciliation",
        title: "Transactions and Reconciliation",
        subtitle: "Ledger, matching tools, exceptions queue, ERP mappings.",
        tier: "Core",
        roles: ["Org Owner", "Org Admin", "Accountant"],
        keywords: ["ledger", "reconcile", "erp"],
        status: "Planned",
      },
      vendors: {
        id: "vendors",
        title: "Vendor and Catalog Management",
        subtitle: "Allowlist/denylist vendors, risk scoring, rate cards and compliance docs.",
        tier: "Core",
        roles: ["Org Owner", "Org Admin", "Manager", "Accountant"],
        keywords: ["vendors", "catalog", "allowlist"],
        status: "Planned",
      },
      rfq: {
        id: "rfq",
        title: "RFQ and Quote Requests",
        subtitle: "High value assets: request quote, compare quotes, convert to purchase order.",
        tier: "Core",
        roles: ["Org Owner", "Org Admin", "Manager", "Accountant", "Approver"],
        keywords: ["rfq", "quote", "assets"],
        status: "Planned",
      },
      fulfillment: {
        id: "fulfillment",
        title: "Orders, Service Requests and Fulfillment",
        subtitle: "Track purchase orders, service bookings, deliveries and schedules.",
        tier: "Core",
        roles: ["Org Owner", "Org Admin", "Manager", "Accountant"],
        keywords: ["orders", "fulfillment", "sla"],
        status: "Planned",
      },
      travel: {
        id: "travel",
        title: "Corporate Travel and Scheduling",
        subtitle: "Pre-book rides, visitors, events, and recurring commutes.",
        tier: "Core",
        roles: ["Org Owner", "Org Admin", "Manager", "Travel Coordinator"],
        keywords: ["travel", "schedule", "events"],
        status: "Planned",
      },
      reporting: {
        id: "reporting",
        title: "Reporting and Analytics",
        subtitle: "Spend reports, approvals performance, exports and scheduled reports.",
        tier: "Core",
        roles: ["Org Owner", "Org Admin", "Manager", "Accountant", "Approver"],
        keywords: ["reports", "analytics", "exports"],
        status: "Ready",
      },
      esg: {
        id: "esg",
        title: "Sustainability and ESG Reporting",
        subtitle: "EV usage, charging utilization, emissions estimates, and ESG template exports.",
        tier: "Premium",
        roles: ["Org Owner", "Org Admin", "Accountant"],
        keywords: ["esg", "emissions", "charging"],
        status: "Ready",
      },
      integrations: {
        id: "integrations",
        title: "Integrations and Developer Center",
        subtitle: "API keys, scopes, webhooks, ERP exports, sandbox and inspector.",
        tier: "Core",
        roles: ["Org Owner", "Org Admin", "Accountant", "EVzone Support"],
        keywords: ["api", "webhooks", "sandbox", "erp"],
        status: "Ready",
      },
      security: {
        id: "security",
        title: "Security, Audit and Compliance",
        subtitle: "Audit logs, MFA policy, retention, support mode gating, forensic exports, compliance center.",
        tier: "Core",
        roles: ["Org Owner", "Org Admin", "Accountant", "EVzone Support"],
        keywords: ["audit", "mfa", "retention", "dual control"],
        status: "Ready",
      },
      support_tools: {
        id: "support_tools",
        title: "Support and EVzone Admin Tools",
        subtitle: "Embedded EVzone support role with auditable sessions, scoped tools and incidents.",
        tier: "Premium",
        roles: ["Org Owner", "Org Admin", "Accountant", "EVzone Support"],
        keywords: ["support", "cases", "sessions", "incidents"],
        status: "Ready",
      },
      ev_charging: {
        id: "ev_charging",
        title: "EV Charging",
        subtitle: "Charging schedules, sites, credits, and utilization controls.",
        tier: "Core",
        roles: ["Org Owner", "Org Admin", "Manager", "Accountant", "Approver", "Travel Coordinator", "Employee", "EVzone Support"],
        keywords: ["ev", "charging", "station", "credits", "utilization"],
        status: "Ready",
      },
      settings_hub: {
        id: "settings_hub",
        title: "Admin Settings Hub",
        subtitle: "Single settings umbrella linking to all configuration pages.",
        tier: "Core",
        roles: ["Org Owner", "Org Admin", "Accountant", "Manager", "Approver", "EVzone Support"],
        keywords: ["settings", "hub", "config"],
        status: "Ready",
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const notices: Notice[] = useMemo(
    () => [
      { id: "n1", title: "Invoice due tomorrow", message: "INV-2026-0117 is due. Auto-reminders are enabled.", when: "2h ago", tone: "warning", channel: "Email" },
      { id: "n2", title: "7 approvals pending", message: "Purchases and RFQs waiting. SLA target: 8 hours.", when: "Now", tone: "info", channel: "WhatsApp" },
      { id: "n3", title: "Prepaid balance low", message: "Deposit runway estimated: 3 days. Top up to avoid service stop.", when: "30m ago", tone: "danger", channel: "SMS" },
      { id: "n4", title: "ERP sync healthy", message: "Last export delivered successfully. Webhook success: 99.2%.", when: "Today", tone: "success", channel: "WeChat" },
    ],
    []
  );

  const counts = useMemo(() => {
    return {
      approvals: 7,
      rfqs: 3,
      users: 128,
      alerts: notices.length,
      cases: 2,
    };
  }, [notices.length]);

  const nav = useMemo<NavItem[]>(
    () => [
      { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
      { id: "notifications_activity", label: "Activity", icon: <Bell className="h-4 w-4" />, badge: `${counts.alerts}` },
      { id: "command_center", label: "Command center", icon: <Search className="h-4 w-4" /> },
      {
        id: "org",
        label: "Organization",
        icon: <Building2 className="h-4 w-4" />,
        children: [
          { id: "org_setup", label: "Setup wizard", icon: <div /> },
          { id: "modules_enablement", label: "Modules and marketplaces", icon: <div />, badge: "MyLiveDealz" },
        ],
      },
      {
        id: "people",
        label: "People",
        icon: <Users className="h-4 w-4" />,
        badge: `${counts.users}`,
        children: [
          { id: "users", label: "Users and invites", icon: <div /> },
          { id: "groups", label: "Groups and cost centers", icon: <div /> },
          { id: "roles_permissions", label: "Roles and permissions", icon: <div /> },
        ],
      },
      {
        id: "controls",
        label: "Controls",
        icon: <Shield className="h-4 w-4" />,
        children: [
          { id: "policies", label: "Policies", icon: <div /> },
          { id: "approval_workflows", label: "Approval workflows", icon: <div /> },
          { id: "approvals_inbox", label: "Approvals inbox", icon: <div />, badge: `${counts.approvals}` },
        ],
      },
      {
        id: "money",
        label: "Budgets and billing",
        icon: <Wallet className="h-4 w-4" />,
        children: [
          { id: "budgets", label: "Budgets and spend", icon: <div />, badge: "Caps" },
          { id: "wallet_billing", label: "Wallet and funding", icon: <div /> },
          { id: "billing_setup", label: "Billing setup", icon: <div /> },
          { id: "invoices", label: "Invoices", icon: <div /> },
          { id: "collections", label: "Collections", icon: <div />, badge: "Auto" },
          { id: "reconciliation", label: "Reconciliation", icon: <div /> },
        ],
      },
      {
        id: "procurement",
        label: "Procurement",
        icon: <FileText className="h-4 w-4" />,
        badge: "RFQ",
        children: [
          { id: "vendors", label: "Vendors and catalog", icon: <div /> },
          { id: "rfq", label: "RFQs and quotes", icon: <div />, badge: `${counts.rfqs}` },
          { id: "fulfillment", label: "Orders and fulfillment", icon: <div /> },
          { id: "travel", label: "Travel and scheduling", icon: <div /> },
        ],
      },
      {
        id: "evs_charging",
        label: "EVs & Charging",
        icon: <Leaf className="h-4 w-4" />,
        children: [
          { id: "ev_charging", label: "EV Charging", icon: <div />, badge: "EV" },
        ],
      },
      {
        id: "reports",
        label: "Reporting",
        icon: <Activity className="h-4 w-4" />,
        children: [
          { id: "reporting", label: "Analytics", icon: <div /> },
          { id: "esg", label: "Sustainability and ESG", icon: <div />, badge: "Premium" },
        ],
      },
      {
        id: "integrations",
        label: "Integrations",
        icon: <Globe className="h-4 w-4" />,
        children: [
          { id: "integrations", label: "Developer center", icon: <div /> },
        ],
      },
      {
        id: "security",
        label: "Security",
        icon: <Lock className="h-4 w-4" />,
        children: [
          { id: "security", label: "Audit and compliance", icon: <div /> },
        ],
      },
      {
        id: "support",
        label: "Support",
        icon: <Headphones className="h-4 w-4" />,
        badge: `${counts.cases}`,
        children: [
          { id: "support_tools", label: "Support tools", icon: <div /> },
        ],
      },
      { id: "settings_hub", label: "Settings", icon: <Settings className="h-4 w-4" /> },
    ],
    [counts]
  );

  const activePage = pages[active] || pages.dashboard;

  const healthTone: "good" | "warn" | "bad" = health === "Active" ? "good" : health === "Past due" ? "warn" : "bad";
  const isSupportRole = role === "EVzone Support";

  // Search suggestions: pages + common actions
  const suggestions = useMemo(() => {
    const base: Array<{ k: string; id: string; kind: "page" | "action" }> = [
      { k: "Approvals inbox", id: "approvals_inbox", kind: "page" },
      { k: "Create RFQ", id: "rfq", kind: "page" },
      { k: "Issue budget", id: "budgets", kind: "page" },
      { k: "Top up wallet", id: "wallet_billing", kind: "page" },
      { k: "Security: audit and compliance", id: "security", kind: "page" },
      { k: "Integrations: API keys and webhooks", id: "integrations", kind: "page" },
      { k: "Support tools", id: "support_tools", kind: "page" },
      { k: "EV Charging", id: "ev_charging", kind: "page" },
      { k: "Settings hub", id: "settings_hub", kind: "page" },
    ];

    const q = query.trim().toLowerCase();
    if (!q) return base.slice(0, 8);
    return base.filter((s) => s.k.toLowerCase().includes(q)).slice(0, 10);
  }, [query]);

  // Sync active state with URL pageId param


  useEffect(() => {
    if (isDesktop) setMobileDrawer(false);
  }, [isDesktop]);

  // Close dropdowns when switching active
  useEffect(() => {
    setRoleOpen(false);
    setOrgOpen(false);
    setNotifOpen(false);
    setCreateOpen(false);
  }, [pageId]);

  // Ctrl+K open command center
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
        navigate(`${ROUTES.CONSOLE.ROOT}/command_center`);
      }
      if (e.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const canAccess = (pageId: string) => {
    const p = pages[pageId];
    if (!p) return true;
    return p.roles.includes(role);
  };

  const renderContent = () => {
    const p = pages[active];
    if (!p) return <PlaceholderPage title="Not found" subtitle="This route does not exist." tier="Core" />;

    if (!canAccess(active)) {
      return (
        <AccessDenied
          pageTitle={p.title}
          role={role}
          onRequest={() => {
            setAccessReason("");
            setAccessModalOpen(true);
          }}
        />
      );
    }

    // Render generated pages (registry)
    const RegistryComp = (consolePages as Record<string, React.ComponentType | undefined>)[active];
    if (RegistryComp) return <RegistryComp />;

    // Otherwise show placeholder with stored bullets (for pages not yet in registry)
    return (
      <PlaceholderPage
        title={p.title}
        subtitle={p.subtitle}
        tier={p.tier}
        bullets={p.bullets}
        onPrimary={() => toast({ title: "Route", message: `Open ${p.id} (demo)`, kind: "info" })}
        primaryLabel="Open"
      />
    );
  };

  const switchRole = (r: Role) => {
    setRole(r);
    toast({ title: "Role switched", message: r, kind: "info" });
    // If current page becomes unauthorized, bounce to dashboard
    if (!canAccess(active)) navigate(`${ROUTES.CONSOLE.ROOT}/dashboard`);
  };

  const switchOrg = (o: string) => {
    setOrg(o);
    toast({ title: "Organization", message: o, kind: "info" });
  };

  if (!authed) {
    return (
      <AuthLogin
        onLogin={(o, r) => {
          setOrg(o);
          setRole(r);
          setAuthed(true);
          navigate(`${ROUTES.CONSOLE.ROOT}/dashboard`);
          toast({ title: "Signed in", message: `${o} - ${r}`, kind: "success" });
        }}
        orgs={["Acme Group Ltd", "EVzone Demo Org", "Kampala Holdings"]}
        roles={["Org Owner", "Org Admin", "Manager", "Accountant", "Approver", "Travel Coordinator", "Employee", "EVzone Support"]}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white transition-colors duration-300 dark:bg-slate-950">
      <ToastStack toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((x) => x.id !== id))} />

      {/* Support role banner */}
      {isSupportRole ? (
        <div className="sticky top-0 z-30 border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900">
          <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" /> Support role active. Sessions are visible and auditable. No silent actions.
            </div>
            <Pill label="Support mode" tone="warn" />
          </div>
        </div>
      ) : null}

      {/* Suspended banner */}
      {health === "Suspended" ? (
        <div className="border-b border-rose-200 bg-rose-50 px-4 py-2 text-xs text-rose-900">
          <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> Services are currently suspended due to payment non-compliance.
            </div>
            <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => navigate(`${ROUTES.CONSOLE.ROOT}/collections`)}>
              <Bell className="h-4 w-4" /> Open collections
            </Button>
          </div>
        </div>
      ) : null}

      <div className="flex h-screen">
        <div className="flex flex-1 overflow-hidden bg-white transition-colors dark:bg-slate-950">
          {/* Desktop sidebar */}
          <div className={cn("hidden h-full border-r border-slate-200 bg-slate-50 transition-colors lg:block dark:border-slate-800 dark:bg-slate-900", sidebarCollapsed ? "w-[56px]" : "w-[200px]")}>
            <Sidebar nav={nav} active={active} onSelect={(id) => navigate(`${ROUTES.CONSOLE.ROOT}/${id}`)} collapsed={sidebarCollapsed} theme={theme} onToggleTheme={() => setTheme((t) => (t === "light" ? "dark" : "light"))} />
          </div>

          {/* Mobile drawer */}
          <AnimatePresence>
            {mobileDrawer ? (
              <motion.div className="fixed inset-0 z-40 bg-black/30 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} transition={{ duration: 0.18 }} className="h-full w-[86vw] max-w-[360px] bg-slate-50">
                  <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className="grid h-10 w-10 place-items-center rounded-2xl text-white" style={{ background: EVZ.green }}>
                        <Sparkles className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900">CorporatePay</div>
                        <div className="text-xs text-slate-500">Navigation</div>
                      </div>
                    </div>
                    <button className="rounded-2xl p-2 text-slate-600 hover:bg-slate-100" onClick={() => setMobileDrawer(false)} aria-label="Close menu">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <Sidebar
                    nav={nav}
                    active={active}
                    onSelect={(id) => {
                      navigate(`${ROUTES.CONSOLE.ROOT}/${id}`);
                      setMobileDrawer(false);
                    }}
                    collapsed={false}
                    theme={theme}
                    onToggleTheme={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
                  />
                </motion.div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          {/* Main */}
          <div className="flex h-full min-w-0 flex-1 flex-col">
            {/* Top bar */}
            <div className="border-b border-emerald-700/30 transition-colors" style={{ background: "linear-gradient(90deg, #03CD8C 0%, #F77F00 100%)" }}>
              <div className="flex items-center justify-between gap-3 px-4 py-3 md:px-5">
                <div className="flex items-center gap-2">
                  <button className="rounded-2xl border border-white/30 bg-white/20 p-2 text-white shadow-sm backdrop-blur hover:bg-white/30 lg:hidden" onClick={() => setMobileDrawer(true)} aria-label="Open menu">
                    <Menu className="h-5 w-5" />
                  </button>

                  <button
                    className="hidden rounded-2xl border border-white/30 bg-white/20 p-2 text-white shadow-sm backdrop-blur hover:bg-white/30 lg:inline-flex"
                    onClick={() => setSidebarCollapsed((v) => !v)}
                    aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                  >
                    {sidebarCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
                  </button>

                  {/* Account Dropdown */}
                  <div className="relative hidden md:block">
                    <button
                      className="flex items-center gap-2 rounded-2xl bg-white/20 px-3 py-2 text-xs font-semibold text-white backdrop-blur hover:bg-white/30"
                      onClick={() => {
                        setAccountOpen(!accountOpen);
                        setOrgOpen(false);
                        setRoleOpen(false);
                        setCreateOpen(false);
                        setNotifOpen(false);
                      }}
                    >
                      <span>Account</span>
                      <Pill label={health} tone={healthTone} />
                      <ChevronDown className="h-3 w-3 opacity-70" />
                    </button>
                    <AnimatePresence>
                      {accountOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.95 }}
                          className="absolute left-0 top-full z-50 mt-2 w-48 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl"
                        >
                          <div className="px-2 py-1.5 text-xs font-semibold text-slate-500">Account status</div>
                          <button
                            className="flex w-full items-center justify-between rounded-xl px-2 py-2 text-sm font-medium hover:bg-slate-50"
                            onClick={() => setHealth("Active")}
                          >
                            <span className="text-emerald-700">Active</span>
                            {health === "Active" && <Check className="h-4 w-4 text-emerald-600" />}
                          </button>
                          <button
                            className="flex w-full items-center justify-between rounded-xl px-2 py-2 text-sm font-medium hover:bg-slate-50"
                            onClick={() => setHealth("Past due")}
                          >
                            <span className="text-amber-700">Past due</span>
                            {health === "Past due" && <Check className="h-4 w-4 text-emerald-600" />}
                          </button>
                          <button
                            className="flex w-full items-center justify-between rounded-xl px-2 py-2 text-sm font-medium hover:bg-slate-50"
                            onClick={() => setHealth("Suspended")}
                          >
                            <span className="text-rose-700">Suspended</span>
                            {health === "Suspended" && <Check className="h-4 w-4 text-emerald-600" />}
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="relative">

                    <div className="flex w-[min(320px,35vw)] items-center gap-2 rounded-2xl border border-white/30 bg-white/95 px-3 py-2 shadow-sm focus-within:ring-4 focus-within:ring-white/30">
                      <Search className="h-4 w-4 text-slate-500" />
                      <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => setSearchOpen(true)}
                        placeholder="Search users, invoices, approvals, vendors, RFQs..."
                        className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
                      />
                      <span className="hidden rounded-xl bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600 md:inline">Ctrl K</span>
                    </div>

                    <AnimatePresence>
                      {searchOpen ? (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.98 }}
                          transition={{ duration: 0.16 }}
                          className="absolute z-30 mt-2 w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_24px_70px_rgba(2,8,23,0.18)]"
                        >
                          <div className="px-4 py-3 text-xs font-semibold text-slate-600">Suggestions</div>
                          <div className="max-h-[260px] overflow-auto pb-2">
                            {suggestions.map((s) => (
                              <button
                                key={s.k}
                                className="flex w-full items-center justify-between gap-3 px-4 py-2 text-left hover:bg-slate-50"
                                onClick={() => {
                                  navigate(`${ROUTES.CONSOLE.ROOT}/${s.id}`);
                                  setSearchOpen(false);
                                }}
                              >
                                <div className="min-w-0">
                                  <div className="truncate text-sm font-semibold text-slate-900">{s.k}</div>
                                  <div className="truncate text-xs text-slate-500">Jump to page</div>
                                </div>
                                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">Open</span>
                              </button>
                            ))}
                          </div>
                          <div className="border-t border-slate-200 px-4 py-3 text-xs text-slate-500">
                            Tip: search is role-aware and should return only what you can access.
                          </div>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Org switch */}
                  <button
                    ref={orgRef}
                    className="hidden items-center gap-2 rounded-2xl border border-white/30 bg-white/20 px-3 py-2 text-sm font-semibold text-white shadow-sm backdrop-blur hover:bg-white/30 md:flex"
                    onClick={() => {
                      setOrgOpen((v) => !v);
                      setRoleOpen(false);
                      setNotifOpen(false);
                      setCreateOpen(false);
                    }}
                    title="Switch organization"
                  >
                    <Building2 className="h-4 w-4" />
                    <span className="max-w-[200px] truncate">{org}</span>
                    <ChevronDown className="h-4 w-4 opacity-70" />
                  </button>

                  {/* Role switch */}
                  <button
                    ref={roleRef}
                    className="hidden items-center gap-2 rounded-2xl border border-white/30 bg-white/20 px-3 py-2 text-sm font-semibold text-white shadow-sm backdrop-blur hover:bg-white/30 md:flex"
                    onClick={() => {
                      setRoleOpen((v) => !v);
                      setOrgOpen(false);
                      setNotifOpen(false);
                      setCreateOpen(false);
                    }}
                    title="Switch role"
                  >
                    <BadgeCheck className="h-4 w-4" />
                    <span className="max-w-[170px] truncate">{role}</span>
                    <ChevronDown className="h-4 w-4 opacity-70" />
                  </button>

                  {/* Quick create */}
                  <button
                    ref={createRef}
                    className="rounded-2xl border border-white/30 bg-white p-2 text-emerald-600 shadow-lg hover:bg-white/95"
                    onClick={() => {
                      setCreateOpen((v) => !v);
                      setNotifOpen(false);
                      setRoleOpen(false);
                      setOrgOpen(false);
                    }}
                    aria-label="Quick create"
                    disabled={health === "Suspended"}
                    title={health === "Suspended" ? "Disabled while suspended" : "Quick create"}
                  >
                    <Plus className="h-5 w-5" />
                  </button>

                  {/* Notifications */}
                  <button
                    ref={notifRef}
                    className="relative rounded-2xl border border-white/30 bg-white/20 p-2 text-white shadow-sm backdrop-blur hover:bg-white/30"
                    onClick={() => {
                      setNotifOpen((v) => !v);
                      setCreateOpen(false);
                      setRoleOpen(false);
                      setOrgOpen(false);
                    }}
                    aria-label="Notifications"
                  >
                    <Bell className="h-5 w-5" />
                    <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full text-xs font-semibold text-white" style={{ background: EVZ.orange }}>{notices.length}</span>
                  </button>

                  {/* Settings */}
                  <button
                    className="hidden rounded-2xl border border-white/30 bg-white/20 p-2 text-white shadow-sm backdrop-blur hover:bg-white/30 md:inline-flex"
                    aria-label="Settings"
                    onClick={() => navigate(`${ROUTES.CONSOLE.ROOT}/settings_hub`)}
                  >
                    <Settings className="h-5 w-5" />
                  </button>

                  {/* Sign out */}
                  <button
                    className="hidden rounded-2xl border border-white/30 bg-white/20 p-2 text-white shadow-sm backdrop-blur hover:bg-white/30 md:inline-flex"
                    aria-label="Sign out"
                    onClick={() => {
                      setAuthed(false);
                      toast({ title: "Signed out", message: "", kind: "info" });
                    }}
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 px-4 pb-3 md:hidden">
                <Pill label={`Account: ${health}`} tone={healthTone} />
                <div className="text-xs font-semibold text-white">Role: {role}</div>
              </div>
            </div>

            {/* Dropdowns */}
            <Dropdown open={notifOpen} onClose={() => setNotifOpen(false)} anchorRef={notifRef} width={420}>
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                <div className="text-sm font-semibold text-slate-900">Notifications</div>
                <button
                  className="rounded-2xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  onClick={() => {
                    setNotifOpen(false);
                    navigate(`${ROUTES.CONSOLE.ROOT}/notifications_activity`);
                  }}
                >
                  View all
                </button>
              </div>
              <div className="max-h-[420px] overflow-auto p-2">
                {notices.map((n) => (
                  <div key={n.id} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-slate-900">{n.title}</div>
                        <div className="mt-1 text-sm text-slate-600">{n.message}</div>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <Pill label={n.when} tone="neutral" />
                          {n.channel ? <ChannelChip channel={n.channel} /> : null}
                          {n.tone === "success" ? <Pill label="OK" tone="good" /> : n.tone === "warning" ? <Pill label="Attention" tone="warn" /> : n.tone === "danger" ? <Pill label="Action" tone="bad" /> : <Pill label="Info" tone="info" />}
                        </div>
                      </div>
                      <button
                        className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        onClick={() => {
                          setNotifOpen(false);
                          navigate(`${ROUTES.CONSOLE.ROOT}/notifications_activity`);
                        }}
                      >
                        Open
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-200 px-4 py-3 text-xs text-slate-500">
                Reminders support Email, WhatsApp, WeChat, and SMS. Delivery logs are saved for audit.
              </div>
            </Dropdown>

            <Dropdown open={roleOpen} onClose={() => setRoleOpen(false)} anchorRef={roleRef as any} width={320}>
              <div className="border-b border-slate-200 px-4 py-3">
                <div className="text-sm font-semibold text-slate-900">Switch role</div>
                <div className="mt-1 text-xs text-slate-500">Role-aware views change navigation and permissions.</div>
              </div>
              <div className="p-2">
                {([
                  "Org Owner",
                  "Org Admin",
                  "Manager",
                  "Accountant",
                  "Approver",
                  "Travel Coordinator",
                  "Employee",
                  "EVzone Support",
                ] as Role[]).map((r) => (
                  <button
                    key={r}
                    className={cn("flex w-full items-center justify-between rounded-2xl px-3 py-2 text-left text-sm hover:bg-slate-50", r === role && "bg-emerald-50")}
                    onClick={() => {
                      switchRole(r);
                      setRoleOpen(false);
                    }}
                  >
                    <span className={cn("font-semibold", r === role ? "text-emerald-800" : "text-slate-800")}>{r}</span>
                    {r === role ? <BadgeCheck className="h-4 w-4 text-emerald-700" /> : null}
                  </button>
                ))}
              </div>
              <div className="border-t border-slate-200 px-4 py-3 text-xs text-slate-500">Support role is audited and can be disabled by organization policy.</div>
            </Dropdown>

            <Dropdown open={orgOpen} onClose={() => setOrgOpen(false)} anchorRef={orgRef as any} width={340}>
              <div className="border-b border-slate-200 px-4 py-3">
                <div className="text-sm font-semibold text-slate-900">Organizations</div>
                <div className="mt-1 text-xs text-slate-500">Switch admin view across organizations you manage.</div>
              </div>
              <div className="p-2">
                {["Acme Group Ltd", "EVzone Demo Org", "Kampala Holdings"].map((o) => (
                  <button
                    key={o}
                    className={cn("flex w-full items-center justify-between rounded-2xl px-3 py-2 text-left text-sm hover:bg-slate-50", o === org && "bg-emerald-50")}
                    onClick={() => {
                      switchOrg(o);
                      setOrgOpen(false);
                    }}
                  >
                    <span className={cn("font-semibold", o === org ? "text-emerald-800" : "text-slate-800")}>{o}</span>
                    {o === org ? <BadgeCheck className="h-4 w-4 text-emerald-700" /> : null}
                  </button>
                ))}
              </div>
            </Dropdown>

            <Dropdown open={createOpen} onClose={() => setCreateOpen(false)} anchorRef={createRef} width={360}>
              <div className="border-b border-slate-200 px-4 py-3">
                <div className="text-sm font-semibold text-slate-900">Quick create</div>
                <div className="mt-1 text-xs text-slate-500">Fast actions that open the correct workflows.</div>
              </div>
              <div className="p-2">
                {[
                  { label: "Invite user", icon: <Users className="h-4 w-4" />, id: "users" },
                  { label: "Create policy", icon: <Shield className="h-4 w-4" />, id: "policies" },
                  { label: "Create RFQ", icon: <FileText className="h-4 w-4" />, id: "rfq" },
                  { label: "Issue budget", icon: <CircleDollarSign className="h-4 w-4" />, id: "budgets" },
                  { label: "Create webhook", icon: <Globe className="h-4 w-4" />, id: "integrations" },
                  { label: "Open support case", icon: <Ticket className="h-4 w-4" />, id: "support_tools" },
                ].map((x) => (
                  <button
                    key={x.label}
                    className="flex w-full items-center justify-between rounded-2xl px-3 py-2 text-left text-sm hover:bg-slate-50"
                    onClick={() => {
                      navigate(`${ROUTES.CONSOLE.ROOT}/${x.id}`);
                      setCreateOpen(false);
                    }}
                  >
                    <span className="flex items-center gap-2 font-semibold text-slate-800">
                      <span className="text-slate-600">{x.icon}</span>
                      {x.label}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">Open</span>
                  </button>
                ))}
              </div>
              <div className="border-t border-slate-200 px-4 py-3 text-xs text-slate-500">All actions are permission checked and logged for audit.</div>
            </Dropdown>

            {/* Content */}
            <div className="min-h-0 flex-1 overflow-auto bg-slate-50">
              <div className="px-4 py-5 md:px-5">
                <div className="mb-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="text-xs font-semibold text-slate-500">Current view</div>
                      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{activePage.title}</h1>
                      <p className="mt-2 max-w-2xl text-sm text-slate-600">{activePage.subtitle}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Pill label={activePage.tier} tone={activePage.tier === "Premium" ? "info" : activePage.tier === "Phase 2" ? "neutral" : "neutral"} />
                      {activePage.status ? <Pill label={activePage.status} tone={activePage.status === "Ready" ? "good" : "warn"} /> : null}
                      {isSupportRole ? <Pill label="Support role" tone="warn" /> : <Pill label="Org role" tone="neutral" />}
                      <Button variant="outline" onClick={() => navigate(`${ROUTES.CONSOLE.ROOT}/settings_hub`)}>
                        <Settings className="h-4 w-4" /> Settings
                      </Button>
                    </div>
                  </div>
                </div>

                {renderContent()}
              </div>
            </div>

            {/* Mobile bottom nav */}
            <div className="border-t border-slate-200 bg-white lg:hidden">
              <div className="grid grid-cols-5 gap-2 px-3 py-2">
                <BottomTab active={active === "dashboard"} label="Home" icon={<LayoutDashboard className="h-5 w-5" />} onClick={() => navigate(`${ROUTES.CONSOLE.ROOT}/dashboard`)} />
                <BottomTab active={active === "approvals_inbox"} label="Approvals" icon={<ClipboardCheck className="h-5 w-5" />} badge={`${counts.approvals}`} onClick={() => navigate(`${ROUTES.CONSOLE.ROOT}/approvals_inbox`)} />
                <BottomTab active={active === "budgets"} label="Spend" icon={<CircleDollarSign className="h-5 w-5" />} onClick={() => navigate(`${ROUTES.CONSOLE.ROOT}/budgets`)} />
                <BottomTab active={active === "wallet_billing"} label="Wallet" icon={<Wallet className="h-5 w-5" />} onClick={() => navigate(`${ROUTES.CONSOLE.ROOT}/wallet_billing`)} />
                <BottomTab active={false} label="More" icon={<Menu className="h-5 w-5" />} onClick={() => setMobileDrawer(true)} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Access request modal */}
      <Modal
        open={accessModalOpen}
        title="Request access"
        subtitle="This creates a request for Org Admin to grant permissions."
        onClose={() => setAccessModalOpen(false)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setAccessModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (accessReason.trim().length < 8) {
                  toast({ title: "Reason required", message: "Explain why you need access.", kind: "warn" });
                  return;
                }
                toast({ title: "Requested", message: "Access request created.", kind: "success" });
                setAccessModalOpen(false);
              }}
            >
              <Ticket className="h-4 w-4" /> Submit
            </Button>
          </div>
        }
      >
        <textarea
          value={accessReason}
          onChange={(e) => setAccessReason(e.target.value)}
          placeholder="Explain why you need access and for how long"
          rows={4}
          className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-900 shadow-sm outline-none focus:ring-4 focus:ring-emerald-100"
        />
        <div className="mt-2 text-xs text-slate-600">Requests should be auditable and time-bounded in production.</div>
      </Modal>

      <ClickAway
        onAway={() => {
          setSearchOpen(false);
        }}
      />
    </div>
  );
}

function ClickAway({ onAway }: { onAway: () => void }) {
  useEffect(() => {
    const h = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      if (!el) return;
      // If click happens inside dropdowns or inputs, skip.
      if (el.closest("[role='menu']")) return;
      if (el.closest("input")) return;
      onAway();
    };
    window.addEventListener("mousedown", h);
    return () => window.removeEventListener("mousedown", h);
  }, [onAway]);
  return null;
}

function IssueCard({
  title,
  desc,
  tone,
  cta,
  onClick,
}: {
  title: string;
  desc: string;
  tone: "neutral" | "info" | "warn" | "bad";
  cta: string;
  onClick: () => void;
}) {
  const map: Record<string, string> = {
    neutral: "bg-slate-50 text-slate-700 ring-slate-200",
    info: "bg-blue-50 text-blue-700 ring-blue-200",
    warn: "bg-amber-50 text-amber-800 ring-amber-200",
    bad: "bg-rose-50 text-rose-700 ring-rose-200",
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">{title}</div>
          <div className="mt-1 text-sm text-slate-600">{desc}</div>
        </div>
        <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1", map[tone])}>{tone}</span>
      </div>
      <div className="mt-3">
        <Button variant="outline" className="w-full" onClick={onClick}>
          <ChevronRight className="h-4 w-4" /> {cta}
        </Button>
      </div>
    </div>
  );
}

function MiniCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3">
      <div className="text-xs font-semibold text-slate-500">{title}</div>
      <div className="mt-1 text-sm font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function SupportRow({ label, icon, onClick }: { label: string; icon: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-800 hover:bg-slate-50">
      <span className="flex items-center gap-2">
        <span className="text-slate-600">{icon}</span>
        {label}
      </span>
      <ChevronRight className="h-4 w-4 text-slate-500" />
    </button>
  );
}

function BottomTab({
  label,
  icon,
  badge,
  active,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  badge?: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-xs font-semibold",
        active ? "text-white" : "text-slate-700 hover:bg-slate-100"
      )}
      style={active ? { background: EVZ.green } : undefined}
    >
      <div className={cn("relative", active ? "text-white" : "text-slate-700")}>{icon}</div>
      <div className="leading-none">{label}</div>
      {badge ? <span className="absolute right-2 top-1 rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">{badge}</span> : null}
    </button>
  );
}

function ShortcutCard({ title, desc, onClick, icon }: { title: string; desc: string; onClick: () => void; icon: React.ReactNode }) {
  return (
    <button onClick={onClick} className="rounded-3xl border border-slate-200 bg-white p-4 text-left shadow-sm hover:bg-slate-50">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">{icon}</div>
          <div>
            <div className="text-sm font-semibold text-slate-900">{title}</div>
            <div className="mt-1 text-sm text-slate-600">{desc}</div>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-slate-400" />
      </div>
    </button>
  );
}
