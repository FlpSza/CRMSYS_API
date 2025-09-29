import { Request, Response } from 'express';
import companyRoutes from '../routes/companies';
import { prisma } from '../../server.ts';
export const getContacts = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
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
        include: {
          company: true,
          lead: true,
          deals: true
        },
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
};

export const getContact = async (req: Request, res: Response) => {
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
};

export const createContact = async (req: Request, res: Response) => {
  try {
    const { name, email, phone, position, companyId, notes, tags } = req.body;

    const contact = await prisma.contact.create({
      data: {
        name,
        email,
        phone,
        position,
        companyId,
        notes,
        tags: tags ? JSON.parse(tags) : null
      },
      include: {
        company: true
      }
    });

    res.status(201).json(contact);
  } catch (error) {
    console.error('Create contact error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const updateContact = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, phone, position, companyId, notes, tags } = req.body;

    const contact = await prisma.contact.update({
      where: { id },
      data: {
        name,
        email,
        phone,
        position,
        companyId,
        notes,
        tags: tags ? JSON.parse(tags) : null
      },
      include: {
        company: true
      }
    });

    res.json(contact);
  } catch (error) {
    console.error('Update contact error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const deleteContact = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.contact.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Delete contact error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
