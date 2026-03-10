const cron = require("node-cron");
const journalService = require("../services/journalService");

/**
 * Initializes all scheduled tasks for the system.
 */
const initSchedulers = () => {
    // Run every 15 minutes
    cron.schedule("*/15 * * * *", async () => {
        try {
            const purgedCount = await journalService.cleanupSoftDeleted();
            if (purgedCount > 0) {
                console.log(`Journal Trash Cleanup completed. Purged ${purgedCount} entries.`);
            }
        } catch (error) {
            console.error("Scheduled task failed: Journal Trash Cleanup", error);
        }
    });

    console.log("Schedulers initialized: daily at 00:00");
};

module.exports = { initSchedulers };
