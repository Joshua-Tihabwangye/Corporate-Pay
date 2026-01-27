import { useEffect, useState } from "react";

// --- Types ---

export type OrgRole = "Viewer" | "Member" | "Approver" | "Finance" | "Admin" | "Owner";

export type Group = {
    id: string;
    name: string;
    description: string;
    defaultCostCenterId?: string;
    visibility: "All" | "Group only" | "Managers only";
    taggingEnforced: boolean;
    status: "Active" | "Inactive" | "Archived";
};

export type CostCenter = {
    id: string;
    code: string;
    name: string;
    defaultFor?: string; // group id
    spendLimitUGX?: number;
    tagsRequired: boolean;
    description?: string;
};

export type GroupMember = {
    id: string;
    groupId: string;
    name: string;
    email: string;
    role: "Manager" | "Member";
    status: "Active" | "Invited" | "Disabled";
    joinedAt: string;
};

export type Mapping = {
    id: string;
    rule: string;
    targetCostCenterId: string;
    default: boolean;
    note: string;
};

const STORAGE_KEY = "cpay_groups_v1";

// --- Seed Data ---

const SEED_GROUPS: Group[] = [
    { id: "G-OPS", name: "Operations", description: "Daily operations spend", defaultCostCenterId: "CC-OPS", visibility: "Managers only", taggingEnforced: true, status: "Active" },
    { id: "G-PROC", name: "Procurement", description: "Purchases and vendor payments", defaultCostCenterId: "CC-PROC", visibility: "Group only", taggingEnforced: true, status: "Active" },
    { id: "G-MKT", name: "Marketing", description: "Campaigns and Shoppable Adz", defaultCostCenterId: "CC-MKT", visibility: "All", taggingEnforced: false, status: "Active" },
];

const SEED_COST_CENTERS: CostCenter[] = [
    { id: "CC-OPS", code: "OPS-001", name: "Operations", defaultFor: "G-OPS", spendLimitUGX: 3000000, tagsRequired: true, description: "General ops" },
    { id: "CC-PROC", code: "PRC-001", name: "Procurement", defaultFor: "G-PROC", spendLimitUGX: 5000000, tagsRequired: true, description: "Procurement" },
    { id: "CC-MKT", code: "MKT-001", name: "Marketing", defaultFor: "G-MKT", spendLimitUGX: 2000000, tagsRequired: false, description: "Marketing campaigns" },
];

const SEED_MAPPINGS: Mapping[] = [
    { id: "M-1", rule: "Module: CorporatePay", targetCostCenterId: "CC-PROC", default: true, note: "Corporate purchases map to procurement" },
    { id: "M-2", rule: "Module: Shoppable Adz", targetCostCenterId: "CC-MKT", default: true, note: "Ad spend maps to marketing" },
];

const SEED_MEMBERS: GroupMember[] = [
    { id: "GM-1", groupId: "G-OPS", name: "Alice Johnson", email: "alice@acme.com", role: "Manager", status: "Active", joinedAt: new Date().toISOString() },
    { id: "GM-2", groupId: "G-OPS", name: "Bob Smith", email: "bob@acme.com", role: "Member", status: "Active", joinedAt: new Date().toISOString() },
];

type StorageData = {
    groups: Group[];
    costCenters: CostCenter[];
    mappings: Mapping[];
    members: GroupMember[];
};

// --- Storage Engine ---

