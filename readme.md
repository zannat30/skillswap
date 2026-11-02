# SkillSwap 🎓⚡ — Enterprise Engineering Specification & Documentation

[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen?style=for-the-badge&logo=github-actions)](#)
[![Version](https://img.shields.io/badge/Version-1.0.0--MVP-blue?style=for-the-badge)](#)
[![Architecture](https://img.shields.io/badge/Architecture-Decoupled_Micro--Tier-purple?style=for-the-badge)](#)
[![Database](https://img.shields.io/badge/MongoDB-Atlas_Cluster-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](#)
[![AI Engine](https://img.shields.io/badge/Google-Gemini_AI_SDK-4285F4?style=for-the-badge&logo=google&logoColor=white)](#)
[![Real-Time](https://img.shields.io/badge/WebSockets-Socket.io_v4-010101?style=for-the-badge&logo=socket.io)](#)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](#)

> **An AI-Powered Decentralized Knowledge Exchange & Virtual Barter Economy Platform**  
> *Engineered to eliminate the financial friction of 1-on-1 commercial mentorship through deterministic escrow wallets, real-time WebSocket workspaces, and 24/7 Generative AI technical assistance.*

---

## 📑 Comprehensive Table of Contents

1. [Executive Summary & System Definition](#1-executive-summary--system-definition)
2. [Problem Analysis & Industry Comparison](#2-problem-analysis--industry-comparison)
3. [Deep-Dive Technology Stack & Justification](#3-deep-dive-technology-stack--justification)
4. [System Architecture & Strict Repository Decoupling](#4-system-architecture--strict-repository-decoupling)
5. [Data Flow Diagrams (Level 0 & Level 1) & Use Cases](#5-data-flow-diagrams-level-0--level-1--use-cases)
6. [Exhaustive Feature Catalog (Granular Atomic CRUD & System Modules)](#6-exhaustive-feature-catalog-granular-atomic-crud--system-modules)
7. [Virtual Credit Economics & Atomic Escrow Mechanics](#7-virtual-credit-economics--atomic-escrow-mechanics)
8. [Deterministic Session State Machine & Lifecycle Rules](#8-deterministic-session-state-machine--lifecycle-rules)
9. [Domain Boundary Enforcement & Content Moderation Policies](#9-domain-boundary-enforcement--content-moderation-policies)
10. [User Roles & End-to-End Operational Workflows](#10-user-roles--end-to-end-operational-workflows)
11. [Database Engineering & Mongoose ODM Schemas](#11-database-engineering--mongoose-odm-schemas)
12. [Complete RESTful API Reference & Payload Contracts](#12-complete-restful-api-reference--payload-contracts)
13. [Real-Time WebSocket (Socket.io) Event Architecture](#13-real-time-websocket-socketio-event-architecture)
14. [Security Architecture (CIA Triad Implementation)](#14-security-architecture-cia-triad-implementation)
15. [Complete Local Installation & Setup Guide](#15-complete-local-installation--setup-guide)
16. [MongoDB Atlas Cloud Provisioning & Indexing Guide](#16-mongodb-atlas-cloud-provisioning--indexing-guide)
17. [Google Gemini AI Studio Configuration Guide](#17-google-gemini-ai-studio-configuration-guide)
18. [Exhaustive Environment Variables Reference (`.env`)](#18-exhaustive-environment-variables-reference-env)
19. [System Testing, Unit Test Suites & QA Benchmarks](#19-system-testing-unit-test-suites--qa-benchmarks)
20. [Troubleshooting & Standard Error Code Dictionary](#20-troubleshooting--standard-error-code-dictionary)
21. [Product Roadmap & Future Engineering Phases](#21-product-roadmap--future-engineering-phases)
22. [Academic Authority, Contributors & License](#22-academic-authority-contributors--license)

---

## 1. Executive Summary & System Definition

**SkillSwap** is a full-stack, session-based peer-to-peer knowledge exchange platform operating on a decentralized, non-monetary **Virtual Barter System** logic. Rather than relying on fiat currency or credit card gateways, learners and mentors trade instructional hours using an internal virtual currency (**SkillSwap Credits - CR**).

### Core Engineering Tenets
* **The Core Atomic Unit (`Session`):** A strictly time-bound interaction (standardized at $60\text{ minutes}$) where a **Learner** and a **Mentor** connect inside a synchronized workspace to exchange domain-specific knowledge for $50\text{ virtual credits}$.
* **Zero-Trust Escrow Engine:** All credit movements are governed by an automated server-side Escrow state machine. Credits are locked prior to session initiation and are only disbursed when delivery is verified, or refunded if a dispute is upheld.
* **Hybrid Human + AI Mentorship (`SkillBot`):** Integrates the **Google Gemini AI SDK** directly into the learning pipeline. Trivial syntactic bugs, boilerplate generation, and learning roadmaps are resolved instantaneously 24/7 by AI, reserving human 1-on-1 mentorship slots for high-value conceptual architecture and live pair-programming.
* **Strict Decoupling:** The Frontend (`Next.js + TypeScript`) and Backend (`Node.js + Express`) operate as completely independent repositories communicating exclusively over stateless RESTful JSON APIs and stateful WebSocket (`Socket.io`) channels.

---

## 2. Problem Analysis & Industry Comparison

Self-directed learners, university computer science students, and junior engineers currently face a polarized mentorship landscape:

1. **Commercial Tutoring Platforms (e.g., Codementor, Wyzant):**
   * Charge steep hourly rates ranging from $\$15$ to $\$50+$ per $15\text{ minutes}$.
   * Require international dual-currency credit cards, excluding unbanked students in developing regions.
2. **Informal Community Servers (e.g., Discord, Reddit, WhatsApp, StackOverflow):**
   * **High Response Latency:** Urgent debugging queries frequently go unanswered for hours or days due to zero mentor incentives.
   * **Scattered Knowledge:** Solutions and code snippets get buried immediately under fast-moving chat streams.
   * **Zero Accountability:** No formal mechanism guarantees that a volunteer peer will dedicate uninterrupted time to resolve a learner's issue.

### Comparative Matrix

| Evaluation Metric | Commercial Platforms (Codementor) | Informal Forums (Discord / WhatsApp) | SkillSwap (Proposed Platform) |
| :--- | :--- | :--- | :--- |
| **Financial Cost** | High ($\$60\text{–}\$200/\text{hr}$) | Free ($\$0$) | **100% Free (Virtual Credit Barter)** |
| **Response Latency** | Fast (Paid Priority) | Slow (Hours to Days, Unpredictable) | **Instant (24/7 Gemini AI + Scheduled Human)** |
| **Transaction Security** | Fiat Escrow (Stripe/PayPal) | None (Zero Trust / High Ghosting) | **Automated Virtual Credit Escrow Engine** |
| **Workspace Structure** | Dedicated WebRTC Room | Chaotic Public/Threaded Text Channels | **Isolated Socket.io Room + Live Sync Timer** |
| **Mentor Incentive** | Monetary Payouts | Altruism / Internet Points | **Earn Credits to Learn Other High-Value Skills** |
| **Academic Integrity** | Weak Moderation | Unmoderated | **Strict `403 FORBIDDEN_DOMAIN` Server Filters** |

---

## 3. Deep-Dive Technology Stack & Justification

### 3.1 Frontend Presentation Tier (`frontend-SkillSwap`)
* **Framework:** **Next.js (Latest App Router)** — Provides React Server Components (RSC), optimized client-side routing, and fast page transitions across the Marketplace and Active Session rooms.
* **Language:** **TypeScript (`v5.x`)** — Enforces compile-time static type checking across API payloads, Socket event contracts, and user profile models.
* **Styling Engine:** **Tailwind CSS (`v3.4+`)** — Utility-first CSS framework enabling a custom, high-contrast dark-mode UI (`#0B0F19` slate palette with `#10B981` emerald accents).
* **Component Primitives:** **ShadCN UI & Radix UI** — Accessible, unstyled WAI-ARIA compliant modals, dropdowns, toast alerts, and feedback dialogs.
* **Real-Time Client:** **Socket.io-Client (`v4.7+`)** — Manages persistent WebSocket connections, automatic reconnection strategies, and room-level event listeners.

### 3.2 Backend Logic & API Tier (`backend-SkillSwap`)
* **Runtime Environment:** **Node.js (`v18.x / v20.x LTS`)** — Event-driven, non-blocking I/O architecture capable of handling thousands of concurrent WebSocket ticks and asynchronous AI streaming requests.
* **Web Framework:** **Express.js (`v4.19+`)** — Lightweight RESTful routing framework structured around the Controller-Service-Model design pattern.
* **Authentication & Cryptography:** **JSON Web Tokens (`jsonwebtoken`) & `bcryptjs`** — Stateless bearer token authorization paired with 10-round salted blowfish password hashing.
* **Real-Time Engine:** **Socket.io Server (`v4.7+`)** — Multiplexed WebSocket server managing isolated session rooms, real-time chat broadcasting, and authoritative server-side countdown timers.

### 3.3 Database & Artificial Intelligence Tier
* **Primary Database:** **MongoDB Atlas (Cloud NoSQL)** — Document-oriented storage supporting ACID multi-document transactions for atomic credit transfers and flexible array indexing for `skillsHave` / `skillsWant`.
* **Object Data Modeling (ODM):** **Mongoose (`v8.x`)** — Enforces strict schema validation, enum constraints, foreign-key population (`ref`), and pre-save hooks.
* **Generative AI Engine:** **Google Gemini AI SDK (`@google/generative-ai`)** — Powers `SkillBot` using custom system instructions to deliver low-latency technical debugging, structured JSON learning roadmaps, and semantic mentor matching.

---

## 4. System Architecture & Strict Repository Decoupling

SkillSwap enforces a **strict physical decoupling** between the presentation client and the backend API server. Neither repository imports files, types, or modules directly from the other.

```
+-----------------------------------------------------------------------------------+
|                        CLIENT PRESENTATION TIER (Port: 3000)                      |
|               Next.js App Router + TypeScript + Tailwind CSS + ShadCN             |
|                                                                                   |
|  +---------------+  +-----------------+  +---------------+  +------------------+  |
|  |  Marketplace  |  | Active Sessions |  |  AI SkillBot  |  | Wallet & Profile |  |
|  |  UI Module    |  | (Live Timer UI) |  |  Chat Drawer  |  |  Ledger Viewer   |  |
|  +---------------+  +-----------------+  +---------------+  +------------------+  |
+-----------------------------------------------------------------------------------+
                 |                                                ^
                 | HTTPS RESTful JSON                             | WSS WebSockets
                 | (Bearer JWT Header)                            | (Socket.io Rooms)
                 v                                                |
+-----------------------------------------------------------------------------------+
|                         BACKEND API & LOGIC TIER (Port: 5000)                     |
|                           Node.js + Express.js + Socket.io                        |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  | Security & Guard Middleware Layer                                           |  |
|  | [CORS Policy] -> [Helmet] -> [JWT Verifier] -> [403 Domain Boundary Filter] |  |
|  +-----------------------------------------------------------------------------+  |
|                                        |                                          |
|  +--------------------+   +-----------------------+   +------------------------+  |
|  | Escrow & Wallet    |   | Session State Machine |   | Socket.io Room & Timer |  |
|  | Atomic Controller  |   | Lifecycle Controller  |   | Synchronization Engine |  |
|  +--------------------+   +-----------------------+   +------------------------+  |
+-----------------------------------------------------------------------------------+
                        |                                         |
                        | Mongoose ODM (TCP/TLS)                  | HTTPS REST (gRPC)
                        v                                         v
+-----------------------------------------------+   +-------------------------------+
|          PERSISTENCE TIER (Cloud DB)          |   |    INTELLIGENCE TIER (AI)     |
|             MongoDB Atlas Cluster             |   |     Google Gemini AI API      |
|                                               |   |                               |
|  [users]  [user_profiles]  [sessions]  [txs]  |   | [System Prompt: SkillBot 24/7]|
+-----------------------------------------------+   +-------------------------------+
```

### Complete Decoupled Directory Structure

```text
skillswap-workspace/
│
├── frontend-SkillSwap/                         # REPOSITORY 1: Next.js Client Application
│   ├── public/
│   │   └── assets/                             # Static brand icons, badges, sounds
│   ├── src/
│   │   ├── app/                                # Next.js App Router Hierarchy
│   │   │   ├── (auth)/
│   │   │   │   ├── login/page.tsx              # JWT Authentication Login View
│   │   │   │   └── register/page.tsx           # Onboarding & +100 CR Grant View
│   │   │   ├── (dashboard)/
│   │   │   │   ├── layout.tsx                  # Sidebar Navigation & Top Wallet Bar
│   │   │   │   ├── marketplace/page.tsx        # Mentor Discovery & Domain Filters
│   │   │   │   ├── active-sessions/page.tsx    # Live Countdown & Meeting Room UI
│   │   │   │   ├── ai-skillbot/page.tsx        # 24/7 Google Gemini Chat Interface
│   │   │   │   ├── profile/page.tsx            # Skills Have/Want CRUD & Escrow Ledger
│   │   │   │   ├── leaderboard/page.tsx        # 7-Day Streak & Top Mentors View
│   │   │   │   └── admin/disputes/page.tsx     # Admin Dispute Arbitration Console
│   │   │   ├── layout.tsx                      # Root Providers (Auth, Socket, Toast)
│   │   │   └── page.tsx                        # Landing Page
│   │   ├── components/
│   │   │   ├── ui/                             # ShadCN Atomic Components (Button, Dialog)
│   │   │   ├── marketplace/MentorCard.tsx      # Individual Mentor Slot Booking Card
│   │   │   ├── session/LiveTimer.tsx           # Socket-Synced MM:SS Countdown Component
│   │   │   ├── session/FeedbackModal.tsx       # Post-Session Mark as Learnt / Dispute Modal
│   │   │   └── wallet/TransactionTable.tsx     # Audit Trail Table (BONUS, LOCK, RELEASE)
│   │   ├── context/
│   │   │   ├── AuthContext.tsx                 # Global User State & JWT Persistence
│   │   │   └── SocketContext.tsx               # Singleton Socket.io Client Instance
│   │   ├── lib/
│   │   │   ├── apiClient.ts                    # Fetch Wrapper with Auth Header Injection
│   │   │   └── validators.ts                   # Client-side Zod Input Schemas
│   │   └── types/
│   │       └── index.ts                        # Shared TypeScript Interfaces
│   ├── .env.local.example
│   ├── next.config.js
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── package.json
│
└── backend-SkillSwap/                          # REPOSITORY 2: Standalone Express API Server
    ├── src/
    │   ├── config/
    │   │   ├── db.js                           # MongoDB Atlas Connection Pool Setup
    │   │   ├── gemini.js                       # Google Gemini SDK Initialization
    │   │   └── corsOptions.js                  # Strict Origin Whitelisting
    │   ├── controllers/
    │   │   ├── authController.js               # Register, Login, Streak Calculation
    │   │   ├── profileController.js            # CRUD for Skills Have/Want & Availability
    │   │   ├── sessionController.js            # Booking, Start, Complete, Cancel, Dispute
    │   │   ├── walletController.js             # Balance Queries & Immutable Ledger Logs
    │   │   ├── aiController.js                 # SkillBot Prompting & Mentor Matching
    │   │   ├── leaderboardController.js        # Aggregation Pipelines for Rankings
    │   │   └── adminController.js              # Dispute Refund/Release & User Banning
    │   ├── middleware/
    │   │   ├── authMiddleware.js               # JWT Verification & Role Guard (USER/ADMIN)
    │   │   ├── domainFilterMiddleware.js       # Enforces 403 FORBIDDEN_DOMAIN Rules
    │   │   └── errorHandler.js                 # Centralized Express Error Formatter
    │   ├── models/
    │   │   ├── User.js                         # Core Auth, Wallet Credits & Streak Schema
    │   │   ├── UserProfile.js                  # Bio, Skills Arrays, Availability Schema
    │   │   ├── Session.js                      # State Machine, Escrow Lock & Feedback Schema
    │   │   ├── Transaction.js                  # Immutable Financial Audit Trail Schema
    │   │   └── ChatLog.js                      # Session Room Message History Schema
    │   ├── routes/
    │   │   ├── authRoutes.js
    │   │   ├── profileRoutes.js
    │   │   ├── sessionRoutes.js
    │   │   ├── walletRoutes.js
    │   │   ├── aiRoutes.js
    │   │   └── adminRoutes.js
    │   ├── sockets/
    │   │   └── sessionSocket.js                # Authoritative Room Timer & Chat Events
    │   └── utils/
    │       ├── escrowEngine.js                 # Atomic 90/10 Split & Burn Calculations
    │       └── forbiddenKeywords.js            # Dictionary of Prohibited Academic Fraud Terms
    ├── tests/
    │   ├── escrow.test.js                      # Unit Tests for Credit Locking & Splitting
    │   └── domainFilter.test.js                # Unit Tests for 403 Forbidden Categories
    ├── .env.example
    ├── server.js                               # HTTP + Socket.io Entry Point
    └── package.json
```

---

## 5. Data Flow Diagrams (Level 0 & Level 1) & Use Cases

### 5.1 Level 0 DFD (Context Diagram)

```
                    Session Bookings, Auth Credentials, AI Prompts
      +-----------+ ---------------------------------------------> +
      |  Learner  |                                                |
      +-----------+ <--------------------------------------------- |
                    Notifications, AI Roadmaps, Refunds            v
                                                           +---------------+
      +-----------+ Accept/Start Session, Profile Updates  |       0       | Dispute Rulings, +-----------+
      |  Mentor   | -------------------------------------> |   SkillSwap   | <--------------- |   Admin   |
      +-----------+ <------------------------------------- |   Platform    | ---------------> +-----------+
                    Booking Alerts, +45 CR Escrow Releases +---------------+  Flagged Reports
                                                                |     ^
                                             Structured Prompts |     | Markdown + JSON
                                                                v     |
                                                       +-----------------------+
                                                       |   Google Gemini API   |
                                                       +-----------------------+
```

### 5.2 Level 1 DFD (Internal Sub-Processes)

```
  [User Credentials] ───► ( 1.1 Auth & JWT Engine ) ◄────── Read/Write ──────► [ D1: users Store ]
                                     │
                                     ▼
  [Profile & Skills] ───► ( 1.2 Profile & Matching ) ◄───── Read/Write ──────► [ D2: user_profiles Store ]
                                     │
                                     ▼
  [Slot Booking Req] ───► ( 1.3 Session Scheduler ) ◄────── Mutate State ────► [ D3: sessions Store ]
                                     │
                                     ▼
  [50 CR Escrow Hold] ──► ( 1.4 Atomic Escrow Engine ) ◄─── Append Only ─────► [ D4: transactions Store ]
                                     │
                                     ▼
  [Technical Query]  ───► ( 1.5 AI SkillBot Service ) ◄──── Prompt/Stream ───► [ External: Gemini SDK ]
```

---

## 6. Exhaustive Feature Catalog (Granular Atomic CRUD & System Modules)

Every single operation in SkillSwap—including atomic Create, Read, Update, and Delete (CRUD) functions across all database collections—is cataloged below as an independent functional feature.

### Module 1: Identity, Authentication & Access Control
1. **[CREATE] User Account Registration (`POST /api/auth/register`):** Validates email format and uniqueness, hashes plain-text password via `bcrypt` (10 salt rounds), creates a `users` record, and automatically triggers the Onboarding Bonus (+100 Credits).
2. **[CREATE] Initial Transaction Ledger Entry:** Automatically writes an immutable `BONUS` record of `+100 CR` to the `transactions` collection upon user creation.
3. **[READ] User Credential Verification & Login (`POST /api/auth/login`):** Compares input password against stored `passwordHash`, verifies `isBanned === false`, and issues a signed 7-day JWT containing `{ userId, email, role }`.
4. **[READ] Active Session Token Validation (`GET /api/auth/me`):** Parses `Authorization: Bearer <token>` header to hydrate client session state on page reload.
5. **[UPDATE] Daily Login Timestamp & Streak Counter:** Compares `lastLogin` date with current server UTC timestamp; increments `streakCount` by $+1$ if login occurs within $24\text{–}48\text{ hours}$, or resets to $1$ if $>48\text{ hours}$ elapsed.
6. **[UPDATE] Password Reset & Rotation (`PUT /api/auth/password`):** Authenticates current password and updates `passwordHash` with a newly generated salt.
7. **[DELETE] Session Logout & Socket Teardown (`POST /api/auth/logout`):** Invalidates client JWT storage and forcefully disconnects active `Socket.io` socket IDs tied to the user.

### Module 2: User Profile & Bidirectional Skill Mapping (CRUD)
8. **[CREATE] Initialize User Profile (`POST /api/profile`):** Generates a 1-to-1 linked `user_profiles` document upon registration with default rating ($5.0$) and empty skill arrays.
9. **[READ] Fetch Own Profile & Wallet Summary (`GET /api/profile/me`):** Retrieves merged data from `users` and `user_profiles`, including available balance, escrow-locked balance, and skill tags.
10. **[READ] Public Mentor Profile Inspection (`GET /api/profile/:userId`):** Fetches public mentor details, bio, `skillsHave`, `skillsWant`, cumulative rating, and completed session count for learners browsing the marketplace.
11. **[UPDATE] Edit Display Name & Biography (`PUT /api/profile/bio`):** Updates user `displayName` and professional `bio` string (sanitized against XSS).
12. **[CREATE] Add "Skill I Have" (`POST /api/profile/skills-have`):** Passes input through the `403 FORBIDDEN_DOMAIN` filter; appends `{ skill, level: 'BEGINNER' | 'INTERMEDIATE' | 'EXPERT' }` to the `skillsHave` array.
13. **[READ] List "Skills I Have" (`GET /api/profile/skills-have`):** Returns the user's current teaching competencies.
14. **[UPDATE] Modify "Skill I Have" Proficiency Level (`PUT /api/profile/skills-have/:skillId`):** Upgrades or downgrades expertise level (e.g., from `INTERMEDIATE` to `EXPERT`).
15. **[DELETE] Remove "Skill I Have" (`DELETE /api/profile/skills-have/:skillId`):** Pulls a specific skill object from the `skillsHave` array using MongoDB `$pull`.
16. **[CREATE] Add "Skill I Want" (`POST /api/profile/skills-want`):** Appends desired learning target `{ skill, level }` to the `skillsWant` array.
17. **[READ] List "Skills I Want" (`GET /api/profile/skills-want`):** Retrieves target skills for the AI recommendation matcher.
18. **[UPDATE] Modify "Skill I Want" Target Level (`PUT /api/profile/skills-want/:skillId`):** Adjusts desired learning depth.
19. **[DELETE] Remove "Skill I Want" (`DELETE /api/profile/skills-want/:skillId`):** Removes completed or unwanted learning goals from `skillsWant`.

### Module 3: Mentor Availability Calendar Management (CRUD)
20. **[CREATE] Add Availability Time Slot (`POST /api/profile/availability`):** Appends a date and array of 1-hour string slots (e.g., `["14:00-15:00", "16:00-17:00"]`) to the mentor's schedule.
21. **[READ] Fetch Mentor Available Slots (`GET /api/profile/:userId/availability`):** Returns unbooked future time slots for the booking modal.
22. **[UPDATE] Reschedule Availability Slot (`PUT /api/profile/availability/:slotId`):** Modifies time window for an unbooked slot.
23. **[DELETE] Remove Availability Slot (`DELETE /api/profile/availability/:slotId`):** Deletes an availability window or automatically removes it once booked by a learner.

### Module 4: Marketplace Discovery & Bidirectional Matching
24. **[READ] Paginated Mentor Marketplace Feed (`GET /api/marketplace`):** Queries all non-banned mentors, sorted by rating and total sessions completed.
25. **[READ] Domain Category Filtering (`GET /api/marketplace?domain=Technology`):** Filters mentors dynamically by allowed domains (`Technology`, `Creative Arts`, `Languages`, `Academics`).
26. **[READ] Keyword & Skill Tag Search (`GET /api/marketplace?search=React`):** Executes case-insensitive regex and indexed text search across `skillsHave.skill` and `displayName`.
27. **[READ] Bidirectional Barter Matchmaking (`GET /api/marketplace/matches`):** Executes an intersection query finding mentors whose `skillsHave` match the active user's `skillsWant`, AND whose `skillsWant` match the active user's `skillsHave`.

### Module 5: Session Lifecycle & Escrow Booking Engine (CRUD)
28. **[CREATE] Book Mentorship Session (`POST /api/sessions/book`):** Validates domain permissions, verifies learner `credits >= 50`, deducts $50\text{ CR}$ from learner's available balance, locks $50\text{ CR}$ in session escrow, creates a `PENDING` session document, and logs an `ESCROW_LOCK` transaction.
29. **[READ] Fetch Active & Upcoming Sessions (`GET /api/sessions/active`):** Retrieves all sessions where the user is either `learnerId` or `mentorId` with status `PENDING` or `ACTIVE`.
30. **[READ] Fetch Historical Session Archive (`GET /api/sessions/history`):** Retrieves completed, cancelled, and refunded sessions for user auditing.
31. **[READ] Fetch Single Session Workspace Details (`GET /api/sessions/:id`):** Loads session metadata, meeting link, participant profiles, and remaining timer state.
32. **[UPDATE] Mentor Accepts & Starts Session (`POST /api/sessions/:id/start`):** Strictly authorized for `mentorId`; transitions session state from `PENDING` $\rightarrow$ `ACTIVE`, records start timestamp, and initializes the 60-minute Socket.io countdown timer.
33. **[UPDATE] Attach/Update External Meeting Link (`PUT /api/sessions/:id/meeting-link`):** Allows mentor to inject or update a Google Meet / Zoom URI inside the active workspace.
34. **[UPDATE] Learner Marks Session as Learnt (`POST /api/sessions/:id/complete`):** Strictly authorized for `learnerId`; transitions state from `ACTIVE` $\rightarrow$ `COMPLETED`, releases $45\text{ CR}$ ($90\%$) to mentor, permanently burns $5\text{ CR}$ ($10\%$), increments mentor `totalSessions`, and writes `RELEASE` and `BURN` ledger entries.
35. **[UPDATE] Learner Raises Session Dispute (`POST /api/sessions/:id/dispute`):** Strictly authorized for `learnerId`; transitions state from `ACTIVE` $\rightarrow$ `DISPUTED`, freezes the $50\text{ CR}$ in escrow, and queues the session in the Admin Arbitration Console.
36. **[DELETE/UPDATE] Cancel Pending Session (`POST /api/sessions/:id/cancel`):** Allows mentor rejection or system 24-hour timeout cancellation; transitions `PENDING` $\rightarrow$ `CANCELLED`, unlocks the $50\text{ CR}$ escrow, and writes a `REFUND` ledger entry back to the learner.

### Module 6: Post-Session Rating & Review System (CRUD)
37. **[CREATE] Submit Mentor Rating & Review (`POST /api/sessions/:id/feedback`):** Learner submits a numerical rating ($1\text{–}5\text{ stars}$) and written feedback comment upon marking a session complete.
38. **[READ] Fetch Mentor Reviews (`GET /api/profile/:userId/reviews`):** Aggregates all feedback objects from completed sessions for display on the mentor's profile card.
39. **[UPDATE] Recalculate Mentor Rolling Average Rating:** Automatically computes the new weighted average rating on `user_profiles` whenever a new feedback object is created.

### Module 7: Virtual Credit Wallet & Immutable Audit Ledger
40. **[READ] Real-Time Wallet Balance Breakdown (`GET /api/wallet/balance`):** Computes `availableCredits` (from `users.credits`) and `lockedInEscrow` (sum of `creditsLocked` across active `PENDING`/`ACTIVE`/`DISPUTED` sessions).
41. **[READ] Immutable Transaction History (`GET /api/wallet/transactions`):** Returns chronological audit trail of all credit movements (`BONUS`, `ESCROW_LOCK`, `RELEASE`, `REFUND`, `BURN`) for the authenticated user.

### Module 8: AI SkillBot (Google Gemini 24/7 Integration)
42. **[CREATE] Submit Technical Query to SkillBot (`POST /api/ai/ask`):** Sends user coding bug or conceptual question to Google Gemini with the custom `SkillSwap Mentor` system prompt; returns Markdown-formatted code fixes and explanations.
43. **[CREATE] Generate Structured Learning Roadmap (`POST /api/ai/roadmap`):** Prompts Gemini to generate a multi-week curriculum roadmap for any requested technology or language.
44. **[READ] AI-Driven Internal Mentor Suggestion:** Parses the user's AI query topic and queries MongoDB `user_profiles` to append 3 real human mentors on SkillSwap who teach that exact skill.

### Module 9: Real-Time Workspace & Chat (Socket.io)
45. **[CREATE] Persist Session Chat Message (`socket: send-message`):** Saves real-time text and code snippets sent between learner and mentor into the `ChatLog` collection and broadcasts to the room.
46. **[READ] Load Session Chat History (`GET /api/sessions/:id/chat`):** Hydrates previous coordination messages when a user rejoins an active session room.
47. **[READ/UPDATE] Authoritative Server Countdown Broadcast (`socket: timer-update`):** Emits remaining session seconds (`3600` down to `0`) every second to all clients connected to `room:session_<id>`.

### Module 10: Gamification, Streaks & Leaderboards
48. **[UPDATE] Claim 7-Day Streak Bonus (`POST /api/wallet/claim-streak`):** Verifies `streakCount >= 7`, awards $+20\text{ CR}$ bonus to user wallet, logs a `BONUS` transaction, and resets the claim cycle.
49. **[READ] Top Mentors Global Leaderboard (`GET /api/leaderboard/mentors`):** MongoDB aggregation ranking top mentors by `totalSessions` taught and average `rating`.
50. **[READ] Top Learners Global Leaderboard (`GET /api/leaderboard/learners`):** MongoDB aggregation ranking top learners by total completed sessions and distinct skills acquired.

### Module 11: Admin Moderation & Dispute Arbitration
51. **[READ] Fetch All Disputed Sessions (`GET /api/admin/disputes`):** `[Admin Only]` Lists all sessions currently frozen in the `DISPUTED` state along with chat logs and timestamps.
52. **[UPDATE] Admin Approves Learner Refund (`POST /api/admin/disputes/:id/refund`):** `[Admin Only]` Transitions `DISPUTED` $\rightarrow$ `REFUNDED`, returns full $50\text{ CR}$ to the learner's wallet, and logs a `REFUND` transaction.
53. **[UPDATE] Admin Rejects Dispute & Releases to Mentor (`POST /api/admin/disputes/:id/release`):** `[Admin Only]` Transitions `DISPUTED` $\rightarrow$ `COMPLETED`, disburses $45\text{ CR}$ to mentor, burns $5\text{ CR}$, and logs `RELEASE` and `BURN` transactions.
54. **[UPDATE] Ban / Unban Malicious User (`PUT /api/admin/users/:userId/ban`):** `[Admin Only]` Toggles `isBanned` boolean on `users`, immediately blocking login and API access for policy violators.

---

## 7. Virtual Credit Economics & Atomic Escrow Mechanics

To prevent runaway credit inflation (which plagues virtual economies when onboarding bonuses are continuously minted), SkillSwap implements an automated **Deflationary Token Burn** alongside its **Zero-Trust Escrow Split**.

### Mathematical Economic Model

$$\text{Onboarding Grant } (G_{\text{init}}) = 100\text{ CR}$$

$$\text{Standard Session Cost } (C_{\text{session}}) = 50\text{ CR per } 60\text{ minutes}$$

$$\text{Mentor Payout } (P_{\text{mentor}}) = C_{\text{session}} \times (1 - R_{\text{burn}}) = 50 \times 0.90 = 45\text{ CR}$$

$$\text{Deflationary Platform Burn } (B_{\text{system}}) = C_{\text{session}} \times R_{\text{burn}} = 50 \times 0.10 = 5\text{ CR}$$

### Step-by-Step Escrow Execution Pipeline

```
+-------------------------------------------------------------------------+
| STEP 1: ONBOARDING                                                      |
| New User Registers ---> System Mints +100 CR (Ledger: BONUS)            |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
| STEP 2: BOOKING & ESCROW LOCK                                           |
| Learner Books Mentor ---> -50 CR Deducted from Learner Available Wallet |
|                      ---> +50 CR Held in Session Escrow (ESCROW_LOCK)   |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
| STEP 3: SESSION DELIVERY (60 Mins)                                      |
| Mentor Starts Session ---> Socket.io Timer Counts Down 59:59 to 00:00   |
+-------------------------------------------------------------------------+
                                    |
                   +----------------+----------------+
                   |                                 |
      [Path A: "Mark as Learnt"]        [Path B: "Didn't Learn" (Dispute)]
                   |                                 |
                   v                                 v
+-----------------------------------+   +---------------------------------+
| STEP 4A: AUTO-SPLIT SETTLEMENT    |   | STEP 4B: ADMIN ARBITRATION      |
| - 45 CR (90%) -> Mentor (RELEASE) |   | - Credits Frozen in DISPUTED    |
| - 05 CR (10%) -> Destroyed (BURN) |   | - Admin Reviews Chat & Logs     |
| - Session Status -> COMPLETED     |   | - If Approved: +50 CR Learner   |
+-----------------------------------+   |   (Ledger: REFUND)              |
                                        +---------------------------------+
```

### Immutable Ledger Transaction Types

| Ledger Enum | Credit Delta | Trigger Event | Source $\rightarrow$ Destination |
| :--- | :--- | :--- | :--- |
| `BONUS` | $+100\text{ CR}$ / $+20\text{ CR}$ | Account Registration or 7-Day Streak Claim | `System Mint` $\rightarrow$ `User Wallet` |
| `ESCROW_LOCK` | $-50\text{ CR}$ | Learner requests a 1-hour mentorship slot | `Learner Wallet` $\rightarrow$ `Session Escrow` |
| `RELEASE` | $+45\text{ CR}$ | Learner clicks "Mark as Learnt" (or Admin rejects dispute) | `Session Escrow` $\rightarrow$ `Mentor Wallet` |
| `BURN` | $-5\text{ CR}$ | 10% deflationary fee executed simultaneously with `RELEASE` | `Session Escrow` $\rightarrow$ `Null Sink (Destroyed)` |
| `REFUND` | $+50\text{ CR}$ | Mentor cancels, 24h timeout expires, or Admin upholds dispute | `Session Escrow` $\rightarrow$ `Learner Wallet` |

---

## 8. Deterministic Session State Machine & Lifecycle Rules

Every mentorship session is governed by a strict finite state machine (FSM). Illegal state jumps (e.g., jumping from `PENDING` directly to `COMPLETED`, or a Mentor attempting to trigger `COMPLETED`) are blocked at the controller level with `HTTP 400 INVALID_STATE_TRANSITION` or `HTTP 403 UNAUTHORIZED_ROLE`.

```
                  +-----------------------------------+
                  |              PENDING              |
                  |   (50 CR Locked in Escrow Vault)  |
                  +-----------------------------------+
                     /                              \
                    /                                \
     [Mentor Clicks "Start"]                 [Mentor Rejects OR 24h Timeout]
                  /                                    \
                 v                                      v
      +--------------------+                 +--------------------+
      |       ACTIVE       |                 |     CANCELLED      |
      | (60m Timer Ticking)|                 | (+50 CR Refunded)  |
      +--------------------+                 +--------------------+
         /              \
        /                \
[Learner: "Learnt"]  [Learner: "Didn't Learn"]
      /                    \
     v                      v
+-----------+        +--------------------+          +--------------------+
| COMPLETED |        |      DISPUTED      | -------> |      REFUNDED      |
| (+45 / -5)|        | (Escrow Frozen)    |  [Admin  | (+50 CR Refunded)  |
+-----------+        +--------------------+ Approves]+--------------------+
                            |
                            | [Admin Rejects Refund]
                            v
                     +--------------------+
                     |     COMPLETED      |
                     | (+45 CR to Mentor) |
                     +--------------------+
```

### State Transition Authorization Matrix

| Current State | Target State | Trigger Action | Required Actor Role | Escrow Financial Side-Effect |
| :--- | :--- | :--- | :--- | :--- |
| `NONE` | `PENDING` | Learner submits slot booking request | `USER (Learner)` | $-50\text{ CR}$ locked (`ESCROW_LOCK`) |
| `PENDING` | `ACTIVE` | Mentor clicks **Start Session** | `USER (Mentor)` | $50\text{ CR}$ remains locked; timer starts |
| `PENDING` | `CANCELLED` | Mentor declines request OR 24h cron timeout | `USER (Mentor)` / `SYSTEM` | $+50\text{ CR}$ returned to Learner (`REFUND`) |
| `ACTIVE` | `COMPLETED` | Learner clicks **Mark as Learnt** | `USER (Learner)` | $+45\text{ CR}$ Mentor (`RELEASE`), $5\text{ CR}$ (`BURN`) |
| `ACTIVE` | `DISPUTED` | Learner clicks **Didn't Learn / Report** | `USER (Learner)` | $50\text{ CR}$ frozen pending Admin review |
| `DISPUTED` | `REFUNDED` | Admin upholds learner's dispute claim | `ADMIN` | $+50\text{ CR}$ returned to Learner (`REFUND`) |
| `DISPUTED` | `COMPLETED` | Admin dismisses dispute; rules for mentor | `ADMIN` | $+45\text{ CR}$ Mentor (`RELEASE`), $5\text{ CR}$ (`BURN`) |

---

## 9. Domain Boundary Enforcement & Content Moderation Policies

To uphold academic integrity and shield the platform from legal liability, SkillSwap enforces a mandatory server-side domain filter (`domainFilterMiddleware.js`) on all skill creation and session booking routes.

### 9.1 Permitted & Prohibited Domains

| Domain Category | Classification | Representative Topics & Keywords | HTTP Status & System Action |
| :--- | :--- | :--- | :--- |
| **Technology & Engineering** | ✅ **ALLOWED** | React.js, Node.js, Python, Data Structures, AI/ML, AWS, Docker, Cybersecurity Defense | `200 OK` / `201 CREATED` |
| **Creative Arts & Design** | ✅ **ALLOWED** | UI/UX Design, Figma, Adobe Illustrator, Video Production, Blender 3D Modeling | `200 OK` / `201 CREATED` |
| **Languages & Communication** | ✅ **ALLOWED** | Conversational English, IELTS Prep, Korean, Spanish, French, Technical Writing | `200 OK` / `201 CREATED` |
| **Core Academics** | ✅ **ALLOWED** | Calculus, Linear Algebra, Classical Physics, Probability & Statistics, GRE/SAT Prep | `200 OK` / `201 CREATED` |
| **Academic Fraud** | ❌ **PROHIBITED** | Live exam solving, take-home test completion, thesis ghostwriting, homework cheating | `403 FORBIDDEN_DOMAIN` |
| **Illegal Cyber Activities** | ❌ **PROHIBITED** | Black-hat hacking, DDoS execution, credential phishing, malware/ransomware creation | `403 FORBIDDEN_DOMAIN` |
| **Licensed Professional Advice** | ❌ **PROHIBITED** | Medical diagnosis, prescription advice, certified legal representation, tax auditing | `403 FORBIDDEN_DOMAIN` |
| **Physical Offline Services** | ❌ **PROHIBITED** | Plumbing, electrical wiring, carpentry, home appliance repair, physical courier | `403 FORBIDDEN_DOMAIN` |

### 9.2 Server-Side Enforcement Payload

When a client attempts to register a skill or book a session matching prohibited keywords or categories, the Express middleware immediately aborts execution and returns:

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN_DOMAIN",
    "httpStatus": 403,
    "message": "Session requests or skill listings involving Academic Fraud, Illegal Services, Licensed Medical/Legal Advice, or Physical Labor are strictly prohibited under SkillSwap Policy.",
    "flaggedInput": "Solve my final semester exam live"
  }
}
```

---

## 10. User Roles & End-to-End Operational Workflows

### 10.1 Unified `USER` Role (Dual Learner & Mentor Capability)
Every standard registrant holds the `USER` role, allowing them to seamlessly switch between acting as a **Learner** (spending credits) and a **Mentor** (earning credits).

1. **Onboarding & Profile Mapping:**
   * Registers an account $\rightarrow$ receives **100 CR** immediately.
   * Navigates to **My Profile** $\rightarrow$ adds `React.js (Expert)` and `CSS (Intermediate)` under **Skills I Have**, and adds `Python` and `Machine Learning` under **Skills I Want**.
   * Configures weekly availability time slots.
2. **Discovery & Escrow Booking:**
   * Browses the **Marketplace** or queries **SkillBot AI** for mentor recommendations.
   * Selects a mentor (e.g., *Alex Rivera - 4.9★*), picks an open slot, and clicks **Book Session (50 CR)**.
   * Backend locks $50\text{ CR}$ in Escrow; mentor receives a real-time `session-request` Socket notification.
3. **Live Synchronized Session Execution:**
   * At the scheduled time, both users open the **Active Sessions** tab.
   * Mentor clicks **Start Session** $\rightarrow$ status changes to `ACTIVE`, and the live `59:59` Socket.io timer starts ticking identically on both screens.
   * Users coordinate via the built-in real-time chat and click **Join Meeting** to share screens.
4. **Post-Session Settlement:**
   * When the session concludes, the **Feedback Modal** pops up automatically for the Learner.
   * **Scenario A (Satisfied):** Learner rates 5 stars and clicks **Mark as Learnt** $\rightarrow$ Mentor instantly receives $+45\text{ CR}$, $5\text{ CR}$ is burned.
   * **Scenario B (Unsatisfied / Mentor No-Show):** Learner clicks **Didn't Learn (Dispute)** $\rightarrow$ Escrow freezes; ticket routed to Admin.

### 10.2 `ADMIN` Role (Platform Moderator & Arbitrator)
* Monitors the **Dispute Arbitration Queue**.
* Inspects session room chat logs, timestamps, and connection metadata.
* Executes one-click **Approve Refund** ($+50\text{ CR}$ to Learner) or **Release to Mentor** ($+45\text{ CR}$ to Mentor).
* Moderates reported profiles and bans repeat offenders.

---

## 11. Database Engineering & Mongoose ODM Schemas

SkillSwap utilizes 5 normalized collections in **MongoDB Atlas**. Multi-document ACID transactions (`mongoose.startSession()`) are used during escrow mutations to guarantee zero race conditions.

### Entity-Relationship Overview

```
+------------------------+       1 : 1       +-------------------------------+
|         users          | <---------------> |         user_profiles         |
+------------------------+                   +-------------------------------+
| PK  _id: ObjectId      |                   | PK  _id: ObjectId             |
|     email: String (UQ) |                   | FK  userId: ObjectId          |
|     passwordHash: Str  |                   |     displayName: String       |
|     role: Enum         |                   |     bio: String               |
|     credits: Number    |                   |     skillsHave: Array<Obj>    |
|     streakCount: Num   |                   |     skillsWant: Array<Obj>    |
|     lastLogin: Date    |                   |     availability: Array<Obj>  |
|     isBanned: Boolean  |                   |     rating: Number            |
+------------------------+                   |     totalSessions: Number     |
         |            |                      +-------------------------------+
         | 1          | 1
         |            +-------------------------------------+
         | *                                                | *
+--------v---------------+                   +--------------v----------------+
|        sessions        |       1 : *       |         transactions          |
+------------------------+ <---------------> +-------------------------------+
| PK  _id: ObjectId      |                   | PK  _id: ObjectId             |
| FK  learnerId: ObjId   |                   | FK  userId: ObjectId          |
| FK  mentorId: ObjId    |                   | FK  sessionId: ObjectId       |
|     status: Enum       |                   |     type: Enum                |
|     skillName: String  |                   |     amount: Number            |
|     domain: Enum       |                   |     balanceAfter: Number      |
|     scheduledTime: Date|                   |     description: String       |
|     creditsLocked: Num |                   |     createdAt: Date           |
|     meetingLink: Str   |                   +-------------------------------+
|     feedback: Object   |
+------------------------+
```

### Complete Mongoose Schema Definitions

#### 11.1 `models/User.js`
```javascript
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  passwordHash: {
    type: String,
    required: [true, 'Password hash is required'],
    select: false // Excluded from default queries for confidentiality
  },
  role: {
    type: String,
    enum: ['USER', 'ADMIN'],
    default: 'USER'
  },
  credits: {
    type: Number,
    default: 100,
    min: [0, 'Wallet credits cannot be negative']
  },
  streakCount: {
    type: Number,
    default: 1
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  isBanned: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
```

#### 11.2 `models/UserProfile.js`
```javascript
const mongoose = require('mongoose');

const SkillItemSchema = new mongoose.Schema({
  skill: { type: String, required: true, trim: true },
  domain: {
    type: String,
    enum: ['Technology', 'Creative Arts', 'Languages', 'Academics'],
    required: true
  },
  level: {
    type: String,
    enum: ['BEGINNER', 'INTERMEDIATE', 'EXPERT'],
    default: 'INTERMEDIATE'
  }
});

const UserProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  displayName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 60
  },
  bio: {
    type: String,
    default: 'Passionate peer learner and mentor on SkillSwap.',
    maxlength: 500
  },
  skillsHave: [SkillItemSchema],
  skillsWant: [SkillItemSchema],
  availability: [{
    date: { type: String, required: true }, // Format: YYYY-MM-DD
    slots: [{ type: String, required: true }] // Format: ["14:00-15:00"]
  }],
  rating: {
    type: Number,
    default: 5.0,
    min: 1.0,
    max: 5.0
  },
  totalSessions: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Compound text index for fast Marketplace search
UserProfileSchema.index({ 'skillsHave.skill': 'text', displayName: 'text', bio: 'text' });

module.exports = mongoose.model('UserProfile', UserProfileSchema);
```

#### 11.3 `models/Session.js`
```javascript
const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema({
  learnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  mentorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'ACTIVE', 'COMPLETED', 'DISPUTED', 'CANCELLED', 'REFUNDED'],
    default: 'PENDING',
    index: true
  },
  skillName: {
    type: String,
    required: true,
    trim: true
  },
  domain: {
    type: String,
    enum: ['Technology', 'Creative Arts', 'Languages', 'Academics'],
    required: true
  },
  scheduledTime: {
    type: Date,
    required: true
  },
  startedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  creditsLocked: {
    type: Number,
    default: 50,
    immutable: true
  },
  meetingLink: {
    type: String,
    default: 'https://meet.google.com/new'
  },
  disputeReason: {
    type: String,
    default: ''
  },
  feedback: {
    rating: { type: Number, min: 1, max: 5 },
    comment: { type: String, maxlength: 400 },
    submittedAt: { type: Date }
  }
}, { timestamps: true });

module.exports = mongoose.model('Session', SessionSchema);
```

#### 11.4 `models/Transaction.js`
```javascript
const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    default: null
  },
  type: {
    type: String,
    enum: ['BONUS', 'ESCROW_LOCK', 'RELEASE', 'REFUND', 'BURN'],
    required: true
  },
  amount: {
    type: Number,
    required: true // e.g., +100, -50, +45, -5
  },
  description: {
    type: String,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', TransactionSchema);
```

---

## 12. Complete RESTful API Reference & Payload Contracts

All protected endpoints require the HTTP header: `Authorization: Bearer <JWT_TOKEN>`.

### 12.1 Authentication Endpoints

#### `POST /api/auth/register`
Creates a new user account, initializes their profile, and grants $+100\text{ CR}$ registration bonus.
* **Request Body:**
```json
{
  "displayName": "Zannatuz Zubaida Mim",
  "email": "zannat@ist.edu.bd",
  "password": "StrongPassword123!"
}
```
* **Response (`201 Created`):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "664f1a2b3c4d5e6f7a8b9c01",
    "displayName": "Zannatuz Zubaida Mim",
    "email": "zannat@ist.edu.bd",
    "credits": 100,
    "streakCount": 1
  }
}
```

### 12.2 Session & Escrow Endpoints

#### `POST /api/sessions/book`
Validates domain compliance, locks $50\text{ CR}$ from learner in Escrow, and creates a `PENDING` session.
* **Request Body:**
```json
{
  "mentorId": "664f1a2b3c4d5e6f7a8b9c99",
  "skillName": "React.js State Management",
  "domain": "Technology",
  "scheduledTime": "2026-11-10T14:00:00.000Z"
}
```
* **Response (`201 Created`):**
```json
{
  "success": true,
  "message": "Session booked successfully. 50 Credits locked in Escrow.",
  "session": {
    "_id": "665099aabbccddeeff001122",
    "status": "PENDING",
    "creditsLocked": 50,
    "learnerWalletRemaining": 50
  }
}
```

#### `POST /api/sessions/:id/complete`
Triggered by the Learner clicking **Mark as Learnt**. Executes the atomic 90/10 split.
* **Request Body:**
```json
{
  "rating": 5,
  "comment": "Alex explained React hooks and Redux Toolkit very clearly!"
}
```
* **Response (`200 OK`):**
```json
{
  "success": true,
  "message": "Session completed! 45 Credits released to Mentor, 5 Credits burned.",
  "settlement": {
    "sessionId": "665099aabbccddeeff001122",
    "newStatus": "COMPLETED",
    "mentorCredited": 45,
    "platformBurned": 5
  }
}
```

### 12.3 AI SkillBot Endpoints

#### `POST /api/ai/ask`
Queries Google Gemini AI with context-aware system instructions and matches internal human mentors.
* **Request Body:**
```json
{
  "question": "Why does my React useEffect run twice on mount, and how can I learn advanced React?"
}
```
* **Response (`200 OK`):**
```json
{
  "success": true,
  "answer": "In React 18+, `React.StrictMode` intentionally double-invokes effects in development to help detect side-effect cleanup bugs...\n\n### 4-Week React Mastery Roadmap\n1. **Week 1:** JSX, Props, and Component Lifecycle...",
  "suggestedMentors": [
    {
      "userId": "664f1a2b3c4d5e6f7a8b9c99",
      "displayName": "Alex Rivera",
      "rating": 4.9,
      "totalSessions": 124,
      "matchingSkill": "React.js (Expert)"
    }
  ]
}
```

---

## 13. Real-Time WebSocket (Socket.io) Event Architecture

The Socket.io server maintains authoritative state over active sessions so that neither user can manipulate the session countdown timer by altering their local system clock.

```
   [Learner Browser]                 [Node.js Socket.io Server]                 [Mentor Browser]
           |                                     |                                      |
           |--- emit('join-session-room') ------>|                                      |
           |                                     |<----- emit('join-session-room') -----|
           |                                     |                                      |
           |                                     |<----- emit('start-session-timer') ---|
           |                                     |                                      |
           |<-- on('timer-update', {3599s}) -----|----- on('timer-update', {3599s}) --->|
           |<-- on('timer-update', {3598s}) -----|----- on('timer-update', {3598s}) --->|
           |                                    ...                                     |
           |--- emit('send-message', "Hi!") ---->|                                      |
           |<-- on('new-message', "Hi!") --------|----- on('new-message', "Hi!") ------>|
           |                                    ...                                     |
           |<-- on('session-concluded') ---------|----- on('session-concluded') ------->|
```

### Complete Socket Event Specification

| Event Name | Direction | Payload Schema | Description |
| :--- | :--- | :--- | :--- |
| `register-user-socket` | Client $\rightarrow$ Server | `{ userId: String }` | Maps authenticated `userId` to private notification channel |
| `session-request` | Server $\rightarrow$ Mentor | `{ sessionId, learnerName, skillName }` | Real-time toast alert when a learner books a slot |
| `join-session-room` | Client $\rightarrow$ Server | `{ sessionId: String, userId: String }` | Subscribes client socket to isolated `room:session_<id>` |
| `start-session-timer` | Mentor $\rightarrow$ Server | `{ sessionId: String, duration: 3600 }` | Initializes server-side `setInterval` countdown for the room |
| `timer-update` | Server $\rightarrow$ Room | `{ sessionId, remainingSeconds: Number, formatted: "59:55" }` | Broadcasts authoritative remaining time every $1000\text{ ms}$ |
| `send-message` | Client $\rightarrow$ Server | `{ sessionId, senderId, senderName, text }` | Sends chat message or code snippet inside session workspace |
| `new-message` | Server $\rightarrow$ Room | `{ _id, senderId, senderName, text, timestamp }` | Broadcasts validated chat message to both participants |
| `session-concluded` | Server $\rightarrow$ Room | `{ sessionId, reason: "TIMER_EXPIRED" \| "MANUAL_END" }` | Halts timer and triggers the Feedback / Escrow Release Modal |
| `streak-alert` | Server $\rightarrow$ Client | `{ streakCount: 7, bonusEligible: 20 }` | Notifies user when 7-day learning streak reward is unlocked |

---

## 14. Security Architecture (CIA Triad Implementation)

SkillSwap is engineered around the three core pillars of foundational computer security:

### 14.1 Confidentiality
* **Salted Password Hashing:** Plain-text passwords are never logged or persisted; `bcryptjs` hashes credentials with $2^{10}$ rounds before database insertion.
* **Stateless JWT Verification:** All private routes verify cryptographic signatures (`HS256`) using a 256-bit `JWT_SECRET`.
* **Isolated Socket Rooms:** Private session chats and meeting links are scoped strictly to `room:session_<id>` after verifying that `socket.user.id` matches either `session.learnerId` or `session.mentorId`.

### 14.2 Integrity
* **Atomic Escrow Mutations:** Credit deductions, 90/10 splits, and refunds execute inside MongoDB ACID transactions (`session.withTransaction()`). If any step fails, the entire financial mutation rolls back automatically.
* **Append-Only Audit Trail:** The `transactions` collection does not expose update or delete endpoints, guaranteeing a tamper-proof ledger of every single credit from initial `BONUS` to `BURN`.
* **Server-Authoritative Timers:** Session durations are tracked on the Node.js server rather than client `localStorage` to prevent client-side timer spoofing.

### 14.3 Availability
* **Decoupled Tier Scaling:** Separating the static/SSR Next.js frontend from the stateful Express/Socket.io backend allows independent horizontal scaling.
* **24/7 AI Redundancy:** When human mentors are offline or unavailable during off-peak hours, the integrated **Google Gemini AI SkillBot** guarantees zero-downtime academic assistance.
* **Rate Limiting:** `express-rate-limit` throttles abusive IP addresses on `/api/auth/*` and `/api/ai/ask` to prevent brute-force and token-exhaustion attacks.

---

## 15. Complete Local Installation & Setup Guide

Follow these exact steps to spin up both the **Backend API Server** and the **Frontend Application** on your local machine (Windows, macOS, or Linux).

### 15.1 System Prerequisites
Ensure the following tools are installed on your workstation:
* **Node.js:** `v18.17.0` or higher (`node -v`)
* **npm** or **pnpm:** `v9.x` or higher (`npm -v`)
* **Git:** `v2.30+` (`git --version`)
* **MongoDB:** Either a free **MongoDB Atlas Cloud URI** or **MongoDB Community Server** running locally on port `27017`.

### 15.2 Step 1: Clone the Project Workspace
```bash
git clone https://github.com/your-username/skillswap.git
cd skillswap
```

### 15.3 Step 2: Configure & Launch the Backend (`backend-SkillSwap`)
1. Navigate into the backend directory:
   ```bash
   cd backend-SkillSwap
   ```
2. Install all Node.js dependencies:
   ```bash
   npm install
   ```
3. Create your `.env` configuration file from the template:
   ```bash
   cp .env.example .env
   ```
4. Open `.env` in VS Code and fill in your `MONGODB_URI`, `JWT_SECRET`, and `GEMINI_API_KEY` (see detailed guides in Sections 16, 17, and 18).
5. (Optional) Seed the database with sample mentors (Alex Rivera, Sarah Chen, David Kim) and test accounts:
   ```bash
   npm run seed
   ```
6. Start the Express + Socket.io development server with `nodemon`:
   ```bash
   npm run dev
   ```
   *Expected Terminal Output:*
   ```text
   [SkillSwap Server] 🚀 Express REST API listening on http://localhost:5000
   [Socket.io Engine] ⚡ WebSocket Server initialized and awaiting room connections
   [MongoDB Atlas]    ✅ Connected successfully to cluster0.mongodb.net/skillswap
   ```

### 15.4 Step 3: Configure & Launch the Frontend (`frontend-SkillSwap`)
1. Open a **second terminal window** and navigate to the frontend directory:
   ```bash
   cd frontend-SkillSwap
   ```
2. Install all Next.js and UI dependencies:
   ```bash
   npm install
   ```
3. Create the local environment file:
   ```bash
   cp .env.local.example .env.local
   ```
4. Start the Next.js development server:
   ```bash
   npm run dev
   ```
   *Expected Terminal Output:*
   ```text
   ▲ Next.js 14.2.x
   - Local:        http://localhost:3000
   - Environments: .env.local
   ✓ Ready in 1.8s
   ```
5. Open your browser and visit **`http://localhost:3000`**.

---

## 16. MongoDB Atlas Cloud Provisioning & Indexing Guide

To set up a free, production-ready cloud database for SkillSwap:

1. **Create an Atlas Cluster:**
   * Sign in at [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas).
   * Click **Build a Database** $\rightarrow$ select **M0 Free Shared Cluster** $\rightarrow$ select **AWS** and the region closest to you (e.g., `ap-southeast-1` Singapore or `ap-south-1` Mumbai).
   * Name your cluster `SkillSwapCluster` and click **Create Deployment**.
2. **Create Database Credentials:**
   * Navigate to **Security > Database Access** $\rightarrow$ click **Add New Database User**.
   * Authentication Method: **Password**.
   * Set Username: `skillswap_admin` and generate a strong alphanumeric password (avoid special URL characters like `@`, `:`, `/` or URL-encode them).
   * Database User Privileges: Select **Read and write to any database**.
3. **Whitelist Network IP:**
   * Navigate to **Security > Network Access** $\rightarrow$ click **Add IP Address**.
   * Click **Allow Access from Anywhere** (`0.0.0.0/0`) so your local machine and deployment servers can connect without IP blocks, then click **Confirm**.
4. **Extract Connection URI:**
   * Navigate to **Deployment > Database** $\rightarrow$ click **Connect** on `SkillSwapCluster`.
   * Select **Drivers** (Node.js `v5.5 or later`).
   * Copy the connection string and replace `<username>` and `<password>`:
     ```text
     mongodb+srv://skillswap_admin:YourPassword123@skillswapcluster.xxxxx.mongodb.net/skillswap?retryWrites=true&w=majority
     ```

---

## 17. Google Gemini AI Studio Configuration Guide

SkillSwap uses the official Google Gemini API to power the 24/7 **SkillBot AI**.

1. Go to **Google AI Studio**: [https://aistudio.google.com/](https://aistudio.google.com/) and sign in with your Google account.
2. Click **Get API Key** in the left navigation sidebar.
3. Click **Create API key in new project**.
4. Copy the generated key (starts with `AIzaSy...`).
5. Paste the key into `backend-SkillSwap/.env` as `GEMINI_API_KEY=AIzaSy...`.

---

## 18. Exhaustive Environment Variables Reference (`.env`)

### 18.1 Backend Configuration (`backend-SkillSwap/.env`)

```ini
# ============================================================================
# 1. SERVER & RUNTIME CONFIGURATION
# ============================================================================
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000

# ============================================================================
# 2. MONGODB ATLAS DATABASE CONFIGURATION
# ============================================================================
MONGODB_URI=mongodb+srv://skillswap_admin:YourPassword123@skillswapcluster.xxxxx.mongodb.net/skillswap?retryWrites=true&w=majority

# ============================================================================
# 3. JWT & CRYPTOGRAPHY CONFIGURATION
# ============================================================================
# Generate via terminal: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=8f9d2a7b4c6e1f0a3b5d8c9e2f4a6b8d0c1e3f5a7b9d2e4f6a8b0c2e4f6a8b0c
JWT_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=10

# ============================================================================
# 4. VIRTUAL CREDIT & ESCROW ECONOMIC PARAMETERS
# ============================================================================
ONBOARDING_BONUS_CREDITS=100
STANDARD_SESSION_COST_CREDITS=50
MENTOR_RELEASE_CREDITS=45
PLATFORM_BURN_CREDITS=5
STREAK_MILESTONE_DAYS=7
STREAK_BONUS_CREDITS=20
SESSION_DURATION_SECONDS=3600

# ============================================================================
# 5. GOOGLE GEMINI AI SDK CONFIGURATION
# ============================================================================
GEMINI_API_KEY=AIzaSyD-ReplaceWithYourActualGoogleAIStudioKey
GEMINI_MODEL_NAME=gemini-2.5-flash
```

### 18.2 Frontend Configuration (`frontend-SkillSwap/.env.local`)

```ini
# ============================================================================
# NEXT.JS PUBLIC ENVIRONMENT VARIABLES
# ============================================================================
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_SERVER_URL=http://localhost:5000
NEXT_PUBLIC_APP_NAME=SkillSwap
NEXT_PUBLIC_DEFAULT_SESSION_COST=50
```

---

## 19. System Testing, Unit Test Suites & QA Benchmarks

SkillSwap includes automated unit and integration test suites using **Jest** and **Supertest** to validate the Escrow Wallet engine and Domain Restriction filters.

### Running Automated Tests
```bash
cd backend-SkillSwap
npm test
```

### Key Unit Test Cases (`tests/escrow.test.js`)

| Test ID | Test Case Description | Input / Pre-Condition | Expected Output & Assertion | Status |
| :--- | :--- | :--- | :--- | :--- |
| **UT-01** | Onboarding Credit Provisioning | New user registers via `/api/auth/register` | `user.credits === 100` & `BONUS` ledger entry created | ✅ PASS |
| **UT-02** | Escrow Lock on Slot Booking | Learner with $100\text{ CR}$ books a $50\text{ CR}$ session | Learner `credits === 50`, Session `creditsLocked === 50`, status `PENDING` | ✅ PASS |
| **UT-03** | Insufficient Balance Rejection | Learner with $20\text{ CR}$ attempts to book a $50\text{ CR}$ session | Returns `400 INSUFFICIENT_CREDITS`; no session created | ✅ PASS |
| **UT-04** | Atomic 90/10 Split on Completion | Learner triggers `/api/sessions/:id/complete` | Mentor `credits += 45`, Burn `5 CR` logged, status `COMPLETED` | ✅ PASS |
| **UT-05** | Unauthorized State Mutation | Learner attempts to call `/api/sessions/:id/start` | Returns `403 FORBIDDEN_ROLE` (Mentor only action) | ✅ PASS |
| **UT-06** | Prohibited Domain Rejection | User attempts to book `"Solve my exam paper"` | Returns `403 FORBIDDEN_DOMAIN`; transaction aborted | ✅ PASS |
| **UT-07** | Dispute Freeze & Admin Refund | Admin approves learner dispute | Learner `credits += 50`, Mentor `credits += 0`, status `REFUNDED` | ✅ PASS |

---

## 20. Troubleshooting & Standard Error Code Dictionary

| HTTP Code | Internal Error Code | Cause | Resolution |
| :--- | :--- | :--- | :--- |
| `400` | `INSUFFICIENT_CREDITS` | Learner has fewer than $50\text{ CR}$ available in wallet | Teach a session as a Mentor or claim a 7-day streak bonus to earn credits. |
| `400` | `INVALID_STATE_TRANSITION` | Attempting to complete a session that is still `PENDING` | Ensure the Mentor has clicked **Start Session** (`ACTIVE`) first. |
| `401` | `TOKEN_EXPIRED_OR_MISSING` | Missing or expired JWT Bearer token | Log out and log back in to obtain a fresh 7-day JWT. |
| `403` | `FORBIDDEN_DOMAIN` | Skill or booking contains prohibited academic fraud/illegal terms | Restrict topics to Technology, Creative Arts, Languages, or core Academics. |
| `403` | `ACCOUNT_BANNED` | User has `isBanned: true` set by an Administrator | Contact platform administrator for moderation review. |
| `503` | `AI_SERVICE_UNAVAILABLE` | Invalid `GEMINI_API_KEY` or quota exceeded | Verify your Google AI Studio API key in `backend-SkillSwap/.env`. |

---

## 21. Product Roadmap & Future Engineering Phases

### Phase 1: MVP Execution (Current Version `v1.0.0` — Completed ✅)
* [x] Decoupled Next.js Frontend and Express.js REST API Architecture.
* [x] JWT Authentication & Role-Based Access Control (`USER`, `ADMIN`).
* [x] Bidirectional Profile Skill Mapping (`Skills I Have` & `Skills I Want`).
* [x] Atomic Virtual Credit Escrow Wallet ($100\text{ CR}$ bonus, $50\text{ CR}$ lock, $45/5$ split/burn).
* [x] Real-Time Socket.io Session Countdown Timer (`59:55`) and Workspace Chat.
* [x] 24/7 Google Gemini AI `SkillBot` Integration with Mentor Recommendations.
* [x] 7-Day Learning Streak Gamification & Global Leaderboards.
* [x] Server-Side `403 FORBIDDEN_DOMAIN` Academic Integrity Filters.

### Phase 2: Native Media & Collaboration Expansion (Planned 🚀)
* [ ] **Native In-Browser WebRTC Video/Audio Calling:** Peer-to-peer video streaming and screen sharing directly inside the Active Session workspace without external Meet/Zoom links.
* [ ] **Live Collaborative Code Editor:** Integrated Monaco Editor synced via CRDTs/WebSockets for real-time pair programming.
* [ ] **Cross-Platform Mobile App:** React Native (iOS & Android) client consuming the existing Express API and Socket.io server.

### Phase 3: Advanced AI & Ecosystem Scaling (Future Vision 🌐)
* [ ] **Adaptive Multi-Week AI Roadmaps:** Dynamic study plans that automatically adjust based on post-session mentor feedback.
* [ ] **Automated Session Transcripts & Summaries:** AI-generated revision notes after every completed 1-on-1 mentorship session.

---

## 22. Academic Authority, Contributors & License

This project report and software engineering implementation were carried out in partial fulfillment of the requirements for the degree of **Bachelor of Science in Computer Science and Engineering (B.Sc. in CSE)** at the **Institute of Science and Technology (IST)**, affiliated with the **National University of Bangladesh**.

### Project Authors
* **Zannatuz Zubaida Mim**  
  *Registration No:* `20502004793` | *Session:* `2020–2021`  
  *Department of Computer Science and Engineering (CSE), IST*
* **Ahmmed Fahim Bin Hossain**  
  *Registration No:* `20502004817` | *Session:* `2020–2021`  
  *Department of Computer Science and Engineering (CSE), IST*

### License
Distributed under the **MIT License**. Free for academic, educational, and open-source use.