// src/services/scheduler/index.ts
import log from '@services/logging/logger';
import { schedule } from 'node-cron';

import * as jobs from './jobs';

/**
 * Scheduler class to manage scheduled jobs
 */
class Scheduler {
  private jobInstances: any[] = [];

  // Initialize and start all scheduled jobs
  init(dependencies: any = {}) {
    try {
      // Loop through all exported jobs and start them
      Object.values(jobs).forEach((JobClass) => {
        if (typeof JobClass === 'function') {
          // Create job instance with dependencies if it has a constructor that accepts them
          let job;
          try {
            job = new (JobClass as any)(dependencies);
          } catch (error) {
            // Fallback to parameterless constructor if the class doesn't accept dependencies
            job = new (JobClass as any)();
          }

          if (typeof job.start === 'function') {
            job.start();
            this.jobInstances.push(job);
            log.info(`Job ${job.constructor.name} démarré avec succès`);
          }
        }
      });

      log.info(`Scheduler initialisé avec ${this.jobInstances.length} jobs`);
    } catch (error) {
      log.error("Erreur lors de l'initialisation du scheduler:", error);
      throw error;
    }
  }

  // Stop all scheduled jobs
  stopAll() {
    this.jobInstances.forEach((job) => {
      if (typeof job.stop === 'function') {
        job.stop();
      }
    });
    log.info('Tous les jobs ont été arrêtés');
  }

  // schedule a new task
  schedule(cronExpression: string, task: () => Promise<void>, options?: any) {
    return schedule(cronExpression, task, options);
  }
}

export const scheduler = new Scheduler();
