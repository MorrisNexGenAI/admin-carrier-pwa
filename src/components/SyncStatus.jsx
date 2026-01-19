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

