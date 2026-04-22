import { useMarket } from '../context/MarketContext.tsx';
import PriceChart from '../components/trade/PriceChart.tsx';
import OrderBook from '../components/trade/OrderBook.tsx';
import TradeForm from '../components/trade/TradeForm.tsx';
import TradeFeed from '../components/trade/TradeFeed.tsx';
import { Bitcoin, ChevronDown, Activity, ShieldCheck } from 'lucide-react';
import { cn, formatCurrency } from '../utils.ts';
import { motion } from 'motion/react';

export default function TradePage() {
  const { btcPrice, priceHistory, isConnected } = useMarket();

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
              <button type="button" className="px-4 md:px-6 py-3 text-xs font-bold text-yellow-500 border-b-2 border-yellow-500 shrink-0">
                Open Orders
              </button>
              <button type="button" className="px-4 md:px-6 py-3 text-xs font-bold text-gray-400 hover:text-white shrink-0">
                Order History
              </button>
              <button type="button" className="px-4 md:px-6 py-3 text-xs font-bold text-gray-400 hover:text-white shrink-0">
                Trade History
              </button>
            </div>
            <div className="flex items-center justify-center h-[calc(250px-44px)] text-gray-600 italic text-sm">
              No active orders matching this pair
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
