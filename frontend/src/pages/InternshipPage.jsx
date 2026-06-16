import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../utils/api';

const COMPANIES = [
  'Google','Microsoft','Amazon','Meta','Apple','Netflix',
  'Flipkart','Swiggy','Zomato','Razorpay','Paytm','PhonePe',
  'Infosys','TCS','Wipro','Accenture','IBM','Adobe',
  'Uber','Salesforce','Samsung','Oracle','CRED','Ola'
];

const JOB_TYPES = [
  { key:'all',        label:'🔀 All' },
  { key:'internship', label:'🎓 Internships' },
  { key:'fulltime',   label:'💼 Full Time' },
];

export default function InternshipPage() {
  const [tab, setTab]                         = useState('recommended');
  const [recommended, setRecommended]         = useState([]);
  const [all, setAll]                         = useState([]);
  const [applications, setApplications]       = useState([]);
  const [liveJobs, setLiveJobs]               = useState([]);
  const [liveQuery, setLiveQuery]             = useState('software engineer India');
  const [liveType, setLiveType]               = useState('all');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [liveLoading, setLiveLoading]         = useState(false);
  const [loading, setLoading]                 = useState(true);
  const [search, setSearch]                   = useState('');
  const [filter, setFilter]                   = useState({ domain:'', type:'' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [recRes, allRes, appRes] = await Promise.all([
        api.get('/internship/recommend'),
        api.get('/internship/'),
        api.get('/internship/my-applications'),
      ]);
      setRecommended(recRes.data.recommendations || []);
      setAll(allRes.data.internships || []);
      setApplications(appRes.data.applications || []);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchLiveJobs = async (company = selectedCompany, query = liveQuery, type = liveType) => {
    setLiveLoading(true);
    setLiveJobs([]);
    try {
      const params = new URLSearchParams({ query, type, company: company || '', page:'1' });
      const res = await api.get(`/internship/live-jobs?${params}`);
      const jobs = res.data.jobs || [];
      setLiveJobs(jobs);
      if (jobs.length === 0) toast.info('No results found. Try a different search.');
    } catch(err) {
      toast.error(err.response?.data?.error || 'Could not fetch jobs. Try again.');
    } finally { setLiveLoading(false); }
  };

  const handleSave = async (id, status='saved') => {
    try {
      await api.post(`/internship/${id}/save`, { status });
      toast.success(status === 'applied' ? 'Marked as applied!' : 'Saved!');
      loadData();
    } catch { toast.error('Action failed'); }
  };

  const filteredAll = all.filter(i => {
    const q = search.toLowerCase();
    return (!search || i.title.toLowerCase().includes(q) || i.company.toLowerCase().includes(q))
      && (!filter.domain || i.domain === filter.domain)
      && (!filter.type   || i.type === filter.type);
  });

  const domains = [...new Set(all.map(i => i.domain).filter(Boolean))];

  const DBCard = ({ item, showMatch=false }) => (
    <div className="card" style={{ position:'relative', transition:'all 0.2s' }}
      onMouseEnter={e => e.currentTarget.style.transform='translateY(-2px)'}
      onMouseLeave={e => e.currentTarget.style.transform=''}>
      {showMatch && item.match_score != null && (
        <div style={{ position:'absolute', top:16, right:16, background: item.match_score>=70?'var(--success)':item.match_score>=40?'var(--warning)':'var(--danger)', color:'white', borderRadius:20, padding:'3px 10px', fontSize:12, fontWeight:700 }}>
          {Math.round(item.match_score)}% match
        </div>
      )}
      <div style={{ display:'flex', gap:12, marginBottom:12 }}>
        <div style={{ width:44, height:44, borderRadius:10, background:'var(--accent-light)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>💼</div>
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:700, fontSize:15, paddingRight: showMatch?80:0 }}>{item.title}</div>
          <div style={{ fontSize:13, color:'var(--text-secondary)' }}>{item.company}</div>
        </div>
      </div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:10 }}>
        <span className="badge badge-info">📍 {item.location||'Remote'}</span>
        <span className="badge badge-muted">{item.type}</span>
        {item.duration && <span className="badge badge-muted">⏱ {item.duration}</span>}
        {item.stipend && <span className="badge badge-success">💰 {item.stipend}</span>}
        {item.domain && <span className="badge badge-primary">{item.domain}</span>}
      </div>
      {item.description && <p style={{ fontSize:13, color:'var(--text-secondary)', marginBottom:10, lineHeight:1.6 }}>{item.description.slice(0,120)}...</p>}
      <div style={{ marginBottom:12 }}>
        <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:6 }}>Required Skills</div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
          {(Array.isArray(item.required_skills)?item.required_skills:JSON.parse(item.required_skills||'[]')).map(s => (
            <span key={s} className={`badge ${showMatch&&item.matched_skills?.includes(s)?'badge-success':'badge-muted'}`}>{s}</span>
          ))}
        </div>
        {showMatch && item.missing_skills?.length > 0 && (
          <div style={{ marginTop:6, fontSize:11 }}>
            <span style={{ color:'var(--text-muted)' }}>Missing: </span>
            {item.missing_skills.map(s => <span key={s} className="badge badge-danger" style={{ marginRight:4 }}>{s}</span>)}
          </div>
        )}
      </div>
      <div style={{ display:'flex', gap:8 }}>
        <button className="btn btn-primary btn-sm" onClick={() => handleSave(item.id,'applied')} style={{ flex:1, justifyContent:'center' }}>🚀 Mark Applied</button>
        <button className="btn btn-secondary btn-sm" onClick={() => handleSave(item.id,'saved')}>🔖</button>
        {item.apply_link && <a href={item.apply_link} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">🔗 Apply</a>}
      </div>
    </div>
  );

  const LiveCard = ({ job }) => (
    <div className="card" style={{ transition:'all 0.2s', position:'relative' }}
      onMouseEnter={e => e.currentTarget.style.transform='translateY(-2px)'}
      onMouseLeave={e => e.currentTarget.style.transform=''}>
      <div style={{ position:'absolute', top:16, right:16, display:'flex', gap:4, flexDirection:'column', alignItems:'flex-end' }}>
        <span className="badge badge-success" style={{ fontSize:10 }}>🔴 Live</span>
        {job.is_intern
          ? <span className="badge badge-info" style={{ fontSize:10 }}>🎓 Intern</span>
          : <span className="badge badge-primary" style={{ fontSize:10 }}>💼 Job</span>}
      </div>
      <div style={{ display:'flex', gap:12, marginBottom:12 }}>
        <div style={{ width:48, height:48, borderRadius:10, overflow:'hidden', background:'var(--bg-tertiary)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, border:'1px solid var(--border)' }}>
          {job.company_logo
            ? <img src={job.company_logo} alt={job.company} style={{ width:'100%', height:'100%', objectFit:'contain' }} onError={e => { e.target.style.display='none'; }} />
            : <span style={{ fontSize:22 }}>🏢</span>}
        </div>
        <div style={{ flex:1, paddingRight:80 }}>
          <div style={{ fontWeight:700, fontSize:14, marginBottom:2, lineHeight:1.4 }}>{job.title}</div>
          <div style={{ fontSize:13, color:'var(--text-secondary)', fontWeight:500 }}>{job.company}</div>
        </div>
      </div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:10 }}>
        {job.location && <span className="badge badge-info">📍 {job.location}</span>}
        <span className="badge badge-muted">{job.type}</span>
        {job.employment_type && <span className="badge badge-muted">{job.employment_type}</span>}
        {job.salary && job.salary !== 'As per industry' && <span className="badge badge-success">💰 {job.salary}</span>}
      </div>
      {job.description && <p style={{ fontSize:13, color:'var(--text-secondary)', marginBottom:10, lineHeight:1.6 }}>{job.description}...</p>}
      {job.required_skills?.length > 0 && (
        <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:12 }}>
          {job.required_skills.slice(0,5).map((s,i) => <span key={i} className="badge badge-muted">{s}</span>)}
        </div>
      )}
      {job.apply_link
        ? <a href={job.apply_link} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm" style={{ width:'100%', justifyContent:'center', display:'flex' }}>🚀 Apply Now on {job.company}</a>
        : <button className="btn btn-secondary btn-sm" style={{ width:'100%', justifyContent:'center' }} disabled>No Apply Link</button>}
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">💼 Jobs & Internships</h1>
          <p className="page-subtitle">AI-matched + Live jobs from Google, Amazon, TCS, Infosys and 20+ companies</p>
        </div>
      </div>

      <div className="tabs">
        {[['recommended','⭐ For You'],['live','🌐 Live Jobs'],['all','🏢 All Listings'],['applications','📋 Applied']].map(([k,l]) => (
          <button key={k} className={`tab ${tab===k?'active':''}`}
            onClick={() => { setTab(k); if(k==='live' && liveJobs.length===0) fetchLiveJobs(); }}>
            {l}
          </button>
        ))}
      </div>

      {loading && tab !== 'live' ? (
        <div className="grid-2">{[1,2,3,4].map(i=><div key={i} className="loading-skeleton" style={{ height:220 }}/>)}</div>
      ) : (
        <>
          {/* RECOMMENDED */}
          {tab === 'recommended' && (
            <div className="fade-in">
              {recommended.length > 0 ? (
                <>
                  <div className="alert alert-info" style={{ marginBottom:20 }}>🤖 Top {recommended.length} matches based on your skills</div>
                  <div className="grid-2">{recommended.map(i=><DBCard key={i.id} item={i} showMatch/>)}</div>
                </>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">💼</div>
                  <div className="empty-title">No recommendations yet</div>
                  <div className="empty-text">Add skills in Profile to get matches</div>
                </div>
              )}
            </div>
          )}

          {/* LIVE JOBS */}
          {tab === 'live' && (
            <div className="fade-in">
              {/* Search */}
              <div style={{ display:'flex', gap:10, marginBottom:12, flexWrap:'wrap' }}>
                <input className="form-input" style={{ flex:1, minWidth:200 }}
                  placeholder="🔍 e.g. React developer, Data Scientist, Java backend..."
                  value={liveQuery} onChange={e => setLiveQuery(e.target.value)}
                  onKeyDown={e => e.key==='Enter' && fetchLiveJobs()} />
                <div style={{ display:'flex', gap:6 }}>
                  {JOB_TYPES.map(t => (
                    <button key={t.key} onClick={() => setLiveType(t.key)}
                      className={`btn btn-sm ${liveType===t.key?'btn-primary':'btn-secondary'}`}>
                      {t.label}
                    </button>
                  ))}
                </div>
                <button className="btn btn-primary" onClick={() => { setSelectedCompany(''); fetchLiveJobs(''); }} disabled={liveLoading}
                  style={{ minWidth:110, justifyContent:'center' }}>
                  {liveLoading ? <><span className="spinner" style={{ width:14,height:14 }}/> Searching...</> : '🔍 Search'}
                </button>
              </div>

              {/* Company Buttons */}
              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:8, fontWeight:500 }}>🏢 Search by Company:</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {COMPANIES.map(c => (
                    <button key={c}
                      onClick={() => { setSelectedCompany(c); fetchLiveJobs(c); }}
                      style={{
                        padding:'5px 12px', borderRadius:20, fontSize:12, cursor:'pointer', fontWeight:500,
                        background: selectedCompany===c ? 'var(--accent)' : 'var(--bg-secondary)',
                        color: selectedCompany===c ? 'white' : 'var(--text-secondary)',
                        border: `1px solid ${selectedCompany===c ? 'var(--accent)' : 'var(--border)'}`,
                        transition:'all 0.2s'
                      }}>
                      {c}
                    </button>
                  ))}
                  {selectedCompany && (
                    <button onClick={() => { setSelectedCompany(''); fetchLiveJobs(''); }}
                      style={{ padding:'5px 12px', borderRadius:20, fontSize:12, cursor:'pointer', background:'var(--danger-light)', color:'var(--danger)', border:'none' }}>
                      ✕ Clear Filter
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Searches */}
              <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:20 }}>
                {['Python developer India','React intern Bangalore','Data Science fresher','Full Stack remote','ML Engineer India','Android developer','DevOps AWS','Java backend India'].map(q => (
                  <button key={q} onClick={() => { setLiveQuery(q); setSelectedCompany(''); fetchLiveJobs('', q, liveType); }}
                    style={{ padding:'4px 10px', background:'var(--accent-light)', color:'var(--accent-text)', border:'none', borderRadius:20, fontSize:11, cursor:'pointer', fontWeight:500 }}>
                    {q}
                  </button>
                ))}
              </div>

              {liveLoading ? (
                <div>
                  <div style={{ textAlign:'center', padding:'20px', color:'var(--text-muted)', fontSize:14 }}>
                    🔍 Searching live jobs from LinkedIn, Indeed & Glassdoor...
                  </div>
                  <div className="grid-2">{[1,2,3,4].map(i=><div key={i} className="loading-skeleton" style={{ height:240 }}/>)}</div>
                </div>
              ) : liveJobs.length > 0 ? (
                <>
                  <div className="alert alert-success" style={{ marginBottom:16 }}>
                    ✅ Found {liveJobs.length} results •
                    🎓 {liveJobs.filter(j=>j.is_intern).length} internships •
                    💼 {liveJobs.filter(j=>!j.is_intern).length} full-time jobs
                  </div>
                  <div className="grid-2">{liveJobs.map((job,i)=><LiveCard key={i} job={job}/>)}</div>
                </>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">🌐</div>
                  <div className="empty-title">Search for live jobs & internships</div>
                  <div className="empty-text">Click a company name above or use the search bar</div>
                  <button className="btn btn-primary" onClick={() => fetchLiveJobs()}>🔍 Load Jobs</button>
                </div>
              )}
            </div>
          )}

          {/* ALL DB LISTINGS */}
          {tab === 'all' && (
            <div className="fade-in">
              <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap' }}>
                <input className="form-input" style={{ flex:1, minWidth:200 }} placeholder="🔍 Search by title or company..."
                  value={search} onChange={e => setSearch(e.target.value)} />
                <select className="form-select" style={{ width:160 }} value={filter.domain} onChange={e=>setFilter(f=>({...f,domain:e.target.value}))}>
                  <option value="">All Domains</option>
                  {domains.map(d=><option key={d}>{d}</option>)}
                </select>
                <select className="form-select" style={{ width:140 }} value={filter.type} onChange={e=>setFilter(f=>({...f,type:e.target.value}))}>
                  <option value="">All Types</option>
                  <option value="remote">Remote</option>
                  <option value="onsite">Onsite</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
              <div className="grid-2">{filteredAll.map(i=><DBCard key={i.id} item={i}/>)}</div>
              {filteredAll.length===0 && <div className="empty-state"><div className="empty-icon">🔍</div><div className="empty-title">No results found</div></div>}
            </div>
          )}

          {/* APPLICATIONS */}
          {tab === 'applications' && (
            <div className="fade-in">
              {applications.length > 0 ? (
                <div className="table-container">
                  <table>
                    <thead><tr><th>Position</th><th>Company</th><th>Type</th><th>Status</th><th>Package</th></tr></thead>
                    <tbody>
                      {applications.map(a=>(
                        <tr key={a.id}>
                          <td><strong>{a.title}</strong></td>
                          <td>{a.company}</td>
                          <td><span className="badge badge-muted">{a.type}</span></td>
                          <td><span className={`badge ${a.status==='selected'?'badge-success':a.status==='rejected'?'badge-danger':a.status==='applied'?'badge-info':'badge-muted'}`}>{a.status}</span></td>
                          <td>{a.stipend||'-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">📋</div>
                  <div className="empty-title">No applications yet</div>
                  <button className="btn btn-primary" onClick={()=>setTab('live')}>Find Jobs</button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}