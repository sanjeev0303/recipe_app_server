import { CronJob } from "cron";
import https from "https";
import { logger } from "./logger";

const apiUrl = process.env.API_URL;

const job = new CronJob("*/14 * * * *", function () {
  if (!apiUrl) return;
  https
    .get(apiUrl, (res) => {
      if (res.statusCode === 200) logger.info("GET request sent successfully");
      else logger.warn(`GET request failed with status code: ${res.statusCode}`);
    })
    .on("error", (e) => logger.error({ err: e }, "Error while sending request"));
});

export default job;

// CRON JOB EXPLANATION:
// Cron jobs are scheduled tasks that run periodically at fixed intervals
// we want to send 1 GET request for every 14 minutes so that our api never gets inactive on Render.com

// How to define a "Schedule"?
// You define a schedule using a cron expression, which consists of 5 fields representing:

//! MINUTE, HOUR, DAY OF THE MONTH, MONTH, DAY OF THE WEEK

//? EXAMPLES && EXPLANATION:
//* 14 * * * * - Every 14 minutes
//* 0 0 * * 0 - At midnight on every Sunday
//* 30 3 15 * * - At 3:30 AM, on the 15th of every month
//* 0 0 1 1 * - At midnight, on January 1st
//* 0 * * * * - Every hour
