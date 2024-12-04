'use strict';

const { setTimeout: setTimeoutAsync } = require('node:timers/promises');
const nop = () => {};

class Queue {
  #concurrency = 0;
  #pendingTimeout = Infinity;
  #execTimeout = Infinity;

  #handler = null;
  #onDone = null;
  #onSuccess = null;
  #onFailure = null;
  #onDrain = null;

  #free = 0;
  #queue = [];

  constructor(options) {
    this.#free = this.#concurrency = options.concurrency || 5;
    this.#pendingTimeout = options.pendingTimeout || Infinity;
    this.#execTimeout = options.execTimeout || Infinity;

    const { execute, done, success, failure, drain } = options;
    this.#handler = execute;
    this.#onDone = done || nop;
    this.#onSuccess = success || nop;
    this.#onFailure = failure || nop;
    this.#onDrain = drain || nop;
  }

  async add(payload) {
    if (this.#free < 1) return void this.#enqueue(payload);

    await this.#feed(payload);
    this.#dequeue();
  }

  async #feed(payload) {
    this.#free--;
    await this.#process(payload);
  }

  #enqueue(payload) {
    const task = {
      payload,
      timeStamp: Date.now(),
    };
    this.#queue.push(task);
  }

  #dequeue() {
    if (this.#queue.length === 0 || this.#free < 1) return;

    const { payload, timeStamp } = this.#queue.shift();
    if (Date.now() - timeStamp > this.#pendingTimeout) {
      this.#resolve(new Error('Pending timout'), payload);
      this.#dequeue();
    }

    this.#free--;
    setTimeout(() => {
      this.#process(payload);
    }, 0);
  }

  async #process(payload) {
    // let done = false;
    // let timer = null;

    // const resolve = (err, result) => {
    //   if (done) return;
    //   done = true;

    //   if (timer !== null) {
    //     clearInterval(timer);
    //     timer = null;
    //   }

    //   this.#resolve(err, payload, result);
    // };

    // if (this.#execTimeout !== Infinity) {
    //   timer = setTimeout(() => {
    //     timer = null;
    //     resolve(new Error('Exec timeout'));
    //   }, this.#execTimeout);
    // }

    // try {
    //   const result = await this.#handler(payload);
    //   resolve(null, result);
    // } catch (err) {
    //   resolve(err);
    // }

    await this.#execute(payload)
      .then((res) => this.#resolve(null, payload, res))
      .catch((err) => this.#resolve(err, payload));

    this.#free++;
    if (this.#free === this.#concurrency && this.#queue.length === 0) {
      this.#onDrain();
    }
  }

  async #execute(payload) {
    const { promise, resolve, reject } = Promise.withResolvers();
    let finished = false;
    let timer = null;

    const done = (err, result) => {
      if (finished) return;
      finished = true;

      if (timer !== null) {
        clearInterval(timer);
        timer = null;
      }

      err ? reject(err) : resolve(result);
    };

    if (this.#execTimeout !== Infinity) {
      timer = setTimeout(() => {
        timer = null;
        done(new Error('Exec timeout'));
      }, this.#execTimeout);
    }

    try {
      const result = await this.#handler(payload);
      done(null, result);
    } catch (err) {
      done(err);
    }

    return promise;
  }

  #resolve(error, payload, result) {
    error ? this.#onFailure(error, payload) : this.#onSuccess(result);
    this.#onDone(error, payload);
  }
}

const queue = new Queue({
  concurrency: 3,
  pendingTimeout: 200,
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
  const task = { name: `Task${i}`, interval: i * 100 };
  console.log('Add:', task);
  queue.add(task);
}

// main();
