import React, { useState, useEffect } from "react";
import { ArrowLeft, CheckCircle, FileText, Upload, AlertTriangle, Clock, X, ChevronRight, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

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

function FileUploader({ onDrop }: { onDrop: (f: File) => void }) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) onDrop(e.target.files[0]);
  };
  return (
    <div 
      className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 py-10 text-center transition hover:bg-slate-100" 
      onClick={() => inputRef.current?.click()}
    >
      <input type="file" ref={inputRef} className="hidden" onChange={handleFile} />
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-emerald-600 shadow-sm">
        <Upload className="h-6 w-6" />
      </div>
      <div className="mt-4 text-sm font-semibold text-slate-900">Click to upload or drag and drop</div>
      <div className="mt-1 text-xs text-slate-500">PDF, PNG, JPG up to 10MB</div>
    </div>
  );
}

export default function KYBManager() {
  const navigate = useNavigate();
  
  const [docs, setDocs] = useState([
     { id: 1, name: "Certificate of Incorporation", status: "Verified", date: "2024-01-15", required: true, notes: "Verified against registry." },
     { id: 2, name: "Tax Registration Certificate", status: "Verified", date: "2024-01-15", required: true, notes: "TIN verified." },
     { id: 3, name: "Directors ID Proof (2)", status: "Pending", date: "2024-03-10", required: true, notes: "Under manual review." },
     { id: 4, name: "Utility Bill (Proof of Address)", status: "Missing", date: "-", required: true, notes: "Please upload." },
  ]);
  
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadDocId, setUploadDocId] = useState<number | null>(null);

  const statusTone = (s: string) => s === "Verified" ? "good" : s === "Pending" ? "info" : "warn";

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
                    <ShieldCheck className="h-6 w-6" />
                 </div>
                 <div>
                    <h1 className="text-sm font-semibold text-slate-900">KYB & Compliance</h1>
                    <div className="mt-1 flex items-center gap-2">
                       <p className="text-xs text-slate-500">Verification Status:</p>
                       <Pill label="In Review" tone="info" />
                    </div>
                 </div>
              </div>
           </div>

           <div className="p-6">
              <div className="grid grid-cols-1 gap-6">
                 {/* Alert */}
                 {docs.some(d => d.status === "Missing") && (
                   <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 flex items-start gap-4">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white text-amber-700">
                         <AlertTriangle className="h-5 w-5" />
                      </div>
                      <div>
                          <h3 className="font-semibold text-slate-900 text-sm">Action Required</h3>
                          <p className="text-xs text-amber-900 mt-1">Please upload the missing documents to complete your KYB verification. Delays may impact your transaction limits.</p>
                      </div>
                   </div>
                 )}

                 {/* Docs List */}
                 <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <h3 className="font-semibold text-slate-900 text-sm">Required Documents</h3>
                        <div className="text-xs font-semibold text-slate-500">{docs.filter(d => d.status !== "Missing").length} of {docs.length} Uploaded</div>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {docs.map((doc) => (
                            <div key={doc.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center border shrink-0", 
                                        doc.status === "Verified" ? "bg-emerald-50 border-emerald-200 text-emerald-600" :
                                        doc.status === "Pending" ? "bg-blue-50 border-blue-200 text-blue-600" :
                                        "bg-slate-50 border-slate-200 text-slate-400"
                                    )}>
                                        <FileText className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                                            {doc.name}
                                            {doc.required && <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Required</span>}
                                        </div>
                                        <div className="text-xs text-slate-500 mt-0.5">{doc.notes} • Last updated: {doc.date}</div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-3">
                                    <Pill label={doc.status} tone={statusTone(doc.status)} />
                                    {doc.status === "Missing" && (
                                        <Button 
                                            variant="primary"
                                            onClick={() => {
                                               setUploadDocId(doc.id);
                                               setUploadOpen(true);
                                            }}
                                            className="ml-2 py-1.5 px-3 text-xs"
                                        >
                                            <Upload className="h-3.5 w-3.5" /> Upload
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                 </div>
              </div>
           </div>
         </div>
       </div>

       <Modal
         open={uploadOpen}
         title="Upload Document"
         subtitle="Securely upload verification documents."
         onClose={() => setUploadOpen(false)}
         footer={
            <div className="flex justify-end gap-3">
               <Button variant="ghost" onClick={() => setUploadOpen(false)}>Cancel</Button>
            </div>
         }
       >
          <FileUploader onDrop={(f) => {
             setDocs(p => p.map(d => d.id === uploadDocId ? { ...d, status: "Pending", date: new Date().toISOString().split('T')[0], notes: `Uploaded ${f.name}` } : d));
             setUploadOpen(false);
          }} />
       </Modal>
    </div>
  );
}
