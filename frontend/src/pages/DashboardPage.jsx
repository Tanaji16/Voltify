import { useState } from 'react';
import { Sun, Info, Lightbulb } from 'lucide-react';
import Header from '../components/Header.jsx';
import DisclaimerModal from '../components/DisclaimerModal.jsx';
import SettingsPage from './SettingsPage.jsx';
import Card1_ApplianceTracker from '../components/Card1_ApplianceTracker.jsx';
import Card2_BudgetPlanner from '../components/Card2_BudgetPlanner.jsx';
import Card3_SlabGuard from '../components/Card3_SlabGuard.jsx';
import Card4_EcoScore from '../components/Card4_EcoScore.jsx';
import Card5_AIAdvisor from '../components/Card5_AIAdvisor.jsx';
import Card6_PricingCheckout from '../components/Card6_PricingCheckout.jsx';
import SavingsGraph from '../components/SavingsGraph.jsx';
import { useTheme, useAuth } from '../App.jsx';

const TIP = 'Tip of the day: Cleaning your ceiling fan blades can improve airflow and reduce energy consumption by up to 15%.';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  if (h < 21) return 'Good Evening';
  return 'Good Night';
}

export default function DashboardPage() {
  const { dark } = useTheme();
  const { user } = useAuth();
  const [disclaimer, setDisclaimer] = useState(false);
  const [settings, setSettings] = useState(false);
  const [tipDismiss, setTipDismiss] = useState(false);

  return (
    <div className={`min-h-screen ${dark ? 'bg-slate-950' : 'bg-gray-50'}`}>
      {/* ── Header ─────────────────────────────────────── */}
      <Header onSettingsOpen={() => setSettings(true)} />

      {/* ── Main Content ───────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* ── Welcome Header ──────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-4 animate-fade-in-up">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sun size={20} className="text-yellow-500" />
              <h1 className={`text-2xl font-black ${dark ? 'text-white' : 'text-gray-900'}`}>
                {getGreeting()}, {user?.fullName || user?.name || 'User'} 👋
              </h1>
            </div>
            <p className={`text-sm ${dark ? 'text-slate-400' : 'text-gray-500'}`}>
              Here's your electricity overview for this billing cycle.
            </p>
          </div>
          <button
            id="btn-open-disclaimer"
            onClick={() => setDisclaimer(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium ${dark ? 'border-slate-600 text-slate-300 hover:bg-slate-800' : 'border-gray-300 text-gray-600 hover:bg-gray-100'}`}
          >
            <Info size={15} /> About These Estimates
          </button>
        </div>

        {/* ── Tip Banner ──────────────────────────────── */}
        {!tipDismiss && (
          <div
            id="tip-banner"
            className={`flex items-start gap-3 rounded-2xl p-4 border animate-fade-in-up ${dark ? 'bg-amber-900/20 border-amber-700/40' : 'bg-amber-50 border-amber-200'}`}
          >
            <Lightbulb size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <p className={`text-sm flex-1 ${dark ? 'text-amber-200' : 'text-amber-800'}`}>{TIP}</p>
            <button
              id="btn-dismiss-tip"
              onClick={() => setTipDismiss(true)}
              className={`text-xs font-semibold ml-2 ${dark ? 'text-amber-400 hover:text-amber-200' : 'text-amber-600 hover:text-amber-800'}`}
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ── Card 1: Appliance Tracker (full-width) ── */}
        <Card1_ApplianceTracker />

        {/* ── Cards 2 & 3: Budget + Slab ───────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card2_BudgetPlanner />
          <Card3_SlabGuard />
        </div>

        {/* ── Card 4: Eco Score (full-width) ────────── */}
        <Card4_EcoScore />

        {/* ── Cards 5 & 6: AI + Pricing ─────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card5_AIAdvisor />
          <Card6_PricingCheckout />
        </div>

        {/* ── Savings Graph (full-width bottom) ──────── */}
        <SavingsGraph />

        {/* ── Footer ──────────────────────────────────── */}
        <footer className={`text-center text-xs py-6 ${dark ? 'text-slate-600' : 'text-gray-400'}`}>
          Voltify ⚡ · Smart Electricity Billing · Data based on Mahavitaran (MSEDCL) 2023-24 tariffs
        </footer>
      </main>

      {/* ── Modals / Drawers ────────────────────────── */}
      <DisclaimerModal isOpen={disclaimer} onClose={() => setDisclaimer(false)} />
      <SettingsPage isOpen={settings} onClose={() => setSettings(false)} />
    </div>
  );
}
