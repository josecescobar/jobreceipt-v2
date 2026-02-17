import { create } from 'zustand';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

interface UIState {
  // Filters
  jobStatusFilter: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED' | 'ALL';
  expenseJobFilter: string | null;
  expenseCategoryFilter: string | null;
  expenseDateFrom: string | null;
  expenseDateTo: string | null;
  expenseMerchantSearch: string;

  // Expense selection
  expenseSelectionMode: boolean;
  selectedExpenseIds: string[];

  // Toast
  toasts: Toast[];

  // Actions
  setJobStatusFilter: (filter: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED' | 'ALL') => void;
  setExpenseJobFilter: (jobId: string | null) => void;
  setExpenseCategoryFilter: (category: string | null) => void;
  setExpenseDateRange: (from: string | null, to: string | null) => void;
  setExpenseMerchantSearch: (search: string) => void;
  enterExpenseSelectionMode: () => void;
  toggleExpenseSelection: (id: string) => void;
  selectAllExpenses: (ids: string[]) => void;
  clearExpenseSelection: () => void;
  addToast: (toast: Toast) => void;
  removeToast: (id: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  jobStatusFilter: 'ACTIVE',
  expenseJobFilter: null,
  expenseCategoryFilter: null,
  expenseDateFrom: null,
  expenseDateTo: null,
  expenseMerchantSearch: '',
  expenseSelectionMode: false,
  selectedExpenseIds: [],
  toasts: [],

  setJobStatusFilter: (filter) => set({ jobStatusFilter: filter }),
  setExpenseJobFilter: (jobId) => set({ expenseJobFilter: jobId }),
  setExpenseCategoryFilter: (category) =>
    set({ expenseCategoryFilter: category }),
  setExpenseDateRange: (from, to) =>
    set({ expenseDateFrom: from, expenseDateTo: to }),
  setExpenseMerchantSearch: (search) =>
    set({ expenseMerchantSearch: search }),
  enterExpenseSelectionMode: () =>
    set({ expenseSelectionMode: true }),
  toggleExpenseSelection: (id) =>
    set((state) => {
      const ids = state.selectedExpenseIds.includes(id)
        ? state.selectedExpenseIds.filter((i) => i !== id)
        : [...state.selectedExpenseIds, id];
      return { selectedExpenseIds: ids };
    }),
  selectAllExpenses: (ids) =>
    set({ selectedExpenseIds: ids }),
  clearExpenseSelection: () =>
    set({ expenseSelectionMode: false, selectedExpenseIds: [] }),
  addToast: (toast) =>
    set((state) => ({ toasts: [...state.toasts, toast] })),
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));
