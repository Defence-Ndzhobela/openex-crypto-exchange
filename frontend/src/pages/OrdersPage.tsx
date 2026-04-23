import { useState, useEffect } from 'react';
import { mockApi } from '../services/api.ts';
import { Order } from '../types.ts';
import { useMarket } from '../context/MarketContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { ListTodo, Trash2, CheckCircle2, Bitcoin } from 'lucide-react';
import { formatCurrency, formatNumber, formatDate } from '../utils.ts';
import { cn } from '../utils.ts';
import { motion } from 'motion/react';
import { PanelState, RowsSkeleton } from '../components/ui/FeedbackStates.tsx';

const CLOSED_PROFIT_STORAGE_KEY = 'openex_closed_profit_by_order_id';

export default function OrdersPage() {
  const { btcPrice } = useMarket();
  const { updateBalances } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<'all' | 'open' | 'closed'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await mockApi.getOrders();
        setOrders(res.data);
      } catch (err: any) {
        setError(err.message || 'Failed to load order history');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter(o => {
    if (filter === 'all') return true;
    if (filter === 'open') return o.status === 'open';
    return o.status === 'closed';
  });

  const handleCancelOrder = async (orderId: string) => {
    const closingOrder = orders.find((order) => order.id === orderId);
    const closingProfit = closingOrder
      ? ((closingOrder.side === 'buy' ? (btcPrice - closingOrder.price) : (closingOrder.price - btcPrice)) * closingOrder.quantity)
      : 0;

    try {
      await mockApi.cancelOrder(orderId);
      await mockApi.settleOrderPnl(orderId, closingProfit, btcPrice);
      setOrders((prev) => prev.map((order) =>
        order.id === orderId ? { ...order, status: 'closed' as const } : order
      ));
      await updateBalances();

      try {
        const raw = localStorage.getItem(CLOSED_PROFIT_STORAGE_KEY);
        const current = raw ? JSON.parse(raw) : {};
        const next = { ...(current && typeof current === 'object' ? current : {}), [orderId]: closingProfit };
        localStorage.setItem(CLOSED_PROFIT_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore localStorage errors and still proceed with cancel flow.
      }
    } catch (err: any) {
      setError(err.message || 'Failed to cancel order');
    }
  };

  return (
    <div className="max-w-screen-xl mx-auto px-4 lg:px-6 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3 italic">
            <ListTodo className="w-8 h-8 text-yellow-500 not-italic" />
            ORDERS
          </h1>
          <p className="text-gray-500 text-sm mt-1 uppercase tracking-widest font-bold">Manage your active and past trades</p>
        </div>

        <div className="flex bg-[#111] border border-[#222] p-1 rounded-xl">
          <button
            onClick={() => setFilter('all')}
            className={cn(
              "px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
              filter === 'all' ? "bg-[#222] text-white shadow-lg" : "text-gray-500 hover:text-gray-300"
            )}
          >
            All
          </button>
          <button
            onClick={() => setFilter('open')}
            className={cn(
              "px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
              filter === 'open' ? "bg-[#222] text-white shadow-lg" : "text-gray-500 hover:text-gray-300"
            )}
          >
            Open
          </button>
          <button
            onClick={() => setFilter('closed')}
            className={cn(
              "px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
              filter === 'closed' ? "bg-[#222] text-white shadow-lg" : "text-gray-500 hover:text-gray-300"
            )}
          >
            Closed
          </button>
        </div>
      </div>

      <div className="bg-[#111] border border-[#222] rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <RowsSkeleton rows={8} />
          ) : error ? (
            <PanelState
              type="error"
              title="Could not load orders"
              description={error}
              action={
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="px-3 py-1.5 rounded-md text-xs font-semibold bg-red-500/15 text-red-300 hover:bg-red-500/20 transition-colors"
                >
                  Refresh
                </button>
              }
            />
          ) : (
          <table className="w-full text-left" aria-label="Orders table">
            <thead className="bg-[#1a1a1a] text-[10px] uppercase font-bold text-gray-500 tracking-wider">
              <tr>
                <th className="px-8 py-5">Order ID</th>
                <th className="px-8 py-5">Pair</th>
                <th className="px-8 py-5">Side</th>
                <th className="px-8 py-5">Type</th>
                <th className="px-8 py-5">Price</th>
                <th className="px-8 py-5">Amount</th>
                <th className="px-8 py-5">Executed</th>
                <th className="px-8 py-5">Date</th>
                <th className="px-8 py-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222]">
              {filteredOrders.map((order, idx) => (
                <motion.tr 
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="hover:bg-[#1a1a1a]/50 transition-colors group"
                >
                  <td className="px-8 py-5">
                    <span className="font-mono text-[11px] text-gray-500 group-hover:text-yellow-500/70 transition-colors">#{order.id}</span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2">
                        <Bitcoin className="w-4 h-4 text-yellow-500" />
                        <span className="font-bold text-white text-xs">BTC / USD</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className={cn(
                      "text-[10px] font-black uppercase px-2 py-1 rounded tracking-tighter",
                      order.side === 'buy' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                    )}>
                      {order.side}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-xs text-gray-400 capitalize">{order.type}</span>
                  </td>
                  <td className="px-8 py-5 font-mono text-sm font-medium text-white">
                    {formatCurrency(order.price)}
                  </td>
                  <td className="px-8 py-5 font-mono text-sm text-gray-300">
                    {formatNumber(order.quantity, 4)}
                  </td>
                  <td className="px-8 py-5">
                    <div className="w-24">
                        <div className="flex justify-between text-[10px] text-gray-500 mb-1 font-bold italic">
                            <span>{Math.round(((order.quantity - order.remaining) / order.quantity) * 100)}%</span>
                        </div>
                        <div className="h-1 bg-[#222] rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-yellow-500" 
                                style={{ width: `${((order.quantity - order.remaining) / order.quantity) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-gray-500 text-xs font-mono">
                    {formatDate(order.timestamp)}
                  </td>
                  <td className="px-8 py-5 text-right">
                    {order.status === 'open' ? (
                      <button
                        type="button"
                        aria-label={`Cancel order ${order.id}`}
                        onClick={() => handleCancelOrder(order.id)}
                        className="p-2 text-gray-500 hover:text-red-500 transition-colors rounded-lg hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    ) : (
                      <div className="flex items-center justify-end gap-1.5 text-green-500 opacity-70">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Closed</span>
                      </div>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          )}
          {!loading && !error && filteredOrders.length === 0 && (
            <PanelState
              title="No orders found"
              description={`No ${filter !== 'all' ? filter : ''} orders match your current filter.`}
            />
          )}
        </div>
      </div>
    </div>
  );
}
