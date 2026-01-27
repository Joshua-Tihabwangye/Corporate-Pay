import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, CheckSquare, Square, Shield, Plus, X, Check } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useRole, OrgRole, Permission } from "../../utils/roleStorage";

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
  variant?: "primary" | "outline" | "ghost" | "danger";
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const base = "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-[#03CD8C] text-white hover:opacity-90 focus:ring-emerald-200 shadow-lg",
    outline: "border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 focus:ring-slate-200",
    ghost: "bg-transparent text-slate-700 hover:bg-slate-100 focus:ring-slate-200",
    danger: "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 focus:ring-rose-100",
  };
  return (
    <button onClick={onClick} disabled={disabled} className={cn(base, variants[variant], className)}>
      {children}
    </button>
  );
}

type Toast = { id: string; message: string; type: "success" | "error" };

function ToastStack({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  return (
    <div className="fixed right-4 top-4 z-50 w-[min(400px,calc(100vw-2rem))] space-y-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={cn(
              "rounded-2xl border p-4 shadow-lg backdrop-blur",
              t.type === "success" ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"
            )}
          >
            <div className="flex items-start gap-3">
              <div className={cn(
                "grid h-8 w-8 place-items-center rounded-xl",
                t.type === "success" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
              )}>
                {t.type === "success" ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
              </div>
              <div className="flex-1 text-sm font-medium text-slate-900">{t.message}</div>
              <button
                onClick={() => onDismiss(t.id)}
                className="rounded-lg p-1 hover:bg-white/50 text-slate-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

const DEFAULT_PERMISSIONS: Permission[] = [
  "View wallet",
  "Pay",
  "Request",
  "Approve",
  "Withdraw",
  "Manage beneficiaries",
  "Batch payouts",
  "Refunds",
  "Export reports",
  "Manage users",
  "Manage policies",
];

export default function RoleEdit() {
  const navigate = useNavigate();
  const { roleName } = useParams<{ roleName: string }>();
  const { role, updateRole } = useRole(roleName as OrgRole);
  
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [summary, setSummary] = useState("");
  const [customPermission, setCustomPermission] = useState("");
  const [allPermissions, setAllPermissions] = useState<Permission[]>(DEFAULT_PERMISSIONS);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    if (role) {
      setPermissions(role.permissions);
      setSummary(role.summary);
      
      // Add any custom permissions that aren't in the default list
      const customPerms = role.permissions.filter(p => !DEFAULT_PERMISSIONS.includes(p));
      if (customPerms.length > 0) {
        setAllPermissions([...DEFAULT_PERMISSIONS, ...customPerms]);
      }
    }
  }, [role]);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    const id = `toast-${Date.now()}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const toggle = (perm: Permission) => {
    setPermissions((prev) => 
      prev.includes(perm) 
        ? prev.filter(p => p !== perm)
        : [...prev, perm]
    );
  };

  const addCustomPermission = () => {
    const trimmed = customPermission.trim();
    if (!trimmed) {
      showToast("Permission name cannot be empty", "error");
      return;
    }
    
    if (allPermissions.includes(trimmed as Permission)) {
      showToast("This permission already exists", "error");
      return;
    }

    const newPerm = trimmed as Permission;
    setAllPermissions(prev => [...prev, newPerm]);
    setPermissions(prev => [...prev, newPerm]);
    setCustomPermission("");
    showToast(`Added permission: ${trimmed}`, "success");
  };

  const handleSave = () => {
    if (role) {
      updateRole({ permissions, summary });
      showToast("Role updated successfully!", "success");
      setTimeout(() => navigate(-1), 1000);
    }
  };

  if (!role) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-bold text-slate-900">Role not found</div>
          <Button className="mt-4" onClick={() => navigate("/console/settings/roles")}>
            Back to Roles
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "radial-gradient(90% 60% at 50% 0%, rgba(3,205,140,0.12), rgba(255,255,255,0))" }}>
      <ToastStack toasts={toasts} onDismiss={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />
      
      <div className="mx-auto max-w-3xl px-4 py-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(-1)} className="rounded-full p-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="text-xl font-bold text-slate-900">Edit Role: {role.role}</div>
            <div className="text-sm text-slate-500">Customize permissions for this role</div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_20px_70px_rgba(2,8,23,0.15)]">
          <div className="flex items-center gap-3 mb-6">
            <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <div className="font-semibold text-slate-900">{role.role} Role</div>
              <div className="text-sm text-slate-600">Toggle permissions for this role</div>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Role Summary
            </label>
            <input
              type="text"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-100"
              placeholder="Brief description of this role"
            />
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold text-slate-700">Permissions ({permissions.length} selected)</div>
            </div>
            
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 mb-4">
              <div className="text-xs font-semibold text-slate-600 mb-2">Add Custom Permission</div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customPermission}
                  onChange={(e) => setCustomPermission(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addCustomPermission()}
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  placeholder="e.g., Create invoices"
                />
                <Button variant="primary" onClick={addCustomPermission}>
                  <Plus className="h-4 w-4" /> Add
                </Button>
              </div>
            </div>

            <div className="space-y-1 max-h-[400px] overflow-y-auto">
              {allPermissions.map((perm) => (
                <button
                  key={perm}
                  onClick={() => toggle(perm)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl px-4 py-3 transition",
                    permissions.includes(perm) 
                      ? "bg-emerald-50 border border-emerald-200" 
                      : "hover:bg-slate-50 border border-transparent"
                  )}
                >
                  <span className={cn(
                    "font-medium",
                    permissions.includes(perm) ? "text-emerald-900" : "text-slate-700"
                  )}>
                    {perm}
                  </span>
                  {permissions.includes(perm) ? (
                    <CheckSquare className="h-5 w-5 text-[#03CD8C]" />
                  ) : (
                    <Square className="h-5 w-5 text-slate-300" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end gap-3">
            <Button variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
            <Button variant="primary" onClick={handleSave}>
              <Save className="h-4 w-4" /> Save Changes
            </Button>
          </div>
        </div>

        <div className="rounded-3xl border border-emerald-200 bg-emerald-50/50 p-4">
          <div className="text-sm font-semibold text-emerald-900">💡 Quick Tip</div>
          <div className="mt-1 text-sm text-emerald-800">
            Changes to role permissions will affect all users assigned to this role across your organization. Custom permissions can be used for specialized workflows.
          </div>
        </div>
      </div>
    </div>
  );
}
