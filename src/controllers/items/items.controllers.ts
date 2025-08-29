import { Request, Response } from "express";
import prisma from "../../config/prisma/prisma";

const itemsControllers = {
    // Create
    createItem: async (req: Request, res: Response): Promise<void> => {
        try {
            const { name, value } = req.body;
            const newItem = await prisma.item.create({
                data: {
                    name,
                    value,
                },
            });
            res.status(201).json(newItem);
        } catch (error) {
            res.status(500).json({ error: "Error creating item" });
        }
    },

    // Read
    getAllItems: async (req: Request, res: Response): Promise<void> => {
        try {
            const page = Number(req.query.page) || 1;
            const limit = Number(req.query.limit) || 10;
            const name = req.query.name as string | undefined;
            const value = req.query.value !== undefined ? Number(req.query.value) : undefined;
            const skip = (page - 1) * limit;

            const whereClause: any = {};
            if (name) {
                whereClause.name = { contains: name, mode: "insensitive" };
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
        } catch (error) {
            res.status(500).json({ error: "Error fetching items" });
        }
    },

    // Read Single
    getOneItem: async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const item = await prisma.item.findUnique({
                where: { id },
            });
            if (item) {
                res.status(200).json(item);
            } else {
                res.status(404).json({ error: "Item not found" });
            }
        } catch (error) {
            res.status(500).json({ error: "Error fetching item" });
        }
    },

    // Update
    updateItem: async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const { name, value } = req.body;

            const updatedItem = await prisma.item.update({
                where: { id },
                data: { name, value },
            });

            res.status(200).json(updatedItem);
        } catch (error) {
            res.status(500).json({ error: "Error updating item" });
        }
    },

    // Delete
    deleteItem: async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            await prisma.item.delete({
                where: { id },
            });
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ error: "Error deleting item" });
        }
    },

    deleteAllItems: async (req: Request, res: Response): Promise<void> => {
        try {
            await prisma.item.deleteMany();
            
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ error: "Error deleting item" });
        }
    },
};

export default itemsControllers;