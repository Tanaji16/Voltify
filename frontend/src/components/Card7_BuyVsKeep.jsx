import { useState } from 'react';
import { useTheme } from '../App.jsx';
import { RefreshCcw, HandCoins, ArrowRight, BatteryCharging, Zap, MonitorSmartphone } from 'lucide-react';

const PRESETS = [
  { label: 'Old 1.5T AC vs New 5★ AC', oldWatts: 1800, newWatts: 1000, newPrice: 38000, hours: 8, monthsUsed: 8 },
  { label: 'Old Fridge vs New 5★ Double Door', oldWatts: 250, newWatts: 120, newPrice: 28000, hours: 24, monthsUsed: 12 },
  { label: 'Standard Fan vs 5★ BLDC', oldWatts: 75, newWatts: 28, newPrice: 3200, hours: 14, monthsUsed: 10 },
  { label: 'Old Tube Light vs LED Bulb', oldWatts: 40, newWatts: 9, newPrice: 150, hours: 6, monthsUsed: 12 },
  { label: 'Custom Comparison', oldWatts: '', newWatts: '', newPrice: '', hours: 4, monthsUsed: 12 }
];

// We use a flat blended rate of ₹8.5 for typical ROI bounds in MSEDCL
const ELECTRICITY_RATE = 8.5;

