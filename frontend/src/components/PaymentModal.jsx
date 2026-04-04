import { useState, useEffect } from 'react';
import { X, CreditCard, Building2, Smartphone, Wallet, CheckCircle2, Lock, ChevronRight, AlertCircle } from 'lucide-react';
import { useTheme, useAuth } from '../App.jsx';

// ── Indian Banks List ─────────────────────────────────────────
const BANKS = [
  { id: 'sbi',   name: 'State Bank of India',  logo: '🏦' },
  { id: 'hdfc',  name: 'HDFC Bank',             logo: '🔵' },
  { id: 'icici', name: 'ICICI Bank',            logo: '🟠' },
  { id: 'axis',  name: 'Axis Bank',             logo: '🟣' },
  { id: 'kotak', name: 'Kotak Mahindra Bank',   logo: '🔴' },
  { id: 'pnb',   name: 'Punjab National Bank',  logo: '🟡' },
  { id: 'bob',   name: 'Bank of Baroda',        logo: '🟤' },
  { id: 'canara',name: 'Canara Bank',           logo: '⚫' },
  { id: 'union', name: 'Union Bank of India',   logo: '🔷' },
  { id: 'idbi',  name: 'IDBI Bank',             logo: '🟩' },
];

const WALLETS = [
  { id: 'paytm',    name: 'Paytm',         logo: '💰', color: '#00BAF2' },
  { id: 'mobikwik', name: 'MobiKwik',      logo: '⚡', color: '#4A148C' },
  { id: 'amazon',   name: 'Amazon Pay',    logo: '📦', color: '#FF9900' },
  { id: 'freecharge',name:'FreeCharge',    logo: '✅', color: '#E91E63' },
  { id: 'phonepe',  name: 'PhonePe',       logo: '📱', color: '#5F259F' },
];

const PAYMENT_METHODS = [
  { id: 'card',       label: 'Card',        icon: CreditCard,  desc: 'Credit / Debit Card' },
  { id: 'netbanking', label: 'Net Banking', icon: Building2,   desc: 'All major banks' },
  { id: 'upi',        label: 'UPI',         icon: Smartphone,  desc: 'UPI ID or QR Code' },
  { id: 'wallet',     label: 'Wallet',      icon: Wallet,      desc: 'MobiKwik, Paytm & more' },
];

// ── QR Code placeholder (generated SVG bar-code-like) ─────────
function QRCodeSVG() {
  return (
    <svg width="140" height="140" viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg">
      <rect width="140" height="140" fill="white" rx="8"/>
      {/* Finder patterns */}
      <rect x="10" y="10" width="35" height="35" fill="none" stroke="#111" strokeWidth="4" rx="4"/>
      <rect x="18" y="18" width="19" height="19" fill="#111" rx="2"/>
      <rect x="95" y="10" width="35" height="35" fill="none" stroke="#111" strokeWidth="4" rx="4"/>
      <rect x="103" y="18" width="19" height="19" fill="#111" rx="2"/>
      <rect x="10" y="95" width="35" height="35" fill="none" stroke="#111" strokeWidth="4" rx="4"/>
      <rect x="18" y="103" width="19" height="19" fill="#111" rx="2"/>
      {/* Data modules */}
      {[55,65,75,85].map(x => [55,65,75,85].map(y => (
        Math.random() > 0.5 ? <rect key={`${x}-${y}`} x={x} y={y} width="8" height="8" fill="#111" rx="1"/> : null
      )))}
      <rect x="55" y="55" width="8" height="8" fill="#111" rx="1"/>
      <rect x="73" y="55" width="8" height="8" fill="#111" rx="1"/>
      <rect x="55" y="73" width="8" height="8" fill="#111" rx="1"/>
      <rect x="91" y="55" width="8" height="8" fill="#111" rx="1"/>
      <rect x="55" y="91" width="8" height="8" fill="#111" rx="1"/>
      <rect x="73" y="73" width="8" height="8" fill="#111" rx="1"/>
      <rect x="91" y="91" width="8" height="8" fill="#111" rx="1"/>
      <rect x="64" y="64" width="8" height="8" fill="#111" rx="1"/>
      <rect x="82" y="64" width="8" height="8" fill="#111" rx="1"/>
      <rect x="64" y="82" width="8" height="8" fill="#111" rx="1"/>
      <rect x="82" y="82" width="8" height="8" fill="#111" rx="1"/>
      {/* Alignment */}
      <rect x="55" y="10" width="8" height="8" fill="#111" rx="1"/>
      <rect x="65" y="10" width="8" height="8" fill="#111" rx="1"/>
      <rect x="75" y="10" width="8" height="8" fill="#111" rx="1"/>
      <rect x="10" y="55" width="8" height="8" fill="#111" rx="1"/>
      <rect x="10" y="65" width="8" height="8" fill="#111" rx="1"/>
      <rect x="10" y="75" width="8" height="8" fill="#111" rx="1"/>
    </svg>
  );
}

