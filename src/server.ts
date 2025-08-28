import express from "express";
import metricsRouter from "./services/metrics/metrics";
import prisma from "./config/prisma/prisma";
import log from "./services/logging/logger";



const app = express();

app.use(express.json());
app.use(metricsRouter);


// Test route
app.get("/", (req, res) => {
  log.info("Health check endpoint called");
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

export default app;