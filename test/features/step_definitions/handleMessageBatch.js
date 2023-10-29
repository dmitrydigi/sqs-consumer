const { Given, Then, After } = require('@cucumber/cucumber');
const assert = require('assert');
const { PurgeQueueCommand } = require('@aws-sdk/client-sqs');
const pEvent = require('p-event');

const { consumer } = require('../utils/consumer/handleMessageBatch');
const { producer } = require('../utils/producer');
const { sqs, QUEUE_URL } = require('../utils/sqs');

const cntMessages = 20;

Given(
  'a message batch is sent to the SQS queue',
  { timeout: 60 * 1000 },
  async () => {
    const params = {
      QueueUrl: QUEUE_URL
    };
    const command = new PurgeQueueCommand(params);
    const response = await sqs.send(command);

    assert.strictEqual(response['$metadata'].httpStatusCode, 200);

    await producer.send(
      new Array(cntMessages).fill(0).map((v, i) => `msg-${i}`)
    );

    const size = await producer.queueSize();

    assert.strictEqual(size, cntMessages);
  }
);

Then(
  'the message batch should be consumed without error',
  { timeout: 60 * 1000 },
  async () => waitForProcessing()
);

async function waitForProcessing() {
  consumer.start();

  const isRunning = consumer.isRunning;

  assert.strictEqual(isRunning, true);

  await pEvent(consumer, 'empty');

  consumer.stop();
  await pEvent(consumer, 'stopped');
  assert.strictEqual(consumer.isRunning, false);

  const size = await producer.queueSize();
  assert.strictEqual(size, 0);
}

Given('message batches are sent to the SQS queue', async () => {
  const params = {
    QueueUrl: QUEUE_URL
  };
  const command = new PurgeQueueCommand(params);
  const response = await sqs.send(command);

  assert.strictEqual(response['$metadata'].httpStatusCode, 200);

  await producer.send(['msg1', 'msg2', 'msg3', 'msg4', 'msg5', 'msg6']);

  const size = await producer.queueSize();

  assert.strictEqual(size, 6);
});

Then(
  'the message batches should be consumed without error',
  { timeout: 60 * 1000 },
  async () => waitForProcessing()
);

After(() => {
  return consumer.stop();
});
