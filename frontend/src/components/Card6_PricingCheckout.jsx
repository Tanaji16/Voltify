import { useState } from 'react';
import { Check, Star, Zap, Crown } from 'lucide-react';
import { useTheme } from '../App.jsx';
import PaymentModal from './PaymentModal.jsx';

const PLANS = [
  {
    id:       'starter',
    name:     'Starter',
    subtitle: '1 Month',
    price:    99,
    period:   '/month',
    icon:     <Zap size={20} className="text-blue-500" />,
    badge:    null,
    highlight: false,
    features: [
      '3 smart advice uses',
      'Bill calculator',
      'Slab guard alerts',
      'Basic eco-score',
      'PDF download',
    ],
    cta:     'Get Started',
    btnCls:  'border-2 border-blue-600 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20',
  },
  {
    id:       'pro',
    name:     'Pro',
    subtitle: '6 Months',
    price:    499,
    period:   '/6 months',
    icon:     <Star size={20} className="text-yellow-500 fill-yellow-400" />,
    badge:    'Most Popular',
    highlight: true,
    features: [
      'Unlimited smart advice',
      'Full budget planner',
      'AI Energy Advisor',
      'Community eco rankings',
      'WhatsApp slab warnings',
      'Monthly PDF reports',
    ],
    cta:    'Start Pro Plan',
    btnCls: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg',
  },
  {
    id:       'annual',
    name:     'Eco-Saver',
    subtitle: '1 Year',
    price:    899,
    period:   '/year',
    icon:     <Crown size={20} className="text-purple-500" />,
    badge:    'Best Value',
    highlight: false,
    features: [
      'Everything in Pro',
      'Priority AI responses',
      'Top 5% saver insights',
      'Annual savings report',
      'Dedicated support',
    ],
    cta:     'Go Annual',
    btnCls:  'border-2 border-purple-600 text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20',
  },
];

export default function Card6_PricingCheckout() {
  const { dark } = useTheme();
  const surface  = dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200';

  const [payModal, setPayModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const openPayment = (plan) => {
    setSelectedPlan(plan);
    setPayModal(true);
  };

  return (
    <>
      <section className={`card ${surface} border p-6 animate-fade-in-up`} id="card-pricing">
        <div className="text-center mb-8">
          <h2 className={`text-2xl font-black mb-2 ${dark ? 'text-white' : 'text-gray-900'}`}>
            Choose Your <span className="gradient-text">Voltify Plan</span>
          </h2>
          <p className={`text-sm ${dark ? 'text-slate-400' : 'text-gray-500'}`}>
            Unlock the full power of smart electricity management
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PLANS.map(plan => (
            <div
              key={plan.id}
              id={`pricing-card-${plan.id}`}
              className={`relative flex flex-col rounded-2xl p-6 border transition-all duration-300 ${
                plan.highlight
                  ? `${dark ? 'bg-gradient-to-b from-blue-900/60 to-indigo-900/40 border-blue-500 shadow-blue-500/20' : 'bg-gradient-to-b from-blue-50 to-indigo-50 border-blue-400 shadow-blue-200'} shadow-xl scale-[1.02]`
                  : `${dark ? 'bg-slate-700/40 border-slate-600' : 'bg-gray-50 border-gray-200'}`
              }`}
            >
              {/* Badge */}
              {plan.badge && (
                <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide ${
                  plan.id === 'pro' ? 'bg-blue-600 text-white' : 'bg-purple-600 text-white'
                }`}>
                  {plan.badge}
                </div>
              )}

              {/* Plan header */}
              <div className="flex items-center gap-2 mb-4">
                {plan.icon}
                <div>
                  <p className={`font-extrabold ${dark ? 'text-white' : 'text-gray-900'}`}>{plan.name}</p>
                  <p className={`text-xs ${dark ? 'text-slate-400' : 'text-gray-500'}`}>{plan.subtitle}</p>
                </div>
              </div>

              {/* Price */}
              <div className="mb-5">
                <span className={`text-4xl font-black ${dark ? 'text-white' : 'text-gray-900'}`}>
                  ₹{plan.price.toLocaleString('en-IN')}
                </span>
                <span className={`text-sm ml-1 ${dark ? 'text-slate-400' : 'text-gray-500'}`}>{plan.period}</span>
              </div>

              {/* Features */}
              <ul className="space-y-2.5 mb-6 flex-1">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check size={15} className="text-green-500 flex-shrink-0 mt-0.5" />
                    <span className={`text-sm ${dark ? 'text-slate-300' : 'text-gray-700'}`}>{f}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button
                id={`btn-select-plan-${plan.id}`}
                onClick={() => openPayment(plan)}
                className={`w-full py-3 rounded-xl text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98] ${plan.btnCls}`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        <p className={`text-center text-xs mt-5 ${dark ? 'text-slate-500' : 'text-gray-400'}`}>
          🔒 Secure payment via Razorpay · Cancel anytime · 7-day money-back guarantee
        </p>
      </section>

      <PaymentModal
        isOpen={payModal}
        onClose={() => setPayModal(false)}
        plan={selectedPlan}
      />
    </>
  );
}
