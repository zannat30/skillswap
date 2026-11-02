'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Radio,
  Video,
  CheckCircle,
  Clock,
  Play,
  XCircle,
  MessageSquare,
  Send,
  Link2,
  ShieldAlert,
  History,
  Star,
  AlertTriangle,
  Check
} from 'lucide-react';
import { Session, ChatMessage } from '@/types';
import { LiveTimer } from '@/features/session/components/LiveTimer';
import { FeedbackModal } from '@/features/session/components/FeedbackModal';
import { apiRequest } from '@/lib/apiClient';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';

export default function ActiveSessionsPage() {
  const { user, refreshProfile } = useAuth();
  const { socket } = useSocket();

  const [sessions, setSessions] = useState<Session[]>([]);
  const [historySessions, setHistorySessions] = useState<Session[]>([]);
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

  // Selected session for Feedback / Settlement Modal
  const [feedbackSession, setFeedbackSession] = useState<Session | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [isSubmittingModal, setIsSubmittingModal] = useState<boolean>(false);

  // Page-level status banner
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  // Meeting link inline editor state
  const [editingLinkSessionId, setEditingLinkSessionId] = useState<string | null>(null);
  const [meetingLinkInput, setMeetingLinkInput] = useState<string>('');

  // Real-time Session Workspace Chat state (Features #45 & #46)
  const [openChatSessionId, setOpenChatSessionId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<Record<string, ChatMessage[]>>({});
  const [chatInput, setChatInput] = useState<string>('');

  const loadAllSessions = useCallback(async () => {
    try {
      const [activeRes, histRes] = await Promise.all([
        apiRequest('/sessions/active'),
        apiRequest('/sessions/history')
      ]);
      if (activeRes?.success && Array.isArray(activeRes.sessions)) {
        setSessions(activeRes.sessions);
      }
      if (histRes?.success && Array.isArray(histRes.sessions)) {
        setHistorySessions(histRes.sessions);
      }
    } catch (_) {
      // Keep fallback state if backend offline
    }
  }, []);

  useEffect(() => {
    loadAllSessions();
  }, [loadAllSessions, user?._id]);

  // Load chat history when a session chat drawer is opened (Feature #46)
  const loadSessionChat = useCallback(async (sessionId: string) => {
    try {
      const res = await apiRequest(`/sessions/${sessionId}/chat`);
      if (res?.success && Array.isArray(res.messages)) {
        setChatMessages((prev) => ({ ...prev, [sessionId]: res.messages }));
      }
    } catch (_) {
      // Ignore if offline
    }
  }, []);

  useEffect(() => {
    if (openChatSessionId) {
      loadSessionChat(openChatSessionId);
      if (socket) {
        socket.emit('join-session-room', {
          sessionId: openChatSessionId,
          userId: user?._id
        });
      }
    }
  }, [openChatSessionId, loadSessionChat, socket, user?._id]);

  // Listen for real-time incoming messages over Socket.io
  useEffect(() => {
    if (!socket) return;
    const handleNewMessage = (msg: ChatMessage) => {
      if (!msg?.sessionId) return;
      setChatMessages((prev) => {
        const existing = prev[msg.sessionId] || [];
        if (existing.some((m) => m._id === msg._id)) return prev;
        return { ...prev, [msg.sessionId]: [...existing, msg] };
      });
    };
    socket.on('new-message', handleNewMessage);
    return () => {
      socket.off('new-message', handleNewMessage);
    };
  }, [socket]);

  // Feature #45: Send Workspace Chat Message
  const handleSendChatMessage = async (e: React.FormEvent, sessionId: string) => {
    e.preventDefault();
    const trimmed = chatInput.trim();
    if (!trimmed) return;
    setChatInput('');

    try {
      const res = await apiRequest(`/sessions/${sessionId}/chat`, {
        method: 'POST',
        body: JSON.stringify({
          messageText: trimmed,
          senderName: user?.displayName || 'Zannat'
        })
      });
      if (res?.success && res.message) {
        setChatMessages((prev) => {
          const existing = prev[sessionId] || [];
          if (existing.some((m) => m._id === res.message._id)) return prev;
          return { ...prev, [sessionId]: [...existing, res.message] };
        });
      }
    } catch (err: any) {
      setBanner({ type: 'error', text: err.message || 'Failed to send message.' });
    }
  };

  // Feature #32: Start Pending Session (Mentor Only)
  const handleStartSession = async (session: Session) => {
    setBanner(null);
    try {
      await apiRequest(`/sessions/${session._id}/start`, { method: 'POST' });
      if (socket) {
        socket.emit('start-session-timer', {
          sessionId: session._id,
          durationSeconds: 3600
        });
      }
      await loadAllSessions();
      await refreshProfile();
      setBanner({
        type: 'success',
        text: `Session "${session.skillName}" is now LIVE! 60:00 countdown timer started.`
      });
    } catch (err: any) {
      setBanner({
        type: 'error',
        text: `${err.code || 'ERROR'}: ${err.message}`
      });
    }
  };

  // Feature #36: Cancel Pending Session & Refund 50 CR
  const handleCancelSession = async (session: Session) => {
    setBanner(null);
    try {
      const res = await apiRequest(`/sessions/${session._id}/cancel`, {
        method: 'POST'
      });
      await loadAllSessions();
      await refreshProfile();
      setBanner({
        type: 'success',
        text: res.message || 'Session cancelled and 50 Credits refunded to Learner wallet.'
      });
    } catch (err: any) {
      setBanner({
        type: 'error',
        text: `${err.code || 'ERROR'}: ${err.message}`
      });
    }
  };

  // Feature #33: Update Meeting Link
  const handleSaveMeetingLink = async (sessionId: string) => {
    if (!meetingLinkInput.trim()) return;
    try {
      await apiRequest(`/sessions/${sessionId}/meeting-link`, {
        method: 'PUT',
        body: JSON.stringify({ meetingLink: meetingLinkInput.trim() })
      });
      setEditingLinkSessionId(null);
      await loadAllSessions();
      setBanner({ type: 'success', text: 'Meeting room link updated!' });
    } catch (err: any) {
      setBanner({ type: 'error', text: err.message });
    }
  };

  const handleJoinMeeting = (session: Session) => {
    const url = session.meetingLink || 'https://meet.google.com/new';
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Feature #34, #37, #39: Complete Session (90/10 Split + Rating & Review)
  const handleMarkAsLearnt = async (rating: number, comment: string) => {
    if (!feedbackSession) return;
    setModalError(null);
    setIsSubmittingModal(true);

    try {
      const res = await apiRequest(`/sessions/${feedbackSession._id}/complete`, {
        method: 'POST',
        body: JSON.stringify({ rating, comment })
      });
      await loadAllSessions();
      await refreshProfile();
      setFeedbackSession(null);
      setBanner({
        type: 'success',
        text:
          res.message ||
          '45 Credits (90%) Released to Mentor! 5 Credits (10%) burned.'
      });
    } catch (err: any) {
      setModalError(`${err.code || 'ERROR'}: ${err.message}`);
    } finally {
      setIsSubmittingModal(false);
    }
  };

  // Feature #35: Raise Escrow Dispute
  const handleDispute = async (reason: string) => {
    if (!feedbackSession) return;
    setModalError(null);
    setIsSubmittingModal(true);

    try {
      const res = await apiRequest(`/sessions/${feedbackSession._id}/dispute`, {
        method: 'POST',
        body: JSON.stringify({ reason })
      });
      await loadAllSessions();
      await refreshProfile();
      setFeedbackSession(null);
      setBanner({
        type: 'error',
        text:
          res.message ||
          'Dispute raised! 50 Credits frozen in Escrow pending Admin arbitration.'
      });
    } catch (err: any) {
      setModalError(`${err.code || 'ERROR'}: ${err.message}`);
    } finally {
      setIsSubmittingModal(false);
    }
  };

  return (
    <>
      <section className="view active">
        <div className="flex-between">
          <h2>Active Sessions &amp; Workspace</h2>
          <div className="category-tabs" style={{ marginBottom: 0 }}>
            <button
              type="button"
              className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`}
              onClick={() => setActiveTab('active')}
            >
              Active &amp; Pending ({sessions.length})
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <History size={14} /> Session History ({historySessions.length})
            </button>
          </div>
        </div>

        {banner && (
          <div
            className="glass-panel mt-4"
            style={{
              padding: '12px 16px',
              borderRadius: '12px',
              borderColor:
                banner.type === 'error' ? 'var(--accent-amber)' : 'var(--accent-emerald)',
              color:
                banner.type === 'error' ? 'var(--accent-amber)' : 'var(--accent-emerald)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}
          >
            <div className="flex items-center gap-2 text-sm font-bold">
              {banner.type === 'error' ? <AlertTriangle size={16} /> : <Check size={16} />}
              <span>{banner.text}</span>
            </div>
            <button
              type="button"
              className="icon-btn"
              onClick={() => setBanner(null)}
            >
              ×
            </button>
          </div>
        )}

        {activeTab === 'active' ? (
          sessions.length === 0 ? (
            <div className="glass-panel p-6 border-radius-16 mt-4">
              <p className="text-secondary">
                No active or pending sessions right now. Visit the{' '}
                <Link href="/marketplace" className="text-emerald">
                  Marketplace
                </Link>{' '}
                to book a 60-minute session!
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '16px' }}>
              {sessions.map((session) => {
                const isLive = session.status === 'ACTIVE';
                const isPending = session.status === 'PENDING';
                const isDisputed = session.status === 'DISPUTED';
                const isChatOpen = openChatSessionId === session._id;
                const currentMessages = chatMessages[session._id] || [];

                return (
                  <div
                    key={session._id}
                    className="active-session-card glass-panel"
                    style={{ maxWidth: '820px' }}
                  >
                    <div className="session-header">
                      {isLive && (
                        <div className="status-badge pulse-active">
                          <Radio size={14} /> LIVE
                        </div>
                      )}
                      {isPending && (
                        <div
                          className="status-badge"
                          style={{
                            background: 'rgba(245, 158, 11, 0.15)',
                            color: 'var(--accent-amber)',
                            border: '1px solid rgba(245, 158, 11, 0.35)'
                          }}
                        >
                          <Clock size={14} /> PENDING MENTOR START
                        </div>
                      )}
                      {isDisputed && (
                        <div
                          className="status-badge"
                          style={{
                            background: 'rgba(239, 68, 68, 0.2)',
                            color: 'var(--accent-red)',
                            border: '1px solid rgba(239, 68, 68, 0.4)'
                          }}
                        >
                          <ShieldAlert size={14} /> DISPUTED • 50 CR FROZEN
                        </div>
                      )}

                      {isLive ? (
                        <LiveTimer
                          sessionId={session._id}
                          isStopped={feedbackSession?._id === session._id}
                          onExpire={() => {
                            setModalError(null);
                            setFeedbackSession(session);
                          }}
                        />
                      ) : (
                        <h3 className="ml-auto timer-display text-secondary" style={{ fontSize: '1.3rem' }}>
                          {isPending ? '60:00 (Escrow Locked)' : 'FROZEN'}
                        </h3>
                      )}
                    </div>

                    <div className="session-body">
                      <div className="flex-between" style={{ flexWrap: 'wrap', gap: '12px' }}>
                        <div className="flex gap-4 items-center">
                          <div className="avatar-sm">
                            {session.mentorInitials || 'AR'}
                          </div>
                          <div>
                            <h4 className="text-lg">{session.skillName}</h4>
                            <p className="text-secondary text-sm">
                              Mentor: <strong>{session.mentorName || 'Alex Rivera'}</strong> •
                              Learner: <strong>{session.learnerName || 'Zannat'}</strong> •{' '}
                              <span className="text-amber">{session.creditsLocked} CR Escrow</span>
                            </p>
                            {session.bookedSlot?.date && (
                              <p className="text-xs text-emerald mt-1">
                                Scheduled Slot: {session.bookedSlot.date} ({session.bookedSlot.slot})
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="btn glass-btn"
                            style={{ padding: '7px 12px', fontSize: '0.78rem' }}
                            onClick={() => {
                              setEditingLinkSessionId(
                                editingLinkSessionId === session._id ? null : session._id
                              );
                              setMeetingLinkInput(session.meetingLink || '');
                            }}
                          >
                            <Link2 size={14} /> Meeting Link
                          </button>
                          <button
                            type="button"
                            className="btn glass-btn"
                            style={{ padding: '7px 12px', fontSize: '0.78rem' }}
                            onClick={() =>
                              setOpenChatSessionId(isChatOpen ? null : session._id)
                            }
                          >
                            <MessageSquare size={14} /> Workspace Chat ({currentMessages.length})
                          </button>
                        </div>
                      </div>

                      {/* Meeting Link Editor (Feature #33) */}
                      {editingLinkSessionId === session._id && (
                        <div
                          className="mt-3 flex gap-2"
                          style={{
                            background: 'rgba(15, 23, 42, 0.6)',
                            padding: '10px',
                            borderRadius: '10px',
                            border: '1px solid var(--border-glass)'
                          }}
                        >
                          <input
                            type="url"
                            value={meetingLinkInput}
                            onChange={(e) => setMeetingLinkInput(e.target.value)}
                            placeholder="https://meet.google.com/..."
                            style={{
                              flex: 1,
                              padding: '7px 10px',
                              borderRadius: '8px',
                              background: 'var(--bg-obsidian)',
                              border: '1px solid var(--border-glass)',
                              color: 'var(--text-primary)',
                              fontSize: '0.82rem'
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveMeetingLink(session._id)}
                            className="btn btn-primary"
                            style={{ padding: '7px 14px', fontSize: '0.8rem' }}
                          >
                            Save Link
                          </button>
                        </div>
                      )}

                      {/* State-Specific Lifecycle Actions */}
                      <div className="session-actions mt-4 flex gap-3" style={{ flexWrap: 'wrap' }}>
                        {isPending && (
                          <>
                            {String(user?._id) === String(session.mentorId) ? (
                              <button
                                type="button"
                                className="btn btn-primary"
                                onClick={() => handleStartSession(session)}
                                title="Starts the 60-minute session timer as Mentor"
                              >
                                <Play size={16} /> Start Session
                              </button>
                            ) : (
                              <span
                                className="text-xs text-secondary"
                                style={{ alignSelf: 'center' }}
                              >
                                Waiting for Mentor ({session.mentorName}) to start session...
                              </span>
                            )}
                            <button
                              type="button"
                              className="btn btn-danger"
                              onClick={() => handleCancelSession(session)}
                            >
                              <XCircle size={16} /> Cancel &amp; Refund 50 CR
                            </button>
                          </>
                        )}

                        {isLive && (
                          <>
                            <button
                              className="btn btn-primary"
                              onClick={() => handleJoinMeeting(session)}
                              type="button"
                            >
                              <Video size={18} /> Join Meeting
                            </button>
                            <button
                              className="btn btn-danger"
                              id="end-session-btn"
                              onClick={() => {
                                setModalError(null);
                                setFeedbackSession(session);
                              }}
                              type="button"
                            >
                              <CheckCircle size={18} /> End Session
                            </button>
                          </>
                        )}

                        {isDisputed && (
                          <div className="flex items-center justify-between w-full">
                            <p className="text-sm text-red-400">
                              Reason: &ldquo;{session.disputeReason || 'Disputed session delivery'}&rdquo;
                            </p>
                            <Link href="/admin/disputes" className="btn btn-primary">
                              <ShieldAlert size={16} /> Open Admin Arbitration Console
                            </Link>
                          </div>
                        )}
                      </div>

                      {/* Embedded Real-Time Session Workspace Chat (Features #45 & #46) */}
                      {isChatOpen && (
                        <div
                          className="mt-4"
                          style={{
                            background: 'rgba(11, 15, 25, 0.7)',
                            border: '1px solid var(--border-glass)',
                            borderRadius: '12px',
                            padding: '12px'
                          }}
                        >
                          <div className="flex-between mb-2">
                            <span className="text-xs text-secondary uppercase font-bold">
                              Live Session Workspace Chat (Audit Logged for Escrow Arbitration)
                            </span>
                          </div>
                          <div
                            className="custom-scrollbar"
                            style={{
                              maxHeight: '170px',
                              overflowY: 'auto',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '8px',
                              marginBottom: '10px',
                              paddingRight: '4px'
                            }}
                          >
                            {currentMessages.length === 0 ? (
                              <p className="text-xs text-secondary">
                                No messages in this workspace yet. Say hello to start collaborating!
                              </p>
                            ) : (
                              currentMessages.map((msg) => {
                                const isMe = String(msg.senderId) === String(user?._id);
                                return (
                                  <div
                                    key={msg._id}
                                    style={{
                                      alignSelf: isMe ? 'flex-end' : 'flex-start',
                                      background: isMe
                                        ? 'rgba(16, 185, 129, 0.15)'
                                        : 'rgba(30, 41, 59, 0.85)',
                                      border: '1px solid var(--border-glass)',
                                      borderRadius: '10px',
                                      padding: '6px 10px',
                                      maxWidth: '80%'
                                    }}
                                  >
                                    <div
                                      style={{
                                        fontSize: '0.68rem',
                                        color: isMe
                                          ? 'var(--accent-emerald)'
                                          : 'var(--accent-cyan)',
                                        fontWeight: 600
                                      }}
                                    >
                                      {msg.senderName}
                                    </div>
                                    <div style={{ fontSize: '0.82rem' }}>
                                      {msg.messageText || msg.text}
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                          <form
                            onSubmit={(e) => handleSendChatMessage(e, session._id)}
                            className="flex gap-2"
                          >
                            <input
                              type="text"
                              value={chatInput}
                              onChange={(e) => setChatInput(e.target.value)}
                              placeholder="Send a message or code snippet to session room..."
                              style={{
                                flex: 1,
                                padding: '8px 12px',
                                borderRadius: '8px',
                                background: 'var(--bg-obsidian)',
                                border: '1px solid var(--border-glass)',
                                color: 'var(--text-primary)',
                                fontSize: '0.82rem'
                              }}
                            />
                            <button
                              type="submit"
                              className="btn btn-primary"
                              style={{ padding: '8px 14px' }}
                            >
                              <Send size={15} />
                            </button>
                          </form>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          /* Session History Archive Tab (Feature #30) */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
            {historySessions.length === 0 ? (
              <div className="glass-panel p-6 border-radius-16">
                <p className="text-secondary">
                  No completed, cancelled, or refunded sessions in archive yet.
                </p>
              </div>
            ) : (
              historySessions.map((h) => (
                <div key={h._id} className="glass-panel p-6 border-radius-16">
                  <div className="flex-between">
                    <div className="flex items-center gap-3">
                      <div className="avatar-sm">{h.mentorInitials || 'AR'}</div>
                      <div>
                        <h4 className="font-bold">{h.skillName}</h4>
                        <p className="text-xs text-secondary">
                          Mentor: {h.mentorName} • Learner: {h.learnerName}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`badge-type ${
                        h.status === 'COMPLETED'
                          ? 'badge-release'
                          : h.status === 'REFUNDED'
                            ? 'badge-refund'
                            : 'badge-lock'
                      }`}
                    >
                      {h.status}
                    </span>
                  </div>
                  {h.feedback && (
                    <div
                      className="mt-3"
                      style={{
                        background: 'rgba(15, 23, 42, 0.5)',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        fontSize: '0.8rem'
                      }}
                    >
                      <span className="text-amber font-bold inline-flex items-center gap-1 mr-2">
                        <Star size={12} fill="currentColor" /> {h.feedback.rating}/5
                      </span>
                      <span className="text-secondary">{h.feedback.comment}</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </section>

      <FeedbackModal
        open={Boolean(feedbackSession)}
        mentorName={feedbackSession?.mentorName || 'Alex Rivera'}
        skillName={feedbackSession?.skillName}
        errorMsg={modalError}
        isSubmitting={isSubmittingModal}
        onClose={() => setFeedbackSession(null)}
        onMarkAsLearnt={handleMarkAsLearnt}
        onDispute={handleDispute}
      />
    </>
  );
}
