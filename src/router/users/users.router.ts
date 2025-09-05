import { Router } from 'express';

import users_controller from '@/controllers/users/users.controller';
import { upload } from '@/middlewares/upload';

// import { validator } from '@/services/validator/validator';

const users = Router();

// Create one item
users.post(
  '/auth/signup',
  upload.single('profile'),
  // validator.signup,
  users_controller.signup,
);

export default users;
