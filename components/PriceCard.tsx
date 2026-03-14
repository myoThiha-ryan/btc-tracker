'use client';

import { useEffect, useRef, useState } from 'react';
import type { TickerData } from '@/lib/types';

interface Props {
  ticker: TickerData | null;
}

const fmt = (n: number, decimals = 2) =>
  n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

export default function PriceCard({ ticker }: Props) {
  const lastPriceRef = useRef<number | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [priceDir, setPriceDir] = useState<'up' | 'down' | 'neutral'>('neutral');

  useEffect(() => {
    if (!ticker) return;
    const prev = lastPriceRef.current;
    const dir =
      prev === null ? 'neutral' : ticker.price > prev ? 'up' : ticker.price < prev ? 'down' : 'neutral';
    lastPriceRef.current = ticker.price;
    setPriceDir(dir);

    // Restart flash animation by removing and re-adding class
    const card = cardRef.current;
    if (!card || dir === 'neutral') return;
    card.classList.remove('flash-up', 'flash-down');
    requestAnimationFrame(() => {
      card.classList.add(dir === 'up' ? 'flash-up' : 'flash-down');
    });
  }, [ticker]);

  const sign = ticker && ticker.priceChangePercent >= 0 ? '+' : '';
  const changeClass = ticker ? (ticker.priceChangePercent >= 0 ? 'up' : 'down') : '';

  return (
    <div className="price-card" ref={cardRef}>
      <div className="price-label">BTC / USDT</div>
      <div className={`price ${priceDir}`}>
        {ticker ? `$${fmt(ticker.price)}` : '—'}
      </div>
      <div className={`change ${changeClass}`}>
        {ticker
          ? `${sign}$${fmt(ticker.priceChange)} (${sign}${fmt(ticker.priceChangePercent)}%)`
          : '—'}
      </div>
      <div className="last-update">
        {ticker ? `Last update: ${new Date(ticker.timestamp).toLocaleTimeString()}` : ''}
      </div>
    </div>
  );
}
