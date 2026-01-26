import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Check,
  ChevronDown,
  Download,
  Filter,
  Layers,
  MoreVertical,
  PiggyBank,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Trash2,
  Wallet,
  X
} from 'lucide-react';
import { BudgetStorage, type Budget } from '../../utils/budgetStorage';
import { IssueBudgetModal } from '../../components/IssueBudgetModal';

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
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
  "School & E-Learning",
  "Medical & Health Care",
  "Travel & Tourism",
  "Green Investments",
  "FaithHub",
  "Virtual Workspace",
  "Finance & Payments",
  "Other Service Module",
];

export default function CorpayIssuedBudgets() {
  const navigate = useNavigate();
  const [budgets, setBudgets] = useState<Budget[]>(() => BudgetStorage.getAll());
  const [loading, setLoading] = useState(false);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);

  // Filters
  const [timeFilter, setTimeFilter] = useState<'All' | 'Today' | 'Week' | 'Month' | 'Year' | 'Custom'>('All');
  const [groupFilter, setGroupFilter] = useState('All');
  const [moduleFilter, setModuleFilter] = useState('All');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Subscribe to storage changes
  useEffect(() => {
    const handleUpdate = () => setBudgets(BudgetStorage.getAll());
    window.addEventListener('budget-storage-update', handleUpdate);
    return () => window.removeEventListener('budget-storage-update', handleUpdate);
  }, []);

  const filteredBudgets = useMemo(() => {
    let out = budgets;

    // Group
    if (groupFilter !== 'All') {
      out = out.filter(b => b.group === groupFilter);
    }

    // Module
    if (moduleFilter !== 'All') {
      out = out.filter(b => b.module === moduleFilter);
    }

    // Time
    const now = new Date();
    out = out.filter(b => {
      const d = new Date(b.timestamp);
      if (timeFilter === 'All') return true;
      if (timeFilter === 'Today') {
        return d.toDateString() === now.toDateString();
      }
      if (timeFilter === 'Week') {
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);
        return d >= weekAgo;
      }
      if (timeFilter === 'Month') {
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }
      if (timeFilter === 'Year') {
        return d.getFullYear() === now.getFullYear();
      }
      if (timeFilter === 'Custom' && customStart && customEnd) {
        return d >= new Date(customStart) && d <= new Date(customEnd);
      }
      return true;
    });

    return out;
  }, [budgets, groupFilter, moduleFilter, timeFilter, customStart, customEnd]);

  const handleClearAll = () => {
    if (confirm('Are you sure you want to delete ALL budgets?')) {
      BudgetStorage.clearAll();
    }
  };

  const handleClearPeriod = () => {
    if (timeFilter === 'All') return;
    if (confirm(`Delete all budgets from filter "${timeFilter}"?`)) {
      // Re-use logic to identify what to KEEP
      BudgetStorage.clearByPeriod((b) => {
        // Return TRUE if it matches the current filter (to be deleted)
        const d = new Date(b.timestamp);
        const now = new Date();
        
        if (timeFilter === 'Today') return d.toDateString() === now.toDateString();
        if (timeFilter === 'Week') {
            const weekAgo = new Date(now);
            weekAgo.setDate(now.getDate() - 7);
            return d >= weekAgo;
        }
        if (timeFilter === 'Month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        if (timeFilter === 'Year') return d.getFullYear() === now.getFullYear();
        if (timeFilter === 'Custom' && customStart && customEnd) return d >= new Date(customStart) && d <= new Date(customEnd);
        return false;
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 px-4 py-4 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80 md:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(-1)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">Issued Budgets</h1>
              <p className="text-sm text-slate-500">Manage and audit budget allocations</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
              <Download className="h-4 w-4" /> Export
            </button>
            <button 
              onClick={() => setIsIssueModalOpen(true)} 
              className="flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4" /> Issue New
            </button>
          </div>
        </div>
      </div>
      
      <IssueBudgetModal 
        open={isIssueModalOpen} 
        onClose={() => setIsIssueModalOpen(false)} 
        onSuccess={() => {
           // Storage update event handles the state update, but we can do extra logic here if needed
        }}
      />

      <div className="mx-auto mt-8 max-w-7xl px-4 md:px-6">
        <div className="grid gap-6">
          {/* Filters */}
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              {/* Time Tabs */}
              <div className="flex overflow-x-auto rounded-xl bg-slate-100 p-1 dark:bg-slate-950">
                {(['All', 'Today', 'Week', 'Month', 'Year', 'Custom'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setTimeFilter(t)}
                    className={cn(
                      "rounded-lg px-4 py-1.5 text-xs font-semibold transition-all whitespace-nowrap",
                      timeFilter === t
                        ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                        : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                    )}
                  >
                    {t === 'All' ? 'All time' : t}
                  </button>
                ))}
              </div>

              {/* Dropdowns */}
              <div className="flex flex-wrap items-center gap-3">
                {timeFilter === 'Custom' && (
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs dark:border-slate-800 dark:bg-slate-900">
                    <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="bg-transparent outline-none dark:text-white" />
                    <span className="text-slate-400">-</span>
                    <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="bg-transparent outline-none dark:text-white" />
                  </div>
                )}
                
                <div className="relative">
                  <select
                    value={groupFilter}
                    onChange={e => setGroupFilter(e.target.value)}
                    className="h-9 appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-8 text-xs font-semibold text-slate-700 outline-none hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                  >
                    <option value="All">All Groups</option>
                    {GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-4 w-4 text-slate-500" />
                </div>

                <div className="relative">
                  <select
                    value={moduleFilter}
                    onChange={e => setModuleFilter(e.target.value)}
                    className="h-9 appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-8 text-xs font-semibold text-slate-700 outline-none hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                  >
                    <option value="All">All Modules</option>
                    {MODULES.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-4 w-4 text-slate-500" />
                </div>

                <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />

                 {/* Clear Actions */}
                 {timeFilter !== 'All' && (
                  <button 
                    onClick={handleClearPeriod}
                    className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 dark:border-rose-900/30 dark:bg-rose-900/20 dark:text-rose-400"
                  >
                    <Trash2 className="h-3 w-3" /> Clear {timeFilter}
                  </button>
                 )}
                 
                 <button 
                    onClick={handleClearAll}
                    disabled={budgets.length === 0}
                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
                  >
                    <Trash2 className="h-3 w-3" /> Clear All
                  </button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            {filteredBudgets.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-20 text-center">
                 <div className="grid h-16 w-16 place-items-center rounded-full bg-slate-50 text-slate-300 dark:bg-slate-800 dark:text-slate-600">
                   <PiggyBank className="h-8 w-8" />
                 </div>
                 <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">No budgets found</h3>
                 <p className="max-w-xs text-sm text-slate-500">There are no budgets matching your current filters.</p>
                 <button 
                   onClick={() => {
                     setTimeFilter('All');
                     setGroupFilter('All');
                     setModuleFilter('All');
                   }}
                   className="mt-6 text-sm font-semibold text-emerald-600 hover:text-emerald-700"
                 >
                   Reset filters
                 </button>
               </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-semibold text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                    <tr>
                      <th className="px-6 py-4">Group</th>
                      <th className="px-6 py-4">Module</th>
                      <th className="px-6 py-4">Marketplace</th>
                      <th className="px-6 py-4 text-right">Amount</th>
                      <th className="px-6 py-4">Period</th>
                      <th className="px-6 py-4 text-center">Hard Cap</th>
                      <th className="px-6 py-4 text-right">Issued At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredBudgets.map((b) => (
                      <tr key={b.id} className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                        <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{b.group}</td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                          <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            {b.module === 'All' ? 'All Modules' : b.module}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{b.marketplace}</td>
                        <td className="px-6 py-4 text-right font-bold text-emerald-600 dark:text-emerald-400">{formatUGX(b.amount)}</td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{b.period}</td>
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
                          {new Date(b.timestamp).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
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
      </div>
    </div>
  );
}
