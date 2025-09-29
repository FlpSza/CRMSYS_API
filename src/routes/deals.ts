import express from 'express';
import { 
  getDeals, 
  getPipeline, 
  createDeal, 
  updateDeal, 
  updateDealStage 
} from '../controllers/dealsController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.use(authenticateToken); // Todas as rotas precisam de autenticação

router.get('/', getDeals);
router.get('/pipeline', getPipeline);
router.post('/', createDeal);
router.put('/:id', updateDeal);
router.put('/:id/stage', updateDealStage);

export default router;
