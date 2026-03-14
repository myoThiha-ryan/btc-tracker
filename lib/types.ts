export interface TickerData {
  price: number;
  priceChange: number;
  priceChangePercent: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  openPrice: number;
  timestamp: number;
}

export type ConnectionStatus = 'connecting' | 'live' | 'error' | 'disconnected';

export interface Alert {
  id: number;
  dir: 'above' | 'below';
  price: number;
  triggered: boolean;
  smsEnabled: boolean;
  autoTrade: boolean;
  tradeAmount: string; // USDT amount as string to match input state
  lastOrder?: OrderResult;
}

export interface OrderResult {
  orderId: number;
  status: string;
  side: string;
  executedQty: string;
  cummulativeQuoteQty: string;
  error?: string;
}
