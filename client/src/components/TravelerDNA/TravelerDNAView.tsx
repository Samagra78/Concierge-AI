/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { TravelerDNA } from '../../types.ts';
import { allInterestsList } from '../../data/mockData.ts';
import { formatInr } from '../../utils/currency.ts';

interface TravelerDNAViewProps {
  dna: TravelerDNA;
  onSaveDNA: (updatedDNA: TravelerDNA) => Promise<void> | void;
}

export const TravelerDNAView: React.FC<TravelerDNAViewProps> = ({ dna, onSaveDNA }) => {
  const [budget, setBudget] = useState(dna.budgetPerDay);
  const [luxuryLevel, setLuxuryLevel] = useState(dna.luxuryLevel);
  const [walkKm, setWalkKm] = useState(dna.maxDailyWalkKm);
  const [wakeTime, setWakeTime] = useState(dna.earliestWakeTime);
  const [crowdTolerance, setCrowdTolerance] = useState(dna.crowdTolerance);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(dna.interests);
  const [lifestyle, setLifestyle] = useState(dna.lifestyleRules);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const luxuryLabels = ['Basic', 'Standard', 'Comfort', 'Premium', 'Ultra-Luxe'];

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  const handleSave = async () => {
    const updated: TravelerDNA = {
      budgetPerDay: budget,
      luxuryLevel,
      maxDailyWalkKm: walkKm,
      earliestWakeTime: wakeTime,
      crowdTolerance,
      interests: selectedInterests,
      lifestyleRules: lifestyle,
    };
    setIsSaving(true);
    setSaveError('');
    try {
      await onSaveDNA(updated);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Could not save your preferences.');
    } finally { setIsSaving(false); }
  };

  return (
    <div className="flex-1 min-h-screen bg-background p-6 md:p-10 max-w-6xl mx-auto w-full pb-24 md:pb-12">
      {/* Header */}
      <header className="mb-10">
        <h2 className="font-serif text-3xl md:text-4xl font-semibold text-primary mb-2">
          Traveler DNA
        </h2>
        <p className="text-slate-grey text-base md:text-lg">
          Define your unique travel fingerprint to unlock personalized itineraries.
        </p>
      </header>

      {/* Save Toast Notification */}
      {isSaved && (
        <div className="fixed top-8 right-8 z-50 bg-primary text-on-primary px-5 py-3.5 rounded-lg shadow-xl text-sm font-medium flex items-center gap-2.5 animate-in fade-in slide-in-from-top-4 duration-300">
          <span className="material-symbols-outlined text-emerald-muted">check_circle</span>
          <span>Preferences saved successfully! Future itineraries will adjust.</span>
        </div>
      )}
      {saveError && <p role="alert" className="fixed right-8 top-24 z-50 rounded-lg border border-red-200 bg-white p-4 text-sm text-red-700 shadow-xl">{saveError}</p>}

      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left Column (7 cols): Sliders & Core Preferences */}
        <div className="lg:col-span-7 space-y-8">
          {/* Card: Logistics & Comfort */}
          <section className="bg-surface border border-border-subtle rounded-xl p-6 md:p-8 whisper-card-shadow">
            <h3 className="font-serif text-xl font-medium text-primary mb-6">
              Logistics &amp; Comfort
            </h3>

            {/* Budget Tier Slider */}
            <div className="mb-8">
              <div className="flex justify-between items-end mb-3">
                <div>
                  <label className="block text-sm font-semibold text-primary mb-1">
                    Budget Tier
                  </label>
                  <span className="text-xs text-slate-grey">
                    Daily spend per person (excl. flights)
                  </span>
                </div>
                <span className="text-sm font-bold text-primary">{formatInr(budget)}/day</span>
              </div>
              <input
                type="range"
                min="100"
                max="1000"
                step="25"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="custom-range-slider"
                aria-label="Daily budget tier slider"
              />
              <div className="flex justify-between mt-2 text-xs text-slate-grey">
                <span>Frugal ({formatInr(9500)})</span>
                <span>Moderate ({formatInr(33250)})</span>
                <span>Luxury ({formatInr(95000)}+)</span>
              </div>
            </div>

            {/* Luxury Level Slider */}
            <div className="mb-8">
              <div className="flex justify-between items-end mb-3">
                <div>
                  <label className="block text-sm font-semibold text-primary mb-1">
                    Luxury Level
                  </label>
                  <span className="text-xs text-slate-grey">Accommodation &amp; Dining focus</span>
                </div>
                <span className="text-sm font-bold text-primary">
                  {luxuryLabels[luxuryLevel - 1] || 'Premium'}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={luxuryLevel}
                onChange={(e) => setLuxuryLevel(Number(e.target.value))}
                className="custom-range-slider"
                aria-label="Luxury level slider"
              />
              <div className="flex justify-between mt-2 text-xs text-slate-grey">
                <span>Standard</span>
                <span>Boutique</span>
                <span>Ultra-Luxe</span>
              </div>
            </div>

            {/* Max Daily Walk Slider */}
            <div>
              <div className="flex justify-between items-end mb-3">
                <div>
                  <label className="block text-sm font-semibold text-primary mb-1">
                    Max Daily Walk
                  </label>
                  <span className="text-xs text-slate-grey">Comfortable walking distance per day</span>
                </div>
                <span className="text-sm font-bold text-primary">{walkKm} km</span>
              </div>
              <input
                type="range"
                min="1"
                max="25"
                value={walkKm}
                onChange={(e) => setWalkKm(Number(e.target.value))}
                className="custom-range-slider"
                aria-label="Maximum daily walking distance slider"
              />
              <div className="flex justify-between mt-2 text-xs text-slate-grey">
                <span>Light (1km)</span>
                <span>Active (10km)</span>
                <span>Hiker (20km+)</span>
              </div>
            </div>
          </section>

          {/* Card: Pacing & Environment */}
          <section className="bg-surface border border-border-subtle rounded-xl p-6 md:p-8 whisper-card-shadow">
            <h3 className="font-serif text-xl font-medium text-primary mb-6">
              Pacing &amp; Environment
            </h3>

            {/* Wake Time Selector */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-primary mb-1">
                Earliest Wake Time
              </label>
              <p className="text-xs text-slate-grey mb-3">When are you ready to start exploring?</p>
              <div className="relative">
                <select
                  value={wakeTime}
                  onChange={(e) => setWakeTime(e.target.value)}
                  className="w-full bg-surface-bright border-b-2 border-primary border-t-0 border-x-0 rounded-none py-3 px-1 text-sm text-primary focus:ring-0 focus:border-black appearance-none cursor-pointer"
                >
                  <option value="6:00 AM - Sunrise Seeker">6:00 AM - Sunrise Seeker</option>
                  <option value="7:30 AM - Early Bird">7:30 AM - Early Bird</option>
                  <option value="9:00 AM - Standard Start">9:00 AM - Standard Start</option>
                  <option value="10:30 AM - Leisurely Morning">10:30 AM - Leisurely Morning</option>
                  <option value="12:00 PM - Night Owl">12:00 PM - Night Owl</option>
                </select>
                <span className="material-symbols-outlined absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none text-slate-grey">
                  expand_more
                </span>
              </div>
            </div>

            {/* Crowd Tolerance Segments */}
            <div>
              <label className="block text-sm font-semibold text-primary mb-1">
                Crowd Tolerance
              </label>
              <p className="text-xs text-slate-grey mb-3">
                How do you feel about popular, busy tourist spots?
              </p>
              <div className="flex bg-surface-container-high rounded-lg p-1">
                {(['Low', 'Medium', 'High'] as const).map((level) => {
                  const isSelected = crowdTolerance === level;
                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setCrowdTolerance(level)}
                      className={`flex-1 py-2 px-4 rounded-md text-xs md:text-sm font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-surface text-primary shadow-xs border border-border-subtle'
                          : 'text-slate-grey hover:bg-surface-variant'
                      }`}
                    >
                      {level}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        </div>

        {/* Right Column (5 cols): Tags & Lifestyle Rules */}
        <div className="lg:col-span-5 space-y-8">
          {/* Card: Interests & Tags */}
          <section className="bg-surface border border-border-subtle rounded-xl p-6 md:p-8 whisper-card-shadow">
            <h3 className="font-serif text-xl font-medium text-primary mb-1">
              Interests &amp; Vibes
            </h3>
            <p className="text-xs text-slate-grey mb-6">Select the tags that define your perfect trip.</p>
            <div className="flex flex-wrap gap-2">
              {allInterestsList.map((interest) => {
                const isActive = selectedInterests.includes(interest);
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-champagne text-primary border border-champagne hover:brightness-95'
                        : 'bg-transparent text-slate-grey border border-border-subtle hover:border-slate-grey'
                    }`}
                  >
                    {interest}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Card: Lifestyle Rules */}
          <section className="bg-surface border border-border-subtle rounded-xl p-6 md:p-8 whisper-card-shadow">
            <h3 className="font-serif text-xl font-medium text-primary mb-1">
              Lifestyle Rules
            </h3>
            <p className="text-xs text-slate-grey mb-6">Hard requirements for your itinerary.</p>
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={lifestyle.vegetarianOnly}
                  onChange={(e) =>
                    setLifestyle({ ...lifestyle, vegetarianOnly: e.target.checked })
                  }
                  className="h-5 w-5 rounded border-border-subtle text-primary focus:ring-primary cursor-pointer accent-black"
                />
                <span className="text-sm font-medium text-primary group-hover:text-slate-grey transition-colors">
                  Vegetarian Only
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={lifestyle.noEarlyFlights}
                  onChange={(e) =>
                    setLifestyle({ ...lifestyle, noEarlyFlights: e.target.checked })
                  }
                  className="h-5 w-5 rounded border-border-subtle text-primary focus:ring-primary cursor-pointer accent-black"
                />
                <span className="text-sm font-medium text-primary group-hover:text-slate-grey transition-colors">
                  No Early Flights (Before 8AM)
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={lifestyle.mustHaveGym}
                  onChange={(e) =>
                    setLifestyle({ ...lifestyle, mustHaveGym: e.target.checked })
                  }
                  className="h-5 w-5 rounded border-border-subtle text-primary focus:ring-primary cursor-pointer accent-black"
                />
                <span className="text-sm font-medium text-primary group-hover:text-slate-grey transition-colors">
                  Must have Gym/Fitness Center
                </span>
              </label>
            </div>
          </section>

          {/* Save Action Button */}
          <div className="pt-2 sticky bottom-6 z-20">
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={isSaving}
              className="w-full bg-primary text-on-primary py-4 px-6 rounded-lg text-sm font-semibold tracking-wider uppercase hover:bg-neutral-800 transition-colors shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <span>{isSaving ? 'Saving…' : 'Save Preferences'}</span>
              <span className="material-symbols-outlined text-lg">save</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
