import React, { useState } from 'react';
import { DiscoveredPlace, ItineraryDay, TravelerDNA } from '../../types.ts';
import { api } from '../../api/client.ts';

interface SmartDiscoveryViewProps {
  places: DiscoveredPlace[];
  destination?: string;
  dna?: TravelerDNA | null;
  budgetPerDay?: number;
  totalBudget?: number;
  remainingBudget?: number;
  durationDays?: number;
  days: ItineraryDay[];
  currentDayNumber: number;
  onAddToItinerary: (place: DiscoveredPlace, dayNumber: number, time: string) => Promise<void> | void;
}

export const SmartDiscoveryView: React.FC<SmartDiscoveryViewProps> = ({
  places: initialPlaces,
  destination: initialDestination = '',
  dna,
  budgetPerDay = 25000,
  totalBudget = 0,
  remainingBudget = budgetPerDay,
  durationDays = 1,
  days,
  currentDayNumber,
  onAddToItinerary,
}) => {
  const [places, setPlaces] = useState<DiscoveredPlace[]>(initialPlaces);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [destination, setDestination] = useState(initialDestination);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchError, setSearchError] = useState('');
  const [placeToSchedule, setPlaceToSchedule] = useState<DiscoveredPlace | null>(null);
  const [selectedDay, setSelectedDay] = useState(currentDayNumber);
  const [selectedTime, setSelectedTime] = useState('16:30');
  const [isAdding, setIsAdding] = useState(false);

  const categories = ['All', 'Food & Drink', 'Specialty Coffee', 'Fine Dining', 'Accommodation', 'Attractions', 'Modern Art', 'Architecture', 'Travel & Transport'];

  const filteredPlaces =
    selectedCategory === 'All'
      ? places
      : places.filter((p) => p.category === selectedCategory);

  const handleAdd = async () => {
    if (!placeToSchedule) return;
    try {
      setIsAdding(true);
      const [hour, minute] = selectedTime.split(':').map(Number);
      const time = `${String(hour % 12 || 12).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`;
      await onAddToItinerary(placeToSchedule, selectedDay, time);
      setToastMessage(`Added "${placeToSchedule.name}" to Day ${selectedDay} at ${time}.`);
      setPlaceToSchedule(null);
      setTimeout(() => setToastMessage(null), 3000);
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : 'Could not add this place to the timeline.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleSearchWithMaps = async (cat = selectedCategory) => {
    if (!destination.trim()) { setSearchError('Enter a city or area to discover nearby places.'); return; }
    setIsSearching(true);
    setSearchError('');
    try {
      const res = await api.discoverPlaces({
        category: cat,
        destination: destination.trim(),
        dna,
        budgetPerDay,
        totalBudget,
        remainingBudget,
        durationDays,
      });
      setPlaces(res.places || []);
      if (!res.places?.length) setSearchError('No places matched this category and budget near that location. Try another category, area, or budget.');
    } catch (error) {
      setPlaces([]);
      setSearchError(error instanceof Error ? error.message : 'Geoapify places are unavailable.');
    } finally {
      setIsSearching(false);
    }
  };

  React.useEffect(() => {
    if (initialDestination.trim()) void handleSearchWithMaps('All');
  }, []);

  return (
    <div className="flex-1 min-h-screen bg-background p-6 md:p-10 max-w-6xl mx-auto w-full pb-24 md:pb-12">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-2xl">explore</span>
            <span className="text-xs uppercase tracking-widest font-bold text-slate-grey">
              Geoapify Places &bull; Preference and Budget Matched
            </span>
          </div>

          <button
            onClick={() => handleSearchWithMaps()}
            disabled={isSearching}
            className="px-3.5 py-1.5 bg-champagne text-primary text-xs font-semibold rounded-lg hover:brightness-95 transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-60"
            title="Search nearby Geoapify Places"
          >
            <span className={`material-symbols-outlined text-sm ${isSearching ? 'animate-spin' : ''}`}>
              {isSearching ? 'sync' : 'location_on'}
            </span>
            <span>{isSearching ? 'Searching…' : 'Search Geoapify'}</span>
          </button>
        </div>
        <h2 className="font-serif text-3xl md:text-4xl font-semibold text-primary mb-2">
          Smart Discovery
        </h2>
        <p className="text-slate-grey text-base md:text-lg max-w-2xl">
          Search real food, stays, attractions, and transport around your chosen location. Suggestions use your Traveler DNA and estimated daily budget.
        </p>

        <form onSubmit={(event) => { event.preventDefault(); void handleSearchWithMaps(); }} className="mt-5 flex max-w-2xl gap-2">
          <input value={destination} onChange={(event) => setDestination(event.target.value)} placeholder="Enter a city or neighborhood" aria-label="Discovery location" className="min-w-0 flex-1 rounded-lg border border-border-subtle bg-surface px-4 py-2.5 text-sm text-primary outline-none focus:border-primary" />
          <button disabled={isSearching || !destination.trim()} className="rounded-lg bg-primary px-4 py-2.5 text-xs font-semibold text-on-primary disabled:opacity-50">Search places</button>
        </form>

        {/* Category Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pt-6 pb-2 scrollbar-none items-center">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                void handleSearchWithMaps(cat);
              }}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'bg-surface border border-border-subtle text-slate-grey hover:text-primary hover:bg-surface-container-low'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <p className="mt-3 text-xs text-slate-grey">Daily budget used for estimates: ₹{budgetPerDay.toLocaleString('en-IN')} · Prices are estimates when venue pricing is not listed.</p>
        {searchError && <p role="status" className="mt-3 rounded-lg border border-border-subtle bg-surface p-3 text-sm text-slate-grey">{searchError}</p>}
      </header>

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-8 right-8 z-50 bg-primary text-on-primary px-5 py-3.5 rounded-lg shadow-xl text-xs font-medium flex items-center gap-2.5 animate-in fade-in slide-in-from-top-4 duration-300">
          <span className="material-symbols-outlined text-emerald-muted">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Places Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {filteredPlaces.map((place) => (
          <div
            key={place.id}
            className="bg-surface border border-border-subtle rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col group"
          >
            <div className="h-48 relative overflow-hidden bg-surface-container">
              {place.imageUrl ? <img src={place.imageUrl} alt={place.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : <div className="flex h-full w-full items-center justify-center bg-surface-container-low text-slate-grey"><span className="material-symbols-outlined text-5xl">{place.category === 'Accommodation' ? 'hotel' : place.category === 'Travel & Transport' ? 'train' : place.category === 'Food & Drink' ? 'restaurant' : 'place'}</span></div>}
              {place.imageUrl && <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />}

              {/* DNA Match Badge */}
              <div className="absolute top-4 right-4 bg-surface/90 backdrop-blur-xs text-primary text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-xs border border-border-subtle">
                <span className="material-symbols-outlined text-sm text-emerald-muted">
                  auto_awesome
                </span>
                <span>{place.matchScore}% DNA Match</span>
              </div>

              {/* Category pill */}
              <div className="absolute bottom-3 left-4">
                <span className="bg-champagne text-primary px-3 py-1 rounded-full text-xs font-bold">
                  {place.category}
                </span>
              </div>
            </div>

            <div className="p-6 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-baseline mb-2">
                  <h3 className="font-serif text-xl font-semibold text-primary">{place.name}</h3>
                  <span className="text-xs font-semibold text-slate-grey">
                    {place.priceLevel}
                  </span>
                </div>

                <p className="text-xs text-slate-grey mb-3 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">location_on</span>
                  {place.neighborhood}{place.rating > 0 ? ` · ★ ${place.rating.toFixed(1)}${place.reviewCount ? ` (${place.reviewCount} reviews)` : ''}` : ' · Rating unavailable'}
                </p>

                <p className="text-sm text-on-surface-variant leading-relaxed mb-4">
                  {place.description}
                </p>

                {/* Match Reasons */}
                <div className="space-y-1 mb-6">
                  {place.matchReasons.map((reason, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 text-xs text-emerald-muted font-medium"
                    >
                      <span className="material-symbols-outlined text-xs">done</span>
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-border-subtle flex items-center gap-2">
                <a
                  href={place.mapsUrl || `https://www.openstreetmap.org/search?query=${encodeURIComponent(place.name + ' ' + place.neighborhood)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2.5 rounded-lg border border-border-subtle bg-surface hover:bg-surface-container-low text-xs font-semibold text-primary transition-colors flex items-center justify-center gap-1.5 shrink-0"
                  title="View place on OpenStreetMap"
                >
                  <span className="material-symbols-outlined text-base text-secondary">location_on</span>
                  <span>Map</span>
                </a>
                <button
                  type="button"
                  onClick={() => { setSelectedDay(days.some((day) => day.dayNumber === currentDayNumber) ? currentDayNumber : days[0]?.dayNumber || 1); setPlaceToSchedule(place); }}
                  className="flex-1 bg-primary text-on-primary py-2.5 px-4 rounded-lg text-xs font-semibold hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <span className="material-symbols-outlined text-base">add</span>
                  <span>Add to Itinerary</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {placeToSchedule && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setPlaceToSchedule(null); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="schedule-place-title" className="w-full max-w-md rounded-xl border border-border-subtle bg-surface p-6 shadow-2xl">
            <h3 id="schedule-place-title" className="font-serif text-2xl font-semibold text-primary">Add to your itinerary</h3>
            <p className="mt-1 text-sm text-slate-grey">Choose when to visit <strong>{placeToSchedule.name}</strong>.</p>
            <div className="mt-5 grid grid-cols-2 gap-4">
              <label className="text-xs font-semibold text-slate-grey">Day
                <select value={selectedDay} onChange={(event) => setSelectedDay(Number(event.target.value))} className="mt-2 w-full rounded-lg border border-border-subtle bg-surface px-3 py-2.5 text-sm text-primary" aria-label="Choose itinerary day">
                  {(days.length ? days : [{ dayNumber: 1, date: 'Day 1', title: 'Day 1', theme: '', items: [] }]).map((day) => <option key={day.dayNumber} value={day.dayNumber}>Day {day.dayNumber} · {day.title}</option>)}
                </select>
              </label>
              <label className="text-xs font-semibold text-slate-grey">Time
                <input type="time" value={selectedTime} onChange={(event) => setSelectedTime(event.target.value)} className="mt-2 w-full rounded-lg border border-border-subtle bg-surface px-3 py-2.5 text-sm text-primary" aria-label="Choose visit time" />
              </label>
            </div>
            {searchError && <p role="alert" className="mt-3 text-sm text-red-600">{searchError}</p>}
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => { setPlaceToSchedule(null); setSearchError(''); }} className="rounded-lg border border-border-subtle px-4 py-2.5 text-sm font-semibold text-primary">Cancel</button>
              <button type="button" onClick={() => void handleAdd()} disabled={isAdding || !selectedTime} className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary disabled:opacity-50">{isAdding ? 'Adding…' : 'Add to Day ' + selectedDay}</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
