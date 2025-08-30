
import itemsControllers from "@controllers/items/items.controllers";
import { Router } from "express";

const items = Router();

// Create one item
items.post("/", itemsControllers.createItem);

// Get All Items
items.get("/", itemsControllers.getAllItems);

// Get One item
/**
 * @swagger
 * /api/items/{id}:
 *   get:
 *     summary: Récupère un item par son ID
 *     tags: [Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'item
 *     responses:
 *       200:
 *         description: Item trouvé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Item'
 *       404:
 *         description: Item non trouvé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
items.get("/:id", itemsControllers.getOneItem);

// Update an item
items.put("/:id", itemsControllers.updateItem);

// Delete one item
items.delete("/:id", itemsControllers.deleteItem);

// Delete all Items
items.delete("/", itemsControllers.deleteAllItems);

export default items;