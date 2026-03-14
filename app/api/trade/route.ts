import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

const BINANCE_BASE = process.env.BINANCE_TESTNET === 'true'
  ? 'https://testnet.binance.vision'
  : 'https://api.binance.com';

const REQUIRED_ENV = ['BINANCE_API_KEY', 'BINANCE_API_SECRET'] as const;

function sign(queryString: string): string {
  return crypto
    .createHmac('sha256', process.env.BINANCE_API_SECRET!)
    .update(queryString)
    .digest('hex');
}

async function sendTelegramMessage(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  });
}

export async function POST(req: NextRequest) {
  const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Missing environment variables: ${missing.join(', ')}` },
      { status: 500 }
    );
  }

  let body: { side?: string; symbol?: string; usdtAmount?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { side, symbol = 'BTCUSDT', usdtAmount } = body;

  if (!side || !['BUY', 'SELL'].includes(side)) {
    return NextResponse.json({ error: '"side" must be BUY or SELL' }, { status: 400 });
  }
  if (!usdtAmount || usdtAmount <= 0) {
    return NextResponse.json({ error: '"usdtAmount" must be a positive number' }, { status: 400 });
  }

  // Build signed order params
  // quoteOrderQty lets us specify USDT amount for both BUY and SELL MARKET orders
  const params = new URLSearchParams({
    symbol,
    side,
    type: 'MARKET',
    quoteOrderQty: usdtAmount.toFixed(2),
    timestamp: Date.now().toString(),
  });

  params.append('signature', sign(params.toString()));

  const binanceRes = await fetch(`${BINANCE_BASE}/api/v3/order`, {
    method: 'POST',
    headers: {
      'X-MBX-APIKEY': process.env.BINANCE_API_KEY!,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  const data = await binanceRes.json() as {
    orderId?: number;
    status?: string;
    side?: string;
    executedQty?: string;
    cummulativeQuoteQty?: string;
    msg?: string;
    code?: number;
  };

  if (!binanceRes.ok) {
    const errMsg = data.msg ?? 'Binance API error';
    console.error('[trade] Binance error:', data.code, errMsg);
    return NextResponse.json({ error: errMsg, code: data.code }, { status: 502 });
  }

  // Send Telegram confirmation
  const isTestnet = process.env.BINANCE_TESTNET === 'true';
  const btcQty = parseFloat(data.executedQty ?? '0').toFixed(6);
  const usdtFilled = parseFloat(data.cummulativeQuoteQty ?? '0').toFixed(2);
  const telegramMsg = [
    `${isTestnet ? '🧪 [TESTNET] ' : ''}✅ <b>Trade Executed</b>`,
    `Side: <b>${data.side}</b>`,
    `Amount: <b>$${usdtFilled} USDT</b>`,
    `BTC qty: <b>${btcQty} BTC</b>`,
    `Order ID: <code>${data.orderId}</code>`,
    `Status: ${data.status}`,
  ].join('\n');

  await sendTelegramMessage(telegramMsg);

  return NextResponse.json({
    orderId: data.orderId,
    status: data.status,
    side: data.side,
    executedQty: data.executedQty,
    cummulativeQuoteQty: data.cummulativeQuoteQty,
  });
}
