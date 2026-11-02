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
      <div className="flex-between">
        <h2>My Profile &amp; Wallet</h2>
        <div className="flex items-center gap-3">
          <div
            className="glass-panel"
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.85rem'
            }}
          >
            <Flame size={16} className="text-amber" />
            <span>
              <strong>{profile.streakCount} Day</strong> Learning Streak
            </span>
            {profile.streakBonusEligible && (
              <button
                type="button"
                onClick={handleClaimStreak}
                className="btn btn-primary"
                style={{ padding: '4px 10px', fontSize: '0.75rem', marginLeft: '6px' }}
              >
                Claim +20 CR
              </button>
            )}
          </div>
        </div>
      </div>

      {statusMessage && (
        <div
          className="glass-panel mt-4"
          style={{
            padding: '12px 16px',
            borderRadius: '12px',
            borderColor:
              statusMessage.type === 'error' ? 'var(--accent-red)' : 'var(--accent-emerald)',
            color: statusMessage.type === 'error' ? 'var(--accent-red)' : 'var(--accent-emerald)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}
        >
          <div className="flex items-center gap-2 text-sm font-bold">
            {statusMessage.type === 'error' ? <AlertTriangle size={16} /> : <Check size={16} />}
            <span>{statusMessage.text}</span>
          </div>
          <button
            type="button"
            className="icon-btn"
            onClick={() => setStatusMessage(null)}
            style={{ padding: '2px' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="profile-grid mt-4">
        {/* Profile Card */}
        <div className="glass-panel p-6 border-radius-16">
          <div className="flex-between border-b border-glass pb-4 mb-4">
            <div className="flex items-center gap-4">
              <div
                className="avatar"
                style={{ width: '64px', height: '64px', fontSize: '1.5rem' }}
              >
                {user?.initials || 'Z'}
              </div>
              <div>
                <h3 className="text-lg font-bold">{profile.displayName || user?.displayName}</h3>
                <p className="text-secondary text-sm">
                  Joined {profile.joinedAt || 'Aug 2026'} • ★ {profile.rating} (
                  {profile.totalSessions} sessions)
                </p>
                {profile.bio && (
                  <p className="text-secondary text-xs mt-1" style={{ maxWidth: '340px' }}>
                    {profile.bio}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn glass-btn"
                style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                onClick={() => {
                  setEditDisplayName(profile.displayName);
                  setEditBioText(profile.bio || '');
                  setIsEditingBio((prev) => !prev);
                  setIsChangingPassword(false);
                }}
                title="Edit Display Name & Bio"
              >
                <Edit3 size={14} /> Edit
              </button>
              <button
                type="button"
                className="btn glass-btn"
                style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                onClick={() => {
                  setIsChangingPassword((prev) => !prev);
                  setIsEditingBio(false);
                }}
                title="Change Password"
              >
                <KeyRound size={14} />
              </button>
            </div>
          </div>

          {/* Inline Edit Bio Form (Feature #11) */}
          {isEditingBio && (
            <form
              onSubmit={handleSaveBio}
              className="mb-4"
              style={{
                background: 'rgba(15, 23, 42, 0.6)',
                padding: '12px',
                borderRadius: '12px',
                border: '1px solid var(--border-glass)'
              }}
            >
              <p className="text-xs text-secondary uppercase mb-2">Edit Profile Details</p>
              <input
                type="text"
                value={editDisplayName}
                onChange={(e) => setEditDisplayName(e.target.value)}
                placeholder="Display Name"
                required
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  background: 'var(--bg-obsidian)',
                  border: '1px solid var(--border-glass)',
                  color: 'var(--text-primary)',
                  marginBottom: '8px',
                  fontSize: '0.85rem'
                }}
              />
              <textarea
                value={editBioText}
                onChange={(e) => setEditBioText(e.target.value)}
                placeholder="Short mentor/learner bio..."
                rows={2}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  background: 'var(--bg-obsidian)',
                  border: '1px solid var(--border-glass)',
                  color: 'var(--text-primary)',
                  marginBottom: '8px',
                  fontSize: '0.85rem'
                }}
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                >
                  Save Bio
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingBio(false)}
                  className="btn glass-btn"
                  style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Inline Change Password Form (Feature #6) */}
          {isChangingPassword && (
            <form
              onSubmit={handleChangePassword}
              className="mb-4"
              style={{
                background: 'rgba(15, 23, 42, 0.6)',
                padding: '12px',
                borderRadius: '12px',
                border: '1px solid var(--border-glass)'
              }}
            >
              <p className="text-xs text-secondary uppercase mb-2">Change Account Password</p>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Current Password (e.g. StrongPassword123!)"
                required
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  background: 'var(--bg-obsidian)',
                  border: '1px solid var(--border-glass)',
                  color: 'var(--text-primary)',
                  marginBottom: '8px',
                  fontSize: '0.85rem'
                }}
              />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New Password (min 8 chars)"
                required
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  background: 'var(--bg-obsidian)',
                  border: '1px solid var(--border-glass)',
                  color: 'var(--text-primary)',
                  marginBottom: '8px',
                  fontSize: '0.85rem'
                }}
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                >
                  Update Password
                </button>
                <button
                  type="button"
                  onClick={() => setIsChangingPassword(false)}
                  className="btn glass-btn"
                  style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Skills I Have Section (Features #12-#15) */}
          <div className="flex-between mb-2">
            <h4 className="text-sm text-secondary uppercase tracking-wider">Skills I Have</h4>
            <button
              type="button"
              onClick={() => setShowAddHave((prev) => !prev)}
              className="btn glass-btn"
              style={{ padding: '3px 8px', fontSize: '0.72rem' }}
            >
              <Plus size={12} /> Add Skill
            </button>
          </div>

          {showAddHave && (
            <form
              onSubmit={handleAddSkillHave}
              className="mb-3"
              style={{
                background: 'rgba(15, 23, 42, 0.6)',
                padding: '10px',
                borderRadius: '10px',
                border: '1px solid var(--border-glass)'
              }}
            >
              <input
                type="text"
                value={haveSkillName}
                onChange={(e) => setHaveSkillName(e.target.value)}
                placeholder="Skill name (e.g. Next.js, TypeScript)"
                required
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  borderRadius: '8px',
                  background: 'var(--bg-obsidian)',
                  border: '1px solid var(--border-glass)',
                  color: 'var(--text-primary)',
                  marginBottom: '6px',
                  fontSize: '0.82rem'
                }}
              />
              <div className="flex gap-2 mb-2">
                <select
                  value={haveDomain}
                  onChange={(e) => setHaveDomain(e.target.value as DomainCategory)}
                  style={{
                    flex: 1,
                    padding: '6px 8px',
                    borderRadius: '8px',
                    background: 'var(--bg-obsidian)',
                    border: '1px solid var(--border-glass)',
                    color: 'var(--text-primary)',
                    fontSize: '0.78rem'
                  }}
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
                  style={{
                    flex: 1,
                    padding: '6px 8px',
                    borderRadius: '8px',
                    background: 'var(--bg-obsidian)',
                    border: '1px solid var(--border-glass)',
                    color: 'var(--text-primary)',
                    fontSize: '0.78rem'
                  }}
                >
                  {LEVELS.map((l) => (
                    <option key={l} value={l}>
                      {formatLevelLabel(l)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '5px 10px', fontSize: '0.75rem' }}
                >
                  Save Skill
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddHave(false)}
                  className="btn glass-btn"
                  style={{ padding: '5px 10px', fontSize: '0.75rem' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="tags mb-4">
            {profile.skillsHave.map((item, idx) => (
              <span
                key={item._id || idx}
                className="tag tag-emerald"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
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
              </span>
            ))}
          </div>

          {/* Skills I Want Section (Features #16-#19) */}
          <div className="flex-between mb-2">
            <h4 className="text-sm text-secondary uppercase tracking-wider">Skills I Want</h4>
            <button
              type="button"
              onClick={() => setShowAddWant((prev) => !prev)}
              className="btn glass-btn"
              style={{ padding: '3px 8px', fontSize: '0.72rem' }}
            >
              <Plus size={12} /> Add Target
            </button>
          </div>

          {showAddWant && (
            <form
              onSubmit={handleAddSkillWant}
              className="mb-3"
              style={{
                background: 'rgba(15, 23, 42, 0.6)',
                padding: '10px',
                borderRadius: '10px',
                border: '1px solid var(--border-glass)'
              }}
            >
              <input
                type="text"
                value={wantSkillName}
                onChange={(e) => setWantSkillName(e.target.value)}
                placeholder="Skill to learn (e.g. UI/UX Design, Docker)"
                required
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  borderRadius: '8px',
                  background: 'var(--bg-obsidian)',
                  border: '1px solid var(--border-glass)',
                  color: 'var(--text-primary)',
                  marginBottom: '6px',
                  fontSize: '0.82rem'
                }}
              />
              <div className="flex gap-2 mb-2">
                <select
                  value={wantDomain}
                  onChange={(e) => setWantDomain(e.target.value as DomainCategory)}
                  style={{
                    flex: 1,
                    padding: '6px 8px',
                    borderRadius: '8px',
                    background: 'var(--bg-obsidian)',
                    border: '1px solid var(--border-glass)',
                    color: 'var(--text-primary)',
                    fontSize: '0.78rem'
                  }}
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
                  style={{
                    flex: 1,
                    padding: '6px 8px',
                    borderRadius: '8px',
                    background: 'var(--bg-obsidian)',
                    border: '1px solid var(--border-glass)',
                    color: 'var(--text-primary)',
                    fontSize: '0.78rem'
                  }}
                >
                  {LEVELS.map((l) => (
                    <option key={l} value={l}>
                      {formatLevelLabel(l)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '5px 10px', fontSize: '0.75rem' }}
                >
                  Save Target
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddWant(false)}
                  className="btn glass-btn"
                  style={{ padding: '5px 10px', fontSize: '0.75rem' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="tags mb-4">
            {profile.skillsWant.map((item, idx) => (
              <span
                key={item._id || idx}
                className="tag tag-violet"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
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
              </span>
            ))}
          </div>

          <hr className="glass-divider my-4" />

          {/* Mentor Availability Time Slots CRUD (Features #20-#23) */}
          <div className="flex-between mb-2">
            <h4 className="text-sm text-secondary uppercase tracking-wider flex items-center gap-2">
              <Calendar size={14} /> Mentor Availability Slots
            </h4>
            <button
              type="button"
              onClick={() => setShowAddSlot((prev) => !prev)}
              className="btn glass-btn"
              style={{ padding: '3px 8px', fontSize: '0.72rem' }}
            >
              <Plus size={12} /> Add Slot
            </button>
          </div>

          {showAddSlot && (
            <form
              onSubmit={handleAddAvailability}
              className="mb-3"
              style={{
                background: 'rgba(15, 23, 42, 0.6)',
                padding: '10px',
                borderRadius: '10px',
                border: '1px solid var(--border-glass)'
              }}
            >
              <div className="flex gap-2 mb-2">
                <input
                  type="date"
                  value={slotDate}
                  onChange={(e) => setSlotDate(e.target.value)}
                  required
                  style={{
                    flex: 1,
                    padding: '6px 8px',
                    borderRadius: '8px',
                    background: 'var(--bg-obsidian)',
                    border: '1px solid var(--border-glass)',
                    color: 'var(--text-primary)',
                    fontSize: '0.78rem'
                  }}
                />
                <input
                  type="text"
                  value={slotTime}
                  onChange={(e) => setSlotTime(e.target.value)}
                  placeholder="18:00-19:00, 20:00-21:00"
                  required
                  style={{
                    flex: 1.4,
                    padding: '6px 8px',
                    borderRadius: '8px',
                    background: 'var(--bg-obsidian)',
                    border: '1px solid var(--border-glass)',
                    color: 'var(--text-primary)',
                    fontSize: '0.78rem'
                  }}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '5px 10px', fontSize: '0.75rem' }}
                >
                  Add Time Slot
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddSlot(false)}
                  className="btn glass-btn"
                  style={{ padding: '5px 10px', fontSize: '0.75rem' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {profile.availability.length === 0 ? (
              <p className="text-xs text-secondary">No availability slots scheduled yet.</p>
            ) : (
              profile.availability.map((entry, i) => (
                <div
                  key={entry._id || i}
                  style={{
                    background: 'rgba(15, 23, 42, 0.5)',
                    border: '1px solid var(--border-glass)',
                    borderRadius: '10px',
                    padding: '8px 10px',
                    fontSize: '0.8rem'
                  }}
                >
                  <div className="flex-between">
                    <span className="font-bold text-emerald">{entry.date}</span>
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
                              color: 'var(--text-secondary)',
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
                              color: 'var(--accent-red)',
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
                      <input
                        type="text"
                        value={editingSlotsInput}
                        onChange={(e) => setEditingSlotsInput(e.target.value)}
                        style={{
                          flex: 1,
                          padding: '4px 8px',
                          borderRadius: '6px',
                          background: 'var(--bg-obsidian)',
                          border: '1px solid var(--border-glass)',
                          color: 'var(--text-primary)',
                          fontSize: '0.75rem'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleUpdateAvailability(entry._id!, entry.date)}
                        className="btn btn-primary"
                        style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <div className="tags mt-1">
                      {entry.slots.map((s, idx) => (
                        <span
                          key={idx}
                          className="tag"
                          style={{
                            background: 'rgba(6, 182, 212, 0.12)',
                            color: 'var(--accent-cyan)',
                            fontSize: '0.72rem'
                          }}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Wallet Dashboard */}
        <div className="glass-panel p-6 border-radius-16">
          <div className="flex-between mb-6">
            <div>
              <h3 className="text-lg font-bold">Virtual Credit Wallet</h3>
              <p className="text-xs text-secondary mt-1">
                90/10 Deflationary Escrow Settlement Ledger
              </p>
            </div>
            <div className="credit-balance flex items-center gap-2">
              <span className="text-3xl font-bold text-emerald">{availableCredits}</span>
              <span className="text-secondary">CR</span>
              <button
                type="button"
                onClick={refreshProfile}
                className="icon-btn"
                title="Refresh Wallet Ledger"
              >
                <RefreshCw size={15} />
              </button>
            </div>
          </div>

          <div className="grid-stats mb-6">
            <div className="stat-box">
              <span className="text-secondary text-sm">Available Balance</span>
              <span className="font-bold text-lg text-emerald">{availableCredits} CR</span>
            </div>
            <div className="stat-box">
              <span className="text-secondary text-sm">Locked in Escrow</span>
              <span className="font-bold text-lg text-amber">{lockedInEscrow} CR</span>
            </div>
          </div>

          <h4 className="text-sm text-secondary uppercase tracking-wider mb-3">
            Transaction Ledger
          </h4>
          <TransactionTable transactions={transactions} />
        </div>
      </div>
    </section>
  );
}
