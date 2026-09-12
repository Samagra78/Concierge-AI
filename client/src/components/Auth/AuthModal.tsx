import React, { useState } from 'react';
import { api } from '../../api/client.ts';

interface AuthModalProps { isOpen: boolean; onClose: () => void; onSuccess: (user: any, isNew: boolean) => void }

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [homeCity, setHomeCity] = useState('');
  const [countryOfResidence, setCountryOfResidence] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (!isOpen) return null;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const result = mode === 'signup'
        ? await api.register({ name, email, password, phoneNumber, homeCity, countryOfResidence, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone })
        : await api.login({ email, password });
      onSuccess(result.user, mode === 'signup'); onClose();
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to sign in. Check the server and try again.'); }
    finally { setBusy(false); }
  };

  return <div role="dialog" aria-modal="true" aria-label="Account sign in" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
    <section className="relative w-full max-w-md rounded-2xl border border-border-subtle bg-background p-7 shadow-2xl">
      <button onClick={onClose} aria-label="Close" className="absolute right-4 top-4 text-xl">×</button>
      <h2 className="mb-1 text-center font-serif text-3xl font-semibold text-primary">Concierge</h2>
      <p className="mb-6 text-center text-sm text-slate-grey">Sign in to your account or create one.</p>
      <div className="mb-5 flex rounded-lg bg-surface-container-low p-1">
        {(['login', 'signup'] as const).map((tab) => <button key={tab} type="button" onClick={() => { setMode(tab); setError(''); }} className={`flex-1 rounded-md py-2 text-sm font-semibold ${mode === tab ? 'bg-white text-primary shadow' : 'text-slate-grey'}`}>{tab === 'login' ? 'Log in' : 'Sign up'}</button>)}
      </div>
      <form onSubmit={submit} className="space-y-4">
        {mode === 'signup' && <>
          <label className="block text-sm font-medium">Name<input className="mt-1 block w-full rounded-lg border border-border-subtle bg-white px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-medium">Home city<input className="mt-1 block w-full rounded-lg border border-border-subtle bg-white px-3 py-2" value={homeCity} onChange={(e) => setHomeCity(e.target.value)} autoComplete="address-level2" maxLength={100} /></label>
            <label className="block text-sm font-medium">Country<input className="mt-1 block w-full rounded-lg border border-border-subtle bg-white px-3 py-2" value={countryOfResidence} onChange={(e) => setCountryOfResidence(e.target.value)} autoComplete="country-name" maxLength={100} /></label>
          </div>
          <label className="block text-sm font-medium">Phone number <span className="font-normal text-slate-grey">(optional)</span><input className="mt-1 block w-full rounded-lg border border-border-subtle bg-white px-3 py-2" type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} autoComplete="tel" maxLength={32} /></label>
        </>}
        <label className="block text-sm font-medium">Email<input className="mt-1 block w-full rounded-lg border border-border-subtle bg-white px-3 py-2" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required /></label>
        <label className="block text-sm font-medium">Password<input className="mt-1 block w-full rounded-lg border border-border-subtle bg-white px-3 py-2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} minLength={6} required /></label>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <button disabled={busy} className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-white disabled:opacity-60">{busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}</button>
      </form>
    </section>
  </div>;
};
