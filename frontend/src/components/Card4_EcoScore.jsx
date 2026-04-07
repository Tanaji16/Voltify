import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Trophy, Star, Crown } from 'lucide-react';
import { useTheme, useAuth } from '../App.jsx';
import { getBadges } from '../api/challenges.js';

const COMMUNITY_DATA = [
  { name: 'You',            kWh: 264, fill: '#16A34A' },
  { name: 'Similar Homes',  kWh: 371, fill: '#D1D5DB'  },
  { name: 'Area Avg.',      kWh: 412, fill: '#D1D5DB'  },
  { name: 'Top Savers',     kWh: 148, fill: '#1D4ED8'  },
];

const GRADE_CONFIG = {
  'A+': { color: '#16A34A', glow: 'shadow-green-400/60',  label: 'Exceptional',   pct: 5  },
  'A':  { color: '#22c55e', glow: 'shadow-green-300/50',  label: 'Excellent',     pct: 12 },
  'A-': { color: '#4ade80', glow: 'shadow-green-200/50',  label: 'Very Good',     pct: 15 },
  'B+': { color: '#FBBF24', glow: 'shadow-yellow-400/50', label: 'Good',          pct: 30 },
  'B':  { color: '#f97316', glow: 'shadow-orange-400/50', label: 'Average',       pct: 50 },
};

const USER_GRADE = 'A-';
const cfg        = GRADE_CONFIG[USER_GRADE];

const ACHIEVEMENTS = [
  { icon: '🌿', label: 'Green Starter',   desc: 'Used < 300 kWh for 3 months'   },
  { icon: '⚡', label: 'Early Adopter',   desc: 'Joined Voltify in first month'  },
  { icon: '📉', label: '10% Reducer',     desc: 'Cut usage by 10% vs last month' },
];

export default function Card4_EcoScore() {
  const { dark } = useTheme();
  const { user } = useAuth();
  const surface  = dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200';
  const cityName = user?.city || user?.meters?.[0]?.city || 'Your Area';

  // Live earned badges from Monthly Challenges
  const [earnedBadges, setEarnedBadges] = useState([]);
  useEffect(() => {
    getBadges()
      .then(res => setEarnedBadges(res.data.badges || []))
      .catch(() => {}); // fail silently
  }, []);

  return (
    <section className={`card ${surface} border p-6 animate-fade-in-up`} id="card-eco-score">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
          <Trophy size={20} className="text-yellow-500" />
        </div>
        <div>
          <h2 className={`text-lg font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>{cityName} Community Eco-Score 🏆</h2>
          <p className={`text-xs ${dark ? 'text-slate-400' : 'text-gray-500'}`}>How you compare to similar homes in your area</p>
        </div>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

        {/* Left: Grade Badge */}
        <div className="flex flex-col items-center justify-center py-4">
          <div
            className={`relative w-32 h-32 rounded-full flex items-center justify-center glow-pulse shadow-2xl ${cfg.glow}`}
            style={{ background: `radial-gradient(circle, ${cfg.color}22, ${cfg.color}55)`, border: `3px solid ${cfg.color}` }}
            id="eco-grade-badge"
          >
            <span className="text-5xl font-black" style={{ color: cfg.color }}>{USER_GRADE}</span>
            <Star size={16} className="absolute top-3 right-3" style={{ color: cfg.color, fill: cfg.color }} />
          </div>
          <p className={`mt-3 text-lg font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>{cfg.label}</p>
          <p className={`text-sm ${dark ? 'text-slate-400' : 'text-gray-500'}`}>Top {cfg.pct}% of savers</p>
          <p className={`text-xs mt-1 px-3 py-1 rounded-full font-semibold ${dark ? 'bg-green-900/30 text-green-400' : 'bg-green-50 text-green-700'}`}>
            Better than 85% of homes
          </p>
        </div>

        {/* Right: Bar Chart */}
        <div>
          <p className={`text-sm font-semibold mb-2 ${dark ? 'text-slate-300' : 'text-gray-700'}`}>kWh Comparison (Monthly)</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={COMMUNITY_DATA} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: dark ? '#94a3b8' : '#6b7280' }} />
              <YAxis tick={{ fontSize: 10, fill: dark ? '#94a3b8' : '#6b7280' }} />
              <Tooltip
                contentStyle={{ background: dark ? '#1e293b' : '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: 12 }}
                formatter={v => [`${v} kWh`, '']}
              />
              <Bar dataKey="kWh" radius={[6, 6, 0, 0]}>
                {COMMUNITY_DATA.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-3 mt-1 text-xs">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-green-600 inline-block"/>{' '}You</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-gray-300 inline-block"/>{' '}Others</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-blue-600 inline-block"/>{' '}Top Savers</span>
          </div>
        </div>
      </div>

      {/* Achievement Badges */}
      <div className="mt-6">
        <p className={`text-sm font-bold mb-3 ${dark ? 'text-slate-300' : 'text-gray-700'}`}>Your Achievements</p>
        <div className="flex flex-wrap gap-2">
          {/* Static achievements */}
          {ACHIEVEMENTS.map((a, i) => (
            <div key={`static-${i}`} id={`achievement-${i}`}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${dark ? 'bg-slate-700/60 border-slate-600' : 'bg-gray-50 border-gray-200'}`}>
              <span className="text-lg">{a.icon}</span>
              <div>
                <p className={`text-xs font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>{a.label}</p>
                <p className={`text-[10px] ${dark ? 'text-slate-400' : 'text-gray-500'}`}>{a.desc}</p>
              </div>
            </div>
          ))}
          {/* Live challenge badges */}
          {earnedBadges.map((b, i) => (
            <div
              key={`earned-${i}`}
              id={`earned-badge-${i}`}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all hover:scale-105 cursor-default ${
                dark ? 'bg-slate-700/60 border-slate-600' : 'bg-white border-gray-200'
              }`}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = `0 0 12px 3px ${b.color}55`)}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = '')}
            >
              <span className="text-lg">{b.icon}</span>
              <div>
                <p className={`text-xs font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>{b.label}</p>
                <p className={`text-[10px] ${dark ? 'text-slate-400' : 'text-gray-500'}`}>{b.title}</p>
              </div>
            </div>
          ))}
          {earnedBadges.length === 0 && (
            <p className={`text-xs italic ${dark ? 'text-slate-500' : 'text-gray-400'}`}>
              Complete monthly challenges to earn badges here! 🏅
            </p>
          )}
        </div>
      </div>

      {/* Pro Upsell Footer */}
      <div className={`mt-4 flex items-center gap-3 rounded-xl p-3 ${dark ? 'bg-slate-700/40 border border-slate-600' : 'bg-purple-50 border border-purple-200'}`}>
        <Crown size={18} className="text-purple-500 flex-shrink-0" />
        <p className={`text-xs ${dark ? 'text-slate-400' : 'text-gray-600'}`}>
          <strong className={dark ? 'text-purple-300' : 'text-purple-700'}>Pro feature:</strong> See top 5% savers in {cityName} and get personalised benchmarks.
        </p>
        <button id="btn-eco-upgrade" className="ml-auto px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex-shrink-0">
          Unlock
        </button>
      </div>
    </section>
  );
}
