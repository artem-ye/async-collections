'use strict';

class CircularList {
  #mask = 0;
  #head = 0;
  #tail = 0;
  #list = [];

  constructor(mask = 0b111111111) {
    this.#mask = mask;
    this.#list = new Array(mask + 1).fill(null);
  }

  // Turns least significant bits to 1
  static alignMask(n) {
    let mask = 1;
    let i = 1;
    while ((n >>= 1) > 0) {
      mask |= 1 << i++;
    }
    return mask;
  }

  isEmpty() {
    return this.#head === this.#tail;
  }

  isFull() {
    return ((this.#tail + 1) & this.#mask) === this.#head;
  }

  get length() {
    const n = this.#mask + 1;
    return (n + this.#tail - this.#head) % n;
  }

  get list() {
    return this.#list;
  }

  push(value) {
    this.#list[this.#tail] = value;
    this.#tail = (this.#tail + 1) & this.#mask;
  }

  shift() {
    const val = this.#list[this.#head];
    if (this.#head !== this.#tail) {
      this.#list[this.#head] = null;
      this.#head = (this.#head + 1) & this.#mask;
    }
    return val;
  }

  *[Symbol.iterator]() {
    for (let i = this.#head; i !== this.#tail; i = (i + 1) & this.#mask) {
      yield this.#list[i];
    }
  }
}

module.exports = { CircularList };
