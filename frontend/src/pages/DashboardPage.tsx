import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useMarket } from '../context/MarketContext.tsx';
import PriceChart from '../components/trade/PriceChart.tsx';
import TradeFeed from '../components/trade/TradeFeed.tsx';
import { Bitcoin, Wallet, ArrowUpRight, TrendingUp, ListTodo } from 'lucide-react';
import { formatCurrency, formatNumber } from '../utils.ts';
import { motion } from 'motion/react';
import { mockApi } from '../services/api.ts';
import { Order, Transaction } from '../types.ts';
import { Link } from 'react-router-dom';

export default function DashboardPage() {
  const { user } = useAuth();
  const { btcPrice, priceHistory } = useMarket();
  const [orders, setOrders] = useState<Order[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const [ordersRes, txRes] = await Promise.all([
          mockApi.getOrders(),
          mockApi.getTransactions(),
        ]);
        setOrders(ordersRes.data || []);
        setTransactions(txRes.data || []);
      } catch {
        setOrders([]);
        setTransactions([]);
      }
    };

    loadSummary();
  }, []);

  const summary = useMemo(() => {
    const openOrders = orders.filter((order) => order.status === 'open');
    const closedOrders = orders.filter((order) => order.status === 'closed');
    const recentTrades = transactions
      .filter((tx) => tx.type === 'trade')
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 3);

    return {
      openOrdersCount: openOrders.length,
      closedOrdersCount: closedOrders.length,
      recentTrades,
    };
  }, [orders, transactions]);

  if (!user) return null;

  const btcValueInUsd = user.balances.BTC * btcPrice;
  const totalBalance = user.balances.USD + btcValueInUsd;

  return (
    <div className="max-w-screen-2xl mx-auto px-4 lg:px-6 py-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row gap-6 mb-8"
      >
        {/* Wallet Overview */}
        <div className="flex-1 space-y-6">
          <div className="bg-[#111] border border-[#222] rounded-2xl p-6 shadow-xl overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
              <Wallet className="w-48 h-48 rotate-12" />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <Wallet className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-widest">Total Balance</span>
              </div>
              <h2 className="text-4xl font-bold text-white mb-6">
                {formatCurrency(totalBalance)}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#1a1a1a] rounded-xl p-4 border border-[#333] hover:border-yellow-500/30 transition-colors">
                  <div className="flex items-center gap-2 text-yellow-500 mb-2">
                    <Bitcoin className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase">Bitcoin (BTC)</span>
                  </div>
                  <div className="text-xl font-bold font-mono">{formatNumber(user.balances.BTC, 4)}</div>
                  <div className="text-xs text-gray-500">≈ {formatCurrency(btcValueInUsd)}</div>
                </div>
                
                <div className="bg-[#1a1a1a] rounded-xl p-4 border border-[#333] hover:border-green-500/30 transition-colors">
                  <div className="flex items-center gap-2 text-green-500 mb-2">
                    <span className="font-bold font-mono">$</span>
                    <span className="text-[10px] font-bold uppercase">US Dollar (USD)</span>
                  </div>
                  <div className="text-xl font-bold font-mono">{formatNumber(user.balances.USD, 2)}</div>
                  <div className="text-xs text-gray-500">Available</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#111] border border-[#222] rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <ListTodo className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Quick Summary</h3>
                  <p className="text-xs text-gray-500">Recent trades and open orders</p>
                </div>
              </div>
              <Link to="/orders" className="text-xs text-yellow-500 font-bold uppercase tracking-wider hover:underline">
                View all
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-5">
              <div className="bg-[#1a1a1a] border border-[#2b2b2b] rounded-xl p-4">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Open Orders</p>
                <p className="text-2xl font-black text-white mt-1">{summary.openOrdersCount}</p>
              </div>
              <div className="bg-[#1a1a1a] border border-[#2b2b2b] rounded-xl p-4">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Closed Orders</p>
                <p className="text-2xl font-black text-white mt-1">{summary.closedOrdersCount}</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Recent Trades</p>
              {summary.recentTrades.length > 0 ? (
                summary.recentTrades.map((trade) => (
                  <div key={trade.id} className="flex items-center justify-between bg-[#1a1a1a] border border-[#2b2b2b] rounded-lg px-3 py-2">
                    <div>
                      <p className="text-xs font-semibold text-white">{trade.description}</p>
                      <p className="text-[11px] text-gray-500">{new Date(trade.timestamp).toLocaleTimeString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-mono text-gray-200">{formatNumber(trade.amount, trade.asset === 'BTC' ? 4 : 2)} {trade.asset}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-[#1a1a1a] border border-[#2b2b2b] rounded-lg px-3 py-3 text-xs text-gray-500">
                  No recent trades yet.
                </div>
              )}
            </div>
          </div>

          <div className="bg-[#111] border border-[#222] rounded-2xl p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-yellow-500/10 rounded-lg">
                  <Bitcoin className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <h3 className="font-bold text-white">BTC / USD</h3>
                  <p className="text-xs text-gray-500">Real-time market price</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold font-mono text-green-400">{formatCurrency(btcPrice)}</div>
                <div className="flex items-center justify-end gap-1 text-[10px] text-green-400">
                  <TrendingUp className="w-3 h-3" />
                  <span>+2.45%</span>
                </div>
              </div>
            </div>
            <div className="h-[250px]">
              <PriceChart data={priceHistory} height={250} />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-[380px] space-y-6">
          <div className="bg-[#111] border border-[#222] rounded-2xl overflow-hidden shadow-xl flex flex-col h-[525px]">
            <div className="p-4 border-b border-[#222] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-yellow-500" />
              <h3 className="font-bold text-sm text-gray-200">Recent Market Trades</h3>
            </div>
            <div className="flex-1">
              <TradeFeed />
            </div>
          </div>

          <Link to="/trade" className="block bg-yellow-500 rounded-2xl p-6 h-[120px] shadow-lg shadow-yellow-500/10 hover:shadow-yellow-500/20 transition-all cursor-pointer group">
            <div className="flex justify-between items-start">
              <h3 className="font-bold text-black uppercase tracking-widest text-xs">Ready to trade?</h3>
              <div className="bg-black/10 rounded-full p-2 group-hover:rotate-12 transition-transform">
                <ArrowUpRight className="w-4 h-4 text-black" />
              </div>
            </div>
            <div className="text-2xl font-black text-black italic uppercase">Go to Exchange</div>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
