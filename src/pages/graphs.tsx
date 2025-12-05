import { useEffect, useState } from 'react';

type SeriesPoint = { price: number; ts: string };

function Sparkline({ data }: { data: number[] }) {
  if (!data || data.length === 0) return <div className="text-xs text-gray-400">No data</div>;
  const w = 240;
  const h = 60;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d - min) / range) * h;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="block">
      <polyline fill="none" stroke="#6366f1" strokeWidth={2} points={points} />
    </svg>
  );
}

export default function GraphsPage() {
  const [tokenInput, setTokenInput] = useState('');
  const [graphs, setGraphs] = useState<string[]>([]);
  const [seriesMap, setSeriesMap] = useState<Record<string, SeriesPoint[]>>({});

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('graphs') : null;
    if (stored) setGraphs(JSON.parse(stored));
  }, []);

  useEffect(() => {
    if (graphs.length === 0) return;
    localStorage.setItem('graphs', JSON.stringify(graphs));
    graphs.forEach(loadSeries);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graphs]);

  async function loadSeries(token: string) {
    try {
      const res = await fetch(`/api/historical?token=${encodeURIComponent(token)}`);
      const json = await res.json();
      setSeriesMap(prev => ({ ...prev, [token]: json.series || [] }));
    } catch (e) {
      console.error('failed load series', e);
      setSeriesMap(prev => ({ ...prev, [token]: [] }));
    }
  }

  function addGraph() {
    const t = tokenInput.trim();
    if (!t) return;
    if (!graphs.includes(t)) setGraphs(prev => [t, ...prev]);
    setTokenInput('');
  }

  function removeGraph(token: string) {
    setGraphs(prev => prev.filter(g => g !== token));
    setSeriesMap(prev => { const copy = { ...prev }; delete copy[token]; return copy; });
  }

  return (
    <main className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-4xl mx-auto px-6">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Graphs</h1>
          <a href="/" className="text-sm text-slate-600">Back</a>
        </header>

        <section className="mb-6 bg-white p-4 rounded shadow">
          <div className="flex gap-2">
            <input value={tokenInput} onChange={e => setTokenInput(e.target.value)} placeholder="Token symbol or contract (e.g. ETH or 0x...)" className="flex-1 border rounded px-3 py-2" />
            <button onClick={addGraph} className="px-4 py-2 bg-indigo-600 text-white rounded">Add Graph</button>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {graphs.map(token => {
            const data = (seriesMap[token] || []).map((p: SeriesPoint) => p.price);
            return (
              <div key={token} className="bg-white p-4 rounded shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm text-slate-500">{token}</div>
                    <div className="text-xl font-semibold mt-1">{data.length ? `$${data[data.length - 1].toLocaleString(undefined, { maximumFractionDigits: 6 })}` : '—'}</div>
                  </div>
                  <div className="text-right">
                    <button onClick={() => removeGraph(token)} className="text-sm text-red-600">Remove</button>
                    <div className="mt-2">
                      <a href={`/alerts?token=${encodeURIComponent(token)}`} className="text-sm px-2 py-1 bg-indigo-600 text-white rounded">Create Alert</a>
                    </div>
                  </div>
                </div>
                <div className="mt-3">
                  <Sparkline data={data.length ? data : [0]} />
                </div>
              </div>
            );
          })}
          {graphs.length === 0 && <div className="text-sm text-slate-500">No graphs yet — add a token symbol or contract above to start.</div>}
        </section>
      </div>
    </main>
  );
}
