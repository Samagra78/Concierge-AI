/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, GroundingSource } from '../../types.ts';
import { api } from '../../api/client.ts';
import { formatInr } from '../../utils/currency.ts';

interface ConciergeChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string;
  onApplyItinerarySuggestion?: (suggestion: string) => void;
  onOpenErrands?: () => void;
  onGenerateItinerary?: (request: string, previousPlan?: any) => Promise<any>;
  onConfirmItinerary?: (proposal: any) => Promise<void>;
}

export const ConciergeChatModal: React.FC<ConciergeChatModalProps> = ({
  isOpen,
  onClose,
  initialPrompt = '',
  onApplyItinerarySuggestion,
  onOpenErrands,
  onGenerateItinerary,
  onConfirmItinerary,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      content:
        'Greetings. I am Concierge, your private travel and errand architect. Whether curating an art and culinary trail, discovering hidden venues with Google Maps, or negotiating a local garment care errand, I am at your service.',
      timestamp: 'Just now',
      modelUsed: 'gemini-3.8-flash',
    },
  ]);

  const [input, setInput] = useState(initialPrompt);
  const [isLoading, setIsLoading] = useState(false);
  const [model, setModel] = useState<'gemini-3.8-flash'>('gemini-3.8-flash');
  const [enableMaps, setEnableMaps] = useState(false);
  const [enableSearch, setEnableSearch] = useState(false);
  const [pendingItinerary, setPendingItinerary] = useState<any>(null);
  const [pendingRequest, setPendingRequest] = useState('');
  const [awaitingItineraryDetails, setAwaitingItineraryDetails] = useState(false);
  const [isConfirmingItinerary, setIsConfirmingItinerary] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      if (initialPrompt && initialPrompt !== input) {
        setInput(initialPrompt);
      }
    }
  }, [isOpen, messages]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedHistory = [...messages, userMessage];
    setMessages(updatedHistory);
    setInput('');
    setIsLoading(true);

    try {
      const confirmsPlan = /^(yes|y|confirm|confirmed|looks good|approve|approved|add it|go ahead|continue|perfect)\b/i.test(text.trim());
      const requestsItinerary = /\b(plan|create|build|generate|make|draft|organize)\b.{0,70}\b(itinerary|trip|journey|vacation|holiday|trail)\b/i.test(text)
        || /^\s*(plan|create|build|generate)\b/i.test(text) && /\b\d+\s*[- ]?days?\b/i.test(text);

      if (pendingItinerary && confirmsPlan && onConfirmItinerary) {
        await onConfirmItinerary(pendingItinerary);
        setPendingItinerary(null);
        setPendingRequest('');
        setMessages((prev) => [...prev, { id: `asst-${Date.now()}`, role: 'assistant', content: 'Confirmed. I have added the itinerary to your Timeline.', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), modelUsed: model }]);
        return;
      }

      const shouldGenerateItinerary = Boolean(onGenerateItinerary) && (requestsItinerary || Boolean(pendingItinerary) || awaitingItineraryDetails);
      if (shouldGenerateItinerary && onGenerateItinerary) {
        const isRevision = Boolean(pendingItinerary);
        const baseRequest = isRevision
          ? `Original request: ${pendingRequest}. Current proposal: ${pendingItinerary.destination}, ${pendingItinerary.durationDays} days. Apply this change: ${text}`
          : awaitingItineraryDetails ? `Destination: ${text}. Original request: ${pendingRequest}` : text;
        const response = await onGenerateItinerary(baseRequest, isRevision ? pendingItinerary : undefined);
        setPendingItinerary(response);
        setPendingRequest(isRevision ? pendingRequest : baseRequest);
        setAwaitingItineraryDetails(false);
        setMessages((prev) => [...prev, { id: `asst-${Date.now()}`, role: 'assistant', content: isRevision ? 'I updated the draft with your requested changes. Please review it below and confirm, or tell me what else to adjust.' : 'I have prepared a complete itinerary draft. Please review the days below, confirm it to add it to your Timeline, or tell me what you would like changed.', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), modelUsed: model, sources: response.sources || [] }]);
        return;
      }

      const response = await api.chat({
        messages: updatedHistory.map((m) => ({ role: m.role, content: m.content })),
        model,
        enableMaps,
        enableSearch,
      });

      const assistantMessage: ChatMessage = {
        id: `asst-${Date.now()}`,
        role: 'assistant',
        content: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: response.modelUsed || model,
        sources: response.sources || [],
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errorText = err instanceof Error ? err.message : 'Could not generate the itinerary. Please try again.';
      if (!pendingItinerary && /destination|city|region/i.test(errorText)) {
        setAwaitingItineraryDetails(true);
        setPendingRequest(text.trim());
      }
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: errorText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: model,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmProposal = async () => {
    if (!pendingItinerary || !onConfirmItinerary || isConfirmingItinerary) return;
    setIsConfirmingItinerary(true);
    try {
      await onConfirmItinerary(pendingItinerary);
      setPendingItinerary(null);
      setPendingRequest('');
      setMessages((prev) => [...prev, { id: `asst-${Date.now()}`, role: 'assistant', content: 'Confirmed. I have added the itinerary to your Timeline.', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), modelUsed: model }]);
    } catch (err) {
      setMessages((prev) => [...prev, { id: `err-${Date.now()}`, role: 'assistant', content: err instanceof Error ? err.message : 'Could not save the itinerary. Please try again.', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), modelUsed: model }]);
    } finally { setIsConfirmingItinerary(false); }
  };

  const handleQuickPrompt = (prompt: string) => {
    handleSendMessage(prompt);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Concierge AI Assistant Chat"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-surface border border-border-subtle rounded-2xl max-w-3xl w-full h-[88vh] flex flex-col shadow-2xl relative overflow-hidden">
        {/* Header */}
        <header className="p-4 sm:p-5 border-b border-border-subtle bg-surface-container-low flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-primary text-2xl text-secondary">
                auto_awesome
              </span>
              <div>
                <h3 className="font-serif text-xl sm:text-2xl font-medium text-primary">
                  Concierge AI Assistant
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-grey">
                  Multi-turn Travel &amp; Errand Intelligence with Real-time Google Maps &amp; Search Grounding
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-grey hover:text-primary hover:bg-surface transition-colors cursor-pointer"
              aria-label="Close chat"
            >
              <span className="material-symbols-outlined text-2xl">close</span>
            </button>
          </div>

          {/* Model and Grounding Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border-subtle text-xs">
            {/* Model Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-grey uppercase tracking-wider">
                Model:
              </span>
              <div className="inline-flex rounded-lg border border-border-subtle bg-surface p-0.5">
                <button
                  type="button"
                  onClick={() => setModel('gemini-3.8-flash')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                    model === 'gemini-3.8-flash'
                      ? 'bg-primary text-on-primary'
                      : 'text-slate-grey hover:text-primary'
                  }`}
                  title="General tasks and real-time Maps & Search Grounding"
                >
                  Gemini Flash
                </button>
              </div>
            </div>

            {/* Grounding Toggles */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setEnableMaps(!enableMaps);
                  if (!enableMaps) setEnableSearch(false);
                }}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1 transition-colors border cursor-pointer ${
                  enableMaps
                    ? 'bg-champagne text-primary border-secondary/30'
                    : 'bg-surface border-border-subtle text-slate-grey hover:text-primary'
                }`}
                title="Google Maps Grounding for verified venues & geography"
              >
                <span className="material-symbols-outlined text-xs">location_on</span>
                <span>Google Maps</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEnableSearch(!enableSearch);
                  if (!enableSearch) setEnableMaps(false);
                }}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1 transition-colors border cursor-pointer ${
                  enableSearch
                    ? 'bg-champagne text-primary border-secondary/30'
                    : 'bg-surface border-border-subtle text-slate-grey hover:text-primary'
                }`}
                title="Google Search Grounding for real-time web facts"
              >
                <span className="material-symbols-outlined text-xs">travel_explore</span>
                <span>Google Search</span>
              </button>
            </div>
          </div>
        </header>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-background">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[90%] sm:max-w-[85%] ${
                  isUser ? 'ml-auto' : 'mr-auto'
                }`}
              >
                <div className="flex items-center gap-2 mb-1 text-[11px] text-slate-grey px-1">
                  <span className="font-semibold">{isUser ? 'You' : 'Concierge'}</span>
                  <span>&bull;</span>
                  <span>{msg.timestamp}</span>
                  {!isUser && msg.modelUsed && (
                    <>
                      <span>&bull;</span>
                      <span className="text-[10px] uppercase font-bold text-slate-grey">
                        {msg.modelUsed}
                      </span>
                    </>
                  )}
                </div>

                <div
                  className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                    isUser
                      ? 'bg-primary text-on-primary rounded-tr-xs shadow-xs'
                      : 'bg-surface text-primary border border-border-subtle rounded-tl-xs shadow-xs'
                  }`}
                >
                  {msg.content}
                </div>

                {/* Grounding Sources (Google Maps & Google Search Links) */}
                {!isUser && msg.sources && msg.sources.length > 0 && (
                  <div className="mt-2.5 w-full bg-surface-container-low/70 border border-border-subtle rounded-xl p-3 text-xs space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-grey uppercase tracking-wider">
                      <span className="material-symbols-outlined text-sm text-secondary">
                        verified
                      </span>
                      <span>Grounding Sources &amp; Places</span>
                    </div>

                    <div className="flex flex-col gap-1.5 pt-1">
                      {msg.sources.map((src, i) => (
                        <a
                          key={i}
                          href={src.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-2 rounded-lg bg-surface border border-border-subtle hover:border-black transition-colors group"
                        >
                          <div className="flex items-center gap-2 min-w-0 pr-2">
                            <span className="material-symbols-outlined text-sm text-slate-grey group-hover:text-primary shrink-0">
                              {src.type === 'maps' ? 'place' : 'link'}
                            </span>
                            <span className="font-semibold text-primary truncate text-[11px] sm:text-xs">
                              {src.title || src.uri}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-grey shrink-0 flex items-center gap-0.5 group-hover:text-primary">
                            <span>Open</span>
                            <span className="material-symbols-outlined text-xs">open_in_new</span>
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {pendingItinerary && (
            <section className="mx-auto w-full max-w-2xl rounded-2xl border border-secondary/40 bg-surface p-4 sm:p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border-subtle pb-3">
                <div>
                  <p className="text-[11px] uppercase tracking-wider font-bold text-slate-grey">Itinerary proposal</p>
                  <h4 className="font-serif text-xl font-semibold text-primary">{pendingItinerary.destination} · {pendingItinerary.durationDays} days</h4>
                  <p className={`mt-1 text-xs ${pendingItinerary.allocatedBudget > pendingItinerary.totalBudget ? 'font-semibold text-red-700' : 'text-slate-grey'}`}>Estimated activity and transit spend: {formatInr(pendingItinerary.allocatedBudget)} / {formatInr(pendingItinerary.totalBudget)}</p>
                  {pendingItinerary.allocatedBudget > pendingItinerary.totalBudget && <p className="mt-1 text-xs text-red-700">This draft is over budget. Ask me to reduce costs before confirming.</p>}
                </div>
                <span className="rounded-full bg-champagne px-3 py-1 text-[11px] font-semibold text-primary">Review before adding</span>
              </div>
              <p className="py-3 text-sm text-slate-grey">{pendingItinerary.summary}</p>
              <div className="max-h-56 space-y-3 overflow-y-auto pr-1">
                {(pendingItinerary.days || []).map((day: any) => (
                  <div key={day.dayNumber} className="rounded-xl border border-border-subtle bg-background p-3">
                    <p className="mb-2 text-xs font-bold text-primary">Day {day.dayNumber}: {day.title}</p>
                    <div className="space-y-1.5">
                      {(day.items || []).filter((item: any) => item.type === 'activity').map((item: any) => (
                        <div key={item.data.id} className="flex items-start justify-between gap-3 text-xs">
                          <span className="min-w-0"><span className="font-semibold text-primary">{item.data.time} · {item.data.title}</span><span className="block text-slate-grey">{item.data.category} · {item.data.duration}</span></span>
                          <span className="shrink-0 text-slate-grey">{item.data.cost}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <p className="pt-3 text-xs text-slate-grey">Want changes? Describe them in the message box. The timeline updates only after you confirm.</p>
              <div className="mt-3 flex flex-wrap justify-end gap-2">
                <button type="button" onClick={() => setInput('Please revise this itinerary: ')} className="rounded-lg border border-border-subtle px-4 py-2 text-xs font-semibold text-primary hover:bg-background">Request changes</button>
                <button type="button" onClick={handleConfirmProposal} disabled={isConfirmingItinerary || isLoading} className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-on-primary disabled:opacity-60">{isConfirmingItinerary ? 'Saving…' : 'Confirm & Add to Timeline'}</button>
              </div>
            </section>
          )}

          {isLoading && (
            <div className="flex items-center gap-3 p-4 bg-surface border border-border-subtle rounded-2xl max-w-sm rounded-tl-xs shadow-xs text-xs text-slate-grey">
              <span className="material-symbols-outlined text-lg animate-spin text-secondary">
                sync
              </span>
              <span>
                Consulting {model} with {enableMaps ? 'Google Maps' : enableSearch ? 'Google Search' : 'Concierge AI'}...
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        {messages.length <= 3 && (
          <div className="px-4 py-2 border-t border-border-subtle bg-surface-container-low/50 flex gap-2 overflow-x-auto scrollbar-none">
            <button
              onClick={() => handleQuickPrompt('Plan a 3-day art & specialty coffee trail in Tokyo under ₹1,14,000')}
              className="px-3 py-1.5 bg-surface border border-border-subtle rounded-full text-[11px] text-slate-grey hover:text-primary hover:border-primary whitespace-nowrap transition-colors cursor-pointer"
            >
              🎨 3-day Art &amp; Coffee Tokyo
            </button>
            <button
              onClick={() => handleQuickPrompt('Find top 4.8★ dry cleaners or shirt pressing with hotel pickup in Shibuya')}
              className="px-3 py-1.5 bg-surface border border-border-subtle rounded-full text-[11px] text-slate-grey hover:text-primary hover:border-primary whitespace-nowrap transition-colors cursor-pointer"
            >
              👔 Shibuya Laundry &amp; Valet
            </button>
            <button
              onClick={() => handleQuickPrompt('What are the best tranquil Zen gardens and teahouses open today?')}
              className="px-3 py-1.5 bg-surface border border-border-subtle rounded-full text-[11px] text-slate-grey hover:text-primary hover:border-primary whitespace-nowrap transition-colors cursor-pointer"
            >
              🍵 Zen Gardens &amp; Tea
            </button>
          </div>
        )}

        {/* Input Bar */}
        <footer className="p-3 sm:p-4 border-t border-border-subtle bg-surface flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
            placeholder="Ask about itineraries, verify places via Maps, or describe an errand..."
            className="flex-1 bg-surface-container-low border border-border-subtle rounded-xl px-4 py-3 text-xs sm:text-sm text-primary focus:border-black focus:outline-none placeholder:text-slate-grey"
          />

          <button
            onClick={() => handleSendMessage()}
            disabled={!input.trim() || isLoading}
            className="p-3 bg-primary text-on-primary rounded-xl hover:bg-neutral-800 transition-colors disabled:opacity-40 cursor-pointer flex items-center justify-center shrink-0"
            aria-label="Send message"
          >
            <span className="material-symbols-outlined text-lg sm:text-xl">send</span>
          </button>
        </footer>
      </div>
    </div>
  );
};
