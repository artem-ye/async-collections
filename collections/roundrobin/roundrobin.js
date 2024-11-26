'use strict';

const { setTimeout } = require('node:timers/promises');

class RoundRobin {
  #instances = [];
  #size = 0;
  #free = 0;
  #current = 0;
  #delay = 0;
  #queue = [];

  constructor(factory, opts = {}) {
    this.#delay = opts.delay ?? 2000;
    const size = opts.size ?? 5;
    this.#size = size;
    this.#free = size;

    this.#instances = new Array(size);
    for (let i = 0; i < size; i++) {
      this.#instances[i] = factory();
    }
  }

  #next() {
    let instance = null;
    if (this.#free > 0) {
      this.#free--;
      instance = this.#instances[this.#current];
      if (++this.#current === this.#size) this.#current = 0;
    }
    return instance;
  }

  #release() {
    this.#free++;
  }

  async #resolve(resolve, instance) {
    await setTimeout(this.#delay);
    resolve(instance);
    console.log(new Date(), instance);
    this.#release();
  }

  #enqueue(resolve) {
    this.#queue.push(resolve);
  }

  #dequeue() {
    if (this.#queue.length > 0 && this.#free > 0) {
      const instance = this.#next();
      const resolve = this.#queue.shift();
      this.#resolve(resolve, instance);
    }
  }

  getInstance() {
    return new Promise((resolve) => {
      const instance = this.#next();
      if (!instance) {
        this.#enqueue(resolve);
      } else {
        this.#resolve(resolve, instance).then(() => this.#dequeue());
      }
    });
  }
}

module.exports = { RoundRobin };
