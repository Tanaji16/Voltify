import { useState } from 'react';
import { useTheme, useAuth } from '../App.jsx';
import Header from '../components/Header.jsx';
import SettingsPage from './SettingsPage.jsx';
import { Crown, FileText, ShieldCheck, Download, Zap, Star, RefreshCw, CheckCircle2, Clock } from 'lucide-react';
import PaymentModal from '../components/PaymentModal.jsx';

const PLANS_UPSELL = [
  { id: 'starter', name: 'Starter', price: 99, period: '1 Month', features: ['Bill calculator','Slab alerts','PDF download'], color: 'blue' },
  { id: 'pro',     name: 'Pro',     price: 499, period: '6 Months', features: ['AI Advisor','Budget planner','WhatsApp alerts'], color: 'indigo', popular: true },
  { id: 'annual',  name: 'Eco-Saver', price: 899, period: '1 Year', features: ['Everything in Pro','Priority support','Annual report'], color: 'purple' },
];

export default function BillingPage() {
  const { dark }       = useTheme();
  const { user }       = useAuth();
  const [settings,  setSettings]  = useState(false);
  const [payModal,  setPayModal]  = useState(false);
  const [activePlan, setActivePlan] = useState(null);

  const transactions = JSON.parse(localStorage.getItem('voltify_transactions') || '[]');
  const hasPlan = user?.subscriptionStatus && user.subscriptionStatus !== 'Free';

  const planColor = {
    Starter: 'blue', Pro: 'indigo', Annual: 'purple', 'Eco-Saver': 'purple'
  }[user?.subscriptionStatus] || 'gray';

  const bg = dark ? 'bg-slate-950' : 'bg-gray-50';
  const card = dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200';

  return (
    <div className={`min-h-screen ${bg}`}>
      <Header onSettingsOpen={() => setSettings(true)}/>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Page title */}
        <div>
          <h1 className={`text-2xl font-black ${dark ? 'text-white' : 'text-gray-900'}`}>💳 Billing</h1>
          <p className={`text-sm mt-1 ${dark ? 'text-slate-400' : 'text-gray-500'}`}>Manage your subscription and view payment history</p>
        </div>

        {/* ── Active Plan Card ────────────────────────────────── */}
        <div className={`rounded-2xl p-6 border ${card} shadow-sm`}>
          <div className="flex items-center gap-3 mb-5">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center bg-${planColor}-100 dark:bg-${planColor}-900/30`}>
              <Crown size={22} className={`text-${planColor}-600`}/>
            </div>
            <div>
              <h2 className={`text-base font-extrabold ${dark ? 'text-white' : 'text-gray-900'}`}>Current Plan</h2>
              <p className={`text-xs ${dark ? 'text-slate-400' : 'text-gray-500'}`}>Your active Voltify subscription</p>
            </div>
          </div>

          {hasPlan ? (
            <div className={`rounded-xl p-5 border ${dark ? 'bg-gradient-to-br from-blue-900/40 to-indigo-900/30 border-blue-700/40' : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200'}`}>
              <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                <div>
                  <p className={`text-xl font-black ${dark ? 'text-white' : 'text-gray-900'}`}>{user?.planName || user?.subscriptionStatus} Plan</p>
                  <p className={`text-sm ${dark ? 'text-blue-300' : 'text-blue-700'}`}>₹{user?.planPrice?.toLocaleString('en-IN') || '—'} paid</p>
                </div>
                <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400">
                  <CheckCircle2 size={13}/> Active
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className={`text-xs uppercase tracking-wide mb-0.5 ${dark ? 'text-slate-500' : 'text-gray-400'}`}>Started</p>
                  <p className={`font-semibold ${dark ? 'text-white' : 'text-gray-800'}`}>
                    {user?.planStarted ? new Date(user.planStarted).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'}) : '—'}
                  </p>
                </div>
                <div>
                  <p className={`text-xs uppercase tracking-wide mb-0.5 ${dark ? 'text-slate-500' : 'text-gray-400'}`}>Valid Until</p>
                  <p className={`font-semibold ${dark ? 'text-white' : 'text-gray-800'}`}>
                    {user?.planExpiry ? new Date(user.planExpiry).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'}) : '—'}
                  </p>
                </div>
              </div>
              <button className={`mt-4 flex items-center gap-2 text-sm font-semibold ${dark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'}`}>
                <RefreshCw size={14}/> Renew Plan
              </button>
            </div>
          ) : (
            <div className={`rounded-xl p-5 border text-center ${dark ? 'bg-slate-700/40 border-slate-600' : 'bg-gray-50 border-gray-200'}`}>
              <Zap size={32} className="mx-auto mb-3 text-gray-300"/>
              <p className={`text-sm font-semibold mb-1 ${dark ? 'text-slate-300' : 'text-gray-700'}`}>You're on the Free Plan</p>
              <p className={`text-xs mb-4 ${dark ? 'text-slate-500' : 'text-gray-400'}`}>Upgrade to unlock all features and save more on electricity!</p>
              <button onClick={() => { setActivePlan(PLANS_UPSELL[1]); setPayModal(true); }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold shadow hover:from-blue-700 hover:to-indigo-700">
                Upgrade to Pro ⚡
              </button>
            </div>
          )}
        </div>

        {/* ── Payment History ─────────────────────────────────── */}
        <div className={`rounded-2xl border ${card} shadow-sm overflow-hidden`}>
          <div className={`px-6 py-4 border-b flex items-center gap-3 ${dark ? 'border-slate-700' : 'border-gray-100'}`}>
            <FileText size={18} className="text-blue-500"/>
            <h2 className={`font-extrabold ${dark ? 'text-white' : 'text-gray-900'}`}>Payment History</h2>
          </div>
          {transactions.length === 0 ? (
            <div className={`px-6 py-12 text-center ${dark ? 'text-slate-500' : 'text-gray-400'}`}>
              <Clock size={36} className="mx-auto mb-3 opacity-50"/>
              <p className="text-sm font-medium">No transactions yet</p>
              <p className="text-xs mt-1">Your payment history will appear here</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className={`border-b ${dark ? 'border-slate-700 bg-slate-700/30' : 'border-gray-100 bg-gray-50'}`}>
                  <tr>
                    {['Transaction ID','Plan','Amount','Method','Date','Status','Invoice'].map(h => (
                      <th key={h} className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide ${dark ? 'text-slate-400' : 'text-gray-500'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                  {transactions.map((txn, i) => (
                    <tr key={i} className={`transition-colors ${dark ? 'hover:bg-slate-700/30' : 'hover:bg-gray-50'}`}>
                      <td className={`px-4 py-3 font-mono text-xs ${dark ? 'text-slate-400' : 'text-gray-500'}`}>{txn.id || `TXN${i+1}`}</td>
                      <td className={`px-4 py-3 font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>{txn.plan}</td>
                      <td className={`px-4 py-3 font-bold text-green-600`}>₹{txn.amount?.toLocaleString('en-IN')}</td>
                      <td className={`px-4 py-3 capitalize ${dark ? 'text-slate-300' : 'text-gray-700'}`}>{txn.method || '—'}</td>
                      <td className={`px-4 py-3 ${dark ? 'text-slate-400' : 'text-gray-500'}`}>
                        {txn.date ? new Date(txn.date).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'}) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${txn.status === 'success' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-yellow-100 text-yellow-700'}`}>
                          {txn.status === 'success' ? '✅ Paid' : txn.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button className={`text-xs font-semibold flex items-center gap-1 ${dark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'}`}
                          onClick={() => alert('Invoice PDF download coming soon!')}>
                          <Download size={13}/> PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Recommended Plans ───────────────────────────────── */}
        <div>
          <h2 className={`text-lg font-extrabold mb-4 ${dark ? 'text-white' : 'text-gray-900'}`}>
            {hasPlan ? '🔄 Available Plan Upgrades' : '⚡ Recommended Plans'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PLANS_UPSELL.map(p => (
              <div key={p.id} className={`relative rounded-2xl p-5 border ${card} shadow-sm ${p.popular ? `ring-2 ring-${p.color}-500` : ''}`}>
                {p.popular && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-indigo-600 text-white text-xs font-extrabold uppercase tracking-wide">Most Popular</div>
                )}
                <div className="flex items-center gap-2 mb-3">
                  <Star size={16} className={`text-${p.color}-500 fill-${p.color}-400`}/>
                  <span className={`font-extrabold ${dark ? 'text-white' : 'text-gray-900'}`}>{p.name}</span>
                  <span className={`ml-auto text-xs ${dark ? 'text-slate-400' : 'text-gray-500'}`}>{p.period}</span>
                </div>
                <p className={`text-2xl font-black mb-3 ${dark ? 'text-white' : 'text-gray-900'}`}>₹{p.price.toLocaleString('en-IN')}</p>
                <ul className="space-y-1.5 mb-4">
                  {p.features.map((f,i) => (
                    <li key={i} className={`text-xs flex items-center gap-1.5 ${dark ? 'text-slate-400' : 'text-gray-600'}`}>
                      <CheckCircle2 size={12} className="text-green-500 flex-shrink-0"/> {f}
                    </li>
                  ))}
                </ul>
                <button onClick={() => { setActivePlan(p); setPayModal(true); }}
                  className={`w-full py-2 rounded-xl text-sm font-bold transition-all ${p.popular ? `bg-indigo-600 hover:bg-indigo-700 text-white shadow` : `border-2 border-${p.color}-500 text-${p.color}-600 dark:text-${p.color}-400 hover:bg-${p.color}-50 dark:hover:bg-${p.color}-900/20`}`}>
                  Get {p.name}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ── Security badges ─────────────────────────────────── */}
        <div className={`rounded-xl p-4 border ${card} flex flex-wrap items-center justify-center gap-6 text-xs ${dark ? 'text-slate-400' : 'text-gray-500'}`}>
          <span className="flex items-center gap-1.5"><ShieldCheck size={16} className="text-green-500"/> PCI-DSS Compliant</span>
          <span className="flex items-center gap-1.5">🔒 256-bit SSL Encryption</span>
          <span className="flex items-center gap-1.5">✅ RBI regulated payment gateway</span>
          <span className="flex items-center gap-1.5">📞 24/7 customer support</span>
        </div>
      </main>

      <SettingsPage isOpen={settings} onClose={() => setSettings(false)}/>
      <PaymentModal isOpen={payModal} onClose={() => setPayModal(false)}
        plan={activePlan ? { ...activePlan, period: `/${activePlan.period}` } : null}/>
    </div>
  );
}
