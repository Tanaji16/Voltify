import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Zap, Check, X, Eye, EyeOff, ChevronRight, Phone, Shield, AlertCircle, Wifi, Mail } from 'lucide-react';
import { useAuth } from '../App.jsx';
import { sendOTP as apiSendOTP, verifyOTP as apiVerifyOTP, register as apiRegister, setPassword as apiSetPassword } from '../api/auth.js';

// ── Helpers ──────────────────────────────────────────────────
const RULES = [
  { id: 'len', label: 'At least 8 characters', test: p => p.length >= 8 },
  { id: 'upper', label: 'One uppercase letter (A-Z)', test: p => /[A-Z]/.test(p) },
  { id: 'num', label: 'One number (0-9)', test: p => /\d/.test(p) },
  { id: 'sym', label: 'One special character (!@#$...)', test: p => /[^A-Za-z0-9]/.test(p) },
];

function StrengthBar({ password }) {
  const passed = RULES.filter(r => r.test(password)).length;
  const colors = ['bg-red-500', 'bg-orange-400', 'bg-yellow-400', 'bg-green-500'];
  const labels = ['Weak', 'Fair', 'Good', 'Strong'];
  return (
    <div className="mt-3">
      <div className="flex gap-1 mb-1">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i < passed ? colors[passed - 1] : 'bg-gray-200 dark:bg-slate-700'}`} />
        ))}
      </div>
      {password && <p className={`text-xs font-semibold mt-1 ${passed >= 3 ? 'text-green-600' : passed >= 2 ? 'text-yellow-600' : 'text-red-500'}`}>{labels[Math.max(passed - 1, 0)]}</p>}
      <ul className="mt-2 space-y-1">
        {RULES.map(r => {
          const ok = r.test(password);
          return (
            <li key={r.id} className={`flex items-center gap-2 text-xs ${ok ? 'text-green-600' : 'text-gray-400'}`}>
              {ok ? <Check size={12} /> : <X size={12} />} {r.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function OtpBoxes({ value, onChange }) {
  const refs = Array.from({ length: 6 }, () => useRef(null));
  const handleKey = (i, e) => { if (e.key === 'Backspace' && !e.target.value && i > 0) refs[i - 1].current?.focus(); };
  const handleChange = (i, v) => {
    const d = v.replace(/\D/, '').slice(-1);
    const arr = value.split('');
    arr[i] = d;
    onChange(arr.join(''));
    if (d && i < 5) refs[i + 1].current?.focus();
  };
  const handlePaste = e => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(pasted.padEnd(6, ' '));
    refs[Math.min(pasted.length, 5)].current?.focus();
    e.preventDefault();
  };
  return (
    <div className="flex gap-2 justify-center" onPaste={handlePaste}>
      {Array.from({ length: 6 }).map((_, i) => (
        <input key={i} ref={refs[i]} id={`otp-box-${i}`}
          type="text" inputMode="numeric" maxLength={1}
          value={value[i] || ''}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKey(i, e)}
          className="w-11 h-12 rounded-xl border-2 text-center text-lg font-bold bg-gray-50 dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none transition-all"
        />
      ))}
    </div>
  );
}

function OtpTimer({ onResend }) {
  const [seconds, setSeconds] = useState(60);
  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);
  return (
    <p className="text-center text-sm text-gray-500 dark:text-slate-400 mt-3">
      {seconds > 0
        ? <>Resend OTP in <span className="font-bold text-blue-600">{seconds}s</span></>
        : <button onClick={() => { onResend(); setSeconds(60); }} id="btn-resend-otp" className="font-bold text-blue-600 hover:underline">Resend OTP</button>
      }
    </p>
  );
}

// ── Error banner with network vs server differentiation ──────
function ErrorBanner({ message }) {
  if (!message) return null;
  const isNetwork = !message.includes('response') && (message.toLowerCase().includes('network') || message.toLowerCase().includes('connect'));
  return (
    <div id="signup-error-banner" role="alert" className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
      {isNetwork
        ? <Wifi size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
        : <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />}
      <p className="text-sm text-red-700 dark:text-red-400 font-medium">{message}</p>
    </div>
  );
}

function extractError(err) {
  if (!err.response) return 'Cannot connect to server. Please check your internet connection.';
  return err.response.data?.message || 'Something went wrong. Please try again.';
}

// ── Spinner button helper ────────────────────────────────────
function SpinBtn({ id, onClick, disabled, label, loadingLabel, className }) {
  return (
    <button id={id} onClick={onClick} disabled={disabled}
      className={`${className} flex items-center justify-center gap-2 disabled:opacity-60`}>
      {disabled
        ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />{loadingLabel}</>
        : label}
    </button>
  );
}

// ── Illustration panel ───────────────────────────────────────
function IllustrationPanel({ step }) {
  const steps = [
    { emoji: '🔍', title: 'Find Your Connection', desc: 'Enter your 12-digit MSEDCL Consumer ID to locate your electricity account.' },
    { emoji: '📧', title: 'Verify Your Email', desc: 'We\'ve sent a 6-digit OTP to your registered email address for security.' },
    { emoji: '✅', title: 'Almost There!', desc: 'Set a strong password to secure your Voltify account.' },
  ];
  const s = steps[step];
  return (
    <div className="hidden lg:flex flex-col items-center justify-center bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 p-12 text-white relative overflow-hidden">
      <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-white/5" />
      <div className="absolute -bottom-10 -right-10 w-48 h-48 rounded-full bg-white/5" />
      <div className="mb-12 flex items-center gap-2.5">
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
          <Zap size={22} className="fill-white text-white" />
        </div>
        <span className="text-2xl font-black tracking-tight">Voltify</span>
      </div>
      <div className="text-7xl mb-6">{s.emoji}</div>
      <h2 className="text-2xl font-extrabold mb-3 text-center">{s.title}</h2>
      <p className="text-blue-100 text-center text-sm leading-relaxed max-w-xs">{s.desc}</p>
      <div className="flex gap-2 mt-10">
        {[0, 1, 2].map(i => (
          <div key={i} className={`rounded-full transition-all ${i === step ? 'w-6 h-2 bg-white' : 'w-2 h-2 bg-white/40'}`} />
        ))}
      </div>
    </div>
  );
}

const inputCls = "w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all";

// ════════════════════════════════════════════════════════════
export default function SignupPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuth();

  const [step, setStep] = useState(0);
  const [consumerId, setConsumerId] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [city, setCity] = useState('');
  const [tempAuth, setTempAuth] = useState(null);

  // ════════════════════════════════════════════════════════════
  //  STEP 0 — Locate Connection → Register + Send OTP
  // ════════════════════════════════════════════════════════════
  const handleStep0 = async (e) => {
    e?.preventDefault();
    setError('');
    if (!/^\d{12}$/.test(consumerId)) return setError('Consumer ID must be exactly 12 digits.');
    if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) return setError('Please enter a valid email address.');

    setLoading(true);
    try {
      // 1. Register the user (creates account, returns token)
      await apiRegister({
        fullName: fullName.trim(),    // Will be confirmed/editable in Step 2
        email,
        consumerId,
        buCode: 'KLNN',            // Default; overrideable in settings
        password: 'TempPass@123',   // Placeholder; replaced in Step 2
      });

      // 2. Send OTP to email
      await apiSendOTP(email);
      setStep(1);
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  };

  // ════════════════════════════════════════════════════════════
  //  STEP 1 — Verify OTP
  // ════════════════════════════════════════════════════════════
  const handleStep1 = async (e) => {
    e?.preventDefault();
    setError('');
    if (otp.replace(/\s/g, '').length < 6) return setError('Please enter the complete 6-digit OTP.');

    setLoading(true);
    try {
      const { data } = await apiVerifyOTP(email, otp.replace(/\s/g, ''));
      // Wait until Step 2 completes before modifying global auth (prevents redirect)
      setTempAuth({ user: data.user, token: data.token });
      setStep(2);
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  };

  // ════════════════════════════════════════════════════════════
  //  STEP 2 — Set final password → complete registration
  // ════════════════════════════════════════════════════════════
  const handleStep2 = async (e) => {
    e?.preventDefault();
    setError('');
    const passed = RULES.filter(r => r.test(password)).length;
    if (passed < 3) return setError('Please create a stronger password (meet at least 3 criteria).');

    setLoading(true);
    try {
      // Update with the real password using the temporary token to complete registration
      const response = await apiSetPassword(password, city, tempAuth.token);
      // Since the backend returns the fully updated user object (with the city), let's use it
      if (response.data.user) {
        setAuth({ ...tempAuth, user: response.data.user });
      } else {
        setAuth(tempAuth);
      }
      navigate('/');
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    try {
      await apiSendOTP(email);
    } catch (err) {
      setError(extractError(err));
    }
  };

  // ════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <IllustrationPanel step={step} />

      {/* ── Right: Form ───────────────────────────── */}
      <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-900 min-h-screen">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center">
              <Zap size={18} className="text-white fill-white" />
            </div>
            <span className="text-xl font-black text-gray-900 dark:text-white">Volt<span className="text-blue-600">ify</span></span>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6">
            {['Locate', 'Verify', 'Confirm'].map((label, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${i < step ? 'bg-blue-600 border-blue-600 text-white'
                  : i === step ? 'border-blue-600 text-blue-600 bg-blue-50 dark:bg-blue-900/30'
                    : 'border-gray-300 dark:border-slate-600 text-gray-400'
                  }`}>{i < step ? <Check size={12} /> : i + 1}</div>
                <span className={`text-xs font-semibold hidden sm:block ${i === step ? 'text-blue-600' : 'text-gray-400 dark:text-slate-500'}`}>{label}</span>
                {i < 2 && <ChevronRight size={14} className="text-gray-300 dark:text-slate-600" />}
              </div>
            ))}
          </div>

          {/* ══ STEP 0: Locate Connection ════════════════ */}
          {step === 0 && (
            <form className="space-y-5 animate-fade-in-up" onSubmit={handleStep0}>
              <div>
                <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-1">Create Account</h1>
                <p className="text-sm text-gray-500 dark:text-slate-400">Enter your MSEDCL details to get started</p>
              </div>
              <div>                                              {/* ← same indent as the div below */}
                <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                  Full Name
                </label>
                <input
                  id="input-fullname"
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className={inputCls}
                />
              </div>


              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wide mb-1.5">12-Digit Consumer ID</label>
                <input id="input-consumer-id" type="text" inputMode="numeric" maxLength={12}
                  placeholder="e.g. 210000001234"
                  value={consumerId} onChange={e => setConsumerId(e.target.value.replace(/\D/g, ''))}
                  className={inputCls} />
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Found on your MSEDCL electricity bill</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wide mb-1.5">Email Address</label>
                <input id="input-email" type="email"
                  placeholder="you@example.com"
                  value={email} onChange={e => setEmail(e.target.value)}
                  className={inputCls} />
              </div>

              <ErrorBanner message={error} />

              <SpinBtn id="btn-get-otp" onClick={handleStep0} disabled={loading}
                label={<><Mail size={16} /> Get OTP</>}
                loadingLabel="Sending OTP..."
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-lg transition-all" />

              <p className="text-center text-sm text-gray-500 dark:text-slate-400">
                Already have an account?{' '}
                <Link to="/login" id="link-go-login" className="text-blue-600 font-semibold hover:underline">Log in</Link>
              </p>
            </form>
          )}

          {/* ══ STEP 1: OTP Verification ════════════════ */}
          {step === 1 && (
            <form className="space-y-5 animate-fade-in-up" onSubmit={handleStep1}>
              <div>
                <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-1">Verify OTP</h1>
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  Enter the 6-digit code sent to <span className="font-bold text-gray-800 dark:text-white">{email}</span>
                </p>
              </div>

              <OtpBoxes value={otp} onChange={setOtp} />
              <OtpTimer onResend={handleResendOtp} />

              <ErrorBanner message={error} />

              <SpinBtn id="btn-verify-otp" onClick={handleStep1} disabled={loading}
                label={<><Shield size={16} /> Verify & Continue</>}
                loadingLabel="Verifying..."
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-lg transition-all" />

              <button type="button" id="btn-back-to-step0" onClick={() => { setStep(0); setError(''); setOtp(''); }}
                className="w-full text-center text-sm text-gray-500 dark:text-slate-400 hover:underline">
                ← Back
              </button>
            </form>
          )}

          {/* ══ STEP 2: Confirm Details + Set Password ══ */}
          {step === 2 && (
            <form className="space-y-4 animate-fade-in-up" onSubmit={handleStep2}>
              <div>
                <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-1">Confirm Details</h1>
                <p className="text-sm text-gray-500 dark:text-slate-400">Pre-filled from your MSEDCL account</p>
              </div>

              {[
                { label: 'Full Name', val: fullName, id: 'prefill-name' },
                { label: 'Email', val: email, id: 'prefill-email' },
                { label: 'Consumer ID', val: consumerId, id: 'prefill-cid' },
              ].map(f => (
                <div key={f.id}>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1">{f.label}</label>
                  <input id={f.id} defaultValue={f.val} readOnly className={`${inputCls} opacity-70 cursor-not-allowed`} />
                </div>
              ))}

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">City / Location</label>
                <input id="input-city" type="text"
                  placeholder="e.g. Kalyan"
                  value={city} onChange={e => setCity(e.target.value)}
                  className={inputCls} />
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">We use this to show you community energy averages.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1">Create Password</label>
                <div className="relative">
                  <input id="input-password" type={showPw ? 'text' : 'password'}
                    placeholder="Create a strong password"
                    value={password} onChange={e => setPassword(e.target.value)}
                    className={`${inputCls} pr-10`} />
                  <button id="btn-toggle-pw" type="button" onClick={() => setShowPw(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <StrengthBar password={password} />
              </div>

              <ErrorBanner message={error} />

              <SpinBtn id="btn-create-account" onClick={handleStep2} disabled={loading}
                label={<><Check size={16} /> Create My Account ⚡</>}
                loadingLabel="Creating Account..."
                className="w-full py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold text-sm shadow-lg transition-all" />
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
