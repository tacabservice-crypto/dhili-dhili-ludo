/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, ArrowUpRight, ArrowDownLeft, Wallet, ShieldAlert, CheckCircle, RefreshCw, Check, Phone, User, Building } from 'lucide-react';
import { UserProfile, WalletTransaction, Agent } from '../types/game';
import { useLanguage } from '../context/LanguageContext';
import { formatCurrency } from '../utils/number';

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
  const [error, setError] = useState('');
  
  const [phone, setPhone] = useState('');
  const [senderPhone, setSenderPhone] = useState('');

  // Agent related state
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [isRequesting, setIsRequesting] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');

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
    const fetchAgents = async () => {
        try {
            const agentsRes = await fetch(`/api/agents?location=${user.location || ''}`);
            if (agentsRes.ok) {
                const data = await agentsRes.json();
                setAgents(data);
                if (data.length > 0) {
                    setSelectedAgent(data[0].id);
                }
            }
        } catch (err) {
            console.error('Failed to load agents', err);
        }
    };
    fetchAgents();
  }, [user.location]);
  
  const handleAgentRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setRequestMessage('');

    const requestAmount = parseFloat(amount);
    const playerPhone = activeTab === 'deposit' ? senderPhone : phone;

    if (!selectedAgent) {
        setError('Please select an agent.');
        return;
    }
    if (!playerPhone.trim()) {
        setError(`Please enter the phone number you are ${activeTab === 'deposit' ? 'sending from' : 'withdrawing to'}.`);
        return;
    }
    if (isNaN(requestAmount) || requestAmount <= 0) {
      setError('Please enter a valid positive amount.');
      return;
    }
    if (activeTab === 'withdrawal' && user.balance < requestAmount) {
        setError('Insufficient balance for this withdrawal request.');
        return;
    }

    setIsRequesting(true);
    try {
        const response = await fetch('/api/request-to-agent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-user-id': user.id },
            body: JSON.stringify({
                agentId: selectedAgent,
                amount: requestAmount,
                type: activeTab,
                playerPhone: playerPhone,
            }),
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Failed to submit request.');
        }
        setRequestMessage('Your request has been successfully sent to the agent.');
        setAmount('');
        setPhone('');
        setSenderPhone('');
        onBalanceUpdated();
    } catch (err: any) {
        setError(err.message);
    } finally {
        setIsRequesting(false);
    }
  };
  
  const resetForm = () => {
    setAmount('');
    setError('');
    setRequestMessage('');
    setPhone('');
    setSenderPhone('');
    if (agents.length > 0) {
        setSelectedAgent(agents[0].id);
    }
  }

  const localAgents = agents.filter(agent => agent.location && user.location && agent.location.toLowerCase() === user.location.toLowerCase());
  const otherAgents = agents.filter(agent => !agent.location || !user.location || agent.location.toLowerCase() !== user.location.toLowerCase());

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
          {requestMessage && (
            <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-3 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{requestMessage}</span>
            </div>
          )}

          {activeTab !== 'history' ? (
              <form className="space-y-4" onSubmit={handleAgentRequest}>
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-2">
                        <Building className="w-3 h-3" />
                        Agent
                    </label>
                    <select 
                        value={selectedAgent}
                        onChange={(e) => setSelectedAgent(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition-all"
                    >
                        {agents.length === 0 && <option>Loading agents...</option>}
                        {localAgents.length > 0 && (
                            <optgroup label="Local Agents">
                                {localAgents.map(agent => (
                                    <option key={agent.id} value={agent.id}>{agent.username} ({agent.location})</option>
                                ))}
                            </optgroup>
                        )}
                        {otherAgents.length > 0 && (
                            <optgroup label="Other Agents">
                                {otherAgents.map(agent => (
                                    <option key={agent.id} value={agent.id}>{agent.username} ({agent.location || 'Unknown'})</option>
                                ))}
                            </optgroup>
                        )}
                    </select>
                </div>

                {activeTab === 'withdraw' && (
                  <div className="space-y-1 animate-in fade-in duration-300">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-2">
                      <Phone className="w-3 h-3" />
                      {language === 'so' ? 'Lambarka Talefanka Kala Bax' : 'Withdrawal Phone Number'}
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
                )}
                 
                {activeTab === 'deposit' && (
                    <div className="space-y-1 animate-in fade-in duration-300">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-2">
                            <Phone className="w-3 h-3" />
                            {language === 'so' ? 'Lambarkaaga Talefanka ee aad lacagta ka soo direyso' : 'Your Phone Number (Sending From)'}
                        </label>
                        <input
                        type="tel"
                        required
                        placeholder="e.g. 061XXXXXXX"
                        value={senderPhone}
                        onChange={(e) => setSenderPhone(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition-all"
                        />
                    </div>
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

                <button
                    type="submit"
                    disabled={isRequesting}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-sm py-3 px-4 rounded-xl shadow-lg shadow-blue-500/10 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isRequesting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        {language === 'so' ? 'Waa la diraa...' : 'Submitting...'}
                      </>
                    ) : activeTab === 'deposit' ? (
                      <>
                        <ArrowUpRight className="w-4 h-4" /> {language === 'so' ? 'Dir Codsiga Dhigaalka' : 'Send Deposit Request'}
                      </>
                    ) : (
                      <>
                        <ArrowDownLeft className="w-4 h-4" /> {language === 'so' ? 'Dir Codsiga Kala-bixidda' : 'Send Withdraw Request'}
                      </>
                    )}
                  </button>
              </form>
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
