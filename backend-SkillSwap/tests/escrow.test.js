const request = require('supertest');
const { app } = require('../server');
const { resetMemoryStore, getStore } = require('../src/config/memoryStore');
const { sweepExpiredPendingSessions } = require('../src/controllers/sessionController');
const { verifySessionMember } = require('../src/sockets/sessionSocket');

const registerTestUser = async (displayName, email, password = 'StrongPassword123!') => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ displayName, email, password });
  return res.body; // { success, token, user }
};

describe('SkillSwap Virtual Credit Escrow & Lifecycle Suite (UT-01 to UT-10)', () => {
  beforeEach(() => {
    resetMemoryStore();
  });

  test('UT-00: Initial State Only Has Super Admin (admin@admin.com / 12345678) & Blocks Unauthenticated Access', async () => {
    const store = getStore();
    expect(store.users.length).toBe(1);
    expect(store.users[0].email).toBe('admin@admin.com');
    expect(store.users[0].role).toBe('ADMIN');

    const unauthRes = await request(app).get('/api/marketplace');
    expect(unauthRes.statusCode).toBe(401);

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@admin.com', password: '12345678' });
    expect(adminLogin.statusCode).toBe(200);
    expect(adminLogin.body.user.role).toBe('ADMIN');
  });

  test('UT-01: Onboarding Credit Provisioning (+100 CR & BONUS Ledger Entry)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        displayName: 'Test Learner',
        email: 'learner.ut01@ist.edu.bd',
        password: 'StrongPassword123!'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user.credits).toBe(100);

    const store = getStore();
    const bonusTx = store.transactions.find(
      (t) => String(t.userId) === String(res.body.user._id) && t.type === 'BONUS'
    );
    expect(bonusTx).toBeDefined();
    expect(bonusTx.amount).toBe(100);
  });

  test('UT-02: Escrow Lock on Slot Booking (100 CR -> 50 CR Available, 50 CR Locked, PENDING)', async () => {
    const mentor = await registerTestUser('Mentor One', 'mentor1@ist.edu.bd');
    const learner = await registerTestUser('Booking Learner', 'learner.ut02@ist.edu.bd');

    const bookRes = await request(app)
      .post('/api/sessions/book')
      .set('Authorization', `Bearer ${learner.token}`)
      .send({
        mentorId: mentor.user._id,
        skillName: 'React.js State Management',
        domain: 'Technology',
        scheduledTime: '2026-11-10T14:00:00.000Z'
      });

    expect(bookRes.statusCode).toBe(201);
    expect(bookRes.body.success).toBe(true);
    expect(bookRes.body.session.status).toBe('PENDING');
    expect(bookRes.body.session.creditsLocked).toBe(50);
    expect(bookRes.body.session.learnerWalletRemaining).toBe(50);
  });

  test('UT-03: Insufficient Balance Rejection (< 50 CR returns 400 INSUFFICIENT_CREDITS)', async () => {
    const mentor = await registerTestUser('Mentor Two', 'mentor2@ist.edu.bd');
    const learner = await registerTestUser('Low Balance Learner', 'learner.ut03@ist.edu.bd');

    const store = getStore();
    const user = store.users.find((u) => String(u._id) === String(learner.user._id));
    user.credits = 20;

    const bookRes = await request(app)
      .post('/api/sessions/book')
      .set('Authorization', `Bearer ${learner.token}`)
      .send({
        mentorId: mentor.user._id,
        skillName: 'Node.js Microservices',
        domain: 'Technology'
      });

    expect(bookRes.statusCode).toBe(400);
    expect(bookRes.body.error.code).toBe('INSUFFICIENT_CREDITS');
  });

  test('UT-04: Atomic 90/10 Split on Completion (+45 CR Mentor, 5 CR Burned, COMPLETED)', async () => {
    const mentor = await registerTestUser('Mentor Four', 'mentor4@ist.edu.bd');
    const learner = await registerTestUser('Learner Four', 'learner4@ist.edu.bd');

    const bookRes = await request(app)
      .post('/api/sessions/book')
      .set('Authorization', `Bearer ${learner.token}`)
      .send({
        mentorId: mentor.user._id,
        skillName: 'React.js Hooks',
        domain: 'Technology'
      });

    const sessionId = bookRes.body.session._id;

    // Mentor starts session
    const startRes = await request(app)
      .post(`/api/sessions/${sessionId}/start`)
      .set('Authorization', `Bearer ${mentor.token}`);
    expect(startRes.statusCode).toBe(200);

    const store = getStore();
    const mentorBefore = store.users.find((u) => String(u._id) === String(mentor.user._id)).credits;

    // Learner marks as learnt
    const completeRes = await request(app)
      .post(`/api/sessions/${sessionId}/complete`)
      .set('Authorization', `Bearer ${learner.token}`)
      .send({
        rating: 5,
        comment: 'Clear explanation!'
      });

    expect(completeRes.statusCode).toBe(200);
    expect(completeRes.body.settlement.newStatus).toBe('COMPLETED');
    expect(completeRes.body.settlement.mentorCredited).toBe(45);
    expect(completeRes.body.settlement.platformBurned).toBe(5);

    const mentorAfter = store.users.find((u) => String(u._id) === String(mentor.user._id)).credits;
    expect(mentorAfter).toBe(mentorBefore + 45);
  });

  test('UT-05: Unauthorized State Mutation (Learner attempting /start returns 403 FORBIDDEN_ROLE)', async () => {
    const mentor = await registerTestUser('Mentor Five', 'mentor5@ist.edu.bd');
    const learner = await registerTestUser('Learner Five', 'learner5@ist.edu.bd');

    const bookRes = await request(app)
      .post('/api/sessions/book')
      .set('Authorization', `Bearer ${learner.token}`)
      .send({
        mentorId: mentor.user._id,
        skillName: 'React.js Architecture',
        domain: 'Technology'
      });

    const sessionId = bookRes.body.session._id;

    // Learner tries to call /start (Mentor-only endpoint)
    const startRes = await request(app)
      .post(`/api/sessions/${sessionId}/start`)
      .set('Authorization', `Bearer ${learner.token}`);

    expect(startRes.statusCode).toBe(403);
    expect(startRes.body.error.code).toBe('FORBIDDEN_ROLE');
  });

  test('UT-07: Dispute Freeze & Admin Refund (+50 CR Learner, +0 CR Mentor, status REFUNDED)', async () => {
    const mentor = await registerTestUser('Mentor Seven', 'mentor7@ist.edu.bd');
    const learner = await registerTestUser('Learner Seven', 'learner7@ist.edu.bd');

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@admin.com', password: '12345678' });

    const bookRes = await request(app)
      .post('/api/sessions/book')
      .set('Authorization', `Bearer ${learner.token}`)
      .send({
        mentorId: mentor.user._id,
        skillName: 'System Design',
        domain: 'Technology'
      });

    const sessionId = bookRes.body.session._id;

    await request(app)
      .post(`/api/sessions/${sessionId}/start`)
      .set('Authorization', `Bearer ${mentor.token}`);

    const store = getStore();
    const learnerBefore = store.users.find((u) => String(u._id) === String(learner.user._id)).credits;

    // Learner raises dispute on ACTIVE session
    const disputeRes = await request(app)
      .post(`/api/sessions/${sessionId}/dispute`)
      .set('Authorization', `Bearer ${learner.token}`)
      .send({ reason: 'Mentor did not show up to the meeting room.' });

    expect(disputeRes.statusCode).toBe(200);
    expect(disputeRes.body.session.status).toBe('DISPUTED');

    // Admin approves refund
    const refundRes = await request(app)
      .post(`/api/admin/disputes/${sessionId}/refund`)
      .set('Authorization', `Bearer ${adminLogin.body.token}`);

    expect(refundRes.statusCode).toBe(200);
    expect(refundRes.body.settlement.newStatus).toBe('REFUNDED');
    expect(refundRes.body.settlement.learnerRefunded).toBe(50);

    const learnerAfter = store.users.find((u) => String(u._id) === String(learner.user._id)).credits;
    expect(learnerAfter).toBe(learnerBefore + 50);
  });

  test('UT-08: 24-Hour Pending Session Auto-Cancel & Escrow Refund (Gap 2)', async () => {
    const mentor = await registerTestUser('Mentor Eight', 'mentor8@ist.edu.bd');
    const learner = await registerTestUser('Learner Eight', 'learner8@ist.edu.bd');

    const bookRes = await request(app)
      .post('/api/sessions/book')
      .set('Authorization', `Bearer ${learner.token}`)
      .send({
        mentorId: mentor.user._id,
        skillName: 'React.js State Management',
        domain: 'Technology'
      });

    expect(bookRes.statusCode).toBe(201);
    const sessionId = bookRes.body.session._id;

    const store = getStore();
    const bookedSession = store.sessions.find((s) => String(s._id) === String(sessionId));
    const learnerBeforeSweep = store.users.find((u) => String(u._id) === String(learner.user._id)).credits;

    // Backdate createdAt to 25 hours ago
    bookedSession.createdAt = new Date(Date.now() - 25 * 60 * 60 * 1000);

    const sweptCount = await sweepExpiredPendingSessions();
    expect(sweptCount).toBe(1);
    expect(bookedSession.status).toBe('CANCELLED');
    expect(bookedSession.creditsLocked).toBe(0);

    const learnerAfterSweep = store.users.find((u) => String(u._id) === String(learner.user._id)).credits;
    expect(learnerAfterSweep).toBe(learnerBeforeSweep + 50);
  });

  test('UT-09: Socket Room Participant Verification (Gap 3: Learner/Mentor Allowed, Outsider Blocked)', async () => {
    const mentor = await registerTestUser('Mentor Nine', 'mentor9@ist.edu.bd');
    const learner = await registerTestUser('Learner Nine', 'learner9@ist.edu.bd');
    const outsider = await registerTestUser('Outsider Nine', 'outsider9@ist.edu.bd');

    const bookRes = await request(app)
      .post('/api/sessions/book')
      .set('Authorization', `Bearer ${learner.token}`)
      .send({
        mentorId: mentor.user._id,
        skillName: 'TypeScript Generics',
        domain: 'Technology'
      });

    const sessionId = bookRes.body.session._id;

    // Learner -> allowed
    const learnerCheck = await verifySessionMember(sessionId, learner.user._id, 'USER');
    expect(learnerCheck.allowed).toBe(true);

    // Mentor -> allowed
    const mentorCheck = await verifySessionMember(sessionId, mentor.user._id, 'USER');
    expect(mentorCheck.allowed).toBe(true);

    // Unrelated user -> blocked
    const outsiderCheck = await verifySessionMember(sessionId, outsider.user._id, 'USER');
    expect(outsiderCheck.allowed).toBe(false);

    // Admin -> allowed
    const adminCheck = await verifySessionMember(sessionId, '664f1a2b3c4d5e6f7a8b9c00', 'ADMIN');
    expect(adminCheck.allowed).toBe(true);
  });

  test('UT-10: Admin User Removal (DELETE /api/admin/users/:userId removes user & profile and protects Admin)', async () => {
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@admin.com', password: '12345678' });

    const created = await registerTestUser('Removable User', 'remove.me@ist.edu.bd');
    const targetId = created.user._id;

    const delRes = await request(app)
      .delete(`/api/admin/users/${targetId}`)
      .set('Authorization', `Bearer ${adminLogin.body.token}`);

    expect(delRes.statusCode).toBe(200);
    expect(delRes.body.success).toBe(true);
    expect(delRes.body.removedUser._id).toBe(targetId);

    const store = getStore();
    const stillExists = store.users.find((u) => String(u._id) === targetId);
    expect(stillExists).toBe(undefined);

    // Admin cannot delete themselves
    const selfDelRes = await request(app)
      .delete(`/api/admin/users/${adminLogin.body.user._id}`)
      .set('Authorization', `Bearer ${adminLogin.body.token}`);

    expect(selfDelRes.statusCode).toBe(403);
    expect(selfDelRes.body.error.code).toBe('FORBIDDEN_OPERATION');
  });
});
