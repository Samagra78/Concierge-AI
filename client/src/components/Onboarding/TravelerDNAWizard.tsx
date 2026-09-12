/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ScreenView } from '../../types.ts';
import { TravelerDNA } from '../../types.ts';

interface TravelerDNAWizardProps {
  onComplete: (preferences: TravelerDNA) => Promise<void> | void;
  onNavigate: (screen: ScreenView) => void;
}

export const TravelerDNAWizard: React.FC<TravelerDNAWizardProps> = ({
  onComplete,
  onNavigate,
}) => {
  const [budgetStep, setBudgetStep] = useState(3);
  const [pacingStep, setPacingStep] = useState(2);
  const [walkKm, setWalkKm] = useState(10);
  const [wakeOption, setWakeOption] = useState<'early' | 'standard' | 'late' | 'night'>('standard');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const budgetLabels = [
    'Economy (Under ₹9,500)',
    'Comfort (₹9,500–₹19,000)',
    'Premium (₹19,000–₹47,500)',
    'Luxury (₹47,500+)',
  ];

  const pacingLabels = ['Rigid/Packed', 'Balanced', 'Spontaneous/Relaxed'];

  const wakeOptions = [
    {
      id: 'early' as const,
      label: 'Early Bird',
      time: 'Before 7AM',
      icon: 'wb_twilight',
    },
    {
      id: 'standard' as const,
      label: 'Standard',
      time: '7AM - 9AM',
      icon: 'light_mode',
    },
    {
      id: 'late' as const,
      label: 'Late Riser',
      time: '9AM - 11AM',
      icon: 'coffee',
    },
    {
      id: 'night' as const,
      label: 'Night Owl',
      time: 'After 11AM',
      icon: 'bedtime',
    },
  ];

  const handleContinue = async () => {
    setBusy(true); setError('');
    const budgetPerDay = [7500, 14250, 33250, 71250][budgetStep - 1];
    const earliestWakeTime = { early: 'Before 7AM', standard: '7AM - 9AM', late: '9AM - 11AM', night: 'After 11AM' }[wakeOption];
    try {
      await onComplete({ budgetPerDay, luxuryLevel: budgetStep, maxDailyWalkKm: walkKm, earliestWakeTime, crowdTolerance: (['High', 'Medium', 'Low'][pacingStep - 1]) as 'Low' | 'Medium' | 'High', interests: [], lifestyleRules: { vegetarianOnly: false, noEarlyFlights: false, mustHaveGym: false } });
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not save preferences. Please try again.'); }
    finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 w-full">
      <main className="w-full max-w-[640px] mx-auto">
        {/* Header / Progress Indicator */}
        <header className="text-center mb-8">
          <h1 className="font-serif text-3xl md:text-4xl font-semibold text-primary mb-4">
            Traveler DNA
          </h1>

          {/* 5-step Butter Gold Progress Indicator matching Figma */}
          <div aria-label="Progress" className="flex justify-center items-center space-x-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-border-subtle" />
            <div
              aria-current="step"
              className="w-6 h-2 rounded-full bg-secondary-fixed transition-all duration-300"
            />
            <div className="w-2 h-2 rounded-full bg-border-subtle" />
            <div className="w-2 h-2 rounded-full bg-border-subtle" />
            <div className="w-2 h-2 rounded-full bg-border-subtle" />
          </div>

          <p className="text-xs text-slate-grey uppercase tracking-widest font-semibold mt-3">
            Step 2 of 5: Logistics &amp; Pacing
          </p>
        </header>

        {/* Wizard Card */}
        <div className="bg-surface border border-border-subtle rounded-xl p-6 sm:p-8 whisper-shadow">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleContinue();
            }}
            className="space-y-8"
          >
            {/* Daily Budget Tier */}
            <div className="space-y-3">
              <div className="flex justify-between items-baseline">
                <label htmlFor="budget-slider" className="text-sm font-semibold text-primary">
                  Daily Budget Tier
                </label>
                <span className="text-xs text-slate-grey font-medium">
                  {budgetLabels[budgetStep - 1]}
                </span>
              </div>
              <input
                id="budget-slider"
                type="range"
                min="1"
                max="4"
                value={budgetStep}
                onChange={(e) => setBudgetStep(Number(e.target.value))}
                className="custom-range-slider"
              />
              <div className="flex justify-between text-xs text-slate-grey px-1">
                <span>₹</span><span>₹₹</span><span>₹₹₹</span><span>₹₹₹₹</span>
              </div>
            </div>

            {/* Pacing & Flexibility */}
            <div className="space-y-3">
              <div className="flex justify-between items-baseline">
                <label htmlFor="pacing-slider" className="text-sm font-semibold text-primary">
                  Pacing &amp; Flexibility
                </label>
                <span className="text-xs text-slate-grey font-medium">
                  {pacingLabels[pacingStep - 1]}
                </span>
              </div>
              <input
                id="pacing-slider"
                type="range"
                min="1"
                max="3"
                value={pacingStep}
                onChange={(e) => setPacingStep(Number(e.target.value))}
                className="custom-range-slider"
              />
              <div className="flex justify-between text-xs text-slate-grey px-1">
                <span>Packed</span>
                <span>Balanced</span>
                <span>Relaxed</span>
              </div>
            </div>

            {/* Max Daily Walking */}
            <div className="space-y-3">
              <div className="flex justify-between items-baseline">
                <label htmlFor="walk-slider" className="text-sm font-semibold text-primary">
                  Max Daily Walking
                </label>
                <span className="text-xs text-slate-grey font-medium">{walkKm} km</span>
              </div>
              <input
                id="walk-slider"
                type="range"
                min="2"
                max="25"
                value={walkKm}
                onChange={(e) => setWalkKm(Number(e.target.value))}
                className="custom-range-slider"
              />
              <div className="flex justify-between text-xs text-slate-grey px-1">
                <span>Light (2km)</span>
                <span>Explorer (25km+)</span>
              </div>
            </div>

            {/* Earliest Ideal Wake Time */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-primary block">
                Earliest Ideal Wake Time
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {wakeOptions.map((opt) => {
                  const isChecked = wakeOption === opt.id;
                  return (
                    <button
                      type="button"
                      key={opt.id}
                      onClick={() => setWakeOption(opt.id)}
                      className={`p-3.5 rounded-lg text-center transition-all cursor-pointer border ${
                        isChecked
                          ? 'bg-secondary-fixed border-secondary shadow-xs'
                          : 'border-border-subtle bg-surface hover:bg-surface-container-low'
                      }`}
                    >
                      <span className="material-symbols-outlined block text-primary mb-1.5 text-2xl">
                        {opt.icon}
                      </span>
                      <span className="text-xs font-semibold text-primary block">{opt.label}</span>
                      <span className="text-[11px] text-slate-grey mt-0.5 block">{opt.time}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-6 border-t border-border-subtle mt-8">
              <button
                type="button"
                onClick={() => onNavigate('dashboard')}
                className="px-6 py-2.5 border border-primary text-primary text-xs font-semibold rounded-lg hover:bg-surface-container-low transition-colors cursor-pointer"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={busy}
                className="px-7 py-2.5 bg-primary text-on-primary text-xs font-semibold rounded-lg hover:bg-neutral-800 transition-colors flex items-center gap-2 group cursor-pointer shadow-xs"
              >
                <span>{busy ? 'Saving…' : 'Continue'}</span>
                <span className="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </button>
            </div>
            {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          </form>
        </div>
      </main>
    </div>
  );
};
