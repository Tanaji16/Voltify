import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Plus, Minus, Download, Zap, Lock, Lightbulb, AlertCircle, Trash2, ChevronDown } from 'lucide-react';
import { useTheme, useAuth } from '../App.jsx';

// ── MSEDCL 2024 Tariff Slabs ─────────────────────────────────
// Source: Maharashtra Electricity Regulatory Commission Order 2024
function calculateMSEDCLBill(totalKwh) {
  let bill = 0;
  let remaining = totalKwh;

  // Slab 1: 0–100 units @ ₹1.45/unit + fixed ₹85
  const s1 = Math.min(remaining, 100);
  bill += s1 * 1.45;
  remaining -= s1;

  // Slab 2: 101–300 units @ ₹3.80/unit
  if (remaining > 0) {
    const s2 = Math.min(remaining, 200);
    bill += s2 * 3.80;
    remaining -= s2;
  }

  // Slab 3: 301–500 units @ ₹6.00/unit
  if (remaining > 0) {
    const s3 = Math.min(remaining, 200);
    bill += s3 * 6.00;
    remaining -= s3;
  }

  // Slab 4: 501+ units @ ₹8.00/unit
  if (remaining > 0) {
    bill += remaining * 8.00;
  }

  // Fixed charges
  if (totalKwh <= 100) bill += 85;
  else if (totalKwh <= 300) bill += 165;
  else bill += 225;

  // Fuel surcharge ~₹0.15/unit
  bill += totalKwh * 0.15;

  return Math.round(bill);
}

// ── Appliance Wattage Database (BEE Research) ─────────────────
// Real watt ratings based on BEE star labelling program 2024
const APPLIANCE_WATTAGE_DB = {
  // Air Conditioners
  'Air Conditioner (1.5T) — 5★':   1100,
  'Air Conditioner (1.5T) — 4★':   1250,
  'Air Conditioner (1.5T) — 3★':   1450,
  'Air Conditioner (1.5T) — 2★':   1650,
  'Air Conditioner (1.5T) — 1★':   1800,
  'Air Conditioner (1T) — 5★':     750,
  'Air Conditioner (1T) — 3★':     1000,
  'Air Conditioner (2T) — 5★':     1600,
  'Air Conditioner (2T) — 3★':     2100,
  // Refrigerators
  'Refrigerator (Single Door 5★)':  80,
  'Refrigerator (Single Door 3★)':  130,
  'Refrigerator (Double Door 5★)':  150,
  'Refrigerator (Double Door 3★)':  220,
  'Refrigerator (Side-by-Side 5★)': 280,
  // Washing Machines
  'Washing Machine (5★ Front Load)': 800,
  'Washing Machine (5★ Top Load)':   400,
  'Washing Machine (3★ Top Load)':   650,
  'Washing Machine (Semi-Auto)':     380,
  // Fans
  'Ceiling Fan (5★ Inverter)':      28,
  'Ceiling Fan (Standard)':         75,
  'Table Fan':                      35,
  'Exhaust Fan':                    40,
  // TVs
  'LED TV (32") — 5★':             40,
  'LED TV (43") — 5★':             75,
  'LED TV (43") — 3★':             100,
  'LED TV (55") — 5★':             100,
  'LED TV (55") — 3★':             140,
  'OLED TV (55")':                  145,
  // Water Heaters
  'Water Heater/Geyser (10L)':     2000,
  'Water Heater/Geyser (15L)':     2000,
  'Water Heater/Geyser (25L)':     2000,
  'Instant Water Heater (3L)':     3000,
  'Solar Water Heater (Backup)':   500,
  // Cooking
  'Microwave Oven (Solo)':         1200,
  'Microwave Oven (Convection)':   1800,
  'Electric Induction Cooktop':    1800,
  'Electric Rice Cooker':          600,
  'Mixer/Blender':                 500,
  // Lighting
  'LED Bulb (9W)':                 9,
  'LED Bulb (14W)':                14,
  'LED Tubelight (20W)':           20,
  'CFL Bulb':                      23,
  // Computers
  'Laptop':                        65,
  'Desktop PC':                    250,
  'Wi-Fi Router':                  10,
  // Appliances
  'Electric Iron':                 1200,
  'Water Pump (0.5 HP)':           375,
  'Water Pump (1 HP)':             750,
  'Dishwasher (5★)':              1400,
  'Air Purifier':                  60,
  'Treadmill':                    1500,
  'Electric Geyser (Instant)':    3000,
  'Other':                         100,
};

