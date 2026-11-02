export type UserRole = 'USER' | 'ADMIN';

export type DomainCategory = 'Technology' | 'Creative Arts' | 'Languages' | 'Academics';

export type SkillLevel = 'BEGINNER' | 'INTERMEDIATE' | 'EXPERT';

export type SessionStatus =
  | 'PENDING'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'DISPUTED'
  | 'CANCELLED'
  | 'REFUNDED';

export type TransactionType = 'BONUS' | 'ESCROW_LOCK' | 'RELEASE' | 'REFUND' | 'BURN';

export interface SkillItem {
  _id?: string;
  skill: string;
  domain: DomainCategory;
  level: SkillLevel;
}

export interface AvailabilitySlot {
  _id?: string;
  date: string;
  slots: string[];
}

export interface User {
  _id: string;
  displayName: string;
  initials: string;
  email: string;
  role: UserRole;
  credits: number;
  streakCount: number;
  createdAt?: string;
}

export interface Mentor {
  _id: string;
  userId: string;
  name: string;
  displayName: string;
  initials: string;
  rating: number;
  sessions: number;
  totalSessions: number;
  domain: DomainCategory;
  category: 'technology' | 'creative' | 'languages' | 'academic' | string;
  skillsHave: string[];
  skillsWant: string[];
  skillsHaveDetailed?: SkillItem[];
  skillsWantDetailed?: SkillItem[];
  availability?: AvailabilitySlot[];
}

export interface Session {
  _id: string;
  learnerId: string;
  mentorId: string;
  mentorName?: string;
  mentorInitials?: string;
  learnerName?: string;
  learnerInitials?: string;
  status: SessionStatus;
  skillName: string;
  domain: DomainCategory;
  scheduledTime: string;
  startedAt?: string;
  completedAt?: string;
  creditsLocked: number;
  meetingLink: string;
  disputeReason?: string;
  feedback?: {
    rating: number;
    comment: string;
    submittedAt?: string;
  };
}

export interface Transaction {
  _id: string;
  userId: string;
  sessionId?: string | null;
  type: TransactionType;
  amount: number;
  balanceAfter?: number | null;
  description: string;
  createdAt: string;
}

export interface ChatMessage {
  _id: string;
  sessionId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
}

export interface LeaderboardMentor {
  rank: number;
  userId: string;
  displayName: string;
  initials: string;
  domain: string;
  sessions: number;
  rating: number;
}

export interface LeaderboardLearner {
  rank: number;
  userId: string;
  displayName: string;
  initials: string;
  skillsAcquired: number;
  isCurrentUser?: boolean;
}
