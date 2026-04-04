import { useState, useEffect } from 'react';
import { Target, ArrowRight, Lock, ChevronDown, Lightbulb, TrendingDown, CheckCircle2 } from 'lucide-react';
import { useTheme, useAuth } from '../App.jsx';

function useCountUp(endValue, durationMs = 1000, start = true) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime = null;
    let animId;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const ratio = Math.min(progress / durationMs, 1);
      const ease = ratio === 1 ? 1 : 1 - Math.pow(2, -10 * ratio);
      setVal(Math.floor(ease * endValue));
      if (ratio < 1) animId = requestAnimationFrame(step);
    };
    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [endValue, durationMs, start]);
  return val;
}

// Realistic MSEDCL-based suggestions keyed to appliance type
const ALL_SUGGESTIONS = [
  {
    appliance: 'Air Conditioner (1.5T)',
    icon: '❄️',
    category: 'Cooling',
    impact: 'High',
    save: 280,
    current: 8,
    target: 5.5,
    tips: [
      'Set thermostat to 24°C instead of 22°C — each 1°C saves ~6% energy',
      'Use sleep mode at night to gradually reduce cooling by 0.5°C/hr',
      'Enable 2h timer — most people fall asleep within 45 minutes of turning AC on',
    ],
  },
  {
    appliance: 'Water Heater (Geyser)',
    icon: '🚿',
    category: 'Heating',
    impact: 'High',
    save: 140,
    current: 3,
    target: 0.75,
    tips: [
      'Use a timer plug — heat water only 30 min before bathing needs',
      'Reduce thermostat from 65°C to 50°C — saves 20% energy per cycle',
      'Consider solar geyser for 90% year-round savings on water heating',
    ],
  },
  {
    appliance: 'Ceiling Fan ×4',
    icon: '💨',
    category: 'Ventilation',
    impact: 'Medium',
    save: 55,
    current: 18,
    target: 14,
    tips: [
      'Turn off fans when leaving the room — important habit for 4 fans',
      'Upgrading to BEE 5★ inverter fans (28W) from standard (75W) saves ₹45/fan/month',
    ],
  },
  {
    appliance: 'Washing Machine',
    icon: '🫧',
    category: 'Appliance',
    impact: 'Medium',
    save: 65,
    current: 4,
    target: 2.5,
    tips: [
      'Always run full loads — half load uses near-same energy as full load',
      'Use cold water/quick wash mode for 80% of washes',
      'Wash during off-peak hours (before 8 AM or after 10 PM)',
    ],
  },
  {
    appliance: 'Refrigerator',
    icon: '🧊',
    category: 'Kitchen',
    impact: 'Low',
    save: 40,
    current: 24,
    target: 24,
    tips: [
      'Keep coils clean — dust buildup increases consumption by 10–25%',
      'Maintain 3–5 cm wall gap for ventilation to avoid motor overheating',
      'Avoid loading hot food — temperature equilibration wastes 15% energy',
    ],
  },
  {
    appliance: 'LED TV (43")',
    icon: '📺',
    category: 'Entertainment',
    impact: 'Low',
    save: 20,
    current: 8,
    target: 6,
    tips: [
      'Enable sleep timer — TVs left on standby draw 5W continuously',
      'Reduce screen brightness (from 100% to 60%) — saves 25-30% display power',
    ],
  },
];

