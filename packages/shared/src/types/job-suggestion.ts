export interface JobSuggestionReason {
  key:
    | 'material_match'
    | 'recent_activity'
    | 'same_merchant'
    | 'geographic_proximity'
    | 'budget_remaining';
  score: number;
  detail: string;
}

export interface JobSuggestionScore {
  jobId: string;
  score: number;
  autoAssigned: boolean;
  needsManualReview: boolean;
  reasons: JobSuggestionReason[];
}
