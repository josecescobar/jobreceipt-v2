import { BadRequestException } from '@nestjs/common';

export interface SplitAssignment {
  lineItemId: string;
  jobId: string;
  lineItemTotalCents: number;
}

export interface SplitValidationResult {
  totalsByJob: Record<string, number>;
  assignedTotalCents: number;
}

export const validateSplitAssignments = (
  assignments: SplitAssignment[],
  receiptTotalCents: number,
  unassignedRemainderCents = 0,
): SplitValidationResult => {
  const lineItemIds = assignments.map((assignment) => assignment.lineItemId);
  const duplicates = lineItemIds.filter((id, index) => lineItemIds.indexOf(id) !== index);

  if (duplicates.length > 0) {
    throw new BadRequestException(`Duplicate line item assignments found: ${Array.from(new Set(duplicates)).join(', ')}`);
  }

  const totalsByJob: Record<string, number> = {};
  for (const assignment of assignments) {
    totalsByJob[assignment.jobId] = (totalsByJob[assignment.jobId] ?? 0) + assignment.lineItemTotalCents;
  }

  const assignedTotalCents = Object.values(totalsByJob).reduce((sum, value) => sum + value, 0);

  if (assignedTotalCents + unassignedRemainderCents !== receiptTotalCents) {
    throw new BadRequestException(
      `Split invariant failed. Assigned (${assignedTotalCents}) + remainder (${unassignedRemainderCents}) must equal receipt total (${receiptTotalCents}).`,
    );
  }

  return {
    totalsByJob,
    assignedTotalCents,
  };
};