const APPLIANCES = Object.keys(APPLIANCE_WATTAGE_DB);
const DAYS_CHIPS = [7, 10, 15, 20, 25, 30];
const EFF_CHIPS  = [
  { label: 'Standard', value: 'Standard' },
  { label: '1★', value: 'BEE 1-Star' },
  { label: '2★', value: 'BEE 2-Star' },
  { label: '3★', value: 'BEE 3-Star' },
  { label: '4★', value: 'BEE 4-Star' },
  { label: '5★', value: 'BEE 5-Star' },
];
const MAX_FREE_USES = 3;

// ── Smart advice generator ────────────────────────────────────
function generateSmartAdvice(applianceList) {
  if (!applianceList || applianceList.length === 0) {
    return ['Add appliances to get personalized smart advice!'];
  }
  const advice = [];
  for (const item of applianceList) {
    const name = (item.name || '').toLowerCase();
    if (name.includes('air cond') || name.includes('ac')) {
      advice.push(`❄️ AC is your top consumer (~${item.kWh?.toFixed(0)} kWh/mo). Set to 24°C and use sleep mode — saves up to ₹${Math.round((item.kWh || 40) * 0.8)}/month.`);
      advice.push('❄️ Clean AC filters monthly — dirty filters increase power consumption by 15–25%.');
      advice.push('❄️ Use AC timer: auto-off 1h after sleeping saves ~3h of usage nightly.');
    }
    if (name.includes('geyser') || name.includes('water heat')) {
      advice.push(`🚿 Geyser uses ${item.kWh?.toFixed(0)} kWh. Set thermostat to 50°C (not 65°C) — saves 20% energy.`);
      advice.push('🚿 Use a plug timer for the geyser: on at 6:30 AM, off at 7:30 AM. Never heat passively all day.');
    }
    if (name.includes('refrigerator') || name.includes('fridge')) {
      advice.push('🧊 Refrigerator tip: Keep 3–5 cm gap behind the fridge for ventilation. Clean coils every 3 months.');
      advice.push('🧊 Never put hot food in the fridge — it raises the internal temperature and wastes ~15% more energy.');
    }
    if (name.includes('washing')) {
      advice.push('🫧 Washing Machine: Use cold water mode for 80% of your washes. Hot water uses 90% of the cycle energy.');
      advice.push('🫧 Run full loads only — a half-loaded machine consumes the same energy as a full one.');
    }
    if (name.includes('fan')) {
      advice.push('💨 Switch off fans when leaving the room — even 2 fans × 2 hours fewer = saving ₹20/month.');
      advice.push('💨 Upgrade to a BEE 5★ inverter fan (28W) from standard (75W) — saves ₹35–45/fan/month.');
    }
    if (name.includes('tv') || name.includes('television')) {
      advice.push('📺 Enable sleep timer on your TV — a TV left on standby still draws 5W all night.');
    }
  }
  if (advice.length === 0) {
    advice.push('💡 Track more appliances for personalized advice!');
    advice.push('💡 Tip: Focus on reducing usage of your top 2 consumers — that covers 70%+ of savings potential.');
  }
  return [...new Set(advice)].slice(0, 5);
}

