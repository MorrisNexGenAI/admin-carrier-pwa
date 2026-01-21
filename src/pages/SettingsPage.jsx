// ==================== src/pages/SettingsPage.jsx ====================
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { logoutAdmin } from '../services/auth';
import { resetDatabase } from '../services/storage';
import { emergencyCleanup } from '../services/dbCleanup';

export default function SettingsPage() {
  const navigate = useNavigate();
  const [resetting, setResetting] = useState(false);

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
      await logoutAdmin();
      navigate('/login');
    }
  };

  const handleResetDatabase = async () => {
    if (!confirm('⚠️ This will delete ALL local data (content, users, settings). Continue?')) {
      return;
    }

    if (!confirm('⚠️ FINAL WARNING: This cannot be undone. Are you absolutely sure?')) {
      return;
    }

    setResetting(true);

    try {
      await resetDatabase();
      alert('✅ Database reset successfully. You will be logged out.');
      await logoutAdmin();
      navigate('/login');
    } catch (error) {
      console.error('Reset failed:', error);
      alert('❌ Reset failed. Try the Emergency Cleanup option.');
    } finally {
      setResetting(false);
    }
  };

  const handleEmergencyCleanup = async () => {
    if (!confirm('🚨 EMERGENCY CLEANUP\n\nThis will:\n- Delete all databases\n- Clear all storage\n- Force logout\n- Reload the page\n\nContinue?')) {
      return;
    }

    try {
      await emergencyCleanup();
      // Page will reload automatically
    } catch (error) {
      console.error('Emergency cleanup failed:', error);
      alert('Emergency cleanup initiated. The page will reload.');
      window.location.reload();
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      {/* Header */}
      <div style={{ 
        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        padding: '1.5rem',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'white', marginBottom: '0.25rem' }}>
                ⚙️ Settings
              </h1>
              <p style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.9)' }}>
                Manage your Admin Carrier configuration
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => navigate('/')}
                className="btn"
                style={{ background: 'rgba(255, 255, 255, 0.2)', color: 'white' }}
              >
                ← Back
              </button>
              <button
                onClick={handleLogout}
                className="btn"
                style={{ background: 'rgba(255, 255, 255, 0.2)', color: 'white' }}
              >
                🚪 Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
        
        {/* Account Section */}
        <div className="card" style={{ marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
            👤 Account
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button
              onClick={handleLogout}
              className="btn"
              style={{ 
                background: '#dc2626', 
                color: 'white',
                justifyContent: 'center',
              }}
            >
              🚪 Logout
            </button>
          </div>
        </div>

        {/* Database Management Section */}
        <div className="card" style={{ marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
            💾 Database Management
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ 
              background: '#fef3c7', 
              padding: '1rem', 
              borderRadius: '8px',
              border: '2px solid #fbbf24',
              marginBottom: '0.5rem',
            }}>
              <p style={{ fontSize: '0.875rem', color: '#92400e', lineHeight: '1.5' }}>
                ⚠️ <strong>Warning:</strong> These actions will delete all locally stored data. 
                Use only if you're experiencing issues.
              </p>
            </div>

            <button
              onClick={handleResetDatabase}
              disabled={resetting}
              className="btn"
              style={{ 
                background: '#ea580c', 
                color: 'white',
                justifyContent: 'center',
              }}
            >
              {resetting ? '🔄 Resetting...' : '🔄 Reset Database'}
            </button>

            <button
              onClick={handleEmergencyCleanup}
              className="btn"
              style={{ 
                background: '#991b1b', 
                color: 'white',
                justifyContent: 'center',
              }}
            >
              🚨 Emergency Cleanup
            </button>
          </div>
        </div>

        {/* App Info Section */}
        <div className="card" style={{ background: '#dbeafe', border: '2px solid #3b82f6' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#1e40af' }}>
            ℹ️ About Admin Carrier
          </h2>
          <div style={{ color: '#1e3a8a', lineHeight: '1.8' }}>
            <p><strong>Version:</strong> 1.0.0</p>
            <p><strong>Purpose:</strong> Offline content distribution for remote areas</p>
            <p style={{ marginTop: '1rem', fontSize: '0.875rem' }}>
              This app allows you to download educational content when you have internet access, 
              then distribute it to students via hotspot when offline.
            </p>
          </div>
        </div>

        {/* Troubleshooting Section */}
        <div className="card" style={{ marginTop: '1rem', background: '#fee2e2', border: '2px solid #ef4444' }}>
          <h3 style={{ color: '#991b1b', marginBottom: '1rem' }}>🔧 Troubleshooting</h3>
          <div style={{ color: '#7f1d1d', fontSize: '0.875rem', lineHeight: '1.6' }}>
            <p><strong>If you see database errors:</strong></p>
            <ol style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
              <li>Try the "Reset Database" button first</li>
              <li>If that doesn't work, use "Emergency Cleanup"</li>
              <li>As a last resort, clear your browser data manually</li>
            </ol>
            <p style={{ marginTop: '1rem' }}>
              <strong>If you keep getting logged out:</strong>
            </p>
            <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
              <li>Make sure cookies are enabled in your browser</li>
              <li>Check that you're not in incognito/private mode</li>
              <li>Sessions expire after 7 days of inactivity</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}