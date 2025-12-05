import React from 'react';

const mockCoins = [
  { symbol: 'BTC', name: 'Bitcoin', price: 59421.23, change: 2.3, marketCap: '1.14T' },
  { symbol: 'ETH', name: 'Ethereum', price: 3621.45, change: -0.7, marketCap: '430.2B' },
  { symbol: 'BNB', name: 'Binance', price: 420.33, change: 1.2, marketCap: '64.1B' },
  { symbol: 'AVAX', name: 'Avalanche', price: 26.12, change: -3.2, marketCap: '6.7B' },
];

const tokens = [
  { symbol: 'BTC', name: 'Bitcoin', price: 59421.23, change: 2.3, vol: '3.2B' },
  { symbol: 'ETH', name: 'Ethereum', price: 3621.45, change: -0.7, vol: '1.1B' },
  { symbol: 'USDT', name: 'Tether', price: 1.00, change: 0.0, vol: '12.3B' },
  { symbol: 'BNB', name: 'Binance Coin', price: 420.33, change: 1.2, vol: '532M' },
  { symbol: 'ADA', name: 'Cardano', price: 0.48, change: 4.1, vol: '210M' },
  { symbol: 'SOL', name: 'Solana', price: 120.14, change: -1.5, vol: '410M' },
];

function Spark({ values = [1, 2, 1.5, 2.7, 2.4, 3, 2.9] }: { values?: number[] }) {
  const w = 120;
  const h = 36;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x},${y}`;
    })
    .join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="block">
      <polyline fill="none" stroke="#60a5fa" strokeWidth={2} points={points} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-slate-950 border-r border-slate-800 min-h-screen p-6">
          <div className="mb-8">
            <div className="text-2xl font-bold text-white">Crypto Panel</div>
            <div className="text-sm text-slate-400 mt-1">Dashboard</div>
          </div>
          <nav className="flex flex-col gap-3">
            <a href="/dashboard" className="px-3 py-2 rounded bg-slate-800 text-slate-100">Market</a>
            <a href="/graphs" className="px-3 py-2 rounded text-slate-300 hover:bg-slate-800">Graphs</a>
            <a href="/alerts" className="px-3 py-2 rounded text-slate-300 hover:bg-slate-800">Alerts</a>
            <a href="#" className="px-3 py-2 rounded text-slate-300 hover:bg-slate-800">Portfolio</a>
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 p-8">
          <header className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-semibold">Market Coins</h1>
              <p className="text-sm text-slate-400">Overview of top coins by market cap</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-slate-800 px-3 py-2 rounded text-sm">Search token...</div>
              <button className="bg-indigo-600 px-4 py-2 rounded text-white">Connect</button>
            </div>
          </header>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {mockCoins.map((c) => (
              <div key={c.symbol} className="bg-slate-800 p-4 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-slate-400">{c.name}</div>
                    <div className="text-lg font-semibold mt-1">{c.symbol}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold">${c.price.toLocaleString()}</div>
                    <div className={`text-sm ${c.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{c.change}%</div>
                  </div>
                </div>
                <div className="mt-3">
                  <Spark values={[1, 1.2, 1.15, 1.6, 1.5, 1.8]} />
                </div>
              </div>
            ))}
          </section>

          <section className="bg-slate-800 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Market Overview</h2>
              <div className="text-sm text-slate-400">Last updated: {new Date().toLocaleString()}</div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full table-fixed">
                <thead>
                  <tr className="text-slate-400 text-left text-sm border-b border-slate-700">
                    <th className="py-3">Token</th>
                    <th className="py-3">Price</th>
                    <th className="py-3">24h</th>
                    <th className="py-3">Volume</th>
                    <th className="py-3">Spark</th>
                    <th className="py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tokens.map((t) => (
                    <tr key={t.symbol} className="border-b border-slate-700 hover:bg-slate-900/50">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-sm font-semibold">{t.symbol[0]}</div>
                          <div>
                            <div className="font-medium">{t.name}</div>
                            <div className="text-xs text-slate-400">{t.symbol}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 font-semibold">${t.price.toLocaleString()}</td>
                      <td className={`py-4 ${t.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{t.change}%</td>
                      <td className="py-4 text-slate-300">{t.vol}</td>
                      <td className="py-4"><Spark values={[1, 1.1, 1.05, 1.2, 1.15]} /></td>
                      <td className="py-4">
                        <div className="flex gap-2">
                          <a href={`/graphs?token=${encodeURIComponent(t.symbol)}`} className="text-sm px-2 py-1 bg-slate-700 rounded">Add Graph</a>
                          <a href={`/alerts?token=${encodeURIComponent(t.symbol)}`} className="text-sm px-2 py-1 bg-indigo-600 rounded text-white">Alert</a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
