import React, { useState, useEffect } from "react";
import { ArrowLeft, Check, CheckCircle2, ChevronRight, Circle, PlayCircle, Rocket, ShieldCheck, Sparkles, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

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
  variant?: "primary" | "accent" | "outline" | "ghost" | "danger" | "white";
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
    white: "bg-white text-slate-900 hover:bg-slate-50 shadow-lg border border-transparent",
  };
  const style = variant === "primary" ? { background: EVZ.green } : variant === "accent" ? { background: EVZ.orange } : undefined;
  return (
    <button type="button" disabled={disabled} onClick={onClick} style={style} className={cn(base, variants[variant], disabled && "cursor-not-allowed opacity-60", className)}>
      {children}
    </button>
  );
}

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
          <motion.div className="fixed inset-0 z-40 bg-black/35" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-x-0 top-[10vh] z-50 mx-auto w-[min(600px,calc(100vw-2rem))] overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(2,8,23,0.22)]"
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
              <div>
                <div className="text-lg font-semibold text-slate-900">{title}</div>
                {subtitle ? <div className="mt-1 text-sm text-slate-600">{subtitle}</div> : null}
              </div>
              <button className="rounded-2xl p-2 text-slate-600 hover:bg-slate-100" onClick={onClose}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5">{children}</div>
            {footer ? <div className="border-t border-slate-200 px-5 py-4">{footer}</div> : null}
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}

