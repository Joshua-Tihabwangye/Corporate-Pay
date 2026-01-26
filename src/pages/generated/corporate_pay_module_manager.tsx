import React, { useState } from "react";
import { ArrowLeft, Check, ChevronRight, Layers, LayoutGrid, ShoppingBag, Truck, Zap, Search, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";

const EVZ = {
  green: "#03CD8C",
  orange: "#F77F00",
};

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function Pill({ label, tone = "neutral" }: { label: string; tone?: "good" | "warn" | "bad" | "info" | "neutral" }) {
  const map: Record<string, string> = {
    good: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    warn: "bg-amber-50 text-amber-800 ring-amber-200",
    bad: "bg-rose-50 text-rose-700 ring-rose-200",
    info: "bg-blue-50 text-blue-700 ring-blue-200",
    neutral: "bg-slate-50 text-slate-700 ring-slate-200",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1", map[tone])}>{label}</span>
  );
}

export default function ModuleManager() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Modules");

  const [modules, setModules] = useState([
    { id: "rides", name: "Rides & Logistics", desc: "Manage employee travel and goods delivery.", icon: <Truck className="h-6 w-6" />, enabled: true },
    { id: "ev", name: "EVs & Charging", desc: "Fleet charging management and reporting.", icon: <Zap className="h-6 w-6" />, enabled: true, beta: true },
    { id: "shop", name: "E-Commerce", desc: "Corporate procurement and marketplace access.", icon: <ShoppingBag className="h-6 w-6" />, enabled: true },
    { id: "workspace", name: "Virtual Workspace", desc: "Remote work tools and virtual office assets.", icon: <LayoutGrid className="h-6 w-6" />, enabled: false },
  ]);

  const toggleModule = (id: string) => {
    setModules(prev => prev.map(m => m.id === id ? { ...m, enabled: !m.enabled } : m));
  };

  return (
    <div className="min-h-screen" style={{ background: "radial-gradient(90% 60% at 50% 0%, rgba(3,205,140,0.18), rgba(255,255,255,0))" }}>
       <div className="mx-auto max-w-[95%] px-4 py-5 md:px-6">
         <div className="rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(2,8,23,0.10)]">
           {/* Header */}
           <div className="border-b border-slate-200 px-4 py-4 md:px-6">
              <div className="flex items-center gap-3">
                 <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-slate-100 rounded-full text-slate-500">
                    <ArrowLeft className="h-5 w-5" />
                 </button>
                 <div className="grid h-12 w-12 place-items-center rounded-2xl text-white" style={{ background: EVZ.green }}>
                    <Layers className="h-6 w-6" />
                 </div>
                 <div>
                    <h1 className="text-sm font-semibold text-slate-900">Module Enablement</h1>
                    <div className="mt-1 text-xs text-slate-500">Control active services for your organization</div>
                 </div>
              </div>
           </div>

           <div className="p-6">
              <div className="flex gap-2 mb-6 p-1 bg-slate-100 rounded-xl w-fit">
                  {["Modules", "Marketplaces", "Integrations"].map(tab => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={cn(
                            "px-4 py-2 text-sm font-semibold rounded-lg transition-all",
                            activeTab === tab ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                        )}
                      >
                          {tab}
                      </button>
                  ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {modules.map(m => (
                     <div key={m.id} className={cn(
                         "rounded-3xl border p-6 transition-all group relative overflow-hidden",
                         m.enabled ? "bg-white border-slate-200 shadow-sm" : "bg-slate-50 border-slate-200 opacity-90"
                     )}>
                        {m.enabled && <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-[100px] -mr-8 -mt-8 opacity-50 pointer-events-none" />}
                        
                        <div className="flex items-start justify-between mb-4 relative z-10">
                            <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center text-white shadow-sm transition-colors", m.enabled ? "bg-slate-900" : "bg-slate-400")}>
                                {m.icon}
                            </div>
                            <button 
                                onClick={() => toggleModule(m.id)}
                                className={cn("relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none", m.enabled ? "bg-emerald-500" : "bg-slate-300")}
                            >
                                 <span className={cn("inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm ml-1", m.enabled ? "translate-x-5" : "translate-x-0")} />
                            </button>
                        </div>
                        
                        <div className="relative z-10">
                            <div className="flex items-center gap-2">
                                <h3 className="text-base font-bold text-slate-900">{m.name}</h3>
                                {m.beta && <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded uppercase">Beta</span>}
                            </div>
                            <p className="text-sm text-slate-500 mt-1 min-h-[40px]">{m.desc}</p>
                        </div>
                        
                        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between relative z-10">
                            <Pill label={m.enabled ? "Active" : "Disabled"} tone={m.enabled ? "good" : "neutral"} />
                            {m.enabled && (
                                <button 
                                    onClick={() => navigate(`/console/settings/modules/${m.id}`)}
                                    className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition-colors hover:gap-2"
                                >
                                    Configure <ChevronRight className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                     </div>
                 ))}
              </div>
           </div>
         </div>
       </div>
    </div>
  );
}
