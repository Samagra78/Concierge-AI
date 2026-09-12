/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TravelerDNA, VendorQuote } from '../types.ts';

export interface BudgetMetrics {
  totalBudget: number;
  allocatedBudget: number;
  remainingBudget: number;
  percentAllocated: number;
  isOverBudget: boolean;
}

export function calculateBudgetMetrics(totalBudget: number, allocatedBudget: number): BudgetMetrics {
  const safeTotal = Math.max(0, totalBudget);
  const safeAllocated = Math.max(0, allocatedBudget);
  const remainingBudget = safeTotal - safeAllocated;
  const percentAllocated = safeTotal > 0 
    ? Math.min(100, Math.round((safeAllocated / safeTotal) * 100)) 
    : 0;
  
  return {
    totalBudget: safeTotal,
    allocatedBudget: safeAllocated,
    remainingBudget,
    percentAllocated,
    isOverBudget: safeAllocated > safeTotal,
  };
}

export function calculateWalkingCategory(km: number): 'Light' | 'Active' | 'Hiker' | 'Explorer' {
  if (km <= 3) return 'Light';
  if (km <= 10) return 'Active';
  if (km <= 20) return 'Hiker';
  return 'Explorer';
}

export function scoreActivityFit(activityCategory: string, userInterests: string[]): number {
  if (!userInterests || userInterests.length === 0) return 70;
  
  const normalizedCategory = activityCategory.toLowerCase();
  const matched = userInterests.some(interest => {
    const ni = interest.toLowerCase();
    return normalizedCategory.includes(ni) || ni.includes(normalizedCategory);
  });

  return matched ? 95 : 65;
}

export function validateLifestyleRules(
  activity: { isEarlyMorning?: boolean; isFood?: boolean; isVegetarian?: boolean },
  rules: TravelerDNA['lifestyleRules']
): { isValid: boolean; warning?: string } {
  if (rules.vegetarianOnly && activity.isFood && activity.isVegetarian === false) {
    return {
      isValid: false,
      warning: 'Contains meat or fish (conflicts with Vegetarian Only rule)',
    };
  }

  if (rules.noEarlyFlights && activity.isEarlyMorning) {
    return {
      isValid: false,
      warning: 'Scheduled before 8:00 AM (conflicts with No Early Flights rule)',
    };
  }

  return { isValid: true };
}

export function rankQuotes(quotes: VendorQuote[]): VendorQuote[] {
  return [...quotes].sort((a, b) => {
    // Primary sort: Lowest total price
    if (a.total !== b.total) {
      return a.total - b.total;
    }
    // Secondary sort: Highest rating
    return b.rating - a.rating;
  });
}
