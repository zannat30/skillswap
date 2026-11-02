'use client';

import React from 'react';
import { Star, Coins } from 'lucide-react';
import { Mentor } from '@/types';

interface MentorCardProps {
  mentor: Mentor;
  onBook: (mentor: Mentor) => void;
}

export function MentorCard({ mentor, onBook }: MentorCardProps) {
  return (
    <div className="mentor-card glass-card">
      <div className="card-header">
        <div className="mentor-info">
          <div className="avatar-sm">{mentor.initials}</div>
          <div>
            <h4>{mentor.name || mentor.displayName}</h4>
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

      <div className="card-footer">
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
