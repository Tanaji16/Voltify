import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Zap, Eye, EyeOff, Check, CheckCircle, X, AlertCircle, Wifi, Mail } from 'lucide-react';
import { useAuth } from '../App.jsx';
import { login as apiLogin, sendOTP as apiSendOTP, verifyOTP as apiVerifyOTP } from '../api/auth.js';

// ── Password Strength Helpers ────────────────────────────────
const RULES = [
  { id: 'len', label: 'At least 8 characters', test: p => p.length >= 8 },
  { id: 'upper', label: 'One uppercase letter', test: p => /[A-Z]/.test(p) },
  { id: 'num', label: 'One number', test: p => /\d/.test(p) },
  { id: 'sym', label: 'One special character', test: p => /[^A-Za-z0-9]/.test(p) },
];

function StrengthBar({ password }) {
  const passed = RULES.filter(r => r.test(password)).length;
  const colors = ['bg-red-500', 'bg-orange-400', 'bg-yellow-400', 'bg-green-500'];
  return (
    <div className="mt-3 space-y-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i < passed ? colors[passed - 1] : 'bg-gray-200 dark:bg-slate-700'}`} />
        ))}
      </div>
      <ul className="space-y-1">
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

// ── 6-box OTP input ─────────────────────────────────────────
function OtpBoxes({ value, onChange }) {
  const refs = Array.from({ length: 6 }, () => useRef(null));
  const handleKey = (i, e) => {
    if (e.key === 'Backspace' && !e.target.value && i > 0) refs[i - 1].current?.focus();
  };
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
        <input key={i} ref={refs[i]} id={`login-otp-box-${i}`}
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
    <p className="text-center text-sm text-gray-500 dark:text-slate-400 mt-2">
      {seconds > 0
        ? <>Resend in <span className="font-bold text-blue-600">{seconds}s</span></>
        : <button onClick={() => { onResend(); setSeconds(60); }} id="btn-fp-resend" className="font-bold text-blue-600 hover:underline">Resend OTP</button>
      }
    </p>
  );
}

// ── Reusable Error Banner ────────────────────────────────────
function ErrorBanner({ message }) {
  if (!message) return null;
  const isNetwork = message.toLowerCase().includes('network') || message.toLowerCase().includes('connect');
  return (
    <div id="error-banner" role="alert" className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
      {isNetwork
        ? <Wifi size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
        : <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />}
      <p className="text-sm text-red-700 dark:text-red-400 font-medium">{message}</p>
    </div>
  );
}

// ── Human-readable error extractor ──────────────────────────
function extractError(err) {
  if (!err.response) return 'Cannot connect to server. Please check your internet connection.';
  return err.response.data?.message || 'Something went wrong. Please try again.';
}

// ── Input class ──────────────────────────────────────────────
const inputCls = "w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all";

