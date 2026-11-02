'use client';

import React, { useState } from 'react';
import { CheckCircle2, ThumbsUp, ThumbsDown, Star, X, AlertTriangle } from 'lucide-react';

interface FeedbackModalProps {
  open: boolean;
  mentorName: string;
  skillName?: string;
  errorMsg?: string | null;
  isSubmitting?: boolean;
  onClose: () => void;
  onMarkAsLearnt: (rating: number, comment: string) => void;
  onDispute: (reason: string) => void;
}

export function FeedbackModal({
  open,
  mentorName,
  skillName,
  errorMsg,
  isSubmitting = false,
  onClose,
  onMarkAsLearnt,
  onDispute
}: FeedbackModalProps) {
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>(
    'Excellent 1-on-1 mentorship session! Concepts and code examples were explained clearly.'
  );
  const [showDisputeForm, setShowDisputeForm] = useState<boolean>(false);
  const [disputeReason, setDisputeReason] = useState<string>(
    'Mentor did not cover the agreed learning objectives.'
  );

  return (
    <div className={`modal-overlay ${open ? 'active' : ''}`} id="feedback-modal">
      <div className="modal-content glass-panel" style={{ maxWidth: '460px' }}>
        <div className="modal-header">
          <h3>Session Settlement &amp; Review</h3>
          <button
            className="icon-btn close-modal"
            onClick={onClose}
            type="button"
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-body text-center">
          <div className="success-icon mb-3">
            <CheckCircle2 size={56} />
          </div>
          <p className="font-bold">
            How was your {skillName || 'mentorship'} session with {mentorName}?
          </p>
          <p className="text-xs text-secondary mt-1">
            Marking as Learnt releases <strong>45 CR (90%)</strong> to {mentorName} and burns{' '}
            <strong>5 CR (10%)</strong>.
          </p>

          {/* 1-5 Star Rating Selector (Feature #37) */}
          <div
            className="flex justify-center gap-2 my-4"
            style={{ justifyContent: 'center' }}
          >
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: star <= rating ? 'var(--accent-amber)' : 'var(--text-secondary)',
                  transform: star <= rating ? 'scale(1.1)' : 'scale(1)',
                  transition: 'all 0.15s ease'
                }}
                title={`Rate ${star} out of 5 stars`}
              >
                <Star size={26} fill={star <= rating ? 'currentColor' : 'none'} />
              </button>
            ))}
          </div>

          {/* Written Review Input */}
          <div style={{ textAlign: 'left', marginBottom: '14px' }}>
            <label className="text-xs text-secondary uppercase block mb-1">
              Written Review for {mentorName} ({rating}/5 Stars)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
              placeholder="Write your feedback for this session..."
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '10px',
                background: 'var(--bg-obsidian)',
                border: '1px solid var(--border-glass)',
                color: 'var(--text-primary)',
                fontSize: '0.82rem'
              }}
            />
          </div>

          {errorMsg && (
            <div
              className="mb-3"
              style={{
                padding: '10px 12px',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid var(--accent-red)',
                color: 'var(--accent-red)',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                textAlign: 'left'
              }}
            >
              <AlertTriangle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="feedback-actions mt-4">
            <button
              className="btn btn-primary w-full justify-center mb-3"
              disabled={isSubmitting}
              onClick={() => onMarkAsLearnt(rating, comment)}
              type="button"
            >
              <ThumbsUp size={18} />{' '}
              {isSubmitting
                ? 'Settling Escrow...'
                : 'Mark as Learnt (Release 45 CR / Burn 5 CR)'}
            </button>

            {!showDisputeForm ? (
              <button
                className="btn glass-btn w-full justify-center text-red-400 border-red-900/50 hover:bg-red-900/20"
                onClick={() => setShowDisputeForm(true)}
                type="button"
              >
                <ThumbsDown size={18} /> Didn&apos;t Learn (Raise Escrow Dispute)
              </button>
            ) : (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  borderRadius: '12px',
                  padding: '12px',
                  textAlign: 'left'
                }}
              >
                <label className="text-xs text-red-400 uppercase font-bold block mb-1">
                  Dispute Reason (Freezes 50 CR for Admin Review)
                </label>
                <textarea
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    background: 'var(--bg-obsidian)',
                    border: '1px solid var(--border-glass)',
                    color: 'var(--text-primary)',
                    fontSize: '0.8rem',
                    marginBottom: '8px'
                  }}
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => onDispute(disputeReason)}
                    className="btn btn-danger w-full justify-center"
                    style={{ fontSize: '0.8rem', padding: '8px 12px' }}
                  >
                    Confirm Dispute &amp; Freeze 50 CR
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDisputeForm(false)}
                    className="btn glass-btn"
                    style={{ fontSize: '0.8rem', padding: '8px 12px' }}
                  >
                    Back
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
