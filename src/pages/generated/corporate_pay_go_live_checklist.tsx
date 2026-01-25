import React, { useState } from "react";
import { ArrowLeft, Check, CheckCircle2, ChevronRight, Circle, PlayCircle, Rocket } from "lucide-react";
import { useNavigate } from "react-router-dom";

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

export default function GoLiveChecklist() {
  const navigate = useNavigate();

  const steps = [
    {
        category: "Organization Setup",
        items: [
            { label: "Complete Company Profile", status: "Done" },
            { label: "Add at least one Invoice Group", status: "Done" },
            { label: "verify Billing Contact Email", status: "Done" },
        ]
    },
    {
        category: "Compliance",
        items: [
            { label: "Submit KYB Documents", status: "Done" },
            { label: "KYB Verification Approval", status: "Done" },
        ]
    },
    {
        category: "Financials",
        items: [
            { label: "Set Organization Budget Cap", status: "In Progress" },
            { label: "Add Funds to Wallet (Prepaid)", status: "Pending" },
        ]
    },
    {
        category: "Team access",
        items: [
            { label: "Invite Finance Administrator", status: "Pending" },
            { label: "Set up Employee Groups", status: "Pending" },
        ]
    }
  ];

  const progress = 65; 

  return (
    <div className="min-h-screen bg-slate-50">
       <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4">
             <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-slate-100 rounded-full text-slate-500">
                <ArrowLeft className="h-5 w-5" />
             </button>
             <div>
                <h1 className="text-lg font-bold text-slate-900">Go-Live Readiness</h1>
                <p className="text-xs text-slate-500">Track your progress towards launching</p>
             </div>
          </div>
          <div className="flex items-center gap-3">
              <div className="text-right hidden md:block">
                  <div className="text-sm font-bold text-slate-900">{progress}% Ready</div>
                  <div className="text-xs text-slate-500">4 tasks remaining</div>
              </div>
              <div className="h-10 w-10 relative">
                  <svg className="h-full w-full -rotate-90">
                      <circle cx="20" cy="20" r="16" fill="none" stroke="#e2e8f0" strokeWidth="4" />
                      <circle cx="20" cy="20" r="16" fill="none" stroke="#10b981" strokeWidth="4" strokeDasharray={`${progress} 100`} pathLength="100" strokeLinecap="round" />
                  </svg>
              </div>
          </div>
       </div>

       <div className="max-w-3xl mx-auto p-6 space-y-8">
           <div className="bg-emerald-900 rounded-3xl p-8 text-white relative overflow-hidden">
                <div className="absolute right-0 top-0 opacity-10 pointer-events-none">
                    <Rocket className="h-48 w-48 -mr-8 -mt-8" />
                </div>
                <div className="relative z-10">
                    <h2 className="text-2xl font-bold mb-2">Almost there!</h2>
                    <p className="text-emerald-100 max-w-md mb-6">Complete the remaining steps to fully activate your CorporatePay account and unlock all features.</p>
                    <button className="bg-white text-emerald-900 px-6 py-3 rounded-xl font-bold text-sm hover:bg-emerald-50 transition-colors shadow-lg">
                        Run System Check
                    </button>
                </div>
           </div>

           <div className="space-y-6">
               {steps.map((section, idx) => (
                   <div key={idx}>
                       <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 px-2">{section.category}</h3>
                       <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
                           {section.items.map((item, i) => (
                               <div key={i} className="p-4 flex items-center justify-between group hover:bg-slate-50 transition-colors">
                                   <div className="flex items-center gap-3">
                                       {item.status === "Done" ? (
                                           <CheckCircle2 className="h-5 w-5 text-emerald-500 fill-emerald-50" />
                                       ) : item.status === "In Progress" ? (
                                           <PlayCircle className="h-5 w-5 text-amber-500" />
                                       ) : (
                                           <Circle className="h-5 w-5 text-slate-300" />
                                       )}
                                       <span className={cn("text-sm font-medium", item.status === "Done" ? "text-slate-500 line-through" : "text-slate-900")}>
                                           {item.label}
                                       </span>
                                   </div>
                                   {item.status !== "Done" && (
                                       <button className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                           Fix Now <ChevronRight className="h-3 w-3" />
                                       </button>
                                   )}
                               </div>
                           ))}
                       </div>
                   </div>
               ))}
           </div>
       </div>
    </div>
  );
}
