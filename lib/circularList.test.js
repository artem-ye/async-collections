'use strict';

const { it, describe } = require('node:test');
const assert = require('node:assert');
const { CircularList } = require('./circularList.js');

describe('CircularList tests', () => {
  it('List initialized correctly', () => {
    const MASK = 0b11; // 3
    const list = new CircularList(MASK);
    assert.strictEqual(list.list.length, MASK + 1);
    assert.equal(
      list.list.every((v) => v === null),
      true,
    );
    assert.strictEqual(list.isEmpty(), true);
    assert.strictEqual(list.isFull(), false);
    assert.strictEqual(list.length, 0);
  });

  it('Iterator for of', () => {
    const MASK = 0b11;
    const list = new CircularList(MASK);

    const values = [];
    while (!list.isFull()) {
      const v = values.length;
      values.push(v);
      list.push(v);
    }

    assert.strictEqual(list.length, MASK);

    for (const e of list) {
      const v = values.shift();
      assert.strictEqual(e, v);
    }
    assert.strictEqual(values.length, 0);
  });

  it('Push', () => {
    const MASK = 0b11; // 3
    const list = new CircularList(MASK);

    for (let i = 0; i < MASK; i++) {
      list.push(i);
      assert.strictEqual(list.length, i + 1);
      assert.strictEqual(list.isEmpty(), false);

      if (i + 1 === MASK) assert.strictEqual(list.isFull(), true);
      else assert.strictEqual(list.isFull(), false);
    }
  });

  it('Shift', () => {
    const MASK = 0b11; // 3
    const list = new CircularList(MASK);

    for (let i = 0; i < MASK; i++) {
      list.push(i);
    }
    for (let i = 0; i < MASK; i++) {
      assert.strictEqual(list.shift(), i);
      assert.strictEqual(list.length, 3 - (i + 1));
      if (list.length === MASK) assert.strictEqual(list.isFull(), true);
      else assert.strictEqual(list.isFull(), false);
    }
  });

  it('Shift empty list - no effects', () => {
    const MASK = 0b1;
    const list = new CircularList(MASK);

    assert.strictEqual(list.shift(), null);
    assert.strictEqual(list.isEmpty(), true);
    assert.strictEqual(list.isFull(), false);
    assert.strictEqual(list.length, 0);
  });
});
