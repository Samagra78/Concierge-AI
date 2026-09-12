/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { ScreenView, TravelerDNA, DiscoveredPlace, ExpenseItem, TripPage, UserProfile, ItineraryDay } from './types.ts';
import { initialDemoExpenses } from './data/mockData.ts';

import { SideNavBar } from './components/Navigation/SideNavBar.tsx';
import { LandingPage } from './components/Landing/LandingPage.tsx';
import { DashboardView } from './components/Dashboard/DashboardView.tsx';
import { TimelineView } from './components/Timeline/TimelineView.tsx';
import { TravelerDNAView } from './components/TravelerDNA/TravelerDNAView.tsx';
import { TravelerDNAWizard } from './components/Onboarding/TravelerDNAWizard.tsx';
import { ProfileView } from './components/Profile/ProfileView.tsx';
import { SmartDiscoveryView } from './components/Discovery/SmartDiscoveryView.tsx';
import { ExpenseTrackerView } from './components/Expense/ExpenseTrackerView.tsx';
import { AuthModal } from './components/Auth/AuthModal.tsx';
import { LocalErrandsModal } from './components/Errands/LocalErrandsModal.tsx';
import { ConciergeChatModal } from './components/Chat/ConciergeChatModal.tsx';
import { api } from './api/client.ts';

