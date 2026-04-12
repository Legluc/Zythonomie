import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import healthRoutes from './routes/health.routes';
import userRoutes from './routes/user.routes';
import beerRoutes from './routes/beer.routes';
import ratingRoutes from './routes/rating.routes';
import quizRoutes from './routes/quiz.routes';
import quizzSessionRoutes from './routes/quizz-session.routes';
import recommendationRoutes from './routes/recommendation.routes';
import { notFoundHandler, errorHandler } from './middleware/error-handler';

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/health', healthRoutes);
app.use('/api/users', userRoutes);
app.use('/api/beers', beerRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/quizz-sessions', quizzSessionRoutes);
app.use('/api/recommendations', recommendationRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
