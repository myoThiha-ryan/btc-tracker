'use client';

import { useEffect, useRef, useState } from 'react';
import type { Alert, OrderResult } from '@/lib/types';

interface Props {
  currentPrice: number | null;
}

const fmt = (n: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

let nextId = 1;

async function sendTelegramNotification(message: string) {
  try {
    const res = await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });
    if (!res.ok) {
      const { error } = await res.json();
      console.error('[Telegram] Failed:', error);
    }
  } catch (err) {
    console.error('[Telegram] Network error:', err);
  }
}

async function placeTrade(
  side: 'BUY' | 'SELL',
  usdtAmount: number,
): Promise<OrderResult> {
  const res = await fetch('/api/trade', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ side, usdtAmount, symbol: 'BTCUSDT' }),
  });
  const data = await res.json() as OrderResult & { error?: string };
  if (!res.ok) throw new Error(data.error ?? 'Trade failed');
  return data;
}

export default function AlertPanel({ currentPrice }: Props) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [dir, setDir] = useState<'above' | 'below'>('above');
  const [targetPrice, setTargetPrice] = useState('');
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [autoTrade, setAutoTrade] = useState(false);
  const [tradeAmount, setTradeAmount] = useState('');
  const prevPriceRef = useRef<number | null>(null);

  useEffect(() => {
    if (currentPrice === null) return;
    prevPriceRef.current = currentPrice;

    // Collect newly triggered alerts synchronously, then run side effects
    const triggered: Alert[] = [];

    setAlerts((prev) => {
      const next = prev.map((a) => {
        if (a.triggered) return a;
        const hit =
          (a.dir === 'above' && currentPrice >= a.price) ||
          (a.dir === 'below' && currentPrice <= a.price);
        if (hit) {
          triggered.push(a);
          return { ...a, triggered: true };
        }
        return a;
      });
      return triggered.length > 0 ? next : prev;
    });

    // Side effects for each newly triggered alert
    triggered.forEach((a) => {
      const title = `BTC is ${a.dir} $${fmt(a.price)}!`;
      const body = `Current price: $${fmt(currentPrice)}`;

      notifyBrowser(title, body);

      if (a.smsEnabled) {
        sendTelegramNotification(`[BTC Tracker] ${title} ${body}`);
      }

      if (a.autoTrade) {
        const side = a.dir === 'above' ? 'SELL' : 'BUY';
        const amount = parseFloat(a.tradeAmount);
        if (amount > 0) {
          placeTrade(side, amount)
            .then((order) => {
              setAlerts((prev) =>
                prev.map((al) => (al.id === a.id ? { ...al, lastOrder: order } : al))
              );
            })
            .catch((err: Error) => {
              setAlerts((prev) =>
                prev.map((al) =>
                  al.id === a.id
                    ? { ...al, lastOrder: { orderId: 0, status: 'ERROR', side, executedQty: '0', cummulativeQuoteQty: '0', error: err.message } }
                    : al
                )
              );
            });
        }
      }
    });
  }, [currentPrice]);

  function notifyBrowser(title: string, body: string) {
    if (typeof window === 'undefined') return;
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body });
    } else {
      alert(`🔔 ${title}\n${body}`);
    }
  }

  function addAlert() {
    const price = parseFloat(targetPrice);
    if (isNaN(price) || price <= 0) {
      alert('Please enter a valid price.');
      return;
    }
    if (autoTrade) {
      const amount = parseFloat(tradeAmount);
      if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid USDT trade amount.');
        return;
      }
    }
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    setAlerts((prev) => [
      ...prev,
      { id: nextId++, dir, price, triggered: false, smsEnabled, autoTrade, tradeAmount },
    ]);
    setTargetPrice('');
  }

  function removeAlert(id: number) {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }

  const tradeSide = dir === 'above' ? 'SELL' : 'BUY';

  return (
    <div className="alert-card">
      <h2>🔔 Price Alerts</h2>

      <div className="alert-form">
        <select value={dir} onChange={(e) => setDir(e.target.value as 'above' | 'below')}>
          <option value="above">Above</option>
          <option value="below">Below</option>
        </select>
        <input
          type="number"
          placeholder="Target price (USDT)"
          min={0}
          step={1}
          value={targetPrice}
          onChange={(e) => setTargetPrice(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addAlert()}
        />
        <button onClick={addAlert}>Add Alert</button>
      </div>

      {/* Notification options */}
      <label className="sms-toggle">
        <input
          type="checkbox"
          checked={smsEnabled}
          onChange={(e) => setSmsEnabled(e.target.checked)}
        />
        <span>Also send Telegram notification</span>
      </label>

      {/* Auto trade options */}
      <label className="sms-toggle">
        <input
          type="checkbox"
          checked={autoTrade}
          onChange={(e) => setAutoTrade(e.target.checked)}
        />
        <span>Place auto trade when triggered</span>
      </label>

      {autoTrade && (
        <div className="trade-config">
          <div className="trade-config-row">
            <span className={`trade-side-badge ${tradeSide.toLowerCase()}`}>{tradeSide}</span>
            <input
              type="number"
              placeholder="Amount (USDT)"
              min={0}
              step={1}
              value={tradeAmount}
              onChange={(e) => setTradeAmount(e.target.value)}
            />
            <span className="trade-config-label">USDT · MARKET order</span>
          </div>
          <p className="trade-warning">
            ⚠️ Always test on Binance Testnet before using real funds.
          </p>
        </div>
      )}

      {alerts.length === 0 ? (
        <p className="no-alerts">No alerts set.</p>
      ) : (
        <ul className="alert-list">
          {alerts.map((a) => (
            <li key={a.id} className={a.triggered ? 'triggered' : ''}>
              <div className="alert-item-main">
                <span>
                  {a.dir === 'above' ? '⬆' : '⬇'} BTC {a.dir}{' '}
                  <strong>${fmt(a.price)}</strong>
                  {a.smsEnabled && <span className="sms-badge">TG</span>}
                  {a.autoTrade && (
                    <span className={`sms-badge ${a.dir === 'above' ? 'sell' : 'buy'}`}>
                      {a.dir === 'above' ? 'SELL' : 'BUY'} ${a.tradeAmount}
                    </span>
                  )}
                  {a.triggered && ' ✓ Triggered'}
                </span>
                <button className="remove-btn" onClick={() => removeAlert(a.id)}>✕</button>
              </div>

              {/* Order result */}
              {a.lastOrder && (
                <div className={`order-result ${a.lastOrder.error ? 'error' : 'success'}`}>
                  {a.lastOrder.error ? (
                    <>❌ Order failed: {a.lastOrder.error}</>
                  ) : (
                    <>
                      ✅ Order #{a.lastOrder.orderId} · {a.lastOrder.status} ·{' '}
                      {parseFloat(a.lastOrder.executedQty).toFixed(6)} BTC ·{' '}
                      ${parseFloat(a.lastOrder.cummulativeQuoteQty).toFixed(2)} USDT
                    </>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
