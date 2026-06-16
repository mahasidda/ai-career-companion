import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../utils/api';

export function ForgotPasswordPage() {
  const [email, setEmail]     = useState('');
  const [sent, setSent]       = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) { toast.error('Enter your email'); return; }
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch { toast.error('Something went wrong'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg-secondary)', padding:20 }}>
      <div style={{ width:'100%', maxWidth:400, background:'var(--bg-card)', borderRadius:20, padding:'36px 40px', boxShadow:'var(--shadow-xl)' }}>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ fontSize:48, marginBottom:8 }}>🔑</div>
          <h2 style={{ fontSize:22, fontWeight:700 }}>Forgot Password?</h2>
          <p style={{ color:'var(--text-muted)', fontSize:14, marginTop:4 }}>No worries, we'll send a reset link</p>
        </div>
        {sent ? (
          <div>
            <div className="alert alert-success" style={{ marginBottom:20 }}>✅ Reset link sent! Check your email inbox.</div>
            <Link to="/login" className="btn btn-primary" style={{ width:'100%', justifyContent:'center' }}>Back to Login</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input className="form-input" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading} style={{ width:'100%', justifyContent:'center', height:44 }}>
              {loading ? <><span className="spinner" style={{ width:16,height:16 }} /> Sending...</> : '📧 Send Reset Link'}
            </button>
          </form>
        )}
        <p style={{ textAlign:'center', marginTop:20, fontSize:14 }}>
          <Link to="/login" style={{ color:'var(--accent)' }}>← Back to Login</Link>
        </p>
      </div>
    </div>
  );
}

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token    = searchParams.get('token') || '';
  const [pw, setPw]       = useState('');
  const [pw2, setPw2]     = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (pw !== pw2)    { toast.error('Passwords do not match'); return; }
    if (pw.length < 6) { toast.error('Min 6 characters'); return; }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password: pw });
      setDone(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) { toast.error(err.response?.data?.error || 'Reset failed'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg-secondary)', padding:20 }}>
      <div style={{ width:'100%', maxWidth:400, background:'var(--bg-card)', borderRadius:20, padding:'36px 40px', boxShadow:'var(--shadow-xl)' }}>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ fontSize:48, marginBottom:8 }}>🔐</div>
          <h2 style={{ fontSize:22, fontWeight:700 }}>Set New Password</h2>
        </div>
        {done ? (
          <div className="alert alert-success">✅ Password reset! Redirecting to login...</div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input className="form-input" type="password" placeholder="Min 6 characters" value={pw} onChange={e => setPw(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input className="form-input" type="password" placeholder="Repeat password" value={pw2} onChange={e => setPw2(e.target.value)} />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading} style={{ width:'100%', justifyContent:'center', height:44 }}>
              {loading ? <><span className="spinner" style={{ width:16,height:16 }} /> Resetting...</> : '🔑 Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg-secondary)' }}>
      <div style={{ textAlign:'center', padding:40 }}>
        <div style={{ fontSize:80, marginBottom:16 }}>🤖</div>
        <h1 style={{ fontSize:48, fontWeight:800, color:'var(--accent)', marginBottom:8 }}>404</h1>
        <h2 style={{ fontSize:22, fontWeight:600, marginBottom:8 }}>Page Not Found</h2>
        <p style={{ color:'var(--text-muted)', marginBottom:24 }}>Looks like this page doesn't exist yet.</p>
        <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>🏠 Back to Dashboard</button>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;