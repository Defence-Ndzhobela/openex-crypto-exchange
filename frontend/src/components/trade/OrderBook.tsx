import { useMarket } from '../../context/MarketContext.tsx';
import { formatNumber } from '../../utils.ts';
import { cn } from '../../utils.ts';

export default function OrderBook() {
  const { orderBook } = useMarket();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="grid grid-cols-3 px-4 py-2 text-[10px] uppercase tracking-wider text-gray-500 font-bold border-b border-[#222]">
        <span>Price (USD)</span>
        <span className="text-right">Amount (BTC)</span>
        <span className="text-right">Total (BTC)</span>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide py-1">
        {/* Asks (Sells) - Red */}
        <div className="flex flex-col-reverse">
          {orderBook.asks.map((ask, i) => (
            <div key={`ask-${i}`} className="relative grid grid-cols-3 px-4 py-0.5 text-xs group cursor-pointer hover:bg-[#1a1a1a]">
              <div 
                className="absolute inset-0 bg-red-500/10 transition-transform origin-right pointer-events-none" 
                style={{ transform: `scaleX(${Math.min(ask.total / 10, 1)})` }}
              ></div>
              <span className="text-red-400 font-mono z-10">{formatNumber(ask.price, 2)}</span>
              <span className="text-right text-gray-300 font-mono z-10">{formatNumber(ask.quantity, 4)}</span>
              <span className="text-right text-gray-500 font-mono z-10">{formatNumber(ask.total, 4)}</span>
            </div>
          ))}
        </div>

        {/* Current Mid Price */}
        <div className="px-4 py-3 border-y border-[#222] my-2">
          {orderBook.asks[0] && orderBook.bids[0] && (
            <div className="flex items-center gap-2">
              <span className={cn(
                "text-lg font-bold font-mono",
                orderBook.asks[0].price > orderBook.bids[0].price ? "text-green-400" : "text-red-400"
              )}>
                {formatNumber(orderBook.asks[0].price, 2)}
              </span>
              <span className="text-xs text-gray-500">
                ≈ {formatNumber(orderBook.asks[0].price, 2)} USD
              </span>
            </div>
          )}
        </div>

        {/* Bids (Buys) - Green */}
        <div className="flex flex-col">
          {orderBook.bids.map((bid, i) => (
            <div key={`bid-${i}`} className="relative grid grid-cols-3 px-4 py-0.5 text-xs group cursor-pointer hover:bg-[#1a1a1a]">
              <div 
                className="absolute inset-0 bg-green-500/10 transition-transform origin-right pointer-events-none" 
                style={{ transform: `scaleX(${Math.min(bid.total / 10, 1)})` }}
              ></div>
              <span className="text-green-400 font-mono z-10">{formatNumber(bid.price, 2)}</span>
              <span className="text-right text-gray-300 font-mono z-10">{formatNumber(bid.quantity, 4)}</span>
              <span className="text-right text-gray-500 font-mono z-10">{formatNumber(bid.total, 4)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
