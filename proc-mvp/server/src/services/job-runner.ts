/**
 * Simple in-memory background job runner.
 *
 * Uses AbortController for cancellation support.
 * Runs async functions without blocking the HTTP response.
 * Scalability note: for production, swap with Bull/BullMQ + Redis.
 */

interface ActiveJob {
  controller: AbortController;
  startedAt: Date;
}

const activeJobs = new Map<string, ActiveJob>();

/**
 * Start a function in the background. Returns immediately.
 * The function receives an AbortSignal it should check periodically.
 */
export function startBackgroundJob(
  jobId: string,
  fn: (signal: AbortSignal) => Promise<void>,
): void {
  const controller = new AbortController();

  activeJobs.set(jobId, {
    controller,
    startedAt: new Date(),
  });

  // Fire-and-forget: the job runs in the background
  fn(controller.signal)
    .catch((err) => {
      console.error(`[JobRunner] Job ${jobId} failed:`, err.message);
    })
    .finally(() => {
      activeJobs.delete(jobId);
    });
}

/** Cancel a running background job by aborting its signal. */
export function cancelJob(jobId: string): boolean {
  const job = activeJobs.get(jobId);
  if (!job) return false;
  job.controller.abort();
  activeJobs.delete(jobId);
  return true;
}

/** Check if a job is actively running in memory. */
export function isJobRunning(jobId: string): boolean {
  return activeJobs.has(jobId);
}

/** Get total number of active background jobs. */
export function getActiveJobCount(): number {
  return activeJobs.size;
}

/** Get all active job IDs. */
export function getActiveJobIds(): string[] {
  return Array.from(activeJobs.keys());
}
