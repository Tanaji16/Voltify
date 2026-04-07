import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Zap, Sun, Moon, Settings, Menu, X, Bell, User, LogOut, ChevronRight, Crown, Shield, MapPin, Plus } from 'lucide-react';
import { useTheme, useAuth } from '../App.jsx';
import { addMeter } from '../api/auth.js';

const NAV_LINKS = [
  { to: '/',        label: 'Dashboard' },
  { to: '/billing', label: 'Billing'   },
  { to: '/history', label: 'History'   },
];

// ── Notification data ─────────────────────────────────────────
const NOTIFICATIONS_DATA = [
  {
    id: 1,
    icon: '⚡',
    title: 'Slab Warning!',
    body: 'You\'re at 82 units this month. Cross 100 and your rate jumps to ₹3.80/unit.',
    time: '2 hours ago',
    unread: true,
    color: 'red',
  },
  {
    id: 2,
    icon: '💡',
    title: 'Tip of the Day',
    body: 'Setting your AC to 24°C instead of 20°C can reduce your cooling bill by up to 24%.',
    time: '1 day ago',
    unread: true,
    color: 'amber',
  },
  {
    id: 3,
    icon: '📊',
    title: 'Monthly Report Ready',
    body: 'Your March 2025 electricity analysis is ready. Total: 185 kWh consumed.',
    time: '3 days ago',
    unread: false,
    color: 'blue',
  },
  {
    id: 4,
    icon: '🎉',
    title: 'You\'re in Top 20% Savers!',
    body: 'Your energy efficiency score this month puts you ahead of 80% of MSEDCL users in Kalyan.',
    time: '1 week ago',
    unread: false,
    color: 'green',
  },
];

function useClickOutside(ref, callback) {
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) callback();
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ref, callback]);
}

