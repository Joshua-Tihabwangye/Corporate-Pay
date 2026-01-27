import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, RefreshCw, CheckCircle2, AlertTriangle, Building2, ShoppingBag, Store } from 'lucide-react';
import { useGroupsData, CostCenter } from '../../utils/groupsStorage';

export default function Simulation() {
    const navigate = useNavigate();
    const { findMapping, costCenters } = useGroupsData();

    // Inputs
    const [module, setModule] = useState('E-Commerce');
    const [vendor, setVendor] = useState('');
    const [amount, setAmount] = useState(100000);

    // Result
    const [result, setResult] = useState<{ cc: CostCenter | undefined; reason: string } | null>(null);

    const runSimulation = () => {
        const mapping = findMapping(module, vendor);
        let cc: CostCenter | undefined;
        let reason = "";

        if (mapping) {
            cc = costCenters.find(c => c.id === mapping.targetCostCenterId);
            reason = `Matched rule: "${mapping.rule}"`;
        } else {
            // Default logic? usually fallback to group default, but here we don't know the group. 
            // Let's assume generic fallback if no rule.
            reason = "No mapping rule found.";
        }
        setResult({ cc, reason });
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center pt-12">
            <div className="w-full max-w-2xl">
                <div className="flex items-center gap-4 mb-8">
                     <button onClick={() => navigate(-1)} className="h-10 w-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-100 transition shadow-sm">
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Transaction Simulation</h1>
                        <p className="text-slate-500">Test how transactions are mapped to cost centers</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Inputs */}
                    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm p-6 space-y-6">
                        <h2 className="font-bold text-slate-900 flex items-center gap-2">
                            <Play className="h-5 w-5 text-emerald-500" /> Transaction Details
                        </h2>
                        
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Service Module</label>
                            <div className="relative">
                                <ShoppingBag className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                <select 
                                  value={module}
                                  onChange={e => setModule(e.target.value)}
                                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white font-semibold outline-none focus:ring-2 focus:ring-emerald-500 appearance-none"
                                >
                                    <option>E-Commerce</option>
                                    <option>Rides & Logistics</option>
                                    <option>CorporatePay</option>
                                    <option>Shoppable Adz</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Vendor / Merchant</label>
                            <div className="relative">
                                <Store className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                <input 
                                  value={vendor}
                                  onChange={e => setVendor(e.target.value)}
                                  placeholder="e.g. Uber, Amazon, EV Charging"
                                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 font-semibold outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Amount (UGX)</label>
                            <input 
                              type="number"
                              value={amount}
                              onChange={e => setAmount(Number(e.target.value))}
                              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-semibold outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>

                        <button 
                          onClick={runSimulation}
                          className="w-full py-3 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition shadow-lg shadow-slate-900/10"
                        >
                            Simulate Transaction
                        </button>
                    </div>

                    {/* Output */}
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 flex flex-col">
                        <h2 className="font-bold text-slate-900 flex items-center gap-2 mb-6">
                            <CheckCircle2 className="h-5 w-5 text-blue-500" /> Mapping Result
                        </h2>

                        {result ? (
                            <div className="flex-1 flex flex-col justify-center animate-in fade-in slide-in-from-bottom-4">
                                {result.cc ? (
                                    <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-sm text-center space-y-2">
                                        <div className="mx-auto h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-2">
                                            <Building2 className="h-6 w-6" />
                                        </div>
                                        <div className="text-sm font-bold text-slate-400 uppercase tracking-wider">Assigned Cost Center</div>
                                        <div className="text-2xl font-bold text-slate-900">{result.cc.name}</div>
                                        <div className="text-sm font-mono text-slate-500 bg-slate-100 inline-block px-2 py-1 rounded">{result.cc.code}</div>
                                        
                                        <div className="pt-4 mt-4 border-t border-slate-100 text-xs text-slate-500">
                                            {result.reason}
                                        </div>

                                        <div className="pt-2 text-xs">
                                            {result.cc.spendLimitUGX && amount > result.cc.spendLimitUGX ? (
                                                <div className="text-rose-600 font-bold flex items-center justify-center gap-1">
                                                    <AlertTriangle className="h-3 w-3" /> Exceeds Limit ({result.cc.spendLimitUGX})
                                                </div>
                                            ) : (
                                                <div className="text-emerald-600 font-bold flex items-center justify-center gap-1">
                                                    <CheckCircle2 className="h-3 w-3" /> Within Budget
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-white rounded-2xl p-6 border border-amber-200 shadow-sm text-center">
                                        <div className="mx-auto h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 mb-3">
                                            <AlertTriangle className="h-6 w-6" />
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-900">No Match Found</h3>
                                        <p className="text-slate-500 text-sm mt-1">Transaction would require manual cost center selection.</p>
                                    </div>
                                )}

                                <button onClick={() => setResult(null)} className="mt-8 mx-auto flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900">
                                    <RefreshCw className="h-3 w-3" /> Reset
                                </button>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-sm">
                                <div className="p-4 rounded-full bg-slate-100 mb-3">
                                    <Play className="h-6 w-6 text-slate-300" />
                                </div>
                                <p>Enter details and click Simulate to see results.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
