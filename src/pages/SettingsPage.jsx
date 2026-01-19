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