/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ScreenView } from '../../types.ts';

interface LandingPageProps {
  onStartPlanning: () => void;
  onSeeSample: () => void;
  onOpenAuth: () => void;
  onNavigate: (screen: ScreenView) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartPlanning,
  onSeeSample,
  onOpenAuth,
  onNavigate,
}) => {
  return (
    <div className="min-h-screen bg-background text-on-background selection:bg-champagne selection:text-primary flex flex-col">
      {/* Sticky Top Nav */}
      <nav
        id="main-nav"
        className="fixed top-0 left-0 w-full z-50 bg-background/90 backdrop-blur-md border-b border-border-subtle transition-all duration-300"
      >
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-2 cursor-pointer"
            role="button"
            tabIndex={0}
          >
            <span
              className="material-symbols-outlined text-primary text-2xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              explore
            </span>
            <span className="font-serif text-2xl font-semibold tracking-widest uppercase text-primary">
              Concierge
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a
              href="#how-it-works"
              className="text-xs font-semibold text-slate-grey hover:text-primary transition-colors tracking-wide"
            >
              How it Works
            </a>
            <a
              href="#features"
              className="text-xs font-semibold text-slate-grey hover:text-primary transition-colors tracking-wide"
            >
              Features
            </a>
            <button
              onClick={onOpenAuth}
              className="text-xs font-semibold text-primary hover:text-slate-grey transition-colors tracking-wide cursor-pointer"
            >
              Sign In
            </button>
            <button
              onClick={onStartPlanning}
              className="bg-primary text-on-primary px-6 py-2.5 rounded-lg text-xs font-semibold hover:bg-neutral-800 transition-colors cursor-pointer shadow-xs"
            >
              Start Planning
            </button>
          </div>

          <div className="flex md:hidden items-center gap-3">
            <button
              onClick={onStartPlanning}
              className="bg-primary text-on-primary px-3.5 py-1.5 rounded-md text-xs font-semibold"
            >
              Start
            </button>
            <button
              onClick={onOpenAuth}
              className="text-primary p-1"
              aria-label="Open sign-in modal"
            >
              <span className="material-symbols-outlined">account_circle</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-36 md:pt-44 pb-20 px-6 relative overflow-hidden flex items-center min-h-[85vh]">
        <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          <div className="lg:col-span-7 flex flex-col gap-6">
            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-semibold text-primary leading-[1.15] tracking-tight">
              Your next trip, planned like it was designed by someone who actually knows you.
            </h1>
            <p className="text-slate-grey text-base sm:text-lg max-w-xl leading-relaxed">
              Experience the perfect blend of artificial intelligence and curated luxury. We craft
              bespoke itineraries that match your Traveler DNA, handling the logistics so you can
              focus on the journey.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mt-2">
              <button
                onClick={onStartPlanning}
                className="inline-flex items-center justify-center bg-primary text-on-primary px-8 py-4 rounded-lg text-sm font-semibold hover:bg-neutral-800 transition-all shadow-md cursor-pointer"
              >
                Start Planning Free
              </button>
              <button
                onClick={onSeeSample}
                className="inline-flex items-center justify-center bg-transparent text-[#d0643d] border border-[#d0643d] px-8 py-4 rounded-lg text-sm font-semibold hover:bg-[#d0643d] hover:text-white transition-all cursor-pointer"
              >
                See a Sample Itinerary
              </button>
            </div>

            {/* Traveler Reviews & Social Proof */}
            <div className="flex items-center gap-4 mt-6 pt-6 border-t border-border-subtle">
              <div className="flex -space-x-3">
                <img
                  className="w-10 h-10 rounded-full border-2 border-surface object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuD2qMXF1dd3gj_C4YIvZ9Z8GeXJmKMKhNHCCf5wTr-ryJ_NTNyXt4uCiyG5llD5tzai-HfshhSJGalnHc_CsB5UvHfZl30tUwP2l3m3LRj413UNkcu6iD2IflipIHIVelobTNBtVpdViAFOVim_BimwOheAyS7ikGWCsBaGBTzXLnZ4jRXvmuoDUxMe9eTDxgA5r9dIcInCit2nTTj8Ujw9E-H1YVD-lZG9orTRJanD8dy7GjJbmH-l-g"
                  alt="Reviewer 1"
                />
                <img
                  className="w-10 h-10 rounded-full border-2 border-surface object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCqo-rTLA7ahTcBMKnVcW9RwfWbkSXkGWhfFdKanPi1Sy5CbH_yG6bv8A1O4GlEJj_cJN8VK_LPz0eNTlxP3Sw1kzDEFqFOKtOQLmQIu-WoqAwbt5dmrvwAyBuhcxvSdOf746bnX6NggUk8lmAFUVIQ2NDWYu0QNvsKIsgdc_9d7o_6LdLghXHpLqpdtHrBhrytufekTFzs573de0v75QaJRbngguo6wbSkoSYH707J-UtGIIiu_DLAWA"
                  alt="Reviewer 2"
                />
                <img
                  className="w-10 h-10 rounded-full border-2 border-surface object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuD1CPhvB8aI7AiEAUmLO2D3u9O4hd7Fa4lSnOa583oJSpGzph2SJ92PWMCXfk04Mc6ovGdXbNMsTFHa_opBqCfeq-Aqtdz1Oa4amzWrjzwku8cPlOKAwX2dFUtc9ihWoPNLcr6aF1LFggPr-F6sBN73Ut85MReYGBFRHBxN3M10Szi3U2-OfxwmEEJj6OgwOLK5Wb2tYiQlZXihGgX1yEKIp0851MKwrT65shmIYXhwYvKp_t1btIOJYw"
                  alt="Reviewer 3"
                />
              </div>
              <div className="text-xs text-slate-grey font-medium">
                <span className="text-primary font-bold">4.9/5</span> from over 10,000 discerning
                travelers
              </div>
            </div>
          </div>

          {/* Right Hero Image Card with Champagne Tilt */}
          <div className="lg:col-span-5 relative hidden lg:block h-[560px] w-full">
            <div className="absolute inset-0 bg-champagne rounded-2xl transform rotate-3 scale-105 opacity-60" />
            <img
              className="absolute inset-0 w-full h-full object-cover rounded-2xl shadow-xl z-10 border border-border-subtle"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBpHFCvawS7yD0szvoXS09el6eBAPXULK5u5kZ_7mcEdhVyoqGp7z5b5dOGVOV3FtavLdQjlhftH-eNTA_8g2NqsDiVbfuo5ZEwXJTDyGu1qdNJa_NPGthoQqpVMYPEe6rVFUf_6jWRnP9dNfjHqSC5SX_LnM7mK8quUNTlhZitr33xsb5JNniEGeFqIV6Erc2pM_AdamLv0XSDqX6IGTlAG3IuusOwOKahXJm77OLADA9PUSecTWrWvA"
              alt="Luxury Amalfi Coast"
            />
          </div>
        </div>
      </section>

      {/* Value Prop Grid */}
      <section className="py-20 px-6 bg-surface border-t border-border-subtle" id="features">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="font-serif text-3xl md:text-4xl font-semibold text-primary mb-4">
              Designed for the discerning traveler.
            </h2>
            <p className="text-slate-grey text-base">
              We don't just book flights; we curate experiences based on exactly what makes you
              tick.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1 */}
            <div className="bg-surface p-8 rounded-xl border border-border-subtle whisper-shadow flex flex-col h-full group hover:border-primary transition-colors">
              <div className="w-12 h-12 bg-surface-container-low rounded-lg flex items-center justify-center mb-6 text-primary">
                <span className="material-symbols-outlined text-2xl">fingerprint</span>
              </div>
              <h3 className="font-serif text-2xl font-medium text-primary mb-3">Traveler DNA</h3>
              <p className="text-slate-grey text-sm md:text-base leading-relaxed mb-6 flex-grow">
                We build a comprehensive profile of your preferences—from your ideal morning coffee
                spot to your preferred pace of travel—ensuring every recommendation feels
                instinctively right.
              </p>
              <div className="flex gap-2 flex-wrap mt-auto">
                <span className="bg-champagne text-primary px-3 py-1 rounded-full text-xs font-semibold">
                  Foodie
                </span>
                <span className="bg-champagne text-primary px-3 py-1 rounded-full text-xs font-semibold">
                  Boutique Stays
                </span>
                <span className="bg-champagne text-primary px-3 py-1 rounded-full text-xs font-semibold">
                  Relaxed Pace
                </span>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-surface p-8 rounded-xl border border-border-subtle whisper-shadow flex flex-col h-full group hover:border-primary transition-colors">
              <div className="w-12 h-12 bg-surface-container-low rounded-lg flex items-center justify-center mb-6 text-primary">
                <span className="material-symbols-outlined text-2xl">explore</span>
              </div>
              <h3 className="font-serif text-2xl font-medium text-primary mb-3">Smart Discovery</h3>
              <p className="text-slate-grey text-sm md:text-base leading-relaxed flex-grow">
                Bypass the tourist traps. Our AI analyzes local trends, editorial reviews, and hidden
                gems to suggest venues and activities that align perfectly with your taste.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-surface p-8 rounded-xl border border-border-subtle whisper-shadow flex flex-col h-full group hover:border-primary transition-colors">
              <div className="w-12 h-12 bg-surface-container-low rounded-lg flex items-center justify-center mb-6 text-primary">
                <span className="material-symbols-outlined text-2xl">umbrella</span>
              </div>
              <h3 className="font-serif text-2xl font-medium text-primary mb-3">Rain-Swap</h3>
              <p className="text-slate-grey text-sm md:text-base leading-relaxed flex-grow">
                Weather turned sour? One tap automatically reshuffles your itinerary, substituting
                outdoor plans for indoor cultural experiences without missing a beat.
              </p>
            </div>

            {/* Card 4 */}
            <div className="bg-surface p-8 rounded-xl border border-border-subtle whisper-shadow flex flex-col h-full group hover:border-primary transition-colors">
              <div className="w-12 h-12 bg-surface-container-low rounded-lg flex items-center justify-center mb-6 text-primary">
                <span className="material-symbols-outlined text-2xl">payments</span>
              </div>
              <h3 className="font-serif text-2xl font-medium text-primary mb-3">Live Budget</h3>
              <p className="text-slate-grey text-sm md:text-base leading-relaxed flex-grow">
                Keep your finances effortlessly in check. Real-time expense tracking integrated
                directly into your itinerary, providing peace of mind as you explore.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-20 px-6 bg-background border-t border-border-subtle" id="how-it-works">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="font-serif text-3xl md:text-4xl font-semibold text-primary mb-4">
              How it works
            </h2>
            <p className="text-slate-grey text-base">
              A seamless process designed to take you from daydreaming to departure with zero
              friction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            <div className="hidden md:block absolute top-6 left-1/6 right-1/6 h-px bg-border-subtle z-0" />

            {/* Step 1 */}
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-primary text-on-primary rounded-full flex items-center justify-center font-serif text-xl font-semibold mb-6 shadow-md">
                1
              </div>
              <h3 className="font-serif text-xl font-medium text-primary mb-3">Define Your Vibe</h3>
              <p className="text-slate-grey text-sm leading-relaxed">
                Complete a quick, intuitive quiz to establish your Traveler DNA. Tell us what you
                love, and more importantly, what you don't.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-surface text-primary border border-border-subtle rounded-full flex items-center justify-center font-serif text-xl font-semibold mb-6 shadow-sm">
                2
              </div>
              <h3 className="font-serif text-xl font-medium text-primary mb-3">
                Review the Draft
              </h3>
              <p className="text-slate-grey text-sm leading-relaxed">
                Within seconds, receive a fully fleshed-out itinerary. Tweak it, swap activities, and
                adjust the pace until it's perfect.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-surface text-primary border border-border-subtle rounded-full flex items-center justify-center font-serif text-xl font-semibold mb-6 shadow-sm">
                3
              </div>
              <h3 className="font-serif text-xl font-medium text-primary mb-3">
                Travel Effortlessly
              </h3>
              <p className="text-slate-grey text-sm leading-relaxed">
                Access your beautifully organized itinerary on your phone. Offline access, live
                updates, and direct booking links included.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-surface w-full mt-auto border-t border-border-subtle py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="font-serif text-xl font-medium tracking-widest uppercase text-primary">
            Concierge
          </div>
          <div className="flex gap-6 text-xs text-slate-grey font-medium">
            <button className="hover:text-primary transition-colors cursor-pointer">Privacy</button>
            <button className="hover:text-primary transition-colors cursor-pointer">Terms</button>
            <button className="hover:text-primary transition-colors cursor-pointer">Support</button>
          </div>
          <div className="text-xs text-slate-grey">© 2024 Concierge Luxury Travel</div>
        </div>
      </footer>
    </div>
  );
};
