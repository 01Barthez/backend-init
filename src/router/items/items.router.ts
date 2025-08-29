
import { Router } from "express";
import itemsControllers from "../../controllers/items/items.controllers";

const items = Router();

// Create one item
items.post("/", itemsControllers.createItem);

// Get All Items
items.get("/", itemsControllers.getAllItems);

// Get One item
items.get("/", itemsControllers.getOneItem);

// Update an item
items.put("/:id", itemsControllers.updateItem);

// Delete one item
items.delete("/:id", itemsControllers.deleteItem);

// Delete all Items
items.delete("/", itemsControllers.deleteAllItems);

export default items;