'use client';

import React, { useEffect, useState } from 'react';
import { ShieldAlert, CheckCircle, RotateCcw } from 'lucide-react';
import { Session } from '@/types';
import { apiRequest } from '@/lib/apiClient';

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<Session[]>([]);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const loadDisputes = async () => {
    try {
      const res = await apiRequest('/admin/disputes');
      if (res?.success && Array.isArray(res.disputes)) {
        setDisputes(res.disputes);
      }
    } catch (_) {
      // No active disputes or non-admin preview
    }
  };

  useEffect(() => {
    loadDisputes();
  }, []);

  const handleRefundLearner = async (sessionId: string) => {
    try {
      const res = await apiRequest(`/admin/disputes/${sessionId}/refund`, {
        method: 'POST'
      });
      setStatusMsg(res?.message || '50 Credits refunded to Learner.');
      loadDisputes();
    } catch (err: any) {
      setStatusMsg(err.message);
    }
  };

  const handleReleaseToMentor = async (sessionId: string) => {
    try {
      const res = await apiRequest(`/admin/disputes/${sessionId}/release`, {
        method: 'POST'
      });
      setStatusMsg(res?.message || '45 Credits released to Mentor, 5 burned.');
      loadDisputes();
    } catch (err: any) {
      setStatusMsg(err.message);
    }
  };

  return (
    <section className="view active">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Admin Dispute Arbitration Console</h2>
        <p className="text-secondary mt-1">
          Inspect frozen 50 CR Escrow sessions and issue binding rulings.
        </p>
      </div>

      {statusMsg && (
        <div className="glass-panel p-6 border-radius-16 mb-6 text-emerald font-bold">
          {statusMsg}
        </div>
      )}

      {disputes.length === 0 ? (
        <div className="glass-panel p-6 border-radius-16">
          <div className="flex items-center gap-3">
            <ShieldAlert className="text-emerald" />
            <div>
              <h3 className="text-lg font-bold">Zero Frozen Disputes</h3>
              <p className="text-secondary text-sm">
                All mentorship escrow sessions are operating smoothly.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="mentors-grid">
          {disputes.map((d) => (
            <div key={d._id} className="glass-card">
              <div className="card-header">
                <div>
                  <h4>{d.skillName}</h4>
                  <p className="text-xs text-secondary mt-1">
                    Learner: {d.learnerName} | Mentor: {d.mentorName}
                  </p>
                </div>
                <span className="badge">{d.creditsLocked} CR FROZEN</span>
              </div>
              <div className="card-body">
                <p className="text-sm text-secondary mb-4">
                  Reason: {d.disputeReason || 'Disputed session delivery'}
                </p>
                <div className="flex gap-3">
                  <button
                    className="btn btn-primary"
                    onClick={() => handleRefundLearner(d._id)}
                    type="button"
                  >
                    <RotateCcw size={16} /> Approve Refund (+50 CR)
                  </button>
                  <button
                    className="btn glass-btn"
                    onClick={() => handleReleaseToMentor(d._id)}
                    type="button"
                  >
                    <CheckCircle size={16} /> Release to Mentor (+45 CR)
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
