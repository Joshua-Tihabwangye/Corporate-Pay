import React, { useState } from "react";
import { ArrowLeft, Save, Sliders, Truck, Zap, ShoppingBag, LayoutGrid, Shield, CreditCard, Bell, Users } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

const EVZ = {
  green: "#03CD8C",
  orange: "#F77F00",
};

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function Button({
  variant = "outline",
  className,
  children,
  onClick,
  disabled,
}: {
  variant?: "primary" | "accent" | "outline" | "ghost" | "danger";
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
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
    <button type="button" disabled={disabled} onClick={onClick} style={style} className={cn(base, variants[variant], disabled && "cursor-not-allowed opacity-60", className)}>
      {children}
    </button>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
    return (
        <div className="flex items-center justify-between py-3">
            <span className="text-sm font-medium text-slate-700">{label}</span>
            <button 
                onClick={() => onChange(!checked)}
                className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none"
                style={{ backgroundColor: checked ? EVZ.green : '#e2e8f0' }}
            >
                <span className={cn("inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ml-1", checked ? "translate-x-5" : "translate-x-0")} />
            </button>
        </div>
    );
}

export default function ModuleSettings() {
  const navigate = useNavigate();
  const { moduleId } = useParams();

  const moduleConfig: Record<string, { name: string; icon: React.ReactNode; desc: string }> = {
      "rides": { name: "Rides & Logistics", icon: <Truck className="h-6 w-6" />, desc: "Vendor preferences, ride policies, and delivery zones." },
      "ev": { name: "EVs & Charging", icon: <Zap className="h-6 w-6" />, desc: "Fleet charging limits, provider roaming, and sustainability reporting." },
      "shop": { name: "E-Commerce", icon: <ShoppingBag className="h-6 w-6" />, desc: "Marketplace restrictions, approval workflows, and preferred categories." },
      "workspace": { name: "Virtual Workspace", icon: <LayoutGrid className="h-6 w-6" />, desc: "Software subscription limits and asset provisioning." },
  };

  const info = moduleConfig[moduleId || ""] || { name: "Module Configuration", icon: <Sliders className="h-6 w-6" />, desc: "General settings" };

  const [settings, setSettings] = useState({
      autoApproval: true,
      requireReceipts: true,
      allowOverseas: false,
      dailyLimit: "500,000",
      notifications: true,
  });

  return (
    <div className="min-h-screen" style={{ background: "radial-gradient(90% 60% at 50% 0%, rgba(3,205,140,0.18), rgba(255,255,255,0))" }}>
       <div className="mx-auto max-w-3xl px-4 py-8 md:px-6">
         <div className="rounded-[28px] border border-slate-200 bg-white shadow-xl">
           {/* Header */}
           <div className="border-b border-slate-200 px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-slate-100 rounded-full text-slate-500">
                    <ArrowLeft className="h-5 w-5" />
                 </button>
                 <div className="grid h-12 w-12 place-items-center rounded-2xl text-white shadow-md" style={{ background: EVZ.green }}>
                    {info.icon}
                 </div>
                 <div>
                    <h1 className="text-lg font-bold text-slate-900">{info.name} Settings</h1>
                    <p className="text-sm text-slate-500">{info.desc}</p>
                 </div>
              </div>
              <Button variant="primary" onClick={() => navigate(-1)}>
                  <Save className="h-4 w-4 mr-2" /> Save Changes
              </Button>
           </div>

           <div className="p-8 space-y-8">
               {/* General Policies */}
               <section>
                   <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                       <Shield className="h-4 w-4" /> General Policies
                   </h3>
                   <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200 space-y-2">
                       <Toggle label="Auto-approve requests under limit" checked={settings.autoApproval} onChange={v => setSettings({...settings, autoApproval: v})} />
                       <div className="h-px bg-slate-200" />
                       <Toggle label="Require receipts for all transactions" checked={settings.requireReceipts} onChange={v => setSettings({...settings, requireReceipts: v})} />
                       <div className="h-px bg-slate-200" />
                       <Toggle label="Allow international vendors" checked={settings.allowOverseas} onChange={v => setSettings({...settings, allowOverseas: v})} />
                   </div>
               </section>

               {/* Limits */}
               <section>
                   <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                       <CreditCard className="h-4 w-4" /> Spending Controls
                   </h3>
                   <div className="rounded-3xl border border-slate-200 p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div>
                           <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Daily Transaction Limit (UGX)</label>
                           <input 
                               value={settings.dailyLimit}
                               onChange={(e) => setSettings({...settings, dailyLimit: e.target.value})}
                               className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-emerald-100"
                           />
                       </div>
                       <div>
                           <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Monthly Rolling Limit</label>
                           <div className="w-full border border-slate-200 bg-slate-50 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-400 cursor-not-allowed">
                               Unlimited (Global Cap Applies)
                           </div>
                       </div>
                   </div>
               </section>

               {/* Notifications */}
               <section>
                   <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                       <Bell className="h-4 w-4" /> Notifications
                   </h3>
                   <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-center justify-between">
                       <div>
                           <div className="text-sm font-semibold text-slate-900">Real-time Alerts</div>
                           <div className="text-xs text-slate-500 mt-1">Notify admins on large transactions or policy violations immediately.</div>
                       </div>
                       <Toggle label="" checked={settings.notifications} onChange={v => setSettings({...settings, notifications: v})} />
                   </div>
               </section>

               {/* Access Control (Placeholder) */}
               <section className="opacity-70">
                   <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                       <Users className="h-4 w-4" /> Group Access
                   </h3>
                   <div className="border border-dashed border-slate-300 rounded-3xl p-6 text-center">
                       <p className="text-sm text-slate-500">Access control settings are managed in the Roles & Permissions page.</p>
                       <button className="text-emerald-600 text-xs font-bold mt-2 hover:underline">Manage Roles</button>
                   </div>
               </section>
           </div>
         </div>
       </div>
    </div>
  );
}
