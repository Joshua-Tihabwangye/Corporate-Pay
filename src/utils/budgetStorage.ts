
export type Budget = {
    id: string;
    group: string;
    module: string;
    marketplace: string;
    amount: number;
    period: string;
    hardCap: boolean;
    timestamp: string; // Stored as ISO string for JSON serialization
};

const STORAGE_KEY = 'corporate_pay_issued_budgets';

export const BudgetStorage = {
    getAll: (): Budget[] => {
        try {
            const item = localStorage.getItem(STORAGE_KEY);
            return item ? JSON.parse(item) : [];
        } catch (e) {
            console.error('Failed to load budgets', e);
            return [];
        }
    },

    add: (budget: Budget): Budget[] => {
        const current = BudgetStorage.getAll();
        const updated = [budget, ...current];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        // Dispatch a custom event so other components can react immediately if needed
        window.dispatchEvent(new Event('budget-storage-update'));
        return updated;
    },

    clearAll: () => {
        localStorage.removeItem(STORAGE_KEY);
        window.dispatchEvent(new Event('budget-storage-update'));
    },

    clearByPeriod: (filterFn: (b: Budget) => boolean) => {
        const current = BudgetStorage.getAll();
        const kept = current.filter(b => !filterFn(b));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(kept));
        window.dispatchEvent(new Event('budget-storage-update'));
    }
};
