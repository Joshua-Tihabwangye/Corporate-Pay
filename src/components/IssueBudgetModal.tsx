import React, { useState } from 'react';
import { PiggyBank, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { BudgetStorage } from '../utils/budgetStorage';

function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function formatUGX(n: number) {
  const v = Math.round(Number(n || 0));
  return `UGX ${v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

const GROUPS = ["Operations", "Sales", "Finance", "Admin", "Procurement"];
const SERVICE_MODULES = [
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
const MARKETPLACES = [
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

// Simplified Button component
function Button({
  variant = "primary",
  onClick,
  children,
  className
}: {
  variant?: "primary" | "outline";
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-xl px-4 text-xs font-bold transition-all active:scale-95 disabled:pointer-events-none disabled:opacity-50",
        variant === "primary" 
          ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 hover:shadow-emerald-500/30"
          : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white",
        className
      )}
    >
      {children}
    </button>
  );
}

// Simplified Modal component to match Dashboard style
function Modal({
  open,
  title,
  subtitle,
  children,
  onClose,
  footer,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onClose: () => void;
  footer?: React.ReactNode;
}) {
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
            className="fixed inset-x-0 top-[10vh] z-50 mx-auto flex w-full max-w-3xl flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(2,8,23,0.22)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-none"
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
              <div>
                <div className="text-lg font-semibold text-slate-900 dark:text-white">{title}</div>
                {subtitle && <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</div>}
              </div>
              <button
                onClick={onClose}
                className="grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 scrollbar-thin dark:scrollbar-thumb-slate-700">
              {children}
            </div>
            {/* Footer */}
            {footer && (
              <div className="shrink-0 border-t border-slate-200 bg-slate-50 px-5 py-3 dark:border-slate-800 dark:bg-slate-950/50">
                {footer}
              </div>
            )}
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}

export function IssueBudgetModal({ 
  open, 
  onClose,
  onSuccess
}: { 
  open: boolean; 
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const [budgetDraft, setBudgetDraft] = useState({
    group: "Operations",
    module: "All",
    marketplace: "All",
    period: "Monthly",
    amount: 5000000,
    hardCap: true,
  });

  const handleSubmit = () => {
    BudgetStorage.add({
      id: uid(Math.random().toString(36)),
      group: budgetDraft.group,
      module: budgetDraft.module,
      marketplace: budgetDraft.marketplace,
      amount: Number(budgetDraft.amount),
      period: budgetDraft.period,
      hardCap: budgetDraft.hardCap,
      timestamp: new Date().toISOString()
    });
    
    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <Modal
        open={open}
        title="Issue budget"
        subtitle="Allocate budget to a group (and optionally module/marketplace)."
        onClose={onClose}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button variant="primary" onClick={handleSubmit}>
              <PiggyBank className="h-4 w-4" /> Issue
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <div className="text-xs font-semibold text-slate-600">Group</div>
            <select
              value={budgetDraft.group}
              onChange={(e) => setBudgetDraft((p) => ({ ...p, group: e.target.value }))}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none"
            >
              {GROUPS.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-600">Period</div>
            <select
              value={budgetDraft.period}
              onChange={(e) => setBudgetDraft((p) => ({ ...p, period: e.target.value }))}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none"
            >
              {"Weekly,Monthly,Quarterly,Annual".split(",").map((x) => (
                <option key={x} value={x}>{x}</option>
              ))}
            </select>
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-600">Service Module (optional)</div>
            <select
              value={budgetDraft.module}
              onChange={(e) => {
                const v = e.target.value;
                setBudgetDraft((p) => ({ ...p, module: v, marketplace: v === "E-Commerce" ? p.marketplace : "All" }));
              }}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none"
            >
              <option value="All">All</option>
              {SERVICE_MODULES.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div className={cn("", budgetDraft.module === "E-Commerce" ? "" : "opacity-60")}>
            <div className="text-xs font-semibold text-slate-600">Marketplace (optional)</div>
            <select
              value={budgetDraft.marketplace}
              disabled={budgetDraft.module !== "E-Commerce" && budgetDraft.module !== "All"}
              onChange={(e) => setBudgetDraft((p) => ({ ...p, marketplace: e.target.value }))}
              className={cn(
                "mt-2 w-full rounded-2xl border px-3 py-2.5 text-sm font-semibold outline-none",
                budgetDraft.module === "E-Commerce" || budgetDraft.module === "All" ? "border-slate-200 bg-white text-slate-900" : "border-slate-200 bg-slate-50 text-slate-500"
              )}
            >
              <option value="All">All</option>
              {MARKETPLACES.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-600">Amount (UGX)</div>
            <input
              type="number"
              min={0}
              onKeyDown={(e) => (e.key === "-" || e.key === "e") && e.preventDefault()}
              value={budgetDraft.amount}
              onChange={(e) => {
                const v = Number(e.target.value || 0);
                if (v >= 0) setBudgetDraft((p) => ({ ...p, amount: v }));
              }}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none"
            />
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-slate-900">Hard cap</div>
                <div className="mt-1 text-xs text-slate-600">Block spend when budget exceeded</div>
              </div>
              <button
                type="button"
                className={cn(
                  "relative h-7 w-12 rounded-full border transition",
                  budgetDraft.hardCap ? "border-emerald-300 bg-emerald-200" : "border-slate-200 bg-white"
                )}
                onClick={() => setBudgetDraft((p) => ({ ...p, hardCap: !p.hardCap }))}
                aria-label="Toggle hard cap"
              >
                <span
                  className={cn(
                    "absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition",
                    budgetDraft.hardCap ? "left-[22px]" : "left-1"
                  )}
                />
              </button>
            </div>
          </div>
          <div className="md:col-span-2 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700">
            Premium: high budget increases can require multi-level approvals.
          </div>
        </div>
      </Modal>
  );
}
