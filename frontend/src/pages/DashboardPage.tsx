import { useAuth } from '../context/AuthContext.tsx';
import { useMarket } from '../context/MarketContext.tsx';
import PriceChart from '../components/trade/PriceChart.tsx';
import TradeFeed from '../components/trade/TradeFeed.tsx';
import { Bitcoin, Wallet, ArrowUpRight, ArrowDownLeft, TrendingUp } from 'lucide-react';
import { formatCurrency, formatNumber } from '../utils.ts';
import { motion } from 'motion/react';

export default function DashboardPage() {
  const { user } = useAuth();
  const { btcPrice, priceHistory } = useMarket();

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

          <div className="bg-yellow-500 rounded-2xl p-6 flex flex-col justify-between h-[120px] shadow-lg shadow-yellow-500/10 hover:shadow-yellow-500/20 transition-all cursor-pointer group">
            <div className="flex justify-between items-start">
              <h3 className="font-bold text-black uppercase tracking-widest text-xs">Ready to trade?</h3>
              <div className="bg-black/10 rounded-full p-2 group-hover:rotate-12 transition-transform">
                <ArrowUpRight className="w-4 h-4 text-black" />
              </div>
            </div>
            <div className="text-2xl font-black text-black italic uppercase">Go to Exchange</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
