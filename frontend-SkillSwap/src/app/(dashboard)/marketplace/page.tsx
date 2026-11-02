'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { Mentor } from '@/types';
import { MentorCard } from '@/features/marketplace/components/MentorCard';
import { apiRequest } from '@/lib/apiClient';
import { useAuth } from '@/context/AuthContext';

const INITIAL_MENTORS: Mentor[] = [
  {
    _id: '664f1a2b3c4d5e6f7a8b9c99',
    userId: '664f1a2b3c4d5e6f7a8b9c99',
    name: 'Alex Rivera',
    displayName: 'Alex Rivera',
    initials: 'AR',
    rating: 4.9,
    sessions: 124,
    totalSessions: 124,
    domain: 'Technology',
    category: 'technology',
    skillsHave: ['React.js', 'Node.js'],
    skillsWant: ['UI/UX Design']
  },
  {
    _id: '664f1a2b3c4d5e6f7a8b9c98',
    userId: '664f1a2b3c4d5e6f7a8b9c98',
    name: 'Sarah Chen',
    displayName: 'Sarah Chen',
    initials: 'SC',
    rating: 5.0,
    sessions: 89,
    totalSessions: 89,
    domain: 'Creative Arts',
    category: 'creative',
    skillsHave: ['Figma', 'Graphic Design'],
    skillsWant: ['English Speaking']
  },
  {
    _id: '664f1a2b3c4d5e6f7a8b9c97',
    userId: '664f1a2b3c4d5e6f7a8b9c97',
    name: 'David Kim',
    displayName: 'David Kim',
    initials: 'DK',
    rating: 4.8,
    sessions: 56,
    totalSessions: 56,
    domain: 'Languages',
    category: 'languages',
    skillsHave: ['Korean', 'English IELTS'],
    skillsWant: ['Python']
  },
  {
    _id: '664f1a2b3c4d5e6f7a8b9c96',
    userId: '664f1a2b3c4d5e6f7a8b9c96',
    name: 'Emily Watson',
    displayName: 'Emily Watson',
    initials: 'EW',
    rating: 4.7,
    sessions: 42,
    totalSessions: 42,
    domain: 'Academics',
    category: 'academic',
    skillsHave: ['Statistics', 'Calculus'],
    skillsWant: ['Data Science']
  }
];

export default function MarketplacePage() {
  const router = useRouter();
  const { searchQuery, refreshProfile } = useAuth();
  const [mentors, setMentors] = useState<Mentor[]>(INITIAL_MENTORS);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMentors = async () => {
      try {
        const res = await apiRequest('/marketplace');
        if (res?.success && Array.isArray(res.mentors) && res.mentors.length > 0) {
          setMentors(res.mentors);
        }
      } catch (_) {
        // Keep initial mentors if backend is offline
      }
    };
    fetchMentors();
  }, []);

  const filteredMentors = mentors.filter((mentor) => {
    const matchesCategory =
      activeCategory === 'all' ||
      mentor.category.toLowerCase() === activeCategory.toLowerCase();

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

  const handleOpenBookingModal = (mentor: Mentor) => {
    setSelectedMentor(mentor);
    setBookingError(null);
    setIsModalOpen(true);
  };

  const handleConfirmBooking = async () => {
    if (!selectedMentor) return;
    setBookingError(null);

    try {
      await apiRequest('/sessions/book', {
        method: 'POST',
        body: JSON.stringify({
          mentorId: selectedMentor.userId || selectedMentor._id,
          mentorName: selectedMentor.name,
          skillName: `${selectedMentor.skillsHave[0] || 'Skill'} Mentorship`,
          domain: selectedMentor.domain || 'Technology'
        })
      });
      await refreshProfile();
    } catch (err: any) {
      if (err?.code === 'FORBIDDEN_DOMAIN' || err?.code === 'INSUFFICIENT_CREDITS') {
        setBookingError(err.message);
        return;
      }
    }

    setIsModalOpen(false);
    router.push('/active-sessions');
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

        <div className="category-tabs">
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
        </div>

        <div className="mentors-grid" id="mentors-grid">
          {filteredMentors.map((mentor) => (
            <MentorCard
              key={mentor._id}
              mentor={mentor}
              onBook={handleOpenBookingModal}
            />
          ))}
        </div>
      </section>

      {/* Booking Modal */}
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
                </strong>
                .
              </p>
              <div className="credit-breakdown">
                <div className="flex-between">
                  <span>Session Cost</span>
                  <span>50 Credits</span>
                </div>
                <div className="flex-between text-secondary text-sm mt-1">
                  <span>Escrow Fee (10%)</span>
                  <span>5 Credits</span>
                </div>
                <hr className="glass-divider my-3" />
                <div className="flex-between font-bold text-amber">
                  <span>Total Locked in Escrow</span>
                  <span>50 Credits</span>
                </div>
              </div>
              {bookingError && (
                <p className="text-red-400 text-sm mt-3">{bookingError}</p>
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
              onClick={handleConfirmBooking}
              type="button"
            >
              Confirm &amp; Lock Credits
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
