import express from 'express';
import { getDashboardData } from '../controllers/dashboardController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.use(authenticateToken); // Todas as rotas precisam de autenticação

router.get('/dashboard', getDashboardData);

export default router;
