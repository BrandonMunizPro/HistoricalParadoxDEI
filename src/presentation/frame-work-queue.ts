/** Cooperative preparation; each generator step must itself be bounded. */
export class FrameWorkQueue {
  private readonly jobs: Array<{
    work: Generator<unknown, unknown, unknown>;
    resolve: (value: unknown) => void;
    reject: (error: unknown) => void;
  }> = [];
  constructor(private readonly clock: () => number = () => performance.now()) {}
  run<T>(work: Generator<unknown, T, unknown>): Promise<T> {
    return new Promise<T>((resolve, reject) =>
      this.jobs.push({
        work,
        resolve: resolve as (value: unknown) => void,
        reject,
      }),
    );
  }
  pump(budgetMs: number): number {
    const start = this.clock();
    let steps = 0;
    while (this.jobs.length && this.clock() - start < budgetMs) {
      const job = this.jobs[0]!;
      try {
        const result = job.work.next();
        steps++;
        if (result.done) {
          this.jobs.shift();
          job.resolve(result.value);
        }
      } catch (error) {
        this.jobs.shift();
        job.reject(error);
      }
    }
    return steps;
  }
  get size(): number {
    return this.jobs.length;
  }
}
