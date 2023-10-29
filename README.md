# sqs-consumer

[![NPM downloads](https://img.shields.io/npm/dm/@dmitrydigi/sqs-consumer.svg?style=flat)](https://npmjs.org/package/@dmitrydigi/sqs-consumer)
[![Build Status](https://github.com/dmitrydigi/sqs-consumer/actions/workflows/test.yml/badge.svg?branch=main)](https://github.com/dmitrydigi/sqs-consumer/actions/workflows/test.yml)
[![Maintainability](https://api.codeclimate.com/v1/badges/16ec3f59e73bc898b7ff/maintainability)](https://codeclimate.com/github/dmitrydigi/sqs-consumer/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/16ec3f59e73bc898b7ff/test_coverage)](https://codeclimate.com/github/dmitrydigi/sqs-consumer/test_coverage)

Build SQS-based applications without the boilerplate. Just define an async function that handles the SQS message processing.
Note that this fork is a temporary one to provide async messages processing while sqs long polling. It processes messages in parallel to sqs polling,
ie buffers messages by sqs polling and processing the messages asynchronously (maxInflightMessages option controls the buffer size).

## Installation

To install this package, simply enter the following command into your terminal (or the variant of whatever package manager you are using):

```bash
npm install @dmitrydigi/sqs-consumer@0.0.1
```

> **Note**
> This library assumes you are using [AWS SDK v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-sqs/index.html).

### Node version

We will only support Node versions that are actively or security supported by the Node team. If you are still using an Node 14, please use a version of this library before the v7 release, if you are using Node 16, please use a version before the v7.3.0 release.

## Usage

```js
import { Consumer } from 'sqs-consumer';

const app = Consumer.create({
  queueUrl: 'https://sqs.eu-west-1.amazonaws.com/account-id/queue-name',
  handleMessage: async (message) => {
    // do some work with `message`
  }
});

app.on('error', (err) => {
  console.error(err.message);
});

app.on('processing_error', (err) => {
  console.error(err.message);
});

app.start();
```

- The queue is polled continuously for messages using [long polling](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-long-polling.html).
- Messages are deleted from the queue once the handler function has completed successfully.
- Throwing an error (or returning a rejected promise) from the handler function will cause the message to be left on the queue. An [SQS redrive policy](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/SQSDeadLetterQueue.html) can be used to move messages that cannot be processed to a dead letter queue.
- Messages are processed async always. You can control number async processed messages by setting maxInflightMessage [detailed below](#options) (default is 1). To minimize sqs calls, use the `batchSize` option [detailed below](#options).
- By default, messages that are sent to the `handleMessage` and `handleMessageBatch` functions will be considered as processed if they return without an error. To acknowledge individual messages, please return the message that you want to acknowledge if you are using `handleMessage` or the messages for `handleMessageBatch`. It's also important to await any processing that you are doing to ensure message control flow (ie deletion or visibility change on processing end).

### Credentials

By default the consumer will look for AWS credentials in the places [specified by the AWS SDK](https://docs.aws.amazon.com/AWSJavaScriptSDK/guide/node-configuring.html#Setting_AWS_Credentials). The simplest option is to export your credentials as environment variables:

```bash
export AWS_SECRET_ACCESS_KEY=...
export AWS_ACCESS_KEY_ID=...
```

If you need to specify your credentials manually, you can use a pre-configured instance of the [SQS Client](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-sqs/classes/sqsclient.html) client.

```js
import { Consumer } from 'sqs-consumer';
import { SQSClient } from '@aws-sdk/client-sqs';

const app = Consumer.create({
  queueUrl: 'https://sqs.eu-west-1.amazonaws.com/account-id/queue-name',
  handleMessage: async (message) => {
    // ...
  },
  sqs: new SQSClient({
    region: 'my-region',
    credentials: {
      accessKeyId: 'yourAccessKey',
      secretAccessKey: 'yourSecret'
    }
  })
});

app.on('error', (err) => {
  console.error(err.message);
});

app.on('processing_error', (err) => {
  console.error(err.message);
});

app.on('timeout_error', (err) => {
  console.error(err.message);
});

app.start();
```

### AWS IAM Permissions

Consumer will receive and delete messages from the SQS queue. Ensure `sqs:ReceiveMessage`, `sqs:DeleteMessage`, `sqs:DeleteMessageBatch`, `sqs:ChangeMessageVisibility` and `sqs:ChangeMessageVisibilityBatch` access is granted on the queue being consumed.

## API

### `Consumer.create(options)`

Creates a new SQS consumer using the [defined options](https://dmitrydigi.github.io/sqs-consumer/interfaces/ConsumerOptions.html).

### `consumer.start()`

Start polling the queue for messages.

### `consumer.stop(options)`

Stop polling the queue for messages. [You can find the options definition here](https://dmitrydigi.github.io/sqs-consumer/interfaces/StopOptions.html).

By default, the value of `abort` is set to `false` which means pre existing requests to AWS SQS will still be made until they have concluded. If you would like to abort these requests instead, pass the abort value as `true`, like so:

`consumer.stop({ abort: true })`

### `consumer.isRunning`

Returns the current polling state of the consumer: `true` if it is actively polling, `false` if it is not.

### `consumer.updateOption(option, value)`

Updates the provided option with the provided value.

You can [find out more about this here](https://dmitrydigi.github.io/sqs-consumer/classes/Consumer.html#updateOption).

### Events

Each consumer is an [`EventEmitter`](https://nodejs.org/api/events.html) and [emits these events](https://dmitrydigi.github.io/sqs-consumer/interfaces/Events.html).

## Contributing

We welcome and appreciate contributions for anyone who would like to take the time to fix a bug or implement a new feature.

But before you get started, [please read the contributing guidelines](https://github.com/dmitrydigi/sqs-consumer/blob/main/.github/CONTRIBUTING.md) and [code of conduct](https://github.com/dmitrydigi/sqs-consumer/blob/main/.github/CODE_OF_CONDUCT.md).

Note, the fork is created to provide async processing solution, hopefully it will be implemented by the bbc/sqs-consumer at some point.

## License

SQS Consumer is distributed under the Apache License, Version 2.0, see [LICENSE](https://github.com/dmitrydigi/sqs-consumer/blob/main/LICENSE) for more information.
