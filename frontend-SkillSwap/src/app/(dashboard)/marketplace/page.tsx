'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Star, Calendar, AlertTriangle, MessageSquare } from 'lucide-react';
import { Mentor, AvailabilitySlot, ReviewItem } from '@/types';
import { MentorCard } from '@/features/marketplace/components/MentorCard';
import { apiRequest } from '@/lib/apiClient';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';

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
        <div className="hero-section text-center" style={{ margin: '28px auto 32px' }}>
          <Badge variant="emerald" style={{ marginBottom: '6px' }}>
            <Sparkles size={12} /> Peer-to-Peer Skill Marketplace
          </Badge>
          <h1 className="hero-title" style={{ fontSize: '2.6rem' }}>
            Welcome to <span className="text-gradient">SkillSwap</span>
          </h1>
          <p className="hero-subtitle">
            Trade skills instead of money using our atomic 50 CR virtual escrow logic.
          </p>
        </div>

        {/* shadcn/ui Segmented Category Tabs */}
        <div className="flex justify-center mb-6">
          <Tabs value={activeCategory} onValueChange={setActiveCategory}>
            <TabsList>
              <TabsTrigger value="all">All Domains</TabsTrigger>
              <TabsTrigger value="technology">Technology</TabsTrigger>
              <TabsTrigger value="creative">Creative Arts</TabsTrigger>
              <TabsTrigger value="languages">Languages</TabsTrigger>
              <TabsTrigger value="academic">Academics</TabsTrigger>
              <TabsTrigger value="matches">
                <Sparkles size={13} className="text-emerald" /> Barter Matches (
                {barterMatches.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {filteredMentors.length === 0 ? (
          <Card className="text-center" style={{ padding: '40px 24px' }}>
            <CardHeader>
              <CardTitle>No Mentors Found</CardTitle>
              <CardDescription style={{ maxWidth: '520px', margin: '6px auto 0' }}>
                No mentors have listed teaching skills in this category yet. When registered users
                add skills under <strong>My Profile → Skills I Have</strong>, they will appear here
                automatically.
              </CardDescription>
            </CardHeader>
          </Card>
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

      {/* shadcn/ui Booking Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent onClose={() => setIsModalOpen(false)}>
          <DialogHeader>
            <DialogTitle>Book 60-Min Mentorship Session</DialogTitle>
            <DialogDescription>
              Booking with{' '}
              <strong className="text-primary">{selectedMentor?.name || 'Mentor'}</strong> (
              {selectedMentor?.domain}).
            </DialogDescription>
          </DialogHeader>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <Label>Select Skill to Learn</Label>
              <select
                value={selectedSkillTopic}
                onChange={(e) => setSelectedSkillTopic(e.target.value)}
                className="shadcn-input"
              >
                {(selectedMentor?.skillsHave || ['React.js']).map((sk, idx) => (
                  <option key={idx} value={`${sk} Mentorship`}>
                    {sk} Mentorship ({selectedMentor?.domain})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label>Specific Learning Topic (Optional)</Label>
              <Input
                type="text"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                placeholder="e.g. Redux Toolkit State Architecture..."
              />
            </div>

            <div>
              <Label>Select Mentor Time Slot (60 Min)</Label>
              <select
                value={selectedDateSlot}
                onChange={(e) => setSelectedDateSlot(e.target.value)}
                className="shadcn-input"
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
              <div className="flex-between text-sm">
                <span>Session Cost</span>
                <span className="font-bold">50 Credits</span>
              </div>
              <div className="flex-between text-secondary text-xs mt-1">
                <span>Escrow Fee (10% Burn on Completion)</span>
                <span>5 Credits</span>
              </div>
              <div className="flex-between text-secondary text-xs mt-1">
                <span>Mentor Net Payout (90%)</span>
                <span>45 Credits</span>
              </div>
              <Separator style={{ margin: '12px 0' }} />
              <div className="flex-between font-bold text-amber text-sm">
                <span>Total Locked in Escrow</span>
                <span>50 Credits</span>
              </div>
            </div>

            {bookingError && (
              <Alert variant="destructive">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={16} />
                  <AlertDescription>{bookingError}</AlertDescription>
                </div>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="default"
              id="confirm-booking-btn"
              disabled={isBookingSubmitting}
              onClick={handleConfirmBooking}
            >
              {isBookingSubmitting ? 'Locking Escrow...' : 'Confirm & Lock Credits'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* shadcn/ui Public Mentor Profile & Reviews Dialog */}
      <Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
        <DialogContent
          onClose={() => setIsProfileModalOpen(false)}
          style={{ maxWidth: '520px' }}
        >
          <DialogHeader>
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback
                  style={{
                    background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-emerald))',
                    color: '#fff'
                  }}
                >
                  {inspectedMentor?.initials || 'M'}
                </AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle>{inspectedMentor?.name || inspectedMentor?.displayName}</DialogTitle>
                <DialogDescription>
                  {inspectedMentor?.domain} • ★ {inspectedMentor?.rating} (
                  {inspectedMentor?.totalSessions} sessions)
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <p className="text-sm text-secondary" style={{ lineHeight: 1.6 }}>
              {inspectedMentor?.bio ||
                `Verified ${inspectedMentor?.domain} mentor on SkillSwap with ${inspectedMentor?.totalSessions} completed 1-on-1 peer sessions.`}
            </p>

            <div>
              <Label className="flex items-center gap-1 mb-2">
                <Calendar size={13} /> Available 1-Hour Slots
              </Label>
              <div className="tags">
                {(inspectedMentor?.availability || []).length === 0 ? (
                  <span className="text-xs text-secondary">Flexible scheduling available</span>
                ) : (
                  (inspectedMentor?.availability || []).flatMap((a) =>
                    a.slots.map((s) => (
                      <Badge key={`${a.date}-${s}`} variant="cyan">
                        {a.date} • {s}
                      </Badge>
                    ))
                  )
                )}
              </div>
            </div>

            <div>
              <Label className="flex items-center gap-1 mb-2">
                <MessageSquare size={13} /> Verified Learner Reviews ({inspectedReviews.length})
              </Label>
              {inspectedReviews.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    ★ {inspectedMentor?.rating} average rating across{' '}
                    {inspectedMentor?.totalSessions} completed sessions. Complete a session with{' '}
                    {inspectedMentor?.name} to post a new review!
                  </AlertDescription>
                </Alert>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {inspectedReviews.map((rev, i) => (
                    <Card
                      key={rev.sessionId || i}
                      style={{ padding: '12px 14px', background: '#09090b' }}
                    >
                      <div className="flex-between mb-1">
                        <span className="font-bold text-sm">{rev.learnerName}</span>
                        <Badge variant="amber">
                          <Star size={11} fill="currentColor" /> {rev.rating}/5
                        </Badge>
                      </div>
                      <p className="text-xs text-secondary">{rev.comment}</p>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsProfileModalOpen(false)}>
              Close
            </Button>
            <Button
              variant="default"
              onClick={() => {
                setIsProfileModalOpen(false);
                if (inspectedMentor) handleOpenBookingModal(inspectedMentor);
              }}
            >
              Book Session (50 CR)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
