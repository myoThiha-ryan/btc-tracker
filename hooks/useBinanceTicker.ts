'use client';

import { useEffect, useRef, useState } from 'react';
import type { ConnectionStatus, TickerData } from '@/lib/types';

const BINANCE_WS_URL = 'wss://stream.binance.com:9443/ws/btcusdt@ticker';
const RECONNECT_DELAY_MS = 3000;

export function useBinanceTicker() {
  const [ticker, setTicker] = useState<TickerData | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>();
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    function connect() {
      if (!isMounted.current) return;
      setStatus('connecting');

      const ws = new WebSocket(BINANCE_WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        if (isMounted.current) setStatus('live');
      };

      ws.onmessage = (event) => {
        if (!isMounted.current) return;
        try {
          const d = JSON.parse(event.data as string);
          setTicker({
            price: parseFloat(d.c),
            priceChange: parseFloat(d.p),
            priceChangePercent: parseFloat(d.P),
            high24h: parseFloat(d.h),
            low24h: parseFloat(d.l),
            volume24h: parseFloat(d.v),
            openPrice: parseFloat(d.o),
            timestamp: d.E,
          });
        } catch {
          // malformed message — ignore
        }
      };

      ws.onclose = () => {
        if (!isMounted.current) return;
        setStatus('disconnected');
        reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY_MS);
      };

      ws.onerror = () => {
        if (isMounted.current) setStatus('error');
        ws.close();
      };
    }

    connect();

    return () => {
      isMounted.current = false;
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, []);

  return { ticker, status };
}
