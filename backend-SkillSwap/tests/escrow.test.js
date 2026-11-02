const request = require('supertest');
const { app } = require('../server');
const { resetMemoryStore, getStore } = require('../src/config/memoryStore');

describe('SkillSwap Virtual Credit Escrow & Lifecycle Suite (UT-01 to UT-07)', () => {
  beforeEach(() => {
    resetMemoryStore();
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
    const reg = await request(app)
      .post('/api/auth/register')
      .send({
        displayName: 'Booking Learner',
        email: 'learner.ut02@ist.edu.bd',
        password: 'StrongPassword123!'
      });

    const token = reg.body.token;
    const mentorId = '664f1a2b3c4d5e6f7a8b9c99'; // Alex Rivera

    const bookRes = await request(app)
      .post('/api/sessions/book')
      .set('Authorization', `Bearer ${token}`)
      .send({
        mentorId,
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
    const reg = await request(app)
      .post('/api/auth/register')
      .send({
        displayName: 'Low Balance Learner',
        email: 'learner.ut03@ist.edu.bd',
        password: 'StrongPassword123!'
      });

    const store = getStore();
    const user = store.users.find((u) => String(u._id) === String(reg.body.user._id));
    user.credits = 20;

    const bookRes = await request(app)
      .post('/api/sessions/book')
      .set('Authorization', `Bearer ${reg.body.token}`)
      .send({
        mentorId: '664f1a2b3c4d5e6f7a8b9c99',
        skillName: 'Node.js Microservices',
        domain: 'Technology'
      });

    expect(bookRes.statusCode).toBe(400);
    expect(bookRes.body.error.code).toBe('INSUFFICIENT_CREDITS');
  });

  test('UT-04: Atomic 90/10 Split on Completion (+45 CR Mentor, 5 CR Burned, COMPLETED)', async () => {
    const store = getStore();
    const mentorBefore = store.users.find((u) => u._id === '664f1a2b3c4d5e6f7a8b9c99').credits;

    // Login as Zannat (Learner on seeded ACTIVE session 665099aabbccddeeff001122)
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'zannat@ist.edu.bd', password: 'StrongPassword123!' });

    const completeRes = await request(app)
      .post('/api/sessions/665099aabbccddeeff001122/complete')
      .set('Authorization', `Bearer ${loginRes.body.token}`)
      .send({
        rating: 5,
        comment: 'Alex explained React hooks and Redux Toolkit very clearly!'
      });

    expect(completeRes.statusCode).toBe(200);
    expect(completeRes.body.settlement.newStatus).toBe('COMPLETED');
    expect(completeRes.body.settlement.mentorCredited).toBe(45);
    expect(completeRes.body.settlement.platformBurned).toBe(5);

    const mentorAfter = store.users.find((u) => u._id === '664f1a2b3c4d5e6f7a8b9c99').credits;
    expect(mentorAfter).toBe(mentorBefore + 45);
  });

  test('UT-05: Unauthorized State Mutation (Learner attempting /start returns 403 FORBIDDEN_ROLE)', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'zannat@ist.edu.bd', password: 'StrongPassword123!' });

    const bookRes = await request(app)
      .post('/api/sessions/book')
      .set('Authorization', `Bearer ${loginRes.body.token}`)
      .send({
        mentorId: '664f1a2b3c4d5e6f7a8b9c99',
        skillName: 'React.js Architecture',
        domain: 'Technology'
      });

    const sessionId = bookRes.body.session._id;

    // Learner tries to call /start (Mentor-only endpoint)
    const startRes = await request(app)
      .post(`/api/sessions/${sessionId}/start`)
      .set('Authorization', `Bearer ${loginRes.body.token}`);

    expect(startRes.statusCode).toBe(403);
    expect(startRes.body.error.code).toBe('FORBIDDEN_ROLE');
  });

  test('UT-07: Dispute Freeze & Admin Refund (+50 CR Learner, +0 CR Mentor, status REFUNDED)', async () => {
    const learnerLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'zannat@ist.edu.bd', password: 'StrongPassword123!' });

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@skillswap.io', password: 'StrongPassword123!' });

    const store = getStore();
    const learnerBefore = store.users.find((u) => u._id === '664f1a2b3c4d5e6f7a8b9c01').credits;

    // Learner raises dispute on ACTIVE session
    const disputeRes = await request(app)
      .post('/api/sessions/665099aabbccddeeff001122/dispute')
      .set('Authorization', `Bearer ${learnerLogin.body.token}`)
      .send({ reason: 'Mentor did not show up to the meeting room.' });

    expect(disputeRes.statusCode).toBe(200);
    expect(disputeRes.body.session.status).toBe('DISPUTED');

    // Admin approves refund
    const refundRes = await request(app)
      .post('/api/admin/disputes/665099aabbccddeeff001122/refund')
      .set('Authorization', `Bearer ${adminLogin.body.token}`);

    expect(refundRes.statusCode).toBe(200);
    expect(refundRes.body.settlement.newStatus).toBe('REFUNDED');
    expect(refundRes.body.settlement.learnerRefunded).toBe(50);

    const learnerAfter = store.users.find((u) => u._id === '664f1a2b3c4d5e6f7a8b9c01').credits;
    expect(learnerAfter).toBe(learnerBefore + 50);
  });
});
