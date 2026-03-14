'use client';

import { useEffect, useRef, useState } from 'react';
import type { Alert } from '@/lib/types';

interface Props {
  currentPrice: number | null;
}

const fmt = (n: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

let nextId = 1;

async function sendSmsNotification(message: string): Promise<void> {
  try {
    const res = await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });
    if (!res.ok) {
      const { error } = await res.json();
      console.error('[SMS] Failed to send:', error);
    }
  } catch (err) {
    console.error('[SMS] Network error:', err);
  }
}

export default function AlertPanel({ currentPrice }: Props) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [dir, setDir] = useState<'above' | 'below'>('above');
  const [targetPrice, setTargetPrice] = useState('');
  const [smsEnabled, setSmsEnabled] = useState(false);
  const prevPriceRef = useRef<number | null>(null);

  // Check alerts whenever price changes
  useEffect(() => {
    if (currentPrice === null) return;
    prevPriceRef.current = currentPrice;

    setAlerts((prev) => {
      let changed = false;
      const next = prev.map((a) => {
        if (a.triggered) return a;
        const hit =
          (a.dir === 'above' && currentPrice >= a.price) ||
          (a.dir === 'below' && currentPrice <= a.price);
        if (hit) {
          changed = true;
          const title = `BTC is ${a.dir} $${fmt(a.price)}!`;
          const body = `Current price: $${fmt(currentPrice)}`;
          notifyBrowser(title, body);
          if (a.smsEnabled) {
            sendSmsNotification(`[BTC Tracker] ${title} ${body}`);
          }
          return { ...a, triggered: true };
        }
        return a;
      });
      return changed ? next : prev;
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
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    setAlerts((prev) => [...prev, { id: nextId++, dir, price, triggered: false, smsEnabled }]);
    setTargetPrice('');
  }

  function removeAlert(id: number) {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }

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

      <label className="sms-toggle">
        <input
          type="checkbox"
          checked={smsEnabled}
          onChange={(e) => setSmsEnabled(e.target.checked)}
        />
        <span>Also send Telegram notification</span>
      </label>

      {alerts.length === 0 ? (
        <p className="no-alerts">No alerts set.</p>
      ) : (
        <ul className="alert-list">
          {alerts.map((a) => (
            <li key={a.id} className={a.triggered ? 'triggered' : ''}>
              <span>
                {a.dir === 'above' ? '⬆' : '⬇'} BTC {a.dir}{' '}
                <strong>${fmt(a.price)}</strong>
                {a.smsEnabled && <span className="sms-badge">TG</span>}
                {a.triggered && ' ✓ Triggered'}
              </span>
              <button className="remove-btn" onClick={() => removeAlert(a.id)}>
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