// ════════════════════════════════════════════════════════════
export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuth();

  // ── Login form ─────────────────────────────────────────────
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // ── Forgot-password modal state ───────────────────────────
  const [fpModal, setFpModal] = useState(null);  // null | 'otp-send' | 'otp-verify' | 'new-password' | 'done'
  const [fpEmail, setFpEmail] = useState('');
  const [fpOtp, setFpOtp] = useState('');
  const [fpPw, setFpPw] = useState('');
  const [fpShowPw, setFpShowPw] = useState(false);
  const [fpError, setFpError] = useState('');
  const [fpLoading, setFpLoading] = useState(false);

  // ════════════════════════════════════════════════════════════
  //  LOGIN
  // ════════════════════════════════════════════════════════════
  const handleLoginSubmit = async (e) => {
    e?.preventDefault();
    setError('');
    if (!email) return setError('Please enter your email address.');
    if (!password) return setError('Please enter your password.');
    if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) return setError('Please enter a valid email address.');

    setLoading(true);
    try {
      const { data } = await apiLogin(email, password);
      setAuth({ user: { ...data.user, name: data.user.fullName, email }, token: data.token });
      navigate('/');
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  };

  // ════════════════════════════════════════════════════════════
  //  FORGOT PASSWORD — Step A: Send OTP
  // ════════════════════════════════════════════════════════════
  const handleFpSendOtp = async () => {
    setFpError('');
    if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(fpEmail)) return setFpError('Enter a valid email address.');
    setFpLoading(true);
    try {
      await apiSendOTP(fpEmail);
      setFpModal('otp-verify');
    } catch (err) {
      setFpError(extractError(err));
    } finally {
      setFpLoading(false);
    }
  };

  // ════════════════════════════════════════════════════════════
  //  FORGOT PASSWORD — Step B: Verify OTP
  // ════════════════════════════════════════════════════════════
  const handleFpVerifyOtp = async () => {
    setFpError('');
    if (fpOtp.replace(/\s/g, '').length < 6) return setFpError('Please enter the complete 6-digit OTP.');
    setFpLoading(true);
    try {
      await apiVerifyOTP(fpEmail, fpOtp.replace(/\s/g, ''));
      setFpModal('new-password');
    } catch (err) {
      setFpError(extractError(err));
    } finally {
      setFpLoading(false);
    }
  };

  // ════════════════════════════════════════════════════════════
  //  FORGOT PASSWORD — Step C: Save new password (mocked)
  // ════════════════════════════════════════════════════════════
  const handleFpSavePw = () => {
    const passed = RULES.filter(r => r.test(fpPw)).length;
    if (passed < 3) return setFpError('Please create a stronger password.');
    // TODO: wire to a real /api/auth/reset-password endpoint when ready
    setFpModal('done');
  };

  // ════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen grid lg:grid-cols-2">

      {/* ── Left: Branding ────────────────────────────── */}
      <div className="hidden lg:flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-12 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 25% 25%, #3B82F6 0%, transparent 50%), radial-gradient(circle at 75% 75%, #7C3AED 0%, transparent 50%)' }} />
        <div className="relative z-10 text-center">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center border border-white/20">
              <Zap size={28} className="fill-white text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-black mb-4">Welcome back to<br /><span className="text-blue-300">Voltify ⚡</span></h1>
          <p className="text-blue-200 text-base leading-relaxed max-w-sm mx-auto">
            Your smart electricity companion. Monitor, predict, and save on your Mahavitaran bill every month.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-4 text-center">
            {[
              { num: '₹800', label: 'Avg. Savings/yr' },
              { num: '15K+', label: 'Happy Users' },
              { num: '4.8★', label: 'App Rating' },
            ].map((s, i) => (
              <div key={i} className="bg-white/10 rounded-xl p-3 border border-white/10">
                <p className="text-xl font-black">{s.num}</p>
                <p className="text-xs text-blue-200 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right: Form ───────────────────────────────── */}
      <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-900 min-h-screen">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center">
              <Zap size={18} className="text-white fill-white" />
            </div>
            <span className="text-xl font-black text-gray-900 dark:text-white">Volt<span className="text-blue-600">ify</span></span>
          </div>

          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-1">Log In</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-7">Welcome back! Enter your credentials below.</p>

          <form className="space-y-4" onSubmit={handleLoginSubmit}>
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wide mb-1.5">Email Address</label>
              <input id="login-email" type="email" placeholder="you@example.com"
                value={email} onChange={e => setEmail(e.target.value)} className={inputCls} />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wide mb-1.5">Password</label>
              <div className="relative">
                <input id="login-password" type={showPw ? 'text' : 'password'} placeholder="Enter your password"
                  value={password} onChange={e => setPassword(e.target.value)} className={`${inputCls} pr-10`} />
                <button id="btn-toggle-login-pw" type="button" onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button id="btn-forgot-password" type="button" onClick={() => { setFpError(''); setFpModal('otp-send'); }}
                className="text-xs font-semibold text-blue-600 hover:underline">
                Forgot Password?
              </button>
            </div>

            <ErrorBanner message={error} />

            <button id="btn-login" type="submit" disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-lg disabled:opacity-60 flex items-center justify-center gap-2 transition-all">
              {loading
                ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Logging in...</>
                : 'Log In ⚡'
              }
            </button>

            <p className="text-center text-sm text-gray-500 dark:text-slate-400">
              Don't have an account?{' '}
              <Link to="/signup" id="link-go-signup" className="text-blue-600 font-semibold hover:underline">Sign up</Link>
            </p>
          </form>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          FORGOT PASSWORD MODAL
          Steps: otp-send → otp-verify → new-password → done
      ════════════════════════════════════════════════════════ */}
      {fpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl shadow-2xl animate-fade-in-up overflow-hidden" id="forgot-password-modal">
            <div className="h-1.5 bg-gradient-to-r from-blue-600 to-indigo-500" />
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  {fpModal === 'otp-send' && 'Reset Password'}
                  {fpModal === 'otp-verify' && 'Enter OTP'}
                  {fpModal === 'new-password' && 'Set New Password'}
                  {fpModal === 'done' && 'Password Updated!'}
                </h2>
                <button id="btn-close-fp-modal" onClick={() => setFpModal(null)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500">
                  <X size={18} />
                </button>
              </div>

              {/* ── A: Send OTP ────────────────────────── */}
              {fpModal === 'otp-send' && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500 dark:text-slate-400">Enter your registered email to receive an OTP.</p>
                  <input id="fp-email" type="email" placeholder="you@example.com"
                    value={fpEmail} onChange={e => setFpEmail(e.target.value)} className={inputCls} />
                  <ErrorBanner message={fpError} />
                  <button id="btn-fp-send-otp" onClick={handleFpSendOtp} disabled={fpLoading}
                    className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm disabled:opacity-60 flex items-center justify-center gap-2">
                    {fpLoading
                      ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Sending...</>
                      : <><Mail size={15} /> Send OTP</>}
                  </button>
                </div>
              )}

              {/* ── B: Verify OTP ──────────────────────── */}
              {fpModal === 'otp-verify' && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500 dark:text-slate-400">OTP sent to <span className="font-bold text-gray-800 dark:text-white">{fpEmail}</span></p>
                  <OtpBoxes value={fpOtp} onChange={setFpOtp} />
                  <OtpTimer onResend={handleFpSendOtp} />
                  <ErrorBanner message={fpError} />
                  <button id="btn-fp-verify-otp" onClick={handleFpVerifyOtp} disabled={fpLoading}
                    className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm disabled:opacity-60 flex items-center justify-center gap-2">
                    {fpLoading
                      ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Verifying...</>
                      : 'Verify OTP'}
                  </button>
                </div>
              )}

              {/* ── C: New Password ─────────────────────── */}
              {fpModal === 'new-password' && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500 dark:text-slate-400">Create a new strong password.</p>
                  <div className="relative">
                    <input id="fp-new-password" type={fpShowPw ? 'text' : 'password'} placeholder="New password"
                      value={fpPw} onChange={e => setFpPw(e.target.value)} className={`${inputCls} pr-10`} />
                    <button type="button" onClick={() => setFpShowPw(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {fpShowPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <StrengthBar password={fpPw} />
                  <ErrorBanner message={fpError} />
                  <button id="btn-fp-save-password" onClick={handleFpSavePw}
                    className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-sm">
                    Save New Password
                  </button>
                </div>
              )}

              {/* ── D: Done ─────────────────────────────── */}
              {fpModal === 'done' && (
                <div className="text-center py-4 space-y-4 animate-fade-in-up">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle size={36} className="text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-gray-900 dark:text-white mb-1">Password Updated!</h3>
                    <p className="text-sm text-gray-500 dark:text-slate-400">Your password has been reset successfully.</p>
                  </div>
                  <button id="btn-fp-go-login" onClick={() => setFpModal(null)}
                    className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm">
                    Go to Login ⚡
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
