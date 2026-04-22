import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useMarket } from '../../context/MarketContext.tsx';
import { mockApi } from '../../services/api.ts';
import { cn, formatNumber } from '../../utils.ts';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export default function TradeForm() {
  const { user, updateBalances } = useAuth();
  const { btcPrice } = useMarket();
  
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [orderType, setOrderType] = useState<'market' | 'limit'>('limit');
  const [price, setPrice] = useState(btcPrice.toFixed(2));
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const total = orderType === 'market' 
    ? (parseFloat(quantity || '0') * btcPrice).toFixed(2)
    : (parseFloat(quantity || '0') * parseFloat(price || '0')).toFixed(2);

  const handleTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    setMessage(null);

    try {
      await mockApi.placeOrder({
        side,
        type: orderType,
        price: orderType === 'market' ? btcPrice : parseFloat(price),
        quantity: parseFloat(quantity),
      });
      
      setMessage({ type: 'success', text: 'Order placed successfully!' });
      setQuantity('');
      updateBalances();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to place order' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 flex flex-col gap-4 h-full">
      <div className="grid grid-cols-2 gap-2 bg-[#222] p-1 rounded-lg">
        <button
          onClick={() => setSide('buy')}
          className={cn(
            "py-2 rounded-md font-bold transition-all",
            side === 'buy' ? "bg-green-500 text-white shadow-lg" : "text-gray-400 hover:text-white"
          )}
        >
          Buy
        </button>
        <button
          onClick={() => setSide('sell')}
          className={cn(
            "py-2 rounded-md font-bold transition-all",
            side === 'sell' ? "bg-red-500 text-white shadow-lg" : "text-gray-400 hover:text-white"
          )}
        >
          Sell
        </button>
      </div>

      <div className="flex gap-4 border-b border-[#222]">
        <button
          onClick={() => setOrderType('limit')}
          className={cn(
            "pb-2 text-sm font-medium transition-colors border-b-2",
            orderType === 'limit' ? "border-yellow-500 text-yellow-500" : "border-transparent text-gray-500 hover:text-white"
          )}
        >
          Limit
        </button>
        <button
          onClick={() => setOrderType('market')}
          className={cn(
            "pb-2 text-sm font-medium transition-colors border-b-2",
            orderType === 'market' ? "border-yellow-500 text-yellow-500" : "border-transparent text-gray-500 hover:text-white"
          )}
        >
          Market
        </button>
      </div>

      <form onSubmit={handleTrade} className="flex flex-col gap-4">
        {orderType === 'limit' && (
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Price (USD)</label>
            <div className="relative">
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-[#333] rounded-md px-3 py-2.5 text-sm font-mono focus:border-yellow-500/50 outline-none transition-colors"
                placeholder="0.00"
                step="0.01"
                required
              />
              <span className="absolute right-3 top-2.5 text-[10px] text-gray-500">USD</span>
            </div>
          </div>
        )}

        {orderType === 'market' && (
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Price</label>
            <div className="bg-[#1a1a1a]/50 border border-[#333]/50 rounded-md px-3 py-2.5 text-sm font-mono text-gray-500">
              Market Price
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Amount (BTC)</label>
          <div className="relative">
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#333] rounded-md px-3 py-2.5 text-sm font-mono focus:border-yellow-500/50 outline-none transition-colors"
              placeholder="0.0000"
              step="0.0001"
              required
            />
            <span className="absolute right-3 top-2.5 text-[10px] text-gray-500">BTC</span>
          </div>
        </div>

        <div className="bg-[#1a1a1a] rounded-md p-3 border border-[#222]">
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-500">Total</span>
            <span className="text-gray-200 font-mono text-sm">{total} USD</span>
          </div>
          <div className="flex justify-between items-center text-[10px] mt-2">
            <span className="text-gray-500 uppercase tracking-tighter">Balance</span>
            <span className="text-gray-400">
              {side === 'buy' 
                ? `${formatNumber(user?.balances.USD || 0, 2)} USD`
                : `${formatNumber(user?.balances.BTC || 0, 4)} BTC`}
            </span>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !quantity || parseFloat(quantity) <= 0}
          className={cn(
            "w-full py-3.5 rounded-lg font-bold text-sm uppercase tracking-widest transition-all shadow-lg active:scale-[0.98]",
            loading ? "opacity-50 cursor-not-allowed" : "",
            side === 'buy' 
              ? "bg-green-500 hover:bg-green-600 shadow-green-500/10" 
              : "bg-red-500 hover:bg-red-600 shadow-red-500/10"
          )}
        >
          {loading ? 'Processing...' : `${side === 'buy' ? 'Buy' : 'Sell'} BTC`}
        </button>

        {message && (
          <div className={cn(
            "p-3 rounded-md flex items-center gap-2 text-xs",
            message.type === 'success' ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
          )}>
            {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {message.text}
          </div>
        )}
      </form>
    </div>
  );
}
