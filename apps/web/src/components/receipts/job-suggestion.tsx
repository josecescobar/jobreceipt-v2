'use client';

import type { Job } from '@/lib/api/types';

interface SuggestionReason {
  key: string;
  score: number;
  detail: string;
}

interface JobSuggestionProps {
  suggestedJobId: string | null;
  suggestedScore: number | null;
  suggestedReasons: unknown;
  jobs: Job[];
}

const REASON_LABELS: Record<string, string> = {
  material_match: 'Material Match',
  recent_activity: 'Recent Activity',
  same_merchant: 'Same Merchant',
  geographic_proximity: 'Nearby Location',
  budget_remaining: 'Budget Available',
};

export function JobSuggestion({
  suggestedJobId,
  suggestedScore,
  suggestedReasons,
  jobs,
}: JobSuggestionProps) {
  if (!suggestedJobId) {
    return (
      <p className="text-sm text-muted-foreground">
        No job suggestion available. Please assign manually.
      </p>
    );
  }

  const job = jobs.find((j) => j.id === suggestedJobId);
  const reasons = Array.isArray(suggestedReasons)
    ? (suggestedReasons as SuggestionReason[])
    : [];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">
            {job?.name ?? 'Unknown Job'}
          </p>
          {job?.customerName && (
            <p className="text-xs text-muted-foreground">
              {job.customerName}
            </p>
          )}
        </div>
        {suggestedScore != null && (
          <div className="text-right">
            <span className="text-lg font-bold">
              {Math.round(suggestedScore)}%
            </span>
            <p className="text-xs text-muted-foreground">match score</p>
          </div>
        )}
      </div>

      {suggestedScore != null && (
        <div className="h-2 rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all ${
              suggestedScore > 80
                ? 'bg-green-500'
                : suggestedScore > 60
                  ? 'bg-amber-500'
                  : 'bg-red-500'
            }`}
            style={{ width: `${Math.min(suggestedScore, 100)}%` }}
          />
        </div>
      )}

      {reasons.length > 0 && (
        <div className="space-y-1.5">
          {reasons.map((reason, i) => (
            <div
              key={i}
              className="flex items-start gap-2 text-xs text-muted-foreground"
            >
              <span className="font-medium text-foreground">
                {REASON_LABELS[reason.key] ?? reason.key}:
              </span>
              <span>{reason.detail}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
