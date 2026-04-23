import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useMarket } from '../context/MarketContext.tsx';
import { mockApi } from '../services/api.ts';
import { PaymentMethod, Transaction } from '../types.ts';
import {
  Wallet,
  PlusCircle,
  History,
  ArrowDownToLine,
  ArrowUpFromLine,
  RefreshCcw,
  ShieldCheck,
  X,
  CheckCircle2,
} from 'lucide-react';
import { formatDate, formatNumber, cn } from '../utils.ts';
import { motion } from 'motion/react';
import { PanelState, RowsSkeleton } from '../components/ui/FeedbackStates.tsx';

export default function WalletPage() {
  const { user, updateBalances } = useAuth();
  const { btcPrice } = useMarket();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  const [loading, setLoading] = useState(false);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [loadingCards, setLoadingCards] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState('');

  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [depositAmountZar, setDepositAmountZar] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferDirection, setTransferDirection] = useState<'USD_TO_BTC' | 'BTC_TO_USD'>('USD_TO_BTC');
  const [withdrawAccountNumber, setWithdrawAccountNumber] = useState('');
  const [withdrawBankName, setWithdrawBankName] = useState('');
  const [cardError, setCardError] = useState<string | null>(null);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [transferError, setTransferError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const southAfricanBanks = [
    'Standard Bank',
    'Absa',
    'First National Bank (FNB)',
    'Nedbank',
    'Capitec Bank',
  ];

  const showSuccessPopup = (message: string) => {
    setSuccessMessage(message);
    window.setTimeout(() => setSuccessMessage(null), 2500);
  };

  const fetchTransactions = async () => {
    setLoadingTransactions(true);
    setError(null);
    try {
      const res = await mockApi.getTransactions();
      setTransactions(res.data || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load transaction history');
    } finally {
      setLoadingTransactions(false);
    }
  };

  const fetchPaymentMethods = async () => {
    setLoadingCards(true);
    try {
      const res = await mockApi.getPaymentMethods();
      const methods: PaymentMethod[] = res.data || [];
      setPaymentMethods(methods);
      setSelectedPaymentMethodId(methods[0]?.id ?? '');
    } catch {
      setPaymentMethods([]);
      setSelectedPaymentMethodId('');
    } finally {
      setLoadingCards(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
    fetchPaymentMethods();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetCardForm = () => {
    setCardNumber('');
    setExpiry('');
    setCvc('');
    setCardholderName('');
    setStreet('');
    setCity('');
    setPostalCode('');
  };

  const handleSavePaymentMethod = async () => {
    const normalizedCard = cardNumber.replace(/\s+/g, '');
    if (!normalizedCard || normalizedCard.length < 4) {
      setCardError('Card number is required');
      return;
    }

    if (!cardholderName.trim() || !street.trim() || !city.trim() || !postalCode.trim()) {
      setCardError('Please complete all card and address fields');
      return;
    }

    try {
      const payload = {
        cardLast4: normalizedCard.slice(-4),
        expiry: expiry.trim(),
        cardholderName: cardholderName.trim(),
        street: street.trim(),
        city: city.trim(),
        postalCode: postalCode.trim(),
      };

      const res = await mockApi.addPaymentMethod(payload);
      const created: PaymentMethod = res.data;

      await fetchPaymentMethods();
      setSelectedPaymentMethodId(created.id);
      setShowAddCardModal(false);
      setCardError(null);
      resetCardForm();
    } catch (err: any) {
      setCardError(err?.message || 'Failed to save payment method');
    }
  };

  const handleConfirmDeposit = async () => {
    const amount = Number(depositAmountZar);
    if (!Number.isFinite(amount) || amount < 100) {
      setCardError('Minimum deposit is 100 rand');
      return;
    }

    if (!selectedPaymentMethodId) {
      setCardError('Please select or add a payment method');
      return;
    }

    setLoading(true);
    setCardError(null);

    try {
      await mockApi.faucet(amount, selectedPaymentMethodId);
      await updateBalances();
      await fetchTransactions();
      setShowDepositModal(false);
      showSuccessPopup('Deposit completed successfully');
    } catch (err: any) {
      setCardError(err?.message || 'Deposit failed');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmWithdraw = async () => {
    const amount = Number(withdrawAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setWithdrawError('Withdrawal amount must be greater than 0');
      return;
    }

    if (amount > (user?.balances?.USD ?? 0)) {
      setWithdrawError('Withdrawal amount exceeds available USD balance');
      return;
    }

    if (!withdrawAccountNumber.trim()) {
      setWithdrawError('Account number is required');
      return;
    }

    if (!withdrawBankName) {
      setWithdrawError('Bank name is required');
      return;
    }

    setLoading(true);
    setWithdrawError(null);

    try {
      await mockApi.withdraw(amount, withdrawAccountNumber.trim(), withdrawBankName);
      await updateBalances();
      await fetchTransactions();
      setShowWithdrawModal(false);
      setWithdrawAmount('');
      setWithdrawAccountNumber('');
      setWithdrawBankName('');
      showSuccessPopup('Withdrawal completed successfully');
    } catch (err: any) {
      setWithdrawError(err?.response?.data?.message || err?.message || 'Withdrawal failed');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmInternalTransfer = async () => {
    const amount = Number(transferAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setTransferError('Transfer amount must be greater than 0');
      return;
    }

    if (transferDirection === 'USD_TO_BTC' && amount > (user?.balances?.USD ?? 0)) {
      setTransferError('Transfer amount exceeds available USD balance');
      return;
    }

    if (transferDirection === 'BTC_TO_USD' && amount > (user?.balances?.BTC ?? 0)) {
      setTransferError('Transfer amount exceeds available BTC balance');
      return;
    }

    if (!Number.isFinite(btcPrice) || btcPrice <= 0) {
      setTransferError('Current BTC market price is unavailable');
      return;
    }

    setLoading(true);
    setTransferError(null);

    try {
      const fromAsset = transferDirection === 'USD_TO_BTC' ? 'USD' : 'BTC';
      const toAsset = transferDirection === 'USD_TO_BTC' ? 'BTC' : 'USD';
      await mockApi.internalTransfer(fromAsset, toAsset, amount, btcPrice);
      await updateBalances();
      await fetchTransactions();
      setShowTransferModal(false);
      setTransferAmount('');
      showSuccessPopup('Internal transfer completed successfully');
    } catch (err: any) {
      setTransferError(err?.response?.data?.message || err?.message || 'Internal transfer failed');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const isUsdToBtc = transferDirection === 'USD_TO_BTC';
  const transferInputAsset = isUsdToBtc ? 'USD' : 'BTC';
  const transferOutputAsset = isUsdToBtc ? 'BTC' : 'USD';
  const transferAmountNumber = Number(transferAmount || '0');
  const estimatedOutputAmount = transferAmountNumber > 0 && btcPrice > 0
    ? (isUsdToBtc ? transferAmountNumber / btcPrice : transferAmountNumber * btcPrice)
    : 0;

  const formatAssetBalance = (value: number, decimals: number) => {
    if (!Number.isFinite(value)) return '0';
    if (Math.abs(value) >= 1_000_000) {
      return new Intl.NumberFormat('en-US', {
        notation: 'compact',
        maximumFractionDigits: 2,
      }).format(value);
    }
    return formatNumber(value, decimals);
  };

  return (
    <div className="space-y-8 px-4 pt-4 lg:px-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="grid grid-cols-1 xl:grid-cols-[2fr_1fr_1fr] gap-8"
      >
        <div className="relative overflow-hidden rounded-2xl border border-[#252525] bg-gradient-to-br from-[#121212] to-[#0b0b0b] p-8 shadow-xl">
          <div className="relative z-10">
            <div className="mb-6 flex items-center gap-2 text-gray-500">
              <div className="rounded-lg bg-yellow-500/10 p-2">
                <Wallet className="h-5 w-5 text-yellow-500" />
              </div>
              <h1 className="text-lg font-bold uppercase tracking-widest">My Assets</h1>
            </div>

            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Primary Balance</p>
                <div className="break-all font-mono text-3xl font-black leading-tight text-white xl:text-4xl" title={`${formatNumber(user.balances.BTC, 8)} BTC`}>
                  {formatAssetBalance(user.balances.BTC, 8)} <span className="text-xl uppercase italic text-yellow-500">BTC</span>
                </div>
                <p className="text-sm text-gray-400">Available to trade</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Fiat Balance</p>
                <div className="break-all font-mono text-3xl font-black leading-tight text-white xl:text-4xl" title={`${formatNumber(user.balances.USD, 2)} USD`}>
                  {formatAssetBalance(user.balances.USD, 2)} <span className="text-xl uppercase italic text-green-500">USD</span>
                </div>
                <p className="text-sm text-gray-400">Reserved: 0.00 USD</p>
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-12 flex gap-4">
            <button
              type="button"
              onClick={() => {
                setCardError(null);
                setDepositAmountZar('');
                setShowDepositModal(true);
              }}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-yellow-500 px-6 py-3 font-bold text-black transition-all hover:bg-yellow-400 active:scale-95 disabled:opacity-50"
            >
              {loading ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
              Deposit Funds
            </button>
            <button
              type="button"
              onClick={() => {
                setTransferError(null);
                setTransferAmount('');
                setTransferDirection('USD_TO_BTC');
                setShowTransferModal(true);
              }}
              className="flex items-center gap-2 rounded-xl border border-[#2b2b2b] bg-[#171717] px-6 py-3 font-bold text-yellow-400 transition-all hover:bg-[#202020]"
            >
              Internal Transfer
            </button>
            <button
              type="button"
              onClick={() => {
                setWithdrawError(null);
                setWithdrawAmount('');
                setWithdrawAccountNumber('');
                setWithdrawBankName('');
                setShowWithdrawModal(true);
              }}
              className="flex items-center gap-2 rounded-xl border border-[#333] bg-[#222] px-6 py-3 font-bold text-white transition-all hover:bg-[#2a2a2a]"
            >
              Withdraw Funds
            </button>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center rounded-2xl border border-yellow-500/20 bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 p-8 text-center shadow-lg">
          <div className="mb-6 rounded-full bg-yellow-500 p-4 shadow-2xl shadow-yellow-500/20">
            <ShieldCheck className="h-12 w-12 text-black" />
          </div>
          <h3 className="mb-2 text-xl font-bold text-white">Tier 1 Verification</h3>
          <p className="max-w-[220px] text-sm leading-relaxed text-gray-400">
            Your account is verified. You can deposit and trade without limits.
          </p>
        </div>

        <div className="rounded-2xl border border-[#222] bg-[#111] p-6 shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-widest text-white">Saved Cards</h3>
            <button
              type="button"
              onClick={() => {
                setCardError(null);
                setShowAddCardModal(true);
              }}
              className="text-xs font-bold text-yellow-500 hover:underline"
            >
              + Add payment method
            </button>
          </div>

          {loadingCards ? (
            <p className="text-sm text-gray-500">Loading cards...</p>
          ) : paymentMethods.length > 0 ? (
            <div className="space-y-4 text-sm">
              {paymentMethods.slice(0, 2).map((card) => (
                <label key={card.id} className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#2b2b2b] bg-[#1a1a1a] p-4">
                  <input
                    type="radio"
                    name="savedPaymentMethod"
                    checked={selectedPaymentMethodId === card.id}
                    onChange={() => setSelectedPaymentMethodId(card.id)}
                    className="mt-1"
                  />
                  <div>
                  <div className="font-mono text-gray-300">**** **** **** {card.cardLast4}</div>
                  <div className="text-xs text-gray-500">Exp: {card.expiry || '--/--'}</div>
                  <div className="text-xs text-gray-500">{[card.street, card.city, card.postalCode].filter(Boolean).join(', ')}</div>
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <p className="mb-3 text-sm text-gray-500">No saved card yet.</p>
          )}
        </div>
      </motion.div>

      {showDepositModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-[#2a2a2a] bg-[#111] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#222] px-5 py-4">
              <h3 className="text-lg font-bold text-white">Deposit Funds</h3>
              <button
                type="button"
                onClick={() => setShowDepositModal(false)}
                className="rounded-lg p-2 text-gray-400 hover:bg-[#1b1b1b] hover:text-white"
                aria-label="Close deposit modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Deposit amount (ZAR)</label>
                <input
                  type="number"
                  min={100}
                  step="1"
                  value={depositAmountZar}
                  onChange={(e) => setDepositAmountZar(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#333] bg-[#1a1a1a] px-3 py-2.5 text-white outline-none focus:border-yellow-500/50"
                />
                <p className="mt-1 text-[11px] text-gray-500">Minimum deposit is 100 rand.</p>
              </div>

              {cardError && <p className="mt-1 text-[11px] text-red-400">{cardError}</p>}

              <button
                type="button"
                onClick={handleConfirmDeposit}
                disabled={loading}
                className="w-full rounded-lg bg-yellow-500 py-3 font-bold text-black transition-colors hover:bg-yellow-400 disabled:opacity-50"
              >
                {loading ? 'Depositing...' : 'Deposit now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {successMessage && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4"
          onClick={() => setSuccessMessage(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-green-500/30 bg-[#0f1a13] p-6 text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-500/20">
              <CheckCircle2 className="h-8 w-8 text-green-400" />
            </div>
            <p className="text-lg font-bold text-green-300">Success</p>
            <p className="mt-1 text-sm text-green-200/90">{successMessage}</p>
            <button
              type="button"
              onClick={() => setSuccessMessage(null)}
              className="mt-5 w-full rounded-lg bg-green-500/20 py-2.5 font-semibold text-green-200 transition-colors hover:bg-green-500/30"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {showTransferModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-[#2a2a2a] bg-[#111] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#222] px-5 py-4">
              <h3 className="text-lg font-bold text-white">Internal Transfer</h3>
              <button
                type="button"
                onClick={() => setShowTransferModal(false)}
                className="rounded-lg p-2 text-gray-400 hover:bg-[#1b1b1b] hover:text-white"
                aria-label="Close internal transfer modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Transfer direction</label>
                <select
                  value={transferDirection}
                  onChange={(e) => setTransferDirection(e.target.value as 'USD_TO_BTC' | 'BTC_TO_USD')}
                  className="mt-1 w-full rounded-lg border border-[#333] bg-[#1a1a1a] px-3 py-2.5 text-white outline-none focus:border-yellow-500/50"
                >
                  <option value="USD_TO_BTC">Fiat Balance (USD) to Primary Balance (BTC)</option>
                  <option value="BTC_TO_USD">Primary Balance (BTC) to Fiat Balance (USD)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Transfer amount ({transferInputAsset})</label>
                <input
                  type="number"
                  min={isUsdToBtc ? 0.01 : 0.00000001}
                  step={isUsdToBtc ? '0.01' : '0.00000001'}
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#333] bg-[#1a1a1a] px-3 py-2.5 text-white outline-none focus:border-yellow-500/50"
                />
              </div>

              <div className="rounded-lg border border-[#2b2b2b] bg-[#171717] p-3 text-xs">
                <p className="text-gray-500">Market price: <span className="font-mono text-gray-300">{formatNumber(btcPrice, 2)} USD/BTC</span></p>
                <p className="mt-1 text-gray-500">
                  Estimated {transferOutputAsset} received:{' '}
                  <span className="font-mono text-yellow-400">
                    {formatNumber(estimatedOutputAmount, isUsdToBtc ? 8 : 2)} {transferOutputAsset}
                  </span>
                </p>
                <p className="mt-1 text-gray-600">
                  Available {transferInputAsset}: <span className="font-mono text-gray-400">{formatNumber(isUsdToBtc ? (user?.balances?.USD ?? 0) : (user?.balances?.BTC ?? 0), isUsdToBtc ? 2 : 8)} {transferInputAsset}</span>
                </p>
              </div>

              {transferError && <p className="mt-1 text-[11px] text-red-400">{transferError}</p>}

              <button
                type="button"
                onClick={handleConfirmInternalTransfer}
                disabled={loading}
                className="w-full rounded-lg bg-yellow-500 py-3 font-bold text-black transition-colors hover:bg-yellow-400 disabled:opacity-50"
              >
                {loading ? 'Processing...' : `Transfer ${transferInputAsset} to ${transferOutputAsset}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddCardModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-[#2a2a2a] bg-[#111] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#222] px-5 py-4">
              <h3 className="text-lg font-bold text-white">Add a payment method</h3>
              <button
                type="button"
                onClick={() => setShowAddCardModal(false)}
                className="rounded-lg p-2 text-gray-400 hover:bg-[#1b1b1b] hover:text-white"
                aria-label="Close add card modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Card number</label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#333] bg-[#1a1a1a] px-3 py-2.5 text-white outline-none focus:border-yellow-500/50"
                  placeholder="1234 5678 9012 3456"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-400">MM / YY</label>
                  <input
                    type="text"
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#333] bg-[#1a1a1a] px-3 py-2.5 text-white outline-none focus:border-yellow-500/50"
                    placeholder="MM / YY"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-400">CVC</label>
                  <input
                    type="text"
                    value={cvc}
                    onChange={(e) => setCvc(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#333] bg-[#1a1a1a] px-3 py-2.5 text-white outline-none focus:border-yellow-500/50"
                    placeholder="CVC"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Cardholder name</label>
                <input
                  type="text"
                  value={cardholderName}
                  onChange={(e) => setCardholderName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#333] bg-[#1a1a1a] px-3 py-2.5 text-white outline-none focus:border-yellow-500/50"
                />
              </div>

              <input
                type="text"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                placeholder="Street"
                className="w-full rounded-lg border border-[#333] bg-[#1a1a1a] px-3 py-2.5 text-sm text-gray-300 outline-none focus:border-yellow-500/50"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="City"
                  className="w-full rounded-lg border border-[#333] bg-[#1a1a1a] px-3 py-2.5 text-sm text-gray-300 outline-none focus:border-yellow-500/50"
                />
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="Postal code"
                  className="w-full rounded-lg border border-[#333] bg-[#1a1a1a] px-3 py-2.5 text-sm text-gray-300 outline-none focus:border-yellow-500/50"
                />
              </div>

              {cardError && <p className="mt-1 text-[11px] text-red-400">{cardError}</p>}

              <button
                type="button"
                onClick={handleSavePaymentMethod}
                className="w-full rounded-lg border border-yellow-500/40 py-2 font-bold text-yellow-500 transition-colors hover:bg-yellow-500/10"
              >
                Save payment method
              </button>
            </div>
          </div>
        </div>
      )}

      {showWithdrawModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-[#2a2a2a] bg-[#111] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#222] px-5 py-4">
              <h3 className="text-lg font-bold text-white">Withdraw Funds</h3>
              <button
                type="button"
                onClick={() => setShowWithdrawModal(false)}
                className="rounded-lg p-2 text-gray-400 hover:bg-[#1b1b1b] hover:text-white"
                aria-label="Close withdraw modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Withdrawal amount</label>
                <input
                  type="number"
                  min={0.01}
                  step="0.01"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#333] bg-[#1a1a1a] px-3 py-2.5 text-white outline-none focus:border-yellow-500/50"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Account Number</label>
                <input
                  type="text"
                  value={withdrawAccountNumber}
                  onChange={(e) => setWithdrawAccountNumber(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#333] bg-[#1a1a1a] px-3 py-2.5 text-white outline-none focus:border-yellow-500/50"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Bank name</label>
                <select
                  value={withdrawBankName}
                  onChange={(e) => setWithdrawBankName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#333] bg-[#1a1a1a] px-3 py-2.5 text-white outline-none focus:border-yellow-500/50"
                >
                  <option value="">Select bank</option>
                  {southAfricanBanks.map((bank) => (
                    <option key={bank} value={bank}>{bank}</option>
                  ))}
                </select>
              </div>

              {withdrawError && <p className="mt-1 text-[11px] text-red-400">{withdrawError}</p>}

              <button
                type="button"
                onClick={handleConfirmWithdraw}
                disabled={loading}
                className="w-full rounded-lg bg-yellow-500 py-3 font-bold text-black transition-colors hover:bg-yellow-400 disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Withdraw now'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-[#222] bg-[#111] shadow-xl">
        <div className="flex items-center justify-between border-b border-[#222] px-8 py-5">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-gray-400" />
            <h2 className="text-lg font-bold text-white">Transaction History</h2>
          </div>
          <button type="button" className="text-xs font-bold uppercase tracking-wider text-yellow-500 transition-all hover:underline">
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
                  className="rounded-md bg-red-500/15 px-3 py-1.5 text-xs font-semibold text-red-300 transition-colors hover:bg-red-500/20"
                >
                  Retry
                </button>
              }
            />
          ) : (
            <table className="w-full text-left">
              <thead className="bg-[#1a1a1a] text-[10px] font-bold uppercase tracking-wider text-gray-500">
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
                  <tr key={tx.id} className="transition-colors hover:bg-[#1a1a1a]/50">
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'rounded-lg p-2',
                            tx.type === 'deposit' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                          )}
                        >
                          {tx.type === 'deposit' ? <ArrowDownToLine className="h-4 w-4" /> : <ArrowUpFromLine className="h-4 w-4" />}
                        </div>
                        <span className="font-bold capitalize text-gray-200">{tx.type}</span>
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <span
                        className={cn(
                          'rounded px-2 py-0.5 font-mono text-[10px] font-bold',
                          tx.asset === 'BTC' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-green-500/10 text-green-500'
                        )}
                      >
                        {tx.asset}
                      </span>
                    </td>
                    <td className="px-8 py-4">
                      <span className={cn('font-mono font-bold', tx.type === 'deposit' ? 'text-green-400' : tx.type === 'withdrawal' ? 'text-red-400' : 'text-white')}>
                        {tx.type === 'deposit' ? '+' : ''}
                        {formatNumber(tx.amount, tx.asset === 'BTC' ? 4 : 2)}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-sm text-gray-400">{tx.description}</td>
                    <td className="px-8 py-4 font-mono text-sm text-gray-500">{formatDate(tx.timestamp)}</td>
                    <td className="px-8 py-4 text-right">
                      <span className="rounded bg-green-500/5 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-green-500">
                        Completed
                      </span>
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
