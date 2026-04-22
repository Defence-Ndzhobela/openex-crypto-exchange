import axios from 'axios';
import { API_BASE_URL } from '../types.ts';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Mocking API for development if server is not reachable
// Note: In production, actual API calls would be used.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth now uses the Spring Boot backend + Supabase DB.
// Other modules stay mocked until their backend services are implemented.
const USE_REAL_AUTH = true;
const USE_REAL_WALLET = false;
const USE_REAL_ORDERS = false;

export const mockApi = {
  login: async (credentials: any) => {
    if (USE_REAL_AUTH) return api.post('/auth/login', credentials);
    // Simulate API delay
    await new Promise(r => setTimeout(r, 800));
    const user = {
      id: '1',
      name: 'John Doe',
      email: credentials.email,
      balances: { BTC: 0.5, USD: 25000.0 }
    };
    localStorage.setItem('token', 'mock-token');
    localStorage.setItem('user', JSON.stringify(user));
    return { data: { user, token: 'mock-token' } };
  },
  
  register: async (data: any) => {
    if (USE_REAL_AUTH) return api.post('/auth/register', data);
    await new Promise(r => setTimeout(r, 800));
    return { data: { message: 'Success' } };
  },

  getBalances: async () => {
    if (USE_REAL_WALLET) return api.get('/wallet/balances');
    const userJson = localStorage.getItem('user');
    const user = userJson ? JSON.parse(userJson) : null;
    return { data: user?.balances || { BTC: 0, USD: 0 } };
  },

  getTransactions: async () => {
    if (USE_REAL_WALLET) return api.get('/wallet/transactions');
    return { data: [
      { id: '1', type: 'deposit', asset: 'USD', amount: 50000, timestamp: Date.now() - 86400000, description: 'Bank Deposit' },
      { id: '2', type: 'trade', asset: 'BTC', amount: 0.5, timestamp: Date.now() - 43200000, description: 'Bought BTC' },
    ] };
  },

  getOrders: async () => {
    if (USE_REAL_ORDERS) return api.get('/orders');
    return { data: [
      { id: '101', price: 65000, quantity: 0.1, remaining: 0.1, side: 'buy', type: 'limit', status: 'open', timestamp: Date.now() - 3600000 },
      { id: '102', price: 67000, quantity: 0.05, remaining: 0, side: 'sell', type: 'limit', status: 'completed', timestamp: Date.now() - 7200000 },
    ] };
  },

  placeOrder: async (order: any) => {
    if (USE_REAL_ORDERS) return api.post('/orders', order);
    await new Promise(r => setTimeout(r, 500));
    return { data: { id: Math.random().toString(36).substr(2, 9), ...order, status: 'open', timestamp: Date.now() } };
  },

  faucet: async () => {
    if (USE_REAL_WALLET) return api.post('/wallet/faucet');
    const userJson = localStorage.getItem('user');
    if (!userJson) throw new Error('Not logged in');
    const user = JSON.parse(userJson);
    user.balances.BTC += 0.1;
    user.balances.USD += 1000;
    localStorage.setItem('user', JSON.stringify(user));
    return { data: user.balances };
  }
};

export default api;