// ── PDF Report Generator ──────────────────────────────────────
function downloadPDFReport({ applianceList, billResult }) {
  const date = new Date().toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' });
  const rows = applianceList.map(a =>
    `<tr>
      <td>${a.name}</td>
      <td>${a.wattage}W</td>
      <td>${a.quantity}</td>
      <td>${a.hoursPerDay}h/day × ${a.daysPerMonth} days</td>
      <td style="font-weight:600">${a.kWh?.toFixed(1)} kWh</td>
    </tr>`
  ).join('');

  const slabBreakdown = (() => {
    const u = parseFloat(billResult?.kWh || 0);
    let s = '';
    let r = u;
    const s1 = Math.min(r, 100); r -= s1;
    const s2 = Math.min(r, 200); r -= s2;
    const s3 = Math.min(r, 200); r -= s3;
    if (s1 > 0) s += `<tr><td>First 100 units (₹1.45/unit)</td><td>${s1.toFixed(1)} kWh</td><td>₹${(s1*1.45).toFixed(0)}</td></tr>`;
    if (s2 > 0) s += `<tr><td>101–300 units (₹3.80/unit)</td><td>${s2.toFixed(1)} kWh</td><td>₹${(s2*3.80).toFixed(0)}</td></tr>`;
    if (s3 > 0) s += `<tr><td>301–500 units (₹6.00/unit)</td><td>${s3.toFixed(1)} kWh</td><td>₹${(s3*6.00).toFixed(0)}</td></tr>`;
    if (r > 0)  s += `<tr><td>501+ units (₹8.00/unit)</td><td>${r.toFixed(1)} kWh</td><td>₹${(r*8.00).toFixed(0)}</td></tr>`;
    return s;
  })();

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Voltify — Electricity Bill Analysis</title>
<style>
  body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1e293b; margin: 0; padding: 32px; background: white; }
  .header { display: flex; align-items: center; gap: 16px; border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 24px; }
  .logo { width: 48px; height: 48px; background: linear-gradient(135deg,#2563eb,#4f46e5); border-radius: 12px; display: flex; align-items:center; justify-content:center; font-size:24px; }
  .brand { font-size:28px; font-weight:900; color:#1e293b; } .brand span { color:#2563eb; }
  .tagline { font-size:11px; color:#94a3b8; text-transform:uppercase; letter-spacing:2px; }
  .bill-hero { background:linear-gradient(135deg,#eff6ff,#eef2ff); border:2px solid #bfdbfe; border-radius:16px; padding:24px; margin-bottom:24px; text-align:center; }
  .bill-amount { font-size:56px; font-weight:900; color:#1e40af; }
  .bill-kwh { font-size:16px; color:#3b82f6; margin-top:4px; }
  table { width:100%; border-collapse:collapse; margin-bottom:24px; }
  th { background:#f8fafc; color:#64748b; font-size:11px; text-transform:uppercase; letter-spacing:1px; padding:10px 12px; text-align:left; border-bottom:2px solid #e2e8f0; }
  td { padding:10px 12px; border-bottom:1px solid #f1f5f9; font-size:13px; }
  tr:last-child td { border-bottom:none; }
  h2 { font-size:15px; font-weight:700; color:#1e293b; margin:24px 0 12px; }
  .footer { text-align:center; font-size:11px; color:#94a3b8; border-top:1px solid #e2e8f0; padding-top:16px; margin-top:32px; }
  .tip { background:#fefce8; border:1px solid #fef08a; border-radius:8px; padding:12px 16px; font-size:13px; color:#713f12; margin-bottom:8px; }
</style>
</head>
<body>
<div class="header">
  <div class="logo">⚡</div>
  <div>
    <div class="brand">Volt<span>ify</span></div>
    <div class="tagline">Smart Electricity Billing · MSEDCL Tariff 2024</div>
  </div>
  <div style="margin-left:auto;text-align:right;font-size:12px;color:#64748b">Generated: ${date}<br>Consumer ID: 210000001234</div>
</div>

<div class="bill-hero">
  <div style="font-size:13px;text-transform:uppercase;letter-spacing:2px;color:#6366f1;font-weight:600;margin-bottom:8px">Expected Monthly Bill</div>
  <div class="bill-amount">₹${parseInt(billResult?.bill || 0).toLocaleString('en-IN')}</div>
  <div class="bill-kwh">${billResult?.kWh || 0} kWh consumed this billing cycle</div>
</div>

<h2>📦 Appliance Breakdown</h2>
<table>
  <thead><tr><th>Appliance</th><th>Wattage</th><th>Qty</th><th>Usage</th><th>Monthly kWh</th></tr></thead>
  <tbody>${rows || '<tr><td colspan="5" style="text-align:center;color:#94a3b8">No appliances tracked</td></tr>'}</tbody>
</table>

<h2>🔌 MSEDCL Slab Calculation</h2>
<table>
  <thead><tr><th>Slab</th><th>Units</th><th>Amount</th></tr></thead>
  <tbody>
    ${slabBreakdown}
    <tr style="font-weight:700;background:#f8fafc"><td>Fixed Charges + Fuel Surcharge</td><td>—</td><td>₹${Math.round(parseFloat(billResult?.kWh||0)*0.15 + 165)}</td></tr>
    <tr style="font-weight:900;background:#eff6ff"><td>Total Estimated Bill</td><td>${billResult?.kWh || 0} kWh</td><td style="color:#1d4ed8">₹${parseInt(billResult?.bill||0).toLocaleString('en-IN')}</td></tr>
  </tbody>
</table>

<h2>💡 Energy Saving Tips</h2>
<div class="tip">🌡️ Set AC to 24°C — every 1°C increase saves ~6% energy on cooling costs</div>
<div class="tip">⏰ Use geyser timer: heat for 30 minutes before use only — saves up to ₹120/month</div>
<div class="tip">🌙 Enable AC sleep mode at night — reduces cooling by 0.5°C/hr, saves 20% on overnight usage</div>
<div class="tip">🔌 Unplug devices when not in use — standby power accounts for 5–10% of your bill</div>

<div class="footer">
  This report is generated by Voltify based on MSEDCL residential tariff rates (FY 2024-25).<br>
  Estimates may vary ±15% from actual bills due to seasonal factors and appliance variations.<br>
  <strong>Voltify ⚡ Smart Billing</strong> · voltify.in
</div>
</body>
</html>`;

  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
  setTimeout(() => win.print(), 500);
}

export default function Card1_ApplianceTracker() {
  const { dark } = useTheme();
  const { user, activeMeterId } = useAuth();
  const meterStorageKey = activeMeterId ? `_${activeMeterId}` : '';

  const [appliance,  setAppliance]  = useState('');
  const [watts,      setWatts]      = useState('');
  const [qty,        setQty]        = useState(1);
  const [usageMode,  setUsageMode]  = useState('basic');
  const [basicHrs,   setBasicHrs]   = useState(4);
  const [slots,      setSlots]      = useState({ morning: 2, afternoon: 1, evening: 1, night: 4 });
  const [days,       setDays]       = useState(30);
  const [efficiency, setEfficiency] = useState('Standard');

  const [freeUses,   setFreeUses]   = useState(user?.freemiumAdviceUses || 0);

  // ── Qty with 1–99 guard ───────────────────────────────────
  const incQty = () => setQty(q => Math.min(99, q + 1));
  const decQty = () => setQty(q => Math.max(1,  q - 1));

  // ── Advanced slot total cannot exceed 24h ─────────────────
  const totalSlotHours = Object.values(slots).reduce((s, v) => s + v, 0);
  const incSlot = (slot) => {
    if (totalSlotHours >= 24) return; // hard cap
    setSlots(s => ({ ...s, [slot]: Math.min(24, s[slot] + 0.5) }));
  };
  const decSlot = (slot) => {
    setSlots(s => ({ ...s, [slot]: Math.max(0, s[slot] - 0.5) }));
  };


  // ── Persisted appliance list & bill ───────────────────────
  const [appList,    setAppList]    = useState(() => {
    try { return JSON.parse(localStorage.getItem(`voltify_appliances${meterStorageKey}`) || '[]'); } catch { return []; }
  });
  const [billResult, setBillResult] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`voltify_bill_result${meterStorageKey}`) || 'null'); } catch { return null; }
  });
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [advice,     setAdvice]     = useState([]);
  const [showAdvice, setShowAdvice] = useState(false);

  // Re-hydrate state when meterId changes
  useEffect(() => {
    try { 
      setAppList(JSON.parse(localStorage.getItem(`voltify_appliances${meterStorageKey}`) || '[]'));
      setBillResult(JSON.parse(localStorage.getItem(`voltify_bill_result${meterStorageKey}`) || 'null'));
    } catch {
      setAppList([]);
      setBillResult(null);
    }
    setShowAdvice(false);
  }, [activeMeterId, meterStorageKey]);

  // Sync to localStorage whenever appList or billResult change
  useEffect(() => {
    localStorage.setItem(`voltify_appliances${meterStorageKey}`,  JSON.stringify(appList));
  }, [appList, meterStorageKey]);
  useEffect(() => {
    localStorage.setItem(`voltify_bill_result${meterStorageKey}`, JSON.stringify(billResult));
  }, [billResult, meterStorageKey]);

  // ── Auto-fill wattage from DB ──────────────────────────────
  const handleApplianceChange = (val) => {
    setAppliance(val);
    if (APPLIANCE_WATTAGE_DB[val]) {
      setWatts(APPLIANCE_WATTAGE_DB[val]);
    } else {
      setWatts('');
    }
  };

  // ── Compute bill locally using MSEDCL tariffs ─────────────
  const computeBill = (list) => {
    const totalKwh = list.reduce((sum, a) => sum + (a.kWh || 0), 0);
    const bill     = calculateMSEDCLBill(totalKwh);
    const result   = { kWh: totalKwh.toFixed(1), bill: bill.toString() };
    setBillResult(result);
  };

  const handleGenerate = () => {
    setError('');
    if (!appliance) return setError('Please select an appliance.');
    if (!watts || Number(watts) <= 0) return setError('Please enter a valid power rating in watts.');

    const effMultiplier = {
      'BEE 5-Star': 0.75, 'BEE 4-Star': 0.85, 'BEE 3-Star': 0.95,
      'BEE 2-Star': 1.05, 'BEE 1-Star': 1.15, 'Standard': 1.0
    }[efficiency] || 1.0;

    const effectiveWatts = Number(watts) * effMultiplier;

    // Calculate kWh
    let hoursPerDay;
    if (usageMode === 'basic') {
      hoursPerDay = basicHrs;
    } else {
      hoursPerDay = Object.values(slots).reduce((s, v) => s + v, 0);
    }

    const kWh = (effectiveWatts / 1000) * hoursPerDay * days * qty;

    const newApp = {
      name: appliance,
      wattage: Number(watts),
      quantity: qty,
      efficiency,
      hoursPerDay,
      daysPerMonth: days,
      kWh: parseFloat(kWh.toFixed(1)),
    };

    const updatedList = [...appList, newApp];
    setAppList(updatedList);
    computeBill(updatedList);

    // Reset form
    setAppliance('');
    setWatts('');
    setQty(1);
    setBasicHrs(4);
    setShowAdvice(false);
  };

  const handleRemove = (idx) => {
    const updated = appList.filter((_, i) => i !== idx);
    setAppList(updated);
    if (updated.length > 0) computeBill(updated);
    else {
      setBillResult(null);
    }
  };

  const handleAdvice = () => {
    if (freeUses < MAX_FREE_USES || user?.subscriptionStatus !== 'Free') {
      setFreeUses(u => Math.min(u + 1, MAX_FREE_USES));
      const tips = generateSmartAdvice(appList);
      setAdvice(tips);
      setShowAdvice(true);
    }
  };

  const graphData = appList
    .slice()
    .sort((a, b) => b.kWh - a.kWh)
    .slice(0, 6)
    .map(a => ({ name: a.name.length > 14 ? a.name.slice(0,14)+'…' : a.name, kWh: a.kWh, quantity: a.quantity }));

  const surface   = dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200';
  const inputCls  = `w-full px-3 py-2 rounded-lg border text-sm font-medium ${dark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500`;
  const remainingFreeUses = Math.max(0, MAX_FREE_USES - freeUses);

  return (
    <section className={`card ${surface} border p-6 animate-fade-in-up`} id="card-appliance-tracker">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
          <Zap size={20} className="text-blue-600" />
        </div>
        <div>
          <h2 className={`text-lg font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>Appliance Tracker</h2>
          <p className={`text-xs ${dark ? 'text-slate-400' : 'text-gray-500'}`}>Add appliances to predict your bill</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ── LEFT: Form ───────────────────────────────────── */}
        <div className="space-y-5">
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-400 font-medium">{error}</p>
            </div>
          )}

          {/* Appliance selector with autofill hint */}
          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wide mb-1.5 ${dark ? 'text-slate-400' : 'text-gray-500'}`}>
              Appliance Name <span className="normal-case font-normal text-blue-500 ml-1">↓ auto-fills watts</span>
            </label>
            <div className="relative">
              <select id="select-appliance" value={appliance}
                onChange={e => handleApplianceChange(e.target.value)}
                className={inputCls + ' pr-8 appearance-none'}>
                <option value="">— Select Appliance —</option>
                {APPLIANCES.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"/>
            </div>
          </div>

          {/* Watts — auto-filled */}
          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wide mb-1.5 ${dark ? 'text-slate-400' : 'text-gray-500'}`}>
              Power Rating (Watts)
              {watts && appliance && APPLIANCE_WATTAGE_DB[appliance] && (
                <span className="ml-2 normal-case font-normal text-green-500">✓ Auto-filled from BEE data</span>
              )}
            </label>
            <input id="input-watts" type="number" min={1} value={watts}
              onChange={e => setWatts(e.target.value)} className={inputCls}
              placeholder="Enter or auto-fills on select"/>
          </div>

          {/* Quantity */}
          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wide mb-1.5 ${dark ? 'text-slate-400' : 'text-gray-500'}`}>Quantity</label>
            <div className="flex items-center gap-3">
              <button id="btn-qty-dec" onClick={decQty} className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-slate-700 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-slate-600 font-bold"><Minus size={16}/></button>
              <span className={`text-xl font-bold w-8 text-center ${dark ? 'text-white' : 'text-gray-900'}`}>{qty}</span>
              <button id="btn-qty-inc" onClick={incQty} className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center hover:bg-blue-200 dark:hover:bg-blue-800 text-blue-700 font-bold"><Plus size={16}/></button>
            </div>
          </div>

          {/* Usage Time */}
          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wide mb-1.5 ${dark ? 'text-slate-400' : 'text-gray-500'}`}>Usage Time</label>
            <div className={`flex gap-1 p-1 rounded-lg ${dark ? 'bg-slate-700' : 'bg-gray-100'} mb-3`}>
              {['basic','advanced'].map(m => (
                <button key={m} id={`btn-usage-${m}`} onClick={() => setUsageMode(m)}
                  className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-all capitalize ${usageMode === m ? 'bg-blue-600 text-white shadow' : dark ? 'text-slate-400 hover:text-slate-200' : 'text-gray-600 hover:text-gray-900'}`}>{m}</button>
              ))}
            </div>
            {usageMode === 'basic' ? (
              <div>
                <input id="slider-basic-hours" type="range" min={0.5} max={24} step={0.5}
                  value={basicHrs} onChange={e => setBasicHrs(Number(e.target.value))} className="w-full accent-blue-600"/>
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>0.5h</span>
                  <span className="font-bold text-blue-600">{basicHrs}h/day</span>
                  <span>24h</span>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(slots).map(([slot, val]) => (
                    <div key={slot} className={`rounded-lg p-2 ${dark ? 'bg-slate-700/60' : 'bg-gray-50'}`}>
                      <div className={`text-xs font-semibold capitalize mb-1 ${dark ? 'text-slate-400' : 'text-gray-500'}`}>{slot}</div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => decSlot(slot)} className="w-6 h-6 rounded text-xs bg-gray-200 dark:bg-slate-600 font-bold">-</button>
                        <span className={`text-sm font-bold flex-1 text-center ${dark ? 'text-white' : 'text-gray-900'}`}>{val}h</span>
                        <button
                          onClick={() => incSlot(slot)}
                          disabled={totalSlotHours >= 24}
                          className="w-6 h-6 rounded text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 font-bold disabled:opacity-40 disabled:cursor-not-allowed">
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <p className={`text-xs mt-1 ${totalSlotHours >= 24 ? 'text-red-500 font-semibold' : dark ? 'text-slate-500' : 'text-gray-400'}`}>
                  Total: {totalSlotHours.toFixed(1)}h / 24h max
                </p>
              </>
            )}
          </div>

          {/* Days Used */}
          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wide mb-1.5 ${dark ? 'text-slate-400' : 'text-gray-500'}`}>Days Used / Month</label>
            <div className="flex flex-wrap gap-2">
              {DAYS_CHIPS.map(d => (
                <button key={d} id={`chip-days-${d}`} onClick={() => setDays(d)}
                  className={`px-3 py-1.5 rounded-full text-sm font-semibold border transition-all ${days === d ? 'bg-blue-600 text-white border-blue-600' : dark ? 'border-slate-600 text-slate-300 hover:border-blue-500' : 'border-gray-300 text-gray-600 hover:border-blue-500'}`}>
                  {d} days
                </button>
              ))}
            </div>
          </div>

          {/* Efficiency */}
          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wide mb-1.5 ${dark ? 'text-slate-400' : 'text-gray-500'}`}>BEE Efficiency Rating</label>
            <div className="flex flex-wrap gap-2">
              {EFF_CHIPS.map(e => (
                <button key={e.value} id={`chip-eff-${e.label}`} onClick={() => setEfficiency(e.value)}
                  className={`px-3 py-1.5 rounded-full text-sm font-semibold border transition-all ${efficiency === e.value ? 'bg-green-600 text-white border-green-600' : dark ? 'border-slate-600 text-slate-300 hover:border-green-500' : 'border-gray-300 text-gray-600 hover:border-green-500'}`}>
                  {e.label}
                </button>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="pt-2">
            <button id="btn-save-generate" onClick={handleGenerate} disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-lg hover:shadow-xl disabled:opacity-60 transition-all">
              {loading
                ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/> Adding...</>
                : <><Plus size={18}/> Add Appliance & Update Bill</>}
            </button>
            <p className={`text-center text-xs mt-3 font-medium ${dark ? 'text-slate-400' : 'text-gray-500'}`}>
              Add multiple appliances one by one for total bill
            </p>
          </div>

          {/* Added appliances list */}
          {appList.length > 0 && (
            <div className="space-y-2">
              <p className={`text-xs font-semibold uppercase tracking-wide ${dark ? 'text-slate-400' : 'text-gray-500'}`}>Added Appliances ({appList.length})</p>
              {appList.map((a, i) => (
                <div key={i} className={`flex items-center gap-3 px-3 py-2 rounded-lg border ${dark ? 'bg-slate-700/50 border-slate-600' : 'bg-gray-50 border-gray-200'}`}>
                  <span className="text-base">⚡</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${dark ? 'text-white' : 'text-gray-900'}`}>{a.name}</p>
                    <p className={`text-xs ${dark ? 'text-slate-400' : 'text-gray-500'}`}>{a.wattage}W × {a.quantity} × {a.hoursPerDay}h × {a.daysPerMonth}d = {a.kWh} kWh</p>
                  </div>
                  <button onClick={() => handleRemove(i)} className="text-red-400 hover:text-red-600 flex-shrink-0">
                    <Trash2 size={14}/>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── RIGHT: Results Panel ─────────────────────────── */}
        <div className="space-y-5">
          {/* Monthly Bill */}
          <div className={`rounded-2xl p-5 ${dark ? 'bg-gradient-to-br from-blue-900/60 to-indigo-900/40 border border-blue-700/40' : 'bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200'}`}>
            <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${dark ? 'text-blue-300' : 'text-blue-600'}`}>Expected Monthly Bill</p>
            <div className={`text-5xl font-black ${dark ? 'text-white' : 'text-gray-900'}`}>
              {billResult ? `₹${parseInt(billResult.bill).toLocaleString('en-IN')}` : <span className="text-gray-300 dark:text-slate-600">₹ —</span>}
            </div>
            {billResult && (
              <p className={`text-sm mt-1 ${dark ? 'text-blue-300' : 'text-blue-700'}`}>{billResult.kWh} kWh consumed this month</p>
            )}
            <button id="btn-download-pdf" disabled={!billResult}
              onClick={() => downloadPDFReport({ applianceList: appList, billResult })}
              className={`mt-4 w-full justify-center flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${dark ? 'border-blue-600 text-blue-400 hover:bg-blue-900/40 disabled:opacity-50' : 'border-blue-300 text-blue-700 hover:bg-blue-100 disabled:opacity-50'}`}>
              <Download size={15}/> Download PDF Analysis
            </button>
          </div>

          {/* Bar Graph */}
          <div>
            <p className={`text-sm font-semibold mb-3 ${dark ? 'text-slate-300' : 'text-gray-700'}`}>
              Consumption by Selected Appliances (kWh)
            </p>
            <ResponsiveContainer width="100%" height={200}>
              {graphData.length > 0 ? (
                <BarChart data={graphData} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <XAxis type="number" tick={{ fontSize: 11, fill: dark ? '#94a3b8' : '#6b7280' }}/>
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: dark ? '#94a3b8' : '#6b7280' }} width={90}/>
                  <Tooltip
                    contentStyle={{
                      background: dark ? '#1e293b' : '#ffffff',
                      border: `1px solid ${dark ? '#334155' : '#e2e8f0'}`,
                      borderRadius: '8px',
                      fontSize: 12,
                      color: dark ? '#f1f5f9' : '#1e293b',
                    }}
                    itemStyle={{ color: dark ? '#f1f5f9' : '#374151' }}
                    cursor={{ fill: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }}
                    formatter={(v) => [`${v.toFixed(1)} kWh`]}
                  />
                  <Bar dataKey="kWh" radius={[0, 6, 6, 0]}>
                    {graphData.map((_, i) => <Cell key={i} fill={['#DC2626','#F97316','#3B82F6','#8B5CF6','#10B981','#F59E0B'][i % 6]}/>)}
                  </Bar>
                </BarChart>
              ) : (
                <div className="w-full h-full flex items-center justify-center border-2 border-dashed rounded-lg border-gray-300 dark:border-slate-700">
                  <p className="text-gray-400 dark:text-slate-500 text-sm font-medium">No appliances added yet</p>
                </div>
              )}
            </ResponsiveContainer>
            {graphData.length > 0 && <p className={`text-xs mt-1 ${dark ? 'text-slate-500' : 'text-gray-400'}`}>🔴 Highest consumer highlighted</p>}
          </div>

          {/* Smart Advice Generator */}
          <div className={`rounded-xl p-4 ${dark ? 'bg-gradient-to-r from-amber-900/30 to-yellow-900/20 border border-amber-700/40' : 'bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200'}`}>
            {user?.subscriptionStatus !== 'Free' || remainingFreeUses > 0 ? (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb size={18} className="text-amber-500"/>
                  <span className={`text-sm font-bold ${dark ? 'text-amber-300' : 'text-amber-800'}`}>Smart Advice Generator</span>
                  <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${dark ? 'bg-amber-900/50 text-amber-300' : 'bg-amber-100 text-amber-700'}`}>
                    {user?.subscriptionStatus !== 'Free' ? 'Pro Active ⚡' : `${remainingFreeUses}/${MAX_FREE_USES} Free Uses`}
                  </span>
                </div>
                <p className={`text-xs mb-3 ${dark ? 'text-amber-200/70' : 'text-amber-700'}`}>
                  {appList.length > 0 ? `Analysing ${appList.length} appliance${appList.length > 1 ? 's' : ''} for personalized tips` : 'Add appliances above, then generate advice'}
                </p>
                <button id="btn-smart-advice" onClick={handleAdvice}
                  className="w-full py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold transition-colors">
                  Generate Smart Advice ✨
                </button>

                {/* Advice Results */}
                {showAdvice && advice.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className={`text-xs font-semibold uppercase tracking-wide ${dark ? 'text-amber-400' : 'text-amber-700'}`}>
                      AI-Powered Tips for Your Home
                    </p>
                    {advice.map((tip, i) => (
                      <div key={i} className={`text-xs p-3 rounded-lg leading-relaxed ${dark ? 'bg-amber-900/20 text-amber-200' : 'bg-white text-amber-800 border border-amber-100'}`}>
                        {tip}
                      </div>
                    ))}
                    <p className={`text-xs ${dark ? 'text-amber-500' : 'text-amber-600'}`}>
                      💰 Implementing all tips can save ₹150–₹400/month
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-2">
                <Lock size={28} className={`mx-auto mb-2 ${dark ? 'text-slate-500' : 'text-gray-400'}`}/>
                <p className={`text-sm font-bold mb-1 ${dark ? 'text-slate-300' : 'text-gray-700'}`}>Unlock Premium Insights</p>
                <p className={`text-xs mb-3 ${dark ? 'text-slate-500' : 'text-gray-500'}`}>You've used all {MAX_FREE_USES} free suggestions.</p>
                <button id="btn-unlock-premium-advice"
                  className="px-5 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-bold hover:from-purple-700 hover:to-indigo-700">
                  Upgrade to Pro ⚡
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
