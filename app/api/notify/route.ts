import { NextRequest, NextResponse } from 'next/server';

const REQUIRED_ENV = ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_ID'] as const;

export async function POST(req: NextRequest) {
  const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Missing environment variables: ${missing.join(', ')}` },
      { status: 500 }
    );
  }

  let body: { message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { message } = body;
  if (!message || typeof message !== 'string') {
    return NextResponse.json({ error: '"message" field is required' }, { status: 400 });
  }

  const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;

  const tgRes = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: process.env.TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: 'HTML',
    }),
  });

  const tgData = await tgRes.json() as { ok: boolean; description?: string; result?: { message_id: number } };

  if (!tgData.ok) {
    console.error('[notify] Telegram error:', tgData.description);
    return NextResponse.json({ error: tgData.description }, { status: 502 });
  }

  return NextResponse.json({ message_id: tgData.result?.message_id });
}
