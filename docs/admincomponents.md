// ==================== src/components/LoginForm.jsx ====================
import { useState } from 'react';

export default function LoginForm({ onSubmit, loading, error }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(username, password);
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
          Username
        </label>
        <input
          type="text"
          className="input"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={loading}
          required
        />
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
          Password
        </label>
        <input
          type="password"
          className="input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          required
        />
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      <button 
        type="submit" 
        className="btn btn-primary" 
        style={{ width: '100%' }}
        disabled={loading}
      >
        {loading ? 'Logging in...' : 'Login to Django'}
      </button>
    </form>
  );
}


// ==================== src/components/SyncStatus.jsx ====================
import { useState, useEffect } from 'react';
import { getAllContent } from '../services/storage';

export default function SyncStatus() {
  const [syncInfo, setSyncInfo] = useState(null);

  useEffect(() => {
    loadSyncInfo();
  }, []);

  const loadSyncInfo = async () => {
    const content = await getAllContent();
    setSyncInfo(content.sync_info);
  };

  if (!syncInfo) {
    return (
      <div className="card">
        <p style={{ color: '#6b7280' }}>No content downloaded yet</p>
      </div>
    );
  }

  const lastSyncDate = new Date(syncInfo.timestamp * 1000);
  const now = Date.now();
  const hoursSinceSync = Math.floor((now - (syncInfo.timestamp * 1000)) / (1000 * 60 * 60));

  return (
    <div className="card">
      <h3 style={{ marginBottom: '1rem', color: '#111827' }}>Last Sync</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
            Date & Time
          </p>
          <p style={{ fontWeight: '600', color: '#111827' }}>
            {lastSyncDate.toLocaleString()}
          </p>
        </div>
        <div>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
            Time Ago
          </p>
          <p style={{ fontWeight: '600', color: '#111827' }}>
            {hoursSinceSync < 1 ? 'Less than 1 hour ago' : `${hoursSinceSync} hours ago`}
          </p>
        </div>
        <div>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
            Topics
          </p>
          <p style={{ fontWeight: '600', color: '#f59e0b' }}>
            {syncInfo.total_topics}
          </p>
        </div>
        <div>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
            Users
          </p>
          <p style={{ fontWeight: '600', color: '#f59e0b' }}>
            {syncInfo.total_users}
          </p>
        </div>
      </div>
    </div>
  );
}


// ==================== src/components/PendingUsersList.jsx ====================
import { useState, useEffect } from 'react';
import { getPendingUsers } from '../services/storage';

export default function PendingUsersList({ onRefresh }) {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    loadUsers();
  }, [onRefresh]);

  const loadUsers = async () => {
    const pendingUsers = await getPendingUsers();
    setUsers(pendingUsers);
  };

  if (users.length === 0) {
    return (
      <div className="card">
        <p style={{ color: '#6b7280' }}>No pending user registrations</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 style={{ marginBottom: '1rem', color: '#111827' }}>
        Pending Users ({users.length})
      </h3>
      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
        {users.map((user, index) => (
          <div
            key={user.id}
            style={{
              padding: '0.75rem',
              borderBottom: index < users.length - 1 ? '1px solid #e5e7eb' : 'none',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <p style={{ fontWeight: '600', color: '#111827' }}>{user.name}</p>
              <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                Code: {user.code}
              </p>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
              {new Date(user.created_at).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


// ==================== src/components/ContentStats.jsx ====================
import { useState, useEffect } from 'react';
import { getAllContent } from '../services/storage';

export default function ContentStats() {
  const [stats, setStats] = useState({
    departments: 0,
    courses: 0,
    topics: 0,
    users: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const content = await getAllContent();
    setStats({
      departments: content.departments?.length || 0,
      courses: content.courses?.length || 0,
      topics: content.topics?.length || 0,
      users: content.premium_users?.length || 0,
    });
  };

  const StatCard = ({ label, value, color }) => (
    <div
      style={{
        padding: '1rem',
        background: 'white',
        borderRadius: '8px',
        textAlign: 'center',
        border: `2px solid ${color}`,
      }}
    >
      <p style={{ fontSize: '2rem', fontWeight: '700', color, marginBottom: '0.25rem' }}>
        {value}
      </p>
      <p style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: '500' }}>
        {label}
      </p>
    </div>
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
      <StatCard label="Departments" value={stats.departments} color="#3b82f6" />
      <StatCard label="Courses" value={stats.courses} color="#8b5cf6" />
      <StatCard label="Topics" value={stats.topics} color="#f59e0b" />
      <StatCard label="Users" value={stats.users} color="#10b981" />
    </div>
  );
}


// ==================== src/components/SettingsPanel.jsx ====================
import { useState, useEffect } from 'react';
import { getSetting, saveSetting } from '../services/storage';

export default function SettingsPanel() {
  const [autoDelete, setAutoDelete] = useState(false);
  const [deleteAfterDays, setDeleteAfterDays] = useState(7);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const autoDeleteSetting = await getSetting('auto_delete');
    const daysSetting = await getSetting('delete_after_days');
    
    setAutoDelete(autoDeleteSetting || false);
    setDeleteAfterDays(daysSetting || 7);
  };

  const handleSave = async () => {
    setSaving(true);
    await saveSetting('auto_delete', autoDelete);
    await saveSetting('delete_after_days', deleteAfterDays);
    setTimeout(() => setSaving(false), 500);
  };

  return (
    <div className="card">
      <h3 style={{ marginBottom: '1.5rem', color: '#111827' }}>Settings</h3>

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={autoDelete}
            onChange={(e) => setAutoDelete(e.target.checked)}
            style={{ marginRight: '0.5rem' }}
          />
          <span style={{ fontWeight: '600', color: '#111827' }}>
            Auto-delete synced users
          </span>
        </label>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem', marginLeft: '1.5rem' }}>
          Automatically remove user registrations after they've been uploaded to Django
        </p>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#111827' }}>
          Delete synced users after (days)
        </label>
        <input
          type="number"
          className="input"
          value={deleteAfterDays}
          onChange={(e) => setDeleteAfterDays(parseInt(e.target.value))}
          min="1"
          max="30"
          disabled={!autoDelete}
          style={{ maxWidth: '200px' }}
        />
      </div>

      <button
        className="btn btn-primary"
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? 'Saving...' : 'Save Settings'}
      </button>
    </div>
  );
}