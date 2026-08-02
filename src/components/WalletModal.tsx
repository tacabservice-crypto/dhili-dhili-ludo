/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, ArrowUpRight, ArrowDownLeft, Wallet, ShieldAlert, CheckCircle, RefreshCw } from 'lucide-react';
import { UserProfile, WalletTransaction } from '../types/game';
import { useLanguage } from '../context/LanguageContext';

interface WalletModalProps {
  user: UserProfile;
  onClose: () => void;
  onBalanceUpdated: () => void;
}

export default function WalletModal({ user, onClose, onBalanceUpdated }: WalletModalProps) {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw' | 'history'>('deposit');
  const [amount, setAmount] = useState('');
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [phone, setPhone] = useState('');
  const [provider, setProvider] = useState<'evc' | 'edahab' | 'sahal' | 'premier'>('evc');
  const [paymentStep, setPaymentStep] = useState<'input' | 'processing' | 'success'>('input');
  const [countdown, setCountdown] = useState(3);

  const fetchTransactions = async () => {
    try {
      const response = await fetch(`/api/wallet/transactions/${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setTransactions(data);
      }
    } catch (err) {
      console.error('Failed to load transaction history', err);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [user.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    const amtFloat = parseFloat(amount);

    if (isNaN(amtFloat) || amtFloat <= 0) {
      setError(language === 'so' ? 'Fadlan geli lacag sax ah oo togan.' : 'Please enter a valid positive amount.');
      return;
    }

    if (activeTab === 'withdraw' && amtFloat > user.balance) {
      setError(language === 'so' ? 'Haraagaaga kuma filna kala bixiddaan.' : 'Insufficient balance for this withdrawal.');
      return;
    }

    if (!phone.trim()) {
      setError(language === 'so' ? 'Fadlan qor lambarkaaga talefanka.' : 'Please enter your mobile phone number.');
      return;
    }

    setPaymentStep('processing');
    setCountdown(3);

    let count = 3;
    const interval = setInterval(() => {
      count--;
      setCountdown(count);
      if (count <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    await new Promise(resolve => setTimeout(resolve, 3000));

    setLoading(true);
    try {
      const endpoint = activeTab === 'deposit' ? '/api/wallet/deposit' : '/api/wallet/withdraw';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, amount: amtFloat }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || (language === 'so' ? 'Mawduuca bixinta waa uu fashilmay.' : 'Payment failed.'));
      }

      setAmount('');
      setPaymentStep('success');
      setSuccessMsg(
        activeTab === 'deposit' 
          ? (language === 'so' ? `Waxaad si guul leh ugu shubtay haraagaaga $${amtFloat.toFixed(2)}!` : `Successfully deposited $${amtFloat.toFixed(2)} to your balance!`)
          : (language === 'so' ? `Kala bixidda $${amtFloat.toFixed(2)} waa ay guulaysatay!` : `Withdrawal of $${amtFloat.toFixed(2)} was successful!`)
      );
      onBalanceUpdated();
      fetchTransactions();
    } catch (err: any) {
      setError(err.message || (language === 'so' ? 'Cilad farsamo ayaa dhacday.' : 'A technical error occurred.'));
      setPaymentStep('input');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-md bg-white/5 backdrop-blur-xl border-t sm:border border-white/10 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden text-white flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-black/10">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-blue-400" />
            <h2 className="font-extrabold text-lg text-white">{t('walletTitle')}</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-all cursor-pointer">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Balance Showcase */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 m-4 rounded-xl flex flex-col space-y-1 relative shadow-lg shadow-blue-500/10">
          <div className="absolute right-4 top-4 bg-white/15 px-2 py-1 rounded-md text-[10px] uppercase font-extrabold tracking-widest text-white/90">
            Escrow Secured
          </div>
          <span className="text-xs text-white/85 font-semibold tracking-wider uppercase">{t('availableBalance')}</span>
          <span className="text-3xl font-black font-mono">${(user.balance || 0).toFixed(2)}</span>
          <div className="text-[10px] text-white/65 font-medium">
            {language === 'so' ? "100% Khamaar La'aan & Damaanad Ku Jiro" : '100% Secure Virtual Betting Tokens'}
          </div>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-3 gap-1 px-4 text-sm font-bold border-b border-white/10">
          {(['deposit', 'withdraw', 'history'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setError('');
                setSuccessMsg('');
              }}
              className={`py-3 text-center border-b-2 capitalize transition-all cursor-pointer ${
                activeTab === tab
                  ? 'border-blue-400 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              {tab === 'deposit' ? t('deposit') : tab === 'withdraw' ? t('withdraw') : t('history')}
            </button>
          ))}
        </div>

        {/* Modal Content body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-3 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {activeTab !== 'history' ? (
            paymentStep === 'processing' ? (
              <div className="py-8 text-center space-y-5 animate-pulse">
                <div className="relative w-16 h-16 mx-auto">
                  <div className="absolute inset-0 rounded-full border-4 border-t-yellow-400 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                  <div className="absolute inset-1.5 rounded-full border-4 border-blue-400 animate-pulse" />
                  <Wallet className="w-6 h-6 text-yellow-400 absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-black text-yellow-400 uppercase tracking-widest">
                    {language === 'so' ? 'USSD Push la diray...' : 'USSD Push Sent...'}
                  </h3>
                  <p className="text-xs text-slate-300 font-bold max-w-xs mx-auto leading-relaxed">
                    {language === 'so' 
                      ? <>Waxaan lambarkaaga <span className="text-white font-black">{phone}</span> u dirnay fariin bixineed oo {provider.toUpperCase()} ah.</>
                      : <>We sent a {provider.toUpperCase()} payment request to your number <span className="text-white font-black">{phone}</span>.</>
                    }
                  </p>
                  <p className="text-[10px] text-slate-400 font-semibold max-w-xs mx-auto">
                    {language === 'so' 
                      ? `Fadlan ku geli PIN-kaaga talefankaaga ${countdown}s gudahood si aad u fasaxdo bixinta.`
                      : `Please enter your PIN on your mobile phone within ${countdown}s.`
                    }
                  </p>
                </div>
                <div className="w-full max-w-xs mx-auto bg-black/40 h-2 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className="bg-gradient-to-r from-yellow-400 to-blue-500 h-full transition-all duration-1000"
                    style={{ width: `${(countdown / 3) * 100}%` }}
                  />
                </div>
              </div>
            ) : paymentStep === 'success' ? (
              <div className="py-6 text-center space-y-4">
                <div className="w-16 h-16 bg-green-500/20 border-2 border-green-500 rounded-full flex items-center justify-center mx-auto text-green-400 shadow-[0_0_20px_rgba(34,197,94,0.2)]">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-green-400 uppercase tracking-widest">
                    {language === 'so' ? 'KALA-SHUBAAL SHAQAYNAYA ✓' : 'TRANSACTION SUCCESSFUL ✓'}
                  </h3>
                  <p className="text-xs text-slate-300 font-semibold leading-relaxed px-4">
                    {successMsg}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPaymentStep('input')}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-black text-xs py-3 px-6 rounded-xl active:scale-95 transition-all uppercase tracking-wider shadow"
                >
                  {language === 'so' ? 'Ku Laabo Wallet-ka' : 'Back to Wallet'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Provider Selector Grid */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    {language === 'so' ? 'Shirkadda Lacagta' : 'Payment Provider'}
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { id: 'evc', name: 'EVC Plus', colors: 'from-yellow-500 to-orange-600', desc: 'Hormuud' },
                      { id: 'edahab', name: 'eDahab', colors: 'from-yellow-400 to-green-600', desc: 'Somtel' },
                      { id: 'sahal', name: 'Sahal', colors: 'from-blue-600 to-blue-800', desc: 'Golis' },
                      { id: 'premier', name: 'Premier', colors: 'from-slate-700 to-indigo-950', desc: 'Bank Wallet' }
                    ].map((prov) => (
                      <button
                        key={prov.id}
                        type="button"
                        onClick={() => setProvider(prov.id as any)}
                        className={`p-2 rounded-xl text-center border transition-all flex flex-col items-center justify-center relative cursor-pointer ${
                          provider === prov.id
                            ? 'bg-white/10 border-blue-400 scale-[1.03] shadow-lg'
                            : 'bg-black/30 border-white/5 hover:border-white/10'
                        }`}
                      >
                        <span className={`text-[10px] font-black tracking-tighter uppercase px-1.5 py-0.5 rounded-md bg-gradient-to-r ${prov.colors} text-white`}>
                          {prov.name}
                        </span>
                        <span className="text-[8px] text-slate-400 font-bold uppercase mt-1">
                          {prov.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Phone Number Input */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    {language === 'so' ? 'Lambarka Talefanka' : 'Phone Number'}
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 061XXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    {language === 'so' ? 'Lacagta ($)' : 'Amount ($)'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-extrabold text-lg">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      placeholder={language === 'so' ? 'Geli qaddarka' : 'Enter amount'}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 rounded-xl pl-8 pr-4 py-2.5 text-lg font-black text-white placeholder-slate-600 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Presets */}
                <div className="grid grid-cols-4 gap-2">
                  {[5, 10, 25, 50].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAmount(preset.toString())}
                      className="bg-black/30 border border-white/10 hover:border-blue-400 text-xs font-bold py-2 rounded-lg transition-all hover:bg-white/5 cursor-pointer text-white"
                    >
                      +${preset}
                    </button>
                  ))}
                </div>

                <div className="text-[10px] text-slate-400 leading-relaxed bg-black/30 p-3 rounded-xl border border-white/5">
                  {activeTab === 'deposit' ? (
                    <span>
                      {language === 'so'
                        ? '🔒 Shubaal degdeg ah. Dooro shirkaddaada, geli lambarkaaga talefanka iyo lacagta aad rabto si laguu soo diro USSD Push pin code xaqiijin ah.'
                        : '🔒 Instant Deposit. Choose your operator, enter your mobile number and amount to receive a USSD Push confirmation PIN.'}
                    </span>
                  ) : (
                    <span>
                      {language === 'so'
                        ? '🔒 Kala bixid degdeg ah. Lacagta aad guulaysato waxaad isla markiiba ugu wareejin kartaa akoonkaaga EVC Plus ama eDahab dhowr ilbiriqsi gudahood.'
                        : '🔒 Instant Withdrawal. Your winnings will be directly transferred to your EVC Plus or eDahab account within seconds.'}
                    </span>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-sm py-3 px-4 rounded-xl shadow-lg shadow-blue-500/10 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer uppercase tracking-wider"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : activeTab === 'deposit' ? (
                    <>
                      <ArrowUpRight className="w-4 h-4" /> {language === 'so' ? 'Dir Shubaalka' : 'Deposit Funds'}
                    </>
                  ) : (
                    <>
                      <ArrowDownLeft className="w-4 h-4" /> {language === 'so' ? 'Codso Kala-bixid' : 'Withdraw Funds'}
                    </>
                  )}
                </button>
              </form>
            )
          ) : (
            /* Transaction Ledger List */
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                {language === 'so' ? 'Taariikhda Dhiganaha' : 'Transaction History'}
              </h3>
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-xs font-medium">
                  {language === 'so' ? 'Wali wax shubaal ama kala bixid ah ma jiraan.' : 'No previous transactions recorded.'}
                </div>
              ) : (
                <div className="space-y-2 max-h-[35vh] overflow-y-auto pr-1">
                  {transactions.map((tx) => {
                    const isCredit = tx.type === 'deposit' || tx.type === 'win_payout' || tx.type === 'bet_escrow_refund';
                    return (
                      <div
                        key={tx.id}
                        className="bg-black/30 border border-white/5 p-3 rounded-xl flex items-center justify-between text-xs"
                      >
                        <div className="space-y-1">
                          <p className="font-bold text-slate-200">{tx.description}</p>
                          <p className="text-[10px] text-slate-500">
                            {new Date(tx.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <span className={`font-black text-sm whitespace-nowrap ml-2 font-mono ${isCredit ? 'text-green-400' : 'text-red-400'}`}>
                          {isCredit ? '+' : '-'}${(tx.amount || 0).toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

