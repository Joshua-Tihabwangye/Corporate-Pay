import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, Building2, Globe, MapPin, Plus, Trash2, ChevronRight, Settings, MoreVertical, X } from "lucide-react";
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

function ActionMenu({ actions }: { actions: { label: string; onClick: () => void; icon?: React.ReactNode; variant?: "default" | "danger" }[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button onClick={() => setIsOpen(!isOpen)} className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700">
        <MoreVertical className="h-5 w-5" />
      </button>
      {isOpen && (
        <div className="absolute right-0 top-full mt-1 z-50 w-48 rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
          {actions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => { action.onClick(); setIsOpen(false); }}
              className={cn("flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors", action.variant === "danger" ? "text-rose-600 hover:bg-rose-50" : "text-slate-700 hover:bg-slate-50")}
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function EntityManager() {
  const navigate = useNavigate();
  const [entities, setEntities] = useState([
      { id: 1, name: "Kampala Holdings Ltd", country: "Uganda", city: "Kampala", type: "Main", status: "Active", currency: "UGX" },
      { id: 2, name: "KHL Kenya Ops", country: "Kenya", city: "Nairobi", type: "Subsidiary", status: "Active", currency: "KES" }
  ]);
  
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newEntity, setNewEntity] = useState({ name: "", country: "Uganda", city: "", currency: "UGX" });

  const handleSave = () => {
      if (editingId) {
          setEntities(prev => prev.map(e => e.id === editingId ? { ...e, ...newEntity } : e));
      } else {
          setEntities([...entities, { id: Date.now(), ...newEntity, type: "Subsidiary", status: "Active" }]);
      }
      setShowAdd(false);
      setEditingId(null);
      setNewEntity({ name: "", country: "Uganda", city: "", currency: "UGX" });
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
                    <Globe className="h-6 w-6" />
                 </div>
                 <div>
                    <h1 className="text-sm font-semibold text-slate-900">Entity Management</h1>
                    <div className="mt-1 text-xs text-slate-500">Manage legal entities and operating countries</div>
                 </div>
              </div>
              <Button variant="primary" onClick={() => {
                  setEditingId(null);
                  setNewEntity({ name: "", country: "Uganda", city: "", currency: "UGX" });
                  setShowAdd(true);
              }}>
                 <Plus className="h-4 w-4 mr-1" /> Add Entity
              </Button>
           </div>

           <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {entities.map(e => (
                     <div key={e.id} className="rounded-3xl border border-slate-200 bg-white p-5 hover:shadow-md transition-shadow group">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                                    <Building2 className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-900 text-sm">{e.name}</h3>
                                    <p className="text-xs text-slate-500">{e.type} • {e.currency}</p>
                                </div>
                            </div>
                            <ActionMenu actions={[
                                { 
                                    label: "Edit", 
                                    icon: <Settings className="h-3.5 w-3.5" />, 
                                    onClick: () => {
                                        setNewEntity({ name: e.name, country: e.country, city: e.city, currency: e.currency });
                                        setEditingId(e.id);
                                        setShowAdd(true);
                                    } 
                                },
                                { 
                                    label: e.status === "Active" ? "Deactivate" : "Activate", 
                                    icon: <Trash2 className="h-3.5 w-3.5" />, 
                                    variant: "danger", 
                                    onClick: () => {
                                        setEntities(prev => prev.map(ent => ent.id === e.id ? { ...ent, status: ent.status === "Active" ? "Inactive" : "Active" } : ent));
                                    } 
                                }
                            ]} />
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between text-xs text-slate-600">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1"><Globe className="h-3.5 w-3.5 text-slate-400" /> {e.country}</div>
                                <div className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-slate-400" /> {e.city}</div>
                            </div>
                            <Pill label={e.status} tone="good" />
                        </div>
                     </div>
                 ))}
              </div>
           </div>
         </div>
       </div>

       <Modal
         open={showAdd}
         title={editingId ? "Edit Entity" : "Add New Entity"}
         subtitle={editingId ? "Update entity details." : "Register a new operating entity."}
         onClose={() => setShowAdd(false)}
         footer={
            <div className="flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
                <Button variant="primary" onClick={handleSave}>{editingId ? "Update Entity" : "Save Entity"}</Button>
            </div>
         }
       >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-2">
                  <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Legal Name</label>
                  <input 
                    value={newEntity.name}
                    onChange={e => setNewEntity({...newEntity, name: e.target.value})}
                    className="w-full border border-slate-200 rounded-2xl px-3 py-2.5 text-sm font-semibold outline-none focus:ring-4 focus:ring-emerald-100"
                    placeholder="e.g. Acme Tanzania Ltd"
                  />
              </div>
              <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Country</label>
                  <select 
                     value={newEntity.country}
                     onChange={e => setNewEntity({...newEntity, country: e.target.value})}
                     className="w-full border border-slate-200 rounded-2xl px-3 py-2.5 text-sm font-semibold outline-none focus:ring-4 focus:ring-emerald-100 bg-white"
                  >
                      <option>Uganda</option>
                      <option>Kenya</option>
                      <option>Tanzania</option>
                      <option>Rwanda</option>
                  </select>
              </div>
              <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1.5 block">City</label>
                  <input 
                    value={newEntity.city}
                    onChange={e => setNewEntity({...newEntity, city: e.target.value})}
                    className="w-full border border-slate-200 rounded-2xl px-3 py-2.5 text-sm font-semibold outline-none focus:ring-4 focus:ring-emerald-100"
                    placeholder="e.g. Dar es Salaam"
                  />
              </div>
          </div>
       </Modal>
    </div>
  );
}
