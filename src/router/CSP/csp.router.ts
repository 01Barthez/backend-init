
import CSPControllers from "@/controllers/CSP/csp.controllers";
import express, { Router } from "express";

const CSP = Router();

CSP.get("/", express.json({ type: 'application/csp-report' }), CSPControllers.report);

export default CSP

CSP