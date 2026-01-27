import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Shield, Clock, Key, Activity, Mail, Smartphone, Monitor } from "lucide-react";
import { useUser, permissionTemplate } from "../../utils/userStorage";

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

function Pill({ label, tone = "neutral" }: { label: string; tone?: "good" | "warn" | "neutral" | "info" }) {
  const map: Record<string, string> = {
    good: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    warn: "bg-amber-50 text-amber-800 ring-amber-200",
    neutral: "bg-slate-50 text-slate-700 ring-slate-200",
    info: "bg-blue-50 text-blue-700 ring-blue-200",
  };
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1", map[tone] || map.neutral)}>{label}</span>;
}

export default function UserProfileDetail() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const [activeTab, setActiveTab] = useState<"overview" | "security" | "permissions" | "activity">("overview");

  const { user } = useUser(userId);

  const tabs = [
    { id: "overview", label: "Overview", icon: Activity },
    { id: "security", label: "Security", icon: Shield },
    { id: "permissions", label: "Permissions", icon: Key },
    { id: "activity", label: "Activity Log", icon: Clock },
  ] as const;

  const handleTabChange = (id: typeof activeTab) => {
    setActiveTab(id);
  };

  if (!user) {
      return (
          <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
              <div className="text-center">
                  <div className="text-xl font-bold text-slate-900">User not found</div>
                  <Button className="mt-4" onClick={() => navigate("/console/users")}>Back to Users</Button>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/console/users")} className="rounded-full p-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="text-xl font-bold text-slate-900">{user.name}</div>
            <div className="text-sm text-slate-500">{user.email}</div>
          </div>
          <div className="flex-1" />
          <Button variant="outline" onClick={() => navigate(`/console/users/${userId}/edit`)}>Edit Profile</Button> 
          <Button variant="danger" onClick={() => alert("Suspend user action triggered")}>Suspend User</Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto border-b border-slate-200 pb-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => handleTabChange(t.id)}
              className={cn(
                "flex items-center gap-2 rounded-t-xl border-b-2 px-4 py-2 text-sm font-semibold transition",
                activeTab === t.id ? "border-[#03CD8C] text-slate-900" : "border-transparent text-slate-500 hover:text-slate-700"
              )}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="grid gap-6">
          {activeTab === "overview" && (
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-slate-900">User Details</div>
                  <Pill label={user.status} tone={user.status === "Active" ? "good" : "warn"} />
                </div>
                <div className="mt-4 space-y-4">
                  <div>
                    <div className="text-xs text-slate-500">Full Name</div>
                    <div className="mt-1 font-medium text-slate-900">{user.name}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Email Address</div>
                    <div className="mt-1 font-medium text-slate-900">{user.email}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Role</div>
                    <div className="mt-1 font-medium text-slate-900">{user.role}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Joined</div>
                    <div className="mt-1 font-medium text-slate-900">{user.joined}</div>
                  </div>
                </div>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="font-semibold text-slate-900">Access Summary</div>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700"><Key className="h-4 w-4" /></div>
                      <div className="text-sm font-medium text-slate-900">Permissions</div>
                    </div>
                    <Button variant="ghost" className="text-xs h-8 px-2" onClick={() => navigate(`/console/users/${userId}/permissions`)}>Manage</Button>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-blue-100 p-2 text-blue-700"><Shield className="h-4 w-4" /></div>
                      <div className="text-sm font-medium text-slate-900">Security</div>
                    </div>
                     <Button variant="ghost" className="text-xs h-8 px-2" onClick={() => navigate(`/console/users/${userId}/security`)}>Configure</Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="font-semibold text-slate-900">Security Settings</div>
              <div className="mt-6 space-y-6">
                <div className="flex items-start justify-between border-b border-slate-100 pb-6">
                  <div className="flex gap-4">
                    <div className="rounded-full bg-slate-100 p-3"><Smartphone className="h-5 w-5 text-slate-600" /></div>
                    <div>
                      <div className="font-medium text-slate-900">Two-Factor Authentication</div>
                      <div className="text-sm text-slate-500">Secure the account with 2FA</div>
                    </div>
                  </div>
                  <Button onClick={() => navigate(`/console/users/${userId}/security`)}>Configure</Button>
                </div>
                <div className="flex items-start justify-between">
                   <div className="flex gap-4">
                    <div className="rounded-full bg-slate-100 p-3"><Monitor className="h-5 w-5 text-slate-600" /></div>
                    <div>
                      <div className="font-medium text-slate-900">Active Sessions</div>
                      <div className="text-sm text-slate-500">Manage logged in devices</div>
                    </div>
                  </div>
                  <Button onClick={() => navigate(`/console/users/${userId}/security`)}>View Sessions</Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "permissions" && (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <div className="font-semibold text-slate-900">Assigned Permissions</div>
                    <Button onClick={() => navigate(`/console/users/${userId}/permissions`)}>Edit Permissions</Button>
                </div>
                <div className="space-y-2">
                    {/* Mock permissions display */}
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50">
                        <Key className="h-4 w-4 text-emerald-600" />
                        <span className="text-sm text-slate-700">View Reports</span>
                    </div>
                     <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50">
                        <Key className="h-4 w-4 text-emerald-600" />
                        <span className="text-sm text-slate-700">Create Purchase Requests</span>
                    </div>
                    {user.role === "Owner" && (
                         <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50">
                            <Key className="h-4 w-4 text-emerald-600" />
                            <span className="text-sm text-slate-700">Manage Users & Funding</span>
                        </div>
                    )}
                </div>
            </div>
          )}

          {activeTab === "activity" && (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                     <div className="font-semibold text-slate-900">Recent Activity</div>
                     <Button onClick={() => navigate(`/console/users/${userId}/activity`)}>View Full Log</Button>
                </div>
                <div className="space-y-4">
                     {/* Mock Activity Preview */}
                     <div className="flex items-start gap-3">
                         <div className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                         <div>
                             <div className="text-sm font-medium text-slate-900">Logged in</div>
                             <div className="text-xs text-slate-500">{user.lastActive}</div>
                         </div>
                     </div>
                      <div className="flex items-start gap-3">
                         <div className="mt-1 h-2 w-2 rounded-full bg-slate-300" />
                         <div>
                             <div className="text-sm font-medium text-slate-900">Updated profile</div>
                             <div className="text-xs text-slate-500">Yesterday</div>
                         </div>
                     </div>
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
