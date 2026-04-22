import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Trade, OrderBook, WS_BASE_URL } from '../types.ts';

interface MarketContextType {
  btcPrice: number;
  priceHistory: number[];
  recentTrades: Trade[];
  orderBook: OrderBook;
  isConnected: boolean;
}

const MarketContext = createContext<MarketContextType | undefined>(undefined);

export function MarketProvider({ children }: { children: React.ReactNode }) {
  const [btcPrice, setBtcPrice] = useState(64250.5);
  const [priceHistory, setPriceHistory] = useState<number[]>([]);
  const [recentTrades, setRecentTrades] = useState<Trade[]>([]);
  const [orderBook, setOrderBook] = useState<OrderBook>({ bids: [], asks: [] });
  const [isConnected, setIsConnected] = useState(false);
  
  const socketRef = useRef<WebSocket | null>(null);

  // Simulated WebSocket updates if server is not reachable
  const simulateMarket = useCallback(() => {
    const interval = setInterval(() => {
      setBtcPrice(prev => {
        const change = (Math.random() - 0.5) * 50;
        const newPrice = prev + change;
        setPriceHistory(h => [...h.slice(-49), newPrice]);
        return newPrice;
      });

      // New trade
      const side = Math.random() > 0.5 ? 'buy' : 'sell';
      const newTrade: Trade = {
        id: Math.random().toString(36).substr(2, 9),
        price: btcPrice + (Math.random() - 0.5) * 10,
        quantity: Math.random() * 0.5,
        side,
        timestamp: Date.now()
      };
      setRecentTrades(prev => [newTrade, ...prev.slice(0, 19)]);

      // Order book simulation
      const bids = Array.from({ length: 15 }).map((_, i) => ({
        price: btcPrice - (i + 1) * 2,
        quantity: Math.random() * 2,
        total: 0
      })).map((b, i, arr) => ({ ...b, total: arr.slice(0, i + 1).reduce((acc, curr) => acc + curr.quantity, 0) }));

      const asks = Array.from({ length: 15 }).map((_, i) => ({
        price: btcPrice + (i + 1) * 2,
        quantity: Math.random() * 2,
        total: 0
      })).map((a, i, arr) => ({ ...a, total: arr.slice(0, i + 1).reduce((acc, curr) => acc + curr.quantity, 0) }));

      setOrderBook({ bids, asks });
    }, 1000);

    return () => clearInterval(interval);
  }, [btcPrice]);

  useEffect(() => {
    // Try to connect to real WS
    const socket = new WebSocket(WS_BASE_URL);
    socketRef.current = socket;

    socket.onopen = () => {
      setIsConnected(true);
      console.log('WS Connected');
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'ticker') setBtcPrice(data.price);
        if (data.type === 'orderbook') setOrderBook(data.orderBook);
        if (data.type === 'trade') setRecentTrades(prev => [data.trade, ...prev.slice(0, 19)]);
      } catch (e) {
        console.error('WS Error parsing message', e);
      }
    };

    socket.onerror = () => {
      console.log('WS Connection error, falling back to simulation');
      setIsConnected(false);
    };

    socket.onclose = () => {
      setIsConnected(false);
    };

    const cleanupSim = simulateMarket();

    return () => {
      socket.close();
      cleanupSim();
    };
  }, [simulateMarket]);

  return (
    <MarketContext.Provider value={{ btcPrice, priceHistory, recentTrades, orderBook, isConnected }}>
      {children}
    </MarketContext.Provider>
  );
}

export function useMarket() {
  const context = useContext(MarketContext);
  if (context === undefined) {
    throw new Error('useMarket must be used within a MarketProvider');
  }
  return context;
}
