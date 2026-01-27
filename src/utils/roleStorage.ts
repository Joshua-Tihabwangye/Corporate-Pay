import { useState, useEffect } from "react";

export type OrgRole = "Viewer" | "Member" | "Approver" | "Finance" | "Admin" | "Owner";

export type Permission =
    | "View wallet"
    | "Pay"
    | "Request"
    | "Approve"
    | "Withdraw"
    | "Manage beneficiaries"
    | "Batch payouts"
    | "Refunds"
    | "Export reports"
    | "Manage users"
    | "Manage policies";

export type RoleDef = {
    role: OrgRole;
    summary: string;
    permissions: Permission[];
};

export type DualControlKey =
    | "Beneficiary edits"
    | "Batch payouts"
    | "Refund approvals"
    | "Policy changes"
    | "Role changes"
    | "High value payouts";

export type DualControlRule = {
    key: DualControlKey;
    enabled: boolean;
    note: string;
};

export type ThresholdRule = {
    id: string;
    label: string;
    currency: "UGX" | "USD" | "CNY" | "KES";
    threshold: number;
    approvers: number;
    appliesTo: Array<"Purchases" | "Payouts" | "Refunds">;
};

const ROLES_KEY = "cpay_roles_v1";
const DUAL_KEY = "cpay_dual_v1";
const THRESHOLD_KEY = "cpay_thresholds_v1";

const SEED_ROLES: RoleDef[] = [
    {
        role: "Owner",
        summary: "Full control of org wallet and policies",
        permissions: ["View wallet", "Pay", "Request", "Approve", "Withdraw", "Manage beneficiaries", "Batch payouts", "Refunds", "Export reports", "Manage users", "Manage policies"],
    },
    {
        role: "Admin",
        summary: "Manage users and policies",
        permissions: ["View wallet", "Pay", "Request", "Approve", "Withdraw", "Manage beneficiaries", "Export reports", "Manage users", "Manage policies"],
    },
    {
        role: "Finance",
        summary: "Payout operations and reconciliation",
        permissions: ["View wallet", "Pay", "Request", "Approve", "Withdraw", "Manage beneficiaries", "Batch payouts", "Export reports"],
    },
    {
        role: "Approver",
        summary: "Approve purchases and payouts",
        permissions: ["View wallet", "Approve", "Pay", "Request"],
    },
    {
        role: "Member",
        summary: "Create requests and view own items",
        permissions: ["View wallet", "Request", "Pay"],
    },
    {
        role: "Viewer",
        summary: "Read-only access",
        permissions: ["View wallet"],
    },
];

const SEED_DUAL: DualControlRule[] = [
    { key: "Beneficiary edits", enabled: true, note: "Require second approval for beneficiary changes" },
    { key: "Batch payouts", enabled: true, note: "Maker-checker required for CSV batch payouts" },
    { key: "Refund approvals", enabled: false, note: "Optional dual-control for refunds" },
    { key: "Policy changes", enabled: true, note: "Any policy change requires dual-control" },
    { key: "Role changes", enabled: true, note: "Role assignments require approval" },
    { key: "High value payouts", enabled: true, note: "Extra approvals for payouts above threshold" },
];

const SEED_THRESHOLDS: ThresholdRule[] = [
    { id: "T-1", label: "Purchases", currency: "UGX", threshold: 500000, approvers: 2, appliesTo: ["Purchases"] },
    { id: "T-2", label: "Payouts", currency: "UGX", threshold: 300000, approvers: 2, appliesTo: ["Payouts"] },
    { id: "T-3", label: "Refunds", currency: "UGX", threshold: 150000, approvers: 1, appliesTo: ["Refunds"] },
];

