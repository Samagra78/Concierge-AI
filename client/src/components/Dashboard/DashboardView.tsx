/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { formatInr } from '../../utils/currency.ts';
import { ItineraryDay, TripOverview, ScreenView } from '../../types.ts';
import { calculateBudgetMetrics } from '../../utils/travelerDna.ts';
import { api } from '../../api/client.ts';

interface DashboardViewProps {
  tripOverview: TripOverview;
  itineraryDays: ItineraryDay[];
  currentDayNumber: number;
  onSelectDay: (dayNumber: number) => void;
  onRefreshItinerary: () => void;
  onNavigate: (screen: ScreenView) => void;
  isGenerating?: boolean;
  onSearchPrompt?: (query: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  tripOverview,
  itineraryDays,
  currentDayNumber,
  onSelectDay,
  onRefreshItinerary,
  onNavigate,
  isGenerating = false,
  onSearchPrompt,
}) => {
  const [promptText, setPromptText] = useState('Plan a 9-day trip to Japan under ₹2,37,500');
  const [zoomLevel, setZoomLevel] = useState(13);
  const [activePin, setActivePin] = useState<number | null>(null);
  const [mapCenter, setMapCenter] = useState({ lat: 35.6762, lon: 139.6503 });
  const [liveMapUrl, setLiveMapUrl] = useState('/api/places/map?lat=35.6762&lon=139.6503&zoom=13');
  const [nearbyPlaces, setNearbyPlaces] = useState<any[]>([]);
  const [mapStatus, setMapStatus] = useState('');
  const [mapImageFailed, setMapImageFailed] = useState(false);
  const [mapImageLoaded, setMapImageLoaded] = useState(false);
  const geocodeCache = React.useRef(new Map<string, { lat: number; lon: number } | null>());
  const upcomingStops = React.useMemo(() => itineraryDays
    .filter((day) => day.dayNumber >= currentDayNumber)
    .flatMap((day) => day.items
      .filter((item) => item.type === 'activity')
      .map((item) => ({ dayNumber: day.dayNumber, activity: item.data })))
    .slice(0, 6), [itineraryDays, currentDayNumber]);
  const [mapPoints, setMapPoints] = useState<Array<{ lat: number; lon: number }>>([]);

  const mapUrl = (center: { lat: number; lon: number }, zoom: number, points = mapPoints) => {
    const params = new URLSearchParams({ lat: String(center.lat), lon: String(center.lon), zoom: String(zoom) });
    if (points.length) params.set('points', JSON.stringify(points));
    params.set('refresh', String(Date.now()));
    return `/api/places/map?${params.toString()}`;
  };

  useEffect(() => {
    let cancelled = false;
    const destination = tripOverview.destination && tripOverview.destination !== 'No trip planned' ? tripOverview.destination : 'Tokyo';
    setMapImageLoaded(false);
    setMapImageFailed(false);
    setMapPoints([]);
    api.geocodePlace(destination)
      .then(async ({ location }) => {
        if (cancelled) return;
        const center = { lat: location.lat, lon: location.lon };
        setMapCenter(center);
        const resolved = await Promise.all(upcomingStops.map(async ({ activity }) => {
          if (activity.coordinates && Number.isFinite(activity.coordinates.lat) && Number.isFinite(activity.coordinates.lng)) return { lat: activity.coordinates.lat, lon: activity.coordinates.lng };
          const cacheKey = `${activity.title.toLowerCase()}|${destination.toLowerCase()}`;
          if (geocodeCache.current.has(cacheKey)) return geocodeCache.current.get(cacheKey) || null;
          try {
            const { location: found } = await api.geocodePlace(`${activity.title}, ${destination}`);
            const point = { lat: found.lat, lon: found.lon };
            geocodeCache.current.set(cacheKey, point);
            return point;
          } catch { geocodeCache.current.set(cacheKey, null); return null; }
        }));
        if (cancelled) return;
        const points = resolved.filter((point): point is { lat: number; lon: number } => point !== null);
        setMapPoints(points);
        setLiveMapUrl(mapUrl(center, zoomLevel, points));
        const result = await api.mapPlaces({ ...center, category: 'cafe' });
        if (!cancelled) setNearbyPlaces(result.places);
      })
      .catch((error) => { if (!cancelled) setMapStatus(error instanceof Error ? error.message : 'Could not find the trip location.'); });
    return () => { cancelled = true; };
  }, [tripOverview.destination, upcomingStops, zoomLevel]);

  const loadNearbyMap = () => {
    if (!navigator.geolocation) { setMapStatus('Location is not available in this browser.'); return; }
    setMapStatus('Finding your location…');
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      try {
        const center = { lat: coords.latitude, lon: coords.longitude };
        setMapCenter(center);
        setLiveMapUrl(mapUrl(center, zoomLevel));
        setMapImageFailed(false);
        setMapImageLoaded(false);
        const result = await api.mapPlaces({ ...center, category: 'cafe' });
        setNearbyPlaces(result.places); setMapStatus('');
      } catch (error) { setMapStatus(error instanceof Error ? error.message : 'Could not load nearby places.'); }
    }, () => setMapStatus('Location permission was denied. Showing Tokyo instead.'), { timeout: 10000 });
  };

  const budgetMetrics = calculateBudgetMetrics(
    tripOverview.totalBudget,
    tripOverview.allocatedBudget
  );

  const handleSubmitPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearchPrompt) {
      onSearchPrompt(promptText);
    } else {
      onRefreshItinerary();
    }
  };

  const mapPins = [
    {
      id: 1,
      num: '1',
      title: 'Tokyo Arrival',
      subtitle: 'Hotel Gracery & Shinjuku',
      top: '25%',
      left: '35%',
      highlight: false,
    },
    {
      id: 2,
      num: '2',
      title: 'Shibuya Crossing',
      subtitle: 'Meiji Jingu & Dining',
      top: '50%',
      left: '52%',
      highlight: false,
    },
    {
      id: 3,
      num: '3',
      title: 'Kyoto Transit',
      subtitle: 'Gion Machiya & Bamboo Grove',
      top: '68%',
      left: '70%',
      highlight: true,
    },
  ];

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-background">
      {/* Top Prompt Bar */}
      <header className="h-20 border-b border-border-subtle bg-surface px-6 md:px-8 flex items-center shrink-0 z-30">
        <form
          onSubmit={handleSubmitPrompt}
          className="w-full max-w-4xl mx-auto flex items-center relative"
        >
          <span className="material-symbols-outlined absolute left-4 text-slate-grey pointer-events-none">
            auto_awesome
          </span>
          <input
            type="text"
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            placeholder="Where to next or what errand do you need?"
            className="w-full bg-surface-container-low border-b-2 border-primary focus:border-black font-serif text-lg md:text-xl text-primary py-3.5 pl-12 pr-12 focus:outline-none placeholder:text-slate-grey transition-colors rounded-t-sm"
          />
          <button
            type="submit"
            className="absolute right-4 text-primary hover:text-slate-grey transition-colors cursor-pointer p-1"
            title="Send prompt"
            aria-label="Submit travel request"
          >
            <span className="material-symbols-outlined text-2xl">send</span>
          </button>
        </form>
      </header>

      {/* Split View */}
      <div className="flex-grow flex flex-col lg:flex-row overflow-hidden relative">
        {/* Left Map Panel (60%) */}
        <section
          aria-label="Interactive Map"
          className="w-full lg:w-3/5 h-[45vh] lg:h-full min-h-[320px] relative bg-surface-container border-b lg:border-b-0 lg:border-r border-border-subtle overflow-hidden select-none"
        >
          <div className="absolute left-4 top-4 z-30 flex flex-col gap-2">
            <button onClick={loadNearbyMap} className="rounded-lg bg-white px-3 py-2 text-xs font-semibold shadow" type="button">Show nearby places</button>
            {mapStatus && <span role="status" className="max-w-xs rounded bg-white/95 p-2 text-xs shadow">{mapStatus}</span>}
          </div>
          {liveMapUrl && !mapImageFailed && <img key={liveMapUrl} src={liveMapUrl} alt={`Geoapify map around ${tripOverview.destination || 'Tokyo'}`} loading="eager" decoding="async" className="absolute inset-0 z-0 block" style={{ width: '100%', height: '100%', minHeight: '320px', objectFit: 'cover' }} onLoad={() => { setMapImageLoaded(true); setMapStatus(''); }} onError={() => { setMapImageFailed(true); setMapImageLoaded(false); setMapStatus('Geoapify map could not be displayed. Check the server Geoapify key and retry.'); }} />}
          {liveMapUrl && !mapImageLoaded && !mapImageFailed && <div className="absolute inset-0 z-10 flex items-center justify-center bg-surface-container text-sm text-slate-grey"><span className="material-symbols-outlined mr-2 animate-spin">sync</span>Loading Geoapify map…</div>}
          {mapImageFailed && <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-surface-container p-6 text-center"><span className="material-symbols-outlined text-4xl text-slate-grey">map</span><p className="text-sm text-slate-grey">{mapStatus || 'Geoapify map unavailable.'}</p><button type="button" onClick={() => { setMapImageFailed(false); setMapImageLoaded(false); setLiveMapUrl(mapUrl(mapCenter, zoomLevel)); }} className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-on-primary">Retry map</button></div>}
          {/* Map Graphic / Background */}
          <div
            className="absolute inset-0 w-full h-full bg-cover bg-center transition-transform duration-500"
            style={{
              display: liveMapUrl ? 'none' : 'block',
              backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuAyFm9yWrniNeS_Tc89M63OZzDuLdkWkjOhQFd1tr3zEw3yNpqw9u4pBAoa2u5cL98wh-Vxm3ZyOLQ0JMNBrVb-A0-GpPaBg2phsW-PLNiGXHhwvPg6iLVOEPKTA9s7gywlzOtCqlgBYtjEL83ADXzfI0-2lilPJ4EmVj59LU3U9wvdyiQTTJxnfVlt3GTcgyeVPSQm0-UEMIBF3zlAAG0BpeoxfxelCDExtNXXvu9JUNViQRFA7bG_Rw')`,
              transform: `scale(${zoomLevel})`,
            }}
          />

          {/* Map Overlay Gradient for readability */}
          {!liveMapUrl && <div className="absolute inset-0 bg-gradient-to-t from-surface/80 via-transparent to-transparent pointer-events-none" />}

          {/* Polyline Route SVG connecting markers */}
          {!liveMapUrl && <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full pointer-events-none z-10 opacity-70"
          >
            <path
              d="M 35 25 Q 44 38 52 50 T 70 68"
              fill="none"
              stroke="#000000"
              strokeWidth="0.8"
              strokeDasharray="1.5 1.5"
            />
          </svg>}

          {/* Sequential Activity Markers matching Figma */}
          {!liveMapUrl && mapPins.map((pin) => {
            const isSelected = activePin === pin.id;
            return (
              <div
                key={pin.id}
                onClick={() => setActivePin(pin.id)}
                className="absolute flex flex-col items-center transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group"
                style={{ top: pin.top, left: pin.left }}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-lg transform group-hover:scale-110 transition-all ${
                    pin.highlight
                      ? 'bg-champagne text-primary border border-border-subtle'
                      : 'bg-primary text-on-primary'
                  } ${isSelected ? 'ring-4 ring-champagne' : ''}`}
                >
                  {pin.num}
                </div>
                <div className="mt-1.5 px-3 py-1 bg-surface text-primary text-xs font-semibold rounded shadow-xs border border-border-subtle whitespace-nowrap group-hover:shadow-md transition-shadow">
                  {pin.title}
                </div>
                {isSelected && (
                  <div className="mt-1 px-2.5 py-1.5 bg-primary text-white text-[11px] rounded shadow-md whitespace-nowrap animate-in fade-in zoom-in duration-200 flex items-center gap-1.5">
                    <span>{pin.subtitle}</span>
                    <span>&bull;</span>
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(pin.title + ' Tokyo')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-champagne underline hover:text-white flex items-center gap-0.5"
                    >
                      <span>Maps</span>
                      <span className="material-symbols-outlined text-[10px]">open_in_new</span>
                    </a>
                  </div>
                )}
              </div>
            );
          })}
          {liveMapUrl && nearbyPlaces.length > 0 && <div className="absolute bottom-4 left-4 z-30 max-h-28 w-64 overflow-auto rounded-lg bg-white/95 p-3 text-xs shadow"><strong>Nearby places</strong>{nearbyPlaces.slice(0, 3).map((place) => <div key={place.id} className="mt-1 truncate">{place.name}</div>)}</div>}

          {/* Floating Map Zoom Controls */}
          <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-30">
            <button
              onClick={() => setZoomLevel((z) => { const next = Math.min(z + 1, 18); setMapImageLoaded(false); setMapImageFailed(false); setLiveMapUrl(mapUrl(mapCenter, next)); return next; })}
              className="w-10 h-10 bg-surface rounded shadow-sm border border-border-subtle flex items-center justify-center text-primary hover:bg-surface-container-low transition-colors cursor-pointer"
              aria-label="Zoom in map"
              title="Zoom In"
            >
              <span className="material-symbols-outlined text-xl">add</span>
            </button>
            <button
              onClick={() => setZoomLevel((z) => { const next = Math.max(z - 1, 3); setMapImageLoaded(false); setMapImageFailed(false); setLiveMapUrl(mapUrl(mapCenter, next)); return next; })}
              className="w-10 h-10 bg-surface rounded shadow-sm border border-border-subtle flex items-center justify-center text-primary hover:bg-surface-container-low transition-colors cursor-pointer"
              aria-label="Zoom out map"
              title="Zoom Out"
            >
              <span className="material-symbols-outlined text-xl">remove</span>
            </button>
          </div>
        </section>

        {/* Right Trip Overview Control Panel (40%) */}
        <section className="w-full lg:w-2/5 h-auto lg:h-full bg-surface overflow-y-auto flex flex-col p-6 md:p-8">
          <div className="mb-6">
            <h2 className="font-serif text-2xl md:text-3xl font-semibold text-primary mb-2">
              Trip Overview
            </h2>
            <p className="text-slate-grey text-sm md:text-base leading-relaxed">
              {tripOverview.summary}
            </p>
          </div>

          {/* Metrics Bento Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-surface-container-low p-4 rounded-lg border border-border-subtle flex flex-col justify-between">
              <span className="text-xs text-slate-grey uppercase tracking-wider font-semibold mb-2 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base">location_on</span>
                Destination
              </span>
              <span className="font-serif text-xl md:text-2xl font-medium text-primary">
                {tripOverview.destination}
              </span>
            </div>

            <div className="bg-surface-container-low p-4 rounded-lg border border-border-subtle flex flex-col justify-between">
              <span className="text-xs text-slate-grey uppercase tracking-wider font-semibold mb-2 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base">calendar_month</span>
                Duration
              </span>
              <span className="font-serif text-xl md:text-2xl font-medium text-primary">
                {tripOverview.durationDays} Days
              </span>
            </div>

            {/* Total Budget Card */}
            <div className="col-span-2 bg-surface p-4 rounded-lg border border-border-subtle flex flex-col relative overflow-hidden">
              <div className="flex justify-between items-end mb-3 z-10 relative">
                <div>
                  <span className="text-xs text-slate-grey uppercase tracking-wider font-medium block mb-1">
                    Total Budget
                  </span>
                  <span className="font-serif text-2xl font-semibold text-primary">
                    {formatInr(tripOverview.totalBudget)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-grey uppercase tracking-wider font-medium block mb-1">
                    Allocated
                  </span>
                  <span className="font-serif text-2xl font-semibold text-emerald-muted">
                    {formatInr(tripOverview.allocatedBudget)}
                  </span>
                </div>
              </div>

              {/* Budget Progress Bar */}
              <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden z-10 relative">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${budgetMetrics.percentAllocated}%` }}
                />
              </div>

              <div className="flex justify-between items-center mt-2 z-10 relative">
                <span className="text-xs text-slate-grey font-medium">
                  {budgetMetrics.percentAllocated}% planned
                </span>
                <span className="text-xs text-slate-grey font-semibold">
                  {formatInr(budgetMetrics.remainingBudget)} remaining
                </span>
              </div>
            </div>
          </div>

          {/* Traveler DNA Tags */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-sm font-semibold text-primary">Trip DNA</h3>
              <button
                onClick={() => onNavigate('traveler-dna')}
                className="text-xs text-slate-grey hover:text-primary transition-colors underline underline-offset-2"
              >
                Customize DNA
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tripOverview.tags.map((tag, idx) => {
                const isChampagne = idx < 2;
                return (
                  <span
                    key={tag}
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      isChampagne
                        ? 'bg-champagne text-primary'
                        : 'bg-surface-container-highest text-slate-grey border border-border-subtle'
                    }`}
                  >
                    {tag}
                  </span>
                );
              })}
            </div>
          </div>

          <section className="mb-6 rounded-lg border border-border-subtle bg-surface p-4" aria-label="Upcoming itinerary activities">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-serif text-lg font-semibold text-primary">Upcoming</h3>
              {upcomingStops.length > 0 && <button type="button" onClick={() => onNavigate('timeline')} className="text-xs font-medium text-slate-grey underline underline-offset-2">Full timeline</button>}
            </div>
            {upcomingStops.length ? <div className="space-y-2">
              {upcomingStops.slice(0, 4).map(({ dayNumber, activity }, index) => (
                <button key={`${dayNumber}-${activity.id}`} type="button" onClick={() => { onSelectDay(dayNumber); onNavigate('timeline'); }} className="flex w-full items-center gap-3 rounded-lg bg-surface-container-low p-2.5 text-left transition-colors hover:bg-surface-container-high">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-champagne text-xs font-bold text-primary">{index + 1}</span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-primary">{activity.title}</span><span className="block truncate text-xs text-slate-grey">Day {dayNumber} · {activity.time} · {activity.category}</span></span>
                  <span className="material-symbols-outlined text-base text-slate-grey">chevron_right</span>
                </button>
              ))}
            </div> : <p className="text-sm text-slate-grey">No upcoming activities yet. Generate an itinerary or add a place from Smart Discovery.</p>}
          </section>

          {/* Quick link to explore Timeline */}
          <div className="mb-6 p-4 rounded-lg bg-surface-container-low border border-border-subtle flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-xl">timeline</span>
              <div>
                <p className="text-sm font-semibold text-primary">View Day 3 Smart Timeline</p>
                <p className="text-xs text-slate-grey">Senso-ji, Sushi Dai & transit routes</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('timeline')}
              className="px-3 py-1.5 bg-surface text-primary border border-border-subtle rounded-md text-xs font-semibold hover:bg-surface-container-high transition-colors"
            >
              Open
            </button>
          </div>

          {/* Spacer */}
          <div className="flex-grow min-h-4" />

          {/* Primary Action Button */}
          <div className="mt-auto pt-4 border-t border-border-subtle">
            <button
              onClick={onRefreshItinerary}
              disabled={isGenerating}
              className="w-full bg-primary text-on-primary text-sm font-semibold py-4 rounded-lg whisper-shadow hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <span
                className={`material-symbols-outlined text-lg ${
                  isGenerating ? 'animate-spin' : ''
                }`}
              >
                sync
              </span>
              <span>{isGenerating ? 'Curating with AI...' : 'Generate / Refresh Itinerary'}</span>
            </button>
            <p className="text-center text-xs text-slate-grey mt-2.5">
              AI generation takes about 15 seconds.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};
