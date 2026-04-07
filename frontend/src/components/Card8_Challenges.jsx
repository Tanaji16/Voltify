// ============================================================
//  Voltify — Card 8: Gamified Monthly Challenges
//  src/components/Card8_Challenges.jsx
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { Trophy, Zap, Target, Star, CheckCircle2, Clock, XCircle, Sparkles, Plus, RefreshCw } from 'lucide-react';
import { useTheme } from '../App.jsx';
import { getCatalogue, getChallenges, joinChallenge, verifyChallenge } from '../api/challenges.js';

// ── Confetti particle component ───────────────────────────────
function Confetti({ active }) {
  if (!active) return null;
  const colors = ['#2563EB', '#16A34A', '#F59E0B', '#EC4899', '#7C3AED', '#0EA5E9'];
  const particles = Array.from({ length: 32 }, (_, i) => ({
    id: i,
    color: colors[i % colors.length],
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 0.6}s`,
    size: `${6 + Math.random() * 8}px`,
    duration: `${0.8 + Math.random() * 0.8}s`,
  }));
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute top-0 animate-confetti-fall rounded-sm"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            background: p.color,
            animationDelay: p.delay,
            animationDuration: p.duration,
          }}
        />
      ))}
    </div>
  );
}

// ── Badge chip (mini) ─────────────────────────────────────────
function BadgeChip({ badge, dark }) {
  return (
    <div
      className={`group flex items-center gap-2 px-3 py-2 rounded-xl border transition-all hover:scale-105 cursor-default ${
        dark ? 'bg-slate-700/60 border-slate-600' : 'bg-white border-gray-200'
      }`}
      style={{ boxShadow: `0 0 0 0 ${badge.color}`, transition: 'box-shadow 0.3s' }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = `0 0 12px 3px ${badge.color}55`)}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 0 0 0 transparent')}
    >
      <span className="text-xl">{badge.icon}</span>
      <div>
        <p className={`text-xs font-bold leading-none ${dark ? 'text-white' : 'text-gray-900'}`}>{badge.label}</p>
        <p className={`text-[10px] mt-0.5 ${dark ? 'text-slate-400' : 'text-gray-500'}`}>{badge.title}</p>
      </div>
    </div>
  );
}

// ── Single active challenge row ───────────────────────────────
function ActiveChallengeRow({ ch, dark, onVerify, verifying }) {
  const [units, setUnits] = useState('');
  const needsUnits = ch.targetReductionPct !== null || ch.targetMaxUnits !== null;
  const daysLeft = (() => {
    const now   = new Date();
    const end   = new Date(ch.targetYear, ch.targetMonth, 0); // last day of month
    const diff  = Math.ceil((end - now) / 86400000);
    return Math.max(diff, 0);
  })();
  const pctDone = (() => {
    const now   = new Date();
    const start = new Date(ch.targetYear, ch.targetMonth - 1, 1);
    const end   = new Date(ch.targetYear, ch.targetMonth, 0);
    return Math.min(100, Math.round(((now - start) / (end - start)) * 100));
  })();

  return (
    <div className={`rounded-2xl border p-4 transition-all ${dark ? 'bg-slate-700/50 border-slate-600' : 'bg-gray-50 border-gray-200'}`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl mt-0.5 flex-shrink-0">{ch.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className={`font-bold text-sm leading-tight ${dark ? 'text-white' : 'text-gray-900'}`}>{ch.title}</p>
          <p className={`text-xs mt-0.5 ${dark ? 'text-slate-400' : 'text-gray-500'}`}>{ch.description}</p>

          {/* Progress bar (time-based) */}
          <div className="mt-3">
            <div className="flex justify-between text-[10px] mb-1" style={{ color: dark ? '#94a3b8' : '#6b7280' }}>
              <span>Month progress</span>
              <span className="font-bold">{daysLeft}d left</span>
            </div>
            <div className={`h-1.5 rounded-full overflow-hidden ${dark ? 'bg-slate-600' : 'bg-gray-200'}`}>
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all"
                style={{ width: `${pctDone}%` }}
              />
            </div>
          </div>

          {/* Units input for measurable challenges */}
          {needsUnits && (
            <div className="mt-3 flex gap-2">
              <input
                type="number"
                min="0"
                placeholder="Current kWh used"
                value={units}
                onChange={e => setUnits(e.target.value)}
                className={`flex-1 px-3 py-1.5 rounded-lg border text-xs ${
                  dark
                    ? 'bg-slate-600 border-slate-500 text-white placeholder-slate-400'
                    : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
            </div>
          )}

          <button
            id={`btn-verify-challenge-${ch._id}`}
            onClick={() => onVerify(ch._id, needsUnits ? Number(units) : null)}
            disabled={verifying === ch._id || (needsUnits && !units)}
            className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white text-xs font-bold transition-all disabled:opacity-50"
          >
            {verifying === ch._id
              ? <><span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />Verifying...</>
              : <><CheckCircle2 size={13} />Mark as Complete</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Catalogue challenge card ──────────────────────────────────
function CatalogueCard({ preset, dark, onJoin, joining }) {
  const statusColor = {
    active:    'text-blue-500',
    completed: 'text-green-500',
    failed:    'text-red-500',
  };

  return (
    <div className={`relative rounded-2xl border p-4 transition-all hover:shadow-md ${
      dark ? 'bg-slate-700/40 border-slate-600 hover:border-slate-400' : 'bg-white border-gray-200 hover:border-blue-300'
    } ${preset.joinedStatus ? 'opacity-80' : ''}`}>
      {/* Status pill */}
      {preset.joinedStatus && (
        <span className={`absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wide ${statusColor[preset.joinedStatus] || ''}`}>
          {preset.joinedStatus === 'active' ? '✅ Joined' : preset.joinedStatus === 'completed' ? '🏅 Done' : '❌ Failed'}
        </span>
      )}

      <div className="flex gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${
          dark ? 'bg-slate-600' : 'bg-gray-100'
        }`}>
          {preset.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-bold text-sm ${dark ? 'text-white' : 'text-gray-900'}`}>{preset.title}</p>
          <p className={`text-xs mt-0.5 leading-relaxed ${dark ? 'text-slate-400' : 'text-gray-500'}`}>{preset.description}</p>

          {/* Badge preview */}
          <div className="flex items-center gap-1.5 mt-2">
            <span className="text-sm">{preset.badge.icon}</span>
            <span className="text-xs font-semibold" style={{ color: preset.badge.color }}>{preset.badge.label} badge</span>
          </div>
        </div>
      </div>

      {!preset.joinedStatus && (
        <button
          id={`btn-join-challenge-${preset.challengeId}`}
          onClick={() => onJoin(preset.challengeId)}
          disabled={joining === preset.challengeId}
          className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold transition-all disabled:opacity-50"
        >
          {joining === preset.challengeId
            ? <><span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />Joining...</>
            : <><Plus size={13} />Join Challenge</>
          }
        </button>
      )}
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────
function EmptyState({ dark, label }) {
  return (
    <div className={`text-center py-8 rounded-2xl border border-dashed ${dark ? 'border-slate-600 text-slate-500' : 'border-gray-200 text-gray-400'}`}>
      <Target size={28} className="mx-auto mb-2 opacity-40" />
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
export default function Card8_Challenges() {
  const { dark } = useTheme();
  const surface  = dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200';

  const [catalogue,  setCatalogue]  = useState([]);
  const [active,     setActive]     = useState([]);
  const [badges,     setBadges]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [joining,    setJoining]    = useState(null);
  const [verifying,  setVerifying]  = useState(null);
  const [confetti,   setConfetti]   = useState(false);
  const [toast,      setToast]      = useState(null);
  const [activeTab,  setActiveTab]  = useState('available'); // 'available' | 'active' | 'badges'

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [catRes, chalRes] = await Promise.all([
        getCatalogue(),
        getChallenges(),
      ]);
      setCatalogue(catRes.data.catalogue || []);
      const all    = chalRes.data.challenges || [];
      const earned = all.filter(c => c.status === 'completed');
      setActive(all.filter(c => c.status === 'active'));
      setBadges(earned.map(c => ({ ...c.badge, title: c.title, emoji: c.emoji })));
    } catch {
      // Fail silently — backend may not be running during dev
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Handle join ──────────────────────────────────────────────
  const handleJoin = async (challengeId) => {
    setJoining(challengeId);
    try {
      await joinChallenge(challengeId, null);
      showToast('🎯 Challenge joined! Good luck!');
      await loadData();
      setActiveTab('active');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to join challenge.';
      showToast(msg, 'error');
    } finally {
      setJoining(null);
    }
  };

  // ── Handle verify ─────────────────────────────────────────────
  const handleVerify = async (id, currentUnits) => {
    setVerifying(id);
    try {
      const { data } = await verifyChallenge(id, currentUnits);
      if (data.success) {
        setConfetti(true);
        setTimeout(() => setConfetti(false), 3000);
        showToast(`🎉 ${data.message}`);
        setActiveTab('badges');
      } else {
        showToast(data.message, 'error');
      }
      await loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Verification failed.', 'error');
    } finally {
      setVerifying(null);
    }
  };

  // ── Tabs ──────────────────────────────────────────────────────
  const tabs = [
    { id: 'available', label: 'Available',  icon: <Target   size={14} />, count: catalogue.filter(c => !c.joinedStatus).length },
    { id: 'active',    label: 'Active',     icon: <Zap      size={14} />, count: active.length },
    { id: 'badges',    label: 'Badges',     icon: <Star     size={14} />, count: badges.length },
  ];

  return (
    <>
      <Confetti active={confetti} />

      {/* ── Toast ────────────────────────────────────────────── */}
      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold text-white transition-all animate-slide-up ${
            toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'
          }`}
        >
          {toast.msg}
        </div>
      )}

      <section className={`card ${surface} border p-6 animate-fade-in-up`} id="card-challenges">
        {/* ── Header ───────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-400/30">
              <Trophy size={20} className="text-white" />
            </div>
            <div>
              <h2 className={`text-lg font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>
                Monthly Challenges 🎯
              </h2>
              <p className={`text-xs ${dark ? 'text-slate-400' : 'text-gray-500'}`}>
                Earn badges. Beat your streak. Save electricity.
              </p>
            </div>
          </div>
          <button
            id="btn-refresh-challenges"
            onClick={loadData}
            className={`p-2 rounded-xl transition-all hover:rotate-180 ${dark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-400'}`}
            title="Refresh"
          >
            <RefreshCw size={16} className="transition-transform duration-300" />
          </button>
        </div>

        {/* ── Stats row ────────────────────────────────────────── */}
        <div className={`grid grid-cols-3 gap-3 mb-5 p-3 rounded-2xl ${dark ? 'bg-slate-700/40' : 'bg-gray-50'}`}>
          {[
            { label: 'Active',    value: active.length,  color: 'text-blue-500',   bg: dark ? 'bg-blue-900/30' : 'bg-blue-50' },
            { label: 'Badges',    value: badges.length,  color: 'text-yellow-500', bg: dark ? 'bg-yellow-900/30' : 'bg-yellow-50' },
            { label: 'Available', value: catalogue.filter(c => !c.joinedStatus).length, color: 'text-green-500', bg: dark ? 'bg-green-900/30' : 'bg-green-50' },
          ].map(s => (
            <div key={s.label} className={`text-center p-2 rounded-xl ${s.bg}`}>
              <p className={`text-xl font-black ${s.color}`}>{loading ? '—' : s.value}</p>
              <p className={`text-xs font-medium mt-0.5 ${dark ? 'text-slate-400' : 'text-gray-500'}`}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Tabs ─────────────────────────────────────────────── */}
        <div className={`flex gap-1 p-1 rounded-xl mb-5 ${dark ? 'bg-slate-700/50' : 'bg-gray-100'}`}>
          {tabs.map(t => (
            <button
              key={t.id}
              id={`btn-tab-${t.id}`}
              onClick={() => setActiveTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === t.id
                  ? dark ? 'bg-slate-600 text-white shadow' : 'bg-white text-gray-900 shadow'
                  : dark ? 'text-slate-400 hover:text-slate-200' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.icon}
              {t.label}
              {t.count > 0 && (
                <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-black ${
                  activeTab === t.id
                    ? 'bg-blue-600 text-white'
                    : dark ? 'bg-slate-600 text-slate-300' : 'bg-gray-200 text-gray-600'
                }`}>{t.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── Loading ──────────────────────────────────────────── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className={`text-xs ${dark ? 'text-slate-500' : 'text-gray-400'}`}>Loading challenges...</p>
          </div>
        ) : (
          <>
            {/* ── AVAILABLE TAB ────────────────────────────────── */}
            {activeTab === 'available' && (
              <div className="space-y-3">
                {catalogue.filter(c => !c.joinedStatus).length === 0
                  ? <EmptyState dark={dark} label="You've joined all challenges this month! 🎉" />
                  : catalogue.filter(c => !c.joinedStatus).map(preset => (
                    <CatalogueCard
                      key={preset.challengeId}
                      preset={preset}
                      dark={dark}
                      onJoin={handleJoin}
                      joining={joining}
                    />
                  ))
                }
                {/* Already joined section */}
                {catalogue.filter(c => c.joinedStatus).length > 0 && (
                  <div className="mt-4">
                    <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${dark ? 'text-slate-500' : 'text-gray-400'}`}>
                      Already joined this month
                    </p>
                    <div className="space-y-2">
                      {catalogue.filter(c => c.joinedStatus).map(preset => (
                        <CatalogueCard
                          key={preset.challengeId}
                          preset={preset}
                          dark={dark}
                          onJoin={handleJoin}
                          joining={joining}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── ACTIVE TAB ───────────────────────────────────── */}
            {activeTab === 'active' && (
              <div className="space-y-3">
                {active.length === 0
                  ? <EmptyState dark={dark} label="No active challenges. Join one from the Available tab!" />
                  : active.map(ch => (
                    <ActiveChallengeRow
                      key={ch._id}
                      ch={ch}
                      dark={dark}
                      onVerify={handleVerify}
                      verifying={verifying}
                    />
                  ))
                }
              </div>
            )}

            {/* ── BADGES TAB ───────────────────────────────────── */}
            {activeTab === 'badges' && (
              <div>
                {badges.length === 0
                  ? (
                    <div className={`text-center py-12 rounded-2xl border border-dashed ${dark ? 'border-slate-600 text-slate-500' : 'border-gray-200 text-gray-400'}`}>
                      <Sparkles size={32} className="mx-auto mb-2 opacity-30" />
                      <p className="text-sm font-semibold">No badges yet</p>
                      <p className="text-xs mt-1">Complete a challenge to earn your first badge!</p>
                    </div>
                  ) : (
                    <>
                      <p className={`text-xs font-semibold uppercase tracking-wide mb-3 ${dark ? 'text-slate-400' : 'text-gray-500'}`}>
                        {badges.length} badge{badges.length !== 1 ? 's' : ''} earned
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {badges.map((b, i) => (
                          <BadgeChip key={i} badge={b} dark={dark} />
                        ))}
                      </div>
                    </>
                  )
                }
              </div>
            )}
          </>
        )}

        {/* ── How it works footer ──────────────────────────────── */}
        <div className={`mt-5 p-3 rounded-xl text-xs ${dark ? 'bg-slate-700/30 text-slate-400' : 'bg-blue-50 text-blue-700'}`}>
          <span className="font-bold">How it works:</span> Join a challenge → track your month → mark complete → earn a badge that appears on your Eco-Score!
        </div>
      </section>
    </>
  );
}
