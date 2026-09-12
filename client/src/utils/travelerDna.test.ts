/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateBudgetMetrics,
  calculateWalkingCategory,
  scoreActivityFit,
  validateLifestyleRules,
  rankQuotes
} from './travelerDna.ts';

test('calculateBudgetMetrics computes exact remaining and percentages', () => {
  const metrics = calculateBudgetMetrics(2500, 2320);
  assert.equal(metrics.totalBudget, 2500);
  assert.equal(metrics.allocatedBudget, 2320);
  assert.equal(metrics.remainingBudget, 180);
  assert.equal(metrics.percentAllocated, 93);
  assert.equal(metrics.isOverBudget, false);
});

test('calculateWalkingCategory maps kilometers to appropriate label', () => {
  assert.equal(calculateWalkingCategory(2), 'Light');
  assert.equal(calculateWalkingCategory(8), 'Active');
  assert.equal(calculateWalkingCategory(15), 'Hiker');
  assert.equal(calculateWalkingCategory(25), 'Explorer');
});

test('scoreActivityFit scores matches higher when category matches interest', () => {
  const highFit = scoreActivityFit('Foodie', ['Photography', 'Foodie', 'Fine Dining']);
  const standardFit = scoreActivityFit('Nightlife', ['Photography', 'Foodie']);
  assert.equal(highFit, 95);
  assert.equal(standardFit, 65);
});

test('validateLifestyleRules detects dietary and early hour conflicts', () => {
  const rules = {
    vegetarianOnly: true,
    noEarlyFlights: true,
    mustHaveGym: true,
  };

  const meatConflict = validateLifestyleRules({ isFood: true, isVegetarian: false }, rules);
  assert.equal(meatConflict.isValid, false);
  assert.match(meatConflict.warning || '', /Vegetarian Only/);

  const okVeg = validateLifestyleRules({ isFood: true, isVegetarian: true }, rules);
  assert.equal(okVeg.isValid, true);

  const earlyFlight = validateLifestyleRules({ isEarlyMorning: true }, rules);
  assert.equal(earlyFlight.isValid, false);
});

test('rankQuotes orders by price ascending then rating descending', () => {
  const sampleQuotes = [
    {
      id: '1',
      vendorName: 'Vendor A',
      channel: 'telegram' as const,
      service: 'Wash & Fold',
      lineItems: [],
      pickupFee: 50,
      dropFee: 50,
      total: 350,
      currency: 'INR',
      turnaroundHours: 24,
      rating: 4.8,
      distanceKm: 1.2,
      pickupSlot: 'Today 2:00 PM',
      status: 'proposed' as const,
    },
    {
      id: '2',
      vendorName: 'Vendor B',
      channel: 'whatsapp' as const,
      service: 'Wash & Fold',
      lineItems: [],
      pickupFee: 0,
      dropFee: 0,
      total: 280,
      currency: 'INR',
      turnaroundHours: 18,
      rating: 4.9,
      distanceKm: 0.8,
      pickupSlot: 'Today 3:30 PM',
      status: 'proposed' as const,
    },
  ];

  const ranked = rankQuotes(sampleQuotes);
  assert.equal(ranked[0].vendorName, 'Vendor B');
  assert.equal(ranked[0].total, 280);
});
