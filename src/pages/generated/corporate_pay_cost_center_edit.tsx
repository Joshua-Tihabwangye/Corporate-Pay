import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, DollarSign, Tag, Info, Building2, BarChart3, History, Shield, AlertTriangle } from "lucide-react";
import { useGroupsData, CostCenter } from "../../utils/groupsStorage";

function formatUGX(n: number) {
  return `UGX ${n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

export default function CostCenterEdit() {
  const navigate = useNavigate();
  const { costCenterId } = useParams();
  const { costCenters, updateCostCenter, payments, refresh } = useGroupsData();
  
  const [cc, setCc] = useState<CostCenter | null>(null);
  const [loading, setLoading] = useState(true);

  // Form State
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [limit, setLimit] = useState(0);
  const [tagsRequired, setTagsRequired] = useState(false);
  const [description, setDescription] = useState("");

  useEffect(() => {
    const found = costCenters.find(c => c.id === costCenterId);
    if (found) {
        setCc(found);
        setName(found.name);
        setCode(found.code);
        setLimit(found.spendLimitUGX || 0);
        setTagsRequired(found.tagsRequired);
        setDescription(found.description || "");
    }
    setLoading(false);
  }, [costCenterId, costCenters]);

  const handleSave = () => {
    if (!cc) return;
    updateCostCenter(cc.id, {
        name,
        code,
        spendLimitUGX: limit,
        tagsRequired,
        description
    });
    alert("Changes saved successfully");
    navigate(-1);
  };

  if (loading) return <div className="p-10 text-center">Loading...</div>;
  if (!cc) return <div className="p-10 text-center">Cost Center not found</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-900 pb-20">
      
      {/* Header */}
      <div className="mx-auto max-w-5xl mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="h-10 w-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-100 transition shadow-sm">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
             <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Edit Cost Center</h1>
                <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded text-xs font-mono font-bold">{cc.code}</span>
             </div>
             <p className="text-slate-500 font-medium">Configure spending rules and limits</p>
          </div>
        </div>
        <div className="flex gap-3">
             <button onClick={() => navigate(-1)} className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition">Cancel</button>
             <button onClick={handleSave} className="flex items-center gap-2 px-5 py-2 font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-lg shadow-slate-900/20 transition-all hover:scale-[1.02]">
                 <Check className="h-4 w-4" /> Save Changes
             </button>
        </div>
      </div>

      <div className="mx-auto max-w-5xl grid grid-cols-1 lg:grid-cols-3 gap-6">
         
         {/* Main Settings */}
         <div className="lg:col-span-2 space-y-6">
             <div className="rounded-3xl border border-slate-200 bg-white shadow-sm p-6 md:p-8">
                 <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                     <Building2 className="h-5 w-5 text-emerald-600" /> General Information
                 </h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-2">
                         <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cost Center Name</label>
                         <input 
                           value={name} 
                           onChange={e => setName(e.target.value)}
                           className="w-full px-4 py-3 rounded-xl border border-slate-200 font-semibold outline-none focus:ring-2 focus:ring-emerald-500 transition" 
                         />
                     </div>
                     <div className="space-y-2">
                         <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Accounting Code</label>
                         <input 
                           value={code} 
                           onChange={e => setCode(e.target.value)}
                           className="w-full px-4 py-3 rounded-xl border border-slate-200 font-mono font-semibold outline-none focus:ring-2 focus:ring-emerald-500 transition" 
                         />
                     </div>
                     <div className="md:col-span-2 space-y-2">
                         <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Description</label>
                         <textarea 
                           value={description} 
                           onChange={e => setDescription(e.target.value)}
                           rows={3}
                           className="w-full px-4 py-3 rounded-xl border border-slate-200 font-medium text-slate-600 outline-none focus:ring-2 focus:ring-emerald-500 transition resize-none" 
                         />
                     </div>
                 </div>
             </div>

             <div className="rounded-3xl border border-slate-200 bg-white shadow-sm p-6 md:p-8">
                 <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                     <Shield className="h-5 w-5 text-indigo-600" /> Controls & Limits
                 </h2>
                 <div className="space-y-6">
                     <div>
                         <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Monthly Spend Limit</label>
                         <div className="mt-2 relative">
                             <DollarSign className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                             <input 
                               type="number"
                               value={limit} 
                               onChange={e => setLimit(Number(e.target.value))}
                               className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 font-bold text-lg text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 transition" 
                             />
                         </div>
                         <p className="mt-2 text-xs text-slate-500 flex items-center gap-1">
                             <Info className="h-3 w-3" /> Transactions exceeding this amount will require executive approval.
                         </p>
                     </div>

                     <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex items-start sm:items-center justify-between gap-4">
                         <div className="flex items-start gap-3">
                             <div className="h-10 w-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
                                 <Tag className="h-5 w-5" />
                             </div>
                             <div>
                                 <div className="font-bold text-slate-900">Enforce Tagging</div>
                                 <div className="text-xs text-slate-500">Require employees to select project tags for this cost center.</div>
                             </div>
                         </div>
                         <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={tagsRequired} onChange={e => setTagsRequired(e.target.checked)} />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                     </div>
                 </div>
             </div>
         </div>

         {/* Stats Sidebar */}
         <div className="space-y-6">
             <div className="rounded-3xl border border-slate-200 bg-white shadow-sm p-6">
                 <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">Current Month Usage</h3>
                 <div className="flex items-end gap-2 mb-2">
                     <span className="text-3xl font-bold text-slate-900">32%</span>
                     <span className="text-sm font-medium text-slate-500 mb-1">used</span>
                 </div>
                 <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden mb-2">
                     <div className="h-full bg-emerald-500 w-[32%]" />
                 </div>
                 <div className="flex justify-between text-xs font-semibold text-slate-500">
                     <span>{formatUGX(limit * 0.32)}</span>
                     <span>{formatUGX(limit)}</span>
                 </div>
             </div>

             <div className="rounded-3xl border border-slate-200 bg-white shadow-sm p-6">
                 <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 flex items-center gap-2">
                     <History className="h-4 w-4" /> Recent Activity
                 </h3>
                 <div className="space-y-4">
                     {[1,2,3].map(i => (
                         <div key={i} className="flex items-center justify-between text-sm">
                             <div className="flex items-center gap-2">
                                 <div className="h-2 w-2 rounded-full bg-slate-300" />
                                 <span className="text-slate-600">Uber Trip</span>
                             </div>
                             <span className="font-semibold text-slate-900">- UGX 25,000</span>
                         </div>
                     ))}
                     <div className="pt-2 border-t border-slate-100 text-center">
                         <button className="text-xs font-bold text-indigo-600 hover:text-indigo-700">View All Transactions</button>
                     </div>
                 </div>
             </div>

             <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                    <div>
                        <div className="font-bold text-amber-900 text-sm">Audit Note</div>
                        <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                            Changes to spend limits are logged and may notify the Finance team. Please ensure this change is authorized.
                        </p>
                    </div>
                </div>
             </div>
         </div>

      </div>
    </div>
  );
}
