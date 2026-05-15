import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { withTestTransaction } from '../helpers/with-transaction';
import { createTestCriterion, createTestQuizWithQuestions } from '../helpers/factories';
import { adminToken, userToken } from '../helpers/auth-helpers';

beforeAll(() => {
  process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-jwt-secret';
  process.env.JWT_ACCESS_EXPIRY = '1h';
});

const USER_ID = 1;

describe('Quiz Integration', () => {
  it('GET /api/quizzes returns list', async () => {
    await withTestTransaction(async () => {
      const criterion = await createTestCriterion();
      await createTestQuizWithQuestions([criterion.id], { name: 'IntegGetQuiz' });

      const res = await request(app)
        .get('/api/quizzes')
        .set('Authorization', `Bearer ${userToken(USER_ID)}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.some((q: any) => q.name === 'IntegGetQuiz')).toBe(true);
    });
  });

  it('GET /api/quizzes — 401 without token', async () => {
    await withTestTransaction(async () => {
      const res = await request(app).get('/api/quizzes');
      expect(res.status).toBe(401);
    });
  });

  it('POST /api/quizzes creates a quiz with nested questions (ADMIN only)', async () => {
    await withTestTransaction(async () => {
      const crit1 = await createTestCriterion({ name: 'TestCrit1' });
      const crit2 = await createTestCriterion({ name: 'TestCrit2' });

      const res = await request(app)
        .post('/api/quizzes')
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({
          name: 'IntegNewQuiz',
          description: 'A new integration test quiz',
          questions: [
            {
              id_criterion: crit1.id,
              question: 'Question 1',
              choices: [
                { choice: 'Choice 1', note_value: 1 },
                { choice: 'Choice 2', note_value: 2 },
                { choice: 'Choice 3', note_value: 3 },
              ],
            },
            {
              id_criterion: crit2.id,
              question: 'Question 2',
              choices: [
                { choice: 'Choice 1', note_value: 1 },
                { choice: 'Choice 2', note_value: 2 },
              ],
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('IntegNewQuiz');
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.questions.length).toBe(2);
    });
  });

  it('POST /api/quizzes — 403 for USER role', async () => {
    await withTestTransaction(async () => {
      const res = await request(app)
        .post('/api/quizzes')
        .set('Authorization', `Bearer ${userToken(USER_ID)}`)
        .send({
          name: 'ShouldFail',
          description: 'Should not be created',
          questions: [],
        });

      expect(res.status).toBe(403);
    });
  });

  it('GET /api/quizzes/:id returns quiz with questions and choices', async () => {
    await withTestTransaction(async () => {
      const criterion = await createTestCriterion();
      const quiz = await createTestQuizWithQuestions([criterion.id], { name: 'IntegDetailQuiz' });

      const res = await request(app)
        .get(`/api/quizzes/${quiz.quiz.id}`)
        .set('Authorization', `Bearer ${userToken(USER_ID)}`);
      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('IntegDetailQuiz');
      expect(res.body.data.questions.length).toBeGreaterThan(0);
      expect(res.body.data.questions[0].choices.length).toBeGreaterThan(0);
    });
  });

  it('GET /api/quizzes/:id — 404 if not found', async () => {
    await withTestTransaction(async () => {
      const res = await request(app)
        .get('/api/quizzes/999999')
        .set('Authorization', `Bearer ${userToken(USER_ID)}`);
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('QUIZ_NOT_FOUND');
    });
  });

  it('POST /api/quizzes — validates criterion exists', async () => {
    await withTestTransaction(async () => {
      const res = await request(app)
        .post('/api/quizzes')
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({
          name: 'InvalidQuiz',
          description: 'Quiz with invalid criterion',
          questions: [
            {
              id_criterion: 999999,
              question: 'Question',
              choices: [
                { choice: 'Choice 1', note_value: 1 },
                { choice: 'Choice 2', note_value: 2 },
              ],
            },
          ],
        });

      expect(res.status).toBe(400);
    });
  });
});
