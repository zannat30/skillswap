'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  X,
  Edit3,
  Calendar,
  Flame,
  KeyRound,
  Check,
  AlertTriangle,
  Wallet,
  ArrowRight,
  UserCheck,
  GraduationCap,
  Target
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
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
  const { user, profile, availableCredits, refreshProfile } = useAuth();

  // Feedback Banner
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
      showToast('success', 'Profile name and bio updated successfully!');
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

  return (
    <div className="profile-page" style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header and Quick Navigation */}
      <div className="flex-between" style={{ flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              My Profile
            </h1>
            <Badge variant="emerald" style={{ gap: '4px' }}>
              <UserCheck size={12} />
              <span>Verified Member</span>
            </Badge>
          </div>
          <p className="text-sm text-secondary mt-1">
            Identity, Skills Inventory &amp; Mentor Availability Calendar
          </p>
        </div>

        <div className="flex items-center gap-3" style={{ flexWrap: 'wrap' }}>
          <Badge variant="amber" style={{ padding: '7px 14px', fontSize: '0.82rem', gap: '6px' }}>
            <Flame size={14} />
            <span>
              <strong>{profile.streakCount || 1} Day</strong> Learning Streak
            </span>
          </Badge>

          <Link href="/wallet" style={{ textDecoration: 'none' }}>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Wallet size={14} className="text-emerald" />
              <span>Wallet: <strong>{availableCredits} CR</strong></span>
              <ArrowRight size={13} className="text-secondary" />
            </Button>
          </Link>
        </div>
      </div>

      {statusMessage && (
        <Alert
          variant={statusMessage.type === 'error' ? 'destructive' : 'emerald'}
          className="flex-between"
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

      {/* 1. Identity & Account Card */}
      <Card>
        <CardHeader style={{ borderBottom: '1px solid var(--shadcn-border)', padding: '20px 24px' }}>
          <div className="flex-between" style={{ flexWrap: 'wrap', gap: '16px' }}>
            <div className="flex items-center gap-4" style={{ flexWrap: 'wrap' }}>
              <Avatar style={{ height: '64px', width: '64px' }}>
                <AvatarFallback style={{ fontSize: '1.4rem', background: '#27272a' }}>
                  {user?.initials || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-xl">{profile.displayName || user?.displayName}</CardTitle>
                  <Badge variant={user?.role === 'ADMIN' ? 'amber' : 'secondary'} style={{ fontSize: '0.7rem' }}>
                    {user?.role === 'ADMIN' ? 'ADMIN' : 'MEMBER'}
                  </Badge>
                </div>
                <CardDescription className="text-xs mt-1">
                  {user?.email} • Joined {profile.joinedAt || '2026'} • ★ {profile.rating} ({profile.totalSessions} sessions completed)
                </CardDescription>
                {profile.bio ? (
                  <p className="text-secondary text-sm mt-2" style={{ maxWidth: '600px', lineHeight: 1.5 }}>
                    {profile.bio}
                  </p>
                ) : (
                  <p className="text-secondary text-xs italic mt-2">
                    No bio added yet. Click &quot;Edit Profile&quot; to write a short introduction.
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
                <Edit3 size={13} />
                <span>Edit Profile</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsChangingPassword((prev) => !prev);
                  setIsEditingBio(false);
                }}
                title="Change Password"
              >
                <KeyRound size={13} />
                <span>Password</span>
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Inline Bio & Name Editor */}
        {isEditingBio && (
          <CardContent style={{ padding: '20px 24px', background: '#0c0c10', borderBottom: '1px solid var(--shadcn-border)' }}>
            <form onSubmit={handleSaveBio} style={{ maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Label className="text-sm font-semibold">Edit Display Name &amp; Bio</Label>
              <Input
                type="text"
                value={editDisplayName}
                onChange={(e) => setEditDisplayName(e.target.value)}
                placeholder="Display Name"
                required
              />
              <Textarea
                value={editBioText}
                onChange={(e) => setEditBioText(e.target.value)}
                placeholder="Share your mentoring expertise and learning interests..."
                rows={3}
              />
              <div className="flex gap-2">
                <Button type="submit" variant="default" size="sm">
                  Save Changes
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
          </CardContent>
        )}

        {/* Inline Change Password Editor */}
        {isChangingPassword && (
          <CardContent style={{ padding: '20px 24px', background: '#0c0c10', borderBottom: '1px solid var(--shadcn-border)' }}>
            <form onSubmit={handleChangePassword} style={{ maxWidth: '450px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Label className="text-sm font-semibold">Change Account Password</Label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Current Password"
                required
              />
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New Password (min 6 characters)"
                required
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
          </CardContent>
        )}
      </Card>

      {/* 2. Skills Inventory Grid (2 columns on tablet/desktop, 1 column on mobile) */}
      <div
        className="skills-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '20px'
        }}
      >
        {/* Skills I Have Card */}
        <Card>
          <CardHeader style={{ borderBottom: '1px solid var(--shadcn-border)', padding: '18px 20px' }}>
            <div className="flex-between">
              <div className="flex items-center gap-2">
                <GraduationCap className="text-emerald" size={18} />
                <div>
                  <CardTitle className="text-base">Skills I Have</CardTitle>
                  <CardDescription className="text-xs">Skills you can teach on the Marketplace</CardDescription>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddHave((prev) => !prev)}
              >
                <Plus size={13} />
                <span>Add Skill</span>
              </Button>
            </div>
          </CardHeader>

          <CardContent style={{ padding: '20px' }}>
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
                <div className="flex gap-2 mb-3" style={{ flexWrap: 'wrap' }}>
                  <select
                    value={haveDomain}
                    onChange={(e) => setHaveDomain(e.target.value as DomainCategory)}
                    className="shadcn-input"
                    style={{ flex: 1, minWidth: '130px' }}
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
                    style={{ flex: 1, minWidth: '130px' }}
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

            <div className="tags" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {profile.skillsHave.length === 0 ? (
                <span className="text-xs text-secondary">
                  No teaching skills added yet. Add a skill to appear on the Marketplace!
                </span>
              ) : (
                profile.skillsHave.map((item, idx) => (
                  <Badge key={item._id || idx} variant="emerald" style={{ gap: '6px', padding: '6px 10px' }}>
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
          </CardContent>
        </Card>

        {/* Skills I Want Card */}
        <Card>
          <CardHeader style={{ borderBottom: '1px solid var(--shadcn-border)', padding: '18px 20px' }}>
            <div className="flex-between">
              <div className="flex items-center gap-2">
                <Target className="text-violet-400" size={18} style={{ color: '#a78bfa' }} />
                <div>
                  <CardTitle className="text-base">Skills I Want</CardTitle>
                  <CardDescription className="text-xs">Target skills for Barter Matchmaking</CardDescription>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddWant((prev) => !prev)}
              >
                <Plus size={13} />
                <span>Add Target</span>
              </Button>
            </div>
          </CardHeader>

          <CardContent style={{ padding: '20px' }}>
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
                <div className="flex gap-2 mb-3" style={{ flexWrap: 'wrap' }}>
                  <select
                    value={wantDomain}
                    onChange={(e) => setWantDomain(e.target.value as DomainCategory)}
                    className="shadcn-input"
                    style={{ flex: 1, minWidth: '130px' }}
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
                    style={{ flex: 1, minWidth: '130px' }}
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

            <div className="tags" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {profile.skillsWant.length === 0 ? (
                <span className="text-xs text-secondary">
                  No target skills added yet. Add skills you want to learn for Barter Matchmaking!
                </span>
              ) : (
                profile.skillsWant.map((item, idx) => (
                  <Badge key={item._id || idx} variant="violet" style={{ gap: '6px', padding: '6px 10px' }}>
                    <span
                      onClick={() => handleCycleSkillWantLevel(item)}
                      style={{ cursor: 'pointer' }}
                      title="Click to cycle target level"
                    >
                      {item.skill} ({formatLevelLabel(item.level)})
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
          </CardContent>
        </Card>
      </div>

      {/* 3. Mentor Availability Calendar Schedule */}
      <Card>
        <CardHeader style={{ borderBottom: '1px solid var(--shadcn-border)', padding: '18px 24px' }}>
          <div className="flex-between" style={{ flexWrap: 'wrap', gap: '12px' }}>
            <div className="flex items-center gap-2">
              <Calendar className="text-cyan-400" size={18} style={{ color: '#22d3ee' }} />
              <div>
                <CardTitle className="text-base">Mentor Availability Slots</CardTitle>
                <CardDescription className="text-xs">
                  Available hours learners can select when booking a 60-min session with you
                </CardDescription>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddSlot((prev) => !prev)}
            >
              <Plus size={13} />
              <span>Add Date Slot</span>
            </Button>
          </div>
        </CardHeader>

        <CardContent style={{ padding: '20px 24px' }}>
          {showAddSlot && (
            <form
              onSubmit={handleAddAvailability}
              className="mb-4"
              style={{
                background: '#09090b',
                padding: '16px',
                borderRadius: '10px',
                border: '1px solid var(--shadcn-border)'
              }}
            >
              <div className="flex gap-2 mb-3" style={{ flexWrap: 'wrap' }}>
                <Input
                  type="date"
                  value={slotDate}
                  onChange={(e) => setSlotDate(e.target.value)}
                  required
                  style={{ flex: 1, minWidth: '150px' }}
                />
                <Input
                  type="text"
                  value={slotTime}
                  onChange={(e) => setSlotTime(e.target.value)}
                  placeholder="e.g. 18:00-19:00, 20:00-21:00"
                  required
                  style={{ flex: 2, minWidth: '200px' }}
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {profile.availability.length === 0 ? (
              <p className="text-xs text-secondary">
                No availability slots scheduled yet. Add slots so other learners can book mentorship sessions with you!
              </p>
            ) : (
              profile.availability.map((entry, i) => (
                <Card
                  key={entry._id || i}
                  style={{
                    background: '#09090b',
                    padding: '12px 16px'
                  }}
                >
                  <div className="flex-between" style={{ flexWrap: 'wrap', gap: '8px' }}>
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
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.8rem'
                            }}
                            title="Edit slots"
                          >
                            <Edit3 size={13} />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAvailability(entry._id, entry.date)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#f87171',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.8rem'
                            }}
                            title="Delete date schedule"
                          >
                            <X size={14} />
                            <span>Delete</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  {editingSlotId === entry._id ? (
                    <div className="flex gap-2 mt-2" style={{ flexWrap: 'wrap' }}>
                      <Input
                        type="text"
                        value={editingSlotsInput}
                        onChange={(e) => setEditingSlotsInput(e.target.value)}
                        style={{ flex: 1, minWidth: '180px' }}
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
                    <div className="tags mt-2" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
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
    </div>
  );
}
