'use strict';

const future = (executor) => ({
  fork(cb) {
    executor(cb);
  },
  chain(fn) {
    return future((resolve) => this.fork((v) => fn(v).fork(resolve)));
  },
  map(fn) {
    return this.chain((v) => future.of(fn(v)));
  },
});
future.of = (value) => future((cb) => cb(value));

future
  .of(5)
  .map((v) => v + 2)
  .map((v) => v + 3)
  .fork(console.log);
