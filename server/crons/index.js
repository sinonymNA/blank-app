const cron = require('node-cron');
const { monitorAllReddit } = require('./monitorReddit');
const { generateWeeklyContent } = require('./generateContent');
const { trackAllPerformance } = require('./trackPerformance');
const { sendMorningDigest } = require('./sendMorningDigest');
const { sendWeeklyInsights } = require('./sendWeeklyInsights');

function startCrons() {
  // Monitor Reddit every 30 minutes
  cron.schedule('*/30 * * * *', () => {
    monitorAllReddit().catch(e => console.error('[cron] monitorAllReddit unhandled:', e.message));
  });

  // Generate weekly content every Sunday at 8pm
  cron.schedule('0 20 * * 0', () => {
    generateWeeklyContent().catch(e => console.error('[cron] generateWeeklyContent unhandled:', e.message));
  });

  // Track performance every hour
  cron.schedule('0 * * * *', () => {
    trackAllPerformance().catch(e => console.error('[cron] trackAllPerformance unhandled:', e.message));
  });

  // Send morning digest every day at 7:30am
  cron.schedule('30 7 * * *', () => {
    sendMorningDigest().catch(e => console.error('[cron] sendMorningDigest unhandled:', e.message));
  });

  // Send weekly insights every Monday at 7am
  cron.schedule('0 7 * * 1', () => {
    sendWeeklyInsights().catch(e => console.error('[cron] sendWeeklyInsights unhandled:', e.message));
  });

  console.log('[crons] All cron jobs registered');
}

module.exports = { startCrons };
