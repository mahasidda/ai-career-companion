// ============================================================
// pages/ProfilePage.jsx
// ============================================================

import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const LEVELS    = ['beginner', 'intermediate', 'advanced'];
const BRANCHES  = ['Computer Science','Information Technology','Electronics','Mechanical','Civil','Electrical','Chemical','Other'];
const POPULAR   = ['Python','JavaScript','React','Node.js','SQL','Java','C++','Machine Learning','Docker','AWS','Flask','MongoDB','Git','TypeScript','Flutter'];

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [tab, setTab]         = useState('profile');
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({ full_name:'', branch:'', college:'', graduation_year:'', bio:'', linkedin_url:'', github_url:'' });
  const [skills, setSkills]   = useState([]);
  const [newSkill, setNewSkill] = useState({ skill_name:'', level:'beginner', category:'programming' });

  useEffect(() => {
    api.get('/auth/profile').then(r => {
      const u = r.data.user;
      setProfile({ full_name: u.full_name||'', branch: u.branch||'', college: u.college||'', graduation_year: u.graduation_year||'', bio: u.bio||'', linkedin_url: u.linkedin_url||'', github_url: u.github_url||'' });
      setSkills(r.data.skills || []);
    }).catch(() => {});
  }, []);

  const saveProfile = async () => {
    setLoading(true);
    try {
      await api.put('/auth/profile', profile);
      updateUser({ full_name: profile.full_name });
      toast.success('Profile updated!');
    } catch { toast.error('Update failed'); }
    finally { setLoading(false); }
  };

  const addSkill = async (name, level = 'beginner') => {
    const sname = name || newSkill.skill_name.trim();
    if (!sname) { toast.error('Enter skill name'); return; }
    try {
      const res = await api.post('/skills/', { skill_name: sname, level, category: newSkill.category });
      setSkills(s => [...s, res.data]);
      setNewSkill(n => ({ ...n, skill_name: '' }));
      toast.success(`${sname} added!`);
    } catch (err) { toast.error(err.response?.data?.error || 'Could not add skill'); }
  };

  const deleteSkill = async (id) => {
    await api.delete(`/skills/${id}`);
    setSkills(s => s.filter(x => x.id !== id));
    toast.success('Skill removed');
  };

  const updateSkillLevel = async (id, level) => {
    await api.put(`/skills/${id}`, { level });
    setSkills(s => s.map(x => x.id === id ? { ...x, level } : x));
  };

  const initials = (name) => (name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const levelColor = { beginner: 'badge-info', intermediate: 'badge-warning', advanced: 'badge-success' };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">👤 Profile</h1>
          <p className="page-subtitle">Manage your information and skills</p>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'profile' ? 'active' : ''}`} onClick={() => setTab('profile')}>📋 Profile Info</button>
        <button className={`tab ${tab === 'skills' ? 'active' : ''}`}  onClick={() => setTab('skills')}>⚡ Skills ({skills.length})</button>
      </div>

      {tab === 'profile' && (
        <div className="grid-2 fade-in" style={{ alignItems: 'start' }}>
          {/* Avatar Card */}
          <div>
            <div className="card" style={{ textAlign: 'center', marginBottom: 20 }}>
              <div className="avatar avatar-lg" style={{ margin: '0 auto 12px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', fontSize: 28 }}>
                {initials(profile.full_name)}
              </div>
              <div style={{ fontWeight: 700, fontSize: 18 }}>{profile.full_name || user?.full_name}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>{profile.branch} • {profile.college}</div>
              {profile.graduation_year && <div className="badge badge-primary" style={{ margin: '8px auto 0', display: 'inline-flex' }}>Class of {profile.graduation_year}</div>}
              {profile.bio && <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 12, lineHeight: 1.6 }}>{profile.bio}</p>}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 14 }}>
                {profile.linkedin_url && <a href={`https://${profile.linkedin_url}`} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">LinkedIn</a>}
                {profile.github_url   && <a href={`https://${profile.github_url}`}   target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">GitHub</a>}
              </div>
            </div>
          </div>

          {/* Edit Form */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: 20 }}>Edit Profile</div>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" value={profile.full_name} onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">College / University</label>
              <input className="form-input" placeholder="e.g. JNTU Hyderabad" value={profile.college} onChange={e => setProfile(p => ({ ...p, college: e.target.value }))} />
            </div>
            <div className="grid-2 md-2" style={{ gap: 14 }}>
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label">Branch</label>
                <select className="form-select" value={profile.branch} onChange={e => setProfile(p => ({ ...p, branch: e.target.value }))}>
                  <option value="">Select</option>
                  {BRANCHES.map(b => <option key={b}>{b}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label">Graduation Year</label>
                <select className="form-select" value={profile.graduation_year} onChange={e => setProfile(p => ({ ...p, graduation_year: e.target.value }))}>
                  <option value="">Select</option>
                  {[2024,2025,2026,2027,2028].map(y => <option key={y}>{y}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Bio</label>
              <textarea className="form-input form-textarea" style={{ minHeight: 80 }} placeholder="Tell us about yourself..." value={profile.bio} onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">LinkedIn URL</label>
              <input className="form-input" placeholder="linkedin.com/in/yourname" value={profile.linkedin_url} onChange={e => setProfile(p => ({ ...p, linkedin_url: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">GitHub URL</label>
              <input className="form-input" placeholder="github.com/yourusername" value={profile.github_url} onChange={e => setProfile(p => ({ ...p, github_url: e.target.value }))} />
            </div>
            <button className="btn btn-primary" onClick={saveProfile} disabled={loading} style={{ justifyContent: 'center' }}>
              {loading ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Saving...</> : '💾 Save Profile'}
            </button>
          </div>
        </div>
      )}

      {tab === 'skills' && (
        <div className="fade-in">
          {/* Add Skill */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-title" style={{ marginBottom: 14 }}>➕ Add New Skill</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <input className="form-input" style={{ flex: 1, minWidth: 180 }} placeholder="Skill name (e.g. React)" value={newSkill.skill_name}
                onChange={e => setNewSkill(n => ({ ...n, skill_name: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && addSkill()} />
              <select className="form-select" style={{ width: 150 }} value={newSkill.level} onChange={e => setNewSkill(n => ({ ...n, level: e.target.value }))}>
                {LEVELS.map(l => <option key={l}>{l}</option>)}
              </select>
              <select className="form-select" style={{ width: 150 }} value={newSkill.category} onChange={e => setNewSkill(n => ({ ...n, category: e.target.value }))}>
                {['programming','framework','database','cloud','tool','soft_skill','other'].map(c => <option key={c}>{c}</option>)}
              </select>
              <button className="btn btn-primary" onClick={() => addSkill()}>Add</button>
            </div>

            {/* Quick Add Popular */}
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>⚡ Quick add popular skills:</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {POPULAR.filter(p => !skills.find(s => s.skill_name === p)).slice(0, 12).map(p => (
                  <button key={p} onClick={() => addSkill(p)}
                    style={{ padding: '4px 10px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 20, fontSize: 12, cursor: 'pointer', color: 'var(--text-secondary)' }}>
                    + {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Skills List */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">My Skills ({skills.length})</div>
            </div>
            {skills.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {skills.map(s => (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 20 }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{s.skill_name}</span>
                    <select value={s.level} onChange={e => updateSkillLevel(s.id, e.target.value)}
                      style={{ fontSize: 11, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', outline: 'none' }}>
                      {LEVELS.map(l => <option key={l}>{l}</option>)}
                    </select>
                    <button onClick={() => deleteSkill(s.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 14, lineHeight: 1, padding: 0 }}>
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state" style={{ padding: 30 }}>
                <div className="empty-icon">⚡</div>
                <div className="empty-title">No skills yet — add some above!</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
