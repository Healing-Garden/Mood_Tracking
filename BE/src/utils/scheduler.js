const cron = require("node-cron");
const journalService = require("../services/journalService");

/**
 * Initializes all scheduled tasks for the system.
 */
const initSchedulers = () => {
    // Run daily at midnight (00:00)
    cron.schedule("0 0 * * *", async () => {
        console.log("Running scheduled task: Journal Trash Cleanup (30 days)");
        try {
            const purgedCount = await journalService.cleanupSoftDeleted();
            console.log(`Journal Trash Cleanup completed. Purged ${purgedCount} entries.`);
        } catch (error) {
            console.error("Scheduled task failed: Journal Trash Cleanup", error);
        }
    });

    console.log("Schedulers initialized: daily at 00:00");
};

module.exports = { initSchedulers };
