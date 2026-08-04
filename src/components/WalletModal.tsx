/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, ArrowUpRight, ArrowDownLeft, Wallet, ShieldAlert, CheckCircle, RefreshCw, Check, Phone } from 'lucide-react';
import { UserProfile, WalletTransaction } from '../types/game';
import { useLanguage } from '../context/LanguageContext';
import { formatCurrency } from '../utils/number';

interface WalletModalProps {
  user: UserProfile;
  onClose: () => void;
  // onBalanceUpdated is kept for potential future API integration
  onBalanceUpdated: () => void; 
}

const DEPOSIT_PHONE_NUMBER = '907243775';

export default function WalletModal({ user, onClose, onBalanceUpdated }: WalletModalProps) {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw' | 'history'>('deposit');
  const [amount, setAmount] = useState('');
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [error, setError] = useState('');
  
  const [phone, setPhone] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  type PaymentProviderConfig = {
    enabled: boolean;
    apiKey?: string;
    apiUrl?: string;
    accountNumber?: string;
  };

  const [provider, setProvider] = useState<'evc' | 'edahab' | 'sahal' | 'premier'>('evc');
  const [paymentSettings, setPaymentSettings] = useState<Record<string, PaymentProviderConfig>>({});
  const [apiProcessing, setApiProcessing] = useState(false);
  const [apiMessage, setApiMessage] = useState<string>('');
  const [apiError, setApiError] = useState<string>('');

  const [ussdString, setUssdString] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [confirmationRequested, setConfirmationRequested] = useState(false);
  const [confirmationLoading, setConfirmationLoading] = useState(false);
  const [withdrawPreviewVisible, setWithdrawPreviewVisible] = useState(false);

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
    if (activeTab === 'history') {
      fetchTransactions();
    }
  }, [user.id, activeTab]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/payment/settings');
        if (!response.ok) return;
        const data = await response.json();
        setPaymentSettings(data);
      } catch (err) {
        console.error('Unable to fetch payment settings', err);
      }
    };
    fetchSettings();
  }, []);

  const selectedPaymentProvider = paymentSettings[provider];
  const isProviderApiConfigured = !!selectedPaymentProvider?.enabled && !!selectedPaymentProvider?.apiKey;

  const handleRequestConfirmation = async () => {
    setConfirmationLoading(true);
    setError('');
    setApiError('');
    setApiMessage('');
    try {
        const response = await fetch('/api/wallet/request-manual-confirmation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: user.id,
                amount: parseFloat(amount),
                phone: activeTab === 'withdraw' ? phone : DEPOSIT_PHONE_NUMBER,
                senderPhone: activeTab === 'deposit' ? senderPhone : undefined,
                provider: provider,
                transactionType: activeTab,
            }),
        });
        const data = await response.json();
        if (response.ok) {
            setConfirmationRequested(true);
        } else {
            setError(data.error || 'Failed to submit confirmation request.');
        }
    } catch (err) {
        setError('An unexpected error occurred. Please try again.');
        console.error('Confirmation request failed:', err);
    } finally {
        setConfirmationLoading(false);
    }
};

const handleProcessApiPayment = async () => {
  setApiProcessing(true);
  setError('');
  setApiError('');
  setApiMessage('');

  const amtFloat = parseFloat(amount);
  if (isNaN(amtFloat) || amtFloat <= 0) {
    setApiError(language === 'so' ? 'Fadlan geli lacag sax ah oo togan.' : 'Please enter a valid positive amount.');
    setApiProcessing(false);
    return;
  }

  if (activeTab === 'withdraw') {
    if (amtFloat > user.balance) {
      setApiError(language === 'so' ? 'Haraagaaga kuma filna kala bixiddaan.' : 'Insufficient balance for this withdrawal.');
      setApiProcessing(false);
      return;
    }
    if (!phone.trim()) {
      setApiError(language === 'so' ? 'Fadlan qor lambarkaaga talefanka ee aad lacagta kula baxayso.' : 'Please enter the phone number for the withdrawal.');
      setApiProcessing(false);
      return;
    }
  }

  if (activeTab === 'deposit' && !senderPhone.trim()) {
    setApiError(language === 'so' ? 'Fadlan qor lambarkaaga talefanka ee aad lacagta ka soo direyso.' : 'Please enter the phone number you are sending from.');
    setApiProcessing(false);
    return;
  }

  try {
    const response = await fetch('/api/wallet/process-api-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        amount: amtFloat,
        phone: activeTab === 'withdraw' ? phone : undefined,
        senderPhone: activeTab === 'deposit' ? senderPhone : undefined,
        provider,
        transactionType: activeTab,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      setApiError(data.error || 'Failed to process payment via API.');
    } else {
      setApiMessage(data.message || (language === 'so' ? 'Lacagta si guul leh ayaa loo farsameeyay.' : 'Payment processed successfully via API.'));
      setConfirmationRequested(true);
      onBalanceUpdated();
      setAmount('');
      setPhone('');
      setSenderPhone('');
    }
  } catch (err) {
    console.error('API payment failed:', err);
    setApiError(language === 'so' ? 'Waxaa dhacay cilad lama filaan ah. Fadlan isku day markale.' : 'An unexpected error occurred. Please try again.');
  } finally {
    setApiProcessing(false);
  }
};

