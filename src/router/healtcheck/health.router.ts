
import { Router } from "express";
import healthControllers from "@controllers/healthcheck/health.controllers";

const health = Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Vérifie l'état de santé de l'API
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: L'API est en bonne santé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
health.get("/", healthControllers.health);

export default health