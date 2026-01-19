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
