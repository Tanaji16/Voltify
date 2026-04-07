import { useState, useRef, useEffect } from 'react';
import { Crown, Send, MessageCircle, Sparkles, X, ChevronDown } from 'lucide-react';
import { useTheme, useAuth } from '../App.jsx';
import PaymentModal from './PaymentModal.jsx';

// ── Suggested starter prompts ─────────────────────────────────
const SUGGESTED_PROMPTS = [
  {
    id: 'budget',
    text: 'Tell me what is your budget for electricity payments?',
    short: '💰 What\'s your budget?',
  },
  {
    id: 'reduce',
    text: 'What are steps to reduce our electricity bills?',
    short: '📉 How to reduce bills?',
  },
  {
    id: 'accuracy',
    text: 'Is this website giving you a correct budget?',
    short: '✅ Is the budget accurate?',
  },
];

// ── Smart AI responses ────────────────────────────────────────
const AI_RESPONSES = {
  budget: `Based on MSEDCL 2024 tariff slabs and your Kalyan location, here's how to plan your electricity budget:

**Typical Household Budgets:**
• Small household (2 people, minimal AC): ₹600–₹900/month
• Medium household (4 people, 1 AC): ₹1,200–₹1,800/month
• Large household (5+ people, 2 ACs): ₹2,500–₹4,000/month

**My Recommendation for you:**
Set your monthly target at ₹1,200 — this accounts for a refrigerator (24h), 1 ceiling fan (16h), LED TV (6h), and AC (4–5h daily in summer).

**Key tip:** Stay below 300 units/month to avoid the ₹6.00/unit slab (301–500 units). The sweet spot is 200–250 units where your rate stays at ₹3.80/unit.`,

  reduce: `Here are the most effective steps to reduce your electricity bill, ranked by impact:

**🔴 High Impact (saves ₹200–₹600/month)**
1. **AC Temperature**: Set to 24°C instead of 20°C — each degree saves ~6% energy
2. **AC Timings**: Use timer to auto-off after you sleep (saves 3h/night = ~₹250/month)
3. **5-Star Appliances**: A 5★ AC uses 30% less than a 1★ AC

**🟠 Medium Impact (saves ₹50–₹200/month)**
4. **Geyser**: Heat only when needed; set to 50°C (not 65°C)
5. **Washing Machine**: Use cold water mode for 80% of washes
6. **Refrigerator**: Keep coils clean, maintain 3–5cm wall gap for ventilation

**🟢 Low Impact (saves ₹20–₹80/month)**
7. **LED Bulbs**: Replace all CFLs — LEDs use 70% less power
8. **Phantom Load**: Unplug chargers, TV sets (standby consumes ~5W always)
9. **Natural Light**: Open curtains during day to reduce lighting usage

**Total potential savings: ₹400–₹800/month** if all steps are followed consistently.`,

  accuracy: `Great question! Let me be transparent about how Voltify calculates your bill:

**✅ What we do correctly:**
• Use official MSEDCL 2024 residential tariff slabs
• Account for BEE star rating efficiency (5★ = 30% less than standard)
• Apply time-of-use patterns (AC in afternoon uses more due to heat load)
• Include fixed charges (₹85/month for 0–100 unit slab)

**⚠️ Known limitations:**
• We use average watt ratings — your specific appliance may differ by ±10%
• Seasonal factors (summer AC usage is 40% more than estimate)
• Power factor losses not included (adds ~5% to actual bill)
• MSEDCL adds fuel surcharge (₹0.12–0.18/unit) which we approximate

**📊 Accuracy verdict:**
Our estimates are typically within **±15%** of your actual bill. If your actual bill is ₹1,200 and we show ₹1,100–₹1,350, that's accurate.

For best results: use the exact wattage from your appliance's back label and realistic usage hours.`,

  default: `I'm your Voltify AI Energy Expert! I can help you with:

• **Bill analysis** — understanding why your bill is high
• **Appliance tips** — which appliances to use less and when
• **MSEDCL tariff** — slab breakdowns and how to stay in cheaper slabs
• **Energy saving** — practical, household-specific advice

Try one of the suggested topics above, or ask me anything like:
*"Why is my AC bill so high?"*
*"What time should I run my washing machine?"*
*"How many units does a 5-star fridge consume?"*`,

  ac: `**Air Conditioner Energy Tips:**

Your AC is likely your biggest energy consumer. Here's how to optimize:

• **Temperature**: Every 1°C increase saves 6% energy. 24°C is the sweet spot for comfort + savings
• **Sleep mode**: Reduces cooling by 0.5°C/hr after midnight — saves 20% on night usage  
• **Timer**: Set auto-off at 6 AM if you keep it on overnight
• **Service**: Clean filters monthly — dirty filters increase energy use by 15-25%
• **Blue Star 5★ 1.5T**: ~1100W consumption (vs 1800W for 1★) — upgrade saves ₹300/month

At 6h/day usage: expects ₹450–₹600/month depending on star rating.`,

  geyser: `**Water Heater (Geyser) Tips:**

Geysers are silent bill killers — they heat water even when you're sleeping!

• **Auto-timer**: Use a plug timer to run geyser only 7–8 AM and 7–8 PM
• **Temperature**: Set thermostat to 50°C (factory default is often 65°C = wastes 20%)
• **Insulation**: Wrap the tank in insulation blanket — especially in cold months
• **On-demand use**: Turn on 20 minutes before bathing, turn off immediately after
• **Solar alternative**: Solar geyser saves 90% of geyser electricity costs

Current saves: reducing from 4h/day to 1h/day saves ~₹120/month.`,

  fan: `**Ceiling Fan Tips:**

Fans are low-cost to run but hours matter:

• **Switch off** when leaving room — even 1 hour saved across all fans = ₹15/month
• **Regulator vs Inverter fans**: Old regulator fans waste 35% as heat at low speed. Inverter fans are efficient at all speeds
• **BEE 5★ fan**: Consumes 28W vs 75W for standard fan — saves ₹35/month per fan
• **Direction**: Set fan to counter-clockwise in summer (pushes air down), clockwise in winter

For 4 fans × 16h/day: ~₹120–₹180/month. Reducing to 12h saves ~₹30/month.`,
};

