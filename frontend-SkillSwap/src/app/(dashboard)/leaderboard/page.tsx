'use client';

import React, { useState, useEffect } from 'react';
import { Flame, Medal, BookOpen, Check, AlertTriangle } from 'lucide-react';
import { LeaderboardMentor, LeaderboardLearner } from '@/types';
import { apiRequest } from '@/lib/apiClient';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from '@/components/ui/card';

export default function LeaderboardPage() {
  const { profile, refreshProfile } = useAuth();
  const [mentors, setMentors] = useState<LeaderboardMentor[]>([]);
  const [learners, setLearners] = useState<LeaderboardLearner[]>([]);
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
        if (mRes?.success && Array.isArray(mRes.mentors)) {
          setMentors(mRes.mentors);
        }
        if (lRes?.success && Array.isArray(lRes.learners)) {
          setLearners(lRes.learners);
        }
      } catch (_) {
        setMentors([]);
        setLearners([]);
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
        <Badge variant="amber" style={{ marginBottom: '8px' }}>
          <Flame size={12} /> Gamification &amp; Community Rankings
        </Badge>
        <h2 className="text-2xl font-bold">Leaderboard &amp; Daily Streak</h2>
        <p className="text-secondary mt-1">
          Track your progress and compete with verified peer mentors and learners.
        </p>
      </div>

      {statusBanner && (
        <Alert
          variant={statusBanner.type === 'error' ? 'amber' : 'emerald'}
          className="mb-6"
        >
          <div className="flex items-center gap-2">
            {statusBanner.type === 'error' ? (
              <AlertTriangle size={16} />
            ) : (
              <Check size={16} />
            )}
            <AlertDescription>{statusBanner.text}</AlertDescription>
          </div>
        </Alert>
      )}

      {/* Daily Streak Card (shadcn/ui Card) */}
      <Card
        className="mb-6"
        style={{
          padding: '24px',
          background:
            'linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(12, 12, 15, 0.95))',
          borderColor: 'rgba(245, 158, 11, 0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div className="flex items-center gap-4">
          <Flame className="flame-icon" style={{ width: '44px', height: '44px' }} />
          <div>
            <h3 className="text-xl font-bold">
              {profile.streakCount || 7} Day Learning Streak!
            </h3>
            <p className="text-amber text-sm mt-1">
              {profile.streakBonusEligible
                ? 'You unlocked a +20 Credit bonus today!'
                : '7-Day Streak Milestone Reward (+20 CR per 7-day cycle)'}
            </p>
          </div>
        </div>
        <Button variant="default" onClick={handleClaimReward}>
          {profile.streakBonusEligible
            ? 'Claim Reward (+20 CR)'
            : 'Reward Claimed (+20 CR)'}
        </Button>
      </Card>

      <div className="leaderboard-grid">
        {/* Top Mentors */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Medal className="text-emerald" size={20} />
              <CardTitle>Top Mentors</CardTitle>
            </div>
            <CardDescription>Ranked by total 60-minute sessions taught.</CardDescription>
          </CardHeader>

          <CardContent>
            <div className="rank-list" style={{ marginTop: 0 }}>
              {mentors.length === 0 ? (
                <p className="text-secondary text-sm">
                  No mentors ranked yet. Add teaching skills and complete sessions to appear here!
                </p>
              ) : (
                mentors.map((mentor) => (
                  <div
                    key={mentor.userId}
                    className={`rank-item rank-${mentor.rank}`}
                    style={{ background: '#09090b', borderColor: 'var(--shadcn-border)' }}
                  >
                    <div className="rank-number">#{mentor.rank}</div>
                    <Avatar className="mr-3">
                      <AvatarFallback>{mentor.initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 ml-3">
                      <h4 className="font-bold text-sm">{mentor.displayName}</h4>
                      <p className="text-xs text-secondary">{mentor.domain}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="emerald">{mentor.sessions} Sessions</Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Learners */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BookOpen className="text-cyan" size={20} />
              <CardTitle>Top Learners</CardTitle>
            </div>
            <CardDescription>Ranked by new skills acquired on SkillSwap.</CardDescription>
          </CardHeader>

          <CardContent>
            <div className="rank-list" style={{ marginTop: 0 }}>
              {learners.length === 0 ? (
                <p className="text-secondary text-sm">
                  No learners ranked yet. Complete sessions to climb the leaderboard!
                </p>
              ) : (
                learners.map((learner) => (
                  <div
                    key={learner.userId}
                    className={`rank-item rank-${learner.rank}`}
                    style={{ background: '#09090b', borderColor: 'var(--shadcn-border)' }}
                  >
                    <div className="rank-number">#{learner.rank}</div>
                    <Avatar className="mr-3">
                      <AvatarFallback style={{ background: 'rgba(139, 92, 246, 0.2)', color: '#a78bfa' }}>
                        {learner.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 ml-3">
                      <h4 className="font-bold text-sm flex items-center gap-2">
                        <span>{learner.displayName}</span>
                        {learner.isCurrentUser && <Badge variant="amber">You</Badge>}
                      </h4>
                    </div>
                    <div className="text-right">
                      <Badge variant="cyan">{learner.skillsAcquired} Skills</Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