export default function Header({ onSettingsOpen }) {
  const { dark, toggleDark } = useTheme();
  const { user, logout, activeMeterId, setActiveMeter, setAuth } = useAuth();
  const location             = useLocation();
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [showNotif,   setShowNotif]   = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showMeters,  setShowMeters]  = useState(false);
  const [addingMeter, setAddingMeter] = useState(false);
  const [notifications, setNotifications] = useState(NOTIFICATIONS_DATA);

  const notifRef   = useRef(null);
  const profileRef = useRef(null);
  const meterRef   = useRef(null);

  useClickOutside(notifRef,   () => setShowNotif(false));
  useClickOutside(profileRef, () => setShowProfile(false));
  useClickOutside(meterRef,   () => setShowMeters(false));

  const unreadCount = notifications.filter(n => n.unread).length;

  const markAllRead = () => setNotifications(ns => ns.map(n => ({ ...n, unread: false })));

  const planBadge = {
    'Starter':    { label: 'Starter', color: 'blue' },
    'Pro':        { label: 'Pro ⚡',  color: 'indigo' },
    'Annual':     { label: 'Eco-Saver 👑', color: 'purple' },
    'Eco-Saver':  { label: 'Eco-Saver 👑', color: 'purple' },
  }[user?.subscriptionStatus] || { label: 'Free', color: 'gray' };

  const notifBg = { red: 'bg-red-100 dark:bg-red-900/30', amber: 'bg-amber-100 dark:bg-amber-900/30', blue: 'bg-blue-100 dark:bg-blue-900/30', green: 'bg-green-100 dark:bg-green-900/30' };

  const currentMeter = user?.meters?.find(m => m._id === activeMeterId) || user?.meters?.[0];

  const handleAddMeter = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      const res = await addMeter(fd.get('name'), fd.get('consumerId'), fd.get('buCode'), fd.get('city') || '');
      setAuth({ user: res.data.user, token: localStorage.getItem('voltify_token') });
      setActiveMeter(res.data.user.meters[res.data.user.meters.length - 1]._id);
      setAddingMeter(false);
      setShowMeters(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add meter');
    }
  };

  return (
    <header className={`sticky top-0 z-50 w-full ${dark ? 'bg-slate-900/95' : 'bg-white/95'} backdrop-blur-md border-b ${dark ? 'border-slate-700' : 'border-gray-200'} shadow-sm`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* ── Logo ─────────────────────────────────────── */}
          <Link to="/" className="flex items-center gap-2 group" id="header-logo">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <Zap size={20} className="text-white fill-white"/>
            </div>
            <div className="flex flex-col leading-none">
              <span className={`text-xl font-black tracking-tight ${dark ? 'text-white' : 'text-gray-900'}`}>
                Volt<span className="text-blue-600">ify</span>
              </span>
              <span className={`text-[10px] font-medium tracking-widest uppercase ${dark ? 'text-slate-400' : 'text-gray-400'}`}>Smart Billing</span>
            </div>
          </Link>

          {/* ── Desktop Nav ──────────────────────────────── */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ to, label }) => (
              <Link key={to} to={to} id={`nav-${label.toLowerCase()}`}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  location.pathname === to
                    ? 'bg-blue-600 text-white shadow'
                    : dark ? 'text-slate-300 hover:bg-slate-800 hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}>
                {label}
              </Link>
            ))}
          </nav>

          {/* ── Right Controls ────────────────────────────── */}
          <div className="flex items-center gap-1">

            {/* ── Meter Switcher ─────────────────────────── */}
            {user && user.meters && (
              <div className="relative mr-2 hidden sm:block" ref={meterRef}>
                <button onClick={() => { setShowMeters(m => !m); setShowProfile(false); setShowNotif(false); }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${
                    dark ? 'bg-slate-800 border-slate-700 hover:border-slate-500 text-slate-200' 
                         : 'bg-white border-gray-200 hover:border-gray-400 text-gray-800'
                  }`}>
                  <MapPin size={14} className="text-blue-500" />
                  <span className="text-sm font-bold truncate max-w-[120px]">
                    {currentMeter?.meterName || 'Select Meter'}
                  </span>
                </button>

                {showMeters && (
                  <div className={`absolute right-0 top-10 w-64 rounded-2xl shadow-xl border overflow-hidden z-50 ${dark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'}`} style={{ animation: 'dropDown 0.2s ease both' }}>
                    <div className={`px-4 py-3 border-b text-xs font-black uppercase tracking-wider ${dark ? 'border-slate-700 text-slate-500' : 'border-gray-100 text-gray-400'}`}>
                      Your Properties
                    </div>
                    <div className="max-h-60 overflow-y-auto p-2">
                       {user.meters.map(m => (
                         <button key={m._id} onClick={() => { setActiveMeter(m._id); setShowMeters(false); }}
                           className={`w-full text-left px-3 py-2 rounded-xl mb-1 flex items-center justify-between ${
                             m._id === activeMeterId 
                               ? (dark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600') 
                               : (dark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-gray-50 text-gray-700')
                           }`}>
                           <div>
                             <p className="text-sm font-bold">{m.meterName}</p>
                             <p className="text-xs opacity-70">ID: {m.consumerId}</p>
                           </div>
                           {m._id === activeMeterId && <div className="w-2 h-2 rounded-full bg-blue-500"></div>}
                         </button>
                       ))}
                       
                       {!addingMeter ? (
                         <button onClick={() => setAddingMeter(true)} className={`w-full tracking-wide text-left px-3 py-2 rounded-xl text-xs font-bold mt-1 flex items-center gap-2 ${dark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
                           <Plus size={14} /> Add new meter
                         </button>
                       ) : (
                         <form onSubmit={handleAddMeter} className={`p-3 mt-1 rounded-xl border ${dark ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-200'} space-y-2`}>
                            <input name="name" required placeholder="Name (e.g. Parents House)" className={`w-full p-2 text-xs rounded border ${dark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-gray-300'}`} />
                            <input name="consumerId" required pattern="\d{12}" placeholder="12-Digit Consumer ID" className={`w-full p-2 text-xs rounded border ${dark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-gray-300'}`} />
                            <input name="buCode" required placeholder="4-Digit BU Code" className={`w-full p-2 text-xs rounded border ${dark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-gray-300'}`} />
                            <div className="flex gap-2 pt-1">
                               <button type="submit" className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-lg flex-1">Save</button>
                               <button type="button" onClick={() => setAddingMeter(false)} className={`px-3 py-1 text-xs font-bold rounded-lg flex-1 ${dark ? 'bg-slate-700 text-white' : 'bg-gray-200'}`}>Cancel</button>
                            </div>
                         </form>
                       )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Notification Bell ──────────────────────── */}
            <div className="relative" ref={notifRef}>
              <button id="btn-notifications" onClick={() => { setShowNotif(v => !v); setShowProfile(false); }}
                className={`relative p-2 rounded-lg ${dark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-gray-100 text-gray-600'}`}
                aria-label="Notifications">
                <Bell size={18}/>
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[9px] font-black flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotif && (
                <div className={`absolute right-0 top-12 w-80 rounded-2xl shadow-2xl border overflow-hidden z-50 ${dark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'}`}
                  style={{ animation: 'dropDown 0.2s ease both' }}>
                  <div className={`flex items-center justify-between px-4 py-3 border-b ${dark ? 'border-slate-700' : 'border-gray-100'}`}>
                    <span className={`text-sm font-extrabold ${dark ? 'text-white' : 'text-gray-900'}`}>Notifications</span>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-xs text-blue-600 font-semibold hover:underline">Mark all read</button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 dark:divide-slate-800">
                    {notifications.map(n => (
                      <div key={n.id} className={`flex gap-3 px-4 py-3 transition-colors ${n.unread ? (dark ? 'bg-slate-800/60' : 'bg-blue-50/60') : ''} hover:${dark ? 'bg-slate-800' : 'bg-gray-50'}`}
                        onClick={() => setNotifications(ns => ns.map(x => x.id === n.id ? {...x, unread: false} : x))}>
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-base ${notifBg[n.color]}`}>
                          {n.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className={`text-xs font-bold truncate ${dark ? 'text-white' : 'text-gray-900'}`}>{n.title}</p>
                            {n.unread && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"/>}
                          </div>
                          <p className={`text-xs mt-0.5 leading-relaxed ${dark ? 'text-slate-400' : 'text-gray-500'}`}>{n.body}</p>
                          <p className={`text-[10px] mt-1 ${dark ? 'text-slate-600' : 'text-gray-400'}`}>{n.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className={`px-4 py-2 border-t text-center ${dark ? 'border-slate-700' : 'border-gray-100'}`}>
                    <button className="text-xs text-blue-600 font-semibold hover:underline">View all notifications</button>
                  </div>
                </div>
              )}
            </div>

            {/* ── Theme Toggle ──────────────────────────── */}
            <button id="btn-theme-toggle" onClick={toggleDark}
              className={`p-2 rounded-lg ${dark ? 'hover:bg-slate-800 text-yellow-400' : 'hover:bg-gray-100 text-gray-600'}`}
              aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}>
              {dark ? <Sun size={18}/> : <Moon size={18}/>}
            </button>

            {/* ── Settings ──────────────────────────────── */}
            <button id="btn-settings" onClick={onSettingsOpen}
              className={`p-2 rounded-lg ${dark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-gray-100 text-gray-600'}`}
              aria-label="Open settings">
              <Settings size={18}/>
            </button>

            {/* ── User Avatar + Profile Dropdown ────────── */}
            {user && (
              <div className="relative ml-1" ref={profileRef}>
                <button id="btn-user-profile" onClick={() => { setShowProfile(v => !v); setShowNotif(false); }}
                  className="flex items-center gap-2 p-1 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-all">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-black shadow">
                    {user.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className={`hidden sm:block text-sm font-semibold ${dark ? 'text-slate-200' : 'text-gray-700'}`}>
                    {user.name?.split(' ')[0]}
                  </span>
                </button>

                {showProfile && (
                  <div className={`absolute right-0 top-12 w-72 rounded-2xl shadow-2xl border overflow-hidden z-50 ${dark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'}`}
                    style={{ animation: 'dropDown 0.2s ease both' }}>

                    {/* Profile hero */}
                    <div className={`px-5 pt-5 pb-4 border-b ${dark ? 'border-slate-700 bg-gradient-to-br from-blue-900/30 to-purple-900/20' : 'border-gray-100 bg-gradient-to-br from-blue-50 to-purple-50'}`}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-lg font-black shadow-lg">
                          {user.name?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className={`font-extrabold text-sm ${dark ? 'text-white' : 'text-gray-900'}`}>{user.name}</p>
                          <p className={`text-xs ${dark ? 'text-slate-400' : 'text-gray-500'}`}>
                            {user.email || 'MSEDCL Consumer'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                          planBadge.color === 'blue'   ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' :
                          planBadge.color === 'purple' ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300' :
                          planBadge.color === 'indigo' ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300' :
                          'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400'
                        }`}>
                          {planBadge.label} Plan
                        </span>
                        <span className={`text-xs ${dark ? 'text-slate-500' : 'text-gray-400'}`}>
                          ID: 2100...1234
                        </span>
                      </div>
                    </div>

                    {/* Quick stats */}
                    <div className={`grid grid-cols-3 divide-x border-b ${dark ? 'divide-slate-700 border-slate-700' : 'divide-gray-100 border-gray-100'}`}>
                      {[
                        { label: 'Bill Est.', value: '₹1,142', icon: '🧾' },
                        { label: 'kWh/mo',    value: '185',    icon: '⚡' },
                        { label: 'Eco Score', value: '74/100', icon: '🌿' },
                      ].map(s => (
                        <div key={s.label} className={`px-3 py-2.5 text-center ${dark ? 'hover:bg-slate-800' : 'hover:bg-gray-50'}`}>
                          <p className="text-base">{s.icon}</p>
                          <p className={`text-xs font-black ${dark ? 'text-white' : 'text-gray-900'}`}>{s.value}</p>
                          <p className={`text-[10px] ${dark ? 'text-slate-500' : 'text-gray-400'}`}>{s.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Menu items */}
                    <div className="p-2 space-y-0.5">
                      {[
                        { label: 'My Profile & Settings', icon: User, action: () => { setShowProfile(false); onSettingsOpen(); } },
                        { label: 'Billing & Plans', icon: Crown, action: () => { setShowProfile(false); }, to: '/billing' },
                        { label: 'Security', icon: Shield, action: () => setShowProfile(false) },
                      ].map(item => {
                        const Icon = item.icon;
                        const el = (
                          <button key={item.label} onClick={item.action}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${dark ? 'text-slate-300 hover:bg-slate-800' : 'text-gray-700 hover:bg-gray-100'}`}>
                            <Icon size={16} className={dark ? 'text-slate-500' : 'text-gray-400'}/>
                            {item.label}
                            <ChevronRight size={14} className="ml-auto opacity-40"/>
                          </button>
                        );
                        return item.to ? <Link key={item.label} to={item.to}>{el}</Link> : el;
                      })}
                    </div>

                    {/* Logout */}
                    <div className={`p-2 border-t ${dark ? 'border-slate-700' : 'border-gray-100'}`}>
                      <button onClick={() => { setShowProfile(false); logout(); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
                        <LogOut size={16}/>
                        Log Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Mobile Menu Toggle ────────────────────── */}
            <button id="btn-mobile-menu"
              className={`md:hidden p-2 rounded-lg ${dark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-gray-100 text-gray-600'}`}
              onClick={() => setMobileOpen(m => !m)}
              aria-label="Toggle mobile menu">
              {mobileOpen ? <X size={18}/> : <Menu size={18}/>}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile Nav ─────────────────────────────────────────── */}
      {mobileOpen && (
        <div className={`md:hidden border-t ${dark ? 'border-slate-700 bg-slate-900' : 'border-gray-200 bg-white'} px-4 py-3 space-y-1 animate-fade-in-up`}>
          {NAV_LINKS.map(({ to, label }) => (
            <Link key={to} to={to} onClick={() => setMobileOpen(false)}
              className={`block px-4 py-2 rounded-lg text-sm font-medium ${
                location.pathname === to
                  ? 'bg-blue-600 text-white'
                  : dark ? 'text-slate-300 hover:bg-slate-800' : 'text-gray-700 hover:bg-gray-100'
              }`}>
              {label}
            </Link>
          ))}
        </div>
      )}

      <style>{`
        @keyframes dropDown {
          from { transform: translateY(-8px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </header>
  );
}
