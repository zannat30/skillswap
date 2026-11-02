const request = require('supertest');
const { app } = require('../server');
const { resetMemoryStore } = require('../src/config/memoryStore');

describe('SkillSwap 403 FORBIDDEN_DOMAIN Boundary Filter Suite (UT-06)', () => {
  beforeEach(() => {
    resetMemoryStore();
  });

  test('UT-06: Prohibited Academic Fraud Booking Rejection ("Solve my final semester exam live")', async () => {
    const res = await request(app)
      .post('/api/sessions/book')
      .send({
        mentorId: '664f1a2b3c4d5e6f7a8b9c99',
        skillName: 'Solve my final semester exam live',
        domain: 'Technology'
      });

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN_DOMAIN');
    expect(res.body.error.flaggedInput).toBe('Solve my final semester exam live');
  });

  test('Rejects Illegal Cyber Activities in Profile Skills ("Black-hat DDoS execution")', async () => {
    const res = await request(app)
      .post('/api/profile/skills-have')
      .send({
        skill: 'Black-hat DDoS execution',
        domain: 'Technology',
        level: 'EXPERT'
      });

    expect(res.statusCode).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN_DOMAIN');
  });

  test('Rejects Physical Offline Services ("Plumbing and electrical wiring")', async () => {
    const res = await request(app)
      .post('/api/profile/skills-have')
      .send({
        skill: 'Plumbing and electrical wiring',
        domain: 'Physical Offline Services'
      });

    expect(res.statusCode).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN_DOMAIN');
  });

  test('Allows Permitted Domains (Technology, Creative Arts, Languages, Academics)', async () => {
    const res = await request(app)
      .post('/api/profile/skills-have')
      .send({
        skill: 'Next.js App Router',
        domain: 'Technology',
        level: 'EXPERT'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
  });
});