export const roleStorage = {
    getRoles: (): RoleDef[] => {
        try {
            const stored = localStorage.getItem(ROLES_KEY);
            if (!stored) {
                localStorage.setItem(ROLES_KEY, JSON.stringify(SEED_ROLES));
                return SEED_ROLES;
            }
            return JSON.parse(stored);
        } catch {
            return SEED_ROLES;
        }
    },

    getRole: (roleName: OrgRole): RoleDef | undefined => {
        const roles = roleStorage.getRoles();
        return roles.find((r) => r.role === roleName);
    },

    updateRole: (roleName: OrgRole, updates: Partial<RoleDef>) => {
        const roles = roleStorage.getRoles();
        const idx = roles.findIndex((r) => r.role === roleName);
        if (idx !== -1) {
            roles[idx] = { ...roles[idx], ...updates };
            localStorage.setItem(ROLES_KEY, JSON.stringify(roles));
            window.dispatchEvent(new Event("role-storage-update"));
        }
    },

    getDualRules: (): DualControlRule[] => {
        try {
            const stored = localStorage.getItem(DUAL_KEY);
            if (!stored) {
                localStorage.setItem(DUAL_KEY, JSON.stringify(SEED_DUAL));
                return SEED_DUAL;
            }
            return JSON.parse(stored);
        } catch {
            return SEED_DUAL;
        }
    },

    updateDualRule: (key: DualControlKey, enabled: boolean) => {
        const rules = roleStorage.getDualRules();
        const idx = rules.findIndex((r) => r.key === key);
        if (idx !== -1) {
            rules[idx] = { ...rules[idx], enabled };
            localStorage.setItem(DUAL_KEY, JSON.stringify(rules));
            window.dispatchEvent(new Event("role-storage-update"));
        }
    },

    getThresholds: (): ThresholdRule[] => {
        try {
            const stored = localStorage.getItem(THRESHOLD_KEY);
            if (!stored) {
                localStorage.setItem(THRESHOLD_KEY, JSON.stringify(SEED_THRESHOLDS));
                return SEED_THRESHOLDS;
            }
            return JSON.parse(stored);
        } catch {
            return SEED_THRESHOLDS;
        }
    },

    updateThreshold: (id: string, updates: Partial<ThresholdRule>) => {
        const thresholds = roleStorage.getThresholds();
        const idx = thresholds.findIndex((t) => t.id === id);
        if (idx !== -1) {
            thresholds[idx] = { ...thresholds[idx], ...updates };
            localStorage.setItem(THRESHOLD_KEY, JSON.stringify(thresholds));
            window.dispatchEvent(new Event("role-storage-update"));
        }
    },
};

// Hooks for reactive updates
export function useRoles() {
    const [roles, setRoles] = useState<RoleDef[]>(roleStorage.getRoles());

    useEffect(() => {
        const handler = () => setRoles(roleStorage.getRoles());
        window.addEventListener("role-storage-update", handler);
        return () => window.removeEventListener("role-storage-update", handler);
    }, []);

    return { roles, updateRole: roleStorage.updateRole };
}

export function useRole(roleName: OrgRole | undefined) {
    const [role, setRole] = useState<RoleDef | undefined>(roleName ? roleStorage.getRole(roleName) : undefined);

    useEffect(() => {
        if (!roleName) return;
        setRole(roleStorage.getRole(roleName));

        const handler = () => setRole(roleStorage.getRole(roleName));
        window.addEventListener("role-storage-update", handler);
        return () => window.removeEventListener("role-storage-update", handler);
    }, [roleName]);

    return { role, updateRole: (updates: Partial<RoleDef>) => roleName && roleStorage.updateRole(roleName, updates) };
}

export function useDualRules() {
    const [dualRules, setDualRules] = useState<DualControlRule[]>(roleStorage.getDualRules());

    useEffect(() => {
        const handler = () => setDualRules(roleStorage.getDualRules());
        window.addEventListener("role-storage-update", handler);
        return () => window.removeEventListener("role-storage-update", handler);
    }, []);

    return { dualRules, updateDualRule: roleStorage.updateDualRule };
}

export function useThresholds() {
    const [thresholds, setThresholds] = useState<ThresholdRule[]>(roleStorage.getThresholds());

    useEffect(() => {
        const handler = () => setThresholds(roleStorage.getThresholds());
        window.addEventListener("role-storage-update", handler);
        return () => window.removeEventListener("role-storage-update", handler);
    }, []);

    return { thresholds, updateThreshold: roleStorage.updateThreshold };
}
