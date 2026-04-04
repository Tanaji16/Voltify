import { useState } from 'react';
import { X, User, Phone, Mail, LogOut, Bell, FileText, Crown } from 'lucide-react';
import { useTheme, useAuth } from '../App.jsx';

const SECTIONS = {
  profile: 'Profile Info',
  plan:    'Plan Status',
  prefs:   'Preferences',
};

export default function SettingsPage({ isOpen, onClose }) {
  const { dark }       = useTheme();
  const { user, logout } = useAuth();
  const [active, setActive]     = useState('profile');
  const [whatsapp, setWhatsapp] = useState(true);
  const [pdf,      setPdf]      = useState(false);

  if (!isOpen) return null;

  const inputCls = `w-full px-3 py-2.5 rounded-lg border text-sm ${dark ? 'bg-slate-700 border-slate-600 text-slate-300' : 'bg-gray-50 border-gray-200 text-gray-600'} cursor-not-allowed`;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        id="settings-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        className={`fixed top-0 right-0 bottom-0 z-50 w-full max-w-sm flex flex-col shadow-2xl animate-fade-in-up ${dark ? 'bg-slate-900 border-l border-slate-700' : 'bg-white border-l border-gray-200'}`}
        style={{ animation: 'slideInRight 0.28s cubic-bezier(0.22,1,0.36,1) both' }}
      >
        {/* Drawer Header */}
        <div className={`flex items-center justify-between px-5 py-4 border-b ${dark ? 'border-slate-700' : 'border-gray-200'}`}>
          <h2 className={`text-base font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>Settings</h2>
          <button id="btn-close-settings" onClick={onClose} className={`p-1.5 rounded-lg ${dark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-gray-100 text-gray-500'}`} aria-label="Close settings">
            <X size={18} />
          </button>
        </div>

        {/* Section Tabs */}
        <div className={`flex border-b ${dark ? 'border-slate-700' : 'border-gray-200'}`}>
          {Object.entries(SECTIONS).map(([key, label]) => (
            <button
              key={key}
              id={`settings-tab-${key}`}
              onClick={() => setActive(key)}
              className={`flex-1 text-xs font-semibold py-3 border-b-2 transition-all ${
                active === key
                  ? 'border-blue-600 text-blue-600'
                  : `border-transparent ${dark ? 'text-slate-400 hover:text-slate-200' : 'text-gray-500 hover:text-gray-700'}`
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">

          {/* ── Profile ─────────────────────────────────── */}
          {active === 'profile' && (
            <div className="space-y-4 animate-fade-in-up">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-black shadow-lg">
                  {user?.name?.[0] || user?.fullName?.[0] || 'U'}
                </div>
                <div>
                  <p className={`font-bold text-lg ${dark ? 'text-white' : 'text-gray-900'}`}>{user?.name || user?.fullName || 'User'}</p>
                  <p className={`text-xs ${dark ? 'text-slate-400' : 'text-gray-500'}`}>
                    {user?.subscriptionStatus && user.subscriptionStatus !== 'Free' ? `${user.subscriptionStatus} Member` : 'Free Member'}
                  </p>
                </div>
              </div>

              {[
                { icon: User,  label: 'Full Name',   val: user?.name || user?.fullName || 'User',         id: 'settings-name' },
                { icon: Mail,  label: 'Email',       val: user?.email || 'Not set',                       id: 'settings-email', lock: true },
                { icon: null,  label: 'Consumer ID', val: user?.consumerId || '210000001234',              id: 'settings-cid',  lock: true },
                { icon: null,  label: 'BU Code',     val: user?.buCode || 'KLNN',                         id: 'settings-bu' },
              ].map(f => (
                <div key={f.id}>
                  <label className={`block text-xs font-semibold uppercase tracking-wide mb-1.5 ${dark ? 'text-slate-400' : 'text-gray-500'}`}>
                    {f.label} {f.lock && <span className="text-amber-500">🔒</span>}
                  </label>
                  <input id={f.id} defaultValue={f.val} readOnly className={inputCls} />
                </div>
              ))}
            </div>
          )}

          {/* ── Plan ──────────────────────────────────── */}
          {active === 'plan' && (
            <div className="space-y-4 animate-fade-in-up">
              {user?.subscriptionStatus && user.subscriptionStatus !== 'Free' ? (
                <div className={`rounded-2xl p-5 ${dark ? 'bg-gradient-to-br from-blue-900/60 to-indigo-900/40 border border-blue-700/40' : 'bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200'}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
                      <Crown size={20} className="text-white" />
                    </div>
                    <div>
                      <p className={`font-extrabold ${dark ? 'text-white' : 'text-gray-900'}`}>{user?.planName || user?.subscriptionStatus} Plan</p>
                      <p className={`text-xs text-green-500 font-semibold`}>✓ Active subscription</p>
                    </div>
                  </div>
                  <div className={`grid grid-cols-2 gap-3 text-sm ${dark ? 'text-slate-300' : 'text-gray-700'}`}>
                    <div>
                      <p className={`text-xs uppercase tracking-wide mb-0.5 ${dark ? 'text-slate-500' : 'text-gray-400'}`}>Started</p>
                      <p className="font-semibold">
                        {user?.planStarted ? new Date(user.planStarted).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'}) : '—'}
                      </p>
                    </div>
                    <div>
                      <p className={`text-xs uppercase tracking-wide mb-0.5 ${dark ? 'text-slate-500' : 'text-gray-400'}`}>Valid Until</p>
                      <p className="font-semibold">
                        {user?.planExpiry ? new Date(user.planExpiry).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'}) : '—'}
                      </p>
                    </div>
                    <div>
                      <p className={`text-xs uppercase tracking-wide mb-0.5 ${dark ? 'text-slate-500' : 'text-gray-400'}`}>Amount Paid</p>
                      <p className="font-semibold">₹{user?.planPrice?.toLocaleString('en-IN') || '—'}</p>
                    </div>
                    <div>
                      <p className={`text-xs uppercase tracking-wide mb-0.5 ${dark ? 'text-slate-500' : 'text-gray-400'}`}>Status</p>
                      <p className="font-semibold text-green-600">✓ Active</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={`rounded-2xl p-5 border text-center ${dark ? 'bg-slate-700/40 border-slate-600' : 'bg-gray-50 border-gray-200'}`}>
                  <Crown size={28} className={`mx-auto mb-2 ${dark ? 'text-slate-500' : 'text-gray-400'}`}/>
                  <p className={`font-bold mb-1 ${dark ? 'text-slate-300' : 'text-gray-700'}`}>Free Plan</p>
                  <p className={`text-xs mb-3 ${dark ? 'text-slate-500' : 'text-gray-500'}`}>Upgrade to unlock AI Advisor, full budget planner and more</p>
                  <p className={`text-xs ${dark ? 'text-slate-600' : 'text-gray-400'}`}>Purchase a plan from the Choose Your Voltify Plan section on the dashboard</p>
                </div>
              )}

              <button id="btn-manage-plan" className={`w-full py-2.5 rounded-xl border text-sm font-semibold ${dark ? 'border-slate-600 text-slate-300 hover:bg-slate-800' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                Manage / Cancel Plan
              </button>
            </div>
          )}

          {/* ── Preferences ──────────────────────────── */}
          {active === 'prefs' && (
            <div className="space-y-4 animate-fade-in-up">
              {/* WhatsApp toggle */}
              <div className={`flex items-center justify-between p-4 rounded-xl border ${dark ? 'bg-slate-800/60 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center gap-3">
                  <Bell size={18} className="text-green-500" />
                  <div>
                    <p className={`text-sm font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>WhatsApp Slab Warnings</p>
                    <p className={`text-xs ${dark ? 'text-slate-400' : 'text-gray-500'}`}>Get alerted before crossing slabs</p>
                  </div>
                </div>
                <button
                  id="toggle-whatsapp"
                  onClick={() => setWhatsapp(w => !w)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${whatsapp ? 'bg-green-500' : dark ? 'bg-slate-600' : 'bg-gray-300'}`}
                  role="switch"
                  aria-checked={whatsapp}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${whatsapp ? 'left-6' : 'left-0.5'}`} />
                </button>
              </div>

              {/* Monthly PDF toggle */}
              <div className={`flex items-center justify-between p-4 rounded-xl border ${dark ? 'bg-slate-800/60 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center gap-3">
                  <FileText size={18} className="text-blue-500" />
                  <div>
                    <p className={`text-sm font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>Monthly PDF Report</p>
                    <p className={`text-xs ${dark ? 'text-slate-400' : 'text-gray-500'}`}>Auto-send PDF summary each month</p>
                  </div>
                </div>
                <button
                  id="toggle-pdf"
                  onClick={() => setPdf(p => !p)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${pdf ? 'bg-blue-500' : dark ? 'bg-slate-600' : 'bg-gray-300'}`}
                  role="switch"
                  aria-checked={pdf}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${pdf ? 'left-6' : 'left-0.5'}`} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Logout Footer */}
        <div className={`p-5 border-t ${dark ? 'border-slate-700' : 'border-gray-200'}`}>
          <button
            id="btn-logout"
            onClick={logout}
            className="w-full py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-bold hover:bg-red-100 dark:hover:bg-red-900/40 flex items-center justify-center gap-2 transition-colors"
          >
            <LogOut size={16} /> Log Out
          </button>
        </div>
      </aside>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </>
  );
}
