// ============================================================
// pages/ChatbotPage.jsx - ChatGPT-Style AI Career Chatbot
// ============================================================

import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'react-toastify';
import api from '../utils/api';

const ALL_PROMPTS = [
  "What career path should I choose as a CS student?",
  "Which is better — service company or startup for freshers?",
  "How do I switch from service to product company?",
  "What skills are hot in the job market right now?",
  "Create a 3-month Python roadmap for me",
  "What projects should I add to my portfolio?",
  "How do I prepare for a FAANG interview?",
  "Top 10 DSA topics I must know for placements",
  "How do I crack system design interviews?",
  "How do I negotiate salary as a fresher?",
  "What is the average salary for a React developer in India?",
  "How to get a ₹10 LPA package as a fresher?",
  "How to write a strong resume objective?",
  "What should I put in my GitHub profile?",
  "How do I get an internship at Google or Microsoft?",
  "Best platforms to find internships in India?",
  "How to crack Internshala internship interviews?",
  "What certifications should I do as a CS student?",
];

// ── Copy Button ───────────────────────────────────────────
function CopyButton({ text, label = '📋 Copy' }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { toast.error('Could not copy'); }
  };
  return (
    <button onClick={handleCopy}
      style={{
        background:'none', border:'1px solid var(--border)', borderRadius:6,
        padding:'3px 10px', cursor:'pointer', fontSize:12,
        color: copied ? 'var(--success)' : 'var(--text-muted)',
        display:'inline-flex', alignItems:'center', gap:4, transition:'all 0.2s'
      }}>
      {copied ? '✅ Copied!' : label}
    </button>
  );
}

