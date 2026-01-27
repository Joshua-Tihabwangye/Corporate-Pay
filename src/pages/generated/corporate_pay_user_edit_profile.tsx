import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, User, Mail, ShieldCheck } from "lucide-react";
import { useUser, OrgRole } from "../../utils/userStorage";

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
  const base = "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-4";
  const variants = {
    primary: "bg-[#03CD8C] text-white hover:opacity-90 focus:ring-emerald-200",
    outline: "border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 focus:ring-slate-200",
    ghost: "bg-transparent text-slate-700 hover:bg-slate-100 focus:ring-slate-200",
    danger: "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 focus:ring-rose-100",
  };
  return (
    <button onClick={onClick} disabled={disabled} className={cn(base, variants[variant], disabled && "opacity-50 cursor-not-allowed", className)}>
      {children}
    </button>
  );
}

function Input({ label, value, onChange, icon: Icon }: { label: string; value: string; onChange: (v: string) => void; icon?: any }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 mb-1">{label}</label>
      <div className="relative">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-3 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-100"
        />
        {Icon && <Icon className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />}
      </div>
    </div>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-100"
      >
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}

export default function UserEditProfile() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const { user, updateUser } = useUser(userId);
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<OrgRole>("Member");
  const [status, setStatus] = useState("Active");

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setRole(user.role);
      setStatus(user.status);
    }
  }, [user]);

  const handleSave = () => {
    if (userId) {
        updateUser({ name, email, role, status: status as any });
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
            <div className="text-xl font-bold text-slate-900">Edit Profile</div>
            <div className="text-sm text-slate-500">Update user details</div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <Input label="Full Name" value={name} onChange={setName} icon={User} />
          <Input label="Email Address" value={email} onChange={setEmail} icon={Mail} />
          <Select label="Role" value={role} onChange={(v) => setRole(v as OrgRole)} options={["Owner", "Admin", "Finance", "Approver", "Member", "Viewer"]} />
          <Select label="Status" value={status} onChange={setStatus} options={["Active", "Disabled", "Suspended"]} />

          <div className="pt-4 flex justify-end gap-3">
            <Button variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
            <Button variant="primary" onClick={handleSave}>
              <Save className="h-4 w-4" /> Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
