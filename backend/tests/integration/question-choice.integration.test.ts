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

describe('QuestionChoice Integration', () => {
  it('GET /api/question-choices/by-question/:id_quizz_question returns choices', async () => {
    await withTestTransaction(async () => {
      const criterion = await createTestCriterion();
      const quiz = await createTestQuizWithQuestions([criterion.id]);
      const question = quiz.questions[0];

      const res = await request(app)
        .get(`/api/question-choices/by-question/${question.id}`)
        .set('Authorization', `Bearer ${userToken(USER_ID)}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.data)).toBe(true);
      expect(res.body.data.data.length).toBeGreaterThan(0);
    });
  });

  it('GET /api/question-choices/by-question/:id_quizz_question — 401 without token', async () => {
    await withTestTransaction(async () => {
      const res = await request(app).get('/api/question-choices/by-question/1');
      expect(res.status).toBe(401);
    });
  });

  it('POST /api/question-choices creates a choice (ADMIN)', async () => {
    await withTestTransaction(async () => {
      const criterion = await createTestCriterion();
      const quiz = await createTestQuizWithQuestions([criterion.id]);
      const question = quiz.questions[0];

      const res = await request(app)
        .post('/api/question-choices')
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({
          id_quizz_question: question.id,
          choice: 'New choice',
          note_value: 3,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.choice).toBe('New choice');
      expect(res.body.data.note_value).toBe(3);
      expect(res.body.data.id).toBeDefined();
    });
  });

  it('POST /api/question-choices — 403 for USER role', async () => {
    await withTestTransaction(async () => {
      const criterion = await createTestCriterion();
      const quiz = await createTestQuizWithQuestions([criterion.id]);
      const question = quiz.questions[0];

      const res = await request(app)
        .post('/api/question-choices')
        .set('Authorization', `Bearer ${userToken(USER_ID)}`)
        .send({
          id_quizz_question: question.id,
          choice: 'Should fail',
          note_value: 2,
        });

      expect(res.status).toBe(403);
    });
  });

  it('GET /api/question-choices/:id returns choice details', async () => {
    await withTestTransaction(async () => {
      const criterion = await createTestCriterion();
      const quiz = await createTestQuizWithQuestions([criterion.id]);
      const question = quiz.questions[0];
      const choice = question.choices[0];

      const res = await request(app)
        .get(`/api/question-choices/${choice.id}`)
        .set('Authorization', `Bearer ${userToken(USER_ID)}`);
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(choice.id);
      expect(res.body.data.note_value).toBe(choice.note_value);
    });
  });

  it('GET /api/question-choices/:id — 404 if not found', async () => {
    await withTestTransaction(async () => {
      const res = await request(app)
        .get('/api/question-choices/999999')
        .set('Authorization', `Bearer ${userToken(USER_ID)}`);
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('CHOICE_NOT_FOUND');
    });
  });

  it('PATCH /api/question-choices/:id updates choice (ADMIN)', async () => {
    await withTestTransaction(async () => {
      const criterion = await createTestCriterion();
      const quiz = await createTestQuizWithQuestions([criterion.id]);
      const question = quiz.questions[0];
      const choice = question.choices[0];

      const res = await request(app)
        .patch(`/api/question-choices/${choice.id}`)
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({ choice: 'Updated choice' });

      expect(res.status).toBe(200);
      expect(res.body.data.choice).toBe('Updated choice');
    });
  });

  it('PATCH /api/question-choices/:id — 403 for USER role', async () => {
    await withTestTransaction(async () => {
      const criterion = await createTestCriterion();
      const quiz = await createTestQuizWithQuestions([criterion.id]);
      const question = quiz.questions[0];
      const choice = question.choices[0];

      const res = await request(app)
        .patch(`/api/question-choices/${choice.id}`)
        .set('Authorization', `Bearer ${userToken(USER_ID)}`)
        .send({ choice: 'Should fail' });

      expect(res.status).toBe(403);
    });
  });

  it('DELETE /api/question-choices/:id removes choice if not answered', async () => {
    await withTestTransaction(async () => {
      const criterion = await createTestCriterion();
      const quiz = await createTestQuizWithQuestions([criterion.id]);
      const question = quiz.questions[0];
      const choice = question.choices[0];

      const deleteRes = await request(app)
        .delete(`/api/question-choices/${choice.id}`)
        .set('Authorization', `Bearer ${adminToken()}`);
      expect(deleteRes.status).toBe(200);

      const getRes = await request(app)
        .get(`/api/question-choices/${choice.id}`)
        .set('Authorization', `Bearer ${userToken(USER_ID)}`);
      expect(getRes.status).toBe(404);
    });
  });

  it('DELETE /api/question-choices/:id — 403 for USER role', async () => {
    await withTestTransaction(async () => {
      const criterion = await createTestCriterion();
      const quiz = await createTestQuizWithQuestions([criterion.id]);
      const question = quiz.questions[0];
      const choice = question.choices[0];

      const res = await request(app)
        .delete(`/api/question-choices/${choice.id}`)
        .set('Authorization', `Bearer ${userToken(USER_ID)}`);
      expect(res.status).toBe(403);
    });
  });
});
