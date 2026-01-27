import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Clock, Search, Filter } from "lucide-react";

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function Button({
  variant = "outline",
  className,
  children,
  onClick,
}: {
  variant?: "primary" | "outline" | "ghost";
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  const base = "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-4";
  const variants = {
    primary: "bg-[#03CD8C] text-white hover:opacity-90 focus:ring-emerald-200",
    outline: "border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 focus:ring-slate-200",
    ghost: "bg-transparent text-slate-700 hover:bg-slate-100 focus:ring-slate-200",
  };
  return (
    <button onClick={onClick} className={cn(base, variants[variant], className)}>
      {children}
    </button>
  );
}

export default function UserActivityLog() {
  const navigate = useNavigate();
  const { userId } = useParams();

  const events = [
    { id: 1, action: "Logged in", device: "Chrome on macOS", time: "Just now", ip: "192.168.1.1" },
    { id: 2, action: "Created purchase request", detail: "Software License #PR-921", time: "2 hours ago" },
    { id: 3, action: "Updated profile", detail: "Changed phone number", time: "Yesterday, 14:30" },
    { id: 4, action: "Logged in", device: "Safari on iPhone", time: "Yesterday, 09:12", ip: "10.0.0.5" },
    { id: 5, action: "Enabled 2FA", detail: "SMS Authentication", time: "Oct 24, 2023" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(-1)} className="rounded-full p-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="text-xl font-bold text-slate-900">Activity Log</div>
            <div className="text-sm text-slate-500">Timeline of user actions</div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
           <div className="flex flex-wrap gap-4 mb-6">
             <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 flex-1">
               <Search className="h-4 w-4 text-slate-400" />
               <input placeholder="Search activity..." className="flex-1 bg-transparent text-sm outline-none" />
             </div>
             <Button><Filter className="h-4 w-4" /> Filter</Button>
             <Button><Clock className="h-4 w-4" /> Date Range</Button>
           </div>

           <div className="relative border-l border-slate-200 ml-3 space-y-8 pl-8 py-2">
             {events.map((e) => (
               <div key={e.id} className="relative">
                 <div className="absolute -left-[39px] top-1 h-5 w-5 rounded-full border-4 border-white bg-slate-200" />
                 <div>
                   <div className="text-sm font-medium text-slate-900">{e.action}</div>
                   {e.detail && <div className="text-sm text-slate-600">{e.detail}</div>}
                   {e.device && <div className="text-xs text-slate-500">{e.device} • {e.ip}</div>}
                   <div className="mt-1 text-xs text-slate-400">{e.time}</div>
                 </div>
               </div>
             ))}
           </div>
        </div>
      </div>
    </div>
  );
}
