'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  ShieldAlert,
  CheckCircle,
  RotateCcw,
  Users,
  Ban,
  Unlock,
  Trash2,
  MessageSquare,
  Shield
} from 'lucide-react';
import { Session, AdminUserItem } from '@/types';
import { apiRequest } from '@/lib/apiClient';
import { useAuth } from '@/context/AuthContext';

export default function AdminDisputesPage() {
  const { user, switchDemoAccount, refreshProfile } = useAuth();
  const [disputes, setDisputes] = useState<Session[]>([]);
  const [usersList, setUsersList] = useState<AdminUserItem[]>([]);
  const [statusMsg, setStatusMsg] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const loadAdminData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [dispRes, usrRes] = await Promise.all([
        apiRequest('/admin/disputes'),
        apiRequest('/admin/users')
      ]);
      if (dispRes?.success && Array.isArray(dispRes.disputes)) {
        setDisputes(dispRes.disputes);
      }
      if (usrRes?.success && Array.isArray(usrRes.users)) {
        setUsersList(usrRes.users);
      }
    } catch (err: any) {
      // If current persona is not ADMIN, prompt or allow 1-click elevation
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      loadAdminData();
    }
  }, [user?.role, loadAdminData]);

  const handleElevateToAdmin = async () => {
    try {
      await switchDemoAccount('admin@skillswap.io');
      setStatusMsg({
        type: 'success',
        text: 'Authenticated as Platform Administrator (admin@skillswap.io).'
      });
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message });
    }
  };

  // Feature #52: Admin Approves Learner Refund (+50 CR Learner)
  const handleRefundLearner = async (sessionId: string) => {
    try {
      const res = await apiRequest(`/admin/disputes/${sessionId}/refund`, {
        method: 'POST'
      });
      setStatusMsg({
        type: 'success',
        text: res?.message || 'Dispute upheld: 50 Credits refunded to Learner.'
      });
      await loadAdminData();
      await refreshProfile();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message });
    }
  };

  // Feature #53: Admin Rejects Dispute & Releases to Mentor (+45 CR Mentor, 5 CR Burn)
  const handleReleaseToMentor = async (sessionId: string) => {
    try {
      const res = await apiRequest(`/admin/disputes/${sessionId}/release`, {
        method: 'POST'
      });
      setStatusMsg({
        type: 'success',
        text:
          res?.message ||
          'Dispute dismissed: 45 Credits released to Mentor, 5 Credits burned.'
      });
      await loadAdminData();
      await refreshProfile();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message });
    }
  };

  // Feature #54: Ban / Unban User (PUT /api/admin/users/:userId/ban)
  const handleToggleBanUser = async (targetUser: AdminUserItem) => {
    try {
      const res = await apiRequest(`/admin/users/${targetUser._id}/ban`, {
        method: 'PUT',
        body: JSON.stringify({ isBanned: !targetUser.isBanned })
      });
      setStatusMsg({
        type: 'success',
        text:
          res?.message ||
          `User ${targetUser.displayName} ${!targetUser.isBanned ? 'banned' : 'unbanned'} successfully.`
      });
      await loadAdminData();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message });
    }
  };

  // Feature #55: Permanently Remove User (DELETE /api/admin/users/:userId)
  const handleRemoveUser = async (targetUser: AdminUserItem) => {
    try {
      const res = await apiRequest(`/admin/users/${targetUser._id}`, {
        method: 'DELETE'
      });
      setStatusMsg({
        type: 'success',
        text:
          res?.message ||
          `User ${targetUser.displayName} (${targetUser.email}) has been permanently removed.`
      });
      setUsersList((prev) => prev.filter((item) => item._id !== targetUser._id));
      await loadAdminData();
      await refreshProfile();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message });
    }
  };

  return (
    <section className="view active">
      <div className="flex-between mb-6" style={{ flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 className="text-2xl font-bold">Admin Dispute &amp; Governance Console</h2>
          <p className="text-secondary mt-1">
            Inspect frozen 50 CR Escrow sessions, review workspace chat logs, and moderate accounts.
          </p>
        </div>

        {user?.role !== 'ADMIN' && (
          <button
            type="button"
            onClick={handleElevateToAdmin}
            className="btn btn-primary"
          >
            <Shield size={16} /> Switch to Admin Role (JWT)
          </button>
        )}
      </div>

      {user?.role !== 'ADMIN' && (
        <div
          className="glass-panel p-6 border-radius-16 mb-6"
          style={{ borderColor: 'var(--accent-amber)' }}
        >
          <div className="flex items-center justify-between" style={{ flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 className="text-lg font-bold text-amber">
                Administrator Privileges Required (RBAC Guard)
              </h3>
              <p className="text-secondary text-sm mt-1">
                You are currently signed in as <strong>{user?.displayName}</strong> ({user?.role}).
                Click <strong>Switch to Admin Role</strong> to authenticate as{' '}
                <code>admin@skillswap.io</code> and unlock Escrow Arbitration &amp; User Moderation.
              </p>
            </div>
            <button
              type="button"
              onClick={handleElevateToAdmin}
              className="btn btn-primary"
            >
              <Shield size={16} /> Authenticate as Admin
            </button>
          </div>
        </div>
      )}

      {statusMsg && (
        <div
          className="glass-panel p-6 border-radius-16 mb-6 font-bold"
          style={{
            padding: '12px 16px',
            color:
              statusMsg.type === 'error' ? 'var(--accent-red)' : 'var(--accent-emerald)',
            borderColor:
              statusMsg.type === 'error' ? 'var(--accent-red)' : 'var(--accent-emerald)'
          }}
        >
          {statusMsg.text}
        </div>
      )}

      {/* Disputed Sessions Queue (Features #51, #52, #53) */}
      <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
        <ShieldAlert size={18} className="text-amber" /> Frozen Escrow Dispute Queue (
        {disputes.length})
      </h3>

      {disputes.length === 0 ? (
        <div className="glass-panel p-6 border-radius-16 mb-6">
          <div className="flex items-center gap-3">
            <ShieldAlert className="text-emerald" />
            <div>
              <h4 className="font-bold">Zero Frozen Disputes</h4>
              <p className="text-secondary text-sm">
                All mentorship escrow sessions are operating smoothly. Raise a dispute from{' '}
                <strong>Active Sessions → End Session → Didn&apos;t Learn (Dispute)</strong> to test
                arbitration here.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="mentors-grid mb-6">
          {disputes.map((d) => (
            <div key={d._id} className="glass-card">
              <div className="card-header">
                <div>
                  <h4>{d.skillName}</h4>
                  <p className="text-xs text-secondary mt-1">
                    Learner: <strong>{d.learnerName}</strong> | Mentor:{' '}
                    <strong>{d.mentorName}</strong>
                  </p>
                </div>
                <span className="badge">{d.creditsLocked} CR FROZEN</span>
              </div>
              <div className="card-body">
                <p className="text-sm text-amber mb-3">
                  <strong>Dispute Reason:</strong>{' '}
                  {d.disputeReason || 'Learner reported unsatisfied session delivery.'}
                </p>

                {/* Chat Audit Log Evidence */}
                {d.chatLogs && d.chatLogs.length > 0 && (
                  <div
                    className="mb-4"
                    style={{
                      background: 'rgba(11, 15, 25, 0.65)',
                      border: '1px solid var(--border-glass)',
                      borderRadius: '10px',
                      padding: '8px 10px',
                      maxHeight: '110px',
                      overflowY: 'auto'
                    }}
                  >
                    <p className="text-xs text-secondary uppercase mb-1 flex items-center gap-1">
                      <MessageSquare size={12} /> Session Chat Transcript ({d.chatLogs.length})
                    </p>
                    {d.chatLogs.map((log, idx) => (
                      <div key={log._id || idx} style={{ fontSize: '0.76rem', marginBottom: '4px' }}>
                        <strong className="text-emerald">{log.senderName}:</strong>{' '}
                        <span className="text-secondary">{log.messageText || log.text}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-3" style={{ flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-primary"
                    onClick={() => handleRefundLearner(d._id)}
                    type="button"
                  >
                    <RotateCcw size={16} /> Approve Refund (+50 CR Learner)
                  </button>
                  <button
                    className="btn glass-btn"
                    onClick={() => handleReleaseToMentor(d._id)}
                    type="button"
                  >
                    <CheckCircle size={16} /> Release to Mentor (+45 CR / 5 Burn)
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* User Governance & Ban Moderation Table (Feature #54) */}
      <h3 className="text-lg font-bold mb-3 mt-6 flex items-center gap-2">
        <Users size={18} className="text-emerald" /> User Account Moderation &amp; Policy
        Enforcement
      </h3>

      <div className="glass-panel p-6 border-radius-16">
        <div className="table-container">
          <table className="ledger-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Wallet</th>
                <th>Status</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {usersList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-secondary text-sm">
                    {isLoading
                      ? 'Loading platform users...'
                      : 'Switch to Admin Role above to load and moderate user accounts.'}
                  </td>
                </tr>
              ) : (
                usersList.map((u) => (
                  <tr key={u._id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div
                          className="avatar"
                          style={{ width: '28px', height: '28px', fontSize: '0.75rem' }}
                        >
                          {u.initials}
                        </div>
                        <span className="font-bold">{u.displayName}</span>
                      </div>
                    </td>
                    <td className="text-secondary text-sm">{u.email}</td>
                    <td>
                      <span
                        className={`badge-type ${
                          u.role === 'ADMIN' ? 'badge-lock' : 'badge-bonus'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="text-emerald font-bold">{u.credits} CR</td>
                    <td>
                      <span
                        className={`badge-type ${
                          u.isBanned ? 'badge-burn' : 'badge-release'
                        }`}
                      >
                        {u.isBanned ? 'BANNED' : 'ACTIVE'}
                      </span>
                    </td>
                    <td className="text-right">
                      {u.role !== 'ADMIN' && (
                        <div
                          className="flex items-center gap-2"
                          style={{ justifyContent: 'flex-end' }}
                        >
                          <button
                            type="button"
                            onClick={() => handleToggleBanUser(u)}
                            className={`btn ${u.isBanned ? 'btn-primary' : 'glass-btn'}`}
                            style={{
                              padding: '5px 10px',
                              fontSize: '0.75rem',
                              display: 'inline-flex'
                            }}
                          >
                            {u.isBanned ? (
                              <>
                                <Unlock size={13} /> Unban User
                              </>
                            ) : (
                              <>
                                <Ban size={13} /> Ban User
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveUser(u)}
                            className="btn btn-danger"
                            style={{
                              padding: '5px 10px',
                              fontSize: '0.75rem',
                              display: 'inline-flex'
                            }}
                          >
                            <Trash2 size={13} /> Remove User
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
