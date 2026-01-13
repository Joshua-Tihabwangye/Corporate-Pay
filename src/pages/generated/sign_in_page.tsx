import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ROUTES } from "../../routes/paths";
import {
    Building2,
    ChevronDown,
    Eye,
    EyeOff,
    Lock,
    Mail,
    Sparkles,
} from "lucide-react";

const EVZ = {
    green: "#03CD8C",
    orange: "#F77F00",
};

function cn(...parts: Array<string | false | null | undefined>) {
    return parts.filter(Boolean).join(" ");
}

export default function SignInPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [org, setOrg] = useState("Acme Group Ltd");
    const [orgOpen, setOrgOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const orgs = ["Acme Group Ltd", "EVzone Demo Org", "Kampala Holdings"];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!email || !password) {
            setError("Please enter email and password");
            return;
        }

        setLoading(true);
        // Simulate login
        setTimeout(() => {
            setLoading(false);
            navigate(ROUTES.CONSOLE.DASHBOARD);
        }, 1000);
    };

    const handleSSO = () => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            navigate(ROUTES.CONSOLE.DASHBOARD);
        }, 800);
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-emerald-50 p-4">
            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-md"
            >
                {/* Card */}
                <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_30px_90px_rgba(2,8,23,0.12)]">
                    {/* Header */}
                    <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-6 py-6">
                        <div className="flex items-center gap-3">
                            <div
                                className="grid h-12 w-12 place-items-center rounded-2xl text-white shadow-lg"
                                style={{ background: EVZ.green }}
                            >
                                <Sparkles className="h-6 w-6" />
                            </div>
                            <div>
                                <div className="text-lg font-bold text-slate-900">CorporatePay</div>
                                <div className="text-sm text-slate-500">Sign in to your account</div>
                            </div>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4 p-6">
                        {/* Organization selector */}
                        <div>
                            <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                                Organization
                            </label>
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setOrgOpen(!orgOpen)}
                                    className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                                >
                                    <div className="flex items-center gap-2">
                                        <Building2 className="h-4 w-4 text-slate-400" />
                                        <span>{org}</span>
                                    </div>
                                    <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform", orgOpen && "rotate-180")} />
                                </button>

                                {orgOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="absolute left-0 right-0 z-10 mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
                                    >
                                        {orgs.map((o) => (
                                            <button
                                                key={o}
                                                type="button"
                                                onClick={() => {
                                                    setOrg(o);
                                                    setOrgOpen(false);
                                                }}
                                                className={cn(
                                                    "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-slate-50",
                                                    org === o ? "bg-emerald-50 font-medium text-emerald-700" : "text-slate-700"
                                                )}
                                            >
                                                <Building2 className="h-4 w-4" />
                                                {o}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                                Email address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@company.com"
                                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
                                {error}
                            </div>
                        )}

                        {/* Forgot password */}
                        <div className="text-right">
                            <button
                                type="button"
                                className="text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:underline"
                            >
                                Forgot password?
                            </button>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:opacity-95 focus:outline-none focus:ring-4 focus:ring-emerald-200 disabled:opacity-60"
                            style={{ background: EVZ.green }}
                        >
                            {loading ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            ) : (
                                "Sign in"
                            )}
                        </button>

                        {/* Divider */}
                        <div className="relative py-2">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-200" />
                            </div>
                            <div className="relative flex justify-center">
                                <span className="bg-white px-3 text-xs text-slate-500">or continue with</span>
                            </div>
                        </div>

                        {/* SSO */}
                        <button
                            type="button"
                            onClick={handleSSO}
                            disabled={loading}
                            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-100 disabled:opacity-60"
                        >
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            Continue with Google SSO
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 text-center text-xs text-slate-500">
                        By signing in, you agree to our{" "}
                        <a href="#" className="font-medium text-emerald-600 hover:underline">Terms of Service</a>
                        {" "}and{" "}
                        <a href="#" className="font-medium text-emerald-600 hover:underline">Privacy Policy</a>
                    </div>
                </div>

                {/* Back to landing */}
                <div className="mt-4 text-center">
                    <button
                        type="button"
                        onClick={() => navigate(ROUTES.HOME)}
                        className="text-sm font-medium text-slate-500 hover:text-slate-700"
                    >
                        ← Back to home
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
