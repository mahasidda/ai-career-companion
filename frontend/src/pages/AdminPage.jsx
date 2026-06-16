// ============================================================
// pages/AdminPage.jsx
// ============================================================

import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../utils/api';

export default function AdminPage() {
  const [tab, setTab]     = useState('dashboard');
  const [data, setData]   = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newInternship, setNewInternship] = useState({ title:'', company:'', location:'', type:'remote', duration:'', stipend:'', domain:'', description:'', required_skills:'' });

  useEffect(() => {
    api.get('/admin/dashboard').then(r => { setData(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (tab === 'users')
      api.get('/admin/users').then(r => setUsers(r.data.users || [])).catch(() => {});
  }, [tab]);

  const toggleUser = async (id) => {
    await api.put(`/admin/users/${id}/toggle`);
    setUsers(u => u.map(x => x.id === id ? { ...x, is_active: !x.is_active } : x));
    toast.success('User status updated');
  };

  const addInternship = async () => {
    try {
      const payload = { ...newInternship, required_skills: newInternship.required_skills.split(',').map(s => s.trim()).filter(Boolean) };
      await api.post('/admin/internships', payload);
      toast.success('Internship added!');
      setNewInternship({ title:'', company:'', location:'', type:'remote', duration:'', stipend:'', domain:'', description:'', required_skills:'' });
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  if (loading) return <div className="flex-center" style={{ minHeight: 200 }}><div className="spinner" /></div>;

  const stats = data?.stats || {};

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">👑 Admin Panel</h1>
          <p className="page-subtitle">Platform management and analytics</p>
        </div>
      </div>

      <div className="tabs">
        {[['dashboard','📊 Dashboard'],['users','👥 Users'],['internships','💼 Internships']].map(([k,l]) => (
          <button key={k} className={`tab ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {tab === 'dashboard' && (
        <div className="fade-in">
          <div className="grid-4 stagger" style={{ marginBottom: 24 }}>
            {[
              { label:'Total Students', value: stats.total_users, icon:'👥', color:'#6366f1', bg:'#eef2ff' },
              { label:'Resumes Analyzed', value: stats.total_resumes, icon:'📄', color:'#10b981', bg:'#d1fae5' },
              { label:'Interviews Done', value: stats.total_interviews, icon:'🎤', color:'#f59e0b', bg:'#fef3c7' },
              { label:'Avg ATS Score', value: stats.avg_ats_score, icon:'⭐', color:'#3b82f6', bg:'#dbeafe' },
            ].map(s => (
              <div key={s.label} className="stat-card fade-in">
                <div className="stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
                <div className="stat-info">
                  <div className="stat-label">{s.label}</div>
                  <div className="stat-value">{s.value}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="grid-2">
            <div className="card">
              <div className="card-title" style={{ marginBottom: 16 }}>📈 Monthly Signups</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data?.monthly_signups || []}>
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#6366f1" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="card">
              <div className="card-title" style={{ marginBottom: 16 }}>🔥 Top Skills on Platform</div>
              {(data?.top_skills || []).map((s, i) => (
                <div key={s.skill_name} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                  <span style={{ fontSize:12, color:'var(--text-muted)', width:16 }}>#{i+1}</span>
                  <span style={{ fontSize:14, flex:1 }}>{s.skill_name}</span>
                  <div className="progress-bar" style={{ width:80, height:6 }}><div className="progress-fill" style={{ width:`${Math.min(100,(s.count/(data.top_skills[0]?.count||1))*100)}%` }} /></div>
                  <span style={{ fontSize:12, color:'var(--text-muted)', width:24, textAlign:'right' }}>{s.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'users' && (
        <div className="fade-in table-container">
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Branch</th><th>Status</th><th>Joined</th><th>Action</th></tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td><strong>{u.full_name}</strong></td>
                  <td className="text-muted">{u.email}</td>
                  <td>{u.branch || '-'}</td>
                  <td><span className={`badge ${u.is_active ? 'badge-success' : 'badge-danger'}`}>{u.is_active ? 'Active' : 'Disabled'}</span></td>
                  <td className="text-muted">{u.created_at ? new Date(u.created_at).toLocaleDateString('en-IN') : '-'}</td>
                  <td>
                    <button className={`btn btn-sm ${u.is_active ? 'btn-danger' : 'btn-secondary'}`} onClick={() => toggleUser(u.id)}>
                      {u.is_active ? 'Disable' : 'Enable'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'internships' && (
        <div className="fade-in">
          <div className="card">
            <div className="card-title" style={{ marginBottom: 20 }}>➕ Add New Internship</div>
            <div className="grid-2" style={{ gap: 14 }}>
              {[['title','Title *'],['company','Company *'],['location','Location'],['duration','Duration'],['stipend','Stipend'],['domain','Domain']].map(([k,l]) => (
                <div key={k} className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">{l}</label>
                  <input className="form-input" value={newInternship[k]} onChange={e => setNewInternship(n => ({ ...n, [k]: e.target.value }))} />
                </div>
              ))}
            </div>
            <div className="form-group" style={{ marginTop: 14 }}>
              <label className="form-label">Type</label>
              <select className="form-select" value={newInternship.type} onChange={e => setNewInternship(n => ({ ...n, type: e.target.value }))}>
                {['remote','onsite','hybrid'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Required Skills (comma-separated)</label>
              <input className="form-input" placeholder="Python, Flask, MySQL, REST API" value={newInternship.required_skills} onChange={e => setNewInternship(n => ({ ...n, required_skills: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-input form-textarea" style={{ minHeight: 80 }} value={newInternship.description} onChange={e => setNewInternship(n => ({ ...n, description: e.target.value }))} />
            </div>
            <button className="btn btn-primary" onClick={addInternship}>➕ Add Internship</button>
          </div>
        </div>
      )}
    </div>
  );
}
