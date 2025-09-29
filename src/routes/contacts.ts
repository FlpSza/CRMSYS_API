import express from 'express';
import { 
  getContacts, 
  getContact, 
  createContact, 
  updateContact, 
  deleteContact 
} from '../controllers/contactsController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.use(authenticateToken); // Todas as rotas precisam de autenticação

router.get('/', getContacts);
router.get('/:id', getContact);
router.post('/', createContact);
router.put('/:id', updateContact);
router.delete('/:id', deleteContact);

export default router;