function getAIResponse(text) {
  const lower = text.toLowerCase();
  if (lower.includes('budget') || lower.includes('how much') || lower.includes('cost'))
    return AI_RESPONSES.budget;
  if (lower.includes('reduce') || lower.includes('save') || lower.includes('cut') || lower.includes('steps'))
    return AI_RESPONSES.reduce;
  if (lower.includes('correct') || lower.includes('accurate') || lower.includes('right') || lower.includes('website'))
    return AI_RESPONSES.accuracy;
  if (lower.includes('ac') || lower.includes('air condition'))
    return AI_RESPONSES.ac;
  if (lower.includes('geyser') || lower.includes('heater') || lower.includes('water'))
    return AI_RESPONSES.geyser;
  if (lower.includes('fan') || lower.includes('ceiling'))
    return AI_RESPONSES.fan;
  return AI_RESPONSES.default;
}

// ── Message Renderer (supports **bold** and bullet points) ─────
function MessageText({ text }) {
  const lines = text.split('\n').filter(Boolean);
  return (
    <div className="space-y-1 text-sm leading-relaxed">
      {lines.map((line, i) => {
        const parts = line.split(/\*\*(.*?)\*\*/g);
        const content = parts.map((p, j) =>
          j % 2 === 1 ? <strong key={j}>{p}</strong> : p
        );
        if (line.startsWith('•') || line.startsWith('*')) {
          return <p key={i} className="pl-2">{content}</p>;
        }
        if (line.startsWith('#') || /^\*\*[^*]+\*\*$/.test(line.trim())) {
          return <p key={i} className="font-bold mt-2 first:mt-0">{content}</p>;
        }
        return <p key={i}>{content}</p>;
      })}
    </div>
  );
}

const PRO_PLAN = { id: 'pro', name: 'Pro', price: 499, period: '/6 months',
  features: ['AI Energy Advisor', 'Unlimited advice', 'Full budget planner'] };

