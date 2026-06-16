// ============================================================
// pages/SkillGapPage.jsx
// ============================================================

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'react-toastify';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import api from '../utils/api';

const ROLES = [
  'Full Stack Developer', 'Data Scientist', 'Backend Developer',
  'Frontend Developer', 'DevOps Engineer', 'ML Engineer', 'Mobile Developer'
];

export default function SkillGapPage() {
  const [targetRole, setTargetRole] = useState('Full Stack Developer');
  const [result, setResult]         = useState(null);
  const [loading, setLoading]       = useState(false);

  const analyze = async () => {
    setLoading(true);
    try {
      const res = await api.post('/internship/skill-gap', { target_role: targetRole.toLowerCase() });
      setResult(res.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Analysis failed. Add skills to your profile first.');
    } finally { setLoading(false); }
  };

  const radarData = result ? [
    { subject: 'Essential Skills', score: result.have_essential?.length || 0, fullMark: (result.have_essential?.length || 0) + (result.missing_essential?.length || 0) },
    { subject: 'Good-to-Have',     score: result.have_good_to_have?.length || 0, fullMark: (result.have_good_to_have?.length || 0) + (result.missing_good_to_have?.length || 0) },
    { subject: 'Total Skills',     score: result.total_have || 0, fullMark: result.total_required || 10 },
  ] : [];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">📈 Skill Gap Analysis</h1>
          <p className="page-subtitle">Compare your skills against industry requirements and get a personalized roadmap</p>
        </div>
      </div>

      {/* Role Selector */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <label className="form-label">Target Role</label>
            <select className="form-select" value={targetRole} onChange={e => setTargetRole(e.target.value)}>
              {ROLES.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          <button className="btn btn-primary" onClick={analyze} disabled={loading} style={{ height: 42, paddingInline: 28 }}>
            {loading ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Analyzing...</> : '🔍 Analyze My Gap'}
          </button>
        </div>
        <div className="form-hint" style={{ marginTop: 10 }}>
          💡 Make sure you've added your skills in Profile before analyzing
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="fade-in">
          {/* Overview */}
          <div className="grid-4 stagger" style={{ marginBottom: 24 }}>
            {[
              { label: 'Readiness Score', value: `${Math.round(result.readiness_score)}%`, icon: '🎯', color: result.readiness_score >= 70 ? 'var(--success)' : result.readiness_score >= 40 ? 'var(--warning)' : 'var(--danger)', bg: 'var(--success-light)' },
              { label: 'Skills You Have', value: result.total_have, icon: '✅', color: 'var(--success)', bg: 'var(--success-light)' },
              { label: 'Skills to Learn', value: result.missing_essential?.length + result.missing_good_to_have?.length, icon: '📚', color: 'var(--warning)', bg: 'var(--warning-light)' },
              { label: 'Gap %', value: `${Math.round(result.gap_percentage)}%`, icon: '⚠️', color: 'var(--danger)', bg: 'var(--danger-light)' },
            ].map(s => (
              <div key={s.label} className="stat-card fade-in">
                <div className="stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
                <div className="stat-info">
                  <div className="stat-label">{s.label}</div>
                  <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid-2" style={{ marginBottom: 24 }}>
            {/* Radar */}
            <div className="card">
              <div className="card-title" style={{ marginBottom: 16 }}>Skill Coverage Radar</div>
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="var(--border)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                  <Radar dataKey="score" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.25} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Priority Learning */}
            <div className="card">
              <div className="card-title" style={{ marginBottom: 16 }}>🚨 Learn These First</div>
              {result.missing_essential?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {result.missing_essential.map((s, i) => (
                    <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--danger-light)', borderRadius: 8 }}>
                      <span style={{ color: 'var(--danger)', fontWeight: 700 }}>#{i + 1}</span>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s}</span>
                      <span className="badge badge-danger" style={{ marginLeft: 'auto' }}>Essential</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="alert alert-success">🎉 You have all essential skills for this role!</div>
              )}
            </div>
          </div>

          {/* Have & Missing */}
          <div className="grid-2" style={{ marginBottom: 24 }}>
            <div className="card">
              <div className="card-title" style={{ marginBottom: 12 }}>✅ Skills You Have</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {[...result.have_essential, ...result.have_good_to_have].map(s => (
                  <span key={s} className="skill-tag" style={{ background: 'var(--success-light)', color: 'var(--success)' }}>{s}</span>
                ))}
              </div>
            </div>
            <div className="card">
              <div className="card-title" style={{ marginBottom: 12 }}>📚 Skills to Develop</div>
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Essential (Priority)</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {result.missing_essential?.map(s => <span key={s} className="badge badge-danger">{s}</span>)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Good to Have</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {result.missing_good_to_have?.map(s => <span key={s} className="badge badge-warning">{s}</span>)}
                </div>
              </div>
            </div>
          </div>

          {/* Roadmap */}
          {result.roadmap && (
            <div className="card">
              <div className="card-title" style={{ marginBottom: 16 }}>🗺️ Your 3-Month Learning Roadmap</div>
              <div style={{ fontSize: 14, lineHeight: 1.9, color: 'var(--text-secondary)' }}>
                <ReactMarkdown>{result.roadmap}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      )}

      {!result && !loading && (
        <div className="empty-state">
          <div className="empty-icon">📈</div>
          <div className="empty-title">Ready to analyze your skill gap?</div>
          <div className="empty-text">Select a target role and click Analyze to see where you stand and what to learn next</div>
        </div>
      )}
    </div>
  );
}
