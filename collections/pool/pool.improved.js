const DEF_POOL_SIZE = 5;

class AsyncPool {
  #instances = [];
  #captured = [];
  #available = 0;
  #size = 0;
  #current = 0;
  #queue = [];

  constructor(factory, opts = {}) {
    const size = opts.size || DEF_POOL_SIZE;

    let index = 0;
    const error = new Error('Non unique instances not supported');
    while (index < size) {
      const instance = factory();
      if (this.#instances.includes(instance)) throw error;
      this.#instances[index++] = instance;
    }

    this.#size = size;
    this.#captured = new Array(size).fill(false);
    this.#available = size;
  }

  async get() {
    return await (this.#getFreeInstance() || this.#enqueue());
  }

  release(instance) {
    this.#releaseInstance(instance);
    this.#dequeue();
  }

  #getFreeInstance() {
    let instance = null;
    if (this.#available > 0) {
      let index = this.#current;
      while (this.#captured[index]) {
        if (++index === this.#size) index = 0;
      }

      this.#current = index;
      this.#available--;
      this.#captured[index] = true;
      instance = this.#instances[index];
    }
    return instance;
  }

  #releaseInstance(instance) {
    const index = this.#instances.indexOf(instance);
    if (index === -1) {
      throw new Error(`Unable to release ${instance}. Unknown instance`);
    }
    if (this.#captured[index]) {
      this.#captured[index] = false;
      this.#available++;
      this.#current = index;
    }
  }

  #enqueue() {
    return new Promise((resolve) => {
      this.#queue.push(resolve);
    });
  }

  #dequeue() {
    if (this.#queue.length > 0) {
      const instance = this.#getFreeInstance();
      if (instance) {
        const resolve = this.#queue.shift();
        setTimeout(resolve, 0, instance);
      }
    }
  }
}

const factory = () => {
  return { obj: `obj ${++factory.counter}` };
};
factory.counter = 0;

const main = async () => {
  const pool = new AsyncPool(factory, { size: 5 });
  const instances = [];

  setTimeout(() => {
    console.log('Instance 0 released');
    pool.release(instances.shift());
    // pool.get().then((instance) => console.log('OOPS', instance));
  }, 500);

  setTimeout(() => {
    console.log('Instance 1 released');
    pool.release(instances.shift());
    pool.get().then((instance) => console.log('OOPS', instance));
  }, 600);

  for (let i = 0; i < 8; i++) {
    const instance = await pool.get(i);
    console.log({ i, instance });
    instances.push(instance);
  }
};

main();
