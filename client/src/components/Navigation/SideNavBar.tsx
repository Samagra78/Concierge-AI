/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ScreenView, UserProfile } from '../../types.ts';

interface SideNavBarProps {
  currentScreen: ScreenView;
  onNavigate: (screen: ScreenView) => void;
  onNewTrip: () => void;
  onOpenChat?: () => void;
  onLogout: () => void;
  user: UserProfile;
}

export const SideNavBar: React.FC<SideNavBarProps> = ({
  currentScreen,
  onNavigate,
  onNewTrip,
  onOpenChat,
  onLogout,
  user,
}) => {
  const navItems = [
    { id: 'dashboard' as ScreenView, label: 'Dashboard', icon: 'dashboard' },
    { id: 'timeline' as ScreenView, label: 'Timeline', icon: 'timeline' },
    { id: 'traveler-dna' as ScreenView, label: 'Traveler DNA', icon: 'fingerprint' },
    { id: 'smart-discovery' as ScreenView, label: 'Smart Discovery', icon: 'explore' },
    { id: 'expense-tracker' as ScreenView, label: 'Expense Tracker', icon: 'payments' },
  ];

  return (
    <>
      {/* Desktop Fixed Left Navigation */}
      <nav
        aria-label="Main Navigation"
        className="hidden md:flex bg-background h-screen w-64 fixed left-0 top-0 border-r border-border-subtle flex-col py-8 px-6 z-50 select-none"
      >
        {/* Brand Header */}
        <div
          onClick={() => onNavigate('landing')}
          className="mb-10 cursor-pointer group"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onNavigate('landing')}
          aria-label="Go to Concierge home landing"
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary text-2xl group-hover:rotate-45 transition-transform duration-300">
              explore
            </span>
            <h1 className="font-serif text-2xl font-medium tracking-widest uppercase text-primary">
              Concierge
            </h1>
          </div>
          <p className="text-xs text-slate-grey tracking-wider font-medium">Premium Travel AI</p>
        </div>

        {/* Navigation Items */}
        <ul className="flex flex-col gap-2 flex-grow">
          {navItems.map((item) => {
            const isActive = currentScreen === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all duration-200 text-left ${
                    isActive
                      ? 'text-primary font-bold border-r-2 border-primary bg-surface-container-low shadow-xs'
                      : 'text-slate-grey font-medium hover:text-primary hover:bg-surface-container-low'
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-xl ${
                      isActive ? 'fill text-primary' : 'text-slate-grey'
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>

        {/* Bottom CTA & Profile */}
        <div className="mt-auto pt-6 border-t border-border-subtle flex flex-col gap-3">
          {onOpenChat && (
            <button
              onClick={onOpenChat}
              className="w-full bg-champagne text-primary text-xs font-bold py-2.5 px-4 rounded-lg hover:brightness-95 transition-all flex items-center justify-center gap-2 shadow-2xs cursor-pointer border border-secondary/20"
              aria-label="Open Concierge AI Chat"
            >
              <span className="material-symbols-outlined text-base text-primary">auto_awesome</span>
              <span>Concierge AI Chat</span>
            </button>
          )}

          <button
            onClick={onNewTrip}
            className="w-full bg-primary text-on-primary text-sm font-semibold py-2.5 px-4 rounded-lg hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            aria-label="Create new trip itinerary"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            <span>New Trip</span>
          </button>

          <div
            onClick={() => onNavigate('profile')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onNavigate('profile')}
            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
              currentScreen === 'profile'
                ? 'bg-surface-container-low border border-border-subtle'
                : 'hover:bg-surface-container-low'
            }`}
            aria-label="View user profile"
          >
            {user.avatarUrl ? <img src={user.avatarUrl} alt={user.name} className="w-10 h-10 rounded-full object-cover border border-border-subtle" /> : <span aria-hidden="true" className="w-10 h-10 rounded-full border border-border-subtle bg-surface-container-low text-slate-grey flex items-center justify-center font-semibold">{user.name.charAt(0).toUpperCase()}</span>}
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-primary truncate">{user.name}</span>
              <span className="text-xs text-slate-grey">Pro Member</span>
            </div>
          </div>

          <button type="button" onClick={onLogout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-grey transition-colors hover:bg-surface-container-low hover:text-primary" aria-label="Log out">
            <span className="material-symbols-outlined text-lg">logout</span>
            <span>Log out</span>
          </button>
        </div>
      </nav>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-border-subtle flex justify-around items-center py-2 px-1 z-50 shadow-lg"
      >
        {navItems.map((item) => {
          const isActive = currentScreen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center p-2 rounded-md ${
                isActive ? 'text-primary font-bold' : 'text-slate-grey hover:text-primary'
              }`}
            >
              <span
                className={`material-symbols-outlined text-xl ${
                  isActive ? 'fill' : ''
                }`}
              >
                {item.icon}
              </span>
              <span className="text-[10px] mt-0.5">
                {item.label === 'Expense Tracker' ? 'Expense' : item.label.replace('Traveler ', '')}
              </span>
            </button>
          );
        })}
        <button type="button" onClick={onLogout} className="flex flex-col items-center rounded-md p-2 text-slate-grey" aria-label="Log out">
          <span className="material-symbols-outlined text-xl">logout</span>
          <span className="mt-0.5 text-[10px]">Log out</span>
        </button>
      </nav>
    </>
  );
};
