/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { VendorQuote, GroundingSource, ExpenseItem } from '../../types.ts';
import { sampleDiscoveredQuotes } from '../../data/mockData.ts';
import { api } from '../../api/client.ts';

interface LocalErrandsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPurchaseLogged: (purchase: ExpenseItem) => void;
}

export const LocalErrandsModal: React.FC<LocalErrandsModalProps> = ({ isOpen, onClose, onPurchaseLogged }) => {
  const [quotes, setQuotes] = useState<VendorQuote[]>(sampleDiscoveredQuotes);
  const [approvedQuoteId, setApprovedQuoteId] = useState<string | null>(null);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [paymentDone, setPaymentDone] = useState(false);
  const [errandSources, setErrandSources] = useState<GroundingSource[]>([]);
  const [errandInput, setErrandInput] = useState(
    '4 dress shirts ironed and 2 trousers pressed. Hotel pickup at 4 PM, return by tomorrow evening.'
  );
  const [isSearching, setIsSearching] = useState(false);
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  if (!isOpen) return null;

  const handleApprove = async (quoteId: string) => {
    if (!currentTaskId) { setPaymentError('Create live errand quotes before approving a booking.'); return; }
    setPaymentError('');
    try {
      await api.grantApproval(quoteId);
      setApprovedQuoteId(quoteId);
      setQuotes((prev) => prev.map((q) => q.id === quoteId ? { ...q, status: 'approved_by_user' } : q));
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : 'Could not approve this quote.');
    }
  };

  const handleConfirmPayment = async () => {
    if (!currentTaskId || !approvedQuote || isConfirmingPayment) return;
    setIsConfirmingPayment(true);
    setPaymentError('');
    try {
      const result = await api.confirmPayment(currentTaskId, { amount: approvedQuote.total, method: 'upi', reference: `UPI_${Date.now().toString().slice(-6)}`, approvalId: approvedQuote.id });
      onPurchaseLogged(result.purchase as ExpenseItem);
      setPaymentDone(true);
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : 'Could not log this payment.');
    } finally { setIsConfirmingPayment(false); }
  };

  const handleSimulateOutreach = async () => {
    setIsSearching(true);
    try {
      const res = await api.dispatchErrand({
        rawRequest: errandInput,
        locality: 'Hotel / Central Ward',
        category: 'ironing',
      });

      if (res.quotes && res.quotes.length > 0) {
        setQuotes(res.quotes);
        setCurrentTaskId(res.taskId);
        if (res.sources) setErrandSources(res.sources as GroundingSource[]);
      }
    } catch (err) {
      console.warn('Errand dispatch notice:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const approvedQuote = quotes.find((q) => q.id === approvedQuoteId);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Concierge Local Errands Engine"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-surface border border-border-subtle rounded-2xl max-w-2xl w-full p-6 md:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-grey hover:text-primary transition-colors cursor-pointer"
          aria-label="Close errand modal"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        {/* Modal Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-grey mb-1">
            <span className="material-symbols-outlined text-base">local_laundry_service</span>
            <span>Spec.md v1 Engine • Local Errands &amp; Valet</span>
          </div>
          <h3 className="font-serif text-2xl font-semibold text-primary">
            Agentic Errand Dispatch
          </h3>
          <p className="text-xs text-slate-grey mt-1">
            Autonomous discovery, outreach, and negotiation. Booking unlocked only after your explicit
            approval.
          </p>
        </div>

        {/* Natural Language Errand Prompt */}
        <div className="bg-surface-container-low p-4 rounded-xl border border-border-subtle mb-6">
          <label className="block text-xs font-semibold text-slate-grey uppercase tracking-wider mb-2">
            Errand Description (Plain English)
          </label>
          <textarea
            rows={2}
            value={errandInput}
            onChange={(e) => setErrandInput(e.target.value)}
            className="w-full bg-surface border border-border-subtle rounded-lg p-3 text-xs md:text-sm text-primary focus:border-black focus:outline-none"
            placeholder="e.g. Iron 3 cotton shirts and pick up laundry from hotel desk..."
          />
          <div className="mt-3 flex justify-between items-center">
            <span className="text-[11px] text-slate-grey">
              Discovers verified Places within 2km &bull; Initiates Telegram/WhatsApp outreach
            </span>
            <button
              onClick={handleSimulateOutreach}
              disabled={isSearching}
              className="px-4 py-1.5 bg-primary text-on-primary text-xs font-semibold rounded-lg hover:bg-neutral-800 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              <span className={`material-symbols-outlined text-sm ${isSearching ? 'animate-spin' : ''}`}>
                sync
              </span>
              <span>{isSearching ? 'Contacting...' : 'Find & Negotiate'}</span>
            </button>
          </div>
        </div>

        {/* Quotes Received & Approval Gate */}
        <div className="space-y-4 mb-6">
          <div className="flex justify-between items-center">
            <h4 className="font-serif text-base font-semibold text-primary">
              Negotiated Quotes ({quotes.length})
            </h4>
            <span className="text-xs text-emerald-muted font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">verified_user</span>
              <span>Approval Gate Enforced in Code</span>
            </span>
          </div>

          <div className="space-y-3">
            {quotes.map((q) => {
              const isApproved = approvedQuoteId === q.id;
              return (
                <div
                  key={q.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isApproved
                      ? 'border-emerald-muted bg-emerald-muted/5 ring-2 ring-emerald-muted/20'
                      : 'border-border-subtle bg-surface hover:border-slate-grey'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-serif text-base font-semibold text-primary">
                          {q.vendorName}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-surface-container-high text-slate-grey">
                          via {q.channel}
                        </span>
                      </div>
                      <p className="text-xs text-slate-grey mt-0.5">
                        {q.service} &bull; ★ {q.rating} ({q.distanceKm} km away)
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="font-serif text-lg font-bold text-primary">
                        {q.currency}
                        {q.total}
                      </span>
                      <p className="text-[11px] text-slate-grey">Turnaround: {q.turnaroundHours}h</p>
                    </div>
                  </div>

                  {/* Line Items */}
                  <div className="bg-surface-container-low/60 p-2.5 rounded-lg text-xs space-y-1 mb-3">
                    {q.lineItems.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-slate-grey">
                        <span>
                          {item.qty}x {item.label}
                        </span>
                        <span>
                          {q.currency}
                          {item.qty * item.unitPrice}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between text-slate-grey pt-1 border-t border-border-subtle text-[11px]">
                      <span>Pickup &amp; Return</span>
                      <span>
                        {q.pickupFee === 0 && q.dropFee === 0 ? 'Free' : `${q.currency}${q.pickupFee + q.dropFee}`}
                      </span>
                    </div>
                  </div>

                  {/* Approval Action */}
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-xs text-slate-grey font-medium">
                      Pickup Window: <strong className="text-primary">{q.pickupSlot}</strong>
                    </span>

                    {isApproved ? (
                      <span className="px-3 py-1.5 rounded-lg bg-emerald-muted text-white text-xs font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">check</span>
                        <span>Booking Confirmed</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleApprove(q.id)}
                        disabled={!currentTaskId}
                        title={!currentTaskId ? 'Search live quotes before approving.' : 'Approve this quote'}
                        className="px-4 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-neutral-800 transition-colors cursor-pointer shadow-xs disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {currentTaskId ? 'Approve & Book' : 'Search live quotes first'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 8: Direct Payment Card (Unlocked after user approval) */}
        {approvedQuote && (
          <div className="p-4 rounded-xl border border-secondary bg-surface-container-low animate-in fade-in duration-300">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                Direct Vendor Settlement (Spec.md §8)
              </span>
              <span className="text-xs font-semibold text-slate-grey">
                No platform fees &bull; Pay vendor directly
              </span>
            </div>

            <p className="text-xs text-slate-grey mb-3">
              Total to pay <strong className="text-primary">{approvedQuote.vendorName}</strong> upon
              drop-off:
            </p>

            <div className="flex items-center justify-between p-3 bg-surface rounded-lg border border-border-subtle mb-3">
              <div>
                <span className="text-xs text-slate-grey block">Agreed Quote Snapshot</span>
                <span className="font-serif text-xl font-bold text-primary">
                  {approvedQuote.currency}
                  {approvedQuote.total}
                </span>
              </div>

              {paymentDone ? (
                <span className="text-xs font-bold text-emerald-muted flex items-center gap-1">
                  <span className="material-symbols-outlined text-base">check_circle</span>
                  <span>Payment Logged (Task Completed)</span>
                </span>
              ) : (
                <button
                  onClick={handleConfirmPayment}
                  disabled={isConfirmingPayment}
                  className="px-4 py-2 bg-emerald-muted text-white text-xs font-semibold rounded-lg hover:brightness-95 transition-all cursor-pointer shadow-xs disabled:opacity-60"
                >
                  {isConfirmingPayment ? 'Saving purchase…' : "I've Paid Vendor (Cash/UPI)"}
                </button>
              )}
            </div>

            {paymentError && <p role="alert" className="mb-3 text-xs text-red-700">{paymentError}</p>}

            {errandSources.length > 0 && (
              <div className="mb-3 pt-2 border-t border-border-subtle flex flex-wrap gap-2 text-[11px]">
                {errandSources.map((s, idx) => (
                  <a
                    key={idx}
                    href={s.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-surface border border-border-subtle text-primary hover:border-black transition-colors"
                  >
                    <span className="material-symbols-outlined text-xs text-secondary">place</span>
                    <span>{s.title || 'View on Google Maps'}</span>
                    <span className="material-symbols-outlined text-[10px]">open_in_new</span>
                  </a>
                ))}
              </div>
            )}

            <p className="text-[11px] text-slate-grey italic">
              Notice: The agent never handles payment credentials or credit cards. You settle
              directly with the service partner upon pickup or delivery (Spec.md §8).
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
