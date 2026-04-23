import axios from 'axios';
import { API_BASE_URL } from '../types.ts';

const normalizeOrderStatus = (status: unknown): 'open' | 'closed' => {
  return status === 'open' ? 'open' : 'closed';
};

const normalizeOrder = (order: any) => ({
  ...order,
  status: normalizeOrderStatus(order?.status),
});

const PRIMARY_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || API_BASE_URL;
const FALLBACK_API_BASE_URL =
  import.meta.env.VITE_API_FALLBACK_URL || '';

const api = axios.create({
  baseURL: PRIMARY_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const fallbackApi = axios.create({
  baseURL: FALLBACK_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const attachAuthHeader = (config: any) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

// Mocking API for development if server is not reachable
// Note: In production, actual API calls would be used.
api.interceptors.request.use(attachAuthHeader);
fallbackApi.interceptors.request.use(attachAuthHeader);

const shouldRetryWithFallback = (error: any) => {
  const status = error?.response?.status;
  return !error?.response || status === 404 || status === 502 || status === 503 || status === 504;
};

const callApiWithFallback = async <T>(
  primaryCall: () => Promise<T>,
  fallbackCall: () => Promise<T>
): Promise<T> => {
  try {
    return await primaryCall();
  } catch (error) {
    if (!FALLBACK_API_BASE_URL || PRIMARY_API_BASE_URL === FALLBACK_API_BASE_URL || !shouldRetryWithFallback(error)) {
      throw error;
    }
    return fallbackCall();
  }
};

// Auth now uses the Spring Boot backend + Supabase DB.
// Other modules stay mocked until their backend services are implemented.
const USE_REAL_AUTH = true;
const USE_REAL_WALLET = true;
const USE_REAL_ORDERS = true;

export const mockApi = {
  login: async (credentials: any) => {
    if (USE_REAL_AUTH) {
      return callApiWithFallback(
        () => api.post('/auth/login', credentials),
        () => fallbackApi.post('/auth/login', credentials)
      );
    }
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
    if (USE_REAL_AUTH) {
      return callApiWithFallback(
        () => api.post('/auth/register', data),
        () => fallbackApi.post('/auth/register', data)
      );
    }
    await new Promise(r => setTimeout(r, 800));
    return { data: { message: 'Success' } };
  },

  getBalances: async () => {
    if (USE_REAL_WALLET) {
      return callApiWithFallback(
        () => api.get('/wallet/balances'),
        () => fallbackApi.get('/wallet/balances')
      );
    }
    const userJson = localStorage.getItem('user');
    const user = userJson ? JSON.parse(userJson) : null;
    return { data: user?.balances || { BTC: 0, USD: 0 } };
  },

  getTransactions: async () => {
    if (USE_REAL_WALLET) {
      return callApiWithFallback(
        () => api.get('/wallet/transactions'),
        () => fallbackApi.get('/wallet/transactions')
      );
    }
    return { data: [
      { id: '1', type: 'deposit', asset: 'USD', amount: 50000, timestamp: Date.now() - 86400000, description: 'Bank Deposit' },
      { id: '2', type: 'trade', asset: 'BTC', amount: 0.5, timestamp: Date.now() - 43200000, description: 'Bought BTC' },
    ] };
  },

  getPaymentMethods: async () => {
    if (USE_REAL_WALLET) {
      return callApiWithFallback(
        () => api.get('/wallet/payment-methods'),
        () => fallbackApi.get('/wallet/payment-methods')
      );
    }
    return { data: [] };
  },

  addPaymentMethod: async (payload: {
    cardLast4: string;
    expiry: string;
    cardholderName: string;
    street: string;
    city: string;
    postalCode: string;
  }) => {
    if (USE_REAL_WALLET) {
      return callApiWithFallback(
        () => api.post('/wallet/payment-methods', payload),
        () => fallbackApi.post('/wallet/payment-methods', payload)
      );
    }
    return { data: { id: Math.random().toString(36).slice(2), ...payload, createdAt: Date.now() } };
  },

  getOrders: async () => {
    if (USE_REAL_ORDERS) {
      const res = await callApiWithFallback(
        () => api.get('/orders'),
        () => fallbackApi.get('/orders')
      );
      const normalized = Array.isArray(res.data) ? res.data.map(normalizeOrder) : [];
      return { ...res, data: normalized };
    }
    return { data: [
      { id: '101', price: 65000, quantity: 0.1, remaining: 0.1, side: 'buy', type: 'limit', status: 'open', timestamp: Date.now() - 3600000 },
      { id: '102', price: 67000, quantity: 0.05, remaining: 0, side: 'sell', type: 'limit', status: 'closed', timestamp: Date.now() - 7200000 },
    ].map(normalizeOrder) };
  },

  placeOrder: async (order: any) => {
    if (USE_REAL_ORDERS) {
      return callApiWithFallback(
        () => api.post('/orders', order),
        () => fallbackApi.post('/orders', order)
      );
    }
    await new Promise(r => setTimeout(r, 500));
    return { data: { id: Math.random().toString(36).substr(2, 9), ...order, status: 'open', timestamp: Date.now() } };
  },

  cancelOrder: async (orderId: string) => {
    if (USE_REAL_ORDERS) {
      const res = await callApiWithFallback(
        () => api.delete(`/orders/${orderId}`),
        () => fallbackApi.delete(`/orders/${orderId}`)
      );
      const data = res?.data && typeof res.data === 'object'
        ? { ...res.data, status: normalizeOrderStatus((res.data as any).status) }
        : res.data;
      return { ...res, data };
    }
    return { data: { id: orderId, status: 'closed' } };
  },

  faucet: async (amountZar: number = 1000, paymentMethodId?: string) => {
    if (USE_REAL_WALLET) {
      return callApiWithFallback(
        () => api.post('/wallet/faucet', { amountZar, paymentMethodId }),
        () => fallbackApi.post('/wallet/faucet', { amountZar, paymentMethodId })
      );
    }
    const userJson = localStorage.getItem('user');
    if (!userJson) throw new Error('Not logged in');
    const user = JSON.parse(userJson);
    user.balances.BTC += 0.1;
    user.balances.USD += 1000;
    localStorage.setItem('user', JSON.stringify(user));
    return { data: user.balances };
  },

  withdraw: async (amount: number, accountNumber: string, bankName: string) => {
    if (USE_REAL_WALLET) {
      return callApiWithFallback(
        () => api.post('/wallet/withdraw', { amount, accountNumber, bankName }),
        () => fallbackApi.post('/wallet/withdraw', { amount, accountNumber, bankName })
      );
    }

    const userJson = localStorage.getItem('user');
    if (!userJson) throw new Error('Not logged in');
    const user = JSON.parse(userJson);
    if (amount > (user.balances?.USD ?? 0)) {
      throw new Error('Withdrawal amount exceeds available USD balance');
    }

    user.balances.USD -= amount;
    localStorage.setItem('user', JSON.stringify(user));
    return { data: user.balances };
  },

  internalTransfer: async (fromAsset: 'USD' | 'BTC', toAsset: 'USD' | 'BTC', amount: number, btcPrice: number) => {
    if (USE_REAL_WALLET) {
      return callApiWithFallback(
        () => api.post('/wallet/internal-transfer', { fromAsset, toAsset, amount, btcPrice }),
        () => fallbackApi.post('/wallet/internal-transfer', { fromAsset, toAsset, amount, btcPrice })
      );
    }

    const userJson = localStorage.getItem('user');
    if (!userJson) throw new Error('Not logged in');
    const user = JSON.parse(userJson);

    if (!btcPrice || btcPrice <= 0) {
      throw new Error('Invalid BTC price');
    }

    if (fromAsset === toAsset) {
      throw new Error('Source and destination assets must be different');
    }

    if (fromAsset === 'USD' && toAsset === 'BTC') {
      if (amount > (user.balances?.USD ?? 0)) {
        throw new Error('Transfer amount exceeds available USD balance');
      }
      const btcAmount = amount / btcPrice;
      user.balances.USD -= amount;
      user.balances.BTC += btcAmount;
    } else if (fromAsset === 'BTC' && toAsset === 'USD') {
      if (amount > (user.balances?.BTC ?? 0)) {
        throw new Error('Transfer amount exceeds available BTC balance');
      }
      const usdAmount = amount * btcPrice;
      user.balances.BTC -= amount;
      user.balances.USD += usdAmount;
    } else {
      throw new Error('Unsupported transfer pair');
    }

    localStorage.setItem('user', JSON.stringify(user));
    return { data: user.balances };
  },

  settleOrderPnl: async (orderId: string, pnlUsd: number, btcPrice: number) => {
    if (USE_REAL_WALLET) {
      return callApiWithFallback(
        () => api.post('/wallet/order-settlement', { orderId, pnlUsd, btcPrice }),
        () => fallbackApi.post('/wallet/order-settlement', { orderId, pnlUsd, btcPrice })
      );
    }

    const userJson = localStorage.getItem('user');
    if (!userJson) throw new Error('Not logged in');
    const user = JSON.parse(userJson);

    if (!btcPrice || btcPrice <= 0) {
      throw new Error('Invalid BTC price');
    }

    const btcDelta = pnlUsd / btcPrice;
    const nextBtcBalance = (user.balances?.BTC ?? 0) + btcDelta;
    if (nextBtcBalance < 0) {
      throw new Error('Insufficient BTC balance for loss settlement');
    }

    user.balances.BTC = nextBtcBalance;
    localStorage.setItem('user', JSON.stringify(user));
    return { data: user.balances };
  }
};

export default api;