export default function Card7_BuyVsKeep() {
  const { dark } = useTheme();
  
  const [presetIdx, setPresetIdx] = useState(0);
  const [oldWatts, setOldWatts] = useState(PRESETS[0].oldWatts);
  const [newWatts, setNewWatts] = useState(PRESETS[0].newWatts);
  const [newPrice, setNewPrice] = useState(PRESETS[0].newPrice);
  const [hours, setHours] = useState(PRESETS[0].hours);
  const [monthsActive, setMonthsActive] = useState(PRESETS[0].monthsUsed); // e.g. AC is used 8 months/yr

  // Change preset safely
  const handlePresetChange = (idx) => {
    setPresetIdx(idx);
    const p = PRESETS[idx];
    setOldWatts(p.oldWatts);
    setNewWatts(p.newWatts);
    setNewPrice(p.newPrice);
    setHours(p.hours);
    setMonthsActive(p.monthsUsed);
  };

  // ── Calculation Math ───────────────────────────────────────
  // kWh per month = (watts / 1000) * hours/day * 30 days
  const oldKwhPerMonth = ((Number(oldWatts) || 0) / 1000) * (Number(hours) || 0) * 30;
  const newKwhPerMonth = ((Number(newWatts) || 0) / 1000) * (Number(hours) || 0) * 30;
  
  const oldCostPerMonth = oldKwhPerMonth * ELECTRICITY_RATE;
  const newCostPerMonth = newKwhPerMonth * ELECTRICITY_RATE;

  const monthlySavings = Math.max(0, oldCostPerMonth - newCostPerMonth);
  // Annualized savings accounting for months it's actually used
  const yearlySavings = monthlySavings * (Number(monthsActive) || 12);
  const price = Number(newPrice) || 0;
  
  // Payback period (Years & Months)
  let paybackYears = 0;
  let paybackMonthsTotal = 0;
  
  if (yearlySavings > 0 && price > 0) {
    paybackYears = price / yearlySavings;
    paybackMonthsTotal = (price / monthlySavings); // strictly active months
  }

  const surface = dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200';
  const inputTheme = dark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900';

  return (
    <section className={`card ${surface} border p-6 animate-fade-in-up`} id="card-buy-vs-keep">
      
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
          <RefreshCcw size={20} className="text-teal-600" />
        </div>
        <div>
          <h2 className={`text-lg font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>{`"Buy vs. Keep" Calculator`}</h2>
          <p className={`text-xs ${dark ? 'text-slate-400' : 'text-gray-500'}`}>See when a new appliance pays for itself</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* ── LEFT: Form ───────────────────────────────────── */}
        <div className="space-y-4">
          
          {/* Presets */}
          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wide mb-1.5 ${dark ? 'text-slate-400' : 'text-gray-500'}`}>Quick Presets</label>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p, i) => (
                <button key={i} onClick={() => handlePresetChange(i)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    presetIdx === i ? 'bg-teal-600 text-white border-teal-600 shadow-md' : 
                    dark ? 'border-slate-600 text-slate-300 hover:border-teal-500 hover:text-teal-400' : 'border-gray-200 text-gray-600 hover:border-teal-500 hover:text-teal-600'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <label className={`block text-xs font-semibold tracking-wide mb-1.5 ${dark ? 'text-slate-400' : 'text-gray-500'}`}>Old Appliance (Watts)</label>
              <div className="relative">
                <BatteryCharging size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${dark ? 'text-slate-500' : 'text-gray-400'}`} />
                <input type="number" min="0" value={oldWatts} onChange={e => {setOldWatts(e.target.value); setPresetIdx(4);}}
                  className={`w-full pl-9 pr-3 py-2 rounded-lg border text-sm font-bold ${inputTheme} focus:outline-none focus:border-teal-500`}
                />
              </div>
            </div>
            
            <div>
              <label className={`block text-xs font-semibold tracking-wide mb-1.5 text-green-600 dark:text-green-400`}>New Appliance (Watts)</label>
              <div className="relative">
                <Zap size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${dark ? 'text-green-600/70' : 'text-green-500/70'}`} />
                <input type="number" min="0" value={newWatts} onChange={e => {setNewWatts(e.target.value); setPresetIdx(4);}}
                  className={`w-full pl-9 pr-3 py-2 rounded-lg border border-green-300 dark:border-green-800 text-sm font-bold ${dark ? 'bg-green-900/10 text-green-400' : 'bg-green-50 text-green-700'} focus:outline-none focus:ring-1 focus:ring-green-500`}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
              <label className={`block text-xs font-semibold tracking-wide mb-1.5 ${dark ? 'text-slate-400' : 'text-gray-500'}`}>Cost of New Tool (₹)</label>
              <div className="relative">
                <span className={`absolute left-3 top-1/2 -translate-y-1/2 font-bold ${dark ? 'text-slate-400' : 'text-gray-400'}`}>₹</span>
                <input type="number" min="0" value={newPrice} onChange={e => {setNewPrice(e.target.value); setPresetIdx(4);}}
                  className={`w-full pl-8 pr-3 py-2 rounded-lg border text-sm font-bold ${inputTheme} focus:outline-none focus:border-teal-500`}
                />
              </div>
            </div>

            <div>
              <label className={`block text-xs font-semibold tracking-wide mb-1.5 ${dark ? 'text-slate-400' : 'text-gray-500'}`}>Avg. Hours Used / Day</label>
              <div className="relative">
                <MonitorSmartphone size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${dark ? 'text-slate-500' : 'text-gray-400'}`} />
                <input type="number" min="1" max="24" value={hours} onChange={e => {setHours(e.target.value); setPresetIdx(4);}}
                  className={`w-full pl-9 pr-3 py-2 rounded-lg border text-sm font-bold ${inputTheme} focus:outline-none focus:border-teal-500`}
                />
              </div>
            </div>
          </div>
          
          <div>
            <label className={`block text-xs font-semibold tracking-wide mb-1.5 ${dark ? 'text-slate-400' : 'text-gray-500'}`}>
              Months Active per Year <span className="font-normal">(e.g. ACs run ~8 months)</span>
            </label>
             <input type="range" min="1" max="12" value={monthsActive} onChange={e => {setMonthsActive(e.target.value); setPresetIdx(4);}}
               className="w-full accent-teal-600"
             />
             <div className="flex justify-between text-xs mt-1 dark:text-slate-400 text-gray-500 font-bold">
               <span>1mo</span>
               <span className="text-teal-600">{monthsActive} Months</span>
               <span>12mo</span>
             </div>
          </div>
          
        </div>


        {/* ── RIGHT: Results ───────────────────────────────── */}
        <div className="flex flex-col h-full space-y-4">
          
          {/* Payback Visualiser */}
          <div className={`p-5 rounded-2xl border flex-1 flex flex-col justify-center text-center ${
            dark ? 'bg-gradient-to-b from-teal-900/30 to-slate-800 border-teal-800/40' : 'bg-gradient-to-b from-teal-50 to-white border-teal-200'
          }`}>
            <HandCoins size={36} className={`mx-auto mb-2 ${dark ? 'text-teal-400' : 'text-teal-600'}`}/>
            
            <p className={`text-sm font-bold mb-1 ${dark ? 'text-slate-300' : 'text-slate-700'}`}>Your ROI / Payback Time</p>
            
            {paybackYears > 0 && paybackYears < 30 ? (
               <>
                 <div className="text-4xl font-black text-teal-600 dark:text-teal-400 mb-2">
                   {paybackYears < 1 ? '< 1 Year' : `${paybackYears.toFixed(1)} Years`}
                 </div>
                 <p className={`text-xs px-4 ${dark ? 'text-teal-200/70' : 'text-teal-800'}`}>
                   In exactly <strong>{Math.ceil(paybackMonthsTotal)} active months</strong>, electricity savings will pay off the ₹{price.toLocaleString('en-IN')} upfront cost.
                 </p>
               </>
            ) : price <= 0 ? (
               <p className={`text-sm ${dark ? 'text-slate-400' : 'text-gray-500'}`}>Enter a valid price above.</p>
            ) : paybackYears >= 30 ? (
               <p className="text-sm font-bold text-red-500">Not Worth It (30+ Years)</p>
            ) : (
                <p className="text-sm font-bold text-red-500">Old appliance uses less power!</p>
            )}
          </div>

          {/* Breakdown Grid */}
          <div className="grid grid-cols-2 gap-3">
             <div className={`p-4 rounded-xl border ${dark ? 'bg-slate-700/50 border-slate-600' : 'bg-red-50/50 border-red-100'}`}>
                <p className={`text-xs uppercase font-bold tracking-wider mb-1 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Monthly Cost</p>
                <p className={`text-lg font-black ${dark ? 'text-white' : 'text-gray-900'}`}>₹{Math.round(oldCostPerMonth).toLocaleString('en-IN')}</p>
                <p className="text-xs text-red-500 font-semibold mt-0.5 whitespace-nowrap">Old Appliance</p>
             </div>
             
             <div className={`p-4 rounded-xl border relative overflow-hidden ${dark ? 'bg-teal-900/40 border-teal-700' : 'bg-teal-50 border-teal-200'}`}>
                <p className={`text-xs uppercase font-bold tracking-wider mb-1 ${dark ? 'text-teal-300' : 'text-teal-700'}`}>Monthly Cost</p>
                <div className="flex items-center gap-2">
                   <p className="text-lg font-black text-teal-600 dark:text-teal-400">₹{Math.round(newCostPerMonth).toLocaleString('en-IN')}</p>
                </div>
                <p className="text-xs text-teal-600 dark:text-teal-400 font-semibold mt-0.5 whitespace-nowrap">New Appliance</p>
             </div>
          </div>
          
          <div className={`px-4 py-3 rounded-lg border border-dashed flex items-center justify-between ${dark ? 'bg-green-900/20 border-green-700/50' : 'bg-green-50 border-green-300'}`}>
             <p className={`text-sm font-bold ${dark ? 'text-green-400' : 'text-green-700'}`}>Yearly Savings</p>
             <p className="text-lg font-black text-green-500">₹{Math.round(yearlySavings).toLocaleString('en-IN')}</p>
          </div>

        </div>
      </div>
    </section>
  );
}
