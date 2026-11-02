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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from '@/components/ui/card';

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
          senderName: user?.displayName || 'Member'
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
        <div className="flex-between" style={{ flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <Badge variant="cyan" style={{ marginBottom: '6px' }}>
              <Clock size={12} /> Synchronized Session Workspace
            </Badge>
            <h2 className="text-2xl font-bold">Active Sessions &amp; Workspace</h2>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as 'active' | 'history')}
          >
            <TabsList>
              <TabsTrigger value="active">
                Active &amp; Pending ({sessions.length})
              </TabsTrigger>
              <TabsTrigger value="history">
                <History size={14} /> Session History ({historySessions.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {banner && (
          <Alert
            variant={banner.type === 'error' ? 'amber' : 'emerald'}
            className="mt-4 flex-between"
          >
            <div className="flex items-center gap-2 font-bold">
              {banner.type === 'error' ? <AlertTriangle size={16} /> : <Check size={16} />}
              <AlertDescription>{banner.text}</AlertDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setBanner(null)}>
              ×
            </Button>
          </Alert>
        )}

        {activeTab === 'active' ? (
          sessions.length === 0 ? (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle style={{ fontSize: '1.05rem' }}>No Active or Pending Sessions</CardTitle>
                <CardDescription>
                  No active or pending sessions right now. Visit the{' '}
                  <Link href="/marketplace" className="text-emerald font-bold">
                    Marketplace
                  </Link>{' '}
                  to book a 60-minute session!
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                marginTop: '20px'
              }}
            >
              {sessions.map((session) => {
                const isLive = session.status === 'ACTIVE';
                const isPending = session.status === 'PENDING';
                const isDisputed = session.status === 'DISPUTED';
                const isChatOpen = openChatSessionId === session._id;
                const currentMessages = chatMessages[session._id] || [];

                return (
                  <Card key={session._id} style={{ maxWidth: '860px' }}>
                    <div
                      className="session-header"
                      style={{
                        background: '#09090b',
                        borderBottom: '1px solid var(--shadcn-border)'
                      }}
                    >
                      {isLive && (
                        <Badge variant="destructive" className="pulse-active">
                          <Radio size={13} /> LIVE
                        </Badge>
                      )}
                      {isPending && (
                        <Badge variant="amber">
                          <Clock size={13} /> PENDING MENTOR START
                        </Badge>
                      )}
                      {isDisputed && (
                        <Badge variant="destructive">
                          <ShieldAlert size={13} /> DISPUTED • 50 CR FROZEN
                        </Badge>
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
                        <h3
                          className="ml-auto timer-display text-secondary"
                          style={{ fontSize: '1.2rem' }}
                        >
                          {isPending ? '60:00 (Escrow Locked)' : 'FROZEN'}
                        </h3>
                      )}
                    </div>

                    <CardContent style={{ paddingTop: '24px' }}>
                      <div className="flex-between" style={{ flexWrap: 'wrap', gap: '12px' }}>
                        <div className="flex gap-4 items-center">
                          <Avatar>
                            <AvatarFallback>{session.mentorInitials || 'M'}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="text-lg font-bold">{session.skillName}</h4>
                            <p className="text-secondary text-sm">
                              Mentor: <strong>{session.mentorName || 'Mentor'}</strong> •
                              Learner: <strong>{session.learnerName || 'Learner'}</strong> •{' '}
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
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingLinkSessionId(
                                editingLinkSessionId === session._id ? null : session._id
                              );
                              setMeetingLinkInput(session.meetingLink || '');
                            }}
                          >
                            <Link2 size={14} /> Meeting Link
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setOpenChatSessionId(isChatOpen ? null : session._id)
                            }
                          >
                            <MessageSquare size={14} /> Workspace Chat ({currentMessages.length})
                          </Button>
                        </div>
                      </div>

                      {/* Meeting Link Editor (Feature #33) */}
                      {editingLinkSessionId === session._id && (
                        <div
                          className="mt-3 flex gap-2"
                          style={{
                            background: '#09090b',
                            padding: '10px',
                            borderRadius: '10px',
                            border: '1px solid var(--shadcn-border)'
                          }}
                        >
                          <Input
                            type="url"
                            value={meetingLinkInput}
                            onChange={(e) => setMeetingLinkInput(e.target.value)}
                            placeholder="https://meet.google.com/..."
                          />
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleSaveMeetingLink(session._id)}
                          >
                            Save Link
                          </Button>
                        </div>
                      )}

                      {/* State-Specific Lifecycle Actions */}
                      <div className="session-actions mt-4 flex gap-3" style={{ flexWrap: 'wrap' }}>
                        {isPending && (
                          <>
                            {String(user?._id) === String(session.mentorId) ? (
                              <Button
                                variant="default"
                                onClick={() => handleStartSession(session)}
                                title="Starts the 60-minute session timer as Mentor"
                              >
                                <Play size={16} /> Start Session
                              </Button>
                            ) : (
                              <span
                                className="text-xs text-secondary"
                                style={{ alignSelf: 'center' }}
                              >
                                Waiting for Mentor ({session.mentorName}) to start session...
                              </span>
                            )}
                            <Button
                              variant="destructive"
                              onClick={() => handleCancelSession(session)}
                            >
                              <XCircle size={16} /> Cancel &amp; Refund 50 CR
                            </Button>
                          </>
                        )}

                        {isLive && (
                          <>
                            <Button
                              variant="default"
                              onClick={() => handleJoinMeeting(session)}
                            >
                              <Video size={16} /> Join Meeting
                            </Button>
                            <Button
                              variant="destructive"
                              id="end-session-btn"
                              onClick={() => {
                                setModalError(null);
                                setFeedbackSession(session);
                              }}
                            >
                              <CheckCircle size={16} /> End Session
                            </Button>
                          </>
                        )}

                        {isDisputed && (
                          <div className="flex items-center justify-between w-full">
                            <p className="text-sm text-red-400">
                              Reason: &ldquo;
                              {session.disputeReason || 'Disputed session delivery'}
                              &rdquo;
                            </p>
                            {user?.role === 'ADMIN' && (
                              <Link href="/admin/disputes" style={{ textDecoration: 'none' }}>
                                <Button variant="default" size="sm">
                                  <ShieldAlert size={15} /> Open Admin Arbitration Console
                                </Button>
                              </Link>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Embedded Real-Time Session Workspace Chat (Features #45 & #46) */}
                      {isChatOpen && (
                        <div
                          className="mt-4"
                          style={{
                            background: '#09090b',
                            border: '1px solid var(--shadcn-border)',
                            borderRadius: '10px',
                            padding: '14px'
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
                              maxHeight: '175px',
                              overflowY: 'auto',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '8px',
                              marginBottom: '12px',
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
                                        ? 'rgba(16, 185, 129, 0.14)'
                                        : '#18181b',
                                      border: '1px solid var(--shadcn-border)',
                                      borderRadius: '10px',
                                      padding: '8px 12px',
                                      maxWidth: '80%'
                                    }}
                                  >
                                    <div
                                      style={{
                                        fontSize: '0.68rem',
                                        color: isMe
                                          ? 'var(--accent-emerald-light)'
                                          : 'var(--accent-cyan)',
                                        fontWeight: 600
                                      }}
                                    >
                                      {msg.senderName}
                                    </div>
                                    <div style={{ fontSize: '0.84rem' }}>
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
                            <Input
                              type="text"
                              value={chatInput}
                              onChange={(e) => setChatInput(e.target.value)}
                              placeholder="Send a message or code snippet to session room..."
                            />
                            <Button type="submit" variant="default">
                              <Send size={15} />
                            </Button>
                          </form>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )
        ) : (
          /* Session History Archive Tab (Feature #30) */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '20px' }}>
            {historySessions.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardDescription>
                    No completed, cancelled, or refunded sessions in archive yet.
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : (
              historySessions.map((h) => (
                <Card key={h._id} style={{ padding: '20px 24px' }}>
                  <div className="flex-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>{h.mentorInitials || 'M'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-bold">{h.skillName}</h4>
                        <p className="text-xs text-secondary">
                          Mentor: {h.mentorName} • Learner: {h.learnerName}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        h.status === 'COMPLETED'
                          ? 'emerald'
                          : h.status === 'REFUNDED'
                            ? 'cyan'
                            : 'amber'
                      }
                    >
                      {h.status}
                    </Badge>
                  </div>
                  {h.feedback && (
                    <div
                      className="mt-3"
                      style={{
                        background: '#09090b',
                        border: '1px solid var(--shadcn-border)',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        fontSize: '0.82rem'
                      }}
                    >
                      <span className="text-amber font-bold inline-flex items-center gap-1 mr-2">
                        <Star size={12} fill="currentColor" /> {h.feedback.rating}/5
                      </span>
                      <span className="text-secondary">{h.feedback.comment}</span>
                    </div>
                  )}
                </Card>
              ))
            )}
          </div>
        )}
      </section>

      <FeedbackModal
        open={Boolean(feedbackSession)}
        mentorName={feedbackSession?.mentorName || 'Mentor'}
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
