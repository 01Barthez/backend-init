import { Router } from 'express';

import { upload } from '@/middlewares/upload';
import { validationErrorHandler } from '@/middlewares/validationErrorHandler';
import { validate_blog } from '@/services/validator/validate/users';

const blog = Router();

// ============================================
// PUBLIC ROUTES OF BLOG
// ============================================

// create blog
// Get one blog
// Get All blogs
// Update blog
// Delete one blog
// Delete All blogs
// another route
// etc
// ...

export default blog;
