import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

type Toast = { type: 'success' | 'error'; text: string } | null;

export default function AlertsPage() {
  const router = useRouter();
  const [tokenAddress, setTokenAddress] = useState('');
  const [email, setEmail] = useState('');
  const [threshold, setThreshold] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<Toast>(null);
  const [errors, setErrors] = useState<{ token?: string; email?: string; threshold?: string }>({});

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  // Prefill tokenAddress from query param `token` or `token_address`
  useEffect(() => {
    if (!router.isReady) return;
    const q = router.query.token || router.query.token_address || router.query.addr;
    if (q && typeof q === 'string') {
      setTokenAddress(q);
    }
  }, [router.isReady, router.query]);

  // simple validators
  const isEthAddress = (v: string) => /^0x[a-fA-F0-9]{40}$/.test(v.trim());
  const isEmail = (v: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.trim());
  const isPositiveNumber = (v: string) => { const n = Number(v); return !Number.isNaN(n) && n > 0; };

  const validate = () => {
    const e: typeof errors = {};
    if (!tokenAddress || !isEthAddress(tokenAddress)) e.token = 'Enter a valid Ethereum token address (0x...)';
    if (!email || !isEmail(email)) e.email = 'Enter a valid email address';
    if (!threshold || !isPositiveNumber(threshold)) e.threshold = 'Enter a positive number';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token_address: tokenAddress.trim(), dollar: Number(threshold), email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || 'Failed to create alert');
      setToast({ type: 'success', text: 'Alert created ✔' });
      setTokenAddress('');
      setThreshold('');
      setEmail('');
      setErrors({});
    } catch (err: any) {
      setToast({ type: 'error', text: err?.message || 'Error creating alert' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-white py-12">
      <div className="max-w-3xl mx-auto px-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-extrabold text-slate-800">Create Token Price Alert</h1>
          <a href="/" className="text-sm text-slate-600 hover:text-slate-900">Back to dashboard</a>
        </div>

        <section className="bg-white/80 backdrop-blur-md border border-slate-100 rounded-2xl shadow-md p-6">
          <p className="text-sm text-slate-600 mb-4">Receive an email when a token hits your USD threshold. Paste token contract address, set the USD price, and your email.</p>

          <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700">Token Address</label>
              <input
                value={tokenAddress}
                onChange={e => setTokenAddress(e.target.value)}
                placeholder="0x..."
                className={`mt-1 block w-full rounded-lg border px-3 py-2 text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 ${errors.token ? 'border-red-300' : 'border-slate-200'}`}
              />
              {errors.token && <p className="mt-1 text-xs text-red-600">{errors.token}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Threshold (USD)</label>
              <input
                value={threshold}
                onChange={e => setThreshold(e.target.value)}
                placeholder="e.g. 3000"
                inputMode="decimal"
                className={`mt-1 block w-full rounded-lg border px-3 py-2 text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 ${errors.threshold ? 'border-red-300' : 'border-slate-200'}`}
              />
              {errors.threshold && <p className="mt-1 text-xs text-red-600">{errors.threshold}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Email</label>
              <input
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                type="email"
                className={`mt-1 block w-full rounded-lg border px-3 py-2 text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 ${errors.email ? 'border-red-300' : 'border-slate-200'}`}
              />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
            </div>

            <div className="sm:col-span-2 flex items-center gap-3">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white px-4 py-2 shadow"
              >
                {loading ? 'Creating…' : 'Create Alert'}
              </button>

              <button
                type="button"
                onClick={() => { setTokenAddress(''); setEmail(''); setThreshold(''); setErrors({}); }}
                className="text-sm text-slate-600 hover:underline"
              >
                Reset
              </button>

              <div className="ml-auto text-sm text-slate-500">Tip: use a token contract address (0x...)</div>
            </div>
          </form>
        </section>

        {/* Toast */}
        {toast && (
          <div className={`fixed right-6 bottom-6 max-w-sm w-full rounded-lg px-4 py-3 shadow-lg text-white ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
            <div className="flex items-center justify-between">
              <div className="text-sm">{toast.text}</div>
              <button onClick={() => setToast(null)} className="ml-4 opacity-90 hover:opacity-100">✕</button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
