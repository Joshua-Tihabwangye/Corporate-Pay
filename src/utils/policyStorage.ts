export type PolicyStatus = "Draft" | "Active" | "Archived";
export type Severity = "Allow" | "Require approval" | "Require attestation" | "Block";
export type ConditionKey = "Module" | "Marketplace" | "Vendor" | "Category" | "Amount" | "Currency" | "Country" | "Cost center";

export type PolicyRule = {
    id: string;
    name: string;
    status: PolicyStatus;
    priority: number;
    when: Array<{ key: ConditionKey; op: "is" | "in" | "gte" | "lte" | "contains"; value: string }>;
    then: {
        action: Severity;
        reason: string;
        requireAttachment?: boolean;
        attachmentType?: string;
        attachmentThresholdUGX?: number;
        outOfPolicyHandling: "Stop" | "Allow with attestation" | "Route to approval";
    };
    lastEdited: string;
};

const STORAGE_KEY = "corporate_pay_policies";

const INITIAL_POLICIES: PolicyRule[] = [
    {
        id: "PR-1",
        name: "CorporatePay high value requires approval",
        status: "Active",
        priority: 1,
        when: [
            { key: "Module", op: "is", value: "CorporatePay" },
            { key: "Amount", op: "gte", value: "500000" },
        ],
        then: {
            action: "Require approval",
            reason: "Above approval threshold",
            outOfPolicyHandling: "Route to approval",
        },
        lastEdited: "Today",
    },
    {
        id: "PR-2",
        name: "Missing cost center blocks",
        status: "Active",
        priority: 2,
        when: [
            { key: "Cost center", op: "is", value: "" },
            { key: "Module", op: "in", value: "CorporatePay,Marketplace" },
        ],
        then: {
            action: "Block",
            reason: "Cost center is required",
            outOfPolicyHandling: "Stop",
        },
        lastEdited: "Yesterday",
    },
    {
        id: "PR-3",
        name: "Large refunds require attachment",
        status: "Active",
        priority: 3,
        when: [
            { key: "Module", op: "is", value: "E-Commerce" },
            { key: "Amount", op: "gte", value: "150000" },
        ],
        then: {
            action: "Require attestation",
            reason: "Large refund needs evidence",
            requireAttachment: true,
            attachmentType: "Refund proof",
            attachmentThresholdUGX: 150000,
            outOfPolicyHandling: "Allow with attestation",
        },
        lastEdited: "Last week",
    },
    {
        id: "PR-4",
        name: "Blocked vendor list",
        status: "Draft",
        priority: 10,
        when: [{ key: "Vendor", op: "contains", value: "banned" }],
        then: {
            action: "Block",
            reason: "Vendor is blocked",
            outOfPolicyHandling: "Stop",
        },
        lastEdited: "Draft",
    },
];

export const PolicyStorage = {
    getAll: (): PolicyRule[] => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (!stored) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_POLICIES));
                return INITIAL_POLICIES;
            }
            return JSON.parse(stored);
        } catch {
            return INITIAL_POLICIES;
        }
    },

    getById: (id: string): PolicyRule | undefined => {
        return PolicyStorage.getAll().find((p) => p.id === id);
    },

    save: (policy: PolicyRule) => {
        const policies = PolicyStorage.getAll();
        const index = policies.findIndex((p) => p.id === policy.id);
        if (index >= 0) {
            policies[index] = { ...policy, lastEdited: "Just now" };
        } else {
            policies.unshift({ ...policy, lastEdited: "Just now" });
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(policies));
    },

    delete: (id: string) => {
        const policies = PolicyStorage.getAll().filter((p) => p.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(policies));
    },
};
