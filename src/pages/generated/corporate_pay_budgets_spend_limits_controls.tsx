import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  AlertTriangle,
  BadgeCheck,
  Check,
  ChevronDown,
  Download,
  FileText,
  Info,
  PiggyBank,
  Plus,
  Shield,
  X,
  MoreVertical,
  Trash2,
  RefreshCw,
  History,
  Search,
} from "lucide-react";

// Types
type BudgetPeriod = "Weekly" | "Monthly" | "Quarterly";
type CapType = "Hard" | "Soft";
type BudgetScope = "Org" | "Group" | "Module" | "Marketplace";

type Budget = {
  id: string;
  scope: BudgetScope;
  period: BudgetPeriod;
  capType: CapType;
  amountUGX: number;
  usedUGX: number;
  group?: string;
  module?: string;
  marketplace?: string;
  updatedAt: number;
  updatedBy: string;
  notes?: string;
  hardCap: boolean;
};

type UserRow = {
  id: string;
  name: string;
  group: string;
  role: string;
  autoApprove: boolean;
  limit: number;
  period: BudgetPeriod;
  updatedAt: number;
};

type HistoryItem = {
  id: string;
  ts: number;
  actor: string;
  action: string;
  details: string;
};

// Utils
function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function formatUGX(n: number) {
  const v = Math.round(Number(n || 0));
  return `UGX ${v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

const GROUPS = ["Operations", "Sales", "Finance", "Admin", "Procurement"];
const MODULES = [
  "E-Commerce",
  "EVs & Charging",
  "Rides & Logistics",
  "Medical & Health Care",
  "Travel & Tourism",
  "Finance & Payments",
  "All Modules",
];

// Helper Components
function Button({
  variant = "outline",
  className,
  children,
  onClick,
  disabled,
}: {
  variant?: "primary" | "outline" | "ghost" | "danger" | "accent";
  className?: string;
  children: React.ReactNode;
  onClick?: (e?: React.MouseEvent) => void;
  disabled?: boolean;
}) {
  const base = "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants: Record<string, string> = {
    primary: "bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-200",
    accent: "bg-orange-500 text-white hover:bg-orange-600 focus:ring-orange-200",
    outline: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 focus:ring-slate-200",
    ghost: "bg-transparent text-slate-700 hover:bg-slate-100 focus:ring-slate-200",
    danger: "bg-rose-50 text-rose-700 hover:bg-rose-100 focus:ring-rose-200",
  };
  return (
    <button onClick={onClick} disabled={disabled} className={cn(base, variants[variant], className)}>
      {children}
    </button>
  );
}

function Modal({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40" // Removed backdrop-blur-sm
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="pointer-events-auto w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-white sticky top-0 z-10">
                <h3 className="text-lg font-bold text-slate-900">{title}</h3>
                <button onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto">{children}</div>
              {footer && <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 rounded-b-3xl sticky bottom-0 z-10">{footer}</div>}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function ToastStack({ toasts, onDismiss }: { toasts: any[]; onDismiss: (id: string) => void }) {
  return (
    <div className="fixed top-4 right-4 z-[60] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="pointer-events-auto flex items-start gap-3 rounded-2xl bg-white p-4 shadow-xl border border-slate-100 w-80"
          >
            <div className={cn("mt-0.5 rounded-full p-1", t.kind === "success" ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-blue-600")}>
              {t.kind === "success" ? <Check className="h-4 w-4" /> : <Info className="h-4 w-4" />}
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-slate-900">{t.title}</div>
              <div className="text-xs text-slate-500 mt-1">{t.message}</div>
            </div>
            <button onClick={() => onDismiss(t.id)} className="text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ---------------------- SUB-COMPONENTS ----------------------

function IssueModal({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (data: any) => void }) {
  const [amount, setAmount] = useState("");
  const [group, setGroup] = useState(GROUPS[0]);
  const [period, setPeriod] = useState("Monthly");
  const [hardCap, setHardCap] = useState(true);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setAmount("");
      setGroup(GROUPS[0]);
      setPeriod("Monthly");
      setHardCap(true);
    }
  }, [open]);

  const handleSubmit = () => {
    if (!amount) return;
    onSave({
      amountUGX: parseInt(amount.replace(/,/g, "")),
      group,
      period,
      hardCap,
      capType: hardCap ? "Hard" : "Soft"
    });
  };

  return (
    <Modal open={open} onClose={onClose} title="Issue New Budget" footer={
      <div className="flex justify-end gap-3">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={handleSubmit} disabled={!amount}>Confirm Issuance</Button>
      </div>
    }>
      <div className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-slate-500">Select Group</label>
          <select value={group} onChange={(e) => setGroup(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-emerald-100">
            {GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>

        <div>
           <label className="text-xs font-semibold text-slate-500">Service Module (optional)</label>
           <select className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-emerald-100">
             <option value="All">All Modules</option>
             {MODULES.map(m => <option key={m} value={m}>{m}</option>)}
           </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-500">Budget Amount (UGX)</label>
          <input 
            type="number" 
            value={amount} 
            onChange={(e) => setAmount(e.target.value)} 
            placeholder="e.g. 5000000"
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-lg font-bold text-slate-900 outline-none focus:ring-4 focus:ring-emerald-100"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-500">Period</label>
            <select value={period} onChange={(e) => setPeriod(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-emerald-100">
              <option value="Weekly">Weekly</option>
              <option value="Monthly">Monthly</option>
              <option value="Quarterly">Quarterly</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500">Cap Type</label>
            <button 
              onClick={() => setHardCap(!hardCap)}
              className={cn(
                "mt-2 flex w-full items-center justify-between rounded-2xl border px-3 py-3 text-sm font-semibold transition-all",
                hardCap ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-600"
              )}
            >
              <span>{hardCap ? "Hard Cap" : "Soft Cap"}</span>
              {hardCap ? <Shield className="h-4 w-4" /> : <Info className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function EditModal({ budget, onClose, onSave }: { budget: Budget; onClose: () => void; onSave: (data: any) => void }) {
  const [amount, setAmount] = useState(budget.amountUGX.toString());
  const [hardCap, setHardCap] = useState(budget.hardCap);

  return (
    <Modal open={true} onClose={onClose} title={`Edit ${budget.group} Budget`} footer={
      <div className="flex justify-end gap-3">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={() => onSave({ amountUGX: Number(amount), hardCap })}>Save Changes</Button>
      </div>
    }>
      <div className="space-y-4">
        <div className="rounded-2xl bg-slate-50 p-4">
          <div className="text-xs font-semibold text-slate-500">Current Allocation</div>
          <div className="text-xl font-bold text-slate-900">{formatUGX(budget.amountUGX)}</div>
          <div className="text-xs text-slate-500">{budget.period} • {budget.module || "All Modules"}</div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-500">New Amount (UGX)</label>
          <input 
            type="number" 
            value={amount} 
            onChange={(e) => setAmount(e.target.value)} 
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-lg font-bold text-slate-900 outline-none focus:ring-4 focus:ring-emerald-100"
          />
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-slate-200 p-4 bg-white">
          <div>
            <div className="text-sm font-semibold text-slate-900">Hard Cap</div>
            <div className="text-xs text-slate-500">Prevent spending above limit</div>
          </div>
          <button 
            onClick={() => setHardCap(!hardCap)}
            className={cn(
              "relative h-6 w-11 rounded-full border transition-colors",
              hardCap ? "border-emerald-500 bg-emerald-500" : "border-slate-300 bg-slate-200"
            )}
          >
            <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform", hardCap ? "left-[22px]" : "left-0.5")} />
          </button>
        </div>
      </div>
    </Modal>
  );
}

function UserLimitModal({ user, onClose, onSave }: { user: UserRow; onClose: () => void; onSave: (data: any) => void }) {
  const [limit, setLimit] = useState(user.limit.toString());
  const [autoApprove, setAutoApprove] = useState(user.autoApprove);

  return (
    <Modal open={true} onClose={onClose} title={`Edit Limits for ${user.name}`} footer={
      <div className="flex justify-end gap-3">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={() => onSave({ limit: Number(limit), autoApprove })}>Save Changes</Button>
      </div>
    }>
      <div className="space-y-4">
        <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4">
            <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
              {user.name.charAt(0)}
            </div>
            <div>
               <div className="font-bold text-slate-900">{user.name}</div>
               <div className="text-xs text-slate-500">{user.role} • {user.group}</div>
            </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-500">Spending Limit (UGX)</label>
          <input 
            type="number" 
            value={limit} 
            onChange={(e) => setLimit(e.target.value)} 
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-lg font-bold text-slate-900 outline-none focus:ring-4 focus:ring-emerald-100"
          />
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-slate-200 p-4 bg-white">
          <div>
            <div className="text-sm font-semibold text-slate-900">Auto-Approval Eligibility</div>
            <div className="text-xs text-slate-500">Allow system to auto-approve safe requests</div>
          </div>
          <button 
            onClick={() => setAutoApprove(!autoApprove)}
            className={cn(
              "relative h-6 w-11 rounded-full border transition-colors",
              autoApprove ? "border-emerald-500 bg-emerald-500" : "border-slate-300 bg-slate-200"
            )}
          >
            <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform", autoApprove ? "left-[22px]" : "left-0.5")} />
          </button>
        </div>
      </div>
    </Modal>
  );
}

function HistoryModal({ open, onClose, history, onClear }: { open: boolean; onClose: () => void; history: HistoryItem[]; onClear: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Budget History" footer={
      <div className="flex justify-between w-full">
        <Button variant="danger" onClick={onClear}>Clear Log</Button>
        <Button variant="primary" onClick={onClose}>Done</Button>
      </div>
    }>
      <div className="space-y-4">
        {history.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">No history recorded yet.</div>
        ) : (
          history.map((h) => (
            <div key={h.id} className="flex gap-3 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
              <div className="mt-1 h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
              <div>
                <div className="text-sm font-semibold text-slate-900">{h.action} <span className="font-normal text-slate-500">by {h.actor}</span></div>
                <div className="text-xs text-slate-600">{h.details}</div>
                <div className="text-[10px] text-slate-400 mt-1">{new Date(h.ts).toLocaleString()}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </Modal>
  );
}

// ---------------------- MAIN PAGE ----------------------

export default function CorporatePayBudgetsSpendControlsV2() {
  const navigate = useNavigate();
  const [toasts, setToasts] = useState<any[]>([]);
  
  const showToast = (title: string, message: string, kind = "info") => {
    const id = uid();
    setToasts((prev) => [...prev, { id, title, message, kind }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  // State: Budgets
  const [budgets, setBudgets] = useState<Budget[]>([
    { id: "B-1", scope: "Group", group: "Operations", module: "All Modules", marketplace: "All", amountUGX: 5000000, period: "Monthly", hardCap: true, capType: "Hard", usedUGX: 3200000, updatedAt: Date.now(), updatedBy: "Admin" },
    { id: "B-2", scope: "Group", group: "Sales", module: "Rides & Logistics", marketplace: "All", amountUGX: 2500000, period: "Monthly", hardCap: false, capType: "Soft", usedUGX: 2100000, updatedAt: Date.now(), updatedBy: "Admin" },
    { id: "B-3", scope: "Group", group: "Finance", module: "All Modules", marketplace: "All", amountUGX: 8000000, period: "Quarterly", hardCap: true, capType: "Hard", usedUGX: 1200000, updatedAt: Date.now(), updatedBy: "Admin" },
    { id: "B-4", scope: "Group", group: "Operations", module: "E-Commerce", marketplace: "MyLiveDealz", amountUGX: 1500000, period: "Monthly", hardCap: true, capType: "Hard", usedUGX: 0, updatedAt: Date.now(), updatedBy: "Admin" },
    { id: "B-5", scope: "Group", group: "Operations", module: "All Modules", marketplace: "All", amountUGX: 5000000, period: "Monthly", hardCap: true, capType: "Hard", usedUGX: 5000000, updatedAt: Date.now(), updatedBy: "Admin" },
  ]);

  // State: Users
  const [users, setUsers] = useState<UserRow[]>([
    { id: "U-1", name: "Mary N.", group: "Operations", role: "Manager", limit: 2000000, autoApprove: true, period: "Monthly", updatedAt: Date.now() },
    { id: "U-2", name: "John S.", group: "Sales", role: "Employee", limit: 500000, autoApprove: false, period: "Monthly", updatedAt: Date.now() - 86400000 },
    { id: "U-3", name: "Irene K.", group: "Operations", role: "Coordinator", limit: 1500000, autoApprove: true, period: "Monthly", updatedAt: Date.now() - 172800000 },
    { id: "U-4", name: "Daisy O.", group: "Finance", role: "Accountant", limit: 5000000, autoApprove: true, period: "Monthly", updatedAt: Date.now() - 604800000 },
  ]);

  const [history, setHistory] = useState<HistoryItem[]>([
    { id: "H-1", ts: Date.now() - 100000, actor: "Admin", action: "Created", details: "Initial budget allocation for Operations" }
  ]);

  // Filters - Budgets
  const [timeFilter, setTimeFilter] = useState("All");
  const [groupFilter, setGroupFilter] = useState("All");
  const [moduleFilter, setModuleFilter] = useState("All");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  // Filters - Users
  const [userTimeFilter, setUserTimeFilter] = useState("All");
  const [userCustomStart, setUserCustomStart] = useState("");
  const [userCustomEnd, setUserCustomEnd] = useState("");
  const [userSearch, setUserSearch] = useState("");

  // Modals
  const [isIssueOpen, setIsIssueOpen] = useState(false);
  const [editBudget, setEditBudget] = useState<Budget | null>(null);
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Derived state: Budgets
  const filteredBudgets = useMemo(() => {
    return budgets.filter((b) => {
      // Group Filter
      if (groupFilter !== "All" && b.group !== groupFilter) return false;
      // Module Filter
      if (moduleFilter !== "All" && b.module !== moduleFilter) return false;
      
      // Time Filter
      const d = new Date(b.updatedAt);
      const now = new Date();
      if (timeFilter === "Today") return d.toDateString() === now.toDateString();
      if (timeFilter === "Week") return (now.getTime() - d.getTime()) < 7 * 86400000;
      if (timeFilter === "Month") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      if (timeFilter === "Year") return d.getFullYear() === now.getFullYear();
      if (timeFilter === "Custom" && customStart && customEnd) {
         const start = new Date(customStart);
         const end = new Date(customEnd);
         end.setHours(23, 59, 59);
         return d >= start && d <= end;
      }
      
      return true;
    });
  }, [budgets, groupFilter, moduleFilter, timeFilter, customStart, customEnd]);

  // Derived state: Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Search
      if (userSearch && !u.name.toLowerCase().includes(userSearch.toLowerCase())) return false;
      
      // Time Filter (mocking with updatedAt)
      const d = new Date(u.updatedAt);
      const now = new Date();
      if (userTimeFilter === "Today") return d.toDateString() === now.toDateString();
      if (userTimeFilter === "Week") return (now.getTime() - d.getTime()) < 7 * 86400000;
      if (userTimeFilter === "Month") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      if (userTimeFilter === "Year") return d.getFullYear() === now.getFullYear();
      if (userTimeFilter === "Custom" && userCustomStart && userCustomEnd) {
         const start = new Date(userCustomStart);
         const end = new Date(userCustomEnd);
         end.setHours(23, 59, 59);
         return d >= start && d <= end;
      }

      return true;
    });
  }, [users, userSearch, userTimeFilter, userCustomStart, userCustomEnd]);

  // Actions
  const handleClearBudgets = () => {
    if (timeFilter === "All" && groupFilter === "All" && moduleFilter === "All") {
       if (confirm("Clear ALL budgets? This cannot be undone.")) {
         setBudgets([]);
         showToast("Cleared", "All budgets removed", "success");
       }
       return;
    }

    if (confirm("Clear budgets matching current filters?")) {
      const idsToRemove = new Set(filteredBudgets.map(b => b.id));
      setBudgets(budgets.filter(b => !idsToRemove.has(b.id)));
      showToast("Cleared", `${idsToRemove.size} budgets removed`, "success");
    }
  };

  const handleClearUsers = () => {
    if (userTimeFilter === "All" && !userSearch) {
       if (confirm("Clear ALL user limits? This cannot be undone.")) {
         setUsers([]);
         showToast("Cleared", "All user limits removed", "success");
       }
       return;
    }

    if (confirm("Clear user limits matching current filters?")) {
      const idsToRemove = new Set(filteredUsers.map(u => u.id));
      setUsers(users.filter(u => !idsToRemove.has(u.id)));
      showToast("Cleared", `${idsToRemove.size} user limits removed`, "success");
    }
  };

  const handleIssue = (data: Partial<Budget>) => {
    const newBudget: Budget = {
      id: uid("B"),
      scope: "Group",
      period: "Monthly",
      capType: "Hard",
      hardCap: true,
      amountUGX: 0,
      usedUGX: 0,
      updatedAt: Date.now(),
      updatedBy: "You",
      group: "Operations",
      module: "All Modules",
      marketplace: "All",
      ...data,
    };
    setBudgets([newBudget, ...budgets]);
    setIsIssueOpen(false);
    showToast("Budget Issued", `Allocated ${formatUGX(newBudget.amountUGX)} to ${newBudget.group}`, "success");
    setHistory(prev => [{ id: uid("H"), ts: Date.now(), actor: "You", action: "Issued Budget", details: `Allocated ${formatUGX(newBudget.amountUGX)}` }, ...prev]);
  };

  const handleEdit = (id: string, updates: Partial<Budget>) => {
    setBudgets(budgets.map(b => b.id === id ? { ...b, ...updates, updatedAt: Date.now() } : b));
    setEditBudget(null);
    showToast("Budget Updated", "Changes saved successfully", "success");
    setHistory(prev => [{ id: uid("H"), ts: Date.now(), actor: "You", action: "Updated Budget", details: `Modified budget ${id}` }, ...prev]);
  };

  const handleUserEdit = (id: string, updates: Partial<UserRow>) => {
    setUsers(users.map(u => u.id === id ? { ...u, ...updates, updatedAt: Date.now() } : u));
    setEditUser(null);
    showToast("User Updated", "Limits and permissions updated", "success");
    setHistory(prev => [{ id: uid("H"), ts: Date.now(), actor: "You", action: "Updated User", details: `Modified user ${id}` }, ...prev]);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this budget?")) {
      setBudgets(budgets.filter(b => b.id !== id));
      showToast("Budget Deleted", "Budget removed successfully", "success");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <ToastStack toasts={toasts} onDismiss={(id) => setToasts(t => t.filter(x => x.id !== id))} />

      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur-sm md:px-6"> 
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Issued Budgets</h1>
              <p className="text-sm text-slate-500">Manage and audit budget allocations</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setIsHistoryOpen(true)} className="hidden h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:flex">
              <History className="h-4 w-4" /> History
            </button>
            <button className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              <Download className="h-4 w-4" /> Export
            </button>
            <button onClick={() => setIsIssueOpen(true)} className="flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 shadow-md shadow-emerald-200">
              <Plus className="h-4 w-4" /> Issue New
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-8 max-w-7xl px-4 md:px-6">
        <div className="grid gap-6">
          {/* Filters Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              {/* Time Pills */}
              <div className="flex overflow-x-auto rounded-xl bg-slate-100 p-1">
                {["All", "Today", "Week", "Month", "Year", "Custom"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTimeFilter(t)}
                    className={cn(
                      "rounded-lg px-4 py-1.5 text-xs font-semibold transition-all whitespace-nowrap",
                      timeFilter === t
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-900"
                    )}
                  >
                    {t === "All" ? "All time" : t}
                  </button>
                ))}
              </div>

              {/* Dropdowns */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <select
                    value={groupFilter}
                    onChange={(e) => setGroupFilter(e.target.value)}
                    className="h-9 appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-8 text-xs font-semibold text-slate-700 outline-none hover:border-slate-300"
                  >
                    <option value="All">All Groups</option>
                    {GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-4 w-4 text-slate-500" />
                </div>

                <div className="relative">
                  <select
                    value={moduleFilter}
                    onChange={(e) => setModuleFilter(e.target.value)}
                    className="h-9 appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-8 text-xs font-semibold text-slate-700 outline-none hover:border-slate-300"
                  >
                    <option value="All">All Modules</option>
                    {MODULES.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-4 w-4 text-slate-500" />
                </div>

                {/* Custom Date Pickers */}
                {timeFilter === 'Custom' && (
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs">
                    <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="bg-transparent outline-none" />
                    <span className="text-slate-400">-</span>
                    <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="bg-transparent outline-none" />
                  </div>
                )}

                <div className="h-6 w-px bg-slate-200" />

                {/* Clear / Delete Action */}
                <button 
                  onClick={handleClearBudgets}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold hover:bg-opacity-80 transition",
                    timeFilter === 'All' && groupFilter === 'All' && moduleFilter === 'All' 
                       ? "border-rose-200 bg-rose-50 text-rose-700" 
                       : "border-orange-200 bg-orange-50 text-orange-700"
                  )}
                >
                  <Trash2 className="h-3 w-3" />
                  {timeFilter === 'All' && groupFilter === 'All' && moduleFilter === 'All' ? "Clear All" : "Clear Period"}
                </button>

                <button 
                  onClick={() => { setGroupFilter("All"); setModuleFilter("All"); setTimeFilter("All"); setCustomStart(""); setCustomEnd(""); }}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                >
                  <RefreshCw className="h-3 w-3" /> Reset Filters
                </button>
              </div>
            </div>
          </div>

          {/* Table Card 1: Budgets */}
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            {filteredBudgets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="grid h-16 w-16 place-items-center rounded-full bg-slate-50 text-slate-300">
                  <PiggyBank className="h-8 w-8" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-slate-900">No budgets found</h3>
                <p className="max-w-xs text-sm text-slate-500">Try adjusting your filters or issue a new budget.</p>
                <button onClick={() => setIsIssueOpen(true)} className="mt-6 text-sm font-semibold text-emerald-600 hover:text-emerald-700">
                  Issue Budget
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-semibold text-slate-500">
                    <tr>
                      <th className="px-6 py-4">Group</th>
                      <th className="px-6 py-4">Module</th>
                      <th className="px-6 py-4">Marketplace</th>
                      <th className="px-6 py-4 text-right">Amount</th>
                      <th className="px-6 py-4">Period</th>
                      <th className="px-6 py-4 text-center">Hard Cap</th>
                      <th className="px-6 py-4 text-right">Issued At</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredBudgets.map((b) => (
                      <tr 
                        key={b.id} 
                        className="group hover:bg-slate-50/80 cursor-pointer transition-colors"
                        onClick={() => setEditBudget(b)}
                      >
                        <td className="px-6 py-4 font-semibold text-slate-900">{b.group}</td>
                        <td className="px-6 py-4 text-slate-600">
                          <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium">
                            {b.module === "All" || !b.module ? "All Modules" : b.module}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500">{b.marketplace || "All"}</td>
                        <td className="px-6 py-4 text-right font-bold text-emerald-600">{formatUGX(b.amountUGX)}</td>
                        <td className="px-6 py-4 text-slate-600">{b.period}</td>
                        <td className="px-6 py-4 text-center">
                          {b.hardCap ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                              <Check className="h-3 w-3" /> Enabled
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">Disabled</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right text-slate-500">
                          {new Date(b.updatedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={(e) => { e.stopPropagation(); setEditBudget(b); }}
                              className="rounded-lg p-2 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600"
                              title="Edit Budget"
                            >
                              <FileText className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDelete(b.id); }}
                              className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                              title="Delete Budget"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          <div className="text-center text-xs text-slate-400">
            Showing {filteredBudgets.length} of {budgets.length} total records
          </div>
        </div>

        {/* User Spend Limits Table Section */}
        <div className="mt-12 grid gap-6"> 
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">User Spend Limits</h2>
              <p className="text-sm text-slate-500">Individual caps and auto-approval eligibility</p>
            </div>
             {/* Main User Search */}
            <div className="flex items-center gap-3">
               <div className="relative">
                 <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                 <input 
                   value={userSearch}
                   onChange={(e) => setUserSearch(e.target.value)}
                   placeholder="Search users..." 
                   className="h-10 w-64 rounded-xl border border-slate-200 bg-white pl-9 pr-4 text-sm font-semibold outline-none focus:ring-4 focus:ring-emerald-100"
                 />
               </div>
            </div>
          </div>
          
          {/* User Filters Card */}
           <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              {/* Time Pills */}
              <div className="flex overflow-x-auto rounded-xl bg-slate-100 p-1">
                {["All", "Today", "Week", "Month", "Year", "Custom"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setUserTimeFilter(t)}
                    className={cn(
                      "rounded-lg px-4 py-1.5 text-xs font-semibold transition-all whitespace-nowrap",
                      userTimeFilter === t
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-900"
                    )}
                  >
                    {t === "All" ? "All time" : t}
                  </button>
                ))}
              </div>

              {/* Custom Date Pickers */}
               {userTimeFilter === 'Custom' && (
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs">
                    <input type="date" value={userCustomStart} onChange={e => setUserCustomStart(e.target.value)} className="bg-transparent outline-none" />
                    <span className="text-slate-400">-</span>
                    <input type="date" value={userCustomEnd} onChange={e => setUserCustomEnd(e.target.value)} className="bg-transparent outline-none" />
                  </div>
                )}
                
                {/* Clear / Delete Action */}
                <button 
                  onClick={handleClearUsers}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold hover:bg-opacity-80 transition",
                    userTimeFilter === 'All' && !userSearch
                       ? "border-rose-200 bg-rose-50 text-rose-700" 
                       : "border-orange-200 bg-orange-50 text-orange-700"
                  )}
                >
                  <Trash2 className="h-3 w-3" />
                  {userTimeFilter === 'All' && !userSearch ? "Clear All" : "Clear Period"}
                </button>

                {/* Reset Filters */}
                {userTimeFilter !== 'All' && (
                  <button 
                  onClick={() => { setUserTimeFilter("All"); setUserCustomStart(""); setUserCustomEnd(""); setUserSearch(""); }}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                >
                  <RefreshCw className="h-3 w-3" /> Reset Filters
                </button>
                )}
            </div>
           </div>


          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
             <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-semibold text-slate-500">
                    <tr>
                      <th className="px-6 py-4">User</th>
                      <th className="px-6 py-4">Role</th>
                      <th className="px-6 py-4">Group</th>
                      <th className="px-6 py-4 text-right">Limit</th>
                      <th className="px-6 py-4">Period</th>
                      <th className="px-6 py-4 text-center">Auto-Approve</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.length === 0 ? (
                        <tr>
                            <td colSpan={7} className="px-6 py-8 text-center text-slate-500">No users found matching filters.</td>
                        </tr>
                    ) : filteredUsers.map((u) => (
                      <tr 
                        key={u.id} 
                        className="group hover:bg-slate-50/80 cursor-pointer transition-colors"
                        onClick={() => setEditUser(u)}
                      >
                        <td className="px-6 py-4 font-semibold text-slate-900">{u.name}</td>
                        <td className="px-6 py-4 text-slate-600">{u.role}</td>
                        <td className="px-6 py-4 text-slate-600">
                          <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium">
                            {u.group}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-emerald-600">{formatUGX(u.limit)}</td>
                        <td className="px-6 py-4 text-slate-600">{u.period}</td>
                        <td className="px-6 py-4 text-center">
                          {u.autoApprove ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                              <Check className="h-3 w-3" /> Eligible
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={(e) => { e.stopPropagation(); setEditUser(u); }}
                              className="rounded-lg p-2 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600"
                              title="Edit User Limits"
                            >
                              <FileText className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          </div>
        </div>
      </div>

      {/* ISSUE BUDGET MODAL */}
      <IssueModal
        open={isIssueOpen}
        onClose={() => setIsIssueOpen(false)}
        onSave={handleIssue}
      />

      {/* EDIT BUDGET MODAL */}
      {editBudget && (
        <EditModal 
          budget={editBudget} 
          onClose={() => setEditBudget(null)} 
          onSave={(updates) => handleEdit(editBudget.id, updates)} 
        />
      )}

      {/* EDIT USER MODAL */}
      {editUser && (
        <UserLimitModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onSave={(updates) => handleUserEdit(editUser.id, updates)}
        />
      )}

      {/* HISTORY MODAL */}
      <HistoryModal
        open={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onClear={() => setHistory([])}
      />
    </div>
  );
}