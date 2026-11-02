'use client';

import React from 'react';
import { CheckCircle2, ThumbsUp, ThumbsDown } from 'lucide-react';

interface FeedbackModalProps {
  open: boolean;
  mentorName: string;
  onMarkAsLearnt: () => void;
  onDispute: () => void;
}

export function FeedbackModal({
  open,
  mentorName,
  onMarkAsLearnt,
  onDispute
}: FeedbackModalProps) {
  return (
    <div className={`modal-overlay ${open ? 'active' : ''}`} id="feedback-modal">
      <div className="modal-content glass-panel">
        <div className="modal-header">
          <h3>Session Completed</h3>
        </div>
        <div className="modal-body text-center">
          <div className="success-icon mb-4">
            <CheckCircle2 size={64} />
          </div>
          <p>How was your session with {mentorName}?</p>
          <div className="feedback-actions mt-6">
            <button
              className="btn btn-primary w-full justify-center mb-3"
              onClick={onMarkAsLearnt}
              type="button"
            >
              <ThumbsUp size={18} /> Mark as Learnt
            </button>
            <button
              className="btn glass-btn w-full justify-center text-red-400 border-red-900/50 hover:bg-red-900/20"
              onClick={onDispute}
              type="button"
            >
              <ThumbsDown size={18} /> Didn&apos;t Learn (Dispute)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