export default function Card5_AIAdvisor() {
  const { dark } = useTheme();
  const { user } = useAuth();
  const surface  = dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200';

  const isPro = user?.subscriptionStatus && user.subscriptionStatus !== 'Free';

  const [messages,    setMessages]    = useState([]);
  const [inputText,   setInputText]   = useState('');
  const [isTyping,    setIsTyping]    = useState(false);
  const [showPrompts, setShowPrompts] = useState(true);
  const [payModal,    setPayModal]    = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping]);

  const sendMessage = (text) => {
    if (!text.trim()) return;
    setShowPrompts(false);
    setMessages(m => [...m, { role: 'user', text }]);
    setInputText('');
    setIsTyping(true);

    setTimeout(() => {
      const response = getAIResponse(text);
      setMessages(m => [...m, { role: 'bot', text: response }]);
      setIsTyping(false);
    }, 800 + Math.random() * 600);
  };

  const handleSend = () => { if (inputText.trim()) sendMessage(inputText); };
  const handleKey  = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  // ── LOCKED STATE (not Pro) ──────────────────────────────────
  if (!isPro) {
    return (
      <>
        <section className={`card ${surface} border p-6 animate-fade-in-up relative overflow-hidden`} id="card-ai-advisor">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Crown size={20} className="text-purple-600" />
            </div>
            <div>
              <h2 className={`text-lg font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>AI Energy Advisor</h2>
              <p className={`text-xs ${dark ? 'text-slate-400' : 'text-gray-500'}`}>Powered by your usage data</p>
            </div>
            <span className="ml-auto text-xs font-bold px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">PRO</span>
          </div>

          {/* Blurred preview */}
          <div className="relative rounded-xl overflow-hidden" style={{ minHeight: 200 }}>
            <div className="p-4 space-y-3 blur-[5px] pointer-events-none select-none" aria-hidden="true">
              {[
                { role: 'bot',  text: 'Hi! I\'m your personal Energy Expert. What would you like to know?' },
                { role: 'user', text: 'How can I reduce my AC bill this summer?' },
                { role: 'bot',  text: 'Great question! Set your AC to 24°C and use sleep mode at night...' },
              ].map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${m.role === 'user' ? 'bg-blue-600 text-white' : dark ? 'bg-slate-700 text-slate-200' : 'bg-gray-100 text-gray-800'}`}>
                    {m.text}
                  </div>
                </div>
              ))}
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6"
              style={{ background: dark ? 'rgba(15,23,42,0.80)' : 'rgba(255,255,255,0.80)', backdropFilter: 'blur(4px)' }}>
              <div className={`text-center rounded-2xl p-6 shadow-xl border w-full max-w-sm ${dark ? 'bg-slate-800/90 border-purple-700/40' : 'bg-white/90 border-purple-200'}`}>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Crown size={32} className="text-white" />
                </div>
                <h3 className={`text-xl font-extrabold mb-2 ${dark ? 'text-white' : 'text-gray-900'}`}>Unlock Your Personal Energy Expert</h3>
                <p className={`text-sm mb-5 leading-relaxed ${dark ? 'text-slate-400' : 'text-gray-500'}`}>
                  Get AI-powered answers tailored to your exact appliances, Kalyan location, and MSEDCL tariff.
                </p>
                <button id="btn-unlock-ai-advisor" onClick={() => setPayModal(true)}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-sm shadow-lg hover:shadow-xl transition-all">
                  🔓 Upgrade to Pro — ₹499/6mo
                </button>
                <p className={`text-xs mt-3 ${dark ? 'text-slate-500' : 'text-gray-400'}`}>Cancel anytime · 7-day money-back guarantee</p>
              </div>
            </div>
          </div>

          {/* Disabled input */}
          <div className="mt-4 flex gap-2 opacity-60" aria-hidden="true">
            <input placeholder="Upgrade to Pro to chat..." className={`flex-1 px-4 py-2.5 rounded-xl border text-sm cursor-not-allowed ${dark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`} disabled/>
            <button className="px-4 py-2.5 rounded-xl bg-purple-600 text-white cursor-not-allowed opacity-80" disabled><Send size={16}/></button>
          </div>
        </section>

        <PaymentModal isOpen={payModal} onClose={() => setPayModal(false)} plan={PRO_PLAN}/>
      </>
    );
  }

  // ── UNLOCKED CHATBOT ────────────────────────────────────────
  return (
    <section className={`card ${surface} border p-6 animate-fade-in-up flex flex-col`} id="card-ai-advisor" style={{ minHeight: 460 }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow">
          <Sparkles size={18} className="text-white" />
        </div>
        <div>
          <h2 className={`text-lg font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>AI Energy Advisor</h2>
          <p className={`text-xs ${dark ? 'text-slate-400' : 'text-gray-500'}`}>✅ Pro Active — Unlimited chat</p>
        </div>
        {messages.length > 0 && (
          <button onClick={() => { setMessages([]); setShowPrompts(true); }}
            title="Clear chat"
            className={`ml-auto p-1.5 rounded-lg ${dark ? 'text-slate-500 hover:text-slate-300 hover:bg-slate-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}>
            <X size={16}/>
          </button>
        )}
      </div>

      {/* Chat area */}
      <div className={`flex-1 rounded-2xl overflow-y-auto p-4 space-y-3 mb-4 ${dark ? 'bg-slate-700/40' : 'bg-gray-50'}`} style={{ minHeight: 260, maxHeight: 320 }}>
        {/* Welcome message */}
        {messages.length === 0 && (
          <div className="flex justify-start">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5 shadow">
                <Sparkles size={14} className="text-white"/>
              </div>
              <div className={`max-w-[85%] px-4 py-3 rounded-2xl rounded-tl-sm text-sm ${dark ? 'bg-slate-700 text-slate-200' : 'bg-white text-gray-800 shadow-sm border border-gray-100'}`}>
                👋 Hi {user?.fullName?.split(' ')[0] || user?.name?.split(' ')[0] || 'there'}! I'm your personal Energy Expert powered by MSEDCL data. Ask me anything about your electricity usage or select a topic below!
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'bot' && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0 mr-2 mt-0.5 shadow">
                <Sparkles size={14} className="text-white"/>
              </div>
            )}
            <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm ${
              m.role === 'user'
                ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-tr-sm shadow'
                : dark ? 'bg-slate-700 text-slate-200 rounded-tl-sm' : 'bg-white text-gray-800 rounded-tl-sm shadow-sm border border-gray-100'
            }`}>
              {m.role === 'bot' ? <MessageText text={m.text}/> : m.text}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0 mr-2 shadow">
              <Sparkles size={14} className="text-white"/>
            </div>
            <div className={`px-4 py-3 rounded-2xl rounded-tl-sm ${dark ? 'bg-slate-700' : 'bg-white border border-gray-100 shadow-sm'}`}>
              <div className="flex gap-1.5 items-center h-5">
                {[0,1,2].map(i => (
                  <div key={i} className="w-2 h-2 rounded-full bg-purple-500" style={{ animation: `bounce 1s ${i*0.2}s infinite` }}/>
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef}/>
      </div>

      {/* Suggested prompts */}
      {showPrompts && messages.length === 0 && (
        <div className="mb-3 space-y-2">
          <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${dark ? 'text-slate-500' : 'text-gray-400'}`}>Suggested questions</p>
          {SUGGESTED_PROMPTS.map(p => (
            <button key={p.id} onClick={() => sendMessage(p.text)}
              className={`w-full text-left px-4 py-2.5 rounded-xl border text-sm font-medium transition-all hover:scale-[1.01] ${dark ? 'border-slate-600 text-slate-300 bg-slate-700/40 hover:border-purple-500 hover:bg-purple-900/20' : 'border-gray-200 text-gray-700 bg-white hover:border-purple-300 hover:bg-purple-50 shadow-sm'}`}>
              {p.short}
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div className="flex gap-2">
        <input
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask anything about your electricity..."
          className={`flex-1 px-4 py-2.5 rounded-xl border text-sm ${dark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-500 focus:border-purple-500' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-purple-400'} focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all`}
        />
        <button onClick={handleSend} disabled={!inputText.trim() || isTyping}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 disabled:opacity-40 transition-all shadow">
          <Send size={16}/>
        </button>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
      `}</style>
    </section>
  );
}
