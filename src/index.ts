import express from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const app = express();
app.use(express.json());

const PORT = 3000;

// Test route
app.get("/", (req, res) => {
  res.send("Server is running ✅");
});

// CRUD routes for Item
app.post("/items", async (req, res) => {
  const { name, value } = req.body;
  const item = await prisma.item.create({ data: { name, value } });
  res.json(item);
});

app.get("/items", async (req, res) => {
  const items = await prisma.item.findMany();
  res.json(items);
});

app.get("/items/:id", async (req, res) => {
  const { id } = req.params;
  const item = await prisma.item.findUnique({ where: { id } });
  res.json(item);
});

app.put("/items/:id", async (req, res) => {
  const { id } = req.params;
  const { name, value } = req.body;
  const item = await prisma.item.update({ where: { id }, data: { name, value } });
  res.json(item);
});

app.delete("/items/:id", async (req, res) => {
  const { id } = req.params;
  await prisma.item.delete({ where: { id } });
  res.json({ message: "Item deleted" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
