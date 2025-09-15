import { Router } from 'express';

import users_controller from '@/controllers/users/users.controller';
import { upload } from '@/middlewares/upload';
import { validationErrorHandler } from '@/middlewares/validationErrorHandler';
import { validator } from '@/services/validator/validator';

const users = Router();

// Create one item
users.post(
  '/auth/signup',
  upload.single('profile'),
  validator.signup,
  validationErrorHandler,
  users_controller.signup,
);

export default users;
