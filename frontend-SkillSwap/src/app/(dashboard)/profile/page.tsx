'use client';

import React, { useState } from 'react';
import {
  Plus,
  X,
  Edit3,
  Calendar,
  Flame,
  KeyRound,
  RefreshCw,
  Check,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { TransactionTable } from '@/features/wallet/components/TransactionTable';
import { apiRequest } from '@/lib/apiClient';
import { DomainCategory, SkillItem, SkillLevel } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from '@/components/ui/card';

const DOMAINS: DomainCategory[] = ['Technology', 'Creative Arts', 'Languages', 'Academics'];
const LEVELS: SkillLevel[] = ['BEGINNER', 'INTERMEDIATE', 'EXPERT'];

const formatLevelLabel = (level?: string) => {
  if (!level) return 'Intermediate';
  return level.charAt(0).toUpperCase() + level.slice(1).toLowerCase();
};

const nextLevel = (current: SkillLevel): SkillLevel => {
  if (current === 'BEGINNER') return 'INTERMEDIATE';
  if (current === 'INTERMEDIATE') return 'EXPERT';
  return 'BEGINNER';
};

export default function ProfilePage() {
  const { user, profile, availableCredits, lockedInEscrow, transactions, refreshProfile } =
    useAuth();

  // Feedback / Error Banner
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Bio & Display Name Editor (Feature #11)
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState(profile.displayName);
  const [editBioText, setEditBioText] = useState(profile.bio);

  // Change Password Editor (Feature #6)
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Add Skill Have Form (Features #12-#15)
  const [showAddHave, setShowAddHave] = useState(false);
  const [haveSkillName, setHaveSkillName] = useState('');
  const [haveDomain, setHaveDomain] = useState<DomainCategory>('Technology');
  const [haveLevel, setHaveLevel] = useState<SkillLevel>('EXPERT');

  // Add Skill Want Form (Features #16-#19)
  const [showAddWant, setShowAddWant] = useState(false);
  const [wantSkillName, setWantSkillName] = useState('');
  const [wantDomain, setWantDomain] = useState<DomainCategory>('Technology');
  const [wantLevel, setWantLevel] = useState<SkillLevel>('BEGINNER');

  // Add/Edit Availability Form (Features #20-#23)
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [slotDate, setSlotDate] = useState('2026-11-20');
  const [slotTime, setSlotTime] = useState('18:00-19:00');
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [editingSlotsInput, setEditingSlotsInput] = useState('');

  const showToast = (type: 'success' | 'error', text: string) => {
    setStatusMessage({ type, text });
  };

  // Feature #11: Update Bio & Display Name
  const handleSaveBio = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/profile/bio', {
        method: 'PUT',
        body: JSON.stringify({
          displayName: editDisplayName,
          bio: editBioText
        })
      });
      await refreshProfile();
      setIsEditingBio(false);
      showToast('success', 'Profile name and bio updated!');
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update profile.');
    }
  };

  // Feature #6: Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiRequest('/auth/password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword })
      });
      setCurrentPassword('');
      setNewPassword('');
      setIsChangingPassword(false);
      showToast('success', res.message || 'Password updated successfully.');
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update password.');
    }
  };

  // Feature #12: Add Skill I Have
  const handleAddSkillHave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!haveSkillName.trim()) return;
    try {
      await apiRequest('/profile/skills-have', {
        method: 'POST',
        body: JSON.stringify({
          skill: haveSkillName.trim(),
          domain: haveDomain,
          level: haveLevel
        })
      });
      setHaveSkillName('');
      setShowAddHave(false);
      await refreshProfile();
      showToast('success', `Added "${haveSkillName.trim()}" to Skills I Have.`);
    } catch (err: any) {
      showToast(
        'error',
        err.code === 'FORBIDDEN_DOMAIN'
          ? `403 FORBIDDEN_DOMAIN: ${err.message}`
          : err.message
      );
    }
  };

  // Feature #14: Update Skill I Have Level
  const handleCycleSkillHaveLevel = async (item: SkillItem) => {
    if (!item._id) return;
    const updatedLevel = nextLevel(item.level || 'INTERMEDIATE');
    try {
      await apiRequest(`/profile/skills-have/${item._id}`, {
        method: 'PUT',
        body: JSON.stringify({
          skill: item.skill,
          domain: item.domain,
          level: updatedLevel
        })
      });
      await refreshProfile();
      showToast('success', `Updated ${item.skill} proficiency to ${formatLevelLabel(updatedLevel)}.`);
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  // Feature #15: Delete Skill I Have
  const handleDeleteSkillHave = async (skillId?: string, skillName?: string) => {
    if (!skillId) return;
    try {
      await apiRequest(`/profile/skills-have/${skillId}`, { method: 'DELETE' });
      await refreshProfile();
      showToast('success', `Removed "${skillName}" from Skills I Have.`);
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  // Feature #16: Add Skill I Want
  const handleAddSkillWant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wantSkillName.trim()) return;
    try {
      await apiRequest('/profile/skills-want', {
        method: 'POST',
        body: JSON.stringify({
          skill: wantSkillName.trim(),
          domain: wantDomain,
          level: wantLevel
        })
      });
      setWantSkillName('');
      setShowAddWant(false);
      await refreshProfile();
      showToast('success', `Added "${wantSkillName.trim()}" to Skills I Want.`);
    } catch (err: any) {
      showToast(
        'error',
        err.code === 'FORBIDDEN_DOMAIN'
          ? `403 FORBIDDEN_DOMAIN: ${err.message}`
          : err.message
      );
    }
  };

  // Feature #18: Update Skill I Want Level
  const handleCycleSkillWantLevel = async (item: SkillItem) => {
    if (!item._id) return;
    const updatedLevel = nextLevel(item.level || 'BEGINNER');
    try {
      await apiRequest(`/profile/skills-want/${item._id}`, {
        method: 'PUT',
        body: JSON.stringify({
          skill: item.skill,
          domain: item.domain,
          level: updatedLevel
        })
      });
      await refreshProfile();
      showToast('success', `Updated ${item.skill} target level to ${formatLevelLabel(updatedLevel)}.`);
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  // Feature #19: Delete Skill I Want
  const handleDeleteSkillWant = async (skillId?: string, skillName?: string) => {
    if (!skillId) return;
    try {
      await apiRequest(`/profile/skills-want/${skillId}`, { method: 'DELETE' });
      await refreshProfile();
      showToast('success', `Removed "${skillName}" from Skills I Want.`);
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  // Feature #20: Add Mentor Availability Slot
  const handleAddAvailability = async (e: React.FormEvent) => {
    e.preventDefault();
    const slots = slotTime
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    try {
      await apiRequest('/profile/availability', {
        method: 'POST',
        body: JSON.stringify({ date: slotDate, slots })
      });
      setShowAddSlot(false);
      await refreshProfile();
      showToast('success', `Added availability on ${slotDate} (${slots.join(', ')}).`);
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  // Feature #22: Update Availability Slot
  const handleUpdateAvailability = async (slotId: string, date: string) => {
    const slots = editingSlotsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    try {
      await apiRequest(`/profile/availability/${slotId}`, {
        method: 'PUT',
        body: JSON.stringify({ date, slots })
      });
      setEditingSlotId(null);
      await refreshProfile();
      showToast('success', `Updated schedule for ${date}.`);
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  // Feature #23: Delete Availability Slot
  const handleDeleteAvailability = async (slotId?: string, date?: string) => {
    if (!slotId) return;
    try {
      await apiRequest(`/profile/availability/${slotId}`, { method: 'DELETE' });
      await refreshProfile();
      showToast('success', `Removed availability slot for ${date}.`);
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  // Feature #48: Claim 7-Day Streak Bonus (+20 CR)
  const handleClaimStreak = async () => {
    try {
      const res = await apiRequest('/wallet/claim-streak', { method: 'POST' });
      await refreshProfile();
      showToast('success', res.message || '+20 Credit Streak Bonus claimed!');
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  return (
    <section className="view active">
      <div className="flex-between" style={{ flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <Badge variant="emerald" style={{ marginBottom: '6px' }}>
            Identity, Skills &amp; Escrow Wallet
          </Badge>
          <h2 className="text-2xl font-bold">My Profile &amp; Wallet</h2>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="amber" style={{ padding: '7px 14px', fontSize: '0.82rem' }}>
            <Flame size={14} />
            <span>
              <strong>{profile.streakCount} Day</strong> Learning Streak
            </span>
          </Badge>
          {profile.streakBonusEligible && (
            <Button variant="default" size="sm" onClick={handleClaimStreak}>
              Claim +20 CR
            </Button>
          )}
        </div>
      </div>

      {statusMessage && (
        <Alert
          variant={statusMessage.type === 'error' ? 'destructive' : 'emerald'}
          className="mt-4 flex-between"
        >
          <div className="flex items-center gap-2 font-bold">
            {statusMessage.type === 'error' ? <AlertTriangle size={16} /> : <Check size={16} />}
            <AlertDescription>{statusMessage.text}</AlertDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setStatusMessage(null)}>
            <X size={14} />
          </Button>
        </Alert>
      )}

      <div className="profile-grid mt-6">
        {/* Left Column: Profile, Skills & Availability (shadcn Card) */}
        <Card>
          <CardHeader style={{ borderBottom: '1px solid var(--shadcn-border)' }}>
            <div className="flex-between">
              <div className="flex items-center gap-4">
                <Avatar style={{ height: '56px', width: '56px' }}>
                  <AvatarFallback style={{ fontSize: '1.25rem' }}>
                    {user?.initials || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle>{profile.displayName || user?.displayName}</CardTitle>
                  <CardDescription>
                    Joined {profile.joinedAt || '2026'} • ★ {profile.rating} (
                    {profile.totalSessions} sessions)
                  </CardDescription>
                  {profile.bio && (
                    <p className="text-secondary text-xs mt-1" style={{ maxWidth: '340px' }}>
                      {profile.bio}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditDisplayName(profile.displayName);
                    setEditBioText(profile.bio || '');
                    setIsEditingBio((prev) => !prev);
                    setIsChangingPassword(false);
                  }}
                  title="Edit Display Name & Bio"
                >
                  <Edit3 size={13} /> Edit
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    setIsChangingPassword((prev) => !prev);
                    setIsEditingBio(false);
                  }}
                  title="Change Password"
                >
                  <KeyRound size={14} />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent style={{ paddingTop: '24px' }}>
            {/* Inline Edit Bio Form (Feature #11) */}
            {isEditingBio && (
              <form
                onSubmit={handleSaveBio}
                className="mb-4"
                style={{
                  background: '#09090b',
                  padding: '14px',
                  borderRadius: '10px',
                  border: '1px solid var(--shadcn-border)'
                }}
              >
                <Label>Edit Profile Details</Label>
                <Input
                  type="text"
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  placeholder="Display Name"
                  required
                  style={{ marginBottom: '8px' }}
                />
                <Textarea
                  value={editBioText}
                  onChange={(e) => setEditBioText(e.target.value)}
                  placeholder="Short mentor/learner bio..."
                  rows={2}
                  style={{ marginBottom: '10px' }}
                />
                <div className="flex gap-2">
                  <Button type="submit" variant="default" size="sm">
                    Save Bio
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingBio(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}

            {/* Inline Change Password Form (Feature #6) */}
            {isChangingPassword && (
              <form
                onSubmit={handleChangePassword}
                className="mb-4"
                style={{
                  background: '#09090b',
                  padding: '14px',
                  borderRadius: '10px',
                  border: '1px solid var(--shadcn-border)'
                }}
              >
                <Label>Change Account Password</Label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Current Password"
                  required
                  style={{ marginBottom: '8px' }}
                />
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New Password (min 6 chars)"
                  required
                  style={{ marginBottom: '10px' }}
                />
                <div className="flex gap-2">
                  <Button type="submit" variant="default" size="sm">
                    Update Password
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsChangingPassword(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}

            {/* Skills I Have Section (Features #12-#15) */}
            <div className="flex-between mb-3">
              <h4 className="text-sm text-secondary uppercase tracking-wider font-bold">
                Skills I Have
              </h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddHave((prev) => !prev)}
              >
                <Plus size={13} /> Add Skill
              </Button>
            </div>

            {showAddHave && (
              <form
                onSubmit={handleAddSkillHave}
                className="mb-4"
                style={{
                  background: '#09090b',
                  padding: '14px',
                  borderRadius: '10px',
                  border: '1px solid var(--shadcn-border)'
                }}
              >
                <Input
                  type="text"
                  value={haveSkillName}
                  onChange={(e) => setHaveSkillName(e.target.value)}
                  placeholder="Skill name (e.g. Next.js, TypeScript)"
                  required
                  style={{ marginBottom: '8px' }}
                />
                <div className="flex gap-2 mb-3">
                  <select
                    value={haveDomain}
                    onChange={(e) => setHaveDomain(e.target.value as DomainCategory)}
                    className="shadcn-input"
                  >
                    {DOMAINS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                  <select
                    value={haveLevel}
                    onChange={(e) => setHaveLevel(e.target.value as SkillLevel)}
                    className="shadcn-input"
                  >
                    {LEVELS.map((l) => (
                      <option key={l} value={l}>
                        {formatLevelLabel(l)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" variant="default" size="sm">
                    Save Skill
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddHave(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}

            <div className="tags mb-5">
              {profile.skillsHave.length === 0 ? (
                <span className="text-xs text-secondary">
                  No teaching skills added yet. Add a skill to appear on the Marketplace!
                </span>
              ) : (
                profile.skillsHave.map((item, idx) => (
                  <Badge key={item._id || idx} variant="emerald" style={{ gap: '6px' }}>
                    <span
                      onClick={() => handleCycleSkillHaveLevel(item)}
                      style={{ cursor: 'pointer' }}
                      title="Click to cycle proficiency level (Beginner / Intermediate / Expert)"
                    >
                      {item.skill} ({formatLevelLabel(item.level)})
                    </span>
                    {item._id && (
                      <button
                        type="button"
                        onClick={() => handleDeleteSkillHave(item._id, item.skill)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'inherit',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          padding: 0,
                          opacity: 0.75
                        }}
                        title="Remove skill"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </Badge>
                ))
              )}
            </div>

            {/* Skills I Want Section (Features #16-#19) */}
            <div className="flex-between mb-3">
              <h4 className="text-sm text-secondary uppercase tracking-wider font-bold">
                Skills I Want
              </h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddWant((prev) => !prev)}
              >
                <Plus size={13} /> Add Target
              </Button>
            </div>

            {showAddWant && (
              <form
                onSubmit={handleAddSkillWant}
                className="mb-4"
                style={{
                  background: '#09090b',
                  padding: '14px',
                  borderRadius: '10px',
                  border: '1px solid var(--shadcn-border)'
                }}
              >
                <Input
                  type="text"
                  value={wantSkillName}
                  onChange={(e) => setWantSkillName(e.target.value)}
                  placeholder="Skill to learn (e.g. UI/UX Design, Docker)"
                  required
                  style={{ marginBottom: '8px' }}
                />
                <div className="flex gap-2 mb-3">
                  <select
                    value={wantDomain}
                    onChange={(e) => setWantDomain(e.target.value as DomainCategory)}
                    className="shadcn-input"
                  >
                    {DOMAINS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                  <select
                    value={wantLevel}
                    onChange={(e) => setWantLevel(e.target.value as SkillLevel)}
                    className="shadcn-input"
                  >
                    {LEVELS.map((l) => (
                      <option key={l} value={l}>
                        {formatLevelLabel(l)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" variant="default" size="sm">
                    Save Target
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddWant(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}

            <div className="tags mb-5">
              {profile.skillsWant.length === 0 ? (
                <span className="text-xs text-secondary">
                  No target skills added yet. Add skills you want to learn for Barter Matchmaking!
                </span>
              ) : (
                profile.skillsWant.map((item, idx) => (
                  <Badge key={item._id || idx} variant="violet" style={{ gap: '6px' }}>
                    <span
                      onClick={() => handleCycleSkillWantLevel(item)}
                      style={{ cursor: 'pointer' }}
                      title="Click to cycle target level"
                    >
                      {item.skill}
                    </span>
                    {item._id && (
                      <button
                        type="button"
                        onClick={() => handleDeleteSkillWant(item._id, item.skill)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'inherit',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          padding: 0,
                          opacity: 0.75
                        }}
                        title="Remove target skill"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </Badge>
                ))
              )}
            </div>

            <Separator style={{ margin: '20px 0' }} />

            {/* Mentor Availability Time Slots CRUD (Features #20-#23) */}
            <div className="flex-between mb-3">
              <h4 className="text-sm text-secondary uppercase tracking-wider font-bold flex items-center gap-2">
                <Calendar size={14} /> Mentor Availability Slots
              </h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddSlot((prev) => !prev)}
              >
                <Plus size={13} /> Add Slot
              </Button>
            </div>

            {showAddSlot && (
              <form
                onSubmit={handleAddAvailability}
                className="mb-4"
                style={{
                  background: '#09090b',
                  padding: '14px',
                  borderRadius: '10px',
                  border: '1px solid var(--shadcn-border)'
                }}
              >
                <div className="flex gap-2 mb-3">
                  <Input
                    type="date"
                    value={slotDate}
                    onChange={(e) => setSlotDate(e.target.value)}
                    required
                  />
                  <Input
                    type="text"
                    value={slotTime}
                    onChange={(e) => setSlotTime(e.target.value)}
                    placeholder="18:00-19:00, 20:00-21:00"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" variant="default" size="sm">
                    Add Time Slot
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddSlot(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {profile.availability.length === 0 ? (
                <p className="text-xs text-secondary">No availability slots scheduled yet.</p>
              ) : (
                profile.availability.map((entry, i) => (
                  <Card
                    key={entry._id || i}
                    style={{
                      background: '#09090b',
                      padding: '10px 14px'
                    }}
                  >
                    <div className="flex-between">
                      <span className="font-bold text-sm text-emerald">{entry.date}</span>
                      <div className="flex gap-2">
                        {entry._id && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingSlotId(entry._id!);
                                setEditingSlotsInput(entry.slots.join(', '));
                              }}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--shadcn-muted-fg)',
                                cursor: 'pointer'
                              }}
                              title="Edit slots"
                            >
                              <Edit3 size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteAvailability(entry._id, entry.date)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#f87171',
                                cursor: 'pointer'
                              }}
                              title="Delete date schedule"
                            >
                              <X size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    {editingSlotId === entry._id ? (
                      <div className="flex gap-2 mt-2">
                        <Input
                          type="text"
                          value={editingSlotsInput}
                          onChange={(e) => setEditingSlotsInput(e.target.value)}
                        />
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleUpdateAvailability(entry._id!, entry.date)}
                        >
                          Save
                        </Button>
                      </div>
                    ) : (
                      <div className="tags mt-2">
                        {entry.slots.map((s, idx) => (
                          <Badge key={idx} variant="cyan">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Wallet Dashboard & Transaction Ledger (shadcn Card) */}
        <Card>
          <CardHeader
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid var(--shadcn-border)'
            }}
          >
            <div>
              <CardTitle>Virtual Credit Wallet</CardTitle>
              <CardDescription>90/10 Deflationary Escrow Settlement Ledger</CardDescription>
            </div>
            <div className="credit-balance flex items-center gap-2">
              <span className="text-3xl font-bold text-emerald">{availableCredits}</span>
              <span className="text-secondary">CR</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={refreshProfile}
                title="Refresh Wallet Ledger"
              >
                <RefreshCw size={15} />
              </Button>
            </div>
          </CardHeader>

          <CardContent style={{ paddingTop: '24px' }}>
            <div className="grid-stats mb-6">
              <Card style={{ background: '#09090b', padding: '16px' }}>
                <span className="text-secondary text-xs uppercase font-bold">
                  Available Balance
                </span>
                <div className="font-bold text-xl text-emerald mt-1">{availableCredits} CR</div>
              </Card>
              <Card style={{ background: '#09090b', padding: '16px' }}>
                <span className="text-secondary text-xs uppercase font-bold">
                  Locked in Escrow
                </span>
                <div className="font-bold text-xl text-amber mt-1">{lockedInEscrow} CR</div>
              </Card>
            </div>

            <h4 className="text-sm text-secondary uppercase tracking-wider font-bold mb-3">
              Transaction Ledger
            </h4>
            <TransactionTable transactions={transactions} />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
