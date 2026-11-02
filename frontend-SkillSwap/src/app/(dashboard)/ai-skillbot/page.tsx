'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Send, Map, Star, ArrowUpRight } from 'lucide-react';
import { apiRequest } from '@/lib/apiClient';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

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
    <Card className="chat-container">
      <div
        className="card-header flex-between"
        style={{
          borderBottom: '1px solid var(--shadcn-border)',
          flexWrap: 'wrap',
          gap: '10px',
          background: '#09090b'
        }}
      >
        <div className="flex items-center gap-3">
          <div className="msg-avatar bot-avatar">
            <Sparkles size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold glowing-text">SkillBot AI</h3>
              <Badge variant="cyan">Gemini 2.5</Badge>
            </div>
            <p className="text-xs text-secondary">
              Technical Q&amp;A, 4-Week Study Roadmaps &amp; Marketplace Mentor Matchmaking
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isLoading}
            onClick={() => handleGenerateRoadmap(input || 'React.js State Management')}
            title="Generate a structured 4-week learning roadmap via POST /api/ai/roadmap"
          >
            <Map size={14} className="text-emerald" /> Generate 4-Week Roadmap
          </Button>
        </div>
      </div>

      <div className="chat-messages custom-scrollbar" id="chat-messages">
        {messages.map((msg) =>
          msg.sender === 'bot' ? (
            <div key={msg.id} className="message msg-bot">
              <div className="msg-avatar bot-avatar">
                <Sparkles style={{ width: '20px', height: '20px' }} />
              </div>
              <div
                className="msg-bubble"
                style={{
                  maxWidth: '84%',
                  background: '#121216',
                  borderColor: 'var(--shadcn-border)'
                }}
              >
                {msg.text && (
                  <div
                    style={{
                      whiteSpace: 'pre-wrap',
                      lineHeight: 1.6,
                      marginBottom:
                        (msg.steps && msg.steps.length > 0) ||
                        (msg.roadmapWeeks && msg.roadmapWeeks.length > 0) ||
                        (msg.suggestedMentors && msg.suggestedMentors.length > 0)
                          ? '14px'
                          : 0
                    }}
                  >
                    {msg.text}
                  </div>
                )}

                {msg.steps && msg.steps.length > 0 && (
                  <ol
                    style={{
                      marginLeft: '20px',
                      color: 'var(--accent-cyan)',
                      marginBottom:
                        msg.suggestedMentors && msg.suggestedMentors.length > 0 ? '14px' : 0
                    }}
                  >
                    {msg.steps.map((step, i) => (
                      <li key={i} style={{ marginBottom: '4px' }}>
                        {step}
                      </li>
                    ))}
                  </ol>
                )}

                {msg.roadmapWeeks && msg.roadmapWeeks.length > 0 && (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '10px',
                      marginBottom: '14px'
                    }}
                  >
                    {msg.roadmapWeeks.map((wk) => (
                      <Card
                        key={wk.week}
                        style={{
                          background: '#09090b',
                          padding: '12px'
                        }}
                      >
                        <Badge variant="emerald" style={{ marginBottom: '8px' }}>
                          Week {wk.week}: {wk.title}
                        </Badge>
                        <ul
                          style={{
                            marginLeft: '16px',
                            fontSize: '0.78rem',
                            color: 'var(--shadcn-muted-fg)',
                            lineHeight: 1.55
                          }}
                        >
                          {wk.tasks.map((t, idx) => (
                            <li key={idx}>{t}</li>
                          ))}
                        </ul>
                      </Card>
                    ))}
                  </div>
                )}

                {msg.suggestedMentors && msg.suggestedMentors.length > 0 && (
                  <div
                    style={{
                      borderTop: '1px solid var(--shadcn-border)',
                      paddingTop: '12px',
                      marginTop: '10px'
                    }}
                  >
                    <p className="text-xs text-secondary uppercase font-bold mb-2">
                      Recommended SkillSwap Mentors (50 CR / 60-Min Session):
                    </p>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(195px, 1fr))',
                        gap: '10px'
                      }}
                    >
                      {msg.suggestedMentors.map((m) => (
                        <Card
                          key={m.userId}
                          style={{
                            background: '#09090b',
                            padding: '12px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            gap: '8px'
                          }}
                        >
                          <div>
                            <div className="flex-between">
                              <span className="font-bold text-sm">{m.displayName}</span>
                              <Badge variant="amber">
                                <Star size={10} fill="currentColor" /> {m.rating}
                              </Badge>
                            </div>
                            <p
                              className="text-xs"
                              style={{ color: 'var(--accent-emerald-light)', marginTop: '4px' }}
                            >
                              {m.matchingSkill}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleBookSuggestedMentor(m.displayName)}
                            className="w-full"
                          >
                            <span>View &amp; Book</span>
                            <ArrowUpRight size={12} />
                          </Button>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div key={msg.id} className="message msg-user">
              <div className="msg-avatar user-avatar">{user?.initials || 'U'}</div>
              <div className="msg-bubble">{msg.text}</div>
            </div>
          )
        )}
        <div ref={chatEndRef} />
      </div>

      <div
        className="chat-input-area"
        style={{ background: '#09090b', borderTop: '1px solid var(--shadcn-border)' }}
      >
        <form
          id="chat-form"
          onSubmit={handleSubmit}
          style={{ display: 'flex', gap: '10px', alignItems: 'center' }}
        >
          <Input
            type="text"
            id="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a technical question (e.g. React useEffect) or enter a skill for a 4-week roadmap..."
            autoComplete="off"
            required
          />
          <Button type="submit" variant="default" disabled={isLoading}>
            <Send size={16} />
            <span>Send</span>
          </Button>
        </form>
      </div>
    </Card>
  );
}
