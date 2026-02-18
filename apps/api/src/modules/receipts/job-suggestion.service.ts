import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

interface JobScore {
  jobId: string;
  jobName: string;
  score: number;
  breakdown: {
    materialMatch: number;
    recentActivity: number;
    sameMerchant: number;
    geographic: number;
    budgetRemaining: number;
  };
}

interface SuggestionResult {
  jobId: string;
  score: number;
  autoAssigned: boolean;
  suggestedCategory: string | null;
}

// Scoring weights (total = 100)
const WEIGHTS = {
  MATERIAL_MATCH: 30,
  RECENT_ACTIVITY: 25,
  SAME_MERCHANT: 20,
  GEOGRAPHIC: 15,
  BUDGET_REMAINING: 10,
};

// Material category keywords that map to job types
const MATERIAL_JOB_KEYWORDS: Record<string, string[]> = {
  LUMBER: ['framing', 'deck', 'remodel', 'addition', 'carpentry', 'framing'],
  ELECTRICAL: ['electrical', 'wiring', 'panel', 'service upgrade', 'lighting'],
  PLUMBING: ['plumbing', 'bathroom', 'kitchen', 'pipe', 'water heater'],
  ROOFING: ['roof', 'roofing', 'shingle', 'gutter'],
  HARDWARE: [], // Generic, matches any job
  PAINT: ['paint', 'interior', 'exterior', 'remodel'],
  FASTENERS: [], // Generic
  CONCRETE: ['foundation', 'slab', 'patio', 'driveway', 'concrete'],
  INSULATION: ['insulation', 'weatherization', 'attic', 'energy'],
  DRYWALL: ['drywall', 'remodel', 'addition', 'interior', 'finish'],
  FLOORING: ['floor', 'flooring', 'tile', 'hardwood', 'carpet', 'remodel'],
  TOOLS: [], // Generic
  SAFETY: [], // Generic
  OTHER: [],
};

@Injectable()
export class JobSuggestionService {
  private readonly logger = new Logger(JobSuggestionService.name);

  constructor(private prisma: PrismaService) {}

  async suggestJob(
    orgId: string,
    receiptId: string,
    ocrResult: any,
  ): Promise<SuggestionResult | null> {
    // Get active jobs for this org
    const activeJobs = await this.prisma.job.findMany({
      where: { organizationId: orgId, status: 'ACTIVE' },
      include: {
        expenses: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { receipt: { select: { merchantName: true } } },
        },
      },
    });

    if (activeJobs.length === 0) return null;

    // Get material categories from line items
    const materialCategories = (ocrResult.line_items || [])
      .filter((item: any) => item.is_construction_material)
      .map((item: any) => item.material_category?.toUpperCase())
      .filter(Boolean);

    const merchantName = ocrResult.merchant?.name || '';
    const merchantAddress = ocrResult.merchant?.address || '';

    // Score each job
    const scores: JobScore[] = [];

    for (const job of activeJobs) {
      const materialMatch = this.scoreMaterialMatch(materialCategories, job);
      const recentActivity = this.scoreRecentActivity(job.expenses);
      const sameMerchant = this.scoreSameMerchant(merchantName, job.expenses);
      const geographic = this.scoreGeographic(merchantAddress, job);
      const budgetRemaining = this.scoreBudgetRemaining(materialCategories, job);

      const totalScore =
        materialMatch + recentActivity + sameMerchant + geographic + budgetRemaining;

      scores.push({
        jobId: job.id,
        jobName: job.name,
        score: totalScore,
        breakdown: { materialMatch, recentActivity, sameMerchant, geographic, budgetRemaining },
      });
    }

    // Sort by score descending
    scores.sort((a, b) => b.score - a.score);

    // Always suggest category from merchant history (even if no good job match)
    const suggestedCategory = await this.suggestCategory(orgId, merchantName);

    if (scores.length === 0 || scores[0].score < 10) {
      // No good job match, but may still have a category suggestion
      if (suggestedCategory) {
        return {
          jobId: '',
          score: 0,
          autoAssigned: false,
          suggestedCategory,
        };
      }
      return null;
    }

    const topScore = scores[0];
    this.logger.log(
      `Job suggestion for receipt ${receiptId}: ${topScore.jobName} (score: ${topScore.score})`,
    );

