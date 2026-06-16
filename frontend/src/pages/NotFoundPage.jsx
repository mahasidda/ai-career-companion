// ============================================================
// pages/NotFoundPage.jsx
// ============================================================

import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
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
