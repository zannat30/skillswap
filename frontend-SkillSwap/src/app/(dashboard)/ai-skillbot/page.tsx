'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Send, Map, Star, ArrowUpRight } from 'lucide-react';
import { apiRequest } from '@/lib/apiClient';
import { useAuth } from '@/context/AuthContext';

interface SuggestedMentorItem {
  userId: string;
  displayName: string;
  rating: number;
  totalSessions: number;
  matchingSkill: string;
}

interface RoadmapWeek {
  week: number;
  title: string;
  tasks: string[];
}

interface BotChatItem {
  id: string;
  sender: 'bot' | 'user';
  text?: string;
  questionTopic?: string;
  steps?: string[];
  roadmapWeeks?: RoadmapWeek[];
  suggestedMentors?: SuggestedMentorItem[];
}

export default function AISkillBotPage() {
  const router = useRouter();
  const { user, setSearchQuery } = useAuth();
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [messages, setMessages] = useState<BotChatItem[]>([
    {
      id: 'welcome-msg',
      sender: 'bot',
      text: "Hello! I'm SkillBot, your AI mentor. You can ask me technical questions, generate a 4-week learning roadmap, or request a mentor recommendation for a specific skill. How can I help you today?"
    }
  ]);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Feature #42 & #44: Ask AI SkillBot (/api/ai/ask)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMsg: BotChatItem = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: trimmed
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await apiRequest('/ai/ask', {
        method: 'POST',
        body: JSON.stringify({ question: trimmed })
      });

      const botMsg: BotChatItem = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        questionTopic: trimmed,
        text: res?.answer,
        steps: res?.steps,
        suggestedMentors: res?.suggestedMentors
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      if (err?.code === 'FORBIDDEN_DOMAIN') {
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-err-${Date.now()}`,
            sender: 'bot',
            text: `⚠️ 403 FORBIDDEN_DOMAIN: ${err.message}`
          }
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            sender: 'bot',
            questionTopic: trimmed,
            text: `Based on your question about "${trimmed}", here is a structured learning path:`,
            steps: [
              'Understand the core fundamentals.',
              'Build a small practical project.',
              'Book a session with a mentor on our marketplace to review your code!'
            ]
          }
        ]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Feature #43: Generate Multi-Week Learning Roadmap (/api/ai/roadmap)
  const handleGenerateRoadmap = async (customTopic?: string) => {
    const topic = (customTopic || input || 'React.js & Next.js Architecture').trim();
    if (isLoading) return;

    const userMsg: BotChatItem = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: `Generate a 4-week learning roadmap for: ${topic}`
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await apiRequest('/ai/roadmap', {
        method: 'POST',
        body: JSON.stringify({ topic })
      });

      const botMsg: BotChatItem = {
        id: `bot-roadmap-${Date.now()}`,
        sender: 'bot',
        questionTopic: topic,
        text: res?.roadmapMarkdown,
        roadmapWeeks: res?.weeks,
        suggestedMentors: res?.suggestedMentors
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          sender: 'bot',
          text:
            err?.code === 'FORBIDDEN_DOMAIN'
              ? `⚠️ 403 FORBIDDEN_DOMAIN: ${err.message}`
              : err.message || 'Unable to generate roadmap.'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookSuggestedMentor = (mentorName: string) => {
    setSearchQuery(mentorName);
    router.push('/marketplace');
  };

  return (
    <div className="chat-container glass-card">
      <div
        className="card-header flex-between"
        style={{ borderBottom: '1px solid var(--border-glass)', flexWrap: 'wrap', gap: '10px' }}
      >
        <div className="flex items-center gap-3">
          <div className="msg-avatar bot-avatar">
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className="font-bold glowing-text">SkillBot AI</h3>
            <p className="text-xs text-secondary">
              Powered by Google Gemini • Technical Q&amp;A, 4-Week Roadmaps &amp; Mentor Matchmaking
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleGenerateRoadmap(input || 'React.js State Management')}
            className="btn glass-btn"
            style={{ padding: '7px 12px', fontSize: '0.78rem' }}
            title="Generate a structured 4-week learning roadmap via POST /api/ai/roadmap"
          >
            <Map size={14} className="text-emerald" /> Generate 4-Week Roadmap
          </button>
        </div>
      </div>

      <div className="chat-messages custom-scrollbar" id="chat-messages">
        {messages.map((msg) =>
          msg.sender === 'bot' ? (
            <div key={msg.id} className="message msg-bot">
              <div className="msg-avatar bot-avatar">
                <Sparkles style={{ width: '20px', height: '20px' }} />
              </div>
              <div className="msg-bubble" style={{ maxWidth: '82%' }}>
                {/* Render AI Answer Text */}
                {msg.text && (
                  <div
                    style={{
                      whiteSpace: 'pre-wrap',
                      lineHeight: 1.55,
                      marginBottom:
                        (msg.steps && msg.steps.length > 0) ||
                        (msg.roadmapWeeks && msg.roadmapWeeks.length > 0) ||
                        (msg.suggestedMentors && msg.suggestedMentors.length > 0)
                          ? '12px'
                          : 0
                    }}
                  >
                    {msg.text}
                  </div>
                )}

                {/* Render Actionable Steps if present */}
                {msg.steps && msg.steps.length > 0 && (
                  <ol
                    style={{
                      marginLeft: '20px',
                      color: 'var(--accent-cyan)',
                      marginBottom:
                        msg.suggestedMentors && msg.suggestedMentors.length > 0 ? '12px' : 0
                    }}
                  >
                    {msg.steps.map((step, i) => (
                      <li key={i} style={{ marginBottom: '4px' }}>
                        {step}
                      </li>
                    ))}
                  </ol>
                )}

                {/* Render 4-Week Structured Roadmap Cards (Feature #43) */}
                {msg.roadmapWeeks && msg.roadmapWeeks.length > 0 && (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '8px',
                      marginBottom: '12px'
                    }}
                  >
                    {msg.roadmapWeeks.map((wk) => (
                      <div
                        key={wk.week}
                        style={{
                          background: 'rgba(11, 15, 25, 0.65)',
                          border: '1px solid var(--border-glass)',
                          borderRadius: '10px',
                          padding: '10px'
                        }}
                      >
                        <div
                          className="text-xs font-bold text-emerald uppercase mb-1"
                        >
                          Week {wk.week}: {wk.title}
                        </div>
                        <ul
                          style={{
                            marginLeft: '16px',
                            fontSize: '0.76rem',
                            color: 'var(--text-secondary)'
                          }}
                        >
                          {wk.tasks.map((t, idx) => (
                            <li key={idx}>{t}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}

                {/* Render 3 AI-Suggested Mentors from Marketplace (Feature #44) */}
                {msg.suggestedMentors && msg.suggestedMentors.length > 0 && (
                  <div
                    style={{
                      borderTop: '1px solid var(--border-glass)',
                      paddingTop: '10px',
                      marginTop: '8px'
                    }}
                  >
                    <p className="text-xs text-secondary uppercase font-bold mb-2">
                      Recommended SkillSwap Mentors (50 CR / 60-Min Session):
                    </p>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
                        gap: '8px'
                      }}
                    >
                      {msg.suggestedMentors.map((m) => (
                        <div
                          key={m.userId}
                          style={{
                            background: 'rgba(15, 23, 42, 0.75)',
                            border: '1px solid var(--border-glass)',
                            borderRadius: '10px',
                            padding: '8px 10px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            gap: '6px'
                          }}
                        >
                          <div>
                            <div className="flex-between">
                              <span className="font-bold text-sm">{m.displayName}</span>
                              <span className="text-amber text-xs flex items-center gap-1">
                                <Star size={11} fill="currentColor" /> {m.rating}
                              </span>
                            </div>
                            <p
                              className="text-xs"
                              style={{ color: 'var(--accent-emerald)', marginTop: '2px' }}
                            >
                              {m.matchingSkill}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleBookSuggestedMentor(m.displayName)}
                            className="btn glass-btn w-full"
                            style={{
                              padding: '5px 8px',
                              fontSize: '0.73rem',
                              justifyContent: 'center'
                            }}
                          >
                            <span>View &amp; Book</span>
                            <ArrowUpRight size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div key={msg.id} className="message msg-user">
              <div className="msg-avatar user-avatar">
                {user?.initials || 'Z'}
              </div>
              <div className="msg-bubble">{msg.text}</div>
            </div>
          )
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="chat-input-area">
        <form id="chat-form" className="input-wrapper" onSubmit={handleSubmit}>
          <input
            type="text"
            id="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a technical question (e.g. React useEffect) or enter a skill for a 4-week roadmap..."
            autoComplete="off"
            required
          />
          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary"
            style={{ padding: '12px', borderRadius: '50%' }}
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
