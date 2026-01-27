import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Search, Trash2, User, Shield, Mail, Edit2, Check, X, MoreVertical, Settings, Power, AlertTriangle } from "lucide-react";
import { GroupMember, useGroupsData, Group } from "../../utils/groupsStorage";

// Utils
function uid() { return Math.random().toString(36).substr(2, 9); }
function cn(...classes: (string | undefined | null | false)[]) { return classes.filter(Boolean).join(" "); }

function Modal({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; footer?: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="border-b border-slate-100 px-6 py-4 flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-slate-100 text-slate-400"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-6">{children}</div>
        {footer && <div className="bg-slate-50 px-6 py-4 border-t border-slate-100">{footer}</div>}
      </div>
    </div>
  );
}

export default function GroupMembers() {
  const navigate = useNavigate();
  const { groupId } = useParams();
  const { groups, members, addMember, updateMember, removeMember, updateGroup, removeGroup } = useGroupsData();
  
  const group = groups.find(g => g.id === groupId);
  const groupMembers = members.filter(m => m.groupId === groupId);

  // Permissions Simulation
  const isAdmin = true; // In real app, check useUser() role

  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState<"All" | "Manager" | "Member">("All");

  // Add State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<"Manager" | "Member">("Member");

  // Edit Member State
  const [editingMember, setEditingMember] = useState<GroupMember | null>(null);

  // Group Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDesc, setGroupDesc] = useState("");

  const filtered = groupMembers.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = selectedRole === "All" || m.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const handleAdd = () => {
    if (!newName || !newEmail) return;
    addMember({
      id: uid(),
      groupId: groupId || "",
      name: newName,
      email: newEmail,
      role: newRole,
      status: "Invited",
      joinedAt: new Date().toISOString()
    });
    setNewName("");
    setNewEmail("");
    setIsAddOpen(false);
  };

  const handleUpdateMember = () => {
    if (!editingMember) return;
    updateMember(editingMember.id, { role: editingMember.role, status: editingMember.status });
    setEditingMember(null);
  };

  const handleUpdateGroup = () => {
      if(!group) return;
      updateGroup(group.id, { name: groupName, description: groupDesc });
      setIsSettingsOpen(false);
  }

  const handleDeactivateGroup = () => {
      if(!group) return;
      const newStatus = group.status === 'Active' ? 'Inactive' : 'Active';
      if(confirm(`Are you sure you want to ${newStatus === 'Inactive' ? 'deactivate' : 'activate'} this group?`)) {
          updateGroup(group.id, { status: newStatus });
          setIsSettingsOpen(false);
      }
  }

  const handleDeleteGroup = () => {
      if(!group) return;
      if(confirm("DANGER: Are you sure you want to DELETE this group? This cannot be undone.")) {
          removeGroup(group.id);
          navigate("/console/settings/groups");
      }
  }

  const openSettings = () => {
      if(group) {
          setGroupName(group.name);
          setGroupDesc(group.description);
          setIsSettingsOpen(true);
      }
  }

  if (!group) return <div className="p-10 text-center">Group not found</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-900">
      
      {/* Header */}
      <div className="mx-auto max-w-6xl mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="h-10 w-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-100 transition shadow-sm">
                <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
                <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 opacity-90">{group.name}</h1>
                    {group.status === 'Inactive' && <span className="bg-rose-100 text-rose-700 text-xs px-2 py-0.5 rounded font-bold uppercase">Inactive</span>}
                </div>
                <p className="text-slate-500 font-medium">{group.description}</p>
            </div>
            </div>
            <div className="flex items-center gap-3">
                {isAdmin && (
                    <button 
                        onClick={openSettings}
                        className="h-10 w-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition shadow-sm"
                        title="Group Settings"
                    >
                        <Settings className="h-5 w-5" />
                    </button>
                )}
                <div className="bg-white rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold shadow-sm text-slate-600">
                    {groupMembers.length} Members
                </div>
                <button 
                onClick={() => setIsAddOpen(true)}
                disabled={group.status === 'Inactive'}
                className="flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-800 shadow-lg shadow-slate-900/20 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                <Plus className="h-4 w-4" /> Add Member
                </button>
            </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl">
        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search members..." 
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
            />
          </div>
          <div className="flex rounded-xl bg-white p-1 border border-slate-200 shadow-sm">
            {(["All", "Manager", "Member"] as const).map(role => (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                  selectedRole === role ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:text-slate-700"
                )}
              >
                {role}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50 overflow-hidden min-h-[300px]">
            {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-20">
                    <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-300">
                        <User className="h-8 w-8" />
                    </div>
                    <div className="text-slate-500 font-semibold">No members found</div>
                </div>
            ) : (
                <div className="divide-y divide-slate-50">
                    {filtered.map(member => (
                        <div key={member.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-slate-50/50 transition-colors group">
                           <div className="flex items-center gap-4 flex-1">
                               <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-50 to-slate-50 flex items-center justify-center text-indigo-600 font-bold text-lg border-2 border-white shadow-sm ring-1 ring-slate-100">
                                   {member.name.charAt(0)}
                               </div>
                               <div>
                                   <div className="font-bold text-slate-900 flex items-center gap-2">
                                       {member.name}
                                       {member.status === 'Invited' && <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] uppercase tracking-wider font-bold border border-amber-100">Invited</span>}
                                       {member.status === 'Disabled' && <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] uppercase tracking-wider font-bold border border-rose-100">Disabled</span>}
                                   </div>
                                   <div className="text-sm text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                                      <Mail className="h-3 w-3" /> {member.email}
                                   </div>
                               </div>
                           </div>
                           
                           <div className="flex items-center gap-6 sm:justify-end w-full sm:w-auto mt-2 sm:mt-0 pl-16 sm:pl-0">
                               <div className={cn(
                                   "px-3 py-1 rounded-lg text-xs font-bold border flex items-center gap-1.5",
                                   member.role === 'Manager' ? "bg-purple-50 text-purple-700 border-purple-100" : "bg-slate-50 text-slate-600 border-slate-200"
                               )}>
                                   <Shield className="h-3 w-3" /> {member.role}
                               </div>
                               
                               {isAdmin && (
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => setEditingMember(member)}
                                        className="p-2 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition"
                                        title="Edit Role/Status"
                                    >
                                        <Edit2 className="h-4 w-4" />
                                    </button>
                                    <button 
                                        onClick={() => { if(confirm("Remove member?")) removeMember(member.id); }}
                                        className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                                        title="Remove Member"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                               )}
                           </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>

      {/* Add Modal */}
      <Modal 
        open={isAddOpen} 
        onClose={() => setIsAddOpen(false)} 
        title="Add New Member"
        footer={
            <div className="flex justify-end gap-3">
                <button onClick={() => setIsAddOpen(false)} className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition">Cancel</button>
                <button onClick={handleAdd} disabled={!newName || !newEmail} className="px-4 py-2 font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition disabled:opacity-50">
                    Send Invitation
                </button>
            </div>
        }
      >
          <div className="space-y-4">
              <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Full Name</label>
                  <input value={newName} onChange={e => setNewName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 font-semibold bg-slate-50 focus:bg-white transition" placeholder="e.g. Sarah Connor" />
              </div>
              <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Email Address</label>
                  <input value={newEmail} onChange={e => setNewEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 font-semibold bg-slate-50 focus:bg-white transition" placeholder="e.g. sarah@acme.com" />
              </div>
              <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Role</label>
                  <div className="flex gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
                      {(['Member', 'Manager'] as const).map(r => (
                          <button 
                            key={r} 
                            onClick={() => setNewRole(r)}
                            className={cn(
                                "flex-1 py-2 rounded-lg text-sm font-bold transition shadow-sm",
                                newRole === r ? "bg-white text-slate-900 border border-slate-200" : "text-slate-500 hover:text-slate-700 bg-transparent shadow-none"
                            )}
                          >
                              {r}
                          </button>
                      ))}
                  </div>
              </div>
          </div>
      </Modal>

      {/* Edit Member Modal */}
      <Modal 
        open={!!editingMember} 
        onClose={() => setEditingMember(null)} 
        title="Edit Member"
        footer={
            <div className="flex justify-end gap-3">
                <button onClick={() => setEditingMember(null)} className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition">Cancel</button>
                <button onClick={handleUpdateMember} className="px-4 py-2 font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition">
                    Save Changes
                </button>
            </div>
        }
      >
          {editingMember && (
              <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="h-12 w-12 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 text-lg">{editingMember.name.charAt(0)}</div>
                      <div>
                          <div className="font-bold text-slate-900">{editingMember.name}</div>
                          <div className="text-sm text-slate-500">{editingMember.email}</div>
                      </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Role</label>
                        <select 
                            value={editingMember.role}
                            onChange={e => setEditingMember({...editingMember, role: e.target.value as any})}
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 font-semibold bg-white cursor-pointer hover:border-slate-300"
                        >
                            <option value="Member">Member</option>
                            <option value="Manager">Manager</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Status</label>
                        <select 
                            value={editingMember.status}
                            onChange={e => setEditingMember({...editingMember, status: e.target.value as any})}
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 font-semibold bg-white cursor-pointer hover:border-slate-300"
                        >
                            <option value="Active">Active</option>
                            <option value="Invited">Invited</option>
                            <option value="Disabled">Disabled</option>
                        </select>
                    </div>
                  </div>
              </div>
          )}
      </Modal>

      {/* Group Settings Modal */}
      <Modal 
        open={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        title="Group Settings"
        footer={
            <div className="flex justify-between w-full">
                <button 
                  onClick={handleDeleteGroup}
                  className="px-4 py-2 font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition flex items-center gap-2"
                >
                    <Trash2 className="h-4 w-4" /> Delete Group
                </button>
                <div className="flex gap-3">
                    <button onClick={() => setIsSettingsOpen(false)} className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition">Cancel</button>
                    <button onClick={handleUpdateGroup} className="px-4 py-2 font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition">
                        Save
                    </button>
                </div>
            </div>
        }
      >
          <div className="space-y-6">
              <div className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Group Name</label>
                    <input value={groupName} onChange={e => setGroupName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 font-semibold" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Description</label>
                    <textarea value={groupDesc} onChange={e => setGroupDesc(e.target.value)} rows={2} className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-600 resize-none" />
                </div>
                
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div>
                        <div className="font-bold text-slate-900 text-sm">Enforce Tagging</div>
                        <div className="text-xs text-slate-500">Require cost center tags on spend</div>
                    </div>
                    <button 
                        onClick={() => {
                            if(group) updateGroup(group.id, { taggingEnforced: !group.taggingEnforced });
                        }}
                        className={cn(
                            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2",
                            group.taggingEnforced ? "bg-emerald-600" : "bg-slate-200"
                        )}
                    >
                        <span className={cn(
                            "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                            group.taggingEnforced ? "translate-x-6" : "translate-x-1"
                        )} />
                    </button>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-6">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
                      <div>
                          <div className="font-bold text-slate-900">Group Status</div>
                          <div className="text-xs text-slate-500 mt-0.5">Inactive groups cannot spend</div>
                      </div>
                      <button 
                        onClick={handleDeactivateGroup}
                        className={cn(
                            "px-4 py-2 rounded-xl text-sm font-bold transition border",
                            group.status === 'Active' 
                                ? "bg-white text-rose-600 border-rose-200 hover:bg-rose-50" 
                                : "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700"
                        )}
                      >
                          {group.status === 'Active' ? 'Deactivate' : 'Activate'}
                      </button>
                  </div>
              </div>
          </div>
      </Modal>

    </div>
  );
}
