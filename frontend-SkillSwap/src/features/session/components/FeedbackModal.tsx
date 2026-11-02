'use client';

import React, { useState } from 'react';
import { CheckCircle2, ThumbsUp, ThumbsDown, Star, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';

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
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent onClose={onClose} style={{ maxWidth: '470px' }}>
        <DialogHeader>
          <DialogTitle>Session Settlement &amp; Review</DialogTitle>
          <DialogDescription>
            Marking as Learnt releases <strong>45 CR (90%)</strong> to {mentorName} and burns{' '}
            <strong>5 CR (10%)</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="text-center">
          <div className="success-icon mb-3">
            <CheckCircle2 size={52} />
          </div>
          <p className="font-bold text-sm">
            How was your {skillName || 'mentorship'} session with {mentorName}?
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
                  color: star <= rating ? 'var(--accent-amber)' : 'var(--shadcn-muted-fg)',
                  transform: star <= rating ? 'scale(1.12)' : 'scale(1)',
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
            <Label>Written Review for {mentorName} ({rating}/5 Stars)</Label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
              placeholder="Write your feedback for this session..."
            />
          </div>

          {errorMsg && (
            <Alert variant="destructive" className="mb-3" style={{ textAlign: 'left' }}>
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} />
                <AlertDescription>{errorMsg}</AlertDescription>
              </div>
            </Alert>
          )}

          <div className="mt-4" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Button
              variant="default"
              size="lg"
              className="w-full"
              disabled={isSubmitting}
              onClick={() => onMarkAsLearnt(rating, comment)}
            >
              <ThumbsUp size={16} />{' '}
              {isSubmitting
                ? 'Settling Escrow...'
                : 'Mark as Learnt (Release 45 CR / Burn 5 CR)'}
            </Button>

            {!showDisputeForm ? (
              <Button
                variant="destructive"
                size="default"
                className="w-full"
                onClick={() => setShowDisputeForm(true)}
              >
                <ThumbsDown size={16} /> Didn&apos;t Learn (Raise Escrow Dispute)
              </Button>
            ) : (
              <Alert variant="destructive" style={{ textAlign: 'left' }}>
                <Label className="text-red-400">
                  Dispute Reason (Freezes 50 CR for Admin Review)
                </Label>
                <Textarea
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  rows={2}
                  style={{ marginBottom: '10px' }}
                />
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={isSubmitting}
                    onClick={() => onDispute(disputeReason)}
                    className="w-full"
                  >
                    Confirm Dispute &amp; Freeze 50 CR
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDisputeForm(false)}
                  >
                    Back
                  </Button>
                </div>
              </Alert>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
