import prisma from '@config/prisma/prisma';
import type { Request, Response } from 'express';

const itemsControllers = {
  // Create
  createItem: async (req: Request, res: Response): Promise<void> => {
    const { name, value } = req.body;
    const newItem = await prisma.item.create({
      data: {
        name,
        value,
      },
    });
    res.status(201).json(newItem);
  },

  // Read
  getAllItems: async (req: Request, res: Response): Promise<void> => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const name = req.query.name as string | undefined;
    const value = req.query.value !== undefined ? Number(req.query.value) : undefined;
    const skip = (page - 1) * limit;

    const whereClause: any = {};
    if (name) {
      whereClause.name = { contains: name, mode: 'insensitive' };
    }
    if (value !== undefined && !isNaN(value)) {
      whereClause.value = value;
    }

    const [items, totalItems] = await Promise.all([
      prisma.item.findMany({
        where: whereClause,
        skip,
        take: limit,
      }),
      prisma.item.count({ where: whereClause }),
    ]);

    res.status(200).json({
      items,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
      currentPage: page,
    });
  },

  // Read Single
  getOneItem: async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const item = await prisma.item.findUnique({
      where: { item_id: id },
    });
    if (item) {
      res.status(200).json(item);
    } else {
      res.status(404).json({ error: 'Item not found' });
    }
  },

  // Update
  updateItem: async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { name, value } = req.body;

    const updatedItem = await prisma.item.update({
      where: { item_id: id },
      data: { name, value },
    });

    res.status(200).json(updatedItem);
  },

  // Delete
  deleteItem: async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    await prisma.item.delete({
      where: { item_id: id },
    });
    res.status(204).send();
  },

  deleteAllItems: async (req: Request, res: Response): Promise<void> => {
    await prisma.item.deleteMany();

    res.status(204).send();
  },
};

export default itemsControllers;
