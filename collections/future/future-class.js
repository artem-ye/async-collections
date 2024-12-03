'use strict';

class Future {
  #executor = null;

  constructor(executor) {
    this.#executor = executor;
  }

  static of(value) {
    return new Future((resolve) => resolve(value));
  }

  chain(fn) {
    return new Future((resolve) => this.fork((v) => fn(v).fork(resolve)));
  }

  map(fn) {
    return this.chain((v) => Future.of(fn(v)));
  }

  fork(resolve) {
    this.#executor(resolve);
  }
}

Future.of(5)
  .map((v) => v + 2)
  .map((v) => (console.log({ map: 1, v }), v))
  .map((v) => v + 2)
  .map((v) => (console.log({ map: 2, v }), v))
  .fork((v) => console.log({ v }));
