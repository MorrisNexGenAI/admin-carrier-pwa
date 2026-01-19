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