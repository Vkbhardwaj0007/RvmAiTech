import { useState, useRef, useEffect } from 'react';
import client from '../api/client';
import { Sparkles, X, Send, Bot, MessageSquare, ArrowRight, RefreshCw, User } from 'lucide-react';

const SUGGESTIONS = [
  '🚗 Smart Parking kaise kaam karta hai?',
  '⚡ Custom PCB Design ka kya process hai?',
  '🏭 Industrial IoT & Modbus telemetry details',
  '🎓 School ERP ke key features kya hain?',
  '🏨 Hotel PMS software me kya milta hai?',
  '💰 Project pricing & quotation kaise milega?',
];

export default function AiAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Hello Sir / Madam! 👋\n\n**Welcome to RvmAiTech.**\n\nHow can I help you today? Feel free to ask about our projects (Smart Parking, Industrial IoT, Custom PCB, School/Hotel ERP) or any custom engineering requirements.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    if (open) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  const handleSend = async (textToSend) => {
    const q = (textToSend || input).trim();
    if (!q || loading) return;

    const userMsg = { role: 'user', text: q };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.slice(-6).map((m) => ({
        role: m.role === 'user' ? 'user' : 'model',
        text: m.text,
      }));

      const res = await client.post('/ai/ask', { message: q, history });
      const reply = res.data?.reply || 'Dhanyawad! Hamari team aapki requirement review karke WhatsApp par connect karegi (+91 70520 50656).';
      setMessages((prev) => [...prev, { role: 'assistant', text: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'Maaf kijiye, server busy hai. Aap direct hamare Lead System Architect se WhatsApp par instantly baat kar sakte hain: **+91 70520 50656**',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsApp = (topic = 'AI Inquiry') => {
    const text = encodeURIComponent(`Hello RvmAiTech Team! I was chatting with your website AI Assistant regarding: "${topic}". Please share technical details.`);
    window.open(`https://wa.me/917052050656?text=${text}`, '_blank');
  };

  // Basic formatting helper for bold and bullets
  const renderFormattedText = (raw) => {
    const lines = raw.split('\n');
    return lines.map((line, lIdx) => {
      // Bold rendering
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const renderedLine = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={pIdx} style={{ color: '#0d2649', fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      return (
        <span key={lIdx} style={{ display: 'block', minHeight: line.trim() ? 'auto' : 8 }}>
          {renderedLine}
        </span>
      );
    });
  };

  return (
    <>
      {/* Floating Trigger Button (Positioned cleanly above WhatsApp button) */}
      <div
        style={{
          position: 'fixed',
          right: 22,
          bottom: 88,
          zIndex: 85,
        }}
      >
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-label="Open AI Assistant"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            padding: '9px 18px',
            borderRadius: 30,
            background: 'linear-gradient(135deg, #0d2649 0%, #1a4a8f 100%)',
            color: '#ffffff',
            border: '1.5px solid #f47b20',
            boxShadow: '0 10px 26px -6px rgba(13, 38, 73, 0.65), 0 0 14px rgba(244, 123, 32, 0.35)',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: 14,
            fontWeight: 700,
            transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 14px 30px -6px rgba(244, 123, 32, 0.6)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1) translateY(0)';
            e.currentTarget.style.boxShadow = '0 10px 26px -6px rgba(13, 38, 73, 0.65), 0 0 14px rgba(244, 123, 32, 0.35)';
          }}
        >
          <img
            src="/brand/rvmaitech-logo-light.png"
            alt="RvmAiTech"
            style={{
              height: 20,
              width: 'auto',
              objectFit: 'contain',
              display: 'block',
            }}
          />
          <span style={{ fontSize: 11, fontWeight: 800, background: 'rgba(244, 123, 32, 0.3)', border: '1px solid #f47b20', color: '#ffb273', padding: '1px 7px', borderRadius: 8, letterSpacing: '0.04em' }}>AI</span>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#22c55e',
              boxShadow: '0 0 6px #22c55e',
            }}
          />
        </button>
      </div>

      {/* Floating AI Chat Window Drawer */}
      {open && (
        <div
          style={{
            position: 'fixed',
            right: 20,
            bottom: 20,
            width: 'min(420px, calc(100vw - 32px))',
            height: 'min(580px, calc(100vh - 40px))',
            background: '#ffffff',
            borderRadius: 20,
            boxShadow: '0 24px 60px -15px rgba(13, 38, 73, 0.5), 0 0 0 1px rgba(13, 38, 73, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 9999,
            animation: 'aiPopIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* Header */}
          <div
            style={{
              background: 'linear-gradient(135deg, #0d2649 0%, #153c6f 100%)',
              padding: '16px 18px',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '2px solid #f47b20',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  height: 38,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <img
                  src="/brand/rvmaitech-logo-light.png"
                  alt="RvmAiTech"
                  style={{ height: 28, width: 'auto', objectFit: 'contain', display: 'block' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, background: 'rgba(244, 123, 32, 0.3)', border: '1px solid #f47b20', color: '#ffb273', padding: '1px 7px', borderRadius: 8, letterSpacing: '0.04em' }}>AI ASSISTANT</span>
                </div>
                <div style={{ fontSize: 11.5, color: '#b6c6de', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
                  Online · Instant Project Expert
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              style={{
                background: 'rgba(255, 255, 255, 0.12)',
                border: 'none',
                borderRadius: '50%',
                width: 32,
                height: 32,
                color: '#ffffff',
                display: 'grid',
                placeItems: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Quick Suggestions Chips */}
          <div
            style={{
              padding: '10px 14px',
              background: '#f8fbff',
              borderBottom: '1px solid #e5effa',
              display: 'flex',
              gap: 6,
              overflowX: 'auto',
              whiteSpace: 'nowrap',
              scrollbarWidth: 'none',
            }}
          >
            {SUGGESTIONS.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(s)}
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  padding: '5px 11px',
                  borderRadius: 14,
                  background: '#ffffff',
                  border: '1px solid #d0deef',
                  color: '#1e3a5f',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#f47b20';
                  e.currentTarget.style.color = '#f47b20';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#d0deef';
                  e.currentTarget.style.color = '#1e3a5f';
                }}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Messages Area */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              background: '#f4f8fd',
            }}
          >
            {messages.map((m, idx) => {
              const isUser = m.role === 'user';
              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isUser ? 'flex-end' : 'flex-start',
                    maxWidth: '88%',
                    alignSelf: isUser ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div
                    style={{
                      background: isUser ? '#f47b20' : '#ffffff',
                      color: isUser ? '#ffffff' : '#223249',
                      padding: '12px 14px',
                      borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      fontSize: 14,
                      lineHeight: 1.55,
                      boxShadow: isUser
                        ? '0 6px 16px rgba(244, 123, 32, 0.35)'
                        : '0 4px 14px rgba(13, 38, 73, 0.08)',
                      border: isUser ? 'none' : '1px solid #dce8f8',
                      wordBreak: 'break-word',
                    }}
                  >
                    {renderFormattedText(m.text)}
                  </div>

                  {!isUser && (
                    <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                      <button
                        type="button"
                        onClick={() => handleWhatsApp(m.text.slice(0, 40))}
                        style={{
                          fontSize: 11.5,
                          fontWeight: 700,
                          background: '#eafaf1',
                          color: '#107e44',
                          border: '1px solid #bbf7d0',
                          padding: '3px 9px',
                          borderRadius: 12,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <MessageSquare size={12} /> WhatsApp Quote
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {loading && (
              <div
                style={{
                  alignSelf: 'flex-start',
                  background: '#ffffff',
                  border: '1px solid #dce8f8',
                  padding: '10px 16px',
                  borderRadius: '16px 16px 16px 4px',
                  fontSize: 13,
                  color: '#0d2649',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <img
                  src="/brand/rvmaitech-logo-light.png"
                  alt="RvmAiTech"
                  style={{
                    height: 16,
                    width: 'auto',
                    objectFit: 'contain',
                    display: 'block',
                  }}
                />
                <span>RvmAiTech is thinking...</span>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Footer Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            style={{
              padding: '10px 12px',
              background: '#ffffff',
              borderTop: '1px solid #dce8f8',
              display: 'flex',
              gap: 8,
              alignItems: 'center',
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything (e.g. Smart parking specs?)..."
              disabled={loading}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: 24,
                border: '1.5px solid #ccd9ea',
                fontSize: 14,
                outline: 'none',
                background: '#f8fbff',
                color: '#0d2649',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#f47b20';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#ccd9ea';
              }}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: input.trim() ? '#f47b20' : '#d0deef',
                color: '#ffffff',
                border: 'none',
                display: 'grid',
                placeItems: 'center',
                cursor: input.trim() ? 'pointer' : 'default',
                transition: 'all 0.2s ease',
              }}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

