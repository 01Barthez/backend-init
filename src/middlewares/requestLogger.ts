import { Request, Response, NextFunction } from 'express';
import log from '@services/logging/logger';

export const requestLog = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  // Ignore les requêtes pour les fichiers statiques
  if (req.path.startsWith('/static/')) {
    return next();
  }

  // Sauvegarde de la méthode originale de fin de réponse
  const originalEnd = res.end;
  const chunks: any[] = [];

  // Interception de la réponse
  // @ts-ignore
  res.end = (chunk: any, ...args: any[]) => {
    if (chunk) {
      chunks.push(chunk);
    }

    const responseBody = Buffer.concat(chunks).toString('utf8');
    const responseTime = Date.now() - start;

    // Ne pas logger pour les requêtes non trouvées (404) car elles seront gérées par le middleware notFound
    if (res.statusCode !== 404) {
      // Log de la réponse
      log.http('Outgoing Response', {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        responseTime: `${responseTime}ms`,
        contentLength: res.get('Content-Length') || 0,
        ...(req.body && Object.keys(req.body).length > 0 && { requestBody: req.body }),
        ...(responseBody && { responseBody: safeJsonParse(responseBody) })
      });
    }

    // Restauration de la méthode originale
    // @ts-ignore
    originalEnd.apply(res, [chunk, ...args]);
  };

  next();
};

// Middleware pour log les erreurs
export const errorLog = (err: Error, req: Request, res: Response, next: NextFunction) => {
  // Ne pas logger les erreurs 404 ici, elles seront gérées par le middleware notFound
  if (res.statusCode !== 404) {
    log.error('Error Handler', {
      error: err.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
      path: req.path,
      method: req.method,
      ip: req.ip
    });
  }
  
  next(err);
};

// Fonction utilitaire pour parser en toute sécurité le JSON
function safeJsonParse(str: string) {
  try {
    return JSON.parse(str);
  } catch (e) {
    return str;
  }
}
