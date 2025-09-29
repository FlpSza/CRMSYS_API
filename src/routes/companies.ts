import express from 'express';
import { prisma } from '../../server';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

// GET /api/companies - Lista todas as empresas
router.get('/api/companies', async (req, res) => {
  try {
    const companies = await prisma.company.findMany({
      select: {
        id: true,
        name: true,
        cnpj: true,
        industry: true,
        size: true
      },
      orderBy: { name: 'asc' }
    });

    res.json({ companies });
  } catch (error) {
    console.error('Get companies error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/contacts/:id - Buscar contato específico
router.get('/api/contacts/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const contact = await prisma.contact.findUnique({
      where: { id },
      include: {
        company: true,
        lead: true,
        deals: {
          include: {
            activities: {
              orderBy: { createdAt: 'desc' },
              take: 5
            }
          }
        },
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!contact) {
      return res.status(404).json({ error: 'Contato não encontrado' });
    }

    res.json(contact);
  } catch (error) {
    console.error('Get contact error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/contacts - Criar novo contato
router.post('/api/contacts', async (req, res) => {
  try {
    const { name, email, phone, position, companyId, notes, tags } = req.body;

    // Validar dados obrigatórios
    if (!name || !email) {
      return res.status(400).json({ error: 'Nome e email são obrigatórios' });
    }

    const contact = await prisma.contact.create({
      data: {
        name,
        email,
        phone,
        position,
        companyId,
        notes,
        tags: tags ? (Array.isArray(tags) ? tags : [tags]) : undefined
      },
      include: {
        company: true
      }
    });

    res.status(201).json(contact);
  } catch (error) {
    console.error('Create contact error:', error);

    // Verificar se é erro de email duplicado
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002' &&
      'meta' in error &&
      error.meta &&
      typeof error.meta === 'object' &&
      'target' in error.meta &&
      Array.isArray(error.meta.target) &&
      error.meta.target.includes('email')
    ) {
      return res.status(400).json({ error: 'Email já existe' });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/contacts/:id - Atualizar contato
router.put('/api/contacts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, position, companyId, notes, tags } = req.body;

    // Verificar se o contato existe
    const existingContact = await prisma.contact.findUnique({
      where: { id }
    });

    if (!existingContact) {
      return res.status(404).json({ error: 'Contato não encontrado' });
    }

    const contact = await prisma.contact.update({
      where: { id },
      data: {
        name,
        email,
        phone,
        position,
        companyId,
        notes,
        tags: tags ? (Array.isArray(tags) ? tags : [tags]) : undefined
      },
      include: {
        company: true
      }
    });

    res.json(contact);
  } catch (error) {
    console.error('Update contact error:', error);
    // Verificar se é erro de email duplicado
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002' &&
      'meta' in error &&
      error.meta &&
      typeof error.meta === 'object' &&
      'target' in error.meta &&
      Array.isArray(error.meta.target) &&
      error.meta.target.includes('email')
    ) {
      return res.status(400).json({ error: 'Email já existe' });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE /api/contacts/:id - Excluir contato
router.delete('/api/contacts/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se o contato existe
    const existingContact = await prisma.contact.findUnique({
      where: { id }
    });

    if (!existingContact) {
      return res.status(404).json({ error: 'Contato não encontrado' });
    }

    await prisma.contact.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Delete contact error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;