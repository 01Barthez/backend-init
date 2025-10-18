import ejs from 'ejs';
import fs from 'fs';
import path from 'path';

import log from '@/services/logging/logger';

import type { TemplateData } from '../interface/types';

/**
 * Fonction générique de rendu d’un template EJS
 */

export async function renderTemplate(
  templateFileName: string,
  templateData: TemplateData,
  templateLabel: string,
): Promise<string> {
  const templatePath = path.join(__dirname, '../templates', templateFileName);

  log.debug(`Loading ${templateLabel} template`, {
    templatePath,
    exists: fs.existsSync(templatePath),
  });

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template file not found: ${templatePath}`);
  }

  try {
    const template = fs.readFileSync(templatePath, 'utf8');
    return ejs.render(template, templateData);
  } catch (error: any) {
    log.error(`Failed to render ${templateLabel} template`, {
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
}
