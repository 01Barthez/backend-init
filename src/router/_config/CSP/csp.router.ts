import express, { Router } from 'express';

import CSPControllers from '@/controllers/_config/CSP/csp.controllers';

const CSP = Router();

CSP.get('/', express.json({ type: 'application/csp-report' }), CSPControllers.report);

export default CSP;

CSP;
