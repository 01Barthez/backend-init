import { Router } from 'express';

import CSRFControllers from '@/controllers/_config/csrf-token/csrf.controllers';

const CSRF = Router();

CSRF.get('/', CSRFControllers.sendToken);

export default CSRF;

CSRF;