const handleGenerateUssd = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setApiError('');
    setApiMessage('');
    setUssdString('');
    setConfirmationRequested(false);
    setWithdrawPreviewVisible(false);

    const amtFloat = parseFloat(amount);

    if (isNaN(amtFloat) || amtFloat <= 0) {
      setError(language === 'so' ? 'Fadlan geli lacag sax ah oo togan.' : 'Please enter a valid positive amount.');
      return;
    }

    if (activeTab === 'withdraw') {
      if (amtFloat > user.balance) {
        setError(language === 'so' ? 'Haraagaaga kuma filna kala bixiddaan.' : 'Insufficient balance for this withdrawal.');
        return;
      }
      if (!phone.trim()) {
        setError(language === 'so' ? 'Fadlan qor lambarkaaga talefanka ee aad lacagta kula baxayso.' : 'Please enter the phone number for the withdrawal.');
        return;
      }

      setWithdrawPreviewVisible(true);
      return;
    }

    if (activeTab === 'deposit') {
        if (!senderPhone.trim()) {
            setError(language === 'so' ? 'Fadlan qor lambarkaaga talefanka ee aad lacagta ka soo direyso.' : 'Please enter the phone number you are sending from.');
            return;
        }
    }
      
    // Disable USSD generation for Premier Bank unless API is configured.
    if (provider === 'premier' && !isProviderApiConfigured) {
        setError(language === 'so' ? 'Kani waa hab bangi oo u baahan is-dhexgalka API. Fadlan dooro bixiye kale oo USSD ah ama ku xidh API Settings-ka.' : 'This is a bank method that requires API integration. Please select another USSD provider or configure API settings.' );
        return;
    }

    let targetPhone = activeTab === 'deposit' ? DEPOSIT_PHONE_NUMBER : phone;
    let code = '';

    switch (provider) {
      case 'evc':
        code = `*712*${targetPhone}*${amtFloat}#`;
        break;
      case 'sahal':
        code = `*883*${targetPhone}*${amtFloat}#`;
        break;
      case 'edahab':
        code = `*110*${targetPhone}*${amtFloat}#`;
        break;
      default:
        setError(language === 'so' ? 'Bixiye aan la aqoon.' : 'Unknown provider.');
        return;
    }

    setUssdString(code);
  };
  
  const resetForm = () => {
    setUssdString('');
    setAmount('');
    setError('');
    setApiError('');
    setApiMessage('');
    setConfirmationRequested(false);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-md bg-white/5 backdrop-blur-xl border-t sm:border border-white/10 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden text-white flex flex-col max-h-[90vh]">
        
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-black/10">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-blue-400" />
            <h2 className="font-extrabold text-lg text-white">{t('walletTitle')}</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-all cursor-pointer">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 m-4 rounded-xl flex flex-col space-y-1 relative shadow-lg shadow-blue-500/10">
          <div className="absolute right-4 top-4 bg-white/15 px-2 py-1 rounded-md text-[10px] uppercase font-extrabold tracking-widest text-white/90">
            Escrow Secured
          </div>
          <span className="text-xs text-white/85 font-semibold tracking-wider uppercase">{t('availableBalance')}</span>
          <span className="text-3xl font-black font-mono">{formatCurrency(user.balance)}</span>
        </div>

        <div className="grid grid-cols-3 gap-1 px-4 text-sm font-bold border-b border-white/10">
          {(['deposit', 'withdraw', 'history'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                resetForm();
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

        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {activeTab !== 'history' ? (
             ((activeTab === 'withdraw' && withdrawPreviewVisible) || (activeTab === 'deposit' && ussdString)) ? (
                <div className="py-6 text-center space-y-4 animate-in fade-in duration-300">
                    <h3 className="text-sm font-black text-yellow-400 uppercase tracking-widest">
                        {activeTab === 'withdraw'
                            ? language === 'so' ? 'Codsiga Kala-Bixid' : 'Withdrawal Request'
                            : language === 'so' ? 'Koodhka Dhigaalka' : 'Deposit Code'}
                    </h3>
                    {activeTab === 'deposit' ? (
                      <p className="text-xs text-slate-300 font-semibold leading-relaxed px-4">
                          {language === 'so'
                              ? 'Fadlan isticmaal koodhka hoose si aad u dhameystirto dhigashada.'
                              : 'Use the code below to complete your deposit.'}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-300 font-semibold leading-relaxed px-4">
                          {language === 'so'
                              ? 'Fadlan hubi xogta hoos ka muuqata ka hor intaadan codsiga u dirin maamulka.'
                              : 'Please review the details below before submitting your withdrawal request to admin.'}
                      </p>
                    )}

                    <div className="bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-left text-sm text-white space-y-2">
                        {activeTab === 'deposit' ? (
                          <div className="text-lg font-black text-center font-mono">
                              {ussdString}
                          </div>
                        ) : (
                          <>
                            <div className="flex justify-between gap-4">
                                <span className="font-semibold text-slate-200">{language === 'so' ? 'Lacag' : 'Amount'}:</span>
                                <span className="font-mono">${parseFloat(amount).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between gap-4">
                                <span className="font-semibold text-slate-200">{language === 'so' ? 'Lambarka' : 'Phone'}:</span>
                                <span>{phone}</span>
                            </div>
                            <div className="flex justify-between gap-4">
                                <span className="font-semibold text-slate-200">{language === 'so' ? 'Bixiyaha' : 'Provider'}:</span>
                                <span className="uppercase">{provider}</span>
                            </div>
                          </>
                        )}
                    </div>

                    {activeTab === 'withdraw' ? (
                      <>
                        <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                            {confirmationRequested ? (
                                <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-3 rounded-xl text-xs flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 shrink-0" />
                                    <span>{language === 'so' ? 'Codsigaaga waa la gudbiyay. Maamulka ayaa dib u eegis ku samayn doona.' : 'Your request has been submitted for review.'}</span>
                                </div>
                            ) : (
                                <>
                                    <p className="text-xs text-slate-300 font-semibold">
                                        {language === 'so'
                                            ? 'Haddii aad diyaar tahay, riix "Fadlan Xaqiiji" si uu codsigaagu u gaaro maamulka.'
                                            : 'When ready, press "Please Confirm" to send your request to admin.'}
                                    </p>
                                    <button
                                        onClick={handleRequestConfirmation}
                                        disabled={confirmationLoading}
                                        className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 text-white font-black text-sm py-3 px-4 rounded-xl active:scale-95 transition-all uppercase tracking-wider shadow flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {confirmationLoading ? (
                                            <>
                                                <RefreshCw className="w-4 h-4 animate-spin" />
                                                {language === 'so' ? 'Waa la diraa...' : 'Submitting...'}
                                            </>
                                        ) : (
                                            language === 'so' ? 'Fadlan Xaqiiji' : 'Please Confirm'
                                        )}
                                    </button>
                                </>
                            )}
                        </div>

                        <div className="text-[10px] text-yellow-400 leading-relaxed bg-yellow-500/10 p-3 rounded-xl border border-yellow-500/20">
                            <p className='font-bold uppercase'>{language === 'so' ? 'Ogeysiis Muhiim Ah' : 'Important Notice'}</p>
                            <p>{language === 'so' ? 'Codsigan waa codsi gacanta lagu xaqiijinayo. Haraagaaga wallet-ka wuxuu ka jarmaa kaliya marka maamulka uu ansixiyo.' : 'This request is pending admin approval. Your wallet balance will only be deducted after admin approval.'}</p>
                        </div>

                        <button
                            type="button"
                            onClick={() => setWithdrawPreviewVisible(false)}
                            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white font-black text-xs py-3 px-6 rounded-xl active:scale-95 transition-all uppercase tracking-wider shadow"
                        >
                            {language === 'so' ? 'Wax Ka Beddel Codsiga' : 'Edit Request'}
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                            <p className="text-xs text-slate-300 font-semibold">
                                {language === 'so'
                                    ? 'Koodhka dhigaalka waa diyaar. Taabo Dir si aad USSD-ga u furto.'
                                    : 'Your deposit code is ready. Tap Dir to open the USSD dialer.'}
                            </p>
                            <a
                                href={`tel:${ussdString}`}
                                className="w-full inline-flex items-center justify-center bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white font-black text-sm py-3 px-4 rounded-xl active:scale-95 transition-all uppercase tracking-wider shadow gap-2"
                            >
                                <Phone className="w-4 h-4" />
                                Dir
                            </a>
                        </div>
                        <button
                            type="button"
                            onClick={() => setUssdString('')}
                            className="bg-gray-800 text-white font-black text-xs py-3 px-6 rounded-xl active:scale-95 transition-all uppercase tracking-wider shadow"
                        >
                            {language === 'so' ? 'Tafatir macluumaadka' : 'Edit Details'}
                        </button>
                      </>
                    )}
                </div>
             ) : (
              <form className="space-y-4">
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

                {isProviderApiConfigured ? (
                  <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-3 text-sm text-blue-100">
                    {language === 'so'
                      ? 'API-ga shirkaddan waa la habeysay. Haddii aad rabto, xaqiiji macluumaadka oo dhagsii badhanka hoose si aad lacagta u qabato adigoon isticmaalin USSD.'
                      : 'This provider is configured for API payments. Process payment directly through the API instead of using USSD.'}
                  </div>
                ) : provider === 'premier' ? (
                  <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm text-yellow-100">
                    {language === 'so'
                      ? 'Premier Bank wuxuu u baahan yahay API si toos ah. Fadlan u sheeg maamulka inuu ku daro Payment Settings ama dooro bixiye kale.'
                      : 'Premier Bank requires API integration. Ask the admin to configure it in Payment Settings or choose another provider.'}
                  </div>
                ) : null}

                {activeTab === 'withdraw' && (
                  <div className="space-y-1 animate-in fade-in duration-300">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                      {language === 'so' ? 'Lambarka Talefanka Kala Bax' : 'Withdrawal Phone Number'}
                    </label>
                    <input
                      type="tel"
                      required={activeTab === 'withdraw'}
                      placeholder="e.g. 061XXXXXXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition-all"
                    />
                  </div>
                )}
                 
                {activeTab === 'deposit' && (
                    <>
                        <div className="space-y-1 animate-in fade-in duration-300">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                            {language === 'so' ? 'Lambarkaaga Talefanka ee aad lacagta ka soo direyso' : 'Your Phone Number (Sending From)'}
                            </label>
                            <input
                            type="tel"
                            required={activeTab === 'deposit'}
                            placeholder="e.g. 061XXXXXXX"
                            value={senderPhone}
                            onChange={(e) => setSenderPhone(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition-all"
                            />
                        </div>
                    </>
                )}

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

                {apiError && (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">
                    {apiError}
                  </div>
                )}

                {apiMessage && (
                  <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-3 text-sm text-green-100">
                    {apiMessage}
                  </div>
                )}

                {isProviderApiConfigured ? (
                  <button
                    type="button"
                    onClick={handleProcessApiPayment}
                    disabled={apiProcessing}
                    className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 text-white font-extrabold text-sm py-3 px-4 rounded-xl shadow-lg shadow-cyan-500/10 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {apiProcessing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        {language === 'so' ? 'Waa la farsameynayaa...' : 'Processing...'}
                      </>
                    ) : activeTab === 'deposit' ? (
                      <>
                        <ArrowUpRight className="w-4 h-4" /> {language === 'so' ? 'Dhig Lacag API-ga' : 'Deposit via API'}
                      </>
                    ) : (
                      <>
                        <ArrowDownLeft className="w-4 h-4" /> {language === 'so' ? 'Kala-bixi API-ga' : 'Withdraw via API'}
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleGenerateUssd}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-sm py-3 px-4 rounded-xl shadow-lg shadow-blue-500/10 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
                  >
                    {activeTab === 'deposit' ? (
                      <>
                        <ArrowUpRight className="w-4 h-4" /> {language === 'so' ? 'Samee Koodhka Dhigaalka' : 'Generate Deposit Code'}
                      </>
                    ) : (
                      <>
                        <ArrowDownLeft className="w-4 h-4" /> {language === 'so' ? 'Samee Koodhka Kala-bixidda' : 'Generate Withdraw Code'}
                      </>
                    )}
                  </button>
                )}
              </form>
            )
          ) : (
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
                          {isCredit ? '+' : '-'}{formatCurrency(tx.amount)}
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

