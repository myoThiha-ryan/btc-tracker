# ₿ BTC Live Tracker

A real-time Bitcoin price tracking dashboard built with Next.js 14, powered by the Binance WebSocket API. Get live BTC/USDT prices, 24h stats, and price alerts with Telegram notifications.

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![License](https://img.shields.io/badge/license-MIT-green)

## Features

- **Live price feed** — Real-time BTC/USDT updates via Binance WebSocket (no API key required)
- **24h stats** — High, low, volume, and open price
- **Price change** — Dollar and percentage change from 24h open, color-coded green/red
- **Price alerts** — Set above/below thresholds; triggers browser notification when hit
- **Telegram notifications** — Optionally send an alert to your Telegram account when a threshold is crossed
- **Auto-reconnect** — Automatically reconnects if the WebSocket connection drops

## Tech Stack

- [Next.js 14](https://nextjs.org/) — App Router, React Server Components
- [TypeScript](https://www.typescriptlang.org/)
- [Binance WebSocket API](https://binance-docs.github.io/apidocs/spot/en/#websocket-market-streams) — free, no authentication needed
- [Telegram Bot API](https://core.telegram.org/bots/api) — for push notifications

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/myoThiha-ryan/btc-tracker.git
cd btc-tracker
npm install
```

### 2. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in your Telegram credentials in `.env.local`:

```env
TELEGRAM_BOT_TOKEN=123456789:AAFxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TELEGRAM_CHAT_ID=123456789
```

> Telegram notifications are optional. The dashboard works without them — only price alerts with the "Also send Telegram notification" checkbox ticked will use these values.

#### Getting your Telegram credentials

1. Open Telegram → search **@BotFather**
2. Send `/newbot` and follow the prompts to create a bot — you'll receive a **bot token**
3. Start a chat with your new bot (search its username → press Start)
4. Visit the URL below (replace `YOUR_TOKEN`) to find your **chat ID**:
   ```
   https://api.telegram.org/botYOUR_TOKEN/getUpdates
   ```
   Look for `"chat":{"id": 123456789}` in the response.

### 3. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
btc-tracker/
├── app/
│   ├── api/notify/route.ts   # POST endpoint — sends Telegram message
│   ├── globals.css           # All styles
│   ├── layout.tsx            # Root layout & metadata
│   └── page.tsx              # Home page (server component)
├── components/
│   ├── BtcDashboard.tsx      # Client shell — owns the WebSocket hook
│   ├── PriceCard.tsx         # Live price display with flash animation
│   ├── StatsGrid.tsx         # 24h high / low / volume / open
│   ├── AlertPanel.tsx        # Alert form, list, and notification logic
│   └── StatusIndicator.tsx   # WebSocket connection status dot
├── hooks/
│   └── useBinanceTicker.ts   # Connects directly to Binance WebSocket
├── lib/
│   └── types.ts              # Shared TypeScript interfaces
└── .env.local.example        # Environment variable template
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm start` | Start production server |

## License

MIT
