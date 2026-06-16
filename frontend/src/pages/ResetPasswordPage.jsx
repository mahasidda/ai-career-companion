// ============================================================
// pages/ResetPasswordPage.jsx
// ============================================================

import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../utils/api';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token    = searchParams.get('token') || '';
  const [pw, setPw]       = useState('');
  const [pw2, setPw2]     = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (pw !== pw2)  { toast.error('Passwords do not match'); return; }
    if (pw.length < 6) { toast.error('Min 6 characters'); return; }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password: pw });
      setDone(true);
      toast.success('Password reset successfully!');
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
          <p style={{ color:'var(--text-muted)', fontSize:14 }}>Enter your new password below</p>
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
              <label className="form-label">Confirm New Password</label>
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
