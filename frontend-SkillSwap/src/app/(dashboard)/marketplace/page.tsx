'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { X, Sparkles, Star, Calendar, AlertTriangle, MessageSquare } from 'lucide-react';
import { Mentor, AvailabilitySlot, ReviewItem } from '@/types';
import { MentorCard } from '@/features/marketplace/components/MentorCard';
import { apiRequest } from '@/lib/apiClient';
import { useAuth } from '@/context/AuthContext';

export default function MarketplacePage() {
  const router = useRouter();
  const { searchQuery, refreshProfile } = useAuth();
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [barterMatches, setBarterMatches] = useState<Mentor[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Booking Modal State
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedSkillTopic, setSelectedSkillTopic] = useState<string>('');
  const [customTopic, setCustomTopic] = useState<string>('');
  const [mentorSlots, setMentorSlots] = useState<AvailabilitySlot[]>([]);
  const [selectedDateSlot, setSelectedDateSlot] = useState<string>('');
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [isBookingSubmitting, setIsBookingSubmitting] = useState<boolean>(false);

  // Public Profile & Reviews Modal State (Features #10 & #38)
  const [inspectedMentor, setInspectedMentor] = useState<Mentor | null>(null);
  const [inspectedReviews, setInspectedReviews] = useState<ReviewItem[]>([]);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);

  const fetchMarketplaceData = useCallback(async () => {
    try {
      const res = await apiRequest('/marketplace');
      if (res?.success && Array.isArray(res.mentors)) {
        setMentors(res.mentors);
      }
      const matchRes = await apiRequest('/marketplace/matches');
      if (matchRes?.success && Array.isArray(matchRes.matches)) {
        setBarterMatches(
          matchRes.matches.map((m: Mentor) => ({
            ...m,
            isBarterMatch: true
          }))
        );
      }
    } catch (_) {
      setMentors([]);
    }
  }, []);

  useEffect(() => {
    fetchMarketplaceData();
  }, [fetchMarketplaceData]);

  const sourceList = activeCategory === 'matches' ? barterMatches : mentors;

  const filteredMentors = sourceList.filter((mentor) => {
    const matchesCategory =
      activeCategory === 'all' ||
      activeCategory === 'matches' ||
      mentor.category.toLowerCase() === activeCategory.toLowerCase() ||
      mentor.domain.toLowerCase() === activeCategory.toLowerCase();

    if (!searchQuery.trim()) return matchesCategory;

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      mentor.name.toLowerCase().includes(q) ||
      mentor.category.toLowerCase().includes(q) ||
      mentor.domain.toLowerCase().includes(q) ||
      mentor.skillsHave.some((s) => s.toLowerCase().includes(q)) ||
      mentor.skillsWant.some((s) => s.toLowerCase().includes(q));

    return matchesCategory && matchesSearch;
  });

  // Open Booking Modal & Load Mentor Availability (Features #21 & #28)
  const handleOpenBookingModal = async (mentor: Mentor) => {
    setSelectedMentor(mentor);
    setBookingError(null);
    const defaultSkill = mentor.skillsHave[0]
      ? `${mentor.skillsHave[0]} Mentorship`
      : '1-on-1 Skill Mentorship';
    setSelectedSkillTopic(defaultSkill);
    setCustomTopic('');

    const fallbackSlots = mentor.availability || [];
    setMentorSlots(fallbackSlots);
    if (fallbackSlots.length > 0 && fallbackSlots[0].slots.length > 0) {
      setSelectedDateSlot(`${fallbackSlots[0].date}|${fallbackSlots[0].slots[0]}`);
    } else {
      setSelectedDateSlot('');
    }
    setIsModalOpen(true);

    try {
      const availRes = await apiRequest(
        `/profile/${mentor.userId || mentor._id}/availability`
      );
      if (availRes?.success && Array.isArray(availRes.availability)) {
        setMentorSlots(availRes.availability);
        if (
          availRes.availability.length > 0 &&
          availRes.availability[0].slots?.length > 0
        ) {
          setSelectedDateSlot(
            `${availRes.availability[0].date}|${availRes.availability[0].slots[0]}`
          );
        }
      }
    } catch (_) {
      // Keep fallback availability
    }
  };

  // Open Public Mentor Profile & Reviews Modal (Features #10 & #38)
  const handleViewMentorProfile = async (mentor: Mentor) => {
    setInspectedMentor(mentor);
    setInspectedReviews([]);
    setIsProfileModalOpen(true);

    try {
      const [profRes, revRes] = await Promise.all([
        apiRequest(`/profile/${mentor.userId || mentor._id}`),
        apiRequest(`/profile/${mentor.userId || mentor._id}/reviews`)
      ]);
      if (profRes?.success && profRes.profile) {
        setInspectedMentor((prev) =>
          prev
            ? {
                ...prev,
                bio: profRes.profile.bio || prev.bio,
                rating: profRes.profile.rating ?? prev.rating,
                totalSessions: profRes.profile.totalSessions ?? prev.totalSessions,
                availability: profRes.profile.availability || prev.availability,
                skillsHaveDetailed: profRes.profile.skillsHave
              }
            : prev
        );
      }
      if (revRes?.success && Array.isArray(revRes.reviews)) {
        setInspectedReviews(revRes.reviews);
      }
    } catch (_) {
      // Fallback gracefully
    }
  };

  const handleConfirmBooking = async () => {
    if (!selectedMentor) return;
    setBookingError(null);
    setIsBookingSubmitting(true);

    const finalSkillName = customTopic.trim() ? customTopic.trim() : selectedSkillTopic;
    const [chosenDate, chosenSlot] = selectedDateSlot
      ? selectedDateSlot.split('|')
      : ['', ''];

    try {
      await apiRequest('/sessions/book', {
        method: 'POST',
        body: JSON.stringify({
          mentorId: selectedMentor.userId || selectedMentor._id,
          mentorName: selectedMentor.name,
          skillName: finalSkillName,
          domain: selectedMentor.domain || 'Technology',
          date: chosenDate,
          slot: chosenSlot
        })
      });
      await refreshProfile();
      setIsModalOpen(false);
      router.push('/active-sessions');
    } catch (err: any) {
      setBookingError(
        err.code === 'FORBIDDEN_DOMAIN'
          ? `403 FORBIDDEN_DOMAIN: ${err.message}`
          : err.message || 'Unable to book session.'
      );
    } finally {
      setIsBookingSubmitting(false);
    }
  };

  return (
    <>
      <section className="view active">
        <div className="hero-section text-center">
          <h1 className="hero-title">
            Welcome to <span className="text-gradient">SkillSwap</span>
          </h1>
          <p className="hero-subtitle">
            Trade skills instead of money using our secure escrow logic.
          </p>
        </div>

        <div className="category-tabs" style={{ flexWrap: 'wrap' }}>
          <button
            className={`tab-btn ${activeCategory === 'all' ? 'active' : ''}`}
            data-category="all"
            onClick={() => setActiveCategory('all')}
            type="button"
          >
            All Domains
          </button>
          <button
            className={`tab-btn ${activeCategory === 'technology' ? 'active' : ''}`}
            data-category="technology"
            onClick={() => setActiveCategory('technology')}
            type="button"
          >
            Technology
          </button>
          <button
            className={`tab-btn ${activeCategory === 'creative' ? 'active' : ''}`}
            data-category="creative"
            onClick={() => setActiveCategory('creative')}
            type="button"
          >
            Creative Arts
          </button>
          <button
            className={`tab-btn ${activeCategory === 'languages' ? 'active' : ''}`}
            data-category="languages"
            onClick={() => setActiveCategory('languages')}
            type="button"
          >
            Languages
          </button>
          <button
            className={`tab-btn ${activeCategory === 'academic' ? 'active' : ''}`}
            data-category="academic"
            onClick={() => setActiveCategory('academic')}
            type="button"
          >
            Academics
          </button>
          <button
            className={`tab-btn ${activeCategory === 'matches' ? 'active' : ''}`}
            data-category="matches"
            onClick={() => setActiveCategory('matches')}
            type="button"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Sparkles size={14} /> Barter Matches ({barterMatches.length})
          </button>
        </div>

        {filteredMentors.length === 0 ? (
          <div className="glass-panel p-6 border-radius-16 text-center">
            <h4 className="font-bold text-lg mb-2">No Mentors Found</h4>
            <p className="text-secondary text-sm">
              No mentors have listed teaching skills in this category yet. When registered users add
              skills under <strong>My Profile → Skills I Have</strong>, they will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="mentors-grid" id="mentors-grid">
            {filteredMentors.map((mentor) => (
              <MentorCard
                key={mentor._id}
                mentor={mentor}
                onBook={handleOpenBookingModal}
                onViewProfile={handleViewMentorProfile}
              />
            ))}
          </div>
        )}
      </section>

      {/* Booking Modal (#booking-modal) */}
      <div
        className={`modal-overlay ${isModalOpen ? 'active' : ''}`}
        id="booking-modal"
      >
        <div className="modal-content glass-panel">
          <div className="modal-header">
            <h3>Book Session</h3>
            <button
              className="icon-btn close-modal"
              onClick={() => setIsModalOpen(false)}
              type="button"
            >
              <X size={20} />
            </button>
          </div>
          <div className="modal-body">
            <div className="escrow-details">
              <p className="text-secondary mb-3">
                Booking 60-min session with{' '}
                <strong id="modal-mentor-name" className="text-primary">
                  {selectedMentor?.name || 'Mentor'}
                </strong>{' '}
                ({selectedMentor?.domain}).
              </p>

              {/* Select Skill / Topic */}
              <div className="mb-3">
                <label className="text-xs text-secondary uppercase block mb-1">
                  Select Skill to Learn
                </label>
                <select
                  value={selectedSkillTopic}
                  onChange={(e) => setSelectedSkillTopic(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    background: 'var(--bg-obsidian)',
                    border: '1px solid var(--border-glass)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem'
                  }}
                >
                  {(selectedMentor?.skillsHave || ['React.js']).map((sk, idx) => (
                    <option key={idx} value={`${sk} Mentorship`}>
                      {sk} Mentorship ({selectedMentor?.domain})
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Session Goal / Topic Input (Also tests 403 FORBIDDEN_DOMAIN) */}
              <div className="mb-3">
                <label className="text-xs text-secondary uppercase block mb-1">
                  Specific Learning Topic (Optional)
                </label>
                <input
                  type="text"
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  placeholder="e.g. Redux Toolkit State Architecture..."
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    background: 'var(--bg-obsidian)',
                    border: '1px solid var(--border-glass)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              {/* Select Available Time Slot (Feature #21 & #28) */}
              <div className="mb-4">
                <label className="text-xs text-secondary uppercase block mb-1">
                  Select Mentor Time Slot (60 Min)
                </label>
                <select
                  value={selectedDateSlot}
                  onChange={(e) => setSelectedDateSlot(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    background: 'var(--bg-obsidian)',
                    border: '1px solid var(--border-glass)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem'
                  }}
                >
                  {mentorSlots.length === 0 ? (
                    <option value="">Immediate / Flexible 60-Min Slot</option>
                  ) : (
                    mentorSlots.flatMap((entry) =>
                      entry.slots.map((s) => (
                        <option key={`${entry.date}|${s}`} value={`${entry.date}|${s}`}>
                          {entry.date} • {s}
                        </option>
                      ))
                    )
                  )}
                </select>
              </div>

              <div className="credit-breakdown">
                <div className="flex-between">
                  <span>Session Cost</span>
                  <span>50 Credits</span>
                </div>
                <div className="flex-between text-secondary text-sm mt-1">
                  <span>Escrow Fee (10% Burn on Completion)</span>
                  <span>5 Credits</span>
                </div>
                <div className="flex-between text-secondary text-sm mt-1">
                  <span>Mentor Net Payout (90%)</span>
                  <span>45 Credits</span>
                </div>
                <hr className="glass-divider my-3" />
                <div className="flex-between font-bold text-amber">
                  <span>Total Locked in Escrow</span>
                  <span>50 Credits</span>
                </div>
              </div>

              {bookingError && (
                <div
                  className="mt-3"
                  style={{
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid var(--accent-red)',
                    color: 'var(--accent-red)',
                    fontSize: '0.82rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <AlertTriangle size={16} />
                  <span>{bookingError}</span>
                </div>
              )}
            </div>
          </div>
          <div className="modal-footer">
            <button
              className="btn glass-btn close-modal"
              onClick={() => setIsModalOpen(false)}
              type="button"
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              id="confirm-booking-btn"
              disabled={isBookingSubmitting}
              onClick={handleConfirmBooking}
              type="button"
            >
              {isBookingSubmitting ? 'Locking Escrow...' : 'Confirm & Lock Credits'}
            </button>
          </div>
        </div>
      </div>

      {/* Public Mentor Profile & Reviews Modal (Features #10 & #38) */}
      <div
        className={`modal-overlay ${isProfileModalOpen ? 'active' : ''}`}
        id="mentor-profile-modal"
      >
        <div className="modal-content glass-panel" style={{ maxWidth: '520px' }}>
          <div className="modal-header">
            <div className="flex items-center gap-3">
              <div className="avatar-sm">{inspectedMentor?.initials || 'M'}</div>
              <div>
                <h3>{inspectedMentor?.name || inspectedMentor?.displayName}</h3>
                <p className="text-xs text-secondary">
                  {inspectedMentor?.domain} • ★ {inspectedMentor?.rating} (
                  {inspectedMentor?.totalSessions} sessions)
                </p>
              </div>
            </div>
            <button
              className="icon-btn close-modal"
              onClick={() => setIsProfileModalOpen(false)}
              type="button"
            >
              <X size={20} />
            </button>
          </div>

          <div className="modal-body">
            <p className="text-sm text-secondary mb-4">
              {inspectedMentor?.bio ||
                `Verified ${inspectedMentor?.domain} mentor on SkillSwap with ${inspectedMentor?.totalSessions} completed 1-on-1 peer sessions.`}
            </p>

            <div className="mb-4">
              <h4 className="text-xs text-secondary uppercase mb-2 flex items-center gap-1">
                <Calendar size={13} /> Available 1-Hour Slots
              </h4>
              <div className="tags">
                {(inspectedMentor?.availability || []).length === 0 ? (
                  <span className="text-xs text-secondary">Flexible scheduling available</span>
                ) : (
                  (inspectedMentor?.availability || []).flatMap((a) =>
                    a.slots.map((s) => (
                      <span
                        key={`${a.date}-${s}`}
                        className="tag"
                        style={{
                          background: 'rgba(6, 182, 212, 0.14)',
                          color: 'var(--accent-cyan)'
                        }}
                      >
                        {a.date} • {s}
                      </span>
                    ))
                  )
                )}
              </div>
            </div>

            <div>
              <h4 className="text-xs text-secondary uppercase mb-2 flex items-center gap-1">
                <MessageSquare size={13} /> Verified Learner Reviews ({inspectedReviews.length})
              </h4>
              {inspectedReviews.length === 0 ? (
                <div
                  style={{
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: 'rgba(15, 23, 42, 0.5)',
                    border: '1px solid var(--border-glass)',
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)'
                  }}
                >
                  ★ {inspectedMentor?.rating} average rating across {inspectedMentor?.totalSessions}{' '}
                  completed sessions. Complete a session with {inspectedMentor?.name} to post a new
                  review!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {inspectedReviews.map((rev, i) => (
                    <div
                      key={rev.sessionId || i}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '10px',
                        background: 'rgba(15, 23, 42, 0.5)',
                        border: '1px solid var(--border-glass)'
                      }}
                    >
                      <div className="flex-between mb-1">
                        <span className="font-bold text-sm">{rev.learnerName}</span>
                        <span className="text-amber text-xs flex items-center gap-1">
                          <Star size={12} fill="currentColor" /> {rev.rating}/5
                        </span>
                      </div>
                      <p className="text-xs text-secondary">{rev.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button
              className="btn glass-btn"
              onClick={() => setIsProfileModalOpen(false)}
              type="button"
            >
              Close
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                setIsProfileModalOpen(false);
                if (inspectedMentor) handleOpenBookingModal(inspectedMentor);
              }}
              type="button"
            >
              Book Session (50 CR)
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
