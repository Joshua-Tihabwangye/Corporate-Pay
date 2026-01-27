import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Key, Save, CheckSquare, Square } from "lucide-react";
import { useUser } from "../../utils/userStorage";
import { Permission } from "../../utils/roleStorage";

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

// Helper function to get all available permissions
const ALL_PERMISSIONS: Permission[] = [
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

export default function UserPermissionsEdit() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const { user, updateUser } = useUser(userId);
  
  const [permissions, setPermissions] = useState<{ id: string; label: string; enabled: boolean }[]>([]);

  useEffect(() => {
    if (user) {
      setPermissions(ALL_PERMISSIONS.map(p => ({
          id: p, 
          label: p, 
          enabled: user.permissions?.includes(p) || false
      })));
    }
  }, [user]);

  const toggle = (id: string) => {
    setPermissions(p => p.map(x => x.id === id ? { ...x, enabled: !x.enabled } : x));
  };

  const handleSave = () => {
      const newPerms = permissions.filter(p => p.enabled).map(p => p.id as Permission);
      if (userId) {
          updateUser({ permissions: newPerms });
      }
      navigate(-1);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(-1)} className="rounded-full p-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="text-xl font-bold text-slate-900">Permissions</div>
            <div className="text-sm text-slate-500">Fine-tune user access</div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
           <div className="flex items-center gap-3 mb-6">
             <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
               <Key className="h-5 w-5" />
             </div>
             <div className="text-sm text-slate-600">
               Permissions are initially set by the user's role. Custom overrides will mark the user as "Custom".
             </div>
           </div>

           <div className="space-y-1">
             {permissions.map((p) => (
               <button
                 key={p.id}
                 onClick={() => toggle(p.id)}
                 className="flex w-full items-center justify-between rounded-xl px-4 py-3 hover:bg-slate-50"
               >
                 <span className="font-medium text-slate-900">{p.label}</span>
                 {p.enabled ? (
                   <CheckSquare className="h-6 w-6 text-[#03CD8C]" />
                 ) : (
                   <Square className="h-6 w-6 text-slate-300" />
                 )}
               </button>
             ))}
           </div>

           <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end gap-3">
              <Button variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
              <Button variant="primary" onClick={handleSave}>
                <Save className="h-4 w-4" /> Save Permissions
              </Button>
           </div>
        </div>
      </div>
    </div>
  );
}