const IMPACT_COLORS = {
  High:   { pill: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',    bar: '#DC2626', barBg: 'bg-red-100 dark:bg-red-900/20' },
  Medium: { pill: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400', bar: '#F97316', barBg: 'bg-orange-50 dark:bg-orange-900/10' },
  Low:    { pill: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',  bar: '#16A34A', barBg: 'bg-green-50 dark:bg-green-900/10' },
};

// Recommendation engine — pick top suggestions that cover the deficit
function generateRecommendations(target, currentBill) {
  const deficit  = currentBill - target;
  if (deficit <= 0) return [];
  const sorted   = [...ALL_SUGGESTIONS].sort((a, b) => b.save - a.save);
  const picks    = [];
  let cumSavings = 0;
  for (const s of sorted) {
    picks.push(s);
    cumSavings += s.save;
    if (cumSavings >= deficit) break;
  }
  return picks;
}

export default function Card2_BudgetPlanner() {
  const { dark } = useTheme();
  const { user } = useAuth();
  const isPro    = user?.subscriptionStatus && user.subscriptionStatus !== 'Free';

  const [target, setTarget] = useState(() => {
    try { return Number(localStorage.getItem('voltify_budget_target') || 1000); } catch { return 1000; }
  });
  const [applied,     setApplied]     = useState(false);
  const [showPaywall, setShowPaywall] = useState(!isPro);
  const [expanded,    setExpanded]    = useState({});

  useEffect(() => {
    localStorage.setItem('voltify_budget_target', target);
  }, [target]);

  const currentBill   = 1142;  // realistic MSEDCL bill for typical home
  const gaugePercent  = Math.min((target / currentBill) * 100, 100);
  const overBudget    = target < currentBill;
  const deficit       = currentBill - target;
  const recommendations = generateRecommendations(target, currentBill);
  const totalSavings  = recommendations.reduce((s, r) => s + r.save, 0);

  const surface = dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200';

  const animTarget  = useCountUp(target, 1200, applied);
  const animCurrent = useCountUp(currentBill, 1200, applied);

  return (
    <section className={`card ${surface} border p-6 animate-fade-in-up`} id="card-budget-planner">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <Target size={20} className="text-green-600"/>
        </div>
        <div>
          <h2 className={`text-lg font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>Budget Planner</h2>
          <p className={`text-xs ${dark ? 'text-slate-400' : 'text-gray-500'}`}>Set a target and get a smart cutdown plan</p>
        </div>
        {!isPro && (
          <span className="ml-auto text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
            {user?.freemiumUses || 2}/3 Uses Left
          </span>
        )}
      </div>

      {/* ── Input Row ──────────────────────────────────────── */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <span className={`absolute left-3 top-1/2 -translate-y-1/2 font-bold text-lg ${dark ? 'text-slate-400' : 'text-gray-400'}`}>₹</span>
          <input id="input-target-budget" type="number" value={target} min={100}
            onKeyDown={e => { if (e.key === '-' || e.key === 'e' || e.key === 'E') e.preventDefault(); }}
            onChange={e => {
              let val = Number(e.target.value);
              setTarget(val);
              setApplied(false);
            }}
            onBlur={() => {
              if (target < 100) { setTarget(100); setApplied(false); }
            }}
            className={`w-full pl-8 pr-4 py-3 rounded-xl border text-xl font-bold ${dark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
        </div>
        <button id="btn-apply-budget" onClick={() => setApplied(true)}
          className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow flex items-center gap-2">
          Analyse <ArrowRight size={16}/>
        </button>
      </div>

      {/* ── Visual Gauge ──────────────────────────────────── */}
      <div className={`rounded-xl p-4 mb-5 ${dark ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
        <div className="flex justify-between text-xs font-semibold mb-2">
          <span className={dark ? 'text-slate-400' : 'text-gray-500'}>₹0</span>
          <span className={overBudget ? 'text-red-500 font-bold' : 'text-green-600 font-bold'}>
            Target: ₹{(applied ? animTarget : target).toLocaleString('en-IN')}
          </span>
          <span className={dark ? 'text-slate-400' : 'text-gray-500'}>₹{(applied ? animCurrent : currentBill).toLocaleString('en-IN')} (Current)</span>
        </div>
        <div className={`relative h-5 rounded-full overflow-hidden ${dark ? 'bg-slate-600' : 'bg-gray-200'}`}>
          <div className="absolute inset-0 rounded-full bg-red-400/30"/>
          <div className="h-full rounded-full transition-all duration-700 ease-out"
            style={{ width: `${gaugePercent}%`, background: overBudget ? '#DC2626' : '#16A34A' }}/>
          <div className="absolute right-0 top-0 bottom-0 w-1 bg-red-600 rounded-r-full"/>
        </div>
        <div className="flex justify-between mt-2">
          <span className={`text-xs ${dark ? 'text-slate-500' : 'text-gray-500'}`}>Your target</span>
          {overBudget
            ? <span className="text-xs font-bold text-red-500">₹{deficit.toLocaleString('en-IN')} over budget — cuts needed</span>
            : <span className="text-xs font-bold text-green-600">✓ Budget achievable!</span>}
        </div>
      </div>

      {/* ── Suggestions List ────────────────────────────────── */}
      {applied && (
        <div className="relative">
          {overBudget && (
            <div className={`mb-4 flex items-center gap-3 px-4 py-3 rounded-xl border ${dark ? 'bg-indigo-900/20 border-indigo-700/40' : 'bg-indigo-50 border-indigo-200'}`}>
              <Lightbulb size={18} className="text-indigo-500 flex-shrink-0"/>
              <div>
                <p className={`text-sm font-bold ${dark ? 'text-indigo-300' : 'text-indigo-700'}`}>Smart Plan Generated</p>
                <p className={`text-xs ${dark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                  Following these {recommendations.length} steps can save ~₹{totalSavings}/month and bring you within budget.
                </p>
              </div>
            </div>
          )}

          {!overBudget && (
            <div className={`mb-4 flex items-center gap-3 px-4 py-3 rounded-xl border ${dark ? 'bg-green-900/20 border-green-700/40' : 'bg-green-50 border-green-200'}`}>
              <CheckCircle2 size={18} className="text-green-500 flex-shrink-0"/>
              <div>
                <p className={`text-sm font-bold ${dark ? 'text-green-300' : 'text-green-700'}`}>Budget is Achievable! 🎉</p>
                <p className={`text-xs ${dark ? 'text-green-400' : 'text-green-600'}`}>
                  Your current bill estimate (₹{currentBill}) is within your ₹{target.toLocaleString('en-IN')} target.
                </p>
              </div>
            </div>
          )}

          <p className={`text-sm font-bold mb-3 ${dark ? 'text-slate-200' : 'text-gray-800'}`}>
            Suggested Reductions to Hit ₹{target.toLocaleString('en-IN')}
          </p>

          <div className="space-y-3">
            {ALL_SUGGESTIONS.map((s, i) => {
              const blurred    = showPaywall && i >= 2;
              const impColors  = IMPACT_COLORS[s.impact];
              const isExpanded = expanded[i];

              return (
                <div key={i} id={`suggestion-item-${i}`}
                  className={`relative rounded-xl border overflow-hidden transition-all ${dark ? 'bg-slate-700/60 border-slate-600' : 'bg-gray-50 border-gray-200'} ${blurred ? 'pointer-events-none select-none' : ''}`}
                  style={blurred ? { filter: 'blur(4px)' } : {}}>

                  {/* Header row */}
                  <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={() => !blurred && setExpanded(e => ({ ...e, [i]: !e[i] }))}>
                    <span className="text-xl flex-shrink-0">{s.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-sm font-bold truncate ${dark ? 'text-white' : 'text-gray-900'}`}>{s.appliance}</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${impColors.pill}`}>{s.impact} Impact</span>
                      </div>
                      <div className="flex items-center justify-between text-xs flex-wrap gap-1">
                        <span className={dark ? 'text-slate-400' : 'text-gray-500'}>
                          Reduce: {s.current}h → {s.target}h /day
                        </span>
                        <span className="font-bold text-green-600">Save ₹{s.save}/mo</span>
                      </div>
                    </div>
                    {!blurred && <ChevronDown size={16} className={`flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''} ${dark ? 'text-slate-500' : 'text-gray-400'}`}/>}
                  </div>

                  {/* Savings bar */}
                  <div className={`px-4 pb-3`}>
                    <div className={`h-1.5 rounded-full ${dark ? 'bg-slate-600' : 'bg-gray-200'}`}>
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${(s.save / 280) * 100}%`, background: impColors.bar }}/>
                    </div>
                  </div>

                  {/* Expanded tips */}
                  {isExpanded && !blurred && (
                    <div className={`px-4 pb-4 pt-1 border-t ${dark ? 'border-slate-600 bg-slate-700/30' : 'border-gray-100 bg-white'}`}>
                      <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${dark ? 'text-slate-400' : 'text-gray-500'}`}>
                        <TrendingDown size={10} className="inline mr-1"/> Action Tips
                      </p>
                      <ul className="space-y-1.5">
                        {s.tips.map((tip, ti) => (
                          <li key={ti} className={`text-xs flex items-start gap-2 ${dark ? 'text-slate-300' : 'text-gray-600'}`}>
                            <span className="text-green-500 flex-shrink-0 mt-0.5">•</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Paywall Overlay */}
          {showPaywall && (
            <div className="absolute bottom-0 left-0 right-0 h-52 rounded-b-xl flex flex-col items-center justify-end pb-4 px-4"
              style={{ background: dark ? 'linear-gradient(to top, rgba(15,23,42,1) 60%, transparent)' : 'linear-gradient(to top, rgba(249,250,251,1) 60%, transparent)' }}>
              <div className={`text-center rounded-xl p-4 border shadow-lg w-full max-w-xs ${dark ? 'bg-slate-800 border-slate-600' : 'bg-white border-gray-200'}`}>
                <Lock size={24} className="mx-auto mb-2 text-purple-500"/>
                <p className={`text-sm font-bold mb-1 ${dark ? 'text-white' : 'text-gray-900'}`}>{ALL_SUGGESTIONS.length - 2} More Suggestions Hidden</p>
                <p className={`text-xs mb-3 ${dark ? 'text-slate-400' : 'text-gray-500'}`}>Upgrade to Pro for the full plan + action tips</p>
                <button id="btn-upgrade-budget-planner" onClick={() => setShowPaywall(false)}
                  className="w-full py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-bold hover:from-purple-700 hover:to-indigo-700">
                  Upgrade to Premium ⚡
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
