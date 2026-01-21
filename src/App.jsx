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

      // Initialize auto cleanup listeners
      initAutoCleanup();

      // Try to restore session from IndexedDB
      const session = await getAuthSession();

      if (session) {
        console.log('[App] Session found, verifying with backend...');
        
        // Verify session is still valid with backend
        const isValid = await verifySession();

        if (isValid) {
          setUser(session);
          setIsAuthenticated(true);
          console.log('[App] Session restored successfully for:', session.username);
        } else {
          console.log('[App] Session expired or invalid');
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

  const handleLoginSuccess = async () => {
    // Re-check auth after login
    const session = await getAuthSession();
    if (session) {
      setUser(session);
      setIsAuthenticated(true);
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