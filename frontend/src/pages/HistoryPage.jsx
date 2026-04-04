import { useState, useMemo } from 'react';
import { useTheme, useAuth } from '../App.jsx';
import Header from '../components/Header.jsx';
import SettingsPage from './SettingsPage.jsx';
import { History, Zap, Crown, Calculator, Calendar, Filter, TrendingDown } from 'lucide-react';

// Generate demo history entries ─────────────────────────────────
function generateDemoHistory(user) {
  const now = new Date();
  const entries = [
    {
      type: 'bill',
      icon: '🧾',
      title: 'Bill Calculated — March 2025',
      subtitle: '185.4 kWh consumed',
      amount: '₹1,142',
      date: new Date(now.getFullYear(), now.getMonth(), 1),
      tag: 'Bill', tagColor: 'blue',
    },
    {
      type: 'appliance',
      icon: '❄️',
      title: 'Added: Air Conditioner (1.5T)',
      subtitle: '1100W · Blue Star 5★ · 6h/day · 25 days',
      amount: '~₹430/mo',
      date: new Date(now.getFullYear(), now.getMonth(), 3),
      tag: 'Appliance', tagColor: 'green',
    },
    {
      type: 'appliance',
      icon: '🧊',
      title: 'Added: Refrigerator (5★ Double Door)',
      subtitle: '150W · LG · 24h/day · 30 days',
      amount: '~₹192/mo',
      date: new Date(now.getFullYear(), now.getMonth(), 3),
      tag: 'Appliance', tagColor: 'green',
    },
    {
      type: 'appliance',
      icon: '📺',
      title: 'Added: LED TV (43")',
      subtitle: '80W · Samsung · 6h/day · 30 days',
      amount: '~₹68/mo',
      date: new Date(now.getFullYear(), now.getMonth(), 4),
      tag: 'Appliance', tagColor: 'green',
    },
    {
      type: 'appliance',
      icon: '💨',
      title: 'Added: Ceiling Fan ×2',
      subtitle: '75W each · Havells · 14h/day · 30 days',
      amount: '~₹90/mo',
      date: new Date(now.getFullYear(), now.getMonth(), 4),
      tag: 'Appliance', tagColor: 'green',
    },
    {
      type: 'bill',
      icon: '🧾',
      title: 'Bill Calculated — February 2025',
      subtitle: '162.0 kWh consumed',
      amount: '₹876',
      date: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      tag: 'Bill', tagColor: 'blue',
    },
    {
      type: 'bill',
      icon: '🧾',
      title: 'Bill Calculated — January 2025',
      subtitle: '201.5 kWh consumed',
      amount: '₹1,287',
      date: new Date(now.getFullYear(), now.getMonth() - 2, 1),
      tag: 'Bill', tagColor: 'blue',
    },
    {
      type: 'appliance',
      icon: '🚿',
      title: 'Added: Water Heater (Geyser)',
      subtitle: '2000W · Racold · 1h/day · 25 days',
      amount: '~₹180/mo',
      date: new Date(now.getFullYear(), now.getMonth() - 1, 10),
      tag: 'Appliance', tagColor: 'green',
    },
    {
      type: 'tip',
      icon: '💡',
      title: 'Energy Tip Applied — AC Timer Set',
      subtitle: 'Set AC auto-off timer to reduce 2h/day usage',
      amount: 'Save ~₹80/mo',
      date: new Date(now.getFullYear(), now.getMonth() - 1, 15),
      tag: 'Tip', tagColor: 'amber',
    },
    {
      type: 'tip',
      icon: '🌡️',
      title: 'Optimization — Geyser Thermostat',
      subtitle: 'Reduced thermostat from 65°C to 50°C',
      amount: 'Save ~₹35/mo',
      date: new Date(now.getFullYear(), now.getMonth() - 2, 20),
      tag: 'Tip', tagColor: 'amber',
    },
  ];

  // Add real transactions from localStorage
  const txns = JSON.parse(localStorage.getItem('voltify_transactions') || '[]');
  for (const t of txns) {
    entries.unshift({
      type: 'payment',
      icon: '💳',
      title: `Purchased ${t.plan} Plan`,
      subtitle: `Payment via ${t.method || 'online'} · ${t.id || 'TXN'}`,
      amount: `₹${t.amount?.toLocaleString('en-IN')}`,
      date: new Date(t.date),
      tag: 'Payment', tagColor: 'purple',
    });
  }

  return entries.sort((a, b) => b.date - a.date);
}

