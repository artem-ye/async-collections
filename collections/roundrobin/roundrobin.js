'use strict';

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

  #resolve(resolve, instance) {
    const handler = () => {
      resolve(instance);
      this.#release();
      this.#dequeue();
      console.log(Date(), instance);
    };
    setTimeout(handler, this.#delay);
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
      instance ? this.#resolve(resolve, instance) : this.#enqueue(resolve);
    });
  }
}

const factory = () => ({
  instance: factory.counter ? ++factory.counter : (factory.counter = 1),
});

const main = async () => {
  const collection = new RoundRobin(factory, { size: 3 });
  const promises = [];
  for (let i = 0; i < 5; i++) {
    const instance = collection.getInstance();
    promises.push(instance);
  }
  Promise.all(promises);
};

main();
