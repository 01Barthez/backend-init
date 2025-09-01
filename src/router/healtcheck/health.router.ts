import healthControllers from '@controllers/healthcheck/health.controllers';
import { Router } from 'express';

const health = Router();

health.get('/', healthControllers.health);

export default health;
