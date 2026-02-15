import { create } from 'zustand';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

interface UIState {
  // Filters
  jobStatusFilter: 'ACTIVE' | 'COMPLETED' | 'ALL';
  expenseJobFilter: string | null;
  expenseCategoryFilter: string | null;
  expenseDateFrom: string | null;
  expenseDateTo: string | null;
  expenseMerchantSearch: string;

  // Toast
  toasts: Toast[];

  // Actions
  setJobStatusFilter: (filter: 'ACTIVE' | 'COMPLETED' | 'ALL') => void;
  setExpenseJobFilter: (jobId: string | null) => void;
  setExpenseCategoryFilter: (category: string | null) => void;
  setExpenseDateRange: (from: string | null, to: string | null) => void;
  setExpenseMerchantSearch: (search: string) => void;
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
  toasts: [],

  setJobStatusFilter: (filter) => set({ jobStatusFilter: filter }),
  setExpenseJobFilter: (jobId) => set({ expenseJobFilter: jobId }),
  setExpenseCategoryFilter: (category) =>
    set({ expenseCategoryFilter: category }),
  setExpenseDateRange: (from, to) =>
    set({ expenseDateFrom: from, expenseDateTo: to }),
  setExpenseMerchantSearch: (search) =>
    set({ expenseMerchantSearch: search }),
  addToast: (toast) =>
    set((state) => ({ toasts: [...state.toasts, toast] })),
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));
