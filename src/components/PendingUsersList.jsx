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

