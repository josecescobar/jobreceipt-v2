import { JobSuggestionService } from './job-suggestion.service';

describe('JobSuggestionService', () => {
  it('scores and ranks jobs using configured weights', async () => {
    const prisma = {
      job: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'job_roof',
            name: 'smith roofing replacement',
            customerAddress: '100 Main St',
            budgetTotalCents: 100000,
          },
          {
            id: 'job_deck',
            name: 'deck remodel',
            customerAddress: '500 Oak Ave',
            budgetTotalCents: 100000,
          },
        ]),
      },
      expense: {
        count: jest.fn().mockResolvedValue(2),
        aggregate: jest.fn().mockResolvedValue({ _sum: { amountCents: 20000 } }),
      },
      receipt: {
        count: jest.fn().mockResolvedValue(1),
      },
    };

    const service = new JobSuggestionService(prisma as never);

    const results = await service.suggest('org_1', {
      merchant: {
        name: 'Home Depot',
        address: '100 Main St',
        phone: null,
        store_number: null,
      },
      transaction: {
        date: '2026-02-14',
        time: null,
        receipt_number: null,
        payment_method: 'credit',
        card_last_four: null,
      },
      line_items: [
        {
          description: 'Shingles',
          sku: null,
          quantity: 1,
          unit_price: 99,
          total_price: 99,
          is_construction_material: true,
          material_category: 'roofing',
        },
      ],
      totals: {
        subtotal: 99,
        tax_amount: 6,
        tax_rate_percent: null,
        discount_amount: null,
        total_amount: 105,
      },
      confidence: {
        overall: 'high',
        notes: '',
      },
    });

    expect(results.length).toBe(2);
    expect(results[0].score).toBeGreaterThanOrEqual(results[1].score);
  });
});
