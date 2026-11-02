'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send } from 'lucide-react';
import { apiRequest } from '@/lib/apiClient';
import { useAuth } from '@/context/AuthContext';

interface BotChatItem {
  id: string;
  sender: 'bot' | 'user';
  text?: string;
  questionTopic?: string;
  steps?: string[];
  suggestedMentors?: Array<{
    userId: string;
    displayName: string;
    rating: number;
    totalSessions: number;
    matchingSkill: string;
  }>;
}

export default function AISkillBotPage() {
  const { user } = useAuth();
  const [input, setInput] = useState<string>('');
  const [messages, setMessages] = useState<BotChatItem[]>([
    {
      id: 'welcome-msg',
      sender: 'bot',
      text: "Hello! I'm SkillBot, your AI mentor. You can ask me technical questions, ask for a learning roadmap, or request a mentor recommendation for a specific skill. How can I help you today?"
    }
  ]);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMsg: BotChatItem = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: trimmed
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');

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
        steps: res?.steps || [
          'Understand the core fundamentals.',
          'Build a small practical project.',
          'Book a session with a mentor on our marketplace to review your code!'
        ],
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
        return;
      }

      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            sender: 'bot',
            questionTopic: trimmed,
            steps: [
              'Understand the core fundamentals.',
              'Build a small practical project.',
              'Book a session with a mentor on our marketplace to review your code!'
            ]
          }
        ]);
      }, 600);
    }
  };

  return (
    <div className="chat-container glass-card">
      <div
        className="card-header flex-between"
        style={{ borderBottom: '1px solid var(--border-glass)' }}
      >
        <div className="flex items-center gap-3">
          <div className="msg-avatar bot-avatar">
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className="font-bold glowing-text">SkillBot AI</h3>
            <p className="text-xs text-secondary">Powered by Google Gemini</p>
          </div>
        </div>
      </div>

      <div className="chat-messages custom-scrollbar" id="chat-messages">
        {messages.map((msg) =>
          msg.sender === 'bot' ? (
            <div key={msg.id} className="message msg-bot">
              <div className="msg-avatar bot-avatar">
                <Sparkles style={{ width: '20px', height: '20px' }} />
              </div>
              <div className="msg-bubble">
                {msg.questionTopic ? (
                  <>
                    <p className="mb-2">
                      Based on your question about{' '}
                      <strong>{msg.questionTopic}</strong>, here is a suggested
                      learning roadmap:
                    </p>
                    <ol
                      style={{
                        marginLeft: '20px',
                        color: 'var(--accent-cyan)'
                      }}
                    >
                      {(msg.steps || []).map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                  </>
                ) : (
                  <>{msg.text}</>
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
            placeholder="Ask a question or request a roadmap..."
            autoComplete="off"
            required
          />
          <button
            type="submit"
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
