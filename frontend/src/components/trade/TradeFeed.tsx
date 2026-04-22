import { useMarket } from '../../context/MarketContext.tsx';
import { formatNumber } from '../../utils.ts';
import { cn } from '../../utils.ts';
import { PanelState } from '../ui/FeedbackStates.tsx';

export default function TradeFeed() {
  const { recentTrades } = useMarket();

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="grid grid-cols-3 px-4 py-2 text-[10px] uppercase tracking-wider text-gray-500 font-bold border-b border-[#222]">
        <span>Price (USD)</span>
        <span className="text-right">Amount (BTC)</span>
        <span className="text-right">Time</span>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {recentTrades.length === 0 ? (
          <PanelState title="No trades yet" description="Recent market trades will stream here in real-time." />
        ) : (
          recentTrades.map((trade) => (
            <div key={trade.id} className="grid grid-cols-3 px-4 py-1.5 text-[11px] group transition-colors hover:bg-[#1a1a1a]">
              <span className={cn(
                "font-mono font-medium",
                trade.side === 'buy' ? "text-green-400" : "text-red-400"
              )}>
                {formatNumber(trade.price, 2)}
              </span>
              <span className="text-right text-gray-300 font-mono">
                {formatNumber(trade.quantity, 4)}
              </span>
              <span className="text-right text-gray-500 font-mono">
                {new Date(trade.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
