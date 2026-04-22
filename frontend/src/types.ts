export interface User {
  id: string;
  name: string;
  email: string;
  balances: {
    BTC: number;
    USD: number;
  };
}

export interface Trade {
  id: string;
  price: number;
  quantity: number;
  side: 'buy' | 'sell';
  timestamp: number;
}

export interface Order {
  id: string;
  price: number;
  quantity: number;
  remaining: number;
  side: 'buy' | 'sell';
  type: 'market' | 'limit';
  status: 'open' | 'completed' | 'cancelled';
  timestamp: number;
}

export interface OrderBookEntry {
  price: number;
  quantity: number;
  total: number;
}

export interface OrderBook {
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
}

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'trade';
  asset: 'BTC' | 'USD';
  amount: number;
  timestamp: number;
  description: string;
}

export const API_BASE_URL = 'http://localhost:8080/api';
export const WS_BASE_URL = 'ws://localhost:8080/ws/market';
