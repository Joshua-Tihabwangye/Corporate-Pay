import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Receipt, Download, Share2, Check, Clock, CreditCard, Building2, MapPin, Mail, MessageCircle, Phone, X, AlertTriangle, BadgeCheck, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const EVZ = { green: "#03CD8C", orange: "#F77F00" };

type Toast = { id: string; title: string; kind: "success" | "info" };

function ToastStack({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 w-80 space-y-2">
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            className="pointer-events-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-xl"
          >
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 grid h-6 w-6 place-items-center rounded-full ${t.kind === "success" ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-blue-600"}`}>
                {t.kind === "success" ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
              </div>
              <div className="flex-1 text-sm font-semibold text-slate-900">{t.title}</div>
              <button onClick={() => onDismiss(t.id)} className="text-slate-400 hover:text-slate-600"><X className="h-4 w-4" /></button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export default function ReceiptDrawer() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [downloading, setDownloading] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const showToast = (title: string, kind: "success" | "info" = "info") => {
    const tid = Math.random().toString(36);
    setToasts((p) => [...p, { id: tid, title, kind }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== tid)), 3000);
  };

  const handleDownload = () => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      showToast("Receipt downloaded successfully", "success");
    }, 2000);
  };

  const handleShare = (platform: string) => {
    setShareOpen(false);
    showToast(`Shared via ${platform}`, "success");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <ToastStack toasts={toasts} onDismiss={(tid) => setToasts((p) => p.filter((t) => t.id !== tid))} />
      
      <div className="mx-auto max-w-2xl px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <div className="rounded-[32px] border border-slate-200 bg-white shadow-lg overflow-hidden">
          <div className="p-8 text-center" style={{ background: `linear-gradient(135deg, ${EVZ.green}, ${EVZ.orange})` }}>
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-white/20 backdrop-blur">
              <Receipt className="h-8 w-8 text-white" />
            </div>
            <h1 className="mt-4 text-2xl font-bold text-white">Transaction Receipt</h1>
            <p className="text-white/80">REF-{id?.toUpperCase() || "XXXX"}</p>
          </div>

          <div className="p-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <span className="text-slate-500">Status</span>
              <span className="flex items-center gap-2 text-emerald-600 font-semibold">
                <Check className="h-4 w-4" /> Approved
              </span>
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Amount</span>
                <span className="text-xl font-bold text-slate-900">UGX 540,000</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Vendor</span>
                <span className="font-semibold text-slate-900">Acme Supplies Ltd</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Category</span>
                <span className="font-medium text-slate-700">Office Supplies</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Cost Center</span>
                <span className="font-medium text-slate-700">CC-PROC</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Date</span>
                <span className="font-medium text-slate-700">Jan 28, 2026</span>
              </div>
            </div>

            <div className="mt-6 rounded-2xl bg-emerald-50 border border-emerald-200 p-4">
              <div className="text-sm font-semibold text-emerald-800">Policy Decision</div>
              <div className="mt-1 text-sm text-emerald-700">Approved via approval workflow</div>
              <div className="mt-2 text-xs text-emerald-600">Matched: CorporatePay high value requires approval</div>
            </div>

            <div className="mt-6 rounded-2xl bg-slate-50 border border-slate-200 p-4">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Payment Method</div>
              <div className="mt-2 flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-slate-400" />
                <span className="font-medium text-slate-700">Corporate Wallet •••• 4532</span>
              </div>
            </div>

            <div className="mt-8 flex gap-3 relative">
              <div className="relative flex-1">
                <button 
                  onClick={() => setShareOpen(!shareOpen)}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <Share2 className="h-4 w-4" /> Share
                </button>
                
                <AnimatePresence>
                  {shareOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute bottom-full left-0 mb-2 w-full rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden z-10"
                    >
                      <button onClick={() => handleShare("WeChat")} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-left text-sm font-medium text-slate-700 border-b border-slate-100">
                        <MessageCircle className="h-4 w-4 text-green-600" /> WeChat
                      </button>
                      <button onClick={() => handleShare("WhatsApp")} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-left text-sm font-medium text-slate-700 border-b border-slate-100">
                        <Phone className="h-4 w-4 text-emerald-500" /> WhatsApp
                      </button>
                      <button onClick={() => handleShare("Email")} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-left text-sm font-medium text-slate-700">
                        <Mail className="h-4 w-4 text-blue-500" /> Email
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button 
                onClick={handleDownload}
                disabled={downloading}
                className="flex-1 flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white transition-all active:scale-95 disabled:opacity-70 disabled:active:scale-100" 
                style={{ background: EVZ.green }}
              >
                {downloading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Downloading...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" /> Download PDF
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