    return {
      jobId: topScore.jobId,
      score: topScore.score,
      autoAssigned: topScore.score > 90,
      suggestedCategory,
    };
  }

  async suggestCategory(
    orgId: string,
    merchantName: string,
  ): Promise<string | null> {
    if (!merchantName) return null;

    const normalizedMerchant = merchantName.toLowerCase().trim();

    // Find expenses linked to receipts from the same merchant
    const expenses = await this.prisma.expense.findMany({
      where: {
        organizationId: orgId,
        category: { not: null },
        receipt: {
          merchantName: { not: null },
        },
      },
      select: {
        category: true,
        receipt: { select: { merchantName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Filter to same merchant and count categories
    const categoryCounts: Record<string, number> = {};
    for (const exp of expenses) {
      if (exp.receipt?.merchantName?.toLowerCase().trim() === normalizedMerchant && exp.category) {
        categoryCounts[exp.category] = (categoryCounts[exp.category] || 0) + 1;
      }
    }

    const entries = Object.entries(categoryCounts);
    if (entries.length === 0) return null;

    // Return the most common category
    entries.sort((a, b) => b[1] - a[1]);
    this.logger.log(
      `Category suggestion for "${merchantName}": ${entries[0][0]} (${entries[0][1]} occurrences)`,
    );
    return entries[0][0];
  }

  private scoreMaterialMatch(materialCategories: string[], job: any): number {
    if (materialCategories.length === 0) return 0;

    const jobText = `${job.name} ${job.notes || ''} ${job.customerName || ''}`.toLowerCase();
    let matchCount = 0;

    for (const category of materialCategories) {
      const keywords = MATERIAL_JOB_KEYWORDS[category] || [];
      if (keywords.length === 0) continue; // Generic materials don't contribute

      for (const keyword of keywords) {
        if (jobText.includes(keyword)) {
          matchCount++;
          break; // One match per category is enough
        }
      }
    }

    if (materialCategories.length === 0) return 0;
    const matchRatio = matchCount / materialCategories.length;
    return Math.round(matchRatio * WEIGHTS.MATERIAL_MATCH);
  }

  private scoreRecentActivity(expenses: any[]): number {
    if (expenses.length === 0) return 0;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentExpenses = expenses.filter(
      (e) => new Date(e.createdAt) >= sevenDaysAgo,
    );

    if (recentExpenses.length === 0) return 0;

    // More recent expenses = higher score, up to max weight
    const recency = Math.min(recentExpenses.length / 5, 1); // Cap at 5 recent expenses
    return Math.round(recency * WEIGHTS.RECENT_ACTIVITY);
  }

  private scoreSameMerchant(merchantName: string, expenses: any[]): number {
    if (!merchantName) return 0;

    const normalizedMerchant = merchantName.toLowerCase().trim();
    const matchingExpenses = expenses.filter(
      (e) => e.receipt?.merchantName?.toLowerCase().trim() === normalizedMerchant,
    );

    if (matchingExpenses.length === 0) return 0;

    // More matches = higher score
    const matchRatio = Math.min(matchingExpenses.length / 3, 1); // Cap at 3 matches
    return Math.round(matchRatio * WEIGHTS.SAME_MERCHANT);
  }

  private scoreGeographic(merchantAddress: string, job: any): number {
    if (!merchantAddress || !job.customerLat || !job.customerLng) return 0;

    // Simple heuristic: check if merchant address contains the same city/state as job
    // Full geocoding would require an external API — this is a first approximation
    const jobAddress = (job.customerAddress || '').toLowerCase();
    const merchant = merchantAddress.toLowerCase();

    // Extract city name (rough heuristic)
    const jobCity = this.extractCity(jobAddress);
    const merchantCity = this.extractCity(merchant);

    if (jobCity && merchantCity && jobCity === merchantCity) {
      return WEIGHTS.GEOGRAPHIC; // Full score for same city
    }

    // Partial score for same state
    const jobState = this.extractState(jobAddress);
    const merchantState = this.extractState(merchant);
    if (jobState && merchantState && jobState === merchantState) {
      return Math.round(WEIGHTS.GEOGRAPHIC * 0.5);
    }

    return 0;
  }

  private scoreBudgetRemaining(materialCategories: string[], job: any): number {
    if (!job.budgetTotal || job.budgetTotal <= 0) return 0;

    // Check if the job has budget remaining
    // This is a simplified check — full implementation would aggregate expenses
    const hasMaterialsBudget = materialCategories.length > 0 && (job.budgetMaterials || 0) > 0;
    if (hasMaterialsBudget) {
      return WEIGHTS.BUDGET_REMAINING;
    }

    return Math.round(WEIGHTS.BUDGET_REMAINING * 0.5);
  }

  private extractCity(address: string): string | null {
    // Simple extraction: look for "City, ST" pattern
    const parts = address.split(',').map((p) => p.trim());
    if (parts.length >= 2) {
      return parts[parts.length - 2]?.toLowerCase() || null;
    }
    return null;
  }

  private extractState(address: string): string | null {
    const stateMatch = address.match(/\b([A-Z]{2})\b/i);
    return stateMatch ? stateMatch[1].toLowerCase() : null;
  }
}

/**
 * Haversine distance between two coordinates in miles.
 * Used for geographic scoring when lat/lng are available.
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
