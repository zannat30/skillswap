'use client';

import React, { useState, useEffect } from 'react';
import { Flame, Medal, BookOpen, Check, AlertTriangle } from 'lucide-react';
import { LeaderboardMentor, LeaderboardLearner } from '@/types';
import { apiRequest } from '@/lib/apiClient';
import { useAuth } from '@/context/AuthContext';

const INITIAL_TOP_MENTORS: LeaderboardMentor[] = [
  {
    rank: 1,
    userId: '664f1a2b3c4d5e6f7a8b9c98',
    displayName: 'Sarah Chen',
    initials: 'SC',
    domain: 'Creative Arts',
    sessions: 89,
    rating: 5.0
  },
  {
    rank: 2,
    userId: '664f1a2b3c4d5e6f7a8b9c99',
    displayName: 'Alex Rivera',
    initials: 'AR',
    domain: 'Technology',
    sessions: 64,
    rating: 4.9
  },
  {
    rank: 3,
    userId: '664f1a2b3c4d5e6f7a8b9c97',
    displayName: 'David Kim',
    initials: 'DK',
    domain: 'Languages',
    sessions: 56,
    rating: 4.8
  }
];

const INITIAL_TOP_LEARNERS: LeaderboardLearner[] = [
  {
    rank: 1,
    userId: '664f1a2b3c4d5e6f7a8b9c95',
    displayName: 'Marcus Johnson',
    initials: 'MJ',
    skillsAcquired: 14,
    isCurrentUser: false
  },
  {
    rank: 2,
    userId: '664f1a2b3c4d5e6f7a8b9c01',
    displayName: 'Zannat',
    initials: 'Z',
    skillsAcquired: 11,
    isCurrentUser: true
  },
  {
    rank: 3,
    userId: '664f1a2b3c4d5e6f7a8b9c96',
    displayName: 'Emily Watson',
    initials: 'EW',
    skillsAcquired: 8,
    isCurrentUser: false
  }
];

export default function LeaderboardPage() {
  const { profile, refreshProfile } = useAuth();
  const [mentors, setMentors] =
    useState<LeaderboardMentor[]>(INITIAL_TOP_MENTORS);
  const [learners, setLearners] =
    useState<LeaderboardLearner[]>(INITIAL_TOP_LEARNERS);
  const [statusBanner, setStatusBanner] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        const [mRes, lRes] = await Promise.all([
          apiRequest('/leaderboard/mentors'),
          apiRequest('/leaderboard/learners')
        ]);
        if (mRes?.success && Array.isArray(mRes.mentors) && mRes.mentors.length > 0) {
          setMentors(mRes.mentors);
        }
        if (lRes?.success && Array.isArray(lRes.learners) && lRes.learners.length > 0) {
          setLearners(lRes.learners);
        }
      } catch (_) {
        // Keep initial leaderboard items
      }
    };
    fetchRankings();
  }, []);

  const handleClaimReward = async () => {
    setStatusBanner(null);
    try {
      const res = await apiRequest('/wallet/claim-streak', { method: 'POST' });
      if (res?.success) {
        await refreshProfile();
        setStatusBanner({
          type: 'success',
          text: res.message || '+20 Credit Streak Bonus claimed and added to wallet!'
        });
      }
    } catch (err: any) {
      setStatusBanner({
        type: 'error',
        text: err.message || 'Unable to claim streak reward.'
      });
    }
  };

  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Leaderboard &amp; Gamification</h2>
        <p className="text-secondary mt-1">
          Track your progress and compete with other mentors.
        </p>
      </div>

      {statusBanner && (
        <div
          className="glass-panel mb-6"
          style={{
            padding: '12px 16px',
            borderRadius: '12px',
            borderColor:
              statusBanner.type === 'error'
                ? 'var(--accent-amber)'
                : 'var(--accent-emerald)',
            color:
              statusBanner.type === 'error'
                ? 'var(--accent-amber)'
                : 'var(--accent-emerald)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 600,
            fontSize: '0.88rem'
          }}
        >
          {statusBanner.type === 'error' ? (
            <AlertTriangle size={16} />
          ) : (
            <Check size={16} />
          )}
          <span>{statusBanner.text}</span>
        </div>
      )}

      {/* Daily Streak */}
      <div className="glass-card streak-card p-6 mb-6 border-radius-16">
        <div className="flex items-center gap-4">
          <Flame
            className="flame-icon"
            style={{ width: '48px', height: '48px' }}
          />
          <div>
            <h3 className="text-xl font-bold text-white">
              {profile.streakCount || 7} Day Learning Streak!
            </h3>
            <p className="text-amber mt-1">
              {profile.streakBonusEligible
                ? 'You unlocked a +20 Credit bonus today!'
                : '7-Day Streak Milestone Reward (+20 CR per 7-day cycle)'}
            </p>
          </div>
        </div>
        <button
          className="btn btn-primary"
          style={{
            backgroundColor: 'var(--accent-amber)',
            boxShadow: '0 0 15px rgba(245,158,11,0.4)'
          }}
          onClick={handleClaimReward}
          type="button"
        >
          {profile.streakBonusEligible
            ? 'Claim Reward (+20 CR)'
            : 'Reward Claimed (+20 CR)'}
        </button>
      </div>

      <div className="leaderboard-grid">
        {/* Top Mentors */}
        <div className="glass-panel p-6 border-radius-16">
          <div className="flex items-center gap-2 mb-2">
            <Medal className="text-emerald" size={20} />
            <h3 className="text-lg font-bold">Top Mentors</h3>
          </div>
          <p className="text-xs text-secondary mb-4">
            Ranked by total sessions taught.
          </p>

          <div className="rank-list">
            {mentors.map((mentor) => (
              <div
                key={mentor.userId}
                className={`rank-item rank-${mentor.rank}`}
              >
                <div className="rank-number">#{mentor.rank}</div>
                <div className="avatar-sm mr-3">{mentor.initials}</div>
                <div className="flex-1 ml-3">
                  <h4 className="font-bold">{mentor.displayName}</h4>
                  <p className="text-xs text-secondary">{mentor.domain}</p>
                </div>
                <div className="text-right">
                  <div className="font-bold text-emerald">
                    {mentor.sessions}
                  </div>
                  <div className="text-xs text-secondary">Sessions</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Learners */}
        <div className="glass-panel p-6 border-radius-16">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="text-cyan" size={20} />
            <h3 className="text-lg font-bold">Top Learners</h3>
          </div>
          <p className="text-xs text-secondary mb-4">
            Ranked by new skills acquired.
          </p>

          <div className="rank-list">
            {learners.map((learner) => (
              <div
                key={learner.userId}
                className={`rank-item rank-${learner.rank}`}
              >
                <div className="rank-number">#{learner.rank}</div>
                <div
                  className="avatar-sm mr-3"
                  style={{ background: 'var(--accent-violet)' }}
                >
                  {learner.initials}
                </div>
                <div className="flex-1 ml-3">
                  <h4 className="font-bold">
                    {learner.displayName}
                    {learner.isCurrentUser && (
                      <span className="badge text-xs ml-1">You</span>
                    )}
                  </h4>
                </div>
                <div className="text-right">
                  <div className="font-bold text-cyan">
                    {learner.skillsAcquired}
                  </div>
                  <div className="text-xs text-secondary">Skills</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
