
import { Router } from "express";
import healthControllers from "@controllers/healthcheck/health.controllers";

const health = Router();


health.get("/", healthControllers.health);

export default health