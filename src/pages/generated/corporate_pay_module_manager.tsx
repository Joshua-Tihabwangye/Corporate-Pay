import React, { useState } from "react";
import { ArrowLeft, Box, Check, ChevronRight, Layers, LayoutGrid, Search, ShoppingBag, Truck, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

export default function ModuleManager() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Modules");

  const modules = [
    { name: "Rides & Logistics", desc: "Manage employee travel and goods delivery.", icon: <Truck className="h-6 w-6" />, enabled: true },
    { name: "EVs & Charging", desc: "Fleet charging management and reporting.", icon: <Zap className="h-6 w-6" />, enabled: true },
    { name: "E-Commerce", desc: "Corporate procurement and marketplace access.", icon: <ShoppingBag className="h-6 w-6" />, enabled: true },
    { name: "Virtual Workspace", desc: "Remote work tools and virtual office assets.", icon: <LayoutGrid className="h-6 w-6" />, enabled: false },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
       <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4">
             <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-slate-100 rounded-full text-slate-500">
                <ArrowLeft className="h-5 w-5" />
             </button>
             <div>
                <h1 className="text-lg font-bold text-slate-900">Module & Marketplace Enablement</h1>
                <p className="text-xs text-slate-500">Control which services are available to your organization</p>
             </div>
          </div>
       </div>

       <div className="max-w-5xl mx-auto p-6">
          <div className="flex gap-4 mb-6 border-b border-slate-200">
              {["Modules", "Marketplaces", "Integrations"].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                        "px-4 py-2 text-sm font-semibold border-b-2 transition-colors",
                        activeTab === tab ? "border-emerald-500 text-emerald-600" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                    )}
                  >
                      {tab}
                  </button>
              ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {modules.map(m => (
                 <div key={m.name} className={cn(
                     "rounded-3xl border p-6 transition-all group",
                     m.enabled ? "bg-white border-slate-200" : "bg-slate-50 border-slate-200 opacity-75"
                 )}>
                    <div className="flex items-start justify-between mb-4">
                        <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center text-white shadow-sm", m.enabled ? "bg-emerald-500" : "bg-slate-400")}>
                            {m.icon}
                        </div>
                        <div className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2">
                             <input type="checkbox" checked={m.enabled} readOnly className="peer sr-only" />
                             <span className={cn("h-6 w-11 rounded-full transition-colors", m.enabled ? "bg-emerald-600" : "bg-slate-200")} />
                             <span className={cn("absolute left-0.5 top-0.5 h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform", m.enabled ? "translate-x-5" : "translate-x-0")} />
                        </div>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">{m.name}</h3>
                    <p className="text-sm text-slate-500 mt-1 min-h-[40px]">{m.desc}</p>
                    
                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                        <span className={cn("text-xs font-bold px-2 py-1 rounded-full", m.enabled ? "bg-emerald-50 text-emerald-700" : "bg-slate-200 text-slate-500")}>
                            {m.enabled ? "Active" : "Disabled"}
                        </span>
                        {m.enabled && (
                            <button className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                                Configure <ChevronRight className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                 </div>
             ))}
          </div>
       </div>
    </div>
  );
}
