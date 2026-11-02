'use client';

import React from 'react';
import { Star, Coins, Sparkles, Eye } from 'lucide-react';
import { Mentor } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter
} from '@/components/ui/card';

interface MentorCardProps {
  mentor: Mentor;
  onBook: (mentor: Mentor) => void;
  onViewProfile?: (mentor: Mentor) => void;
}

export function MentorCard({ mentor, onBook, onViewProfile }: MentorCardProps) {
  return (
    <Card
      className="shadcn-card-hover"
      style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
    >
      <div>
        <CardHeader
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--shadcn-border)',
            padding: '20px 22px'
          }}
        >
          <div
            className="flex items-center gap-3"
            style={{ cursor: onViewProfile ? 'pointer' : 'default' }}
            onClick={() => onViewProfile && onViewProfile(mentor)}
            title="Click to view full mentor profile & learner reviews"
          >
            <Avatar>
              <AvatarFallback
                style={{
                  background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-emerald))',
                  color: '#fff'
                }}
              >
                {mentor.initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2" style={{ flexWrap: 'wrap' }}>
                <CardTitle style={{ fontSize: '1.02rem' }}>
                  {mentor.name || mentor.displayName}
                </CardTitle>
                {mentor.isBarterMatch && (
                  <Badge variant="emerald" style={{ fontSize: '0.68rem', padding: '2px 7px' }}>
                    <Sparkles size={10} /> Swap Match
                  </Badge>
                )}
              </div>
              <div className="rating" style={{ marginTop: '4px' }}>
                <Star size={12} fill="currentColor" /> {mentor.rating} (
                {mentor.sessions ?? mentor.totalSessions} sessions)
              </div>
            </div>
          </div>

          <Badge variant="emerald" style={{ padding: '5px 10px', fontSize: '0.8rem' }}>
            50 <Coins size={13} />
          </Badge>
        </CardHeader>

        <CardContent style={{ padding: '20px 22px' }}>
          <div className="skill-group">
            <span className="label">Teaches:</span>
            <div className="tags">
              {mentor.skillsHave.map((skill, idx) => (
                <Badge key={idx} variant="emerald">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>

          <div className="skill-group mt-3">
            <span className="label">Wants to learn:</span>
            <div className="tags">
              {mentor.skillsWant.length === 0 ? (
                <span className="text-xs text-secondary">Open to all peer skills</span>
              ) : (
                mentor.skillsWant.map((skill, idx) => (
                  <Badge key={idx} variant="violet">
                    {skill}
                  </Badge>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </div>

      <CardFooter style={{ gap: '10px', padding: '14px 22px' }}>
        {onViewProfile && (
          <Button
            variant="outline"
            size="default"
            onClick={() => onViewProfile(mentor)}
            title="Inspect Bio, Schedule & Reviews"
          >
            <Eye size={15} /> Profile
          </Button>
        )}
        <Button variant="default" size="default" className="w-full" onClick={() => onBook(mentor)}>
          Book Session (50 CR)
        </Button>
      </CardFooter>
    </Card>
  );
}
