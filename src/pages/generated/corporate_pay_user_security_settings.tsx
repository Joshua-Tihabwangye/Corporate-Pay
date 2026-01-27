import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Shield, Smartphone, Monitor, LogOut, Check } from "lucide-react";

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function Button({
  variant = "outline",
  className,
  children,
  onClick,
}: {
  variant?: "primary" | "outline" | "ghost" | "danger";
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  const base = "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-4";
  const variants = {
    primary: "bg-[#03CD8C] text-white hover:opacity-90 focus:ring-emerald-200",
    outline: "border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 focus:ring-slate-200",
    ghost: "bg-transparent text-slate-700 hover:bg-slate-100 focus:ring-slate-200",
    danger: "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 focus:ring-rose-100",
  };
  return (
    <button onClick={onClick} className={cn(base, variants[variant], className)}>
      {children}
    </button>
  );
}

export default function UserSecuritySettings() {
  const navigate = useNavigate();
  const { userId } = useParams();
  
  const [twoFAEnabled, setTwoFAEnabled] = useState(true);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(-1)} className="rounded-full p-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="text-xl font-bold text-slate-900">Security Settings</div>
            <div className="text-sm text-slate-500">Manage account security and sessions</div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-emerald-50 p-3 text-emerald-600">
               <Shield className="h-6 w-6" />
            </div>
            <div className="flex-1">
               <div className="font-semibold text-slate-900">Two-Factor Authentication</div>
               <div className="text-sm text-slate-500 mt-1">Add an extra layer of security to your account.</div>
               <div className="mt-4 flex items-center gap-3">
                 <Button variant={twoFAEnabled ? "outline" : "primary"} onClick={() => setTwoFAEnabled(!twoFAEnabled)}>
                   {twoFAEnabled ? "Disable 2FA" : "Enable 2FA"}
                 </Button>
                 {twoFAEnabled && <span className="text-sm font-medium text-emerald-600 flex items-center gap-1"><Check className="h-4 w-4" /> Enabled</span>}
               </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
           <div className="font-semibold text-slate-900 mb-4">Active Sessions</div>
           <div className="space-y-4">
             <div className="flex items-center justify-between border-b border-slate-100 pb-4">
               <div className="flex items-center gap-4">
                 <div className="rounded-xl bg-slate-100 p-2"><Monitor className="h-5 w-5 text-slate-600" /></div>
                 <div>
                   <div className="font-medium text-slate-900">Chrome on macOS</div>
                   <div className="text-xs text-slate-500">Kampala, UG • Current Session</div>
                 </div>
               </div>
               <div className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">Active</div>
             </div>

             <div className="flex items-center justify-between">
               <div className="flex items-center gap-4">
                 <div className="rounded-xl bg-slate-100 p-2"><Smartphone className="h-5 w-5 text-slate-600" /></div>
                 <div>
                   <div className="font-medium text-slate-900">Safari on iPhone</div>
                   <div className="text-xs text-slate-500">Kampala, UG • 2 hours ago</div>
                 </div>
               </div>
               <Button variant="outline" className="text-xs py-1 h-8">Revoke</Button>
             </div>
           </div>
           
           <div className="mt-6 pt-4 border-t border-slate-100">
             <Button variant="danger" className="w-full justify-center">
               <LogOut className="h-4 w-4" /> Sign out of all other sessions
             </Button>
           </div>
        </div>
      </div>
    </div>
  );
}
