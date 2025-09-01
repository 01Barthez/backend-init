import { Router } from 'express';

import CSRFControllers from '@/controllers/CSRF-token/csrf.controllers';

const CSRF = Router();

CSRF.get('/', CSRFControllers.sendToken);

export default CSRF;

CSRF;
