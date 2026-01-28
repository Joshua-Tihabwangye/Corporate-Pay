export type ApprovalStatus = "Pending" | "Approved" | "Rejected" | "Escalated";
export type Currency = "UGX" | "USD" | "CNY" | "KES";

export type ApprovalItem = {
    id: string;
    orgId: string;
    orgName: string;
    module: string;
    requestType: "Purchase" | "Payout" | "Refund" | "Policy change";
    requester: string;
    amount: number;
    currency: Currency;
    status: ApprovalStatus;
    createdAt: string;
    policyWhy: string;
    attachments: number;
    comments: number;
    sla: { dueIn: string; breached: boolean; target: string };
    escalationPath: string;
    auditTrail: Array<{ when: string; who: string; action: string }>;
    workflow?: string;
};

const STORAGE_KEY = "corporate_pay_approvals";

const INITIAL_ITEMS: ApprovalItem[] = [
    {
        id: "AP-1001",
        orgId: "org_acme",
        orgName: "Acme Group Ltd",
        module: "CorporatePay",
        requestType: "Purchase",
        requester: "Procurement",
        amount: 540000,
        currency: "UGX",
        status: "Pending",
        createdAt: "Today 08:00",
        policyWhy: "Above UGX 500,000 approval threshold. Cost center required.",
        attachments: 2,
        comments: 3,
        sla: { dueIn: "1h 10m", breached: false, target: "4h" },
        escalationPath: "Approver → Finance → Admin",
        auditTrail: [
            { when: "Today 08:00", who: "Procurement", action: "Submitted request" },
            { when: "Today 08:10", who: "Approver", action: "Approved stage 1" },
            { when: "Now", who: "Finance", action: "Pending" },
        ],
        workflow: "CorporatePay purchases",
    },
    {
        id: "AP-1002",
        orgId: "org_acme",
        orgName: "Acme Group Ltd",
        module: "Wallet",
        requestType: "Payout",
        requester: "Finance Desk",
        amount: 1200000,
        currency: "UGX",
        status: "Escalated",
        createdAt: "Today 06:40",
        policyWhy: "High value payout requires dual-control and verified beneficiary.",
        attachments: 1,
        comments: 2,
        sla: { dueIn: "Breached", breached: true, target: "2h" },
        escalationPath: "Finance → Admin → EVzone Support",
        auditTrail: [
            { when: "Today 06:40", who: "Finance Desk", action: "Submitted payout" },
            { when: "Today 07:10", who: "System", action: "Escalated due to SLA" },
        ],
        workflow: "Payout approvals",
    },
    {
        id: "AP-1003",
        orgId: "org_khl",
        orgName: "Kampala Holdings",
        module: "CorporatePay",
        requestType: "Purchase",
        requester: "Member",
        amount: 180000,
        currency: "UGX",
        status: "Pending",
        createdAt: "Yesterday",
        policyWhy: "Org wallet deposit depleted. Alternative method required or funding request.",
        attachments: 0,
        comments: 1,
        sla: { dueIn: "6h", breached: false, target: "24h" },
        escalationPath: "Approver → Admin",
        auditTrail: [{ when: "Yesterday", who: "Member", action: "Submitted" }],
        workflow: "CorporatePay purchases",
    },
    {
        id: "AP-1004",
        orgId: "org_acme",
        orgName: "Acme Group Ltd",
        module: "E-Commerce",
        requestType: "Refund",
        requester: "Support Agent",
        amount: 220000,
        currency: "UGX",
        status: "Pending",
        createdAt: "2 days ago",
        policyWhy: "Refund above UGX 150,000 requires evidence attachment and attestation.",
        attachments: 1,
        comments: 0,
        sla: { dueIn: "10h", breached: false, target: "24h" },
        escalationPath: "Support → Finance",
        auditTrail: [{ when: "2 days ago", who: "Support Agent", action: "Requested refund approval" }],
        workflow: "Refund approvals",
    },
];

export const ApprovalsStorage = {
    getAll: (): ApprovalItem[] => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (!stored) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_ITEMS));
                return INITIAL_ITEMS;
            }
            return JSON.parse(stored);
        } catch {
            return INITIAL_ITEMS;
        }
    },

    getById: (id: string): ApprovalItem | undefined => {
        return ApprovalsStorage.getAll().find((i) => i.id === id);
    },

    updateStatus: (id: string, status: ApprovalStatus, comment?: string) => {
        const items = ApprovalsStorage.getAll();
        const index = items.findIndex((i) => i.id === id);
        if (index >= 0) {
            const item = items[index];
            item.status = status;
            item.auditTrail.push({
                when: "Just now",
                who: "Current User",
                action: `${status}${comment ? `: ${comment}` : ""}`,
            });
            items[index] = item;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        }
    },

    getWorkflows: (): string[] => {
        const items = ApprovalsStorage.getAll();
        return Array.from(new Set(items.map((i) => i.workflow).filter(Boolean) as string[]));
    },
};
