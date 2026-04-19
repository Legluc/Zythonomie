import { describe, it, expect } from 'vitest';
import { withTestTransaction } from '../helpers/with-transaction';
import { createTestUser, createTestCriterion, createTestQuizWithQuestions } from '../helpers/factories';
import prisma from '../../src/lib/prisma';
import {
  startSession,
  answerQuestion,
  completeSession,
} from '../../src/services/quizz-session.service';

describe('quizz-session.service', () => {
  it('startSession creates a session IN_PROGRESS', async () => {
    await withTestTransaction(async () => {
      const user = await createTestUser();
      const c1 = await createTestCriterion();
      const { quiz } = await createTestQuizWithQuestions([c1.id]);

      const progress = await startSession(user.id, quiz.id);
      expect(progress.session.status).toBe('IN_PROGRESS');
      expect(progress.session.id_user).toBe(user.id);
      expect(progress.answered_count).toBe(0);
      expect(progress.total_questions).toBe(1);
    });
  });

  it('answerQuestion records an answer', async () => {
    await withTestTransaction(async () => {
      const user = await createTestUser();
      const c1 = await createTestCriterion();
      const { quiz, questions } = await createTestQuizWithQuestions([c1.id]);

      const session = await startSession(user.id, quiz.id);
      const choiceId = questions[0].choices[2].id; // note_value = 3

      const progress = await answerQuestion(session.session.id, choiceId);
      expect(progress.answered_count).toBe(1);
    });
  });

  it('completeSession marks COMPLETED and creates UserCriteria', async () => {
    await withTestTransaction(async () => {
      const user = await createTestUser();
      const c1 = await createTestCriterion();
      const c2 = await createTestCriterion();
      const { quiz, questions } = await createTestQuizWithQuestions([c1.id, c2.id]);

      const session = await startSession(user.id, quiz.id);

      // Answer c1 with note_value=4, c2 with note_value=2
      await answerQuestion(session.session.id, questions[0].choices[3].id); // note=4
      await answerQuestion(session.session.id, questions[1].choices[1].id); // note=2

      const result = await completeSession(session.session.id);
      expect(result.session.status).toBe('COMPLETED');

      // Verify UserCriteria were created
      const uc = await prisma.userCriteria.findMany({
        where: { id_user: user.id },
        select: { id_criterion: true, score: true },
      });

      expect(uc.length).toBe(2);
      const c1Score = uc.find((u) => u.id_criterion === c1.id);
      const c2Score = uc.find((u) => u.id_criterion === c2.id);
      expect(Number(c1Score!.score)).toBeCloseTo(4);
      expect(Number(c2Score!.score)).toBeCloseTo(2);
    });
  });

  it('answerQuestion throws 409 for duplicate answer', async () => {
    await withTestTransaction(async () => {
      const user = await createTestUser();
      const c1 = await createTestCriterion();
      const { quiz, questions } = await createTestQuizWithQuestions([c1.id]);

      const session = await startSession(user.id, quiz.id);
      await answerQuestion(session.session.id, questions[0].choices[0].id);

      // Try answering the same question with a different choice
      await expect(
        answerQuestion(session.session.id, questions[0].choices[1].id),
      ).rejects.toMatchObject({ statusCode: 409, code: 'QUESTION_ALREADY_ANSWERED' });
    });
  });

  it('completeSession throws 409 if already completed', async () => {
    await withTestTransaction(async () => {
      const user = await createTestUser();
      const c1 = await createTestCriterion();
      const { quiz, questions } = await createTestQuizWithQuestions([c1.id]);

      const session = await startSession(user.id, quiz.id);
      await answerQuestion(session.session.id, questions[0].choices[0].id);
      await completeSession(session.session.id);

      await expect(completeSession(session.session.id)).rejects.toMatchObject({
        statusCode: 409,
        code: 'QUIZZ_SESSION_NOT_IN_PROGRESS',
      });
    });
  });

  it('startSession throws 404 for non-existent user', async () => {
    await withTestTransaction(async () => {
      const c1 = await createTestCriterion();
      const { quiz } = await createTestQuizWithQuestions([c1.id]);

      await expect(startSession(999999, quiz.id)).rejects.toMatchObject({
        statusCode: 404,
        code: 'USER_NOT_FOUND',
      });
    });
  });

  it('startSession throws 404 for non-existent quiz', async () => {
    await withTestTransaction(async () => {
      const user = await createTestUser();

      await expect(startSession(user.id, 999999)).rejects.toMatchObject({
        statusCode: 404,
        code: 'QUIZ_NOT_FOUND',
      });
    });
  });

  it('answerQuestion throws 404 for non-existent choice', async () => {
    await withTestTransaction(async () => {
      const user = await createTestUser();
      const c1 = await createTestCriterion();
      const { quiz } = await createTestQuizWithQuestions([c1.id]);

      const session = await startSession(user.id, quiz.id);

      await expect(answerQuestion(session.session.id, 999999)).rejects.toMatchObject({
        statusCode: 404,
        code: 'QUESTION_CHOICE_NOT_FOUND',
      });
    });
  });

  it('answerQuestion throws 400 for choice not in quiz', async () => {
    await withTestTransaction(async () => {
      const user = await createTestUser();
      const c1 = await createTestCriterion();
      const c2 = await createTestCriterion();

      const quiz1 = await createTestQuizWithQuestions([c1.id]);
      const quiz2 = await createTestQuizWithQuestions([c2.id]);

      const session = await startSession(user.id, quiz1.quiz.id);

      // Try to answer with a choice from quiz2
      await expect(
        answerQuestion(session.session.id, quiz2.questions[0].choices[0].id),
      ).rejects.toMatchObject({ statusCode: 400, code: 'QUESTION_NOT_IN_QUIZ' });
    });
  });
});
