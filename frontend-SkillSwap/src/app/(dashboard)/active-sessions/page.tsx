'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Radio, Video, CheckCircle } from 'lucide-react';
import { Session } from '@/types';
import { LiveTimer } from '@/features/session/components/LiveTimer';
import { FeedbackModal } from '@/features/session/components/FeedbackModal';
import { apiRequest } from '@/lib/apiClient';
import { useAuth } from '@/context/AuthContext';

const DEFAULT_ACTIVE_SESSION: Session = {
  _id: '665099aabbccddeeff001122',
  learnerId: '664f1a2b3c4d5e6f7a8b9c01',
  mentorId: '664f1a2b3c4d5e6f7a8b9c99',
  mentorName: 'Alex Rivera',
  mentorInitials: 'AR',
  status: 'ACTIVE',
  skillName: 'React.js Mentorship',
  domain: 'Technology',
  scheduledTime: new Date().toISOString(),
  creditsLocked: 50,
  meetingLink: 'https://meet.google.com/new'
};

export default function ActiveSessionsPage() {
  const router = useRouter();
  const { refreshProfile } = useAuth();
  const [activeSession, setActiveSession] = useState<Session>(DEFAULT_ACTIVE_SESSION);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState<boolean>(false);
  const [isTimerStopped, setIsTimerStopped] = useState<boolean>(false);

  useEffect(() => {
    const loadActive = async () => {
      try {
        const res = await apiRequest('/sessions/active');
        if (res?.success && Array.isArray(res.sessions) && res.sessions.length > 0) {
          setActiveSession(res.sessions[0]);
        }
      } catch (_) {
        // Keep default active session
      }
    };
    loadActive();
  }, []);

  const handleEndSessionClick = () => {
    setIsTimerStopped(true);
    setIsFeedbackOpen(true);
  };

  const handleJoinMeeting = () => {
    const url = activeSession.meetingLink || 'https://meet.google.com/new';
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleMarkAsLearnt = async () => {
    try {
      await apiRequest(`/sessions/${activeSession._id}/complete`, {
        method: 'POST',
        body: JSON.stringify({
          rating: 5,
          comment: 'Great 1-on-1 mentorship session!'
        })
      });
      await refreshProfile();
    } catch (_) {
      // Proceed with alert & navigation
    }
    alert('45 Credits Released to Mentor! (5 burned)');
    setIsFeedbackOpen(false);
    router.push('/marketplace');
  };

  const handleDispute = async () => {
    try {
      await apiRequest(`/sessions/${activeSession._id}/dispute`, {
        method: 'POST',
        body: JSON.stringify({
          reason: 'Learner reported unsatisfied session delivery.'
        })
      });
      await refreshProfile();
    } catch (_) {
      // Proceed
    }
    alert('Dispute raised! 50 Credits frozen in Escrow for Admin review.');
    setIsFeedbackOpen(false);
    router.push('/marketplace');
  };

  return (
    <>
      <section className="view active">
        <h2>Active Sessions</h2>

        <div className="active-session-card glass-panel mt-4">
          <div className="session-header">
            <div className="status-badge pulse-active">
              <Radio size={14} /> LIVE
            </div>
            <LiveTimer
              sessionId={activeSession._id}
              isStopped={isTimerStopped}
              onExpire={() => setIsFeedbackOpen(true)}
            />
          </div>
          <div className="session-body">
            <div className="flex gap-4 items-center">
              <div className="avatar-sm">
                {activeSession.mentorInitials || 'AR'}
              </div>
              <div>
                <h4 className="text-lg">{activeSession.skillName}</h4>
                <p className="text-secondary text-sm">
                  with {activeSession.mentorName || 'Alex Rivera'}
                </p>
              </div>
            </div>
            <div className="session-actions mt-4 flex gap-4">
              <button
                className="btn btn-primary"
                onClick={handleJoinMeeting}
                type="button"
              >
                <Video size={18} /> Join Meeting
              </button>
              <button
                className="btn btn-danger"
                id="end-session-btn"
                onClick={handleEndSessionClick}
                type="button"
              >
                <CheckCircle size={18} /> End Session
              </button>
            </div>
          </div>
        </div>
      </section>

      <FeedbackModal
        open={isFeedbackOpen}
        mentorName={activeSession.mentorName || 'Alex Rivera'}
        onMarkAsLearnt={handleMarkAsLearnt}
        onDispute={handleDispute}
      />
    </>
  );
}
