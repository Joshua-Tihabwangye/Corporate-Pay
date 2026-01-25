import React, { useState } from "react";
import { ArrowLeft, CheckCircle, FileText, Upload, AlertTriangle, Clock, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

export default function KYBManager() {
  const navigate = useNavigate();
  
  const [docs, setDocs] = useState([
     { id: 1, name: "Certificate of Incorporation", status: "Verified", date: "2024-01-15", required: true },
     { id: 2, name: "Tax Registration Certificate", status: "Verified", date: "2024-01-15", required: true },
     { id: 3, name: "Directors ID Proof (2)", status: "Pending", date: "2024-03-10", required: true },
     { id: 4, name: "Utility Bill (Proof of Address)", status: "Missing", date: "-", required: true },
  ]);
  
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadDocId, setUploadDocId] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-slate-50">
       <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4">
             <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-slate-100 rounded-full text-slate-500">
                <ArrowLeft className="h-5 w-5" />
             </button>
             <div>
                <h1 className="text-lg font-bold text-slate-900">KYB & Compliance</h1>
                <div className="flex items-center gap-2 mt-0.5">
                   <p className="text-xs text-slate-500">Verification Status:</p>
                   <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">In Review</span>
                </div>
             </div>
          </div>
       </div>

       <div className="max-w-4xl mx-auto p-6 space-y-6">
          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 flex items-start gap-4">
              <div className="bg-white p-2 rounded-xl text-amber-600 shadow-sm border border-amber-100">
                 <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                  <h3 className="font-bold text-slate-900">Action Required</h3>
                  <p className="text-sm text-slate-700 mt-1">Please upload the missing utility bill to complete your KYB verification. Delays may impact your transaction limits.</p>
              </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
             <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                 <h3 className="font-bold text-slate-900">Required Documents</h3>
                 <span className="text-xs font-semibold text-slate-500">3 of 4 Uploded</span>
             </div>
             <div className="divide-y divide-slate-100">
                 {docs.map((doc) => (
                     <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                         <div className="flex items-center gap-4">
                             <div className={cn("h-10 w-10 rounded-full flex items-center justify-center border", 
                                 doc.status === "Verified" ? "bg-emerald-50 border-emerald-200 text-emerald-600" :
                                 doc.status === "Pending" ? "bg-blue-50 border-blue-200 text-blue-600" :
                                 "bg-slate-50 border-slate-200 text-slate-400"
                             )}>
                                 <FileText className="h-5 w-5" />
                             </div>
                             <div>
                                 <div className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                                     {doc.name}
                                     {doc.required && <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase font-bold">Required</span>}
                                 </div>
                                 <div className="text-xs text-slate-500 mt-0.5">Last updated: {doc.date}</div>
                             </div>
                         </div>
                         
                         <div className="flex items-center gap-4">
                             {doc.status === "Verified" && (
                                 <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
                                     <CheckCircle className="h-3.5 w-3.5" /> Verified
                                 </div>
                             )}
                             {doc.status === "Pending" && (
                                 <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full">
                                     <Clock className="h-3.5 w-3.5" /> Pending Review
                                 </div>
                             )}
                             {doc.status === "Missing" && (
                                 <button 
                                     onClick={() => {
                                        setUploadDocId(doc.id);
                                        setUploadOpen(true);
                                     }}
                                     className="flex items-center gap-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 px-4 py-2 rounded-xl transition-colors"
                                 >
                                     <Upload className="h-3.5 w-3.5" /> Upload
                                 </button>
                             )}
                         </div>
                     </div>
                 ))}
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
              <button className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100" onClick={() => setUploadOpen(false)}>Cancel</button>
              <button 
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                onClick={() => {
                   setDocs(p => p.map(d => d.id === uploadDocId ? { ...d, status: "Pending", date: new Date().toISOString().split('T')[0] } : d));
                   setUploadOpen(false);
                }}
              >
                Upload
              </button>
           </div>
        }
      >
         <FileUploader onDrop={() => {}} />
      </Modal>
    </div>
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
          <motion.div
            className="fixed inset-0 z-40 bg-black/35"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-x-0 top-[10vh] z-50 mx-auto w-[min(600px,calc(100vw-2rem))] overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(2,8,23,0.22)]"
            role="dialog"
            aria-modal="true"
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
  return (
    <div
      className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 py-10 text-center transition hover:bg-slate-100"
      onClick={() => onDrop(new File([""], "example.pdf"))}
    >
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-emerald-600 shadow-sm">
        <Upload className="h-6 w-6" />
      </div>
      <div className="mt-4 text-sm font-semibold text-slate-900">Click to upload or drag and drop</div>
      <div className="mt-1 text-xs text-slate-500">PDF, PNG, JPG up to 10MB</div>
    </div>
  );
}
