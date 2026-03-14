import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { BINANCE_BASE, binanceHeaders } from '@/lib/binance';

function sign(queryString: string): string {
  return crypto
    .createHmac('sha256', process.env.BINANCE_API_SECRET!)
    .update(queryString)
    .digest('hex');
}

export async function GET() {
  if (!process.env.BINANCE_API_KEY || !process.env.BINANCE_API_SECRET) {
    return NextResponse.json(
      { error: 'Missing BINANCE_API_KEY or BINANCE_API_SECRET' },
      { status: 500 }
    );
  }

  const params = new URLSearchParams({
    symbol: 'BTCUSDT',
    limit: '20',
    timestamp: Date.now().toString(),
  });
  params.append('signature', sign(params.toString()));

  const res = await fetch(`${BINANCE_BASE}/api/v3/allOrders?${params.toString()}`, {
    headers: binanceHeaders(process.env.BINANCE_API_KEY!),
    cache: 'no-store',
  });

  const data = await res.json() as BinanceOrder[] | { msg: string; code: number };

  if (!res.ok) {
    const err = data as { msg: string; code: number };
    return NextResponse.json({ error: err.msg }, { status: 502 });
  }

  // Return most recent first
  const orders = (data as BinanceOrder[]).reverse();
  return NextResponse.json({
    orders,
    isTestnet: process.env.BINANCE_TESTNET === 'true',
  });
}

interface BinanceOrder {
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
  updateTime: number;
}
