import { useJobBudget } from './useJobs';
import { getBudgetColor } from '../theme/colors';

export function useBudget(jobId: string) {
  const query = useJobBudget(jobId);

  const budgetData = query.data;
  const spent = budgetData?.totalSpent ?? 0;
  const budget = budgetData?.totalBudget ?? 0;
  const ratio = budget > 0 ? spent / budget : 0;
  const remaining = budget - spent;
  const isOverBudget = spent > budget && budget > 0;
  const color = getBudgetColor(spent, budget);

  return {
    ...query,
    spent,
    budget,
    ratio,
    remaining,
    isOverBudget,
    color,
    categories: {
      materials: {
        spent: budgetData?.materialsSpent ?? 0,
        budget: budgetData?.materialsBudget ?? 0,
      },
      labor: {
        spent: budgetData?.laborSpent ?? 0,
        budget: budgetData?.laborBudget ?? 0,
      },
      equipment: {
        spent: budgetData?.byCategory?.EQUIPMENT?.spent ?? 0,
        budget: budgetData?.byCategory?.EQUIPMENT?.budget ?? 0,
      },
      subcontractor: {
        spent: budgetData?.byCategory?.SUBCONTRACTOR?.spent ?? 0,
        budget: budgetData?.byCategory?.SUBCONTRACTOR?.budget ?? 0,
      },
      overhead: {
        spent: budgetData?.byCategory?.OVERHEAD?.spent ?? 0,
        budget: budgetData?.byCategory?.OVERHEAD?.budget ?? 0,
      },
    },
  };
}
