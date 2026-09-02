import { Worker } from 'worker_threads';

import log from '@/services/logging/logger';

interface PoolTask<T = unknown, R = unknown> {
  data: T;
  resolve: (value: R) => void;
  reject: (error: Error) => void;
}

interface WorkerPoolOptions {
  workerScript: string;
  poolSize?: number;
}

export class WorkerPool<T = unknown, R = unknown> {
  private readonly workers: Worker[] = [];
  private readonly queue: PoolTask<T, R>[] = [];
  private readonly workerScript: string;
  private activeWorkers = 0;

  constructor(options: WorkerPoolOptions) {
    this.workerScript = options.workerScript;
    const size = options.poolSize ?? 2;

    for (let i = 0; i < size; i++) {
      this.workers.push(this.createWorker());
    }
  }

  private createWorker(): Worker {
    const worker = new Worker(this.workerScript);

    worker.on('error', (error) => {
      log.error('Worker thread error', { error: error.message });
      this.activeWorkers = Math.max(0, this.activeWorkers - 1);
      this.processQueue();
    });

    worker.on('exit', (code) => {
      if (code !== 0) {
        log.warn('Worker thread exited with non-zero code', { code });
      }
      this.activeWorkers = Math.max(0, this.activeWorkers - 1);
      this.processQueue();
    });

    return worker;
  }

  private processQueue(): void {
    if (this.queue.length === 0 || this.activeWorkers >= this.workers.length) return;

    const task = this.queue.shift();
    if (!task) return;

    const worker = this.workers[this.activeWorkers % this.workers.length];
    this.activeWorkers++;

    const onMessage = (result: R) => {
      cleanup();
      task.resolve(result);
      this.activeWorkers--;
      this.processQueue();
    };

    const onError = (error: Error) => {
      cleanup();
      task.reject(error);
      this.activeWorkers--;
      this.processQueue();
    };

    const cleanup = () => {
      worker.removeListener('message', onMessage);
      worker.removeListener('error', onError);
    };

    worker.once('message', onMessage);
    worker.once('error', onError);
    worker.postMessage(task.data);
  }

  run(data: T): Promise<R> {
    return new Promise<R>((resolve, reject) => {
      this.queue.push({ data, resolve, reject });
      this.processQueue();
    });
  }

  async shutdown(): Promise<void> {
    await Promise.all(this.workers.map((w) => w.terminate()));
    this.workers.length = 0;
    this.queue.length = 0;
  }
}

export default WorkerPool;
