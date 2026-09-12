/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ItineraryDay, ActivitySlot, ScreenView, TripPage } from '../../types.ts';

interface TimelineViewProps {
  days: ItineraryDay[];
  trips: TripPage[];
  activeTripId: string | null;
  onSelectTrip: (tripId: string) => void;
  onCompleteTrip: () => Promise<void> | void;
  onAddDay: () => Promise<void> | void;
  currentDayNumber: number;
  onSelectDay: (day: number) => void;
  onToggleLock: (dayNumber: number, activityId: string) => void;
  onRemoveSlot: (dayNumber: number, activityId: string) => Promise<void> | void;
  onReplanSlot: (dayNumber: number, activityId: string, request?: string) => Promise<void> | void;
  onNavigate: (screen: ScreenView) => void;
  destination?: string;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  days,
  trips,
  activeTripId,
  onSelectTrip,
  onCompleteTrip,
  onAddDay,
  currentDayNumber,
  onSelectDay,
  onToggleLock,
  onRemoveSlot,
  onReplanSlot,
  onNavigate,
  destination = '',
}) => {
  const [shareToast, setShareToast] = useState(false);
  const [replanTarget, setReplanTarget] = useState<{ dayNumber: number; activity: ActivitySlot } | null>(null);
  const [replanRequest, setReplanRequest] = useState('');
  const [replanError, setReplanError] = useState('');
  const [isReplanning, setIsReplanning] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<{ dayNumber: number; activity: ActivitySlot } | null>(null);
  const [removeError, setRemoveError] = useState('');
  const [isRemoving, setIsRemoving] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [completeError, setCompleteError] = useState('');
  const [isCompleting, setIsCompleting] = useState(false);
  const activeDay = days.find((d) => d.dayNumber === currentDayNumber) || days[0];

  if (!activeDay) {
    return <main className="flex-1 min-h-screen bg-background p-6 md:p-10"><div className="mx-auto max-w-4xl">
      {trips.length > 1 && <div className="mb-8 flex gap-2 overflow-x-auto pb-2">{trips.map((trip) => <button key={trip.id} type="button" onClick={() => onSelectTrip(trip.id)} className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold ${trip.id === activeTripId ? 'bg-primary text-on-primary' : 'border border-border-subtle bg-surface text-slate-grey'}`}>{trip.tripOverview.destination || trip.tripOverview.title}</button>)}</div>}
      <div className="rounded-2xl border border-border-subtle bg-surface p-8 text-center"><span className="material-symbols-outlined text-4xl text-secondary">map</span><h2 className="mt-3 font-serif text-2xl font-semibold text-primary">No itinerary yet</h2><p className="mt-2 text-sm text-slate-grey">Plan a trip with Concierge or add a flexible day to start building your timeline.</p><div className="mt-5 flex justify-center gap-2"><button onClick={() => void onAddDay()} className="rounded-lg border border-border-subtle px-5 py-2.5 text-xs font-semibold text-primary">Add a day</button><button onClick={() => onNavigate('dashboard')} className="rounded-lg bg-primary px-5 py-2.5 text-xs font-semibold text-on-primary">Go to dashboard</button></div></div>
    </div></main>;
  }

  const handleShareDay = () => {
    setShareToast(true);
    setTimeout(() => setShareToast(false), 3000);
  };

  const submitReplan = async (request: string) => {
    if (!replanTarget || isReplanning) return;
    setIsReplanning(true);
    setReplanError('');
    try {
      await onReplanSlot(replanTarget.dayNumber, replanTarget.activity.id, request.trim());
      setReplanTarget(null);
      setReplanRequest('');
    } catch (error) {
      setReplanError(error instanceof Error ? error.message : 'Could not generate a replacement. Please try again.');
    } finally {
      setIsReplanning(false);
    }
  };

  return (
    <div className="flex-1 min-h-screen bg-background flex flex-col pb-24 md:pb-12">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-border-subtle px-6 md:px-10 py-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-slate-grey mb-1.5">
              <span className="text-xs uppercase tracking-wider font-semibold">
                Day {activeDay.dayNumber}
              </span>
              <span className="w-1 h-1 rounded-full bg-slate-grey" />
              <span className="text-xs font-medium">{activeDay.date}</span>
            </div>
            <h2 className="font-serif text-2xl md:text-3xl font-semibold text-primary">
              {activeDay.title}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('traveler-dna')}
              className="px-4 py-2 rounded-lg border border-border-subtle text-primary text-xs font-semibold hover:bg-surface-container-low transition-colors bg-surface flex items-center gap-2 cursor-pointer shadow-2xs"
            >
              <span className="material-symbols-outlined text-base">tune</span>
              <span>Preferences</span>
            </button>
            <button
              onClick={handleShareDay}
              className="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-neutral-800 transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <span className="material-symbols-outlined text-base">share</span>
              <span>Share Day</span>
            </button>
          </div>
        </div>

        {trips.length > 0 && <div className="max-w-4xl mx-auto mt-6 flex items-center gap-3">
          <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto pb-1 scrollbar-none" aria-label="Trip pages">
            {trips.map((trip) => <button key={trip.id} type="button" onClick={() => onSelectTrip(trip.id)} aria-current={trip.id === activeTripId ? 'page' : undefined} className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-colors ${trip.id === activeTripId ? 'bg-primary text-on-primary' : 'border border-border-subtle bg-surface text-slate-grey hover:text-primary'}`}>{trip.tripOverview.destination || trip.tripOverview.title}</button>)}
          </div>
          {days.length > 0 && <button type="button" onClick={() => { setCompleteError(''); setShowCompleteConfirm(true); }} className="shrink-0 rounded-lg border border-border-subtle px-3 py-2 text-xs font-semibold text-slate-grey hover:border-emerald-700 hover:text-emerald-700">Mark trip complete</button>}
        </div>}

        {/* Day Selector Pills */}
        <div className="max-w-4xl mx-auto mt-6 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {days.map((day) => {
            const isSelected = day.dayNumber === activeDay.dayNumber;
            return (
              <button
                key={day.dayNumber}
                onClick={() => onSelectDay(day.dayNumber)}
                className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'bg-surface border border-border-subtle text-slate-grey hover:text-primary hover:bg-surface-container-low'
                }`}
              >
                Day {day.dayNumber}: {day.date.split(',')[0]}
              </button>
            );
          })}
          <button type="button" onClick={() => void onAddDay()} className="shrink-0 rounded-full border border-dashed border-primary px-4 py-2 text-xs font-semibold text-primary hover:bg-surface-container-low">+ Add day</button>
        </div>
      </header>

      {/* Share Toast Notification */}
      {shareToast && (
        <div className="fixed top-24 right-8 z-50 bg-primary text-on-primary px-4 py-3 rounded-lg shadow-xl text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-300">
          <span className="material-symbols-outlined text-emerald-muted">check_circle</span>
          <span>Day {activeDay.dayNumber} itinerary link copied to clipboard!</span>
        </div>
      )}

      {/* Timeline List */}
      <main className="px-6 md:px-10 py-10 max-w-4xl mx-auto w-full">
        <div className="relative">
          {/* Vertical connecting line */}
          <div className="absolute left-[88px] top-6 bottom-6 w-px bg-border-subtle hidden sm:block pointer-events-none" />

          <div className="space-y-8 relative z-10">
            {activeDay.items.map((item, index) => {
              if (item.type === 'transit') {
                const transit = item.data;
                const iconName =
                  transit.type === 'train'
                    ? 'train'
                    : transit.type === 'walk'
                    ? 'directions_walk'
                    : 'directions_car';

                return (
                  <div
                    key={transit.id}
                    className="flex flex-col sm:flex-row gap-6 items-center pl-0 sm:pl-[112px]"
                  >
                    <div className="w-full bg-surface-container-low rounded-lg py-3 px-4 border border-border-subtle border-dashed flex items-center justify-between text-slate-grey">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-lg">{iconName}</span>
                        <span className="text-xs md:text-sm font-medium text-primary">
                          {transit.description}
                        </span>
                      </div>
                      <span className="text-xs text-slate-grey font-medium">
                        {transit.duration} {transit.cost ? `• ${transit.cost}` : ''}
                      </span>
                    </div>
                  </div>
                );
              }

              // Activity Card
              const activity: ActivitySlot = item.data;
              return (
                <div
                  key={activity.id}
                  className="flex flex-col sm:flex-row gap-6 items-start group"
                >
                  {/* Time label and indicator circle */}
                  <div className="sm:w-20 shrink-0 flex sm:flex-col items-center sm:items-end gap-2 pt-1 relative">
                    <span className="text-xs md:text-sm font-semibold text-primary text-right">
                      {activity.time}
                    </span>
                    <div
                      className={`w-3.5 h-3.5 rounded-full hidden sm:block border-2 border-background absolute left-[83px] top-1.5 transition-colors ${
                        activity.isLocked ? 'bg-emerald-muted' : 'bg-border-subtle'
                      }`}
                    />
                  </div>

                  {/* Activity Content Box */}
                  <div className="flex-1 w-full bg-surface border border-border-subtle rounded-xl p-6 hover:shadow-[0_15px_30px_-10px_rgba(0,0,0,0.1)] transition-shadow duration-300">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold mb-2 ${
                            activity.category === 'Culture'
                              ? 'bg-champagne text-primary'
                              : activity.category === 'Foodie'
                              ? 'bg-secondary-fixed text-primary'
                              : 'bg-surface-container-high text-slate-grey'
                          }`}
                        >
                          {activity.category}
                        </span>
                        <h3 className="font-serif text-xl font-medium text-primary">
                          {activity.title}
                        </h3>
                      </div>

                      {/* Lock / Unlock Toggle Button */}
                      <button
                        onClick={() => onToggleLock(activeDay.dayNumber, activity.id)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                          activity.isLocked
                            ? 'bg-emerald-muted/10 text-emerald-muted hover:bg-emerald-muted/20'
                            : 'border border-border-subtle text-slate-grey hover:bg-surface-container-low'
                        }`}
                        title={
                          activity.isLocked
                            ? 'Slot is locked (AI won’t alter)'
                            : 'Slot is unlocked (Click to lock)'
                        }
                        aria-label={
                          activity.isLocked
                            ? `Unlock ${activity.title}`
                            : `Lock ${activity.title}`
                        }
                      >
                        <span className="material-symbols-outlined text-lg">
                          {activity.isLocked ? 'lock' : 'lock_open'}
                        </span>
                      </button>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4">
                      {/* Photo Thumbnail */}
                      <div className="w-full md:w-36 h-28 rounded-lg overflow-hidden shrink-0 relative bg-surface-container">
                        {activity.imageUrl ? <img src={activity.imageUrl} alt={activity.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : <div className="w-full h-full flex items-center justify-center text-slate-grey bg-surface-container-low"><span className="material-symbols-outlined text-3xl">place</span></div>}
                        <div className="absolute inset-0 bg-gradient-to-t from-primary/30 to-transparent pointer-events-none" />
                      </div>

                      {/* Description and Metadata */}
                      <div className="flex-1 flex flex-col justify-between">
                        <p className="text-sm text-slate-grey line-clamp-2 leading-relaxed">
                          {activity.description}
                        </p>

                        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t border-border-subtle">
                          <div className="flex items-center gap-4 text-xs text-slate-grey font-medium">
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-sm">schedule</span>
                              {activity.duration}
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-sm">payments</span>
                              {activity.cost}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <a
                              href={`https://maps.google.com/?q=${encodeURIComponent([activity.title, destination].filter(Boolean).join(' '))}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1.5 rounded-lg border border-border-subtle text-primary text-xs font-semibold hover:bg-surface-container-low transition-colors flex items-center gap-1"
                              title="View on Google Maps"
                            >
                              <span className="material-symbols-outlined text-sm text-secondary">location_on</span>
                              <span>Maps</span>
                            </a>

                            <button type="button" onClick={() => { setRemoveTarget({ dayNumber: activeDay.dayNumber, activity }); setRemoveError(''); }} className="px-3 py-1.5 rounded-lg border border-red-200 text-red-700 text-xs font-semibold hover:bg-red-50 transition-colors flex items-center gap-1.5" title={`Remove ${activity.title} from the itinerary`}>
                              <span className="material-symbols-outlined text-sm">delete</span>
                              <span>Remove</span>
                            </button>

                            {/* Replan Slot Action */}
                            {!activity.isLocked && (
                              <button
                                onClick={() => { setReplanTarget({ dayNumber: activeDay.dayNumber, activity }); setReplanRequest(''); setReplanError(''); }}
                                className="px-3 py-1.5 rounded-lg border border-border-subtle text-primary text-xs font-semibold hover:bg-surface-container-low transition-colors flex items-center gap-1.5 cursor-pointer"
                                title="Generate a replacement for this activity"
                              >
                                <span className="material-symbols-outlined text-sm">refresh</span>
                                <span>Replan Slot</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {replanTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-labelledby="replan-title">
          <section className="w-full max-w-lg rounded-2xl border border-border-subtle bg-surface p-6 shadow-2xl">
            <h2 id="replan-title" className="font-serif text-2xl font-semibold text-primary">Replan this slot</h2>
            <p className="mt-2 text-sm text-slate-grey">Current activity: <strong className="text-primary">{replanTarget.activity.title}</strong>. What would you like instead?</p>
            <label className="mt-5 block text-xs font-semibold text-slate-grey" htmlFor="replan-request">Preferences (optional)</label>
            <textarea id="replan-request" value={replanRequest} onChange={(event) => setReplanRequest(event.target.value)} rows={3} maxLength={500} placeholder="For example: a quiet garden nearby, less walking, or a vegetarian lunch" className="mt-2 w-full resize-y rounded-xl border border-border-subtle bg-background p-3 text-sm text-primary outline-none focus:border-primary" />
            {replanError && <p role="alert" className="mt-3 text-sm text-red-700">{replanError}</p>}
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button type="button" onClick={() => setReplanTarget(null)} disabled={isReplanning} className="rounded-lg border border-border-subtle px-4 py-2.5 text-xs font-semibold text-primary disabled:opacity-50">Cancel</button>
              <button type="button" onClick={() => submitReplan('')} disabled={isReplanning} className="rounded-lg border border-border-subtle px-4 py-2.5 text-xs font-semibold text-primary disabled:opacity-50">{isReplanning ? 'Generating…' : 'Generate automatically'}</button>
              <button type="button" onClick={() => submitReplan(replanRequest)} disabled={isReplanning || !replanRequest.trim()} className="rounded-lg bg-primary px-4 py-2.5 text-xs font-semibold text-on-primary disabled:opacity-50">{isReplanning ? 'Generating…' : 'Use my preferences'}</button>
            </div>
          </section>
        </div>
      )}

      {removeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-labelledby="remove-slot-title">
          <section className="w-full max-w-md rounded-2xl border border-border-subtle bg-surface p-6 shadow-2xl">
            <h2 id="remove-slot-title" className="font-serif text-2xl font-semibold text-primary">Remove this itinerary slot?</h2>
            <p className="mt-2 text-sm text-slate-grey"><strong className="text-primary">{removeTarget.activity.title}</strong> will be removed from Day {removeTarget.dayNumber}. Its preceding transit leg will also be removed when present.</p>
            {removeError && <p role="alert" className="mt-3 text-sm text-red-700">{removeError}</p>}
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setRemoveTarget(null)} disabled={isRemoving} className="rounded-lg border border-border-subtle px-4 py-2.5 text-xs font-semibold text-primary disabled:opacity-50">Cancel</button>
              <button type="button" disabled={isRemoving} onClick={async () => {
                if (!removeTarget) return;
                setIsRemoving(true);
                setRemoveError('');
                try { await onRemoveSlot(removeTarget.dayNumber, removeTarget.activity.id); setRemoveTarget(null); }
                catch (error) { setRemoveError(error instanceof Error ? error.message : 'Could not remove this slot. Please try again.'); }
                finally { setIsRemoving(false); }
              }} className="rounded-lg bg-red-700 px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50">{isRemoving ? 'Removing…' : 'Remove slot'}</button>
            </div>
          </section>
        </div>
      )}

      {showCompleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-labelledby="complete-trip-title">
          <section className="w-full max-w-md rounded-2xl border border-border-subtle bg-surface p-6 shadow-2xl">
            <h2 id="complete-trip-title" className="font-serif text-2xl font-semibold text-primary">Complete this trip?</h2>
            <p className="mt-2 text-sm text-slate-grey">This trip will leave your active timeline and be kept under Past Adventures. You can start or switch to another trip afterward.</p>
            {completeError && <p role="alert" className="mt-3 text-sm text-red-700">{completeError}</p>}
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setShowCompleteConfirm(false)} disabled={isCompleting} className="rounded-lg border border-border-subtle px-4 py-2.5 text-xs font-semibold text-primary disabled:opacity-50">Keep trip active</button>
              <button type="button" disabled={isCompleting} onClick={async () => {
                setIsCompleting(true);
                setCompleteError('');
                try { await onCompleteTrip(); setShowCompleteConfirm(false); }
                catch (error) { setCompleteError(error instanceof Error ? error.message : 'Could not complete this trip.'); }
                finally { setIsCompleting(false); }
              }} className="rounded-lg bg-primary px-4 py-2.5 text-xs font-semibold text-on-primary disabled:opacity-50">{isCompleting ? 'Saving…' : 'Complete trip'}</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
