import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { BINANCE_BASE, binanceHeaders } from '@/lib/binance';

export const dynamic = 'force-dynamic';

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

  let res: Response;
  try {
    res = await fetch(`${BINANCE_BASE}/api/v3/allOrders?${params.toString()}`, {
      headers: binanceHeaders(process.env.BINANCE_API_KEY!),
      cache: 'no-store',
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Network error reaching Binance';
    console.error('[orders] Fetch error:', msg);
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  // Read as text first — prevents crash if body is empty or non-JSON
  const text = await res.text();
  if (!text) {
    return NextResponse.json({ error: 'Empty response from Binance' }, { status: 502 });
  }

  let data: BinanceOrder[] | { msg: string; code: number };
  try {
    data = JSON.parse(text);
  } catch {
    console.error('[orders] Non-JSON response:', text.slice(0, 200));
    return NextResponse.json({ error: 'Invalid response from Binance', raw: text.slice(0, 200) }, { status: 502 });
  }

  if (!res.ok) {
    const err = data as { msg: string; code: number };
    console.error('[orders] Binance error:', err.code, err.msg);
    return NextResponse.json({ error: err.msg, code: err.code }, { status: 502 });
  }

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
