import { Router } from 'express';

import users_controller from '@/controllers/users/users.controller';
import { upload } from '@/middlewares/upload';

const users = Router();

// Create one item
users.post('/login', upload.single('profile'), users_controller.login);

export default users;
