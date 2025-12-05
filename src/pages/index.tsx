import { useEffect, useState } from 'react';

const formatPrice = (p: number | null) => (p == null ? '—' : `$${Number(p).toLocaleString(undefined, { maximumFractionDigits: 6 })}`);

export default function Home() {
  const [ethPrice, setEthPrice] = useState<number | null>(null);
  const [maticPrice, setMaticPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const fetchPrices = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/prices');
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      // The scheduler endpoint may return different payloads; attempt safe reads
      const eth = data.ethUsdPrice ?? data.ethPrice ?? null;
      const matic = data.maticUsdPrice ?? data.maticPrice ?? null;
      if (eth != null) setEthPrice(Number(eth));
      if (matic != null) setMaticPrice(Number(matic));
      setLastUpdated(Date.now());
    } catch (e) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setError((e as any)?.message ?? 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
    const id = setInterval(fetchPrices, 60_000); // refresh every 60s
    return () => clearInterval(id);
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-3xl">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Token Prices</h1>
            <p className="text-sm text-gray-500">Live prices fetched from the scheduler / Moralis</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchPrices}
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60"
              disabled={loading}
            >
              {loading ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-4">
          <div className="bg-white shadow rounded-lg p-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium">ETH</h2>
              <p className="text-sm text-gray-500">Wrapped Ether (USD)</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-semibold">{formatPrice(ethPrice)}</div>
              <div className="text-xs text-gray-400">{lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : '—'}</div>
              <div className="mt-3 flex items-center gap-2">
                <a href={`/graphs?token=ETH`} className="text-sm px-3 py-1 bg-slate-100 rounded hover:bg-slate-200">Add Graph</a>
                <a href={`/alerts?token=ETH`} className="text-sm px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700">Create Alert</a>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium">MATIC</h2>
              <p className="text-sm text-gray-500">Polygon (USD)</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-semibold">{formatPrice(maticPrice)}</div>
              <div className="text-xs text-gray-400">{lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : '—'}</div>
              <div className="mt-3 flex items-center gap-2">
                <a href={`/graphs?token=MATIC`} className="text-sm px-3 py-1 bg-slate-100 rounded hover:bg-slate-200">Add Graph</a>
                <a href={`/alerts?token=MATIC`} className="text-sm px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700">Create Alert</a>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Custom Token</h3>
                <p className="text-sm text-gray-500">Add any token by contract address</p>
              </div>
              <div className="flex items-center gap-2">
                <a href="/graphs" className="text-sm px-3 py-1 bg-slate-100 rounded hover:bg-slate-200">Graphs</a>
                <a href="/alerts" className="text-sm px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700">Create Alert</a>
              </div>
            </div>
          </div>
        </section>

        <footer className="mt-6 text-sm text-gray-600">
          {error ? <div className="text-red-600">Error: {error}</div> : <div>Last update: {lastUpdated ? new Date(lastUpdated).toLocaleString() : 'Not updated yet'}</div>}
        </footer>
      </div>
    </main>
  );
}