// ── Markdown Components ───────────────────────────────────
const MD = {
  p: ({ children }) => (
    <p style={{ margin:'0 0 10px', lineHeight:1.8, color:'var(--text-primary)' }}>{children}</p>
  ),
  strong: ({ children }) => (
    <strong style={{ fontWeight:700, color:'var(--text-primary)', display:'inline-block' }}>{children}</strong>
  ),
  em: ({ children }) => (
    <em style={{ fontStyle:'italic' }}>{children}</em>
  ),
  h1: ({ children }) => (
    <h1 style={{ fontSize:18, fontWeight:700, margin:'16px 0 8px', borderBottom:'1px solid var(--border)', paddingBottom:6 }}>{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 style={{ fontSize:16, fontWeight:700, margin:'14px 0 6px' }}>{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 style={{ fontSize:14, fontWeight:700, margin:'12px 0 6px', color:'var(--accent)' }}>{children}</h3>
  ),
  ul: ({ children }) => (
    <ul style={{ margin:'8px 0 10px', paddingLeft:22, display:'flex', flexDirection:'column', gap:5 }}>{children}</ul>
  ),
  ol: ({ children }) => (
    <ol style={{ margin:'8px 0 10px', paddingLeft:22, display:'flex', flexDirection:'column', gap:5 }}>{children}</ol>
  ),
  li: ({ children }) => (
    <li style={{ lineHeight:1.8, paddingLeft:2, color:'var(--text-primary)' }}>{children}</li>
  ),
  hr: () => (
    <hr style={{ border:'none', borderTop:'1px solid var(--border)', margin:'14px 0' }} />
  ),
  br: () => (
    <br style={{ display:'block', marginBottom:6 }} />
  ),
  blockquote: ({ children }) => (
    <blockquote style={{
      borderLeft:'3px solid var(--accent)', margin:'10px 0',
      color:'var(--text-secondary)', fontStyle:'italic',
      background:'var(--accent-light)', borderRadius:'0 8px 8px 0',
      padding:'10px 14px'
    }}>
      {children}
    </blockquote>
  ),
  code: ({ inline, children }) => inline ? (
    <code style={{
      background:'var(--bg-tertiary)', padding:'2px 6px', borderRadius:4,
      fontFamily:'monospace', fontSize:12, color:'var(--accent)',
      border:'1px solid var(--border)'
    }}>
      {children}
    </code>
  ) : (
    <div style={{ position:'relative', margin:'12px 0' }}>
      <div style={{ position:'absolute', top:8, right:8, zIndex:1 }}>
        <CopyButton text={String(children)} label="📋 Copy code" />
      </div>
      <pre style={{
        background:'#1e1e2e', color:'#cdd6f4', padding:'14px 16px',
        paddingRight:110, borderRadius:10, overflowX:'auto',
        fontFamily:'monospace', fontSize:13, lineHeight:1.7,
        margin:0, border:'1px solid var(--border)'
      }}>
        <code>{children}</code>
      </pre>
    </div>
  ),
  table: ({ children }) => (
    <div style={{ overflowX:'auto', margin:'14px 0', borderRadius:10, border:'1px solid var(--border)' }}>
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead style={{ background:'var(--bg-secondary)' }}>{children}</thead>
  ),
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => (
    <tr style={{ borderBottom:'1px solid var(--border)' }}>{children}</tr>
  ),
  th: ({ children }) => (
    <th style={{
      padding:'10px 14px', textAlign:'left', fontWeight:700,
      color:'var(--text-secondary)', fontSize:12,
      textTransform:'uppercase', letterSpacing:'0.04em',
      whiteSpace:'nowrap', background:'var(--bg-secondary)'
    }}>
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td style={{
      padding:'12px 14px', color:'var(--text-primary)',
      lineHeight:1.75, verticalAlign:'top',
      whiteSpace:'pre-line'
    }}>
      {children}
    </td>
  ),
};

// ── Message Bubble ────────────────────────────────────────
function MessageBubble({ msg }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(msg.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  if (msg.role === 'user') {
    return (
      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:18 }}>
        <div style={{
          maxWidth:'75%', background:'var(--accent)', color:'white',
          padding:'12px 18px', borderRadius:'18px 18px 4px 18px',
          fontSize:14, lineHeight:1.65
        }}>
          {msg.content}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display:'flex', gap:12, marginBottom:22, alignItems:'flex-start' }}>
      {/* AI Avatar */}
      <div style={{
        width:34, height:34, borderRadius:10,
        background:'linear-gradient(135deg,#6366f1,#8b5cf6)',
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:18, flexShrink:0, marginTop:2
      }}>
        🤖
      </div>
      {/* Content */}
      <div style={{ flex:1 }}>
        <div style={{
          background:'var(--bg-card)', border:'1px solid var(--border)',
          borderRadius:'4px 18px 18px 18px', padding:'16px 20px',
          fontSize:14, lineHeight:1.8, boxShadow:'var(--shadow-sm)'
        }}>
          <ReactMarkdown components={MD}>{msg.content}</ReactMarkdown>
        </div>
        {/* Copy button */}
        <div style={{ marginTop:6, paddingLeft:4 }}>
          <button onClick={handleCopy}
            style={{
              background:'none', border:'none', cursor:'pointer', fontSize:12,
              color: copied ? 'var(--success)' : 'var(--text-muted)',
              display:'inline-flex', alignItems:'center', gap:4,
              padding:'2px 6px', borderRadius:4, transition:'all 0.2s'
            }}>
            {copied ? '✅ Copied!' : '📋 Copy response'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Chatbot Page ─────────────────────────────────────
export default function ChatbotPage() {
  const [sessions, setSessions]         = useState([]);
  const [sessionId, setSessionId]       = useState(null);
  const [messages, setMessages]         = useState([]);
  const [input, setInput]               = useState('');
  const [loading, setLoading]           = useState(false);
  const [randomPrompts, setRandomPrompts] = useState([]);
  const messagesEndRef = useRef(null);
  const textareaRef    = useRef(null);

  useEffect(() => {
    api.get('/chatbot/sessions').then(r => setSessions(r.data.sessions || [])).catch(() => {});
    shufflePrompts();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior:'smooth' });
  }, [messages, loading]);

  const shufflePrompts = () => {
    const shuffled = [...ALL_PROMPTS].sort(() => Math.random() - 0.5).slice(0, 6);
    setRandomPrompts(shuffled);
  };

  const loadSession = async (id) => {
    try {
      const res = await api.get(`/chatbot/sessions/${id}`);
      setMessages(res.data.messages || []);
      setSessionId(id);
    } catch { toast.error('Could not load session'); }
  };

  const sendMessage = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setMessages(m => [...m, { role:'user', content:msg }]);
    setLoading(true);

    try {
      let res;
      try {
        res = await api.post('/chatbot/message', { message:msg, session_id:sessionId });
      } catch {
        await new Promise(r => setTimeout(r, 2000));
        res = await api.post('/chatbot/message', { message:msg, session_id:sessionId });
      }

      const response = res.data?.response || res.data?.message || 'Sorry, could not generate a response. Please try again.';
      const newId    = res.data?.session_id;

      if (!sessionId && newId) {
        setSessionId(newId);
        setSessions(s => [{ id:newId, title:msg.slice(0,50), created_at:new Date().toISOString() }, ...s]);
      }
      setMessages(m => [...m, { role:'assistant', content:response }]);
    } catch {
      setMessages(m => [...m, { role:'assistant', content:'Sorry, AI is busy right now. Please wait a moment and try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const newChat = () => {
    setSessionId(null);
    setMessages([]);
    shufflePrompts();
  };

  const deleteSession = async (id, e) => {
    e.stopPropagation();
    await api.delete(`/chatbot/sessions/${id}`);
    setSessions(s => s.filter(x => x.id !== id));
    if (sessionId === id) newChat();
  };

  return (
    <div style={{ height:'calc(100vh - 64px - 56px)', display:'flex', gap:20, overflow:'hidden' }}>

      {/* ── Sidebar ── */}
      <div style={{ width:260, flexShrink:0, display:'flex', flexDirection:'column', gap:10 }}>
        <button className="btn btn-primary" onClick={newChat} style={{ justifyContent:'center' }}>
          ✏️ New Chat
        </button>
        <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:4 }}>
          {sessions.map(s => (
            <div key={s.id} onClick={() => loadSession(s.id)}
              style={{
                padding:'9px 12px', borderRadius:8, cursor:'pointer',
                background: sessionId===s.id ? 'var(--accent-light)' : 'var(--bg-card)',
                border:`1px solid ${sessionId===s.id ? 'var(--accent)' : 'var(--border)'}`,
                display:'flex', justifyContent:'space-between', alignItems:'center',
                gap:6, transition:'all 0.2s'
              }}>
              <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1, fontSize:13 }}>
                💬 {s.title}
              </span>
              <button onClick={(e) => deleteSession(s.id, e)}
                style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', fontSize:14, flexShrink:0 }}>
                ✕
              </button>
            </div>
          ))}
          {sessions.length === 0 && (
            <div style={{ fontSize:13, color:'var(--text-muted)', padding:12, textAlign:'center' }}>
              No conversations yet
            </div>
          )}
        </div>
      </div>

      {/* ── Chat Area ── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', background:'var(--bg-card)', borderRadius:14, border:'1px solid var(--border)', overflow:'hidden' }}>

        {/* Header */}
        <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,#6366f1,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>
              🤖
            </div>
            <div>
              <div style={{ fontWeight:600, fontSize:15 }}>AI Career Advisor</div>
              <div style={{ fontSize:12, color:'var(--success)' }}>● Online • Powered by AI</div>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={shufflePrompts} title="Get new suggestions">
            🔄 New Suggestions
          </button>
        </div>

        {/* Messages */}
        <div style={{ flex:1, overflowY:'auto', padding:'24px' }}>
          {messages.length === 0 && (
            <div style={{ textAlign:'center', padding:'32px 20px' }}>
              <div style={{ fontSize:52, marginBottom:12 }}>🤖</div>
              <div style={{ fontSize:20, fontWeight:700, marginBottom:8 }}>AI Career Advisor</div>
              <div style={{ fontSize:14, color:'var(--text-muted)', marginBottom:28, maxWidth:420, margin:'0 auto 28px', lineHeight:1.7 }}>
                Your personal AI career guide. Ask me anything about jobs, skills, interviews, salary, and career growth.
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8, justifyContent:'center', maxWidth:560, margin:'0 auto' }}>
                {randomPrompts.map(p => (
                  <button key={p} onClick={() => sendMessage(p)}
                    style={{
                      padding:'9px 16px', background:'var(--bg-secondary)',
                      color:'var(--text-secondary)', border:'1px solid var(--border)',
                      borderRadius:20, fontSize:13, cursor:'pointer', fontWeight:500,
                      transition:'all 0.2s', textAlign:'left'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = 'var(--accent)';
                      e.currentTarget.style.color = 'var(--accent)';
                      e.currentTarget.style.background = 'var(--accent-light)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'var(--border)';
                      e.currentTarget.style.color = 'var(--text-secondary)';
                      e.currentTarget.style.background = 'var(--bg-secondary)';
                    }}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <MessageBubble key={i} msg={msg} />
          ))}

          {loading && (
            <div style={{ display:'flex', gap:12, marginBottom:20, alignItems:'flex-start' }}>
              <div style={{ width:34, height:34, borderRadius:10, background:'linear-gradient(135deg,#6366f1,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>
                🤖
              </div>
              <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'4px 18px 18px 18px', padding:'14px 18px' }}>
                <div style={{ display:'flex', gap:5, alignItems:'center' }}>
                  <span style={{ fontSize:13, color:'var(--text-muted)' }}>AI is thinking</span>
                  {[0, 0.2, 0.4].map((d, i) => (
                    <span key={i} style={{
                      width:6, height:6, borderRadius:'50%', background:'var(--accent)',
                      display:'inline-block', animation:`pulse 1.2s ${d}s ease-in-out infinite`
                    }}/>
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef}/>
        </div>

        {/* Input */}
        <div style={{ padding:'14px 20px', borderTop:'1px solid var(--border)', background:'var(--bg-secondary)' }}>
          <div style={{ display:'flex', gap:10, alignItems:'flex-end' }}>
            <textarea
              ref={textareaRef}
              className="form-input"
              style={{
                flex:1, resize:'none', minHeight:44, maxHeight:140,
                lineHeight:1.6, padding:'10px 14px', fontSize:14,
                overflowY:'auto', borderRadius:12
              }}
              placeholder="Ask about career, skills, interviews, salary... (Enter to send, Shift+Enter for new line)"
              value={input}
              rows={1}
              onChange={e => {
                setInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 140) + 'px';
              }}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              disabled={loading}
            />
            <button className="btn btn-primary"
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              style={{ height:44, width:44, padding:0, justifyContent:'center', borderRadius:10, flexShrink:0 }}>
              {loading
                ? <span className="spinner" style={{ width:16, height:16 }}/>
                : <span style={{ fontSize:18 }}>➤</span>}
            </button>
          </div>
          <div style={{ textAlign:'center', fontSize:11, color:'var(--text-muted)', marginTop:8 }}>
            Enter to send • Shift+Enter for new line
          </div>
        </div>
      </div>
    </div>
  );
}