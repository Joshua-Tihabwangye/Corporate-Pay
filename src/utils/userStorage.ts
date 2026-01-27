import { useEffect, useState } from "react";

export type OrgRole = "Viewer" | "Member" | "Approver" | "Finance" | "Admin" | "Owner";
export type MemberStatus = "Active" | "Invited" | "Disabled" | "Suspended";

export type Person = {
    id: string;
    name: string;
    email: string;
    role: OrgRole;
    status: MemberStatus;
    lastActive: string;
    twoFA: boolean;
    trustedDevice: boolean;
    permissions: string[];
    joined?: string;
};

const STORAGE_KEY = "cpay_users_v1";

export function permissionTemplate(role: OrgRole) {
    const map: Record<OrgRole, string[]> = {
        Owner: ["All access", "Change policies", "Manage users", "Manage funding"],
        Admin: ["Manage users", "Manage policies", "View reports"],
        Finance: ["Approve payouts", "Export reports", "Reconcile"],
        Approver: ["Approve purchases", "Approve payouts"],
        Member: ["Create requests", "View own items"],
        Viewer: ["View only"],
    };
    return map[role] || [];
}

const SEED_DATA: Person[] = [
    {
        id: "U-1",
        name: "Ronald Isabirye",
        email: "ronald@acme.ug",
        role: "Owner",
        status: "Active",
        lastActive: "Now",
        twoFA: true,
        trustedDevice: true,
        permissions: permissionTemplate("Owner"),
        joined: "Oct 2023",
    },
    {
        id: "U-2",
        name: "Finance Desk",
        email: "finance@acme.ug",
        role: "Finance",
        status: "Active",
        lastActive: "12m ago",
        twoFA: true,
        trustedDevice: true,
        permissions: permissionTemplate("Finance"),
        joined: "Nov 2023",
    },
    {
        id: "U-3",
        name: "Procurement",
        email: "procurement@acme.ug",
        role: "Approver",
        status: "Active",
        lastActive: "2h ago",
        twoFA: false,
        trustedDevice: false,
        permissions: permissionTemplate("Approver"),
        joined: "Dec 2023",
    },
    {
        id: "U-4",
        name: "Auditor",
        email: "audit@acme.ug",
        role: "Viewer",
        status: "Disabled",
        lastActive: "1w ago",
        twoFA: false,
        trustedDevice: false,
        permissions: permissionTemplate("Viewer"),
        joined: "Jan 2024",
    },
];

export const userStorage = {
    getAll: (): Person[] => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (!stored) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_DATA));
                return SEED_DATA;
            }
            return JSON.parse(stored);
        } catch {
            return SEED_DATA;
        }
    },

    getById: (id: string): Person | undefined => {
        const users = userStorage.getAll();
        return users.find((u) => u.id === id);
    },

    update: (id: string, updates: Partial<Person>) => {
        const users = userStorage.getAll();
        const idx = users.findIndex((u) => u.id === id);
        if (idx !== -1) {
            users[idx] = { ...users[idx], ...updates };

            // If role changed, reset permissions to match template unless manually overridden (simplified logic: always reset on role change for now)
            if (updates.role) {
                users[idx].permissions = permissionTemplate(updates.role);
            }

            localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
            // Dispatch event for local updates across components
            window.dispatchEvent(new Event("user-storage-update"));
        }
    },

    add: (person: Person) => {
        const users = userStorage.getAll();
        users.unshift(person);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
        window.dispatchEvent(new Event("user-storage-update"));
    },
};

// Hook for reactive updates
export function useUsers() {
    const [users, setUsers] = useState<Person[]>(userStorage.getAll());

    useEffect(() => {
        const handler = () => setUsers(userStorage.getAll());
        window.addEventListener("user-storage-update", handler);
        return () => window.removeEventListener("user-storage-update", handler);
    }, []);

    return { users, updateUser: userStorage.update, addUser: userStorage.add };
}

export function useUser(id: string | undefined) {
    const [user, setUser] = useState<Person | undefined>(id ? userStorage.getById(id) : undefined);

    useEffect(() => {
        if (!id) return;
        setUser(userStorage.getById(id));

        const handler = () => setUser(userStorage.getById(id));
        window.addEventListener("user-storage-update", handler);
        return () => window.removeEventListener("user-storage-update", handler);
    }, [id]);

    return { user, updateUser: (updates: Partial<Person>) => id && userStorage.update(id, updates) };
}
