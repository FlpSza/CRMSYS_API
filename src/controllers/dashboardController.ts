import { Request, Response } from 'express';
import { prisma } from '../../server';

export const getDashboardData = async (req: Request, res: Response) => {
  try {
    const [
      totalLeads,
      totalContacts,
      totalDeals,
      totalCompanies,
      recentActivities,
      dealsByStage
    ] = await Promise.all([
      prisma.lead.count(),
      prisma.contact.count(),
      prisma.deal.count(),
      prisma.company.count(),
      prisma.activity.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          contact: true,
          deal: true,
          user: true
        }
      }),
      prisma.deal.groupBy({
        by: ['stage'],
        _count: {
          stage: true
        },
        _sum: {
          value: true
        }
      })
    ]);

    // Calcular métricas de vendas
    const currentMonth = new Date();
    currentMonth.setDate(1);
    
    const [monthlySales, previousMonthSales] = await Promise.all([
      prisma.deal.aggregate({
        where: {
          stage: 'CLOSED_WON',
          createdAt: {
            gte: currentMonth
          }
        },
        _sum: {
          value: true
        }
      }),
      prisma.deal.aggregate({
        where: {
          stage: 'CLOSED_WON',
          createdAt: {
            gte: new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1),
            lt: currentMonth
          }
        },
        _sum: {
          value: true
        }
      })
    ]);

    const currentSales = Number(monthlySales._sum.value || 0);
    const previousSales = Number(previousMonthSales._sum.value || 0);
    const salesGrowth = previousSales > 0 ? 
      ((currentSales - previousSales) / previousSales) * 100 : 0;

    // Pipeline por estágio
    const pipeline = await Promise.all(
      ['PROSPECTING', 'QUALIFICATION', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST'].map(async (stage) => {
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
          orderBy: { createdAt: 'desc' },
          take: 5
        });

        const totalValue = deals.reduce((sum, deal) => sum + Number(deal.value || 0), 0);

        return {
          stage,
          count: deals.length,
          totalValue,
          deals: deals.slice(0, 5) // Apenas os primeiros 5 para o dashboard
        };
      })
    );

    res.json({
      metrics: {
        totalLeads,
        totalContacts,
        totalDeals,
        totalCompanies,
        monthlySales: currentSales,
        salesGrowth: Math.round(salesGrowth * 100) / 100
      },
      recentActivities,
      pipeline,
      dealsByStage
    });
  } catch (error) {
    console.error('Get dashboard data error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