export const GroupsStorage = {
    getData: (): StorageData => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (!stored) {
                const initial: StorageData = { groups: SEED_GROUPS, costCenters: SEED_COST_CENTERS, mappings: SEED_MAPPINGS, members: SEED_MEMBERS };
                localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
                return initial;
            }
            return JSON.parse(stored);
        } catch {
            return { groups: [], costCenters: [], mappings: [], members: [] };
        }
    },

    save: (data: StorageData) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        window.dispatchEvent(new Event("groups-storage-update"));
    },

    // --- Specific helpers ---

    getGroup: (id: string) => GroupsStorage.getData().groups.find(g => g.id === id),
    getCostCenter: (id: string) => GroupsStorage.getData().costCenters.find(c => c.id === id),
    getMembers: (groupId: string) => GroupsStorage.getData().members.filter(m => m.groupId === groupId),

    addGroup: (g: Group) => {
        const data = GroupsStorage.getData();
        data.groups.push(g);
        GroupsStorage.save(data);
    },

    updateGroup: (id: string, updates: Partial<Group>) => {
        const data = GroupsStorage.getData();
        const idx = data.groups.findIndex(g => g.id === id);
        if (idx !== -1) {
            data.groups[idx] = { ...data.groups[idx], ...updates };
            GroupsStorage.save(data);
        }
    },

    removeGroup: (id: string) => {
        const data = GroupsStorage.getData();
        data.groups = data.groups.filter(g => g.id !== id);
        GroupsStorage.save(data);
    },

    addMember: (m: GroupMember) => {
        const data = GroupsStorage.getData();
        data.members.push(m);
        GroupsStorage.save(data);
    },

    updateMember: (id: string, updates: Partial<GroupMember>) => {
        const data = GroupsStorage.getData();
        const idx = data.members.findIndex(m => m.id === id);
        if (idx !== -1) {
            data.members[idx] = { ...data.members[idx], ...updates };
            GroupsStorage.save(data);
        }
    },

    removeMember: (id: string) => {
        const data = GroupsStorage.getData();
        data.members = data.members.filter(m => m.id !== id);
        GroupsStorage.save(data);
    },

    addCostCenter: (c: CostCenter) => {
        const data = GroupsStorage.getData();
        data.costCenters.push(c);
        GroupsStorage.save(data);
    },

    updateCostCenter: (id: string, updates: Partial<CostCenter>) => {
        const data = GroupsStorage.getData();
        const idx = data.costCenters.findIndex(c => c.id === id);
        if (idx !== -1) {
            data.costCenters[idx] = { ...data.costCenters[idx], ...updates };
            GroupsStorage.save(data);
        }
    },

    addMapping: (m: Mapping) => {
        const data = GroupsStorage.getData();
        data.mappings.push(m);
        GroupsStorage.save(data);
    },

    updateMapping: (id: string, updates: Partial<Mapping>) => {
        const data = GroupsStorage.getData();
        const idx = data.mappings.findIndex(m => m.id === id);
        if (idx !== -1) {
            data.mappings[idx] = { ...data.mappings[idx], ...updates };
            GroupsStorage.save(data);
        }
    },

    // For Simulation
    findMapping: (module: string, vendor?: string) => {
        const data = GroupsStorage.getData();
        return data.mappings.find(m => m.rule.includes(module) || (vendor && m.rule.includes(vendor)));
    }
};

// --- Hook ---

export function useGroupsData() {
    const [data, setData] = useState<StorageData>(GroupsStorage.getData());

    useEffect(() => {
        const handler = () => setData(GroupsStorage.getData());
        window.addEventListener("groups-storage-update", handler);
        return () => window.removeEventListener("groups-storage-update", handler);
    }, []);

    return {
        ...data,
        refresh: () => setData(GroupsStorage.getData()),
        addGroup: GroupsStorage.addGroup,
        updateGroup: GroupsStorage.updateGroup,
        removeGroup: GroupsStorage.removeGroup,
        addCostCenter: GroupsStorage.addCostCenter,
        updateCostCenter: GroupsStorage.updateCostCenter,
        addMapping: GroupsStorage.addMapping,
        updateMapping: GroupsStorage.updateMapping,
        addMember: GroupsStorage.addMember,
        updateMember: GroupsStorage.updateMember,
        removeMember: GroupsStorage.removeMember,
        findMapping: GroupsStorage.findMapping
    };
}
