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
  status: 'open' | 'closed';
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

export interface PaymentMethod {
  id: string;
  cardLast4: string;
  expiry: string;
  cardholderName: string;
  street: string;
  city: string;
  postalCode: string;
  createdAt: number;
}

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api';
export const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8081/ws/market';
