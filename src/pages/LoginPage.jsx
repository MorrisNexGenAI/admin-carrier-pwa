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
