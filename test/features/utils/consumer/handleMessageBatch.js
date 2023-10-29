const pino = require('pino');
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() };
    }
  }
});
const { Consumer } = require('../../../../dist/consumer');

const { QUEUE_URL, sqs } = require('../sqs');

let cnt = 0;
const consumer = Consumer.create({
  queueUrl: QUEUE_URL,
  sqs,
  pollingWaitTimeMs: 0,
  batchSize: 10,
  maxInflightMessages: 100,
  waitTimeSeconds: 5,
  terminateVisibilityTimeoutSec: 1,
  terminationGracePeriodSeconds: 10,
  handleMessageBatch: async (messages) => {
    const c = cnt;
    try {
      cnt += messages?.length || 1;

      if (Math.random() > 0.98) throw new Error('handle message test error');
      const ms = 100 + 500 * Math.random();
      await new Promise((resolve) =>
        setTimeout(() => {
          logger.info(`start handle message processing timer ${c}, ${ms}`);
          resolve();
        }, ms)
      );

      logger.info(`finished handle message processing timer  ${c}`);
    } catch (e) {
      logger.error(`failed handle message processing: ${c}`, e);
      throw e;
    }
    return messages;
  }
});

exports.consumer = consumer;
