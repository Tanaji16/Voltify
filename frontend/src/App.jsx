import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, createContext, useContext, useEffect } from 'react';
import DashboardPage from './pages/DashboardPage.jsx';
import LoginPage     from './pages/LoginPage.jsx';
import SignupPage    from './pages/SignupPage.jsx';
import BillingPage   from './pages/BillingPage.jsx';
import HistoryPage   from './pages/HistoryPage.jsx';

// ── Theme Context ────────────────────────────────────────────
export const ThemeContext = createContext({ dark: false, toggleDark: () => {} });
export const useTheme     = () => useContext(ThemeContext);

// ── Auth Context ─────────────────────────────────────────────
export const AuthContext = createContext({ user: null, token: null, activeMeterId: null, setActiveMeter: () => {}, setAuth: () => {}, logout: () => {} });
export const useAuth     = () => useContext(AuthContext);

const STORAGE_TOKEN_KEY = 'voltify_token';
const STORAGE_USER_KEY  = 'voltify_user';
const STORAGE_METER_KEY = 'voltify_active_meter';

function loadStoredAuth() {
  try {
    const token = localStorage.getItem(STORAGE_TOKEN_KEY);
    const user  = JSON.parse(localStorage.getItem(STORAGE_USER_KEY) || 'null');
    const meter = localStorage.getItem(STORAGE_METER_KEY);
    return { token, user, meter };
  } catch {
    return { token: null, user: null, meter: null };
  }
}

// ── Protected Route ───────────────────────────────────────────
function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

// ── Public Route (redirect if already logged in) ─────────────
function PublicRoute({ children }) {
  const { user } = useAuth();
  return user ? <Navigate to="/" replace /> : children;
}

export default function App() {
  const [dark, setDark] = useState(false);

  // Hydrate from localStorage on first render
  const stored = loadStoredAuth();
  const [user,  setUser]  = useState(stored.user);
  const [token, setToken] = useState(stored.token);
  const [activeMeterId, setActiveMeterId] = useState(stored.meter);

  // Auto-select first meter if none selected
  useEffect(() => {
    if (user && user.meters && user.meters.length > 0 && !activeMeterId) {
      setActiveMeter(user.meters[0]._id);
    }
  }, [user]);

  const setActiveMeter = (id) => {
    setActiveMeterId(id);
    localStorage.setItem(STORAGE_METER_KEY, id);
  };

  // Keep localStorage in sync whenever auth state changes
  const setAuth = ({ user: u, token: t }) => {
    setUser(u);
    setToken(t);
    if (u && t) {
      localStorage.setItem(STORAGE_TOKEN_KEY, t);
      localStorage.setItem(STORAGE_USER_KEY,  JSON.stringify(u));
    } else {
      localStorage.removeItem(STORAGE_TOKEN_KEY);
      localStorage.removeItem(STORAGE_USER_KEY);
      localStorage.removeItem(STORAGE_METER_KEY);
    }
  };

  const logout = () => {
    // Clear every Voltify key to prevent stale data leaking to the next session
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('voltify_')) {
        localStorage.removeItem(key);
      }
    });
    setUser(null);
    setToken(null);
    setActiveMeterId(null);
  };

  const toggleDark = () => {
    setDark(d => !d);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <ThemeContext.Provider value={{ dark, toggleDark }}>
      <AuthContext.Provider value={{ user, token, activeMeterId, setActiveMeter, setAuth, logout }}>
        <BrowserRouter>
          <Routes>
            {/* Public-only routes */}
            <Route path="/login"  element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />

            {/* Protected route */}
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <DashboardPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/billing"
              element={
                <PrivateRoute>
                  <BillingPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/history"
              element={
                <PrivateRoute>
                  <HistoryPage />
                </PrivateRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthContext.Provider>
    </ThemeContext.Provider>
  );
}
