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
export const AuthContext = createContext({ user: null, token: null, setAuth: () => {}, logout: () => {} });
export const useAuth     = () => useContext(AuthContext);

// ── Helpers: persist auth to localStorage ───────────────────
const STORAGE_TOKEN_KEY = 'voltify_token';
const STORAGE_USER_KEY  = 'voltify_user';

function loadStoredAuth() {
  try {
    const token = localStorage.getItem(STORAGE_TOKEN_KEY);
    const user  = JSON.parse(localStorage.getItem(STORAGE_USER_KEY) || 'null');
    return { token, user };
  } catch {
    return { token: null, user: null };
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
    }
  };

  const logout = () => {
    // Clear every Voltify key to prevent stale data leaking to the next session
    localStorage.removeItem(STORAGE_TOKEN_KEY);
    localStorage.removeItem(STORAGE_USER_KEY);
    localStorage.removeItem('voltify_transactions');
    localStorage.removeItem('voltify_appliances');
    localStorage.removeItem('voltify_bill_result');
    localStorage.removeItem('voltify_budget_target');
    setUser(null);
    setToken(null);
  };

  const toggleDark = () => {
    setDark(d => !d);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <ThemeContext.Provider value={{ dark, toggleDark }}>
      <AuthContext.Provider value={{ user, token, setAuth, logout }}>
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
