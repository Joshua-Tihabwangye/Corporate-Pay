import React, { useState } from "react";
import { ArrowLeft, Building2, Check, ChevronRight, Globe, MapPin, Plus, Save, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

export default function EntityManager() {
  const navigate = useNavigate();
  const [entities, setEntities] = useState([
      { id: 1, name: "Kampala Holdings Ltd", country: "Uganda", city: "Kampala", type: "Main", status: "Active" },
      { id: 2, name: "KHL Kenya Ops", country: "Kenya", city: "Nairobi", type: "Subsidiary", status: "Active" }
  ]);
  
  const [showAdd, setShowAdd] = useState(false);
  const [newEntity, setNewEntity] = useState({ name: "", country: "Uganda", city: "" });

  const handleAdd = () => {
      setEntities([...entities, { id: Date.now(), ...newEntity, type: "Subsidiary", status: "Active" }]);
      setShowAdd(false);
      setNewEntity({ name: "", country: "Uganda", city: "" });
  };

  return (
    <div className="min-h-screen bg-slate-50">
       <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4">
             <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-slate-100 rounded-full text-slate-500">
                <ArrowLeft className="h-5 w-5" />
             </button>
             <div>
                <h1 className="text-lg font-bold text-slate-900">Entity Management</h1>
                <p className="text-xs text-slate-500">Manage legal entities and operating countries</p>
             </div>
          </div>
          <button 
            onClick={() => setShowAdd(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2"
          >
             <Plus className="h-4 w-4" /> Add Entity
          </button>
       </div>

       <div className="max-w-4xl mx-auto p-6 space-y-6">
          {showAdd && (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-lg mb-6 animate-in slide-in-from-top-4">
                  <h3 className="text-sm font-bold text-slate-900 mb-4">Add New Legal Entity</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                          <label className="text-xs font-semibold text-slate-500 mb-1 block">Legal Name</label>
                          <input 
                            value={newEntity.name}
                            onChange={e => setNewEntity({...newEntity, name: e.target.value})}
                            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-500"
                            placeholder="e.g. Acme Tanzania Ltd"
                          />
                      </div>
                      <div>
                          <label className="text-xs font-semibold text-slate-500 mb-1 block">Country</label>
                          <select 
                             value={newEntity.country}
                             onChange={e => setNewEntity({...newEntity, country: e.target.value})}
                             className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                          >
                              <option>Uganda</option>
                              <option>Kenya</option>
                              <option>Tanzania</option>
                              <option>Rwanda</option>
                          </select>
                      </div>
                      <div>
                          <label className="text-xs font-semibold text-slate-500 mb-1 block">City</label>
                          <input 
                            value={newEntity.city}
                            onChange={e => setNewEntity({...newEntity, city: e.target.value})}
                            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-500"
                            placeholder="e.g. Dar es Salaam"
                          />
                      </div>
                  </div>
                  <div className="mt-4 flex justify-end gap-2 border-t border-slate-100 pt-4">
                      <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 rounded-xl">Cancel</button>
                      <button onClick={handleAdd} className="px-4 py-2 text-sm font-semibold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700">Save Entity</button>
                  </div>
              </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {entities.map(e => (
                 <div key={e.id} className="bg-white rounded-3xl border border-slate-200 p-5 hover:shadow-md transition-shadow group">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                                <Building2 className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900">{e.name}</h3>
                                <p className="text-xs text-slate-500">{e.type}</p>
                            </div>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                            <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700"><ChevronRight className="h-4 w-4" /></button>
                        </div>
                    </div>
                    <div className="mt-4 flex items-center gap-4 text-xs text-slate-600">
                        <div className="flex items-center gap-1"><Globe className="h-3 w-3" /> {e.country}</div>
                        <div className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {e.city}</div>
                        <div className="ml-auto px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-semibold">{e.status}</div>
                    </div>
                 </div>
             ))}
          </div>
       </div>
    </div>
  );
}
