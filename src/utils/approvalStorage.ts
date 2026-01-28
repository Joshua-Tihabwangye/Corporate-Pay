export type Channel = "In-app" | "Email" | "WhatsApp" | "WeChat" | "SMS";
export type StageType = "Manager" | "Finance" | "Risk" | "Custom";

export type ApprovalStage = {
    id: string;
    name: string;
    type: StageType;
    requiredApprovers: number;
    delegatesAllowed: boolean;
    escalationAfter: string;
    notifyChannels: Channel[];
    note: string;
};

export type ApprovalFlow = {
    id: string;
    name: string;
    status: "Draft" | "Active" | "Archived";
    appliesTo: string;
    thresholdCurrency: string;
    thresholdAmount: number;
    stages: ApprovalStage[];
    lastEdited: string;
};

const STORAGE_KEY = "corporate_pay_approval_flows";

const INITIAL_FLOWS: ApprovalFlow[] = [
    {
        id: "F-1",
        name: "CorporatePay purchases",
        status: "Active",
        appliesTo: "Purchases",
        thresholdCurrency: "UGX",
        thresholdAmount: 100000,
        stages: [
            {
                id: "S-1",
                name: "Manager approval",
                type: "Manager",
                requiredApprovers: 1,
                delegatesAllowed: true,
                escalationAfter: "2h",
                notifyChannels: ["In-app", "Email", "WhatsApp"],
                note: "First line approval",
            },
            {
                id: "S-2",
                name: "Finance approval",
                type: "Finance",
                requiredApprovers: 1,
                delegatesAllowed: true,
                escalationAfter: "4h",
                notifyChannels: ["In-app", "Email", "WeChat"],
                note: "Final approval",
            },
        ],
        lastEdited: "Today",
    },
];

export const ApprovalStorage = {
    getAll: (): ApprovalFlow[] => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (!stored) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_FLOWS));
                return INITIAL_FLOWS;
            }
            return JSON.parse(stored);
        } catch {
            return INITIAL_FLOWS;
        }
    },

    getById: (id: string): ApprovalFlow | undefined => {
        return ApprovalStorage.getAll().find((f) => f.id === id);
    },

    save: (flow: ApprovalFlow) => {
        const flows = ApprovalStorage.getAll();
        const index = flows.findIndex((f) => f.id === flow.id);
        if (index >= 0) {
            flows[index] = { ...flow, lastEdited: "Just now" };
        } else {
            flows.unshift({ ...flow, lastEdited: "Just now" });
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(flows));
    },

    delete: (id: string) => {
        const flows = ApprovalStorage.getAll().filter((f) => f.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(flows));
    },
};
