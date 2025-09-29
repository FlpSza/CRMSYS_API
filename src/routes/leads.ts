import express from 'express';
import { prisma } from '../../server';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.use(authenticateToken);

router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = status ? { status: status as string } : {};

    const leadWhere: any = status
      ? { status: status as any }
      : {};

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where: leadWhere,
        include: {
          contact: {
            include: {
              company: true
            }
          },
          user: true
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.lead.count({ where: leadWhere })
    ]);

    res.json({
      leads,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;
