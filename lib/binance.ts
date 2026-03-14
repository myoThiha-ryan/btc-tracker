/**
 * Shared Binance API helper.
 *
 * If VPS_PROXY_URL is set, all requests are routed through the VPS proxy
 * (which lives in an allowed region) instead of calling Binance directly.
 * Otherwise falls back to direct Binance calls (works locally with VPN).
 */

const VPS_PROXY_URL = process.env.VPS_PROXY_URL;
const BINANCE_TESTNET = process.env.BINANCE_TESTNET === 'true';

export const BINANCE_BASE: string = VPS_PROXY_URL
  ? VPS_PROXY_URL
  : BINANCE_TESTNET
    ? 'https://testnet.binance.vision'
    : 'https://api.binance.com';

/**
 * Returns headers required for every Binance API call.
 * Includes x-proxy-secret when routing through the VPS.
 */
export function binanceHeaders(apiKey: string): Record<string, string> {
  const headers: Record<string, string> = {
    'X-MBX-APIKEY': apiKey,
    'Content-Type': 'application/x-www-form-urlencoded',
  };
  if (VPS_PROXY_URL && process.env.PROXY_SECRET) {
    headers['x-proxy-secret'] = process.env.PROXY_SECRET;
  }
  return headers;
}
