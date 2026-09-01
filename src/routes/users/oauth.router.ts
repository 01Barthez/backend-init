import { Router } from 'express';

import usersController from '@/controllers/users/users.controller';

const oauth = Router();

// Static paths before parameterized routes
oauth.get('/accounts', usersController.oauthAccounts);
oauth.post('/telegram', usersController.telegramAuth);

oauth.get('/:provider', usersController.oauthAuthorize);
oauth.get('/:provider/callback', usersController.oauthCallback);
oauth.delete('/:provider/unlink', usersController.oauthUnlink);

export default oauth;
