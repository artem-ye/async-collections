'use strict';

const { setTimeout: setTimeoutAsync } = require('node:timers/promises');
const nop = () => {};

class Queue {
  #concurrency = 0;
  #handler = null;
  #onDone = null;
  #onSuccess = null;
  #onFailure = null;
  #onDrain = null;

  #free = 0;
  #queue = [];

  constructor(options) {
    this.#free = this.#concurrency = options.concurrency || 5;

    const { execute, done, success, failure, drain } = options;
    this.#handler = execute;
    this.#onDone = done || nop;
    this.#onSuccess = success || nop;
    this.#onFailure = failure || nop;
    this.#onDrain = drain || nop;
  }

  async add(payload) {
    if (this.#free < 1) return void this.#queue.push(payload);

    await this.#feed(payload);
    if (this.#queue.length > 0 && this.#free > 0) this.#dequeue();
  }

  async #feed(payload) {
    this.#free--;
    await this.#process(payload);
  }

  #dequeue() {
    this.#free--;
    setTimeout(() => {
      const payload = this.#queue.shift();
      this.#process(payload);
    }, 0);
  }

  async #process(payload) {
    let error = null;
    let result = undefined;
    try {
      result = await this.#handler(payload);
    } catch (err) {
      error = err;
    }
    error ? this.#onFailure(error, payload) : this.#onSuccess(result);
    this.#onDone(error, payload);

    this.#free++;
    if (this.#free === this.#concurrency && this.#queue.length === 0) {
      this.#onDrain();
    }
  }
}

const queue = new Queue({
  concurrency: 3,
  execute: async (payload) => await setTimeoutAsync(payload.interval, payload),
  done: (error, task) => {
    console.log('Done:', { error, task });
  },
  success: (task) => {
    console.log('Success:', { task });
  },
  failure: (err, task) => {
    console.log('Failure:', { err, task });
  },
  drain: () => {
    console.log('Queue drain');
  },
});

// const main = async () => {
//   for (let i = 0; i < 10; i++) {
//     const task = { name: `Task${i}`, interval: i * 10 };
//     console.log('Add:', task);
//     await queue.add(task);
//   }
// };

for (let i = 0; i < 10; i++) {
  const task = { name: `Task${i}`, interval: i * 10 };
  console.log('Add:', task);
  queue.add(task);
}

// main();
