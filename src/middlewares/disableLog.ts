import { envs } from "@/config/env/env";
import { Request, Response, NextFunction } from "express";

// Liste des méthodes console à éventuellement désactiver
const consoleMethods: (keyof Console)[] = [
  "log",
  "info",
  "warn",
  "debug",
  // "error" volontairement laissé activé par défaut
];

// On sauvegarde les méthodes originales
const originalConsole: Partial<Record<keyof Console, Function>> = {};

const disableLogsInProduction = (_req: Request, _res: Response, next: NextFunction) => {
  const shouldDisable =
    envs.NODE_ENV === "production" && envs.DISABLE_CONSOLE_LOGS === true;

  if (shouldDisable) {
    consoleMethods.forEach((method) => {
      // Sauvegarde pour potentielle réactivation
      if (!originalConsole[method]) {
        originalConsole[method] = console[method];
      }
      console[method] = (() => {}) as any;
    });
  }

  next();
};

export default disableLogsInProduction;
