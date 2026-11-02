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
  MessageSquare
} from 'lucide-react';
import { Session, AdminUserItem } from '@/types';
import { apiRequest } from '@/lib/apiClient';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@/components/ui/table';

export default function AdminDisputesPage() {
  const { user, refreshProfile } = useAuth();
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
      setStatusMsg({ type: 'error', text: err.message });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      loadAdminData();
    }
  }, [user?.role, loadAdminData]);

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
          <Badge variant="amber" style={{ marginBottom: '8px' }}>
            <ShieldAlert size={12} /> Super Admin Governance
          </Badge>
          <h2 className="text-2xl font-bold">Admin Dispute &amp; Governance Console</h2>
          <p className="text-secondary mt-1">
            Inspect frozen 50 CR Escrow sessions, review workspace chat logs, and moderate accounts.
          </p>
        </div>
      </div>

      {user?.role !== 'ADMIN' && (
        <Alert variant="amber" className="mb-6">
          <AlertTitle>Administrator Privileges Required (RBAC Guard)</AlertTitle>
          <AlertDescription>
            Access denied. Please sign in with the Super Admin account (
            <code>admin@admin.com</code>) to access Escrow Arbitration &amp; User Moderation.
          </AlertDescription>
        </Alert>
      )}

      {statusMsg && (
        <Alert
          variant={statusMsg.type === 'error' ? 'destructive' : 'emerald'}
          className="mb-6"
        >
          <AlertDescription className="font-bold">{statusMsg.text}</AlertDescription>
        </Alert>
      )}

      {/* Disputed Sessions Queue (Features #51, #52, #53) */}
      <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
        <ShieldAlert size={18} className="text-amber" /> Frozen Escrow Dispute Queue (
        {disputes.length})
      </h3>

      {disputes.length === 0 ? (
        <Card className="mb-6">
          <CardHeader style={{ flexDirection: 'row', alignItems: 'center', gap: '14px' }}>
            <ShieldAlert className="text-emerald" size={24} />
            <div>
              <CardTitle style={{ fontSize: '1rem' }}>Zero Frozen Disputes</CardTitle>
              <CardDescription>
                All mentorship escrow sessions are operating smoothly. Raise a dispute from{' '}
                <strong>Active Sessions → End Session → Didn&apos;t Learn (Dispute)</strong> to test
                arbitration here.
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
      ) : (
        <div className="mentors-grid mb-6">
          {disputes.map((d) => (
            <Card key={d._id}>
              <CardHeader
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid var(--shadcn-border)'
                }}
              >
                <div>
                  <CardTitle>{d.skillName}</CardTitle>
                  <CardDescription className="mt-1">
                    Learner: <strong>{d.learnerName}</strong> | Mentor:{' '}
                    <strong>{d.mentorName}</strong>
                  </CardDescription>
                </div>
                <Badge variant="amber">{d.creditsLocked} CR FROZEN</Badge>
              </CardHeader>

              <CardContent style={{ paddingTop: '18px' }}>
                <p className="text-sm text-amber mb-3">
                  <strong>Dispute Reason:</strong>{' '}
                  {d.disputeReason || 'Learner reported unsatisfied session delivery.'}
                </p>

                {/* Chat Audit Log Evidence */}
                {d.chatLogs && d.chatLogs.length > 0 && (
                  <div
                    className="mb-4"
                    style={{
                      background: '#09090b',
                      border: '1px solid var(--shadcn-border)',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      maxHeight: '120px',
                      overflowY: 'auto'
                    }}
                  >
                    <p className="text-xs text-secondary uppercase mb-1 flex items-center gap-1">
                      <MessageSquare size={12} /> Session Chat Transcript ({d.chatLogs.length})
                    </p>
                    {d.chatLogs.map((log, idx) => (
                      <div key={log._id || idx} style={{ fontSize: '0.78rem', marginBottom: '4px' }}>
                        <strong className="text-emerald">{log.senderName}:</strong>{' '}
                        <span className="text-secondary">{log.messageText || log.text}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>

              <CardFooter style={{ gap: '10px', flexWrap: 'wrap' }}>
                <Button variant="default" size="sm" onClick={() => handleRefundLearner(d._id)}>
                  <RotateCcw size={14} /> Approve Refund (+50 CR Learner)
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleReleaseToMentor(d._id)}>
                  <CheckCircle size={14} /> Release to Mentor (+45 CR / 5 Burn)
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* User Governance & Ban/Remove Moderation Table (Features #54 & #55) */}
      <h3 className="text-lg font-bold mb-3 mt-6 flex items-center gap-2">
        <Users size={18} className="text-emerald" /> User Account Moderation &amp; Policy
        Enforcement
      </h3>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Wallet</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usersList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-secondary text-sm">
                  {isLoading
                    ? 'Loading platform users...'
                    : 'Sign in as Super Admin to view and moderate user accounts.'}
                </TableCell>
              </TableRow>
            ) : (
              usersList.map((u) => (
                <TableRow key={u._id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar style={{ height: '30px', width: '30px' }}>
                        <AvatarFallback style={{ fontSize: '0.75rem' }}>
                          {u.initials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-bold">{u.displayName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-secondary text-sm">{u.email}</TableCell>
                  <TableCell>
                    <Badge variant={u.role === 'ADMIN' ? 'amber' : 'violet'}>
                      {u.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-emerald font-bold">{u.credits} CR</TableCell>
                  <TableCell>
                    <Badge variant={u.isBanned ? 'destructive' : 'emerald'}>
                      {u.isBanned ? 'BANNED' : 'ACTIVE'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {u.role !== 'ADMIN' && (
                      <div
                        className="flex items-center gap-2"
                        style={{ justifyContent: 'flex-end' }}
                      >
                        <Button
                          variant={u.isBanned ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleToggleBanUser(u)}
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
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemoveUser(u)}
                        >
                          <Trash2 size={13} /> Remove User
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </section>
  );
}
