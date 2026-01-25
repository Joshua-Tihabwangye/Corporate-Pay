import React, { useState } from "react";
import { ArrowRight, Building2, Check, ChevronRight, CreditCard, Plus, Search, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

export default function WalletSwitcher() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selectedWallet, setSelectedWallet] = useState("w_1");

  const wallets = [
    {
      id: "w_1",
      name: "Acme Group Ltd - UGX",
      balance: "UGX 6,800,000",
      currency: "UGX",
      type: "Main",
      status: "Active",
    },
    {
      id: "w_2",
      name: "Acme Group Ltd - USD",
      balance: "USD 12,450.00",
      currency: "USD",
      type: "USD Ops",
      status: "Active",
    },
    {
      id: "w_3",
      name: "Acme Kenya Ops",
      balance: "KES 450,000",
      currency: "KES",
      type: "Subsidiary",
      status: "Active",
    },
  ];

  const filteredWallets = wallets.filter((w) =>
    w.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 flex items-center justify-center">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900">Switch Wallet</h1>
              <p className="text-slate-500 mt-1 text-sm">Select an active wallet context for your session.</p>
            </div>
            <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search wallets..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-200 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="max-h-[400px] overflow-y-auto p-2">
          {filteredWallets.map((wallet) => (
            <button
              key={wallet.id}
              onClick={() => setSelectedWallet(wallet.id)}
              className={cn(
                "w-full text-left p-4 rounded-xl flex items-center justify-between group transition-all",
                selectedWallet === wallet.id
                  ? "bg-slate-900 text-white shadow-md"
                  : "hover:bg-slate-50 text-slate-600"
              )}
            >
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center font-bold text-xs",
                    selectedWallet === wallet.id
                      ? "bg-white/10 text-white"
                      : "bg-slate-100 text-slate-500 group-hover:bg-white group-hover:shadow-sm"
                  )}
                >
                  {wallet.currency}
                </div>
                <div>
                  <div
                    className={cn(
                      "font-semibold",
                      selectedWallet === wallet.id ? "text-white" : "text-slate-900"
                    )}
                  >
                    {wallet.name}
                  </div>
                  <div
                    className={cn(
                      "text-xs mt-0.5",
                      selectedWallet === wallet.id ? "text-slate-300" : "text-slate-500"
                    )}
                  >
                    {wallet.type} • {wallet.balance}
                  </div>
                </div>
              </div>
              {selectedWallet === wallet.id && (
                <div className="h-6 w-6 bg-white/20 rounded-full flex items-center justify-center">
                  <Check className="h-3 w-3 text-white" />
                </div>
              )}
            </button>
          ))}

          <button className="w-full mt-2 p-4 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center gap-2 text-slate-500 hover:border-slate-300 hover:text-slate-700 transition-colors">
            <Plus className="h-4 w-4" />
            <span className="font-semibold text-sm">Add new wallet</span>
          </button>
        </div>

        <div className="p-6 bg-white border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="text-slate-500 hover:text-slate-700 font-semibold text-sm px-4 py-2"
          >
            Cancel
          </button>
          <button
            onClick={() => navigate("/console/dashboard")}
            className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition-colors shadow-lg shadow-slate-900/10"
          >
            Switch Wallet <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
