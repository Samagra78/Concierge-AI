/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ExpenseCategory, ExpenseItem, TripOverview } from '../../types.ts';
import { formatInr } from '../../utils/currency.ts';

interface ExpenseTrackerViewProps {
  tripOverview: TripOverview;
  expenses: ExpenseItem[];
  onAddExpense: (expense: ExpenseItem) => Promise<void> | void;
  onUpdateExpense: (expense: ExpenseItem) => Promise<void> | void;
  onRemoveExpense: (expenseId: string) => Promise<void> | void;
  onUpdateBudget: (totalBudget: number) => Promise<void> | void;
  onOpenErrandsModal: () => void;
}

export const ExpenseTrackerView: React.FC<ExpenseTrackerViewProps> = ({
  tripOverview,
  expenses,
  onAddExpense,
  onUpdateExpense,
  onRemoveExpense,
  onUpdateBudget,
  onOpenErrandsModal,
}) => {
  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newCategory, setNewCategory] = useState<ExpenseCategory>('Dining');
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [removingExpenseId, setRemovingExpenseId] = useState<string | null>(null);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState(String(tripOverview.totalBudget || ''));
  const [budgetError, setBudgetError] = useState('');
  const [isSavingBudget, setIsSavingBudget] = useState(false);

  const expenseTotal = expenses.reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0);
  const effectiveSpent = Math.max(expenseTotal, tripOverview.allocatedBudget);
  const remainingBuffer = Math.max(0, tripOverview.totalBudget - effectiveSpent);
  const loggedPercent = tripOverview.totalBudget > 0 ? Math.min(100, Math.round(expenseTotal / tripOverview.totalBudget * 100)) : 0;
  const categoryColors = ['bg-primary', 'bg-secondary', 'bg-emerald-muted', 'bg-[#d0643d]', 'bg-blue-500', 'bg-violet-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-600', 'bg-lime-600', 'bg-indigo-500', 'bg-orange-500', 'bg-teal-500', 'bg-slate-500'];
  const categoryBreakdown = Object.entries(expenses.reduce<Record<string, number>>((totals, expense) => {
    totals[expense.category] = (totals[expense.category] || 0) + (Number(expense.amount) || 0);
    return totals;
  }, {})).sort((a, b) => b[1] - a[1]).map(([name, amount], index) => ({
    name,
    amount,
    percent: expenseTotal > 0 ? Math.round(amount / expenseTotal * 100) : 0,
    color: categoryColors[index % categoryColors.length],
  }));

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = newTitle.trim();
    const parsed = Number(newAmount);
    if (!title) { setFormError('Enter a description for this expense.'); return; }
    if (!Number.isFinite(parsed) || parsed <= 0) { setFormError('Enter an amount greater than ₹0.'); return; }

    const item: ExpenseItem = {
      id: editingExpenseId || `expense-${globalThis.crypto?.randomUUID?.() || Date.now()}`,
      category: newCategory,
      title,
      amount: parsed,
      date: expenses.find((expense) => expense.id === editingExpenseId)?.date || new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      status: expenses.find((expense) => expense.id === editingExpenseId)?.status || 'Confirmed',
    };
    setIsSaving(true);
    setFormError('');
    try {
      if (editingExpenseId) await onUpdateExpense(item);
      else await onAddExpense(item);
      setNewTitle('');
      setNewAmount('');
      setEditingExpenseId(null);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Could not save the expense. Please try again.');
    } finally { setIsSaving(false); }
  };

  const handleSaveBudget = async (event: React.FormEvent) => {
    event.preventDefault();
    const amount = Number(budgetInput);
    if (!Number.isFinite(amount) || amount <= 0) { setBudgetError('Enter a trip budget greater than ₹0.'); return; }
    setIsSavingBudget(true);
    setBudgetError('');
    try {
      await onUpdateBudget(amount);
      setIsEditingBudget(false);
    } catch (error) {
      setBudgetError(error instanceof Error ? error.message : 'Could not update the trip budget.');
    } finally { setIsSavingBudget(false); }
  };

  return (
    <div className="flex-1 min-h-screen bg-background p-6 md:p-10 max-w-6xl mx-auto w-full pb-24 md:pb-12">
      {/* Header */}
      <header className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="material-symbols-outlined text-primary text-2xl">payments</span>
            <span className="text-xs uppercase tracking-widest font-bold text-slate-grey">
              Financial Peace of Mind
            </span>
          </div>
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-primary">
            Live Budget Tracker
          </h2>
        </div>

        <button
          onClick={onOpenErrandsModal}
          className="px-4 py-2.5 bg-surface text-primary border border-border-subtle rounded-lg text-xs font-semibold hover:bg-surface-container-low transition-colors flex items-center gap-2 cursor-pointer shadow-2xs self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-base">local_laundry_service</span>
          <span>Concierge Errand Quotes</span>
        </button>
      </header>

      {/* Top Bento Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="bg-surface p-6 rounded-xl border border-border-subtle whisper-card-shadow">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-slate-grey font-semibold uppercase tracking-wider block mb-1">Total Trip Budget</span>
            {!isEditingBudget && <button type="button" onClick={() => { setBudgetInput(String(tripOverview.totalBudget || '')); setBudgetError(''); setIsEditingBudget(true); }} className="text-xs font-semibold text-slate-grey underline">{tripOverview.totalBudget > 0 ? 'Change' : 'Set budget'}</button>}
          </div>
          {!isEditingBudget ? <>
            <span className="font-serif text-3xl font-semibold text-primary">{formatInr(tripOverview.totalBudget)}</span>
            <p className="text-xs text-slate-grey mt-2">Set or change the budget for this trip.</p>
          </> : <form onSubmit={handleSaveBudget} className="mt-2 space-y-2">
            <label className="sr-only" htmlFor="trip-budget-input">Trip budget in INR</label>
            <input id="trip-budget-input" type="number" min="1" step="1" required value={budgetInput} onChange={(event) => setBudgetInput(event.target.value)} placeholder="Enter budget in INR" className="w-full rounded-lg border border-border-subtle bg-background px-3 py-2 text-sm text-primary" />
            {budgetError && <p role="alert" className="text-xs text-red-700">{budgetError}</p>}
            <div className="flex gap-2">
              <button type="submit" disabled={isSavingBudget} className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-on-primary disabled:opacity-50">{isSavingBudget ? 'Saving…' : 'Save budget'}</button>
              <button type="button" disabled={isSavingBudget} onClick={() => { setIsEditingBudget(false); setBudgetError(''); }} className="rounded-lg border border-border-subtle px-3 py-2 text-xs font-semibold text-primary">Cancel</button>
            </div>
          </form>}
        </div>

        <div className="bg-surface p-6 rounded-xl border border-border-subtle whisper-card-shadow">
          <span className="text-xs text-slate-grey font-semibold uppercase tracking-wider block mb-1">
            Total Logged Expenses
          </span>
          <span className="font-serif text-3xl font-semibold text-emerald-muted">
            {formatInr(expenseTotal)}
          </span>
          <p className="text-xs text-slate-grey mt-2">{expenses.length} {expenses.length === 1 ? 'expense' : 'expenses'} · {loggedPercent}% of trip budget</p>
        </div>

        <div className="bg-surface p-6 rounded-xl border border-border-subtle whisper-card-shadow">
          <span className="text-xs text-slate-grey font-semibold uppercase tracking-wider block mb-1">
            Remaining Buffer
          </span>
          <span className="font-serif text-3xl font-semibold text-primary">
            {formatInr(remainingBuffer)}
          </span>
          <p className="text-xs text-slate-grey mt-2">After logged expenses and planned allocations</p>
        </div>
      </div>

      {/* Breakdown Progress and Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
        {/* Left: Category Allocations */}
        <section className="lg:col-span-7 bg-surface p-6 md:p-8 rounded-xl border border-border-subtle whisper-card-shadow">
          <h3 className="font-serif text-xl font-medium text-primary mb-4">
            Category Allocation
          </h3>

          {/* Stacked bar */}
          <div className="h-4 w-full bg-surface-container-high rounded-full overflow-hidden flex mb-6" aria-label="Expense totals by category">
            {categoryBreakdown.map((category) => <div key={category.name} className={`${category.color} h-full`} style={{ width: `${expenseTotal > 0 ? category.amount / expenseTotal * 100 : 0}%` }} title={`${category.name}: ${formatInr(category.amount)}`} />)}
          </div>

          {categoryBreakdown.length ? <div className="space-y-4">
            {categoryBreakdown.map((cat) => (
              <div key={cat.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2.5">
                  <span className={`w-3 h-3 rounded-full ${cat.color}`} />
                  <span className="font-medium text-primary">{cat.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-slate-grey text-xs">{cat.percent}%</span>
                  <span className="font-bold text-primary">{formatInr(cat.amount)}</span>
                </div>
              </div>
            ))}
          </div> : <p className="text-sm text-slate-grey">Your category totals will appear here when you log expenses.</p>}
        </section>

        {/* Right: Quick Log Expense */}
        <section className="lg:col-span-5 bg-surface p-6 md:p-8 rounded-xl border border-border-subtle whisper-card-shadow">
          <h3 className="font-serif text-xl font-medium text-primary mb-1">{editingExpenseId ? 'Edit Expense' : 'Log Expense'}</h3>
          <p className="text-xs text-slate-grey mb-4">
            Add live on-the-go purchases directly to your ledger.
          </p>

          <form onSubmit={handleAddExpense} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-grey uppercase tracking-wider mb-1">
                Item Description
              </label>
              <input
                type="text"
                placeholder="e.g. Asakusa Matcha Soft-serve"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
                maxLength={120}
                className="w-full border-b border-border-subtle bg-transparent py-2 text-sm text-primary focus:border-black focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-grey uppercase tracking-wider mb-1">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  placeholder="25"
                  min="0.01"
                  step="0.01"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  required
                  className="w-full border-b border-border-subtle bg-transparent py-2 text-sm text-primary focus:border-black focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-grey uppercase tracking-wider mb-1">
                  Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) =>
                    setNewCategory(e.target.value as ExpenseCategory)
                  }
                  className="w-full border-b border-border-subtle bg-transparent py-2 text-sm text-primary focus:border-black focus:outline-none cursor-pointer"
                >
                  <option value="Accommodation">Accommodation</option>
                  <option value="Dining">Dining &amp; Food</option>
                  <option value="Groceries">Groceries</option>
                  <option value="Transit">Local Transit</option>
                  <option value="Flights">Flights</option>
                  <option value="Experience">Experiences</option>
                  <option value="Activities">Activities &amp; Tickets</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Errand">Errands</option>
                  <option value="Insurance">Travel Insurance</option>
                  <option value="Visa">Visa &amp; Documents</option>
                  <option value="Health">Health &amp; Medication</option>
                  <option value="Communication">Phone &amp; Data</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {formError && <p role="alert" className="text-xs text-red-700">{formError}</p>}
            {editingExpenseId && <button type="button" onClick={() => { setEditingExpenseId(null); setNewTitle(''); setNewAmount(''); setFormError(''); }} className="w-full rounded-lg border border-border-subtle py-2 text-xs font-semibold text-slate-grey">Cancel editing</button>}
            <button
              type="submit"
              disabled={isSaving}
              className="w-full bg-primary text-on-primary py-2.5 rounded-lg text-xs font-semibold hover:bg-neutral-800 transition-colors cursor-pointer mt-2 shadow-xs disabled:opacity-60"
            >
              {isSaving ? 'Saving…' : editingExpenseId ? 'Save Changes' : 'Add Expense'}
            </button>
          </form>
        </section>
      </div>

      {/* Itemized Expenses List */}
      <section className="bg-surface rounded-xl border border-border-subtle p-6 whisper-card-shadow">
        <h3 className="font-serif text-xl font-medium text-primary mb-4">Itemized Ledger</h3>
        <div className="divide-y divide-border-subtle">
          {expenses.map((item) => (
            <div key={item.id} className="py-3.5 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-primary">{item.title}</p>
                <p className="text-xs text-slate-grey">
                  {item.category} • {item.date}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3 text-right">
                <div>
                <p className="text-sm font-bold text-primary">{formatInr(item.amount)}</p>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-surface-container-low text-slate-grey font-medium">
                  {item.status}
                </span>
                </div>
                <button type="button" aria-label={`Edit ${item.title}`} title="Edit expense" onClick={() => { setEditingExpenseId(item.id); setNewTitle(item.title); setNewAmount(String(item.amount)); setNewCategory(item.category); setFormError(''); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="rounded-lg p-2 text-slate-grey hover:bg-surface-container-low hover:text-primary"><span className="material-symbols-outlined text-base">edit</span></button>
                <button type="button" aria-label={`Remove ${item.title}`} title="Remove expense" disabled={removingExpenseId === item.id} onClick={async () => {
                  setRemovingExpenseId(item.id);
                  setFormError('');
                  try { await onRemoveExpense(item.id); }
                  catch (error) { setFormError(error instanceof Error ? error.message : 'Could not remove the expense.'); }
                  finally { setRemovingExpenseId(null); }
                }} className="rounded-lg p-2 text-slate-grey hover:bg-red-50 hover:text-red-700 disabled:opacity-50"><span className="material-symbols-outlined text-base">delete</span></button>
              </div>
            </div>
          ))}
          {!expenses.length && <p className="py-8 text-center text-sm text-slate-grey">No expenses logged yet. Add your first trip expense above.</p>}
        </div>
      </section>
    </div>
  );
};
