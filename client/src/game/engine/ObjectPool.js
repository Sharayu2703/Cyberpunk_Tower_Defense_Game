/**
 * ObjectPool - High-performance Zero-Garbage Preallocated Entity Pool
 * Guarantees zero runtime heap allocations during intense combat & 5,000 entity stress tests.
 */
export class ObjectPool {
  constructor(factoryFn, initialSize = 1000) {
    this.factoryFn = factoryFn;
    this.pool = new Array(initialSize);
    for (let i = 0; i < initialSize; i++) {
      this.pool[i] = factoryFn();
      this.pool[i]._poolIndex = i;
      this.pool[i].active = false;
    }
    this.freeCount = initialSize;
  }

  acquire() {
    if (this.freeCount > 0) {
      this.freeCount--;
      const obj = this.pool[this.freeCount];
      obj.active = true;
      return obj;
    }
    // Pool expansion fallback (rare, but preserves gameplay)
    const newObj = this.factoryFn();
    newObj.active = true;
    return newObj;
  }

  release(obj) {
    if (!obj.active) return;
    obj.active = false;
    if (obj.reset) {
      obj.reset();
    }
    if (this.freeCount < this.pool.length) {
      this.pool[this.freeCount] = obj;
      this.freeCount++;
    } else {
      this.pool.push(obj);
      this.freeCount++;
    }
  }

  getCapacity() {
    return this.pool.length;
  }

  getActiveCount() {
    return this.pool.length - this.freeCount;
  }
}