function CheckItem({ label, status }: { label: string; status: "Pass" | "Fail" | "Pending" }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-3">
      <div className="flex items-center gap-3">
        <div className={cn("grid h-6 w-6 place-items-center rounded-full", status === "Pass" ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400")}>
           {status === "Pass" ? <Check className="h-3.5 w-3.5" /> : <div className="h-1.5 w-1.5 rounded-full bg-current" />}
        </div>
        <span className={cn("text-sm font-medium", status === "Pass" ? "text-slate-900" : "text-slate-500")}>{label}</span>
      </div>
      {status === "Pass" && <span className="text-xs font-semibold text-emerald-600">Passed</span>}
      {status === "Pending" && <span className="text-xs text-slate-400">Waiting...</span>}
    </div>
  );
}

export default function GoLiveChecklist() {
  const navigate = useNavigate();

  const categories = [
    {
        name: "Organization Setup",
        path: "/console/settings/org/setup",
        items: [
            { label: "Complete Company Profile", status: "Done" },
            { label: "Add at least one Invoice Group", status: "Done" },
            { label: "Verify Billing Contact Email", status: "Done" },
        ]
    },
    {
        name: "Compliance",
        path: "/console/settings/org/kyb",
        items: [
            { label: "Submit KYB Documents", status: "Done" },
            { label: "KYB Verification Approval", status: "Done" },
        ]
    },
    {
        name: "Financials",
        path: "/console/settings/billing",
        items: [
            { label: "Set Organization Budget Cap", status: "In Progress" },
            { label: "Add Funds to Wallet (Prepaid)", status: "Pending" },
        ]
    },
    {
        name: "Team Access",
        path: "/console/settings/roles",
        items: [
            { label: "Invite Finance Administrator", status: "Pending" },
            { label: "Set up Employee Groups", status: "Pending" },
        ]
    }
  ];

  const totalItems = categories.reduce((a, b) => a + b.items.length, 0);
  const doneItems = categories.reduce((a, b) => a + b.items.filter(i => i.status === "Done").length, 0);
  const progress = Math.round((doneItems / totalItems) * 100);

  // Check runner state
  const [runChecksOpen, setRunChecksOpen] = useState(false);
  const [checkProgress, setCheckProgress] = useState(0);
  const [checkStatus, setCheckStatus] = useState<"Idle" | "Running" | "Complete">("Idle");

  const runChecks = () => {
    setRunChecksOpen(true);
    setCheckStatus("Running");
    setCheckProgress(0);
    
    let p = 0;
    const interval = setInterval(() => {
      p += Math.floor(Math.random() * 15) + 5;
      if (p >= 100) {
        p = 100;
        clearInterval(interval);
        setCheckStatus("Complete");
      }
      setCheckProgress(p);
    }, 400);
  };

  const handleLaunch = () => {
    setRunChecksOpen(false);
    // Navigate to dashboard with "live" param ideally, but just dashboard is fine
    navigate("/console/dashboard");
  };

  return (
    <div className="min-h-screen" style={{ background: "radial-gradient(90% 60% at 50% 0%, rgba(3,205,140,0.18), rgba(255,255,255,0))" }}>
       <div className="mx-auto max-w-[95%] px-4 py-5 md:px-6">
         <div className="rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(2,8,23,0.10)]">
           {/* Header */}
           <div className="border-b border-slate-200 px-4 py-4 md:px-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-slate-100 rounded-full text-slate-500">
                    <ArrowLeft className="h-5 w-5" />
                 </button>
                 <div className="grid h-12 w-12 place-items-center rounded-2xl text-white" style={{ background: EVZ.green }}>
                    <ShieldCheck className="h-6 w-6" />
                 </div>
                 <div>
                    <h1 className="text-sm font-semibold text-slate-900">Go-Live Readiness</h1>
                    <div className="mt-1 text-xs text-slate-500">Track your progress towards launching</div>
                 </div>
              </div>
              
              <div className="flex items-center gap-3">
                  <div className="text-right hidden sm:block">
                      <div className="text-sm font-bold text-slate-900">{progress}% Ready</div>
                      <div className="text-xs text-slate-500">{totalItems - doneItems} tasks remaining</div>
                  </div>
                  <div className="h-10 w-10 relative">
                      <svg className="h-full w-full -rotate-90">
                          <circle cx="20" cy="20" r="16" fill="none" stroke="#e2e8f0" strokeWidth="4" />
                          <circle cx="20" cy="20" r="16" fill="none" stroke={EVZ.green} strokeWidth="4" strokeDasharray={`${progress} 100`} pathLength="100" strokeLinecap="round" />
                      </svg>
                  </div>
              </div>
           </div>

           <div className="p-6">
               {/* Hero */}
               <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-8 text-white shadow-xl mb-8">
                    <div className="absolute right-0 top-0 opacity-20 pointer-events-none">
                        <Rocket className="h-64 w-64 -mr-12 -mt-12 text-emerald-400" />
                    </div>
                    <div className="relative z-10 max-w-lg">
                        <h2 className="text-2xl font-bold mb-2">Almost there!</h2>
                        <p className="text-slate-300 mb-6">Complete the remaining steps to fully activate your CorporatePay account and unlock all features including unlimited transaction volume.</p>
                        <Button variant="primary" onClick={runChecks}>
                            <Sparkles className="h-4 w-4 mr-2" /> Run Final System Check
                        </Button>
                    </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {categories.map((cat, idx) => (
                       <div key={idx} className="rounded-3xl border border-slate-200 bg-white p-5 hover:shadow-sm transition-shadow">
                           <div className="flex items-center justify-between mb-4">
                               <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">{cat.name}</h3>
                               {cat.items.every(i => i.status === "Done") ? (
                                   <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                                       <CheckCircle2 className="h-3 w-3" /> Done
                                   </div>
                               ) : (
                                   <button 
                                      className="text-xs font-semibold text-emerald-600 hover:underline flex items-center gap-1"
                                      onClick={() => navigate(cat.path)}
                                   >
                                       Resolve <ChevronRight className="h-3 w-3" />
                                   </button>
                               )}
                           </div>
                           <div className="space-y-3">
                               {cat.items.map((item, i) => (
                                   <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                                       {item.status === "Done" ? (
                                           <CheckCircle2 className="h-5 w-5 text-emerald-500 fill-emerald-50 shrink-0" />
                                       ) : item.status === "In Progress" ? (
                                           <PlayCircle className="h-5 w-5 text-amber-500 shrink-0" />
                                       ) : (
                                           <Circle className="h-5 w-5 text-slate-300 shrink-0" />
                                       )}
                                       <span className={cn("text-xs font-medium", item.status === "Done" ? "text-slate-500" : "text-slate-900")}>
                                           {item.label}
                                       </span>
                                   </div>
                               ))}
                           </div>
                       </div>
                   ))}
               </div>
           </div>
         </div>
       </div>

       {/* Run Checks Modal */}
      <Modal
        open={runChecksOpen}
        onClose={() => setRunChecksOpen(false)}
        title="Final Go-live System Check"
        subtitle="Verifying all systems are operational."
        footer={
          <div className="flex justify-end gap-3">
             <Button variant="ghost" onClick={() => setRunChecksOpen(false)}>Cancel</Button>
             {checkStatus === "Complete" ? (
               <Button variant="primary" onClick={handleLaunch} className="bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200">
                 <Rocket className="h-4 w-4 mr-2" /> Launch Now
               </Button>
             ) : (
               <Button variant="outline" disabled>
                 {checkProgress < 100 ? `Scanning... ${checkProgress}%` : "Finalizing..."}
               </Button>
             )}
          </div>
        }
      >
        <div className="p-4">
          <div className="mb-2 flex justify-between text-sm font-semibold">
            <span>Overall Readiness</span>
            <span>{checkProgress}%</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-emerald-500 transition-all duration-300" style={{ width: `${checkProgress}%` }} />
          </div>
          
          <div className="mt-6 space-y-3">
             <CheckItem label="Profile Completeness" status={checkProgress > 10 ? "Pass" : "Pending"} />
             <CheckItem label="Regulatory Compliance (KYB)" status={checkProgress > 30 ? "Pass" : "Pending"} />
             <CheckItem label="Banking & Settlement" status={checkProgress > 60 ? "Pass" : "Pending"} />
             <CheckItem label="Team & Access Control" status={checkProgress > 80 ? "Pass" : "Pending"} />
             <CheckItem label="System Integrity" status={checkProgress === 100 ? "Pass" : "Pending"} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
