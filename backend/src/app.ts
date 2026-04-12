import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Zythonomie API is running' });
});

// TODO: monter les routes ici
// import beerRoutes from './routes/beer.routes';
// app.use('/api/beers', beerRoutes);

export default app;
