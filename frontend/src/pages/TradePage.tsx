import { useEffect, useMemo, useState } from 'react';
import { useMarket } from '../context/MarketContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import PriceChart from '../components/trade/PriceChart.tsx';
import OrderBook from '../components/trade/OrderBook.tsx';
import TradeForm from '../components/trade/TradeForm.tsx';
import TradeFeed from '../components/trade/TradeFeed.tsx';
import { Bitcoin, ChevronDown, Activity, ShieldCheck } from 'lucide-react';
import { mockApi } from '../services/api.ts';
import { Order } from '../types.ts';
import { cn, formatCurrency, formatDate, formatNumber } from '../utils.ts';
import { motion } from 'motion/react';

const CLOSED_PROFIT_STORAGE_KEY = 'openex_closed_profit_by_order_id';

export default function TradePage() {
  const { btcPrice, priceHistory, isConnected } = useMarket();
  const { updateBalances } = useAuth();
  const [activeTab, setActiveTab] = useState<'open' | 'history'>('open');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [closingOrderId, setClosingOrderId] = useState<string | null>(null);
  const [closingAll, setClosingAll] = useState(false);
  const [closedProfitById, setClosedProfitById] = useState<Record<string, number>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CLOSED_PROFIT_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        setClosedProfitById(parsed as Record<string, number>);
      }
    } catch {
      // Ignore corrupted local storage payloads.
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(CLOSED_PROFIT_STORAGE_KEY, JSON.stringify(closedProfitById));
  }, [closedProfitById]);

  useEffect(() => {
    if (orders.length === 0) return;

    const missingClosedSnapshots = orders
      .filter((order) => order.status !== 'open' && closedProfitById[order.id] === undefined)
      .reduce<Record<string, number>>((acc, order) => {
        acc[order.id] = getOrderProfitUsd(order);
        return acc;
      }, {});

    if (Object.keys(missingClosedSnapshots).length > 0) {
      setClosedProfitById((prev) => ({ ...prev, ...missingClosedSnapshots }));
    }
  }, [orders, closedProfitById]);

  useEffect(() => {
    let mounted = true;

    const fetchOrders = async (showLoading = false) => {
      if (showLoading && mounted) {
        setLoadingOrders(true);
      }

      try {
        const res = await mockApi.getOrders();
        if (!mounted) return;
        setOrders(Array.isArray(res.data) ? res.data : []);
        setOrdersError(null);
      } catch (err: any) {
        if (!mounted) return;
        setOrdersError(err?.message || 'Failed to load orders');
      } finally {
        if (mounted) {
          setLoadingOrders(false);
        }
      }
    };

    fetchOrders(true);
    const interval = window.setInterval(() => fetchOrders(false), 5000);

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  const tabRows = useMemo(() => {
    if (activeTab === 'open') {
      return orders.filter((order) => order.status === 'open');
    }

    return orders.filter((order) => order.status === 'closed');
  }, [activeTab, orders]);

  const openOrders = useMemo(() => orders.filter((order) => order.status === 'open'), [orders]);

  const getOrderProfitUsd = (order: Order) => {
    const pnlPerBtc = order.side === 'buy' ? btcPrice - order.price : order.price - btcPrice;
    return pnlPerBtc * order.quantity;
  };

  const handleCloseOrder = async (orderId: string) => {
    const closingOrder = orders.find((order) => order.id === orderId);
    const closingProfit = closingOrder ? getOrderProfitUsd(closingOrder) : 0;

    setClosingOrderId(orderId);
    setOrdersError(null);
    try {
      await mockApi.cancelOrder(orderId);
      await mockApi.settleOrderPnl(orderId, closingProfit, btcPrice);
      setOrders((prev) => prev.map((order) => (
        order.id === orderId ? { ...order, status: 'closed' } : order
      )));
      setClosedProfitById((prev) => ({ ...prev, [orderId]: closingProfit }));
      await updateBalances();
    } catch (err: any) {
      setOrdersError(err?.message || 'Failed to close order');
    } finally {
      setClosingOrderId(null);
    }
  };

  const handleCloseAllOpenOrders = async () => {
    if (openOrders.length === 0) return;

    const closeProfitSnapshot = openOrders.reduce<Record<string, number>>((acc, order) => {
      acc[order.id] = getOrderProfitUsd(order);
      return acc;
    }, {});

    setClosingAll(true);
    setOrdersError(null);
    try {
      await Promise.all(openOrders.map(async (order) => {
        await mockApi.cancelOrder(order.id);
        await mockApi.settleOrderPnl(order.id, closeProfitSnapshot[order.id] ?? 0, btcPrice);
      }));
      setOrders((prev) => prev.map((order) => (
        order.status === 'open' ? { ...order, status: 'closed' } : order
      )));
      setClosedProfitById((prev) => ({ ...prev, ...closeProfitSnapshot }));
      await updateBalances();
    } catch (err: any) {
      setOrdersError(err?.message || 'Failed to close all open orders');
    } finally {
      setClosingAll(false);
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)] md:h-[calc(100vh-64px)] overflow-hidden bg-[#0a0a0a]">
      {/* Trading Header Stats */}
      <div className="bg-[#111] border-b border-[#222] px-4 min-h-12 py-2 md:py-0 md:h-12 flex items-center gap-8 overflow-x-auto scrollbar-hide shrink-0">
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 px-2 py-1 bg-[#1a1a1a] rounded border border-[#333]">
            <Bitcoin className="w-4 h-4 text-yellow-500" />
            <span className="text-xs font-bold text-white">BTC / USD</span>
            <ChevronDown className="w-3 h-3 text-gray-500" />
          </div>
          <span className="text-sm font-mono font-bold text-green-400">{formatCurrency(btcPrice)}</span>
        </div>

        <div className="flex items-center gap-6 shrink-0 text-[10px] tracking-tight">
          <div className="flex flex-col">
            <span className="text-gray-500 uppercase font-bold">24h Change</span>
            <span className="text-green-400 font-mono">+1,245.20 (+2.45%)</span>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-500 uppercase font-bold">24h High</span>
            <span className="text-gray-300 font-mono">65,840.00</span>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-500 uppercase font-bold">24h Low</span>
            <span className="text-gray-300 font-mono">62,120.50</span>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-500 uppercase font-bold">24h Vol (BTC)</span>
            <span className="text-gray-300 font-mono">1,452.88 BTC</span>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-4 shrink-0">
          <div className={cn(
            "flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border",
            isConnected ? 'text-green-500 bg-green-500/10 border-green-500/20' : 'text-orange-400 bg-orange-500/10 border-orange-500/20'
          )}>
            <Activity className="w-3 h-3" />
            <span className="font-bold uppercase">{isConnected ? 'Live Feed' : 'Simulated Feed'}</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-gray-400">
            <ShieldCheck className="w-3 h-3" />
            <span className="font-bold uppercase">Secured</span>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left: Chart and Tabs */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-[#222]">
          <div className="flex-1 p-4 overflow-hidden relative">
            <div className="absolute top-6 left-8 z-10 flex flex-col">
                <span className="text-xs text-gray-500 uppercase font-bold tracking-widest">Market Price</span>
                <span className="text-2xl font-black text-white font-mono">{formatCurrency(btcPrice)}</span>
            </div>
            <PriceChart data={priceHistory} height={undefined} />
          </div>
          
          <div className="h-[260px] md:h-[250px] border-t border-[#222] bg-[#111]">
            <div className="flex border-b border-[#222]">
              <button
                type="button"
                onClick={() => setActiveTab('open')}
                className={cn(
                  'px-4 md:px-6 py-3 text-xs font-bold border-b-2 shrink-0',
                  activeTab === 'open' ? 'text-yellow-500 border-yellow-500' : 'text-gray-400 border-transparent hover:text-white'
                )}
              >
                Open Orders
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={cn(
                  'px-4 md:px-6 py-3 text-xs font-bold border-b-2 shrink-0',
                  activeTab === 'history' ? 'text-yellow-500 border-yellow-500' : 'text-gray-400 border-transparent hover:text-white'
                )}
              >
                Order History
              </button>
              {activeTab === 'open' && (
                <button
                  type="button"
                  onClick={handleCloseAllOpenOrders}
                  disabled={closingAll || openOrders.length === 0}
                  className="ml-auto mr-2 my-1 rounded-md border border-red-500/30 px-3 text-[10px] font-bold uppercase tracking-wider text-red-300 transition-colors hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {closingAll ? 'Closing...' : 'Close All Open'}
                </button>
              )}
            </div>
            <div className="h-[calc(250px-44px)] overflow-y-auto">
              {loadingOrders ? (
                <div className="flex h-full items-center justify-center text-sm text-gray-500">Loading orders...</div>
              ) : ordersError ? (
                <div className="flex h-full items-center justify-center px-4 text-center text-sm text-red-400">{ordersError}</div>
              ) : tabRows.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-gray-600 italic">
                  {activeTab === 'open' ? 'No active orders matching this pair' : 'No order history yet'}
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead className="sticky top-0 bg-[#151515] text-[10px] uppercase tracking-wider text-gray-500">
                    <tr>
                      <th className="px-4 py-2">Side</th>
                      <th className="px-4 py-2">Price</th>
                      <th className="px-4 py-2">Amount</th>
                      <th className="px-4 py-2">Profit</th>
                      <th className="px-4 py-2">Status</th>
                      <th className="px-4 py-2 text-right">Action</th>
                      <th className="px-4 py-2 text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#222] text-xs">
                    {tabRows.slice(0, 12).map((order) => {
                      const isOpenOrder = order.status === 'open';
                      const frozenClosedProfit = closedProfitById[order.id];
                      const hasFrozenClosedProfit = frozenClosedProfit !== undefined;
                      const profitUsd = isOpenOrder ? getOrderProfitUsd(order) : (hasFrozenClosedProfit ? frozenClosedProfit : 0);
                      const profitSign = profitUsd > 0 ? '+' : profitUsd < 0 ? '-' : '';
                      return (
                      <tr key={order.id}>
                        <td className={cn('px-4 py-2 font-bold uppercase', order.side === 'buy' ? 'text-green-400' : 'text-red-400')}>
                          {order.side}
                        </td>
                        <td className="px-4 py-2 font-mono text-gray-200">{formatCurrency(order.price)}</td>
                        <td className="px-4 py-2 font-mono text-gray-300">{formatNumber(order.quantity, 4)} BTC</td>
                        <td className={cn('px-4 py-2 font-mono font-semibold', profitUsd > 0 ? 'text-green-400' : profitUsd < 0 ? 'text-red-400' : 'text-gray-500')}>
                          {`${profitSign}${formatCurrency(Math.abs(profitUsd))}`}
                        </td>
                        <td className="px-4 py-2 capitalize text-gray-400">{order.status}</td>
                        <td className="px-4 py-2 text-right">
                          {order.status === 'open' ? (
                            <button
                              type="button"
                              onClick={() => handleCloseOrder(order.id)}
                              disabled={closingAll || closingOrderId === order.id}
                              className="rounded-md border border-red-500/30 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-red-300 transition-colors hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {closingOrderId === order.id ? 'Closing...' : 'Close'}
                            </button>
                          ) : (
                            <span className="text-[10px] text-gray-600">-</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-right font-mono text-gray-500">{formatDate(order.timestamp)}</td>
                      </tr>
                    );})}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Middle: Order Book */}
        <div className="w-full lg:w-[320px] h-[360px] lg:h-auto shrink-0 border-r border-[#222] bg-[#0a0a0a] flex flex-col">
          <OrderBook />
        </div>

        {/* Right: Trade Form and Feeds */}
        <div className="w-full lg:w-[320px] shrink-0 bg-[#0a0a0a] flex flex-col min-h-[650px] lg:min-h-0">
          <div className="flex-1 overflow-y-auto overflow-x-hidden border-b border-[#222]">
            <TradeForm />
          </div>
          <div className="h-[280px] md:h-[300px] flex flex-col shrink-0">
            <div className="px-4 py-3 border-b border-[#222] bg-[#111]">
                <h4 className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Market Trades</h4>
            </div>
            <div className="flex-1">
                <TradeFeed />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
