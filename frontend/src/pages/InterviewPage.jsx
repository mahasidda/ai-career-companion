import React, { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-toastify';
import { useDropzone } from 'react-dropzone';
import api from '../utils/api';

const DOMAINS = ['Python','JavaScript','React','Data Structures','System Design','SQL','Machine Learning','Java','DevOps','HR & Behavioral'];
const ROLES   = ['Full Stack Developer','Data Scientist','Backend Developer','Frontend Developer','DevOps Engineer','ML Engineer','Android Developer','Data Analyst'];
const STAGES  = { SETUP:'setup', INTERVIEW:'interview', RESULT:'result', HISTORY:'history' };
const MODES   = [
  { key:'domain', icon:'⚙️', title:'Domain Interview', desc:'Focus on a specific tech domain like Python, React, SQL' },
  { key:'role',   icon:'🎯', title:'Role-Based Interview', desc:'Interview for a specific job role like Full Stack Developer' },
  { key:'resume', icon:'📄', title:'Resume-Based Interview', desc:'AI reads your resume and asks personalized questions' },
];

export default function InterviewPage() {
  const [stage, setStage]             = useState(STAGES.SETUP);
  const [mode, setMode]               = useState('domain');
  const [config, setConfig]           = useState({ domain:'Python', type:'technical', num_questions:5, target_role:'Full Stack Developer' });
  const [resumeText, setResumeText]   = useState('');
  const [resumeFile, setResumeFile]   = useState(null);
  const [interview, setInterview]     = useState(null);
  const [question, setQuestion]       = useState(null);
  const [transcript, setTranscript]   = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking]   = useState(false);
  const [evaluation, setEval]         = useState(null);
  const [showEval, setShowEval]       = useState(false);
  const [progress, setProgress]       = useState({ answered:0, total:5 });
  const [finalResult, setFinal]       = useState(null);
  const [history, setHistory]         = useState([]);
  const [loading, setLoading]         = useState(false);
  const [camOn, setCamOn]             = useState(false);
  const [micSupported, setMicSupported] = useState(true);
  const [openingMsg, setOpeningMsg]   = useState('');

  const videoRef       = useRef(null);
  const camStreamRef   = useRef(null);
  const recognitionRef = useRef(null);
  const submitRef      = useRef(null);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) setMicSupported(false);
    return () => { stopCamera(); stopListening(); window.speechSynthesis?.cancel(); };
  }, []);

  // Resume dropzone
  const onDrop = useCallback(async (files) => {
    const file = files[0];
    if (!file) return;
    setResumeFile(file.name);
    toast.info('Extracting resume text...');
    try {
      const fd = new FormData();
      fd.append('resume', file);
      fd.append('target_role', 'Software Developer');
      const res = await api.post('/resume/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setResumeText(res.data.ats_score ? 'Resume loaded successfully' : '');
      // Store resume ID for later
      localStorage.setItem('interview_resume_id', res.data.resume_id);
      toast.success('Resume uploaded! Interview will be based on your resume.');
    } catch {
      toast.error('Could not process resume. Try again.');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'application/pdf': ['.pdf'] }, multiple: false
  });

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video:true, audio:false });
      camStreamRef.current = stream;
      setCamOn(true);
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch { toast.info('Camera unavailable — continuing without webcam'); }
  };

  const stopCamera = () => {
    if (camStreamRef.current) { camStreamRef.current.getTracks().forEach(t => t.stop()); camStreamRef.current = null; }
    setCamOn(false);
  };

  const speakText = useCallback((text, onDone) => {
    if (!window.speechSynthesis) { if (onDone) onDone(); return; }
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 0.88; utt.pitch = 1; utt.lang = 'en-IN';
    utt.onstart = () => setIsSpeaking(true);
    utt.onend   = () => { setIsSpeaking(false); if (onDone) onDone(); };
    utt.onerror = () => { setIsSpeaking(false); if (onDone) onDone(); };
    window.speechSynthesis.speak(utt);
  }, []);

  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch(e) {} }
    const rec = new SR();
    rec.continuous = true; rec.interimResults = true; rec.lang = 'en-IN';
    rec.onstart  = () => setIsListening(true);
    rec.onend    = () => setIsListening(false);
    rec.onerror  = (e) => { setIsListening(false); if (e.error !== 'aborted' && e.error !== 'no-speech') toast.error(`Mic: ${e.error}`); };
    rec.onresult = (e) => {
      let final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript + ' ';
      }
      if (final) setTranscript(prev => (prev + final).trimStart());
    };
    recognitionRef.current = rec;
    try { rec.start(); } catch(e) {}
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch(e) {} recognitionRef.current = null; }
    setIsListening(false);
  }, []);

  const startInterview = async () => {
    if (mode === 'resume' && !resumeFile) { toast.error('Please upload your resume first'); return; }
    setLoading(true);
    try {
      const payload = {
        interview_type: config.type,
        domain:         config.domain,
        target_role:    config.target_role,
        num_questions:  config.num_questions,
        interview_mode: mode,
        resume_text:    mode === 'resume' ? resumeText : ''
      };
      const res = await api.post('/interview/start', payload);
      setInterview({ ...res.data, mode });
      setQuestion(res.data.question);
      setOpeningMsg(res.data.opening);
      setProgress({ answered:0, total:res.data.total });
      setTranscript(''); setEval(null); setShowEval(false);
      setStage(STAGES.INTERVIEW);
      await startCamera();
      // Speak opening then first question
      speakText(res.data.opening, () => {
        setTimeout(() => {
          speakText(`Question 1. ${res.data.question.question}`, () => {
            setTimeout(() => startListening(), 600);
          });
        }, 500);
      });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to start interview');
    } finally { setLoading(false); }
  };

  const handleSubmitAnswer = useCallback(async (typed = false) => {
    const answer = transcript.trim();
    if (!answer) { toast.warning('Please speak or type your answer'); return; }
    stopListening();
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
    setLoading(true);
    try {
      const res = await api.post(`/interview/${interview.interview_id}/answer`, {
        question_id:    question.id,
        answer:         answer,
        resume_text:    interview.mode === 'resume' ? resumeText : '',
        interview_mode: interview.mode || 'domain'
      });
      const evalData = res.data.evaluation;
      setEval(evalData);
      setShowEval(true);
      setProgress(res.data.progress || progress);
      const transition = res.data.transition || 'Thank you.';

      if (res.data.completed) {
        stopCamera();
        setFinal(res.data);
        speakText(`${transition} ${res.data.closing_message || 'Interview complete!'}`);
        setTimeout(() => setStage(STAGES.RESULT), 5000);
      } else {
        const nextQ = res.data.next_question;
        speakText(`${transition} Your score was ${evalData?.score || 0} out of 10.`, () => {
          setTimeout(() => {
            setQuestion(nextQ);
            setTranscript('');
            setEval(null);
            setShowEval(false);
            speakText(`Question ${nextQ.question_num || (progress.answered||0)+2}. ${nextQ.question}`, () => {
              setTimeout(() => startListening(), 600);
            });
          }, 1200);
        });
      }
    } catch (err) {
      toast.error('Failed to submit. Please try again.');
    } finally { setLoading(false); }
  }, [transcript, interview, question, progress, stopListening, resumeText, speakText, startListening]);

  useEffect(() => { submitRef.current = handleSubmitAnswer; }, [handleSubmitAnswer]);

  useEffect(() => {
    if (stage === STAGES.HISTORY)
      api.get('/interview/history').then(r => setHistory(r.data.interviews || [])).catch(() => {});
  }, [stage]);

  const reset = () => {
    setStage(STAGES.SETUP); setFinal(null);
    stopCamera(); stopListening(); window.speechSynthesis?.cancel();
    setTranscript(''); setEval(null); setShowEval(false); setOpeningMsg('');
  };

  const timerColor = (s) => s >= 7 ? 'var(--success)' : s >= 5 ? 'var(--warning)' : 'var(--danger)';

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">🎤 Virtual AI Interview</h1>
          <p className="page-subtitle">Real interview experience with AI voice • Mic recording • Instant feedback</p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          {stage !== STAGES.SETUP && <button className="btn btn-secondary" onClick={reset}>🔄 New</button>}
          <button className="btn btn-ghost" onClick={() => setStage(STAGES.HISTORY)}>📋 History</button>
        </div>
      </div>

      {/* ── SETUP ── */}
      {stage === STAGES.SETUP && (
        <div style={{ maxWidth:680, margin:'0 auto' }} className="fade-in">
          <div className="card">
            <div style={{ textAlign:'center', marginBottom:28 }}>
              <div style={{ fontSize:60, marginBottom:10 }}>🎤</div>
              <h2 style={{ fontSize:22, fontWeight:700 }}>Virtual AI Interview Room</h2>
              <p style={{ color:'var(--text-muted)', fontSize:14, marginTop:6 }}>Choose your interview mode below</p>
            </div>

            {/* Mode Selection */}
            <div style={{ marginBottom:24 }}>
              <label className="form-label" style={{ marginBottom:10, display:'block' }}>Step 1 — Select Interview Mode</label>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {MODES.map(m => (
                  <div key={m.key} onClick={() => setMode(m.key)}
                    style={{ display:'flex', gap:14, padding:'14px 16px', borderRadius:12, cursor:'pointer',
                      border: `2px solid ${mode===m.key?'var(--accent)':'var(--border)'}`,
                      background: mode===m.key ? 'var(--accent-light)' : 'var(--bg-secondary)',
                      transition:'all 0.2s' }}>
                    <span style={{ fontSize:28 }}>{m.icon}</span>
                    <div>
                      <div style={{ fontWeight:600, fontSize:14, color: mode===m.key ? 'var(--accent-text)' : 'var(--text-primary)' }}>{m.title}</div>
                      <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>{m.desc}</div>
                    </div>
                    {mode===m.key && <span style={{ marginLeft:'auto', color:'var(--accent)', fontSize:20 }}>✓</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Config based on mode */}
            <div style={{ marginBottom:20 }}>
              <label className="form-label" style={{ marginBottom:10, display:'block' }}>Step 2 — Configure</label>

              {mode === 'domain' && (
                <div className="form-group">
                  <label className="form-label">Domain / Topic</label>
                  <select className="form-select" value={config.domain} onChange={e => setConfig(c=>({...c,domain:e.target.value}))}>
                    {DOMAINS.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
              )}

              {mode === 'role' && (
                <div className="form-group">
                  <label className="form-label">Target Role</label>
                  <select className="form-select" value={config.target_role} onChange={e => setConfig(c=>({...c,target_role:e.target.value}))}>
                    {ROLES.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
              )}

              {mode === 'resume' && (
                <div>
                  <div {...getRootProps()} className={`dropzone ${isDragActive?'active':''}`} style={{ marginBottom:10 }}>
                    <input {...getInputProps()} />
                    <div className="dropzone-icon">📄</div>
                    <div className="dropzone-title">
                      {resumeFile ? `✅ ${resumeFile}` : 'Drop your PDF resume here or click to upload'}
                    </div>
                    <div className="dropzone-sub">AI will read your resume and ask personalized questions</div>
                  </div>
                  {resumeFile && <div className="alert alert-success" style={{ fontSize:13 }}>✅ Resume loaded — interview will be tailored to your experience</div>}
                </div>
              )}

              <div className="form-group" style={{ marginTop:14 }}>
                <label className="form-label">Interview Type</label>
                <div style={{ display:'flex', gap:10 }}>
                  {[['technical','⚙️ Technical'],['hr','👔 HR'],['mixed','🔀 Mixed']].map(([t,l]) => (
                    <button key={t} onClick={() => setConfig(c=>({...c,type:t}))}
                      className={`btn ${config.type===t?'btn-primary':'btn-secondary'}`}
                      style={{ flex:1, justifyContent:'center' }}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Number of Questions: <strong>{config.num_questions}</strong></label>
                <input type="range" min={3} max={10} value={config.num_questions}
                  onChange={e => setConfig(c=>({...c,num_questions:+e.target.value}))} style={{ width:'100%' }} />
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'var(--text-muted)', marginTop:4 }}>
                  <span>3 (Quick ~6 min)</span><span>10 (Full Round ~20 min)</span>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="alert alert-info" style={{ marginBottom:20, fontSize:13 }}>
              💡 <strong>Tips:</strong> Use <strong>Chrome browser</strong> for mic • Allow mic when prompted •
              Speak clearly & naturally • No time pressure — answer at your own pace
            </div>

            {!micSupported && (
              <div className="alert alert-warning" style={{ marginBottom:16, fontSize:13 }}>
                ⚠️ Use Chrome for voice features. Other browsers can still type answers.
              </div>
            )}

            <button className="btn btn-primary" onClick={startInterview} disabled={loading}
              style={{ width:'100%', justifyContent:'center', height:52, fontSize:16 }}>
              {loading
                ? <><span className="spinner" style={{ width:18,height:18 }}/> Preparing interview...</>
                : `🚀 Start ${mode==='resume'?'Resume-Based':mode==='role'?'Role-Based':'Domain'} Interview`}
            </button>
          </div>
        </div>
      )}

      {/* ── INTERVIEW ROOM ── */}
      {stage === STAGES.INTERVIEW && question && (
        <div className="fade-in">
          {/* Progress */}
          <div style={{ background:'var(--bg-card)', padding:'14px 20px', borderRadius:12, border:'1px solid var(--border)', marginBottom:20 }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:8 }}>
              <span style={{ fontWeight:600 }}>Question {(progress.answered||0)+1} of {progress.total}</span>
              <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                {isListening && <span style={{ color:'var(--danger)', fontSize:12, fontWeight:600, animation:'pulse 1s infinite' }}>🔴 Recording</span>}
                {isSpeaking && <span style={{ color:'var(--warning)', fontSize:12, fontWeight:600 }}>🔊 AI Speaking</span>}
                {loading && <span style={{ color:'var(--accent)', fontSize:12, fontWeight:600 }}>⚡ Evaluating</span>}
              </div>
            </div>
            <div className="progress-bar" style={{ height:8 }}>
              <div className="progress-fill" style={{ width:`${((progress.answered||0)/progress.total)*100}%` }}/>
            </div>
          </div>

          <div className="grid-2" style={{ alignItems:'start', gap:20 }}>
            {/* LEFT */}
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {/* Webcam */}
              <div style={{ background:'#111', borderRadius:14, overflow:'hidden', aspectRatio:'4/3', position:'relative', display:'flex', alignItems:'center', justifyContent:'center', border:'2px solid var(--border)' }}>
                <video ref={videoRef} autoPlay muted playsInline style={{ width:'100%', height:'100%', objectFit:'cover', display:camOn?'block':'none' }}/>
                {!camOn && <div style={{ textAlign:'center', color:'#888' }}><div style={{ fontSize:52 }}>👤</div><div style={{ fontSize:12, marginTop:6 }}>No Camera</div></div>}
                <div style={{ position:'absolute', top:10, left:10, display:'flex', flexDirection:'column', gap:4 }}>
                  {isListening && <div style={{ background:'rgba(239,68,68,0.9)', color:'white', borderRadius:20, padding:'3px 10px', fontSize:11, fontWeight:600 }}>● Recording</div>}
                  {isSpeaking && <div style={{ background:'rgba(245,158,11,0.9)', color:'white', borderRadius:20, padding:'3px 10px', fontSize:11, fontWeight:600 }}>🔊 AI Speaking</div>}
                </div>
                <button onClick={camOn?stopCamera:startCamera}
                  style={{ position:'absolute', bottom:10, right:10, background:'rgba(0,0,0,0.6)', border:'none', color:'white', borderRadius:8, padding:'6px 10px', cursor:'pointer', fontSize:14 }}>
                  {camOn?'📷 Off':'📷 On'}
                </button>
              </div>

              {/* AI Status */}
              <div className="card" style={{ padding:16 }}>
                <div style={{ fontSize:13, fontWeight:600, marginBottom:10 }}>🤖 AI Interviewer Status</div>
                {[
                  { on:isSpeaking, c:'var(--warning)', label:'🔊 Speaking question...' },
                  { on:isListening, c:'var(--danger)',  label:'🎤 Listening to you...' },
                  { on:loading,     c:'var(--accent)',  label:'⚡ Evaluating answer...' },
                  { on:!isSpeaking&&!isListening&&!loading, c:'var(--success)', label:'✅ Ready for your answer' },
                ].map((s,i) => s.on && (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:s.c, fontWeight:500 }}>
                    <span style={{ width:8, height:8, borderRadius:'50%', background:s.c, display:'inline-block', animation: s.on&&(i===1)?'pulse 1s infinite':'none' }}/>
                    {s.label}
                  </div>
                ))}
              </div>

              {/* Session badges */}
              <div className="card" style={{ padding:16 }}>
                <div style={{ fontSize:13, fontWeight:600, marginBottom:8 }}>📊 Session Info</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  <span className="badge badge-primary">{interview?.domain || config.domain}</span>
                  <span className="badge badge-muted">{config.type}</span>
                  <span className="badge badge-info">{mode} mode</span>
                  <span className={`badge ${question.difficulty==='hard'?'badge-danger':question.difficulty==='medium'?'badge-warning':'badge-success'}`}>
                    {question.difficulty}
                  </span>
                </div>
              </div>
            </div>

            {/* RIGHT */}
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {/* Question */}
              <div className="card" style={{ border:`2px solid ${isSpeaking?'var(--warning)':'var(--border)'}`, transition:'border 0.3s' }}>
                <div style={{ display:'flex', gap:8, marginBottom:14, alignItems:'center', flexWrap:'wrap' }}>
                  <div style={{ width:34, height:34, borderRadius:8, background:'var(--accent)', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:15 }}>
                    Q{(progress.answered||0)+1}
                  </div>
                  <span className={`badge ${question.difficulty==='hard'?'badge-danger':question.difficulty==='medium'?'badge-warning':'badge-success'}`}>{question.difficulty}</span>
                  <span className="badge badge-info">{question.type}</span>
                  <button className="btn btn-ghost btn-sm" onClick={() => speakText(question.question, () => setTimeout(startListening,500))} style={{ marginLeft:'auto' }}>
                    🔊 Repeat
                  </button>
                </div>
                <p style={{ fontSize:16, fontWeight:600, lineHeight:1.8, marginBottom:12 }}>{question.question}</p>
                {question.hints?.length > 0 && (
                  <details>
                    <summary style={{ fontSize:13, color:'var(--accent)', cursor:'pointer', padding:'4px 0' }}>💡 Show Hints</summary>
                    <div style={{ marginTop:8, padding:'10px 14px', background:'var(--bg-secondary)', borderRadius:8 }}>
                      {question.hints.map((h,i) => <div key={i} style={{ fontSize:13, marginBottom:4 }}>• {h}</div>)}
                    </div>
                  </details>
                )}
              </div>

              {/* Evaluation */}
              {showEval && evaluation && (
                <div className="card" style={{ border:`2px solid ${timerColor(evaluation.score)}` }}>
                  <div style={{ display:'flex', gap:14 }}>
                    <div style={{ width:64, height:64, borderRadius:'50%', border:`4px solid ${timerColor(evaluation.score)}`, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <span style={{ fontSize:22, fontWeight:800, color:timerColor(evaluation.score) }}>{evaluation.score}</span>
                      <span style={{ fontSize:10, color:'var(--text-muted)' }}>/10</span>
                    </div>
                    <div>
                      <div style={{ fontWeight:600, marginBottom:4 }}>AI Feedback</div>
                      <div style={{ fontSize:13, color:'var(--text-secondary)', lineHeight:1.7 }}>{evaluation.feedback}</div>
                    </div>
                  </div>
                  {evaluation.strengths?.length > 0 && <div style={{ marginTop:10, fontSize:12, color:'var(--success)' }}>✅ {evaluation.strengths.join(' • ')}</div>}
                  {evaluation.improvements?.length > 0 && <div style={{ marginTop:6, fontSize:12, color:'var(--warning)' }}>💡 {evaluation.improvements.join(' • ')}</div>}
                  <div style={{ marginTop:10, fontSize:12, color:'var(--text-muted)', textAlign:'center' }}>⏳ AI preparing next question...</div>
                </div>
              )}

              {/* Answer Area */}
              {!showEval && (
                <div className="card">
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
                    <div style={{ fontWeight:600, fontSize:14 }}>
                      🎤 Your Answer
                      {isListening && <span style={{ color:'var(--danger)', fontSize:11, marginLeft:8 }}>● Live</span>}
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={() => setTranscript('')}>🗑 Clear</button>
                  </div>
                  <textarea
                    className="form-input form-textarea"
                    style={{ minHeight:140, marginBottom:14, fontSize:14, lineHeight:1.7,
                      border: isListening ? '2px solid var(--danger)' : isSpeaking ? '2px solid var(--warning)' : '1.5px solid var(--border)',
                      transition:'border 0.3s' }}
                    placeholder={
                      isSpeaking   ? '🔊 AI is asking the question...' :
                      isListening  ? '🎤 Listening... speak your answer clearly' :
                      loading      ? '⚡ AI is evaluating...' :
                      '🎤 Click "Start Speaking" or type your answer here...'
                    }
                    value={transcript}
                    onChange={e => setTranscript(e.target.value)}
                    disabled={loading || isSpeaking}
                  />
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:8 }}>
                    <button onClick={isListening ? stopListening : startListening}
                      disabled={loading || isSpeaking}
                      style={{ height:48, borderRadius:10, border:'none',
                        cursor: loading||isSpeaking ? 'not-allowed' : 'pointer',
                        background: isListening ? 'var(--danger)' : 'var(--success)',
                        color:'white', fontWeight:600, fontSize:14,
                        display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                        opacity: loading||isSpeaking ? 0.5 : 1,
                        animation: isListening ? 'pulse 2s infinite' : 'none' }}>
                      {isListening ? '⏹ Stop Recording' : '🎤 Start Speaking'}
                    </button>
                    <button className="btn btn-primary" onClick={() => handleSubmitAnswer(false)}
                      disabled={loading || !transcript.trim() || isSpeaking}
                      style={{ height:48, justifyContent:'center' }}>
                      {loading ? <><span className="spinner" style={{ width:16,height:16 }}/> Evaluating...</> : '✅ Submit Answer'}
                    </button>
                  </div>
                  <div style={{ fontSize:12, color:'var(--text-muted)', textAlign:'center' }}>
                    No time limit • Speak naturally • Submit when ready
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── RESULT ── */}
      {stage === STAGES.RESULT && finalResult && (
        <div style={{ maxWidth:680, margin:'0 auto' }} className="fade-in">
          <div className="card" style={{ textAlign:'center' }}>
            <div style={{ fontSize:80, marginBottom:12 }}>
              {finalResult.final_score>=80?'🏆':finalResult.final_score>=60?'🎉':finalResult.final_score>=40?'👍':'💪'}
            </div>
            <h2 style={{ fontSize:28, fontWeight:700, marginBottom:6 }}>Interview Complete!</h2>
            <p style={{ color:'var(--text-muted)', marginBottom:20 }}>Here's your detailed performance report</p>

            <div style={{ fontSize:60, fontWeight:800, color:'var(--accent)', margin:'0 0 20px' }}>{finalResult.final_score}%</div>

            <div style={{ display:'flex', gap:20, justifyContent:'center', marginBottom:28, flexWrap:'wrap' }}>
              {[
                { label:'Final Score', value:`${finalResult.final_score}%`, c:'var(--accent)' },
                { label:'Good Answers', value:finalResult.correct_count, c:'var(--success)' },
                { label:'Total Qs', value:finalResult.total_questions, c:'var(--text-primary)' },
                { label:'Grade', value:finalResult.final_score>=80?'A':finalResult.final_score>=60?'B':finalResult.final_score>=40?'C':'D',
                  c:finalResult.final_score>=80?'var(--success)':finalResult.final_score>=60?'var(--info)':'var(--warning)' },
              ].map(s => (
                <div key={s.label} style={{ textAlign:'center', minWidth:80 }}>
                  <div style={{ fontSize:30, fontWeight:800, color:s.c }}>{s.value}</div>
                  <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>{s.label}</div>
                </div>
              ))}
            </div>

            <div className="progress-bar" style={{ height:14, marginBottom:24 }}>
              <div className="progress-fill" style={{ width:`${finalResult.final_score}%` }}/>
            </div>

            <div style={{ background:'var(--bg-secondary)', padding:'18px 22px', borderRadius:12, fontSize:14, lineHeight:1.8, marginBottom:24, textAlign:'left' }}>
              <strong>📋 Overall Feedback:</strong><br/>{finalResult.overall_feedback}
            </div>

            <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
              <button className="btn btn-primary" onClick={reset}>🔄 Practice Again</button>
              <button className="btn btn-secondary" onClick={() => setStage(STAGES.HISTORY)}>📋 View History</button>
            </div>
          </div>
        </div>
      )}

      {/* ── HISTORY ── */}
      {stage === STAGES.HISTORY && (
        <div className="fade-in">
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16 }}>
            <div style={{ fontWeight:600, fontSize:16 }}>📋 Interview History</div>
            <button className="btn btn-primary btn-sm" onClick={reset}>+ New Interview</button>
          </div>
          {history.length > 0 ? (
            <div className="table-container">
              <table>
                <thead><tr><th>Role/Domain</th><th>Type</th><th>Score</th><th>Questions</th><th>Grade</th><th>Date</th></tr></thead>
                <tbody>
                  {history.map(h => {
                    const g = !h.total_score?'-':h.total_score>=80?'A':h.total_score>=60?'B':h.total_score>=40?'C':'D';
                    return (
                      <tr key={h.id}>
                        <td><strong>{h.domain}</strong></td>
                        <td><span className="badge badge-info">{h.interview_type}</span></td>
                        <td><span style={{ fontWeight:700, color:h.total_score>=70?'var(--success)':h.total_score>=50?'var(--warning)':'var(--danger)' }}>{h.total_score?`${h.total_score}%`:'Incomplete'}</span></td>
                        <td>{h.correct_count}/{h.total_questions}</td>
                        <td><span className={`badge ${g==='A'?'badge-success':g==='B'?'badge-info':g==='C'?'badge-warning':g==='-'?'badge-muted':'badge-danger'}`}>{g}</span></td>
                        <td className="text-muted">{h.started_at?new Date(h.started_at).toLocaleDateString('en-IN'):'-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">🎤</div>
              <div className="empty-title">No interviews yet</div>
              <button className="btn btn-primary" onClick={reset}>Start First Interview</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}