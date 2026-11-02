'use client';

import React from 'react';
import { Star, Coins, Sparkles, Eye } from 'lucide-react';
import { Mentor } from '@/types';

interface MentorCardProps {
  mentor: Mentor;
  onBook: (mentor: Mentor) => void;
  onViewProfile?: (mentor: Mentor) => void;
}

export function MentorCard({ mentor, onBook, onViewProfile }: MentorCardProps) {
  return (
    <div className="mentor-card glass-card">
      <div className="card-header">
        <div
          className="mentor-info"
          style={{ cursor: onViewProfile ? 'pointer' : 'default' }}
          onClick={() => onViewProfile && onViewProfile(mentor)}
          title="Click to view full mentor profile & learner reviews"
        >
          <div className="avatar-sm">{mentor.initials}</div>
          <div>
            <div className="flex items-center gap-2">
              <h4>{mentor.name || mentor.displayName}</h4>
              {mentor.isBarterMatch && (
                <span
                  className="tag tag-emerald"
                  style={{ fontSize: '0.65rem', padding: '2px 6px' }}
                  title="Bidirectional Skill Swap Match!"
                >
                  <Sparkles size={10} style={{ display: 'inline', marginRight: '3px' }} />
                  Swap Match
                </span>
              )}
            </div>
            <div className="rating">
              <Star size={12} fill="currentColor" /> {mentor.rating} (
              {mentor.sessions ?? mentor.totalSessions} sessions)
            </div>
          </div>
        </div>
        <div className="rate-badge">
          50 <Coins size={14} />
        </div>
      </div>

      <div className="card-body">
        <div className="skill-group">
          <span className="label">Teaches:</span>
          <div className="tags">
            {mentor.skillsHave.map((skill, idx) => (
              <span key={idx} className="tag tag-emerald">
                {skill}
              </span>
            ))}
          </div>
        </div>
        <div className="skill-group mt-3">
          <span className="label">Wants to learn:</span>
          <div className="tags">
            {mentor.skillsWant.map((skill, idx) => (
              <span key={idx} className="tag tag-violet">
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="card-footer flex gap-2">
        {onViewProfile && (
          <button
            className="btn glass-btn"
            onClick={() => onViewProfile(mentor)}
            type="button"
            style={{ padding: '10px 14px' }}
            title="Inspect Bio, Schedule & Reviews"
          >
            <Eye size={16} /> Profile
          </button>
        )}
        <button
          className="btn btn-primary w-full justify-center"
          onClick={() => onBook(mentor)}
          type="button"
        >
          Book Session
        </button>
      </div>
    </div>
  );
}
