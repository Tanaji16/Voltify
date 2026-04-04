import { useTheme } from '../App.jsx';
import { AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';

const CURRENT_KWH    = 264;
const PROJECTED_KWH  = 318;

const ZONES = [
  { label: 'Cheap',    min: 0,   max: 100, color: '#16A34A', textColor: 'text-green-600',  bg: 'bg-green-50  dark:bg-green-900/20',  border: 'border-green-200 dark:border-green-700' },
  { label: 'Standard', min: 101, max: 300, color: '#FBBF24', textColor: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-200 dark:border-yellow-700' },
  { label: 'Premium',  min: 301, max: 600, color: '#DC2626', textColor: 'text-red-600',    bg: 'bg-red-50    dark:bg-red-900/20',    border: 'border-red-200 dark:border-red-700' },
];

function getZone(kwh) {
  if (kwh <= 100) return ZONES[0];
  if (kwh <= 300) return ZONES[1];
  return ZONES[2];
}

// SVG Speedometer (semi-circle, 180°)
function SpeedoGauge({ kwh, maxKwh = 500 }) {
  const percent   = Math.min(kwh / maxKwh, 1);
  const angle     = -90 + percent * 180;             // -90° (left) → +90° (right)
  const cx = 120, cy = 120, r = 90;

  // Arc path helper (SVG)
  const arcPath = (startDeg, endDeg, radius) => {
    const toRad = d => (d * Math.PI) / 180;
    const x1 = cx + radius * Math.cos(toRad(startDeg));
    const y1 = cy + radius * Math.sin(toRad(startDeg));
    const x2 = cx + radius * Math.cos(toRad(endDeg));
    const y2 = cy + radius * Math.sin(toRad(endDeg));
    const large = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2}`;
  };

  const toRad = d => (d * Math.PI) / 180;
  const nx = cx + (r - 20) * Math.cos(toRad(angle));
  const ny = cy + (r - 20) * Math.sin(toRad(angle));

  return (
    <svg viewBox="0 0 240 140" className="w-full max-w-xs mx-auto" aria-label={`Usage gauge: ${kwh} kWh`}>
      {/* Background tracks */}
      <path d={arcPath(-180, -120, r)} fill="none" stroke="#16A34A33" strokeWidth={18} strokeLinecap="butt" />
      <path d={arcPath(-120, -20,  r)} fill="none" stroke="#FBBF2433" strokeWidth={18} strokeLinecap="butt" />
      <path d={arcPath(-20,   0,   r)} fill="none" stroke="#DC262633" strokeWidth={18} strokeLinecap="butt" />

      {/* Coloured zones */}
      <path d={arcPath(-180, -120, r)} fill="none" stroke="#16A34A" strokeWidth={16} strokeLinecap="butt" opacity={0.9} />
      <path d={arcPath(-120, -20,  r)} fill="none" stroke="#FBBF24" strokeWidth={16} strokeLinecap="butt" opacity={0.9} />
      <path d={arcPath(-20,   0,   r)} fill="none" stroke="#DC2626" strokeWidth={16} strokeLinecap="butt" opacity={0.9} />

      {/* Zone labels */}
      <text x={30}  y={130} fontSize={9}  fill="#16A34A" textAnchor="middle" fontWeight={700}>Cheap</text>
      <text x={120} y={42}  fontSize={9}  fill="#FBBF24" textAnchor="middle" fontWeight={700}>Standard</text>
      <text x={210} y={130} fontSize={9}  fill="#DC2626" textAnchor="middle" fontWeight={700}>Premium</text>

      {/* Slab markers */}
      <text x={70}  y={125} fontSize={8} fill="#6b7280" textAnchor="middle">100</text>
      <text x={172} y={60}  fontSize={8} fill="#6b7280" textAnchor="middle">300</text>

      {/* Needle */}
      <line
        x1={cx} y1={cy}
        x2={nx} y2={ny}
        stroke="#1D4ED8" strokeWidth={4} strokeLinecap="round"
        style={{ transformOrigin: `${cx}px ${cy}px`, transition: 'all 1s cubic-bezier(0.34,1.56,0.64,1)' }}
      />
      <circle cx={cx} cy={cy} r={8} fill="#1D4ED8" />
      <circle cx={cx} cy={cy} r={3} fill="white" />

      {/* Centre label */}
      <text x={cx} y={cy + 28} textAnchor="middle" fontSize={18} fontWeight={800} fill="#1F2937">{kwh}</text>
      <text x={cx} y={cy + 40} textAnchor="middle" fontSize={9}  fill="#6b7280">kWh this month</text>
    </svg>
  );
}

export default function Card3_SlabGuard() {
  const { dark }    = useTheme();
  const zone        = getZone(CURRENT_KWH);
  const projZone    = getZone(PROJECTED_KWH);
  const nextSlab    = CURRENT_KWH <= 100 ? 100 : CURRENT_KWH <= 300 ? 300 : 500;
  const unitsLeft   = nextSlab - CURRENT_KWH;
  const isNearEdge  = unitsLeft <= 20;

  const currentBill  = CURRENT_KWH  <= 100 ? (CURRENT_KWH * 3.77 + 75).toFixed(0)
                     : CURRENT_KWH  <= 300 ? (100 * 3.77 + (CURRENT_KWH - 100) * 7.73 + 165).toFixed(0)
                     : (100 * 3.77 + 200 * 7.73 + (CURRENT_KWH - 300) * 10.21 + 260).toFixed(0);

  const projBill     = PROJECTED_KWH <= 100 ? (PROJECTED_KWH * 3.77 + 75).toFixed(0)
                     : PROJECTED_KWH <= 300 ? (100 * 3.77 + (PROJECTED_KWH - 100) * 7.73 + 165).toFixed(0)
                     : (100 * 3.77 + 200 * 7.73 + (PROJECTED_KWH - 300) * 10.21 + 260).toFixed(0);

  const surface = dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200';

  return (
    <section className={`card ${surface} border p-6 animate-fade-in-up`} id="card-slab-guard">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
          <AlertTriangle size={20} className="text-yellow-600" />
        </div>
        <div>
          <h2 className={`text-lg font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>Slab Guard</h2>
          <p className={`text-xs ${dark ? 'text-slate-400' : 'text-gray-500'}`}>Real-time Mahavitaran slab tracker</p>
        </div>
        <span className={`ml-auto text-xs font-bold px-3 py-1 rounded-full ${zone.bg} ${zone.border} border ${zone.textColor}`}>
          {zone.label} Zone
        </span>
      </div>

      {/* Speedometer */}
      <SpeedoGauge kwh={CURRENT_KWH} />

      {/* Cost Callouts */}
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className={`rounded-xl p-4 text-center ${dark ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
          <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${dark ? 'text-slate-400' : 'text-gray-500'}`}>Current Cost</p>
          <p className={`text-2xl font-black ${dark ? 'text-white' : 'text-gray-900'}`}>₹{parseInt(currentBill).toLocaleString('en-IN')}</p>
          <p className={`text-xs mt-1 ${zone.textColor}`}>{CURRENT_KWH} kWh · {zone.label}</p>
        </div>
        <div className={`rounded-xl p-4 text-center ${dark ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
          <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${dark ? 'text-slate-400' : 'text-gray-500'}`}>Projected Cost</p>
          <p className={`text-2xl font-black ${dark ? 'text-white' : 'text-gray-900'}`}>₹{parseInt(projBill).toLocaleString('en-IN')}</p>
          <div className="flex items-center justify-center gap-1 mt-1">
            {parseInt(projBill) > parseInt(currentBill)
              ? <TrendingUp size={13} className="text-red-500" />
              : <TrendingDown size={13} className="text-green-500" />}
            <p className={`text-xs ${projZone.textColor}`}>{PROJECTED_KWH} kWh · {projZone.label}</p>
          </div>
        </div>
      </div>

      {/* Alert Banner */}
      {isNearEdge && (
        <div id="slab-alert-banner" className="mt-4 flex items-start gap-3 rounded-xl p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700">
          <AlertTriangle size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-yellow-800 dark:text-yellow-300">
              ⚠️ You are only {unitsLeft} units away from the expensive slab!
            </p>
            <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-0.5">
              Switch to eco-mode now — your rate will jump from ₹7.73 to ₹10.21 per unit.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
