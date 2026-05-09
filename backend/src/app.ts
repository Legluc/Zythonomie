import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import healthRoutes from './routes/health.routes';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import beerRoutes from './routes/beer.routes';
import ratingRoutes from './routes/rating.routes';
import quizRoutes from './routes/quiz.routes';
import quizzSessionRoutes from './routes/quizz-session.routes';
import recommendationRoutes from './routes/recommendation.routes';
import breweryRoutes from './routes/brewery.routes';
import categoryRoutes from './routes/category.routes';
import pairingRoutes from './routes/pairing.routes';
import criterionRoutes from './routes/criterion.routes';
import userCriteriaRoutes from './routes/user-criteria.routes';
import beerCriteriaRoutes from './routes/beer-criteria.routes';
import quizzQuestionRoutes from './routes/quizz-question.routes';
import questionChoiceRoutes from './routes/question-choice.routes';
import { notFoundHandler, errorHandler } from './middleware/error-handler';

dotenv.config();

const app = express();

// Middlewares de sécurité
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Middlewares standard
app.use(cors());
app.use(express.json());

// Routes
app.use('/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/beers', beerRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/quizz-sessions', quizzSessionRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/breweries', breweryRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/pairings', pairingRoutes);
app.use('/api/criteria', criterionRoutes);
app.use('/api/user-criteria', userCriteriaRoutes);
app.use('/api/beer-criteria', beerCriteriaRoutes);
app.use('/api/quizz-questions', quizzQuestionRoutes);
app.use('/api/question-choices', questionChoiceRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
