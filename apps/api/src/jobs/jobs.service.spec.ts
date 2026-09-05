import { JobsService } from './jobs.service';

describe('JobsService budget calculations', () => {
  it('returns correct totals and health status', async () => {
    const service = new JobsService(
      {
        job: {
          findFirst: jest.fn().mockResolvedValue({
            id: 'job_1',
            budgetTotalCents: 100000,
            budgetMaterialsCents: 50000,
            budgetLaborCents: 30000,
          }),
        },
        expense: {
          aggregate: jest.fn().mockResolvedValue({ _sum: { amountCents: 85000 } }),
          groupBy: jest.fn().mockResolvedValue([
            { category: 'MATERIALS', _sum: { amountCents: 60000 } },
            { category: 'LABOR', _sum: { amountCents: 25000 } },
          ]),
        },
        budgetSnapshot: {
          create: jest.fn().mockResolvedValue({ id: 'snap_1' }),
        },
      } as never,
      {
        getOrganizationId: jest.fn().mockReturnValue('org_1'),
      } as never,
    );

    const result = await service.getBudget('job_1');

    expect(result.totalSpentCents).toBe(85000);
    expect(result.totalRemainingCents).toBe(15000);
    expect(result.health).toBe('YELLOW');
  });
});
