const workflow = require('../models/workflow.model');

let isRunning = false;

const runScheduledChecks = async () => {
    if (isRunning) return;

    isRunning = true;

    try {
        const result = await workflow.runChecks();
        console.log('Automatic workflow checks:', result);
    } catch (error) {
        console.error('Automatic workflow checks failed:', error);
    } finally {
        isRunning = false;
    }
};

// Run once when the server starts.
runScheduledChecks();

// Repeat every minute.
setInterval(runScheduledChecks, 60 * 1000);