import { Request, Response } from 'express';
import { prisma } from '../../server';

export const getDeals = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, stage } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = stage ? { stage: stage as string } : {};

    const [deals, total] = await Promise.all([
      prisma.deal.findMany({
        where: stage
          ? { stage: stage as any } // Use correct enum type for stage
          : undefined,
        include: {
          contact: {
            include: {
              company: true
            }
          },
          user: true,
          activities: {
            orderBy: { createdAt: 'desc' },
            take: 3
          }
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.deal.count({ 
        where: stage
        ? { stage: stage as any } 
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
};

export const getPipeline = async (req: Request, res: Response) => {
  try {
    const stages = ['PROSPECTING', 'QUALIFICATION', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST'];
    
    const pipeline = await Promise.all(
      stages.map(async (stage) => {
        const deals = await prisma.deal.findMany({
          where: { stage: stage as any },
          include: {
            contact: {
              include: {
                company: true
              }
            },
            user: true
          },
          orderBy: { createdAt: 'desc' }
        });

        const totalValue = deals.reduce((sum, deal) => sum + Number(deal.value || 0), 0);

        return {
          stage,
          count: deals.length,
          totalValue,
          deals
        };
      })
    );

    res.json(pipeline);
  } catch (error) {
    console.error('Get pipeline error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const createDeal = async (req: Request, res: Response) => {
  try {
    const { 
      title, 
      value, 
      stage, 
      probability, 
      expectedCloseDate, 
      contactId, 
      assignedTo, 
      notes 
    } = req.body;

    const deal = await prisma.deal.create({
      data: {
        title,
        value: value ? Number(value) : null,
        stage: stage || 'PROSPECTING',
        probability: probability ? Number(probability) : 0,
        expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : null,
        contactId,
        assignedTo,
        notes
      },
      include: {
        contact: {
          include: {
            company: true
          }
        },
        user: true
      }
    });

    res.status(201).json(deal);
  } catch (error) {
    console.error('Create deal error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const updateDeal = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { 
      title, 
      value, 
      stage, 
      probability, 
      expectedCloseDate, 
      assignedTo, 
      notes 
    } = req.body;

    const deal = await prisma.deal.update({
      where: { id },
      data: {
        title,
        value: value ? Number(value) : null,
        stage,
        probability: probability ? Number(probability) : 0,
        expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : null,
        assignedTo,
        notes
      },
      include: {
        contact: {
          include: {
            company: true
          }
        },
        user: true
      }
    });

    res.json(deal);
  } catch (error) {
    console.error('Update deal error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const updateDealStage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { stage } = req.body;

    const deal = await prisma.deal.update({
      where: { id },
      data: { stage },
      include: {
        contact: {
          include: {
            company: true
          }
        },
        user: true
      }
    });

    res.json(deal);
  } catch (error) {
    console.error('Update deal stage error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
