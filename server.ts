// server.ts (na raiz do backend)
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Prisma Client
export const prisma = new PrismaClient();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);

// Dashboard endpoint
app.get('/api/reports/dashboard', async (req: Request, res: Response) => {
  try {
    const [totalLeads, totalContacts, totalDeals, totalCompanies] = await Promise.all([
      prisma.lead.count(),
      prisma.contact.count(),
      prisma.deal.count(),
      prisma.company.count()
    ]);

    const recentActivities = await prisma.activity.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        contact: true,
        deal: true,
        user: true
      }
    });

    const pipeline = await Promise.all(
      // Use the DealStage enum to ensure type safety for the stage filter
      ([
        'PROSPECTING',
        'QUALIFICATION',
        'PROPOSAL',
        'NEGOTIATION',
        'CLOSED_WON',
        'CLOSED_LOST'
      ] as import('@prisma/client').DealStage[]).map(async (stage) => {
        const deals = await prisma.deal.findMany({
          where: { stage: stage },
          include: {
            contact: {
              include: { company: true }
            },
            user: true
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        });

        const totalValue = deals.reduce((sum: number, deal: any) => sum + Number(deal.value || 0), 0);

        return {
          stage,
          count: deals.length,
          totalValue,
          deals: deals.slice(0, 5)
        };
      })
    );

    res.json({
      metrics: { totalLeads, totalContacts, totalDeals, totalCompanies },
      recentActivities,
      pipeline
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Companies endpoints
app.get('/api/companies', async (req: Request, res: Response) => {
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

// Contacts endpoints
app.get('/api/contacts', async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '10', search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = search ? {
      OR: [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { company: { name: { contains: search as string, mode: 'insensitive' } } }
      ]
    } : {};

    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        include: { company: true, lead: true, deals: true },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.contact.count({ where })
    ]);

    res.json({
      contacts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/contacts - Criar novo contato
app.post('/api/contacts', async (req: Request, res: Response) => {
  try {
    const { name, email, phone, position, companyId, notes, tags } = req.body;

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
      include: { company: true }
    });

    res.status(201).json(contact);
  } catch (error: any) {
    console.error('Create contact error:', error);
    
    if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
      return res.status(400).json({ error: 'Email já existe' });
    }
    
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/contacts/:id - Atualizar contato
app.put('/api/contacts/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, phone, position, companyId, notes, tags } = req.body;

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
      include: { company: true }
    });

    res.json(contact);
  } catch (error: any) {
    console.error('Update contact error:', error);
    
    if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
      return res.status(400).json({ error: 'Email já existe' });
    }
    
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE /api/contacts/:id - Excluir contato
app.delete('/api/contacts/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

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

// Deals endpoints
app.get('/api/deals', async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '10', stage } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = stage ? { stage: stage as string } : {};

    const [deals, total] = await Promise.all([
      prisma.deal.findMany({
        where: stage
          ? { stage: { equals: stage as any } }
          : undefined,
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
      prisma.deal.count({
        where: stage
          ? { stage: { equals: stage as any } }
          : undefined
      })
    ]);

    res.json({
      deals,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get deals error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'CRM API'
  });
});

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl 
  });
});

// Error handling middleware
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', error);
  
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API URL: http://localhost:${PORT}/api`);
});