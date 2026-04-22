import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { mockApi } from '../services/api.ts';
import { Transaction } from '../types.ts';
import { Wallet, PlusCircle, History, ArrowDownToLine, ArrowUpFromLine, RefreshCcw, ShieldCheck } from 'lucide-react';
import { formatCurrency, formatNumber, formatDate, cn } from '../utils.ts';
import { motion } from 'motion/react';
import { PanelState, RowsSkeleton } from '../components/ui/FeedbackStates.tsx';

export default function WalletPage() {
  const { user, updateBalances } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = async () => {
    setLoadingTransactions(true);
    setError(null);
    try {
      const res = await mockApi.getTransactions();
      setTransactions(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load transaction history');
    } finally {
      setLoadingTransactions(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDeposit = async () => {
    setLoading(true);
    try {
      await mockApi.faucet();
      await updateBalances();
      await fetchTransactions();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-screen-xl mx-auto px-4 lg:px-6 py-8">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10"
      >
        <div className="md:col-span-2 bg-[#111] border border-[#222] rounded-2xl p-8 flex flex-col justify-between shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none group-hover:scale-110 transition-transform duration-700">
            <Wallet className="w-64 h-64 rotate-[-15deg]" />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-gray-500 mb-6">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <Wallet className="w-5 h-5 text-yellow-500" />
              </div>
              <h1 className="text-lg font-bold uppercase tracking-widest">My Assets</h1>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="space-y-1">
                <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">Primary Balance</p>
                <div className="text-4xl font-black text-white font-mono break-all">
                    {formatNumber(user.balances.BTC, 8)} <span className="text-yellow-500 text-xl italic uppercase">BTC</span>
                </div>
                <p className="text-sm text-gray-400">Available to trade</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">Fiat Balance</p>
                <div className="text-4xl font-black text-white font-mono">
                    {formatNumber(user.balances.USD, 2)} <span className="text-green-500 text-xl italic uppercase">USD</span>
                </div>
                <p className="text-sm text-gray-400">Reserved: 0.00 USD</p>
              </div>
            </div>
          </div>

          <div className="mt-12 flex gap-4 relative z-10">
            <button
              type="button"
              onClick={handleDeposit}
              disabled={loading}
              className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-50 active:scale-95 shadow-lg shadow-yellow-500/10"
            >
              {loading ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
              Get Free Test Coins
            </button>
            <button type="button" className="flex items-center gap-2 bg-[#222] hover:bg-[#2a2a2a] text-white px-6 py-3 rounded-xl font-bold transition-all border border-[#333]">
              Withdraw Funds
            </button>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border border-yellow-500/20 rounded-2xl p-8 flex flex-col justify-center items-center text-center shadow-lg">
          <div className="mb-6 p-4 bg-yellow-500 rounded-full shadow-2xl shadow-yellow-500/20">
            <ShieldCheck className="w-12 h-12 text-black" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Tier 1 Verification</h3>
          <p className="text-sm text-gray-400 leading-relaxed max-w-[200px]">
            Your account is verified. You can deposit and trade without limits.
          </p>
        </div>
      </motion.div>

      <div className="bg-[#111] border border-[#222] rounded-2xl shadow-xl overflow-hidden">
        <div className="px-8 py-5 border-b border-[#222] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-bold text-white">Transaction History</h2>
          </div>
          <button type="button" className="text-xs text-yellow-500 font-bold uppercase tracking-wider hover:underline transition-all">
            Download CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          {loadingTransactions ? (
            <RowsSkeleton rows={8} />
          ) : error ? (
            <PanelState
              type="error"
              title="Could not load transactions"
              description={error}
              action={
                <button
                  type="button"
                  onClick={fetchTransactions}
                  className="px-3 py-1.5 rounded-md text-xs font-semibold bg-red-500/15 text-red-300 hover:bg-red-500/20 transition-colors"
                >
                  Retry
                </button>
              }
            />
          ) : (
          <table className="w-full text-left">
            <thead className="bg-[#1a1a1a] text-[10px] uppercase font-bold text-gray-500 tracking-wider">
              <tr>
                <th className="px-8 py-4">Type</th>
                <th className="px-8 py-4">Asset</th>
                <th className="px-8 py-4">Amount</th>
                <th className="px-8 py-4">Description</th>
                <th className="px-8 py-4">Date</th>
                <th className="px-8 py-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222]">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-[#1a1a1a]/50 transition-colors">
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "p-2 rounded-lg",
                            tx.type === 'deposit' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                        )}>
                            {tx.type === 'deposit' ? <ArrowDownToLine className="w-4 h-4" /> : <ArrowUpFromLine className="w-4 h-4" />}
                        </div>
                        <span className="font-bold text-gray-200 capitalize">{tx.type}</span>
                    </div>
                  </td>
                  <td className="px-8 py-4">
                    <span className={cn(
                        "font-mono font-bold px-2 py-0.5 rounded text-[10px]",
                        tx.asset === 'BTC' ? "bg-yellow-500/10 text-yellow-500" : "bg-green-500/10 text-green-500"
                    )}>
                        {tx.asset}
                    </span>
                  </td>
                  <td className="px-8 py-4">
                    <span className={cn(
                        "font-mono font-bold",
                        tx.type === 'deposit' ? "text-green-400" : "text-white"
                    )}>
                        {tx.type === 'deposit' ? '+' : ''}{formatNumber(tx.amount, tx.asset === 'BTC' ? 4 : 2)}
                    </span>
                  </td>
                  <td className="px-8 py-4 text-gray-400 text-sm">{tx.description}</td>
                  <td className="px-8 py-4 text-gray-500 text-sm font-mono">{formatDate(tx.timestamp)}</td>
                  <td className="px-8 py-4 text-right">
                    <span className="text-[10px] font-bold uppercase text-green-500 tracking-widest bg-green-500/5 px-2 py-1 rounded">Completed</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          )}
          {!loadingTransactions && !error && transactions.length === 0 && (
            <PanelState title="No transactions yet" description="Your deposits and trade settlements will appear here." />
          )}
        </div>
      </div>
    </div>
  );
}
