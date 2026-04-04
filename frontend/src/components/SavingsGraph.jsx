import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingDown, Zap } from 'lucide-react';
import { useTheme } from '../App.jsx';

// Dynamically generate last 6 months from current date
function getLast6Months() {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const now    = new Date();
  const result = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push({ label: months[d.getMonth()], year: d.getFullYear() });
  }
  return result;
}

// Mock bill data: drops after month 4 (Smart Suggestions started)
const BASE_BILLS = [2140, 2310, 2580, 2450, 1920, 1650];
const monthLabels = getLast6Months();

const DATA = monthLabels.map((m, i) => ({
  month:       m.label,
  bill:        BASE_BILLS[i],
  smartStart:  i === 4,
}));

const SAVINGS_START_MONTH = DATA[4].month;

export default function SavingsGraph() {
  const { dark }   = useTheme();
  const totalSaved = BASE_BILLS[3] - BASE_BILLS[5];
  const surface    = dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200';

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const isSmartMonth = DATA.find(d => d.month === label)?.smartStart;
    return (
      <div className={`rounded-xl p-3 shadow-lg border text-sm ${dark ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
        <p className="font-bold">{label}</p>
        <p>₹{payload[0].value.toLocaleString('en-IN')}</p>
        {isSmartMonth && <p className="text-yellow-500 text-xs mt-1">💡 Started Smart Suggestions</p>}
      </div>
    );
  };

  return (
    <section className={`card ${surface} border p-6 animate-fade-in-up`} id="card-savings-graph">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
            <TrendingDown size={20} className="text-indigo-600" />
          </div>
          <div>
            <h2 className={`text-lg font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>Your Savings Trend</h2>
            <p className={`text-xs ${dark ? 'text-slate-400' : 'text-gray-500'}`}>Monthly bill — last 6 months</p>
          </div>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${dark ? 'bg-green-900/30 border border-green-700/40' : 'bg-green-50 border border-green-200'}`}>
          <Zap size={16} className="text-green-600 fill-green-500" />
          <span className={`text-sm font-bold ${dark ? 'text-green-400' : 'text-green-700'}`}>
            ₹{totalSaved.toLocaleString('en-IN')} saved
          </span>
          <span className={`text-xs ${dark ? 'text-green-500' : 'text-green-600'}`}>vs peak</span>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={DATA} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="billGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#3B82F6" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}    />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={dark ? '#334155' : '#f0f0f0'} />
          <XAxis dataKey="month" tick={{ fontSize: 12, fill: dark ? '#94a3b8' : '#6b7280' }} />
          <YAxis
            tick={{ fontSize: 11, fill: dark ? '#94a3b8' : '#6b7280' }}
            tickFormatter={v => `₹${(v / 1000).toFixed(1)}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          {/* Vertical dashed line at smart suggestions start */}
          <ReferenceLine
            x={SAVINGS_START_MONTH}
            stroke="#FBBF24"
            strokeDasharray="5 4"
            strokeWidth={2}
            label={{
              value: '💡 Smart Suggestions',
              position: 'insideTopRight',
              fill: dark ? '#FBBF24' : '#b45309',
              fontSize: 11,
              fontWeight: 600,
            }}
          />
          <Area
            type="monotone"
            dataKey="bill"
            stroke="#3B82F6"
            strokeWidth={3}
            fill="url(#billGradient)"
            dot={{ r: 5, fill: '#3B82F6', stroke: '#fff', strokeWidth: 2 }}
            activeDot={{ r: 7, fill: '#1D4ED8', stroke: '#fff', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Month summary row */}
      <div className={`mt-4 grid grid-cols-6 gap-1`}>
        {DATA.map((d, i) => (
          <div key={i} className={`text-center p-2 rounded-lg ${d.smartStart ? dark ? 'bg-yellow-900/30 border border-yellow-700/40' : 'bg-yellow-50 border border-yellow-200' : ''}`}>
            <p className={`text-[10px] font-semibold ${dark ? 'text-slate-400' : 'text-gray-500'}`}>{d.month}</p>
            <p className={`text-xs font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>₹{(d.bill / 1000).toFixed(1)}k</p>
          </div>
        ))}
      </div>
    </section>
  );
}
