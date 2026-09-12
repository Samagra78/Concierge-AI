/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserProfile, PastTrip, ScreenView, TripOverview } from '../../types.ts';

interface ProfileViewProps {
  user: UserProfile;
  tripOverview: TripOverview;
  pastTrips: PastTrip[];
  onNavigate: (screen: ScreenView) => void;
  onSaveProfile: (profile: Pick<UserProfile, 'name' | 'phoneNumber' | 'homeCity' | 'countryOfResidence' | 'preferredCurrency'>) => Promise<void>;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  tripOverview,
  pastTrips,
  onNavigate,
  onSaveProfile,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'trips' | 'settings'>('overview');
  const [currentItineraryModal, setCurrentItineraryModal] = useState(false);
  const [profileName, setProfileName] = useState(user.name);
  const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber || '');
  const [homeCity, setHomeCity] = useState(user.homeCity || '');
  const [countryOfResidence, setCountryOfResidence] = useState(user.countryOfResidence || '');
  const [profileError, setProfileError] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  const saveProfile = async () => {
    setIsSavingProfile(true);
    setProfileError('');
    setProfileSaved(false);
    try {
      await onSaveProfile({ name: profileName.trim(), phoneNumber: phoneNumber.trim(), homeCity: homeCity.trim(), countryOfResidence: countryOfResidence.trim(), preferredCurrency: 'INR' });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2500);
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'Could not save your profile.');
    } finally { setIsSavingProfile(false); }
  };

  return (
    <div className="flex-1 min-h-screen bg-background p-6 md:p-10 max-w-6xl mx-auto w-full pb-24 md:pb-12">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Left Column: Identity & Account Stats */}
        <aside className="w-full md:w-1/3 flex flex-col gap-6">
          {/* Identity Card */}
          <div className="bg-surface border border-border-subtle rounded-xl p-6 md:p-8 flex flex-col items-center text-center whisper-card-shadow">
            {user.avatarUrl ? <img src={user.avatarUrl} alt={user.name} className="w-28 h-28 md:w-32 md:h-32 rounded-full object-cover mb-4 whisper-shadow border-2 border-surface" /> : <div aria-hidden="true" className="w-28 h-28 md:w-32 md:h-32 rounded-full mb-4 border-2 border-surface bg-surface-container-low flex items-center justify-center text-4xl font-serif text-slate-grey">{user.name.charAt(0).toUpperCase()}</div>}
            <h2 className="font-serif text-2xl font-semibold text-primary mb-1">
              {user.name}
            </h2>
            <p className="text-slate-grey text-sm mb-1">{user.roleTitle}</p>
            {user.homeCity && <p className="text-slate-grey text-xs mb-5">{[user.homeCity, user.countryOfResidence].filter(Boolean).join(', ')}</p>}
            {!user.homeCity && <div className="mb-5" />}

            {/* Tags */}
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {user.tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-champagne text-primary px-3 py-1 rounded-full text-xs font-semibold"
                >
                  {tag}
                </span>
              ))}
            </div>

            <button
              onClick={() => onNavigate('traveler-dna')}
              className="w-full bg-transparent border border-primary text-primary text-xs font-semibold py-3 px-4 rounded-lg hover:bg-surface-container-low transition-colors cursor-pointer"
            >
              Edit Travel Preferences
            </button>
          </div>

          {/* Account Stats */}
          <div className="bg-surface border border-border-subtle rounded-xl p-6 whisper-card-shadow">
            <h3 className="font-serif text-lg font-medium text-primary mb-4">Account Stats</h3>
            <div className="space-y-3.5">
              <div className="flex justify-between items-center border-b border-border-subtle pb-2.5">
                <span className="text-sm text-slate-grey">Countries Visited</span>
                <span className="text-sm font-bold text-primary">
                  {user.stats.countriesVisited}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-border-subtle pb-2.5">
                <span className="text-sm text-slate-grey">Total Trips</span>
                <span className="text-sm font-bold text-primary">
                  {user.stats.totalTrips}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-grey">Member Since</span>
                <span className="text-sm font-bold text-primary">
                  {user.stats.memberSince}
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* Right Column: Main Pane */}
        <section className="w-full md:w-2/3 flex flex-col">
          {/* Tabs */}
          <div className="flex gap-6 border-b border-border-subtle mb-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-3 text-sm font-semibold transition-colors cursor-pointer ${
                activeTab === 'overview'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-slate-grey hover:text-primary'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('trips')}
              className={`pb-3 text-sm font-semibold transition-colors cursor-pointer ${
                activeTab === 'trips'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-slate-grey hover:text-primary'
              }`}
            >
              My Trips
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`pb-3 text-sm font-semibold transition-colors cursor-pointer ${
                activeTab === 'settings'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-slate-grey hover:text-primary'
              }`}
            >
              Settings
            </button>
          </div>

          {/* Active Tab Content */}
          {activeTab === 'overview' && (
            <div className="flex flex-col gap-8">
              {/* Current Itinerary Card */}
              <div>
                <h3 className="font-serif text-xl font-medium text-primary mb-4">
                  Current Itinerary
                </h3>
                {tripOverview.destination ? <div className="bg-surface border border-border-subtle rounded-xl p-6 flex flex-col md:flex-row gap-6 relative overflow-hidden group hover:shadow-md transition-shadow">
                  {/* Confirmed Emerald Badge */}
                  <div className="absolute top-4 right-4 bg-emerald-muted/10 text-emerald-muted text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1 z-10 border border-emerald-muted/20">
                    <span className="material-symbols-outlined text-sm">lock</span>
                    <span>Confirmed</span>
                  </div>

                  {/* Itinerary Thumbnail */}
                  <div className="w-full md:w-1/3 h-44 md:h-auto rounded-lg overflow-hidden bg-surface-container shrink-0 relative">
                    <div className="w-full h-full flex items-center justify-center text-slate-grey bg-surface-container-low"><span className="material-symbols-outlined text-5xl">map</span></div>
                  </div>

                  {/* Card Content */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-serif text-xl md:text-2xl font-semibold text-primary mb-1.5">
                        {tripOverview.title}
                      </h4>
                      <p className="text-xs md:text-sm text-slate-grey flex items-center gap-1.5 mb-3">
                        <span className="material-symbols-outlined text-base">calendar_today</span>
                        <span>{tripOverview.destination} · {tripOverview.durationDays} days</span>
                      </p>
                      <p className="text-sm text-on-surface line-clamp-2 leading-relaxed">
                        {tripOverview.summary}
                      </p>
                    </div>

                    <div className="mt-5 flex gap-3">
                      <button
                        onClick={() => setCurrentItineraryModal(true)}
                        className="bg-primary text-on-primary text-xs font-semibold py-2.5 px-6 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => onNavigate('dashboard')}
                        className="bg-transparent border border-border-subtle text-primary text-xs font-semibold py-2.5 px-6 rounded-lg hover:bg-surface-container-low transition-colors cursor-pointer"
                      >
                        Manage
                      </button>
                    </div>
                  </div>
                </div> : <div className="rounded-xl border border-border-subtle bg-surface p-6 text-sm text-slate-grey">No active itinerary yet. Start a new trip to see it here.</div>}
              </div>

              {/* Past Adventures Grid */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-serif text-xl font-medium text-primary">Past Adventures</h3>
                  <button
                    onClick={() => setActiveTab('trips')}
                    className="text-xs text-slate-grey hover:text-primary transition-colors flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <span>View All</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </div>

                {pastTrips.length > 0 ? <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {pastTrips.map((trip) => (
                    <div
                      key={trip.id}
                      className="bg-surface border border-border-subtle rounded-xl overflow-hidden hover:shadow-md transition-shadow group cursor-pointer flex flex-col"
                    >
                      <div className="h-40 relative overflow-hidden">
                        {trip.imageUrl ? <img
                          src={trip.imageUrl}
                          alt={trip.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        /> : <div className="flex h-full w-full items-center justify-center bg-surface-container-low text-slate-grey"><span className="material-symbols-outlined text-5xl">flight_takeoff</span></div>}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        <div className="absolute bottom-3 left-4">
                          <h5 className="font-serif text-lg font-medium text-white">
                            {trip.title}
                          </h5>
                        </div>
                        <div className="absolute top-3 right-3 bg-surface/90 backdrop-blur-xs text-slate-grey text-xs font-semibold px-2 py-1 rounded-md flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm text-emerald-muted">
                            check_circle
                          </span>
                          <span>Completed</span>
                        </div>
                      </div>

                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <p className="text-xs text-slate-grey mb-3 font-medium">{trip.duration}</p>
                        <button
                          onClick={() => onNavigate('timeline')}
                          className="text-left text-xs font-semibold text-primary flex items-center gap-1 hover:text-slate-grey transition-colors w-fit cursor-pointer"
                        >
                          <span>View Itinerary</span>
                          <span className="material-symbols-outlined text-sm">chevron_right</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div> : <div className="rounded-xl border border-border-subtle bg-surface p-6 text-sm text-slate-grey">Past trips will appear here after you complete your first journey.</div>}
              </div>
            </div>
          )}

          {activeTab === 'trips' && (
            <div className="space-y-4">
              <h3 className="font-serif text-xl font-medium text-primary mb-2">Trip Vault</h3>
              <p className="text-sm text-slate-grey mb-4">
                All itineraries generated and archived by your Concierge AI.
              </p>
              <div className="space-y-3">
                {[
                  ...(tripOverview.destination ? [{ title: tripOverview.title, dates: `${tripOverview.durationDays} days · ${tripOverview.destination}`, badge: 'Current' }] : []),
                  ...pastTrips.map((trip) => ({ title: trip.title, dates: trip.datesOrYear, badge: trip.status })),
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-lg bg-surface border border-border-subtle flex items-center justify-between"
                  >
                    <div>
                      <h4 className="font-serif text-base font-semibold text-primary">
                        {item.title}
                      </h4>
                      <p className="text-xs text-slate-grey">{item.dates}</p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-surface-container-low text-slate-grey border border-border-subtle">
                      {item.badge}
                    </span>
                  </div>
                ))}
                {!tripOverview.destination && pastTrips.length === 0 && <p className="rounded-xl border border-border-subtle bg-surface p-6 text-sm text-slate-grey">Your trip vault is empty. Plan a trip to get started.</p>}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h3 className="font-serif text-xl font-medium text-primary">Account Preferences</h3>
              <div className="bg-surface p-6 rounded-xl border border-border-subtle space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-grey uppercase tracking-wider mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(event) => setProfileName(event.target.value)}
                    maxLength={100}
                    className="w-full border-b border-border-subtle bg-transparent py-2 text-sm text-primary focus:outline-none focus:border-black"
                  />
                </div>
                {user.email && <div>
                  <label className="block text-xs font-semibold text-slate-grey uppercase tracking-wider mb-1">Account email</label>
                  <input type="email" value={user.email} readOnly className="w-full border-b border-border-subtle bg-transparent py-2 text-sm text-slate-grey focus:outline-none" />
                </div>}
                <div>
                  <label className="block text-xs font-semibold text-slate-grey uppercase tracking-wider mb-1">Phone number</label>
                  <input type="tel" value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} maxLength={32} className="w-full border-b border-border-subtle bg-transparent py-2 text-sm text-primary focus:outline-none focus:border-black" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <label className="block text-xs font-semibold text-slate-grey uppercase tracking-wider mb-1">Home city<input value={homeCity} onChange={(event) => setHomeCity(event.target.value)} maxLength={100} className="mt-1 w-full border-b border-border-subtle bg-transparent py-2 text-sm text-primary focus:outline-none focus:border-black" /></label>
                  <label className="block text-xs font-semibold text-slate-grey uppercase tracking-wider mb-1">Country<input value={countryOfResidence} onChange={(event) => setCountryOfResidence(event.target.value)} maxLength={100} className="mt-1 w-full border-b border-border-subtle bg-transparent py-2 text-sm text-primary focus:outline-none focus:border-black" /></label>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-grey uppercase tracking-wider mb-1">
                    Default Currency
                  </label>
                  <select className="w-full border-b border-border-subtle bg-transparent py-2 text-sm text-primary focus:outline-none focus:border-black">
                    <option>INR (₹)</option>
                  </select>
                </div>
                {profileError && <p role="alert" className="text-sm text-red-700">{profileError}</p>}
                {profileSaved && <p role="status" className="text-sm text-emerald-700">Profile saved to your account.</p>}
                <div className="pt-2">
                  <button type="button" onClick={() => void saveProfile()} disabled={isSavingProfile || !profileName.trim()} className="px-5 py-2.5 bg-primary text-on-primary text-xs font-semibold rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-60">
                    {isSavingProfile ? 'Saving…' : 'Update Profile'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Details Modal */}
      {currentItineraryModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-surface rounded-xl max-w-lg w-full p-6 border border-border-subtle shadow-2xl relative">
            <button
              onClick={() => setCurrentItineraryModal(false)}
              className="absolute top-4 right-4 text-slate-grey hover:text-primary"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <h3 className="font-serif text-2xl font-semibold text-primary mb-2">
              {tripOverview.title}
            </h3>
            <p className="text-xs text-emerald-muted font-bold uppercase tracking-wider mb-4">
              {tripOverview.destination} · {tripOverview.durationDays} days
            </p>
            <p className="text-sm text-slate-grey leading-relaxed mb-6">
              {tripOverview.summary}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setCurrentItineraryModal(false)}
                className="px-4 py-2 border border-border-subtle rounded-lg text-xs font-semibold text-primary"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setCurrentItineraryModal(false);
                  onNavigate('timeline');
                }}
                className="px-4 py-2 bg-primary text-on-primary rounded-lg text-xs font-semibold"
              >
                Switch to Itinerary
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