// ── Card input formatter ───────────────────────────────────────
function formatCard(v) {
  return v.replace(/\D/g,'').slice(0,16).replace(/(.{4})/g,'$1 ').trim();
}
function formatExpiry(v) {
  const d = v.replace(/\D/g,'').slice(0,4);
  return d.length > 2 ? `${d.slice(0,2)}/${d.slice(2)}` : d;
}

export default function PaymentModal({ isOpen, onClose, plan }) {
  const { dark }         = useTheme();
  const { user, setAuth } = useAuth();

  const [step,   setStep]   = useState('method'); // method | details | processing | success
  const [method, setMethod] = useState('card');

  // Card fields
  const [cardNum,  setCardNum]  = useState('');
  const [cardName, setCardName] = useState('');
  const [expiry,   setExpiry]   = useState('');
  const [cvv,      setCvv]      = useState('');

  // Net banking
  const [selectedBank, setSelectedBank] = useState('');

  // UPI
  const [upiMode, setUpiMode] = useState('id'); // id | qr
  const [upiId,   setUpiId]   = useState('');

  // Wallet
  const [selectedWallet, setSelectedWallet] = useState('');

  const [error, setError] = useState('');

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setStep('method'); setMethod('card'); setCardNum(''); setCardName('');
      setExpiry(''); setCvv(''); setSelectedBank(''); setUpiId('');
      setSelectedWallet(''); setError('');
    }
  }, [isOpen]);

  if (!isOpen || !plan) return null;

  // ── Validation ─────────────────────────────────────────────
  const validate = () => {
    setError('');
    if (method === 'card') {
      if (cardNum.replace(/\s/g,'').length < 16) return 'Enter a valid 16-digit card number.';
      if (!cardName.trim()) return 'Enter card holder name.';
      if (expiry.length < 5) return 'Enter valid expiry (MM/YY).';
      if (cvv.length < 3)    return 'Enter valid CVV.';
    }
    if (method === 'netbanking' && !selectedBank) return 'Please select a bank.';
    if (method === 'upi'        && upiMode === 'id' && !upiId.includes('@')) return 'Enter a valid UPI ID (e.g. name@upi).';
    if (method === 'wallet'     && !selectedWallet) return 'Please select a wallet.';
    return '';
  };

  const handlePay = () => {
    const err = validate();
    if (err) { setError(err); return; }
    setStep('processing');

    // Simulate 2.5s payment processing
    setTimeout(() => {
      // Save plan to localStorage + update auth context
      const planExpiry = new Date();
      if (plan.id === 'starter') planExpiry.setMonth(planExpiry.getMonth() + 1);
      if (plan.id === 'pro')     planExpiry.setMonth(planExpiry.getMonth() + 6);
      if (plan.id === 'annual')  planExpiry.setFullYear(planExpiry.getFullYear() + 1);

      const txn = {
        id:        `TXN${Date.now()}`,
        plan:      plan.name,
        amount:    plan.price,
        date:      new Date().toISOString(),
        method:    method,
        status:    'success',
        expiresAt: planExpiry.toISOString(),
      };

      // Store transactions list
      const existing = JSON.parse(localStorage.getItem('voltify_transactions') || '[]');
      existing.unshift(txn);
      localStorage.setItem('voltify_transactions', JSON.stringify(existing));

      // Update user object in auth context
      if (user) {
        const updatedUser = {
          ...user,
          subscriptionStatus: plan.id === 'starter' ? 'Starter' : plan.id === 'pro' ? 'Pro' : 'Annual',
          planName:    plan.name,
          planPrice:   plan.price,
          planStarted: new Date().toISOString(),
          planExpiry:  planExpiry.toISOString(),
        };
        localStorage.setItem('voltify_user', JSON.stringify(updatedUser));
        setAuth({ user: updatedUser, token: localStorage.getItem('voltify_token') });
      }

      setStep('success');
    }, 2500);
  };

  const surface  = dark ? 'bg-slate-900 text-white'     : 'bg-white text-gray-900';
  const inputCls = `w-full px-3 py-2.5 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${dark ? 'bg-slate-800 border-slate-600 text-white placeholder-slate-500' : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'}`;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget && step !== 'processing') onClose(); }}>
      <div className={`w-full max-w-md rounded-3xl shadow-2xl overflow-hidden ${surface} border ${dark ? 'border-slate-700' : 'border-gray-200'}`}
        style={{ animation: 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) both' }}>

        {/* Header gradient bar */}
        <div className="h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500" />

        {/* ── SUCCESS ──────────────────────────────────────────── */}
        {step === 'success' && (
          <div className="p-8 text-center space-y-5">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center mx-auto shadow-xl" style={{ animation: 'popIn 0.4s 0.1s both' }}>
              <CheckCircle2 size={40} className="text-white" />
            </div>
            <div>
              <h2 className={`text-2xl font-black mb-1 ${dark ? 'text-white' : 'text-gray-900'}`}>Payment Successful! 🎉</h2>
              <p className={`text-sm ${dark ? 'text-slate-400' : 'text-gray-500'}`}>
                You're now on the <span className="font-bold text-blue-600">{plan.name}</span> plan
              </p>
            </div>
            <div className={`rounded-2xl p-4 border ${dark ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="text-left">
                  <p className={`text-xs uppercase tracking-wide mb-0.5 ${dark ? 'text-slate-500' : 'text-gray-400'}`}>Plan</p>
                  <p className="font-bold">{plan.name}</p>
                </div>
                <div className="text-left">
                  <p className={`text-xs uppercase tracking-wide mb-0.5 ${dark ? 'text-slate-500' : 'text-gray-400'}`}>Amount Paid</p>
                  <p className="font-bold text-green-600">₹{plan.price.toLocaleString('en-IN')}</p>
                </div>
                <div className="text-left">
                  <p className={`text-xs uppercase tracking-wide mb-0.5 ${dark ? 'text-slate-500' : 'text-gray-400'}`}>Transaction ID</p>
                  <p className="font-mono text-xs">TXN{Date.now().toString().slice(-8)}</p>
                </div>
                <div className="text-left">
                  <p className={`text-xs uppercase tracking-wide mb-0.5 ${dark ? 'text-slate-500' : 'text-gray-400'}`}>Method</p>
                  <p className="font-bold capitalize">{method}</p>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={onClose} className={`flex-1 py-3 rounded-xl border text-sm font-bold ${dark ? 'border-slate-600 text-slate-300 hover:bg-slate-800' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                Close
              </button>
              <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold shadow-lg hover:from-blue-700 hover:to-indigo-700">
                View in Settings →
              </button>
            </div>
          </div>
        )}

        {/* ── PROCESSING ───────────────────────────────────────── */}
        {step === 'processing' && (
          <div className="p-12 text-center space-y-6">
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-blue-200" />
              <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
              <div className="absolute inset-2 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                <Lock size={24} className="text-blue-600" />
              </div>
            </div>
            <div>
              <h2 className={`text-xl font-black mb-2 ${dark ? 'text-white' : 'text-gray-900'}`}>Processing Payment...</h2>
              <p className={`text-sm ${dark ? 'text-slate-400' : 'text-gray-500'}`}>Please do not close this window</p>
            </div>
            <div className="flex justify-center gap-1.5">
              {[0,1,2].map(i => (
                <div key={i} className="w-2 h-2 rounded-full bg-blue-500" style={{ animation: `bounce 1.2s ${i*0.2}s infinite` }} />
              ))}
            </div>
          </div>
        )}

        {/* ── METHOD + DETAILS ─────────────────────────────────── */}
        {(step === 'method' || step === 'details') && (
          <>
            {/* Modal Header */}
            <div className={`flex items-center justify-between px-6 py-4 border-b ${dark ? 'border-slate-700' : 'border-gray-100'}`}>
              <div>
                <h2 className={`text-lg font-black ${dark ? 'text-white' : 'text-gray-900'}`}>Complete Payment</h2>
                <p className={`text-xs ${dark ? 'text-slate-400' : 'text-gray-500'}`}>{plan.name} · ₹{plan.price.toLocaleString('en-IN')}{plan.period}</p>
              </div>
              <button onClick={onClose} className={`p-2 rounded-xl ${dark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-gray-100 text-gray-500'}`}><X size={18}/></button>
            </div>

            <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Payment Method Tabs */}
              <div className="grid grid-cols-4 gap-2">
                {PAYMENT_METHODS.map(m => {
                  const Icon = m.icon;
                  return (
                    <button key={m.id} onClick={() => { setMethod(m.id); setError(''); }}
                      className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-xs font-semibold transition-all ${
                        method === m.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shadow-sm'
                          : dark ? 'border-slate-700 text-slate-400 hover:border-slate-500' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}>
                      <Icon size={18}/>
                      <span>{m.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* ── Card Fields ──────────────────────────────────── */}
              {method === 'card' && (
                <div className="space-y-3">
                  <div>
                    <label className={`block text-xs font-semibold uppercase tracking-wide mb-1.5 ${dark ? 'text-slate-400' : 'text-gray-500'}`}>Card Number</label>
                    <input value={cardNum} onChange={e => setCardNum(formatCard(e.target.value))} placeholder="1234 5678 9012 3456" className={inputCls} maxLength={19}/>
                  </div>
                  <div>
                    <label className={`block text-xs font-semibold uppercase tracking-wide mb-1.5 ${dark ? 'text-slate-400' : 'text-gray-500'}`}>Cardholder Name</label>
                    <input value={cardName} onChange={e => setCardName(e.target.value)} placeholder="As on card" className={inputCls}/>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={`block text-xs font-semibold uppercase tracking-wide mb-1.5 ${dark ? 'text-slate-400' : 'text-gray-500'}`}>Expiry</label>
                      <input value={expiry} onChange={e => setExpiry(formatExpiry(e.target.value))} placeholder="MM/YY" className={inputCls} maxLength={5}/>
                    </div>
                    <div>
                      <label className={`block text-xs font-semibold uppercase tracking-wide mb-1.5 ${dark ? 'text-slate-400' : 'text-gray-500'}`}>CVV</label>
                      <input type="password" value={cvv} onChange={e => setCvv(e.target.value.replace(/\D/g,'').slice(0,4))} placeholder="•••" className={inputCls} maxLength={4}/>
                    </div>
                  </div>
                  <div className={`flex items-center gap-2 text-xs ${dark ? 'text-slate-500' : 'text-gray-400'}`}>
                    <Lock size={12}/> 256-bit SSL encrypted · Your card details are safe
                  </div>
                </div>
              )}

              {/* ── Net Banking ──────────────────────────────────── */}
              {method === 'netbanking' && (
                <div className="space-y-3">
                  <p className={`text-sm font-semibold ${dark ? 'text-slate-300' : 'text-gray-700'}`}>Select Your Bank</p>
                  <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-1">
                    {BANKS.map(b => (
                      <button key={b.id} onClick={() => setSelectedBank(b.id)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all text-left ${
                          selectedBank === b.id
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                            : dark ? 'border-slate-700 text-slate-300 hover:border-slate-500' : 'border-gray-200 text-gray-700 hover:border-gray-300'
                        }`}>
                        <span className="text-xl">{b.logo}</span>
                        <span className="flex-1">{b.name}</span>
                        {selectedBank === b.id && <CheckCircle2 size={16} className="text-blue-500"/>}
                      </button>
                    ))}
                  </div>
                  {selectedBank && <p className={`text-xs ${dark ? 'text-slate-500' : 'text-gray-400'}`}>You'll be redirected to {BANKS.find(b=>b.id===selectedBank)?.name} for authentication.</p>}
                </div>
              )}

              {/* ── UPI ──────────────────────────────────────────── */}
              {method === 'upi' && (
                <div className="space-y-4">
                  <div className={`flex gap-1 p-1 rounded-lg ${dark ? 'bg-slate-800' : 'bg-gray-100'}`}>
                    {['id','qr'].map(m => (
                      <button key={m} onClick={() => setUpiMode(m)}
                        className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all ${upiMode === m ? 'bg-blue-600 text-white shadow' : dark ? 'text-slate-400' : 'text-gray-600'}`}>
                        {m === 'id' ? 'UPI ID' : 'Scan QR'}
                      </button>
                    ))}
                  </div>
                  {upiMode === 'id' ? (
                    <div>
                      <label className={`block text-xs font-semibold uppercase tracking-wide mb-1.5 ${dark ? 'text-slate-400' : 'text-gray-500'}`}>UPI ID</label>
                      <input value={upiId} onChange={e => setUpiId(e.target.value)} placeholder="yourname@upi / @ybl / @okaxis" className={inputCls}/>
                      <p className={`text-xs mt-2 ${dark ? 'text-slate-500' : 'text-gray-400'}`}>Works with GPay, PhonePe, Paytm, BHIM and all UPI apps</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <div className={`p-4 rounded-2xl border ${dark ? 'bg-white border-slate-600' : 'bg-white border-gray-200'} shadow`}>
                        <QRCodeSVG/>
                      </div>
                      <p className={`text-sm font-semibold ${dark ? 'text-slate-300' : 'text-gray-700'}`}>Scan with any UPI app</p>
                      <p className={`text-xs ${dark ? 'text-slate-500' : 'text-gray-400'}`}>GPay · PhonePe · Paytm · BHIM · etc.</p>
                      <p className={`text-sm font-bold text-blue-600`}>voltify@icici</p>
                    </div>
                  )}
                </div>
              )}

              {/* ── Digital Wallets ───────────────────────────────── */}
              {method === 'wallet' && (
                <div className="space-y-3">
                  <p className={`text-sm font-semibold ${dark ? 'text-slate-300' : 'text-gray-700'}`}>Select Wallet</p>
                  <div className="grid grid-cols-1 gap-2">
                    {WALLETS.map(w => (
                      <button key={w.id} onClick={() => setSelectedWallet(w.id)}
                        className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border text-sm font-medium transition-all text-left ${
                          selectedWallet === w.id
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                            : dark ? 'border-slate-700 text-slate-300 hover:border-slate-500' : 'border-gray-200 text-gray-700 hover:border-gray-300'
                        }`}>
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shadow-sm" style={{ background: w.color + '20', border: `2px solid ${w.color}40` }}>
                          {w.logo}
                        </div>
                        <span className="flex-1 font-semibold">{w.name}</span>
                        {selectedWallet === w.id && <CheckCircle2 size={16} className="text-blue-500"/>}
                      </button>
                    ))}
                  </div>
                  {selectedWallet && (
                    <p className={`text-xs ${dark ? 'text-slate-500' : 'text-gray-400'}`}>
                      You'll be redirected to {WALLETS.find(w=>w.id===selectedWallet)?.name} to complete payment.
                    </p>
                  )}
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <AlertCircle size={15} className="text-red-500 flex-shrink-0"/>
                  <p className="text-sm text-red-700 dark:text-red-400 font-medium">{error}</p>
                </div>
              )}

              {/* Pay Button */}
              <button onClick={handlePay}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-base shadow-xl hover:shadow-blue-500/30 transition-all flex items-center justify-center gap-2">
                <Lock size={16}/>
                Pay ₹{plan.price.toLocaleString('en-IN')} Securely
                <ChevronRight size={16}/>
              </button>

              <div className={`flex items-center justify-center gap-4 text-xs ${dark ? 'text-slate-600' : 'text-gray-400'}`}>
                <span>🔒 256-bit SSL</span>
                <span>·</span>
                <span>✅ 7-day refund</span>
                <span>·</span>
                <span>📞 24/7 support</span>
              </div>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes popIn {
          from { transform: scale(0.85); opacity: 0; }
          to   { transform: scale(1);    opacity: 1; }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
}