const TAG_COLORS = {
  blue:   { pill: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',   dot: 'bg-blue-500' },
  green:  { pill: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300', dot: 'bg-green-500' },
  amber:  { pill: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300', dot: 'bg-amber-500' },
  purple: { pill: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300', dot: 'bg-purple-500' },
};

const FILTER_OPTIONS = ['All', 'Bill', 'Appliance', 'Payment', 'Tip'];

export default function HistoryPage() {
  const { dark }    = useTheme();
  const { user }    = useAuth();
  const [settings,  setSettings]  = useState(false);
  const [filter,    setFilter]    = useState('All');

  const history = useMemo(() => generateDemoHistory(user), [user]);
  const filtered = filter === 'All' ? history : history.filter(h => h.tag === filter);

  const bg   = dark ? 'bg-slate-950' : 'bg-gray-50';
  const card = dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200';

  // Quick stats
  const totalBills    = history.filter(h => h.tag === 'Bill').length;
  const totalApps     = history.filter(h => h.tag === 'Appliance').length;
  const totalPayments = history.filter(h => h.tag === 'Payment').length;

  return (
    <div className={`min-h-screen ${bg}`}>
      <Header onSettingsOpen={() => setSettings(true)}/>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Page title */}
        <div>
          <h1 className={`text-2xl font-black ${dark ? 'text-white' : 'text-gray-900'}`}>📋 History</h1>
          <p className={`text-sm mt-1 ${dark ? 'text-slate-400' : 'text-gray-500'}`}>Your complete Voltify activity timeline</p>
        </div>

        {/* ── Quick Stats ──────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Bills Tracked',    value: totalBills,    icon: Calculator, color: 'blue' },
            { label: 'Appliances Added', value: totalApps,     icon: Zap,        color: 'green' },
            { label: 'Payments Made',    value: totalPayments, icon: Crown,      color: 'purple' },
            { label: 'Months Active',    value: '3',           icon: Calendar,   color: 'amber' },
          ].map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} className={`rounded-2xl p-4 border ${card} shadow-sm`}>
                <div className={`w-9 h-9 rounded-xl mb-3 flex items-center justify-center bg-${s.color}-100 dark:bg-${s.color}-900/30`}>
                  <Icon size={18} className={`text-${s.color}-600`}/>
                </div>
                <p className={`text-2xl font-black ${dark ? 'text-white' : 'text-gray-900'}`}>{s.value}</p>
                <p className={`text-xs ${dark ? 'text-slate-500' : 'text-gray-400'}`}>{s.label}</p>
              </div>
            );
          })}
        </div>

        {/* ── Filter tabs ──────────────────────────────────────── */}
        <div className="flex flex-wrap gap-2 items-center">
          <Filter size={14} className={dark ? 'text-slate-500' : 'text-gray-400'}/>
          {FILTER_OPTIONS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                filter === f
                  ? 'bg-blue-600 text-white border-blue-600 shadow'
                  : dark ? 'border-slate-600 text-slate-400 hover:border-slate-400' : 'border-gray-200 text-gray-500 hover:border-gray-400'
              }`}>
              {f}
            </button>
          ))}
          <span className={`ml-auto text-xs ${dark ? 'text-slate-500' : 'text-gray-400'}`}>{filtered.length} entries</span>
        </div>

        {/* ── Timeline ─────────────────────────────────────────── */}
        <div className="relative">
          {/* Vertical line */}
          <div className={`absolute left-5 top-0 bottom-0 w-0.5 ${dark ? 'bg-slate-700' : 'bg-gray-200'}`}/>

          <div className="space-y-4">
            {filtered.map((item, i) => {
              const colors = TAG_COLORS[item.tagColor] || TAG_COLORS.blue;
              return (
                <div key={i} className="relative flex gap-4 pl-4">
                  {/* Dot */}
                  <div className={`absolute left-3.5 top-4 w-3 h-3 rounded-full border-2 border-white dark:border-slate-950 ${colors.dot} z-10`}/>

                  {/* Card */}
                  <div className={`ml-8 flex-1 rounded-2xl p-4 border shadow-sm ${card} transition-all hover:shadow-md`}>
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{item.icon}</span>
                        <div>
                          <p className={`text-sm font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>{item.title}</p>
                          <p className={`text-xs mt-0.5 ${dark ? 'text-slate-400' : 'text-gray-500'}`}>{item.subtitle}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colors.pill}`}>{item.tag}</span>
                        <span className={`text-sm font-bold ${item.tag === 'Tip' ? 'text-green-600' : dark ? 'text-white' : 'text-gray-900'}`}>{item.amount}</span>
                        <span className={`text-xs ${dark ? 'text-slate-500' : 'text-gray-400'}`}>
                          {item.date.toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'})}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Insight box */}
        <div className={`rounded-2xl p-5 border ${dark ? 'bg-gradient-to-r from-amber-900/20 to-yellow-900/10 border-amber-700/30' : 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200'}`}>
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown size={18} className="text-amber-500"/>
            <p className={`font-bold text-sm ${dark ? 'text-amber-300' : 'text-amber-800'}`}>Usage Trend Insight</p>
          </div>
          <p className={`text-xs leading-relaxed ${dark ? 'text-amber-200/70' : 'text-amber-700'}`}>
            Your electricity consumption has been <strong>consistent</strong> at ~185 units/month. 
            You're in the ₹3.80/unit MSEDCL slab (101–300 units) — well-managed! 
            Reducing usage by 30 units could put you in the cheaper ₹1.45/unit slab for the first 100 units.
          </p>
        </div>
      </main>

      <SettingsPage isOpen={settings} onClose={() => setSettings(false)}/>
    </div>
  );
}
