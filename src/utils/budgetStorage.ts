import { useEffect, useState } from "react";

export type BudgetPeriod = "Weekly" | "Monthly" | "Quarterly" | "Annual";

export type Budget = {
    id: string;
    group: string;
    module: string;
    marketplace: string;
    amount: number;
    period: string;
    hardCap: boolean;
    timestamp: string;
    spent?: number; // Optional, for display
};

const STORAGE_KEY = "cpay_budgets_v1";

const SEED_DATA: Budget[] = [
    {
        id: "B-1",
        group: "Operations",
        module: "All",
        marketplace: "All",
        amount: 5000000,
        period: "Monthly",
        hardCap: true,
        timestamp: new Date().toISOString(),
        spent: 3200000
    },
    {
        id: "B-2",
        group: "Sales",
        module: "Rides & Logistics",
        marketplace: "All",
        amount: 2500000,
        period: "Monthly",
        hardCap: false,
        timestamp: new Date().toISOString(),
        spent: 2100000
    },
    {
        id: "B-3",
        group: "Finance",
        module: "All",
        marketplace: "All",
        amount: 8000000,
        period: "Quarterly",
        hardCap: true,
        timestamp: new Date().toISOString(),
        spent: 0
    }
];

export const BudgetStorage = {
    getAll: (): Budget[] => {
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

    getById: (id: string): Budget | undefined => {
        const items = BudgetStorage.getAll();
        return items.find((i) => i.id === id);
    },

    add: (item: Budget) => {
        const items = BudgetStorage.getAll();
        items.unshift(item);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        window.dispatchEvent(new Event("budget-storage-update"));
    },

    update: (id: string, updates: Partial<Budget>) => {
        const items = BudgetStorage.getAll();
        const idx = items.findIndex((i) => i.id === id);
        if (idx !== -1) {
            items[idx] = { ...items[idx], ...updates };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
            window.dispatchEvent(new Event("budget-storage-update"));
        }
    },

    delete: (id: string) => {
        const items = BudgetStorage.getAll();
        const newItems = items.filter(i => i.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
        window.dispatchEvent(new Event("budget-storage-update"));
    }
};

export function useBudgets() {
    const [budgets, setBudgets] = useState<Budget[]>(BudgetStorage.getAll());

    useEffect(() => {
        const handler = () => setBudgets(BudgetStorage.getAll());
        window.addEventListener("budget-storage-update", handler);
        return () => window.removeEventListener("budget-storage-update", handler);
    }, []);

    return {
        budgets,
        addBudget: BudgetStorage.add,
        updateBudget: BudgetStorage.update,
        deleteBudget: BudgetStorage.delete
    };
}
