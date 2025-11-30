import { ENV } from "./config/env";
import { db } from "./config/db";
import { sql } from "drizzle-orm";
import job from "./config/cron";
import { logger } from "./config/logger";
import app from "./express-app";

const PORT = ENV.PORT || 5001;

if (ENV.NODE_ENV === "production") job.start();

const server = app.listen(PORT, async () => {
  logger.info(`Server is running on PORT: ${PORT}`);
  try {
    await db.execute(sql`SELECT 1`);
    logger.info("Database connected successfully");
  } catch (error) {
    logger.error({ err: error }, "Error connecting to database");
  }
});

const onCloseSignal = () => {
  logger.info("SIGINT received, shutting down");
  job.stop();
  server.close(() => {
    logger.info("Server closed");
    process.exit();
  });
  setTimeout(() => process.exit(1), 10000).unref(); // Force shutdown after 10s
};

process.on("SIGINT", onCloseSignal);
process.on("SIGTERM", onCloseSignal);
