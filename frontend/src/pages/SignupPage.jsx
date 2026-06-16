// ============================================================
// pages/SignupPage.jsx
// ============================================================

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const BRANCHES = ['Computer Science','Information Technology','Electronics','Mechanical','Civil','Electrical','Chemical','Other'];

export default function SignupPage() {
  const { signup }  = useAuth();
  const navigate    = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: '', email: '', password: '', confirm_password: '',
    branch: '', college: '', graduation_year: ''
  });

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.full_name || !form.email || !form.password) { toast.error('Fill required fields'); return; }
    if (form.password !== form.confirm_password) { toast.error('Passwords do not match'); return; }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }

    setLoading(true);
    try {
      const { confirm_password, ...submitData } = form;
      await signup(submitData);
      toast.success('Account created! Welcome aboard 🎉');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 500, background: 'var(--bg-card)', borderRadius: 20, padding: '36px 40px', boxShadow: 'var(--shadow-xl)' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🎓</div>
          <h2 style={{ fontSize: 24, fontWeight: 700 }}>Create your account</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Start your AI career journey today</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid-2 md-2" style={{ gap: 14 }}>
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label">Full Name *</label>
              <input className="form-input" name="full_name" placeholder="Arjun Sharma" value={form.full_name} onChange={handleChange} />
            </div>
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label">Email *</label>
              <input className="form-input" type="email" name="email" placeholder="arjun@example.com" value={form.email} onChange={handleChange} />
            </div>
          </div>

          <div className="grid-2 md-2" style={{ gap: 14 }}>
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label">Password *</label>
              <input className="form-input" type="password" name="password" placeholder="Min 6 chars" value={form.password} onChange={handleChange} />
            </div>
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label">Confirm Password *</label>
              <input className="form-input" type="password" name="confirm_password" placeholder="Repeat password" value={form.confirm_password} onChange={handleChange} />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 14 }}>
            <label className="form-label">College / University</label>
            <input className="form-input" name="college" placeholder="e.g. JNTU Hyderabad" value={form.college} onChange={handleChange} />
          </div>

          <div className="grid-2 md-2" style={{ gap: 14 }}>
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label">Branch</label>
              <select className="form-select" name="branch" value={form.branch} onChange={handleChange}>
                <option value="">Select branch</option>
                {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label">Graduation Year</label>
              <select className="form-select" name="graduation_year" value={form.graduation_year} onChange={handleChange}>
                <option value="">Select year</option>
                {[2024,2025,2026,2027,2028].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          <button className="btn btn-primary" type="submit" disabled={loading}
            style={{ width: '100%', justifyContent: 'center', height: 46, fontSize: 15, marginTop: 4 }}>
            {loading ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Creating account...</> : '🚀 Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--text-secondary)' }}>
          Already have an account? <Link to="/login" style={{ fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
