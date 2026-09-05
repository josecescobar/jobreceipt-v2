import { Injectable } from '@nestjs/common';
import type { JobSuggestionReason, JobSuggestionScore, ReceiptOcrPayload } from '@jobreceipt/shared';
import { PrismaService } from '../prisma/prisma.service';

const WEIGHTS = {
  materialMatch: 30,
  recentActivity: 25,
  sameMerchant: 20,
  geographicProximity: 15,
  budgetRemaining: 10,
} as const;

@Injectable()
export class JobSuggestionService {
  constructor(private readonly prisma: PrismaService) {}

  private buildMaterialReason(jobName: string, categories: string[]): JobSuggestionReason {
    const normalized = jobName.toLowerCase();
    const hasMatch = categories.some((category) => normalized.includes(category));

    return {
      key: 'material_match',
      score: hasMatch ? WEIGHTS.materialMatch : 0,
      detail: hasMatch
        ? `Job name appears to match extracted material categories (${categories.join(', ')})`
        : 'No direct match between job name and receipt material categories',
    };
  }

  private buildRecentReason(expenseCount: number): JobSuggestionReason {
    const score = expenseCount > 0 ? WEIGHTS.recentActivity : 0;
    return {
      key: 'recent_activity',
      score,
      detail: expenseCount > 0 ? `Job has ${expenseCount} recent expenses in last 7 days` : 'No recent activity for this job',
    };
  }

  private buildMerchantReason(historyCount: number): JobSuggestionReason {
    const score = historyCount > 0 ? WEIGHTS.sameMerchant : 0;
    return {
      key: 'same_merchant',
      score,
      detail: historyCount > 0 ? `${historyCount} prior receipts from same merchant` : 'No same-merchant history found',
    };
  }

  private buildGeoReason(jobAddress: string | null, merchantAddress: string | null): JobSuggestionReason {
    if (!jobAddress || !merchantAddress) {
      return {
        key: 'geographic_proximity',
        score: 0,
        detail: 'Insufficient address data for proximity scoring',
      };
    }

    const score = merchantAddress.toLowerCase().includes(jobAddress.toLowerCase().slice(0, 5))
      ? WEIGHTS.geographicProximity
      : Math.round(WEIGHTS.geographicProximity * 0.3);

    return {
      key: 'geographic_proximity',
      score,
      detail: score === WEIGHTS.geographicProximity ? 'Merchant appears near job address' : 'Low-confidence geo proximity',
    };
  }

  private buildBudgetReason(totalBudgetCents: number, totalSpentCents: number): JobSuggestionReason {
    if (!totalBudgetCents) {
      return {
        key: 'budget_remaining',
        score: 0,
        detail: 'Job budget not set',
      };
    }

    const remaining = totalBudgetCents - totalSpentCents;
    const score = remaining > 0 ? WEIGHTS.budgetRemaining : 0;

    return {
      key: 'budget_remaining',
      score,
      detail: remaining > 0 ? `Budget remaining: ${remaining} cents` : 'No remaining budget',
    };
  }

  async suggest(organizationId: string, payload: ReceiptOcrPayload): Promise<JobSuggestionScore[]> {
    const jobs = await this.prisma.job.findMany({
      where: {
        status: 'ACTIVE',
      },
    });

    const categories = Array.from(new Set(payload.line_items.map((item) => item.material_category)));

    const suggestions = await Promise.all(
      jobs.map(async (job) => {
        const [recentExpenseCount, sameMerchantCount, spentAggregate] = await Promise.all([
          this.prisma.expense.count({
            where: {
              jobId: job.id,
              date: {
                gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
              },
            },
          }),
          this.prisma.receipt.count({
            where: {
              suggestedJobId: job.id,
              merchantName: payload.merchant.name,
            },
          }),
          this.prisma.expense.aggregate({
            _sum: { amountCents: true },
            where: { jobId: job.id },
          }),
        ]);

        const reasons: JobSuggestionReason[] = [
          this.buildMaterialReason(job.name, categories),
          this.buildRecentReason(recentExpenseCount),
          this.buildMerchantReason(sameMerchantCount),
          this.buildGeoReason(job.customerAddress ?? null, payload.merchant.address),
          this.buildBudgetReason(job.budgetTotalCents, spentAggregate._sum.amountCents ?? 0),
        ];

        const score = reasons.reduce((sum, reason) => sum + reason.score, 0);

        return {
          jobId: job.id,
          score,
          reasons,
          autoAssigned: score > 90,
          needsManualReview: score < 60,
        } satisfies JobSuggestionScore;
      }),
    );

    return suggestions.sort((a, b) => b.score - a.score);
  }
}
