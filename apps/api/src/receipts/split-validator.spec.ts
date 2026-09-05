import { validateSplitAssignments } from './split-validator';

describe('validateSplitAssignments', () => {
  it('accepts valid split totals', () => {
    const result = validateSplitAssignments(
      [
        { lineItemId: 'a', jobId: 'job1', lineItemTotalCents: 3000 },
        { lineItemId: 'b', jobId: 'job2', lineItemTotalCents: 2000 },
      ],
      5000,
      0,
    );

    expect(result.totalsByJob).toEqual({ job1: 3000, job2: 2000 });
  });

  it('throws on duplicate line item assignments', () => {
    expect(() =>
      validateSplitAssignments(
        [
          { lineItemId: 'a', jobId: 'job1', lineItemTotalCents: 3000 },
          { lineItemId: 'a', jobId: 'job2', lineItemTotalCents: 2000 },
        ],
        5000,
        0,
      ),
    ).toThrow();
  });

  it('throws when totals do not match invariant', () => {
    expect(() =>
      validateSplitAssignments(
        [{ lineItemId: 'a', jobId: 'job1', lineItemTotalCents: 3000 }],
        5000,
        0,
      ),
    ).toThrow();
  });
});
