'use client';

import { useCallback, useEffect, useState } from 'react';

interface Order {
  orderId: number;
  symbol: string;
  side: string;
  type: string;
  status: string;
  origQty: string;
  executedQty: string;
  cummulativeQuoteQty: string;
  price: string;
  time: number;
}

interface OrdersResponse {
  orders: Order[];
  isTestnet: boolean;
}

const STATUS_CLASS: Record<string, string> = {
  FILLED: 'status-filled',
  CANCELED: 'status-canceled',
  PARTIALLY_FILLED: 'status-partial',
  NEW: 'status-new',
  REJECTED: 'status-rejected',
  EXPIRED: 'status-canceled',
};

const fmt = (n: number, decimals = 2) =>
  n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

export default function OrdersPanel() {
  const [data, setData] = useState<OrdersResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/orders');
      const json = await res.json() as OrdersResponse & { error?: string };
      if (!res.ok) throw new Error(json.error ?? 'Failed to fetch orders');
      setData(json);
      setLastRefreshed(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  return (
    <div className="orders-panel">
      <div className="orders-header">
        <div className="orders-title">
          <h2>📋 Order History</h2>
          {data?.isTestnet && <span className="testnet-badge">TESTNET</span>}
        </div>
        <div className="orders-meta">
          {lastRefreshed && (
            <span className="orders-refreshed">
              Updated {lastRefreshed.toLocaleTimeString()}
            </span>
          )}
          <button
            className="refresh-btn"
            onClick={fetchOrders}
            disabled={loading}
          >
            {loading ? '...' : '↻ Refresh'}
          </button>
        </div>
      </div>

      {error && <p className="orders-error">❌ {error}</p>}

      {!error && data?.orders.length === 0 && (
        <p className="orders-empty">No orders found for BTCUSDT.</p>
      )}

      {data && data.orders.length > 0 && (
        <div className="orders-table-wrap">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Side</th>
                <th>Type</th>
                <th>Status</th>
                <th>BTC Qty</th>
                <th>USDT Total</th>
                <th>Order ID</th>
              </tr>
            </thead>
            <tbody>
              {data.orders.map((o) => {
                const usdtTotal = parseFloat(o.cummulativeQuoteQty);
                const btcQty = parseFloat(o.executedQty);
                const avgPrice = btcQty > 0 ? usdtTotal / btcQty : 0;

                return (
                  <tr key={o.orderId}>
                    <td className="orders-time">
                      {new Date(o.time).toLocaleDateString()}{' '}
                      <span>{new Date(o.time).toLocaleTimeString()}</span>
                    </td>
                    <td>
                      <span className={`side-badge ${o.side.toLowerCase()}`}>{o.side}</span>
                    </td>
                    <td className="orders-muted">{o.type}</td>
                    <td>
                      <span className={`order-status ${STATUS_CLASS[o.status] ?? ''}`}>
                        {o.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="orders-num">
                      {btcQty > 0 ? btcQty.toFixed(6) : '—'}
                      {avgPrice > 0 && (
                        <span className="orders-subtext"> @ ${fmt(avgPrice)}</span>
                      )}
                    </td>
                    <td className="orders-num">
                      {usdtTotal > 0 ? `$${fmt(usdtTotal)}` : '—'}
                    </td>
                    <td className="orders-id">{o.orderId}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {loading && !data && (
        <p className="orders-loading">Loading orders...</p>
      )}
    </div>
  );
}
