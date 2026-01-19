// ==================== src/pages/LoginPage.jsx ====================
import { useState } from 'react';
import LoginForm from '../components/LoginForm';
import { loginAdmin } from '../services/auth';

export default function LoginPage({ onLogin }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (username, password) => {
    setLoading(true);
    setError('');

    const result = await loginAdmin(username, password);

    if (result.success) {
      onLogin();
    } else {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      padding: '1rem',
    }}>
      <div style={{ 
        background: 'white', 
        borderRadius: '16px', 
        padding: '2rem',
        maxWidth: '500px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
            boxShadow: '0 8px 24px rgba(245, 158, 11, 0.4)',
          }}>
            <span style={{ fontSize: '40px' }}>📱</span>
          </div>
          <h1 style={{ 
            fontSize: '1.875rem', 
            fontWeight: '700', 
            color: '#111827',
            marginBottom: '0.5rem',
          }}>
            Admin Carrier
          </h1>
          <p style={{ color: '#6b7280', fontSize: '1rem' }}>
            Content Distribution Hub
          </p>
        </div>

        {/* Login Form */}
        <LoginForm onSubmit={handleLogin} loading={loading} error={error} />

        {/* Info */}
        <div style={{
          marginTop: '2rem',
          padding: '1rem',
          background: '#fef3c7',
          borderRadius: '8px',
          border: '2px solid #fbbf24',
        }}>
          <p style={{ fontSize: '0.875rem', color: '#92400e', lineHeight: '1.5' }}>
            <strong>ℹ️ Admin Access Required</strong><br />
            Use your Django admin credentials to login and manage offline content distribution.
          </p>
        </div>
      </div>
    </div>
  );
}


// ==================== src/pages/DashboardPage.jsx ====================
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SyncStatus from '../components/SyncStatus';
import PendingUsersList from '../components/PendingUsersList';
import ContentStats from '../components/ContentStats';
import { downloadContentFromDjango } from '../services/downloader';
import { uploadPendingUsers } from '../services/uploader';
import { logoutAdmin } from '../services/auth';
import { getLocalServerURL } from '../services/localServer';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [downloading, setDownloading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleDownload = async () => {
    setDownloading(true);
    setMessage(null);

    const result = await downloadContentFromDjango();

    if (result.success) {
      setMessage({
        type: 'success',
        text: `✅ Downloaded ${result.stats.topics} topics and ${result.stats.users} users`,
      });
      setRefreshKey(prev => prev + 1); // Trigger refresh
    } else {
      setMessage({
        type: 'error',
        text: `❌ ${result.error}`,
      });
    }

    setDownloading(false);
  };

  const handleUpload = async () => {
    setUploading(true);
    setMessage(null);

    const result = await uploadPendingUsers();

    if (result.success) {
      setMessage({
        type: 'success',
        text: `✅ Uploaded ${result.created} users (${result.duplicates} duplicates)`,
      });
      setRefreshKey(prev => prev + 1); // Trigger refresh
    } else {
      setMessage({
        type: 'error',
        text: `❌ ${result.error}`,
      });
    }

    setUploading(false);
  };

  const handleLogout = async () => {
    await logoutAdmin();
    window.location.href = '/login';
  };

  const localServerURL = getLocalServerURL();

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
                📱 Admin Carrier
              </h1>
              <p style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.9)' }}>
                Local Server: {localServerURL}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => navigate('/settings')}
                className="btn"
                style={{ background: 'rgba(255, 255, 255, 0.2)', color: 'white' }}
              >
                ⚙️ Settings
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
        {/* Message Alert */}
        {message && (
          <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
            {message.text}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '1rem',
          marginBottom: '2rem',
        }}>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="btn btn-primary"
            style={{ 
              padding: '1.5rem',
              fontSize: '1.125rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span style={{ fontSize: '2rem' }}>⬇️</span>
            {downloading ? 'Downloading...' : 'Download from Django'}
          </button>

          <button
            onClick={handleUpload}
            disabled={uploading}
            className="btn btn-secondary"
            style={{ 
              padding: '1.5rem',
              fontSize: '1.125rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span style={{ fontSize: '2rem' }}>⬆️</span>
            {uploading ? 'Uploading...' : 'Upload Users to Django'}
          </button>
        </div>

        {/* Content Stats */}
        <ContentStats key={refreshKey} />

        {/* Sync Status */}
        <div style={{ marginTop: '1rem' }}>
          <SyncStatus key={refreshKey} />
        </div>

        {/* Pending Users */}
        <div style={{ marginTop: '1rem' }}>
          <PendingUsersList onRefresh={refreshKey} />
        </div>

        {/* Info Card */}
        <div className="card" style={{ marginTop: '1rem', background: '#dbeafe', border: '2px solid #3b82f6' }}>
          <h3 style={{ color: '#1e40af', marginBottom: '1rem' }}>💡 How to Use</h3>
          <ol style={{ paddingLeft: '1.5rem', color: '#1e3a8a', lineHeight: '1.8' }}>
            <li><strong>Download</strong> content when you have internet (in town, at cafe)</li>
            <li><strong>Enable hotspot</strong> on your phone when with students</li>
            <li><strong>Students connect</strong> to your hotspot and open their app</li>
            <li><strong>They get updates</strong> automatically from your phone (no internet needed)</li>
            <li><strong>Upload</strong> collected user registrations when back online</li>
          </ol>
        </div>
      </div>
    </div>
  );
}


// ==================== src/pages/SettingsPage.jsx ====================
import { useNavigate } from 'react-router-dom';
import SettingsPanel from '../components/SettingsPanel';
import { clearContent, deleteSyncedUsers } from '../services/storage';
import { useState } from 'react';

export default function SettingsPage() {
  const navigate = useNavigate();
  const [clearing, setClearing] = useState(false);

  const handleClearContent = async () => {
    if (!confirm('Are you sure you want to delete all downloaded content?')) {
      return;
    }

    setClearing(true);
    await clearContent();
    alert('✅ All content cleared');
    setClearing(false);
  };

  const handleDeleteSyncedUsers = async () => {
    if (!confirm('Delete all synced user registrations?')) {
      return;
    }

    await deleteSyncedUsers();
    alert('✅ Synced users deleted');
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
            <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'white' }}>
              ⚙️ Settings
            </h1>
            <button
              onClick={() => navigate('/')}
              className="btn"
              style={{ background: 'rgba(255, 255, 255, 0.2)', color: 'white' }}
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
        <SettingsPanel />

        {/* Danger Zone */}
        <div className="card" style={{ marginTop: '2rem', border: '2px solid #ef4444' }}>
          <h3 style={{ color: '#dc2626', marginBottom: '1rem' }}>⚠️ Danger Zone</h3>
          
          <div style={{ marginBottom: '1rem' }}>
            <button
              onClick={handleDeleteSyncedUsers}
              className="btn"
              style={{ background: '#f97316', color: 'white' }}
            >
              Delete Synced Users
            </button>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
              Remove user registrations that have already been uploaded to Django
            </p>
          </div>

          <div>
            <button
              onClick={handleClearContent}
              disabled={clearing}
              className="btn"
              style={{ background: '#ef4444', color: 'white' }}
            >
              {clearing ? 'Clearing...' : 'Clear All Content'}
            </button>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
              Delete all downloaded content from local storage. You'll need to download again.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}