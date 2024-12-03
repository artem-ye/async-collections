'use strict';

const future = (executor) => ({
  fork(cb) {
    executor(cb);
    return this;
  },
});

future.of = (value) => future((cb) => cb(value));

future((r) => r(5)).fork(console.log);
// future.of(5).fork((resolve) => console.log(resolve));
