import { Router } from 'express';

import healthControllers from '@/controllers/_config/health-check/health.controllers';

const health = Router();

health.get('/', healthControllers.health);

export default health;
