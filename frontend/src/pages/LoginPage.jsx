import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', form);
      login(res.data.token, res.data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', background: 'var(--color-primary)', borderRadius: '16px', marginBottom: '16px' }}>
            <Zap size={28} color="white" />
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: 'var(--color-text-primary)' }}>Welcome to FlowIQ</h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '8px' }}>Intelligent workflow management</p>
        </div>

        <div className="card">
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '24px' }}>Sign in to your account</h2>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Email address</label>
              <input type="email" className="form-input" placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPassword ? 'text' : 'password'} className="form-input" placeholder="Enter your password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required style={{ paddingRight: '44px' }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)', padding: '2px' }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '11px' }} disabled={loading}>
              {loading ? <span className="spinner" style={{ width: '16px', height: '16px' }} /> : 'Sign in'}
            </button>
          </form>
          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
            Don&apos;t have an account?{' '}
            <Link to="/register" style={{ color: 'var(--color-primary)', fontWeight: '500' }}>Create account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
