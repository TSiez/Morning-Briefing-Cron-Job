import "dotenv/config";
import cron from "node-cron";
import { runBriefing } from "./index.js";

const SCHEDULE = process.env.SCHEDULE_CRON || "0 7 * * *"; // every day at 07:00
const TZ = process.env.SCHEDULE_TZ || "America/New_York";
const MODE = (process.env.BRIEFING_MODE || "demo").toLowerCase();

if (!cron.validate(SCHEDULE)) {
  console.error(`[scheduler] invalid cron expression: ${SCHEDULE}`);
  process.exit(1);
}

console.log(`[scheduler] cron="${SCHEDULE}" tz=${TZ} mode=${MODE}`);
console.log("[scheduler] press Ctrl+C to stop");

cron.schedule(
  SCHEDULE,
  async () => {
    const startedAt = new Date().toISOString();
    console.log(`[scheduler] fire at ${startedAt}`);
    try {
      await runBriefing({ mode: MODE });
    } catch (err) {
      console.error("[scheduler] briefing failed:", err);
    }
  },
  { timezone: TZ }
);
