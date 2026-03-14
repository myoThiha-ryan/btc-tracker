import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BTC Live Tracker',
  description: 'Real-time Bitcoin price tracker powered by Binance API',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
