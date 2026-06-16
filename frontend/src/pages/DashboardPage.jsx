// ============================================================
// pages/DashboardPage.jsx
// ============================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function DashboardPage() {
  const { user }  = useAuth();
  const navigate  = useNavigate();
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const [profileRes, resumeRes, interviewRes] = await Promise.all([
          api.get('/auth/profile'),
          api.get('/resume/history'),
          api.get('/interview/history')
        ]);
        setData({
          profile:    profileRes.data,
          resumes:    resumeRes.data.resumes || [],
          interviews: interviewRes.data.interviews || []
        });
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    fetchDashboard();
  }, []);

  if (loading) return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20, marginBottom: 24 }}>
      {[1,2,3,4].map(i => <div key={i} className="loading-skeleton" style={{ height: 100, borderRadius: 14 }} />)}
    </div>
  );

  const profile    = data?.profile;
  const resumes    = data?.resumes || [];
  const interviews = data?.interviews || [];
  const skills     = profile?.skills || [];
  const progress   = profile?.progress || {};
  const latestAts  = resumes[0]?.ats_score || 0;
  const avgIntView = interviews.length
    ? Math.round(interviews.filter(i => i.total_score).reduce((a, b) => a + b.total_score, 0) / interviews.filter(i => i.total_score).length)
    : 0;

  // Radar chart: skill categories
  const skillCategories = ['Programming', 'Web Dev', 'Database', 'AI/ML', 'DevOps', 'Mobile'];
  const radarData = skillCategories.map(cat => ({
    subject: cat,
    score: Math.floor(Math.random() * 60 + 30) // In production: compute from actual skills
  }));

  // Bar chart: interview scores
  const barData = interviews.slice(0, 6).reverse().map((iv, i) => ({
    name: `#${i + 1}`,
    score: iv.total_score || 0
  }));

  const STAT_CARDS = [
    { label: 'ATS Score', value: `${latestAts}/100`, icon: '📄', color: '#6366f1', bg: '#eef2ff' },
    { label: 'Interviews', value: interviews.length, icon: '🎤', color: '#10b981', bg: '#d1fae5' },
    { label: 'Skills Added', value: skills.length, icon: '⚡', color: '#f59e0b', bg: '#fef3c7' },
    { label: 'Avg Score', value: `${avgIntView}%`, icon: '📈', color: '#3b82f6', bg: '#dbeafe' },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Track your progress and career readiness</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/resume')}>
          📤 Upload Resume
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid-4 stagger fade-in" style={{ marginBottom: 24 }}>
        {STAT_CARDS.map(card => (
          <div key={card.label} className="stat-card fade-in">
            <div className="stat-icon" style={{ background: card.bg, color: card.color }}>
              {card.icon}
            </div>
            <div className="stat-info">
              <div className="stat-label">{card.label}</div>
              <div className="stat-value">{card.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* Skill Radar */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">🕸️ Skill Profile</div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/skill-gap')}>View Gap →</button>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
              <Radar name="Skills" dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Interview Bar */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">🎯 Interview Scores</div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/interview')}>Practice →</button>
          </div>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => [`${v}%`, 'Score']} />
                <Bar dataKey="score" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: 40 }}>
              <div className="empty-icon">🎤</div>
              <div className="empty-title">No interviews yet</div>
              <button className="btn btn-primary btn-sm" onClick={() => navigate('/interview')}>Start Practice</button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid-2">
        {/* Skills */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">⚡ My Skills</div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/profile')}>Manage →</button>
          </div>
          {skills.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {skills.slice(0, 18).map(s => (
                <span key={s.skill_name} className="skill-tag">{s.skill_name}</span>
              ))}
              {skills.length > 18 && <span className="badge badge-muted">+{skills.length - 18} more</span>}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: 30 }}>
              <div className="empty-icon">⚡</div>
              <div className="empty-title">No skills added</div>
              <button className="btn btn-primary btn-sm" onClick={() => navigate('/profile')}>Add Skills</button>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">🚀 Quick Actions</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { icon: '📄', label: 'Analyze My Resume', sub: 'Get ATS score & tips', path: '/resume', color: '#6366f1' },
              { icon: '🤖', label: 'Chat with AI Advisor', sub: 'Career guidance 24/7', path: '/chatbot', color: '#10b981' },
              { icon: '🎤', label: 'Mock Interview', sub: 'Practice & get feedback', path: '/interview', color: '#f59e0b' },
              { icon: '💼', label: 'Find Internships', sub: 'AI-matched for you', path: '/internships', color: '#3b82f6' },
            ].map(a => (
              <div key={a.path}
                onClick={() => navigate(a.path)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, cursor: 'pointer', border: '1px solid var(--border)', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.borderColor = a.color; }}
                onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.borderColor = 'var(--border)'; }}
              >
                <span style={{ fontSize: 22 }}>{a.icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{a.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{a.sub}</div>
                </div>
                <span style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}>→</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
