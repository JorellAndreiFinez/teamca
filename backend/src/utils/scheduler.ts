import { runDeadlineSweep } from "../services/deadlineService.js";

let SWEEP_HOUR = Number(process.env.DEADLINE_SWEEP_HOUR ?? 0);
if (Number.isNaN(SWEEP_HOUR) || SWEEP_HOUR < 0 || SWEEP_HOUR > 23) {
  SWEEP_HOUR = 0;
}

// schedules the deadline sweep to run once per day at SWEEP_HOUR (default: midnight)
// uses setTimeout for the first run then setInterval for 24-hour repeats
export function scheduleDeadlineSweep(): void {
  const msUntilNextSweep = (): number => {
    const now = new Date();
    const next = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      SWEEP_HOUR,
      0,
      0,
      0,
    );

    if (next.getTime() <= now.getTime()) {
      // already past today's sweep hour — schedule for tomorrow
      next.setDate(next.getDate() + 1);
    }

    return next.getTime() - now.getTime();
  };

  const executeSweep = () => {
    const timestamp = new Date().toISOString();
    console.warn(`[DeadlineSweep] Starting sweep at ${timestamp}`);

    runDeadlineSweep()
      .then(({ processed, notified }) => {
        console.warn(
          `[DeadlineSweep] Done — processed ${processed} tasks, notified ${notified}.`,
        );
      })
      .catch((err: unknown) => {
        console.error("[DeadlineSweep] Error during sweep:", err);
      })
      .finally(() => {
        setTimeout(executeSweep, msUntilNextSweep());
      });
  };

  const delay = msUntilNextSweep();
  const nextTime = new Date(Date.now() + delay).toISOString();
  console.warn(`[DeadlineSweep] Scheduled — first run at ${nextTime}`);

  setTimeout(executeSweep, delay);
}
