// ============================================================
// pages/ResumePage.jsx
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import api from '../utils/api';

const ROLES = ['Full Stack Developer','Data Scientist','Backend Developer','Frontend Developer','DevOps Engineer','ML Engineer','Mobile Developer'];

export default function ResumePage() {
  const [tab, setTab]             = useState('upload');
  const [uploading, setUploading] = useState(false);
  const [result, setResult]       = useState(null);
  const [history, setHistory]     = useState([]);
  const [form, setForm]           = useState({ job_description: '', target_role: 'Full Stack Developer' });

  useEffect(() => {
    api.get('/resume/history').then(r => setHistory(r.data.resumes || [])).catch(() => {});
  }, []);

  const onDrop = useCallback(async (files) => {
    const file = files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error('File too large (max 10 MB)'); return; }

    setUploading(true);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append('resume', file);
      fd.append('target_role', form.target_role.toLowerCase());
      if (form.job_description) fd.append('job_description', form.job_description);

      const res = await api.post('/resume/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult(res.data);
      setHistory(h => [{ id: res.data.resume_id, file_name: file.name, ats_score: res.data.ats_score.total_score, uploaded_at: new Date().toISOString() }, ...h]);
      toast.success('Resume analyzed successfully! 🎉');
      setTab('result');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, [form]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'application/pdf': ['.pdf'] }, multiple: false, disabled: uploading
  });

  const ats = result?.ats_score;
  const scoreColor = ats
    ? (ats.total_score >= 80 ? '#10b981' : ats.total_score >= 60 ? '#f59e0b' : '#ef4444')
    : '#6366f1';

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">📄 Resume Analyzer</h1>
          <p className="page-subtitle">Upload your PDF resume for ATS scoring and skill analysis</p>
        </div>
      </div>

      <div className="tabs">
        {['upload', 'result', 'history'].map(t => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t === 'upload' ? '📤 Upload' : t === 'result' ? '📊 Analysis' : '🕒 History'}
          </button>
        ))}
      </div>

      {/* Upload Tab */}
      {tab === 'upload' && (
        <div className="grid-2 fade-in" style={{ alignItems: 'start' }}>
          <div>
            <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
              <input {...getInputProps()} />
              <div className="dropzone-icon">{uploading ? '⏳' : '📄'}</div>
              <div className="dropzone-title">
                {uploading ? 'Analyzing your resume...' : isDragActive ? 'Drop it here!' : 'Drop PDF here or click to upload'}
              </div>
              <div className="dropzone-sub">
                {uploading ? 'Extracting skills, calculating ATS score...' : 'Supports PDF • Max 10 MB'}
              </div>
              {uploading && <div className="spinner" style={{ margin: '12px auto 0' }} />}
            </div>
          </div>

          <div className="card">
            <div className="card-title" style={{ marginBottom: 16 }}>⚙️ Analysis Options</div>
            <div className="form-group">
              <label className="form-label">Target Role</label>
              <select className="form-select" value={form.target_role}
                onChange={e => setForm(f => ({ ...f, target_role: e.target.value }))}>
                {ROLES.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Job Description (Optional)</label>
              <textarea className="form-input form-textarea"
                placeholder="Paste the job description for more accurate ATS scoring..."
                value={form.job_description}
                onChange={e => setForm(f => ({ ...f, job_description: e.target.value }))}
              />
              <div className="form-hint">Providing a JD makes ATS scoring much more accurate</div>
            </div>
          </div>
        </div>
      )}

      {/* Result Tab */}
      {tab === 'result' && result && (
        <div className="fade-in">
          {/* ATS Score Hero */}
          <div className="card" style={{ marginBottom: 20, textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 32, flexWrap: 'wrap' }}>
              <div>
                <div style={{ width: 120, height: 120, borderRadius: '50%', border: `6px solid ${scoreColor}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: scoreColor }}>{ats?.total_score}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>/ 100</div>
                </div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>ATS Score</div>
                <span className={`badge ${ats?.total_score >= 80 ? 'badge-success' : ats?.total_score >= 60 ? 'badge-warning' : 'badge-danger'}`}>
                  {ats?.grade}
                </span>
              </div>

              <div style={{ flex: 1, minWidth: 280, textAlign: 'left' }}>
                {ats?.breakdown && Object.entries(ats.breakdown).map(([key, val]) => (
                  <div key={key} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                      <span style={{ textTransform: 'capitalize', color: 'var(--text-secondary)' }}>{key.replace('_', ' ')}</span>
                      <span style={{ fontWeight: 600 }}>{val.score}/{val.max}</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${(val.score / val.max) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid-2">
            {/* Extracted Skills */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">✅ Detected Skills ({result.extracted_skills?.length || 0})</div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {(result.extracted_skills || []).map(s => (
                  <span key={s} className="skill-tag">{s}</span>
                ))}
                {(!result.extracted_skills?.length) && <div className="text-muted">No skills detected</div>}
              </div>
            </div>

            {/* Missing Skills */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">⚠️ Missing Skills</div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {(ats?.missing_keywords || []).slice(0, 15).map(s => (
                  <span key={s} className="badge badge-danger">{s}</span>
                ))}
                {(!ats?.missing_keywords?.length) && <div className="text-muted">Great! No critical skills missing.</div>}
              </div>
            </div>
          </div>

          {/* Suggestions */}
          {ats?.suggestions?.length > 0 && (
            <div className="card" style={{ marginTop: 20 }}>
              <div className="card-header">
                <div className="card-title">💡 Improvement Suggestions</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {ats.suggestions.map((s, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: 8, fontSize: 14 }}>
                    <span>💡</span><span>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* No result yet on result tab */}
      {tab === 'result' && !result && (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <div className="empty-title">No analysis yet</div>
          <div className="empty-text">Upload a resume to see your ATS score and analysis</div>
          <button className="btn btn-primary" onClick={() => setTab('upload')}>Upload Resume</button>
        </div>
      )}

      {/* History Tab */}
      {tab === 'history' && (
        <div className="fade-in">
          {history.length > 0 ? (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>File Name</th>
                    <th>ATS Score</th>
                    <th>Grade</th>
                    <th>Uploaded</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map(r => (
                    <tr key={r.id}>
                      <td>📄 {r.file_name}</td>
                      <td><strong>{r.ats_score}/100</strong></td>
                      <td>
                        <span className={`badge ${r.ats_score >= 80 ? 'badge-success' : r.ats_score >= 60 ? 'badge-warning' : 'badge-danger'}`}>
                          {r.ats_score >= 80 ? 'Excellent' : r.ats_score >= 60 ? 'Good' : 'Needs Work'}
                        </span>
                      </td>
                      <td className="text-muted">{r.uploaded_at ? format(new Date(r.uploaded_at), 'dd MMM yyyy') : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">🕒</div>
              <div className="empty-title">No resume history</div>
              <button className="btn btn-primary" onClick={() => setTab('upload')}>Upload Your First Resume</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
