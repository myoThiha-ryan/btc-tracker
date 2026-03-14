'use client';

import { useBinanceTicker } from '@/hooks/useBinanceTicker';
import AlertPanel from './AlertPanel';
import PriceCard from './PriceCard';
import StatsGrid from './StatsGrid';
import StatusIndicator from './StatusIndicator';

export default function BtcDashboard() {
  const { ticker, status } = useBinanceTicker();

  return (
    <>
      <header>
        <span className="btc-logo">₿</span>
        <div>
          <h1>BTC Live Tracker</h1>
          <span>Powered by Binance API</span>
        </div>
      </header>

      <StatusIndicator status={status} />
      <PriceCard ticker={ticker} />
      <StatsGrid ticker={ticker} />
      <AlertPanel currentPrice={ticker?.price ?? null} />
    </>
  );
}
