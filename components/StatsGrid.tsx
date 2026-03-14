import type { TickerData } from '@/lib/types';

interface Props {
  ticker: TickerData | null;
}

const fmt = (n: number, decimals = 2) =>
  n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

export default function StatsGrid({ ticker }: Props) {
  return (
    <div className="stats-grid">
      <div className="stat-card">
        <div className="stat-label">24h High</div>
        <div className="stat-value high">{ticker ? `$${fmt(ticker.high24h)}` : '—'}</div>
      </div>
      <div className="stat-card">
        <div className="stat-label">24h Low</div>
        <div className="stat-value low">{ticker ? `$${fmt(ticker.low24h)}` : '—'}</div>
      </div>
      <div className="stat-card">
        <div className="stat-label">24h Volume (BTC)</div>
        <div className="stat-value">{ticker ? fmt(ticker.volume24h, 2) : '—'}</div>
      </div>
      <div className="stat-card">
        <div className="stat-label">Open Price</div>
        <div className="stat-value">{ticker ? `$${fmt(ticker.openPrice)}` : '—'}</div>
      </div>
    </div>
  );
}
