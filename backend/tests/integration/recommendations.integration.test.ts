import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { withTestTransaction } from '../helpers/with-transaction';
import { createTestUser, createTestBeer, createTestCriterion, createTestQuizWithQuestions } from '../helpers/factories';
import prisma from '../../src/lib/prisma';
import { userToken, adminToken } from '../helpers/auth-helpers';

beforeAll(() => {
  process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-jwt-secret';
  process.env.JWT_ACCESS_EXPIRY = '1h';
});

describe('Recommendations Integration', () => {
  it('full flow: quiz → complete → refresh → get recommendations', async () => {
    await withTestTransaction(async () => {
      const user = await createTestUser();
      const token = userToken(user.id);
      const c1 = await createTestCriterion();
      const c2 = await createTestCriterion();

      // Beer1 : scores élevés → meilleur match
      const beer1 = await createTestBeer({ name: 'RecoBeer1' });
      await prisma.beerCriteria.create({ data: { id_beer: beer1.id, id_criterion: c1.id, score: 5 } });
      await prisma.beerCriteria.create({ data: { id_beer: beer1.id, id_criterion: c2.id, score: 3 } });

      // Beer2 : scores bas → moins bon match
      const beer2 = await createTestBeer({ name: 'RecoBeer2' });
      await prisma.beerCriteria.create({ data: { id_beer: beer2.id, id_criterion: c1.id, score: 1 } });
      await prisma.beerCriteria.create({ data: { id_beer: beer2.id, id_criterion: c2.id, score: 1 } });

      const { quiz, questions } = await createTestQuizWithQuestions([c1.id, c2.id]);

      // Step 1: Start session
      const startRes = await request(app)
        .post('/api/quizz-sessions')
        .set('Authorization', `Bearer ${token}`)
        .send({ id_user: user.id, id_quizz: quiz.id });

      expect(startRes.status).toBe(201);
      expect(startRes.body.success).toBe(true);
      const sessionId = startRes.body.data.session.id;

      // Step 2: Answer questions (c1→note=4, c2→note=2)
      const answer1Res = await request(app)
        .post(`/api/quizz-sessions/${sessionId}/answers`)
        .set('Authorization', `Bearer ${token}`)
        .send({ id_question_choice: questions[0].choices[3].id });
      expect(answer1Res.status).toBe(200);
      expect(answer1Res.body.data.answered_count).toBe(1);

      const answer2Res = await request(app)
        .post(`/api/quizz-sessions/${sessionId}/answers`)
        .set('Authorization', `Bearer ${token}`)
        .send({ id_question_choice: questions[1].choices[1].id });
      expect(answer2Res.status).toBe(200);
      expect(answer2Res.body.data.answered_count).toBe(2);

      // Step 3: Complete session
      const completeRes = await request(app)
        .put(`/api/quizz-sessions/${sessionId}/complete`)
        .set('Authorization', `Bearer ${token}`);
      expect(completeRes.status).toBe(200);
      expect(completeRes.body.data.session.status).toBe('COMPLETED');

      // Step 4: Refresh recommendations
      const refreshRes = await request(app)
        .post(`/api/recommendations/refresh/${user.id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(refreshRes.status).toBe(200);
      expect(refreshRes.body.success).toBe(true);
      expect(refreshRes.body.data.length).toBeGreaterThan(0);

      // Step 5: Get recommendations
      const getRes = await request(app)
        .get(`/api/recommendations/user/${user.id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(getRes.status).toBe(200);
      expect(getRes.body.data.length).toBeGreaterThan(0);

      // Beer1 should score higher than Beer2
      const beer1Rec = getRes.body.data.find((r: any) => r.id_beer === beer1.id);
      const beer2Rec = getRes.body.data.find((r: any) => r.id_beer === beer2.id);
      expect(beer1Rec).toBeDefined();
      expect(beer2Rec).toBeDefined();
      expect(Number(beer1Rec.score_compatibility)).toBeGreaterThan(Number(beer2Rec.score_compatibility));
    });
  });

  it('POST /api/recommendations/refresh/999999 returns 404', async () => {
    await withTestTransaction(async () => {
      const res = await request(app)
        .post('/api/recommendations/refresh/999999')
        .set('Authorization', `Bearer ${adminToken()}`);
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('USER_NOT_FOUND');
    });
  });

  it('GET /api/recommendations for user without criteria returns empty', async () => {
    await withTestTransaction(async () => {
      const user = await createTestUser();

      const res = await request(app)
        .get(`/api/recommendations/user/${user.id}`)
        .set('Authorization', `Bearer ${userToken(user.id)}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });
  });

  it('response follows ApiResponse format', async () => {
    await withTestTransaction(async () => {
      const user = await createTestUser();

      const res = await request(app)
        .get(`/api/recommendations/user/${user.id}`)
        .set('Authorization', `Bearer ${userToken(user.id)}`);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
    });
  });
});
