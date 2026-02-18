import { useQueries } from '@tanstack/react-query';
import { useJobs, jobKeys } from './useJobs';
import { jobsApi } from '../api/jobs';
import { useMemo } from 'react';
import { QUERY_STALE_TIME } from '../lib/constants';

export function useOverBudgetCount() {
  const { data } = useJobs({ status: 'ACTIVE' });
  const activeJobs = useMemo(
    () => data?.pages?.flatMap((p) => p.data) ?? [],
    [data],
  );

  const jobsWithBudget = useMemo(
    () => activeJobs.filter((j) => j.budgetTotal && j.budgetTotal > 0),
    [activeJobs],
  );

  const budgetQueries = useQueries({
    queries: jobsWithBudget.map((job) => ({
      queryKey: jobKeys.budget(job.id),
      queryFn: () => jobsApi.getBudget(job.id),
      staleTime: QUERY_STALE_TIME,
    })),
  });

  const count = useMemo(() => {
    let n = 0;
    for (const q of budgetQueries) {
      if (q.data && q.data.totalSpent > q.data.totalBudget && q.data.totalBudget > 0) {
        n++;
      }
    }
    return n;
  }, [budgetQueries]);

  return count;
}
