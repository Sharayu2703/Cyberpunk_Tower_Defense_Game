/**
 * SpatialHashGrid - Ultra-High Performance 2D Spatial Partitioning
 * Provides O(1) average time complexity for proximity and collision queries
 * Eliminates O(N*M) naive distance loops over 5,000+ enemies.
 */
export class SpatialHashGrid {
  constructor(cellSize = 64, boundsWidth = 1600, boundsHeight = 1000) {
    this.cellSize = cellSize;
    this.invCellSize = 1 / cellSize;
    this.cols = Math.ceil(boundsWidth / cellSize) + 1;
    this.rows = Math.ceil(boundsHeight / cellSize) + 1;
    this.totalCells = this.cols * this.rows;

    // Use contiguous array of arrays for buckets
    this.grid = new Array(this.totalCells);
    for (let i = 0; i < this.totalCells; i++) {
      this.grid[i] = [];
    }

    // Reusable query buffer to prevent array allocation during game loop
    this.queryBuffer = [];
    this.querySet = new Set(); // For de-duplication in multi-cell spans
  }

  clear() {
    for (let i = 0; i < this.totalCells; i++) {
      this.grid[i].length = 0;
    }
  }

  _getKey(x, y) {
    const col = Math.max(0, Math.min(this.cols - 1, Math.floor(x * this.invCellSize)));
    const row = Math.max(0, Math.min(this.rows - 1, Math.floor(y * this.invCellSize)));
    return row * this.cols + col;
  }

  insert(entity) {
    const key = this._getKey(entity.x, entity.y);
    entity._gridKey = key;
    this.grid[key].push(entity);
  }

  remove(entity) {
    if (entity._gridKey === undefined) return;
    const bucket = this.grid[entity._gridKey];
    if (!bucket) return;
    const idx = bucket.indexOf(entity);
    if (idx !== -1) {
      // Fast swap-and-pop O(1) removal
      const last = bucket.pop();
      if (idx < bucket.length) {
        bucket[idx] = last;
      }
    }
    entity._gridKey = undefined;
  }

  update(entity) {
    const newKey = this._getKey(entity.x, entity.y);
    if (entity._gridKey !== newKey) {
      this.remove(entity);
      entity._gridKey = newKey;
      this.grid[newKey].push(entity);
    }
  }

  /**
   * Fast Radius Query - returns entities within circle
   * Populates reusable queryBuffer to ensure 0 GC pressure
   */
  queryRadius(x, y, radius) {
    this.queryBuffer.length = 0;
    const r2 = radius * radius;

    const minCol = Math.max(0, Math.floor((x - radius) * this.invCellSize));
    const maxCol = Math.min(this.cols - 1, Math.floor((x + radius) * this.invCellSize));
    const minRow = Math.max(0, Math.floor((y - radius) * this.invCellSize));
    const maxRow = Math.min(this.rows - 1, Math.floor((y + radius) * this.invCellSize));

    for (let row = minRow; row <= maxRow; row++) {
      const rowOffset = row * this.cols;
      for (let col = minCol; col <= maxCol; col++) {
        const bucket = this.grid[rowOffset + col];
        const len = bucket.length;
        for (let i = 0; i < len; i++) {
          const entity = bucket[i];
          if (!entity.active || entity.dead) continue;
          const dx = entity.x - x;
          const dy = entity.y - y;
          if (dx * dx + dy * dy <= r2) {
            this.queryBuffer.push(entity);
          }
        }
      }
    }

    return this.queryBuffer;
  }

  /**
   * Fast Box / Viewport Query - returns entities within rect
   */
  queryBox(minX, minY, maxX, maxY) {
    this.queryBuffer.length = 0;
    const minCol = Math.max(0, Math.floor(minX * this.invCellSize));
    const maxCol = Math.min(this.cols - 1, Math.floor(maxX * this.invCellSize));
    const minRow = Math.max(0, Math.floor(minY * this.invCellSize));
    const maxRow = Math.min(this.rows - 1, Math.floor(maxY * this.invCellSize));

    for (let row = minRow; row <= maxRow; row++) {
      const rowOffset = row * this.cols;
      for (let col = minCol; col <= maxCol; col++) {
        const bucket = this.grid[rowOffset + col];
        const len = bucket.length;
        for (let i = 0; i < len; i++) {
          const entity = bucket[i];
          if (entity.active && !entity.dead) {
            this.queryBuffer.push(entity);
          }
        }
      }
    }
    return this.queryBuffer;
  }
}