const emptyTripOverview = { title: 'No trip planned', destination: '', durationDays: 0, totalBudget: 0, allocatedBudget: 0, currency: 'INR', summary: 'Start planning your next journey.', tags: [] as string[] };
const emptyUserProfile: UserProfile = { name: 'Traveler', roleTitle: 'Traveler', avatarUrl: '', email: '', phoneNumber: '', homeCity: '', countryOfResidence: '', preferredCurrency: 'INR', timezone: '', tags: [], stats: { countriesVisited: 0, totalTrips: 0, memberSince: new Date().getFullYear() } };

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenView>('landing');
  const [currentDayNumber, setCurrentDayNumber] = useState<number>(1);
  const [travelerDNA, setTravelerDNA] = useState<TravelerDNA | null>(null);
  const [tripOverview, setTripOverview] = useState(emptyTripOverview);
  const [itineraryDays, setItineraryDays] = useState<ItineraryDay[]>([]);
  const [tripPages, setTripPages] = useState<TripPage[]>([]);
  const [activeTripId, setActiveTripId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState(emptyUserProfile);
  const [pastTrips, setPastTrips] = useState<any[]>([]);
  const [discoveredPlaces, setDiscoveredPlaces] = useState<DiscoveredPlace[]>([]);
  const [activeUser, setActiveUser] = useState<any>(null);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isErrandsOpen, setIsErrandsOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInitialPrompt, setChatInitialPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const activateAccount = (user: any, isNew = false) => {
    setActiveUser(user);
    const workspace = !isNew ? user.workspace : undefined;
    const profile = {
      ...(workspace?.userProfile || emptyUserProfile),
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber || '',
      homeCity: user.homeCity || '',
      countryOfResidence: user.countryOfResidence || '',
      preferredCurrency: user.preferredCurrency || 'INR',
      timezone: user.timezone || '',
      avatarUrl: '',
      roleTitle: user.role === 'admin' && workspace?.userProfile ? workspace.userProfile.roleTitle : 'Traveler',
      tags: workspace?.userProfile?.tags || [],
      stats: workspace?.userProfile?.stats || { countriesVisited: 0, totalTrips: (workspace?.pastTrips?.length || 0) + (Array.isArray(workspace?.tripPages) ? workspace.tripPages.filter((page: any) => page.status === 'active').length : (workspace?.tripOverview?.destination ? 1 : 0)), memberSince: user.createdAt ? new Date(user.createdAt).getFullYear() : new Date().getFullYear() },
    };
    setUserProfile(profile);
    setTravelerDNA((!isNew && user.preferences ? user.preferences : null) as TravelerDNA | null);
    setTripOverview(workspace?.tripOverview || { title: 'No trip planned', destination: '', durationDays: 0, totalBudget: 0, allocatedBudget: 0, currency: 'INR', summary: 'Start planning your next journey.', tags: [] });
    setItineraryDays(workspace?.itineraryDays || []);
    const activeOverview = workspace?.tripOverview;
    const activeDays = workspace?.itineraryDays || [];
    const savedPages = Array.isArray(workspace?.tripPages) ? workspace.tripPages as TripPage[] : [];
    const normalizedPages = savedPages.length ? savedPages : activeOverview?.destination ? [{ id: 'trip-legacy', tripOverview: activeOverview, itineraryDays: activeDays, status: 'active' as const, createdAt: new Date().toISOString() }] : [];
    const activeId = (typeof workspace?.activeTripId === 'string' && normalizedPages.some((page) => page.id === workspace.activeTripId && page.status === 'active'))
      ? workspace.activeTripId
      : normalizedPages.find((page) => page.status === 'active')?.id || null;
    setTripPages(normalizedPages);
    setActiveTripId(activeId);
    setPastTrips(workspace?.pastTrips || []);
    setDiscoveredPlaces(workspace?.discoveredPlaces || []);
    setExpenses(Array.isArray(workspace?.expenses) ? workspace.expenses : (user.role === 'admin' && workspace ? initialDemoExpenses : []));
    setCurrentScreen(user.onboardingCompleted ? 'dashboard' : 'wizard');
  };

  useEffect(() => {
    api.getMe().then(({ user }) => activateAccount(user)).catch(() => undefined);
  }, []);

  // Toggle activity lock status
  const handleToggleLock = async (dayNumber: number, activityId: string) => {
    const updatedDays = itineraryDays.map((day) => {
        if (day.dayNumber !== dayNumber) return day;
        return {
          ...day,
          items: day.items.map((item) => {
            if (item.type !== 'activity' || item.data.id !== activityId) return item;
            return {
              ...item,
              data: {
                ...item.data,
                isLocked: !item.data.isLocked,
              },
            };
          }),
        };
      });
    if (activeUser) {
      try { await api.saveWorkspace({ tripOverview, itineraryDays: updatedDays }); }
      catch (error) { console.warn('Could not save the timeline lock change:', error); return; }
    }
    setItineraryDays(updatedDays);
  };

  const handleRemoveSlot = async (dayNumber: number, activityId: string) => {
    const day = itineraryDays.find((candidate) => candidate.dayNumber === dayNumber);
    const index = day?.items.findIndex((item) => item.type === 'activity' && item.data.id === activityId) ?? -1;
    if (!day || index < 0) throw new Error('This timeline slot is no longer available.');
    const removed = day.items[index];
    if (removed.type !== 'activity') return;
    const removeIndexes = new Set([index]);
    if (index > 0 && day.items[index - 1].type === 'transit') removeIndexes.add(index - 1);
    const removedCost = Number((removed.data as any).costINR) || 0;
    const transitCost = index > 0 && day.items[index - 1].type === 'transit' ? Number((day.items[index - 1].data as any).costINR) || 0 : 0;
    const updatedDays = itineraryDays.map((currentDay) => currentDay.dayNumber === dayNumber
      ? { ...currentDay, items: currentDay.items.filter((_, itemIndex) => !removeIndexes.has(itemIndex)) }
      : currentDay);
    const updatedTrip = { ...tripOverview, allocatedBudget: Math.max(0, tripOverview.allocatedBudget - removedCost - transitCost) };
    if (activeUser) await api.saveWorkspace({ tripOverview: updatedTrip, itineraryDays: updatedDays });
    setItineraryDays(updatedDays);
    setTripOverview(updatedTrip);
  };

  const handleLogout = async () => {
    try { await api.logout(); } catch (error) { console.warn('Logout request could not reach the server:', error); }
    setActiveUser(null);
    setTravelerDNA(null);
    setTripOverview(emptyTripOverview);
    setItineraryDays([]);
    setTripPages([]);
    setActiveTripId(null);
    setPastTrips([]);
    setDiscoveredPlaces([]);
    setExpenses([]);
    setUserProfile(emptyUserProfile);
    setCurrentDayNumber(1);
    setIsChatOpen(false);
    setIsErrandsOpen(false);
    setIsAuthOpen(false);
    setCurrentScreen('landing');
  };

  const blankTrip = () => ({ title: 'New trip', destination: '', durationDays: 0, totalBudget: 0, allocatedBudget: 0, currency: 'INR', summary: 'Start planning your next journey.', tags: [] as string[] });
  const createTripId = () => `trip-${globalThis.crypto?.randomUUID?.() || Date.now()}`;
  const currentTripPage = (status: TripPage['status'] = 'active'): TripPage | null => {
    if (!activeTripId && !tripOverview.destination && !itineraryDays.length) return null;
    return { id: activeTripId || createTripId(), tripOverview, itineraryDays, status, createdAt: tripPages.find((page) => page.id === activeTripId)?.createdAt || new Date().toISOString() };
  };

  const handleStartNewTrip = async () => {
    const current = currentTripPage();
    const id = createTripId();
    const nextOverview = blankTrip();
    const nextPage: TripPage = { id, tripOverview: nextOverview, itineraryDays: [], status: 'active', createdAt: new Date().toISOString() };
    const updatedPages = [...tripPages.filter((page) => page.id !== current?.id), ...(current ? [current] : []), nextPage];
    if (activeUser) await api.saveWorkspace({ tripOverview: nextOverview, itineraryDays: [], tripPages: updatedPages, activeTripId: id, pastTrips });
    setTripPages(updatedPages);
    setActiveTripId(id);
    setUserProfile((profile) => ({ ...profile, stats: { ...profile.stats, totalTrips: Math.max(profile.stats.totalTrips, updatedPages.filter((page) => page.status === 'active').length + pastTrips.length) } }));
    setTripOverview(nextOverview);
    setItineraryDays([]);
    setCurrentDayNumber(1);
    setCurrentScreen('wizard');
  };

  const handleSelectTrip = async (tripId: string) => {
    if (tripId === activeTripId) return;
    const destinationPage = tripPages.find((page) => page.id === tripId && page.status === 'active');
    if (!destinationPage) return;
    const current = currentTripPage();
    const updatedPages = [...tripPages.filter((page) => page.id !== current?.id && page.id !== tripId), ...(current ? [current] : []), destinationPage];
    if (activeUser) await api.saveWorkspace({ tripOverview: destinationPage.tripOverview, itineraryDays: destinationPage.itineraryDays, tripPages: updatedPages, activeTripId: tripId, pastTrips });
    setTripPages(updatedPages);
    setActiveTripId(tripId);
    setTripOverview(destinationPage.tripOverview);
    setItineraryDays(destinationPage.itineraryDays);
    setCurrentDayNumber(destinationPage.itineraryDays[0]?.dayNumber || 1);
  };

  const handleCompleteTrip = async () => {
    const current = currentTripPage();
    if (!current || !current.itineraryDays.length) throw new Error('Generate an itinerary before completing this trip.');
    const completedAt = new Date().toISOString();
    const completedPage: TripPage = { ...current, status: 'completed', completedAt };
    const updatedPages = [...tripPages.filter((page) => page.id !== current.id), completedPage];
    const nextPage = [...updatedPages].reverse().find((page) => page.status === 'active');
    const nextOverview = nextPage?.tripOverview || blankTrip();
    const nextDays = nextPage?.itineraryDays || [];
    const updatedPastTrips = [{ id: current.id, title: current.tripOverview.title || `${current.tripOverview.destination} Trip`, datesOrYear: new Date(completedAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }), duration: `${current.tripOverview.durationDays} days`, focus: current.tripOverview.tags.join(' · ') || current.tripOverview.destination, imageUrl: '', status: 'Completed' as const }, ...pastTrips.filter((trip) => trip.id !== current.id)];
    if (activeUser) await api.saveWorkspace({ tripOverview: nextOverview, itineraryDays: nextDays, tripPages: updatedPages, activeTripId: nextPage?.id || null, pastTrips: updatedPastTrips });
    setTripPages(updatedPages);
    setActiveTripId(nextPage?.id || null);
    setTripOverview(nextOverview);
    setItineraryDays(nextDays);
    setPastTrips(updatedPastTrips);
    setCurrentDayNumber(nextDays[0]?.dayNumber || 1);
    setCurrentScreen(nextPage ? 'timeline' : 'dashboard');
  };

  const handleAddTimelineDay = async () => {
    const nextDayNumber = Math.max(0, ...itineraryDays.map((day) => day.dayNumber)) + 1;
    const addedDay: ItineraryDay = {
      dayNumber: nextDayNumber,
      date: `Day ${nextDayNumber}`,
      title: tripOverview.destination ? `Explore ${tripOverview.destination}` : `Day ${nextDayNumber}`,
      theme: 'Flexible day',
      items: [],
    };
    const updatedDays = [...itineraryDays, addedDay];
    const updatedTrip = { ...tripOverview, durationDays: Math.max(tripOverview.durationDays, nextDayNumber) };
    const pageId = activeTripId || createTripId();
    const updatedPages = [
      ...tripPages.filter((page) => page.id !== pageId),
      { id: pageId, tripOverview: updatedTrip, itineraryDays: updatedDays, status: 'active' as const, createdAt: tripPages.find((page) => page.id === pageId)?.createdAt || new Date().toISOString() },
    ];
    if (activeUser) await api.saveWorkspace({ tripOverview: updatedTrip, itineraryDays: updatedDays, tripPages: updatedPages, activeTripId: pageId, pastTrips });
    setTripOverview(updatedTrip);
    setItineraryDays(updatedDays);
    setTripPages(updatedPages);
    setActiveTripId(pageId);
    setCurrentDayNumber(nextDayNumber);
  };

  const handleUpdateTripBudget = async (totalBudget: number) => {
    if (!Number.isFinite(totalBudget) || totalBudget <= 0) throw new Error('Enter a trip budget greater than ₹0.');
    const updatedTrip = { ...tripOverview, totalBudget, currency: 'INR' };
    const updatedPages = tripPages.map((page) => page.id === activeTripId ? { ...page, tripOverview: updatedTrip, itineraryDays } : page);
    if (activeUser) await api.saveWorkspace({ tripOverview: updatedTrip, itineraryDays, tripPages: updatedPages, activeTripId, pastTrips, expenses });
    setTripOverview(updatedTrip);
    setTripPages(updatedPages);
  };

  const handleAddExpense = async (expense: ExpenseItem) => {
    const updatedExpenses = [expense, ...expenses];
    if (activeUser) await api.saveWorkspace({ tripOverview, itineraryDays, expenses: updatedExpenses });
    setExpenses(updatedExpenses);
  };

  const handleUpdateExpense = async (expense: ExpenseItem) => {
    const updatedExpenses = expenses.map((current) => current.id === expense.id ? expense : current);
    if (activeUser) await api.saveWorkspace({ tripOverview, itineraryDays, expenses: updatedExpenses });
    setExpenses(updatedExpenses);
  };

  const handleRemoveExpense = async (expenseId: string) => {
    const updatedExpenses = expenses.filter((expense) => expense.id !== expenseId);
    if (activeUser) await api.saveWorkspace({ tripOverview, itineraryDays, expenses: updatedExpenses });
    setExpenses(updatedExpenses);
  };

  const handlePurchaseLogged = (purchase: ExpenseItem) => {
    setExpenses((current) => [purchase, ...current.filter((expense) => expense.id !== purchase.id)]);
  };

  const handleSaveProfile = async (updated: Pick<UserProfile, 'name' | 'phoneNumber' | 'homeCity' | 'countryOfResidence' | 'preferredCurrency'>) => {
    const result = await api.saveProfile(updated);
    setActiveUser(result.user);
    setUserProfile((current) => ({ ...current, ...updated }));
  };

  // Ask Gemini for a grounded replacement and persist it into the user's trip.
  const handleReplanSlot = async (dayNumber: number, activityId: string, request = '') => {
    const day = itineraryDays.find((candidate) => candidate.dayNumber === dayNumber);
    const slot = day?.items.find((item) => item.type === 'activity' && item.data.id === activityId);
    if (!day || !slot || slot.type !== 'activity') throw new Error('This timeline slot is no longer available.');
    const previousCost = Number((slot.data as any).costINR) || 0;
    const result = await api.replanItinerarySlot({
      destination: tripOverview.destination,
      day: { dayNumber: day.dayNumber, title: day.title, theme: day.theme },
      activity: slot.data,
      request,
      dna: travelerDNA,
      remainingBudget: Math.max(0, tripOverview.totalBudget - tripOverview.allocatedBudget + previousCost),
    });
    const updatedDays = itineraryDays.map((currentDay) => currentDay.dayNumber !== dayNumber ? currentDay : ({
      ...currentDay,
      items: currentDay.items.map((item) => item.type === 'activity' && item.data.id === activityId
        ? { ...item, data: result.activity }
        : item),
    }));
    const allocatedBudget = Math.max(0, tripOverview.allocatedBudget - previousCost + (Number(result.activity.costINR) || 0));
    const updatedTrip = { ...tripOverview, allocatedBudget };
    if (activeUser) await api.saveWorkspace({ tripOverview: updatedTrip, itineraryDays: updatedDays });
    setItineraryDays(updatedDays);
    setTripOverview(updatedTrip);
  };

  // Trigger AI generation / itinerary refresh using server-side Gemini API with Google Maps grounding
  const handleRefreshItinerary = async () => {
    setIsGenerating(true);
    try {
      const res = await api.generateItinerary({
        destination: tripOverview.destination,
        durationDays: tripOverview.durationDays,
        totalBudget: tripOverview.totalBudget,
        dna: travelerDNA,
        prompt: 'Curate a luxury itinerary tailored to Traveler DNA with Google Maps place validation',
      });

      if (res.days && res.days.length > 0) {
        const updatedTrip = {
          ...tripOverview,
          summary: res.summary || tripOverview.summary,
          allocatedBudget: res.allocatedBudget || tripOverview.allocatedBudget,
          tags: res.tags || tripOverview.tags,
        };
        if (activeUser) await api.saveWorkspace({ tripOverview: updatedTrip, itineraryDays: res.days, tripPages, activeTripId, pastTrips });
        setItineraryDays(res.days);
        setTripOverview(updatedTrip);
      }
    } catch (err) {
      console.warn('Live itinerary generation notice:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle prompt input from Dashboard top bar
  const handleSearchPrompt = (query: string) => {
    const q = query.toLowerCase();
    if (
      q.includes('iron') ||
      q.includes('laundry') ||
      q.includes('errand') ||
      q.includes('press') ||
      q.includes('repair') ||
      q.includes('valet')
    ) {
      setIsErrandsOpen(true);
    } else {
      setChatInitialPrompt(query);
      setIsChatOpen(true);
    }
  };

  const handleGenerateChatItinerary = async (request: string, previousPlan?: any) => {
    const constraintText = previousPlan && request.includes('Apply this change:') ? request.split('Apply this change:').pop() || request : request;
    const durationWords: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14 };
    const durationMatch = constraintText.match(/\b(\d{1,2}|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen)\s*[- ]?days?\b/i);
    const parsedDuration = durationMatch ? Number(durationMatch[1]) || durationWords[durationMatch[1].toLowerCase()] : undefined;
    const budgetMatch = constraintText.match(/(?:budget(?:\s+of)?\s*(?:₹|INR)?\s*|under\s*(?:₹|INR)?\s*)([\d,]+)/i);
    const destinationMatch = constraintText.match(/\b(?:to|in|around)\s+([\p{L}][\p{L}'-]*(?:\s+[\p{L}][\p{L}'-]*){0,2})/iu);
    const labeledDestination = constraintText.match(/\bdestination\s*:\s*([\p{L}][\p{L}'-]*(?:\s+[\p{L}][\p{L}'-]*){0,2})/iu);
    const destination = labeledDestination?.[1]?.trim() || destinationMatch?.[1]?.trim() || previousPlan?.destination || tripOverview.destination;
    if (!destination) throw new Error('Which destination should I plan for? Include a city or region, for example “a 4-day trip to Kyoto.”');
    const durationDays = parsedDuration || previousPlan?.durationDays || (tripOverview.destination ? tripOverview.durationDays : 3);
    const sameDestination = destination.toLowerCase() === tripOverview.destination.toLowerCase();
    const totalBudget = (budgetMatch ? Number(budgetMatch[1].replace(/,/g, '')) : undefined)
      || previousPlan?.totalBudget
      || (sameDestination ? tripOverview.totalBudget : undefined)
      || (travelerDNA?.budgetPerDay || 25000) * durationDays;
    return api.generateItinerary({ destination, durationDays, totalBudget, dna: travelerDNA, prompt: request });
  };

  const handleConfirmChatItinerary = async (proposal: any) => {
    const nextTrip = {
      title: `${proposal.destination} ${proposal.durationDays}-Day Itinerary`,
      destination: proposal.destination,
      durationDays: proposal.durationDays,
      totalBudget: proposal.totalBudget,
      allocatedBudget: proposal.allocatedBudget,
      currency: 'INR',
      summary: proposal.summary,
      tags: proposal.tags || [],
    };
    const current = currentTripPage();
    const existingPage = current && current.tripOverview.title === 'New trip' && !current.itineraryDays.length;
    const pageId = existingPage ? current!.id : createTripId();
    const newPage: TripPage = { id: pageId, tripOverview: nextTrip, itineraryDays: proposal.days, status: 'active', createdAt: existingPage ? current!.createdAt : new Date().toISOString() };
    const updatedPages = [...tripPages.filter((page) => page.id !== pageId && page.id !== current?.id), ...(current && !existingPage ? [current] : []), newPage];
    if (activeUser) {
      await api.saveWorkspace({ tripOverview: nextTrip, itineraryDays: proposal.days, tripPages: updatedPages, activeTripId: pageId, pastTrips });
      setActiveUser((user: any) => ({ ...user, workspace: { ...user?.workspace, tripOverview: nextTrip, itineraryDays: proposal.days, tripPages: updatedPages, activeTripId: pageId } }));
    }
    setTripPages(updatedPages);
    setActiveTripId(pageId);
    setTripOverview(nextTrip);
    setItineraryDays(proposal.days);
    setCurrentDayNumber(1);
    setCurrentScreen('timeline');
    setIsChatOpen(false);
  };

  // Add a Geoapify result at the day and time selected by the traveler.
  const handleAddToItinerary = async (place: DiscoveredPlace, requestedDayNumber: number, requestedTime: string) => {
    const targetDayNumber = requestedDayNumber;
    const targetDay = itineraryDays.find((day) => day.dayNumber === targetDayNumber);
    const activity = {
      id: `discovery-${Date.now()}`,
      time: requestedTime,
      title: place.name,
      category: place.category as any,
      description: place.description,
      duration: '1.5 hrs',
      cost: place.priceLevel,
      costINR: place.estimatedCostINR || 0,
      imageUrl: place.imageUrl,
      isLocked: false,
      ...(place.lat && place.lon ? { coordinates: { lat: place.lat, lng: place.lon } } : {}),
    };
    const requestedMinutes = (value: string) => {
      const match = value.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
      if (!match) return Number.POSITIVE_INFINITY;
      const hour = Number(match[1]) % 12 + (match[3].toUpperCase() === 'PM' ? 12 : 0);
      return hour * 60 + Number(match[2]);
    };
    const updatedDays = targetDay
      ? itineraryDays.map((day) => {
        if (day.dayNumber !== targetDayNumber) return day;
        const items = [...day.items];
        const insertAt = items.findIndex((item) => item.type === 'activity' && requestedMinutes(item.data.time) > requestedMinutes(requestedTime));
        items.splice(insertAt < 0 ? items.length : insertAt, 0, { type: 'activity' as const, data: activity });
        return { ...day, items };
      })
      : [{ dayNumber: 1, date: 'Day 1', title: `Discover ${place.destination || 'your destination'}`, theme: 'Personal discovery', items: [{ type: 'activity' as const, data: activity }] }];
    const destination = tripOverview.destination || place.destination || place.neighborhood;
    const durationDays = tripOverview.destination ? tripOverview.durationDays : 1;
    const totalBudget = tripOverview.destination ? tripOverview.totalBudget : (travelerDNA?.budgetPerDay || 25000);
    const updatedTrip = {
      ...tripOverview,
      title: tripOverview.destination ? tripOverview.title : `${destination} Discovery Trip`,
      destination,
      durationDays,
      totalBudget,
      allocatedBudget: tripOverview.allocatedBudget + (place.estimatedCostINR || 0),
      currency: 'INR',
      summary: tripOverview.destination ? tripOverview.summary : 'A trip started from your Geoapify place discovery.',
      tags: tripOverview.destination ? tripOverview.tags : ['Geoapify Discovery'],
    };
    if (activeUser) await api.saveWorkspace({ tripOverview: updatedTrip, itineraryDays: updatedDays });
    setItineraryDays(updatedDays);
    setTripOverview(updatedTrip);
    setCurrentDayNumber(targetDayNumber);
  };

  return (
    <div className="min-h-screen bg-background text-on-surface font-body selection:bg-champagne selection:text-primary">
      {/* If Landing Page is active, render full-bleed landing */}
      {currentScreen === 'landing' ? (
        <LandingPage
          onStartPlanning={() => setIsAuthOpen(true)}
          onSeeSample={() => {
            setCurrentScreen('timeline');
            setCurrentDayNumber(3);
          }}
          onOpenAuth={() => setIsAuthOpen(true)}
          onNavigate={setCurrentScreen}
        />
      ) : currentScreen === 'wizard' ? (
        <TravelerDNAWizard
          onComplete={async (preferences) => {
            const result = await api.savePreferences(preferences);
            setActiveUser(result.user);
            setTravelerDNA(preferences);
            const updatedTrip = tripOverview.title === 'No trip planned' ? tripOverview : { ...tripOverview, totalBudget: preferences.budgetPerDay * tripOverview.durationDays };
            if (activeUser) await api.saveWorkspace({ tripOverview: updatedTrip, itineraryDays, tripPages, activeTripId, pastTrips, expenses });
            setTripOverview(updatedTrip);
            setCurrentScreen('dashboard');
          }}
          onNavigate={setCurrentScreen}
        />
      ) : (
        /* In-App Shell with Fixed Left Navigation */
        <div className="flex min-h-screen">
          <SideNavBar
            currentScreen={currentScreen}
            onNavigate={setCurrentScreen}
            onNewTrip={() => void handleStartNewTrip()}
            onOpenChat={() => {
              setChatInitialPrompt('');
              setIsChatOpen(true);
            }}
            onLogout={handleLogout}
            user={userProfile}
          />

          {/* Main Content Area (Offset by 64px on mobile or 256px on desktop) */}
          <main className="flex-1 md:ml-64 flex flex-col min-h-screen overflow-x-hidden">
            {currentScreen === 'dashboard' && (
              <DashboardView
                tripOverview={tripOverview}
                itineraryDays={itineraryDays}
                currentDayNumber={currentDayNumber}
                onSelectDay={setCurrentDayNumber}
                onRefreshItinerary={handleRefreshItinerary}
                onNavigate={setCurrentScreen}
                onSearchPrompt={handleSearchPrompt}
                isGenerating={isGenerating}
              />
            )}

            {currentScreen === 'timeline' && (
              <TimelineView
                days={itineraryDays}
                trips={tripPages.filter((page) => page.status === 'active').map((page) => page.id === activeTripId ? { ...page, tripOverview, itineraryDays } : page)}
                activeTripId={activeTripId}
                onSelectTrip={(tripId) => void handleSelectTrip(tripId)}
                onCompleteTrip={handleCompleteTrip}
                onAddDay={handleAddTimelineDay}
                currentDayNumber={currentDayNumber}
                onSelectDay={setCurrentDayNumber}
                onToggleLock={handleToggleLock}
                onRemoveSlot={handleRemoveSlot}
                onReplanSlot={handleReplanSlot}
                onNavigate={setCurrentScreen}
                destination={tripOverview.destination}
              />
            )}

            {currentScreen === 'traveler-dna' && travelerDNA && (
              <TravelerDNAView
                dna={travelerDNA!}
                onSaveDNA={async (updated) => {
                  const result = await api.savePreferences(updated);
                  setActiveUser(result.user);
                  setTravelerDNA(updated);
                  const updatedTrip = { ...tripOverview, totalBudget: updated.budgetPerDay * Math.max(1, tripOverview.durationDays || 7) };
                  if (activeUser) await api.saveWorkspace({ tripOverview: updatedTrip, itineraryDays, tripPages, activeTripId, pastTrips, expenses });
                  setTripOverview(updatedTrip);
                }}
              />
            )}

            {currentScreen === 'smart-discovery' && (
              <SmartDiscoveryView
                places={discoveredPlaces}
                destination={tripOverview.destination}
                dna={travelerDNA}
                budgetPerDay={travelerDNA?.budgetPerDay || Math.round((tripOverview.totalBudget || 25000) / Math.max(1, tripOverview.durationDays || 1))}
                totalBudget={tripOverview.totalBudget}
                remainingBudget={tripOverview.totalBudget > 0 ? Math.max(0, tripOverview.totalBudget - tripOverview.allocatedBudget) : (travelerDNA?.budgetPerDay || 25000)}
                durationDays={tripOverview.durationDays || 1}
                days={itineraryDays}
                currentDayNumber={currentDayNumber}
                onAddToItinerary={handleAddToItinerary}
              />
            )}

            {currentScreen === 'expense-tracker' && (
              <ExpenseTrackerView
                tripOverview={tripOverview}
                expenses={expenses}
                onAddExpense={handleAddExpense}
                onUpdateExpense={handleUpdateExpense}
                onRemoveExpense={handleRemoveExpense}
                onUpdateBudget={handleUpdateTripBudget}
                onOpenErrandsModal={() => setIsErrandsOpen(true)}
              />
            )}

            {currentScreen === 'profile' && (
              <ProfileView
                user={userProfile}
                tripOverview={tripOverview}
                pastTrips={pastTrips}
                onNavigate={setCurrentScreen}
                onSaveProfile={handleSaveProfile}
              />
            )}
          </main>
        </div>
      )}

      {/* Floating Concierge AI Assistant Launcher */}
      {currentScreen !== 'landing' && (
        <button
          onClick={() => {
            setChatInitialPrompt('');
            setIsChatOpen(true);
          }}
          className="fixed bottom-6 right-6 z-40 bg-primary text-on-primary hover:bg-neutral-800 transition-all px-4 py-3 rounded-full shadow-2xl flex items-center gap-2 border border-secondary/40 cursor-pointer group hover:scale-105"
          title="Open Concierge AI Chat (Google Maps & Search Grounded)"
          aria-label="Open Concierge AI Chat"
        >
          <span className="material-symbols-outlined text-xl text-champagne group-hover:rotate-12 transition-transform">
            auto_awesome
          </span>
          <span className="text-xs font-bold tracking-wide">Concierge AI</span>
          <span className="w-2 h-2 rounded-full bg-emerald-muted animate-pulse" />
        </button>
      )}

      {/* Global Modals */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(user, isNew) => activateAccount(user, isNew)}
      />

      <LocalErrandsModal
        isOpen={isErrandsOpen}
        onClose={() => setIsErrandsOpen(false)}
        onPurchaseLogged={handlePurchaseLogged}
      />

      <ConciergeChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        initialPrompt={chatInitialPrompt}
        onOpenErrands={() => setIsErrandsOpen(true)}
        onGenerateItinerary={handleGenerateChatItinerary}
        onConfirmItinerary={handleConfirmChatItinerary}
      />
    </div>
  );
}
