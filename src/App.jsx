// ==================== src/App.jsx ====================
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import SettingsPage from './pages/SettingsPage';
import { getAuthSession, verifySession } from './services/auth';
import { initAutoCleanup } from './services/dbCleanup';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      console.log('[App] Initializing...');

      // Start auto cleanup (non-blocking)
      initAutoCleanup();

      // Try to restore session with timeout
      const session = await promiseWithTimeout(getAuthSession(), 5000, 'getAuthSession timed out');
      console.log('[App] getAuthSession result:', session);

      if (session) {
        console.log('[App] Session found, verifying with backend...');
        const isValid = await promiseWithTimeout(verifySession(), 5000, 'verifySession timed out');
        console.log('[App] verifySession result:', isValid);

        if (isValid) {
          setUser(session);
          setIsAuthenticated(true);
          console.log('[App] Session restored for:', session.username);
        } else {
          console.log('[App] Session invalid or expired');
          setUser(null);
          setIsAuthenticated(false);
        }
      } else {
        console.log('[App] No session to restore');
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('[App] Initialization error:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  // Utility: wraps a promise with a timeout
  const promiseWithTimeout = (promise, ms, errorMsg) => {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(errorMsg)), ms);
      promise
        .then((res) => {
          clearTimeout(timer);
          resolve(res);
        })
        .catch((err) => {
          clearTimeout(timer);
          reject(err);
        });
    });
  };

  const handleLoginSuccess = async () => {
    try {
      const session = await promiseWithTimeout(getAuthSession(), 5000, 'getAuthSession timed out on login');
      if (session) {
        setUser(session);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('[App] Login session error:', error);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setIsAuthenticated(false);
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '1rem',
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '4px solid #f59e0b',
          borderTopColor: 'transparent',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}></div>
        <div style={{
          fontSize: '18px',
          color: '#f59e0b',
          fontWeight: '500',
        }}>
          Loading Admin Carrier...
        </div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/login" 
          element={
            isAuthenticated 
              ? <Navigate to="/" replace /> 
              : <LoginPage onLogin={handleLoginSuccess} />
          } 
        />
        <Route 
          path="/" 
          element={
            isAuthenticated 
              ? <DashboardPage user={user} onLogout={handleLogout} /> 
              : <Navigate to="/login" replace />
          } 
        />
        <Route 
          path="/settings" 
          element={
            isAuthenticated 
              ? <SettingsPage user={user} onLogout={handleLogout} /> 
              : <Navigate to="/login" replace />
          } 
        /> 
      </Routes>
    </BrowserRouter>
  );
}

export default App;
