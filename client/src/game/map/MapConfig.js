/**
 * MapConfig - Tactical Cyberpunk Circuit Grid
 * 1440x810 virtual coordinate space scaled smoothly to canvas
 */
export const MAP_WIDTH = 1440;
export const MAP_HEIGHT = 810;
export const CELL_SIZE = 45; // 32 columns x 18 rows
export const COLS = Math.floor(MAP_WIDTH / CELL_SIZE);
export const ROWS = Math.floor(MAP_HEIGHT / CELL_SIZE);

// Base Core location
export const BASE_CORE = {
  x: 1350,
  y: 405,
  radius: 42,
  gridX: 30,
  gridY: 9,
};

// Spawn Portals (Warp Gates)
export const SPAWN_PORTALS = [
  { id: 'alpha', x: 45, y: 180, name: 'WARP-GATE ALPHA', color: '#06b6d4' },
  { id: 'beta', x: 45, y: 630, name: 'WARP-GATE BETA', color: '#ec4899' },
];

// Dual-Lane High-Tech Path Waypoints
export const WAYPOINTS_LANE_A = [
  { x: 45, y: 180 },
  { x: 315, y: 180 },
  { x: 315, y: 360 },
  { x: 585, y: 360 },
  { x: 585, y: 180 },
  { x: 945, y: 180 },
  { x: 945, y: 405 },
  { x: 1350, y: 405 },
];

export const WAYPOINTS_LANE_B = [
  { x: 45, y: 630 },
  { x: 360, y: 630 },
  { x: 360, y: 450 },
  { x: 675, y: 450 },
  { x: 675, y: 630 },
  { x: 1080, y: 630 },
  { x: 1080, y: 405 },
  { x: 1350, y: 405 },
];

/**
 * Precomputes path segments, lengths, and cumulative distance along path
 */
export function processPathWaypoints(waypoints) {
  const segments = [];
  let totalLength = 0;

  for (let i = 0; i < waypoints.length - 1; i++) {
    const p1 = waypoints[i];
    const p2 = waypoints[i + 1];
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.hypot(dx, dy);
    segments.push({
      p1,
      p2,
      dx,
      dy,
      dirX: len > 0 ? dx / len : 0,
      dirY: len > 0 ? dy / len : 0,
      length: len,
      startDist: totalLength,
      endDist: totalLength + len,
    });
    totalLength += len;
  }

  return { waypoints, segments, totalLength };
}

export const PATH_DATA_A = processPathWaypoints(WAYPOINTS_LANE_A);
export const PATH_DATA_B = processPathWaypoints(WAYPOINTS_LANE_B);

/**
 * Precomputes grid tiles: 0 = buildable, 1 = path, 2 = obstacle, 3 = base core
 */
export function generateGridMap() {
  const grid = new Uint8Array(COLS * ROWS);

  // Mark paths as non-buildable
  const markPath = (waypoints) => {
    for (let i = 0; i < waypoints.length - 1; i++) {
      const p1 = waypoints[i];
      const p2 = waypoints[i + 1];
      const minX = Math.min(p1.x, p2.x);
      const maxX = Math.max(p1.x, p2.x);
      const minY = Math.min(p1.y, p2.y);
      const maxY = Math.max(p1.y, p2.y);

      const minCol = Math.max(0, Math.floor((minX - 25) / CELL_SIZE));
      const maxCol = Math.min(COLS - 1, Math.floor((maxX + 25) / CELL_SIZE));
      const minRow = Math.max(0, Math.floor((minY - 25) / CELL_SIZE));
      const maxRow = Math.min(ROWS - 1, Math.floor((maxY + 25) / CELL_SIZE));

      for (let r = minRow; r <= maxRow; r++) {
        for (let c = minCol; c <= maxCol; c++) {
          grid[r * COLS + c] = 1; // Path tile
        }
      }
    }
  };

  markPath(WAYPOINTS_LANE_A);
  markPath(WAYPOINTS_LANE_B);

  // Mark base core area
  const baseCol = Math.floor(BASE_CORE.x / CELL_SIZE);
  const baseRow = Math.floor(BASE_CORE.y / CELL_SIZE);
  for (let r = baseRow - 1; r <= baseRow + 1; r++) {
    for (let c = baseCol - 1; c <= baseCol + 1; c++) {
      if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
        grid[r * COLS + c] = 3; // Base core
      }
    }
  }

  // Mark a few tactical obstacles / power conduits
  const obstacles = [
    { c: 4, r: 8 }, { c: 5, r: 8 },
    { c: 10, r: 2 }, { c: 11, r: 2 },
    { c: 18, r: 7 }, { c: 18, r: 8 },
    { c: 24, r: 3 }, { c: 24, r: 14 }
  ];
  for (const obs of obstacles) {
    if (obs.c >= 0 && obs.c < COLS && obs.r >= 0 && obs.r < ROWS) {
      if (grid[obs.r * COLS + obs.c] === 0) {
        grid[obs.r * COLS + obs.c] = 2; // Obstacle
      }
    }
  }

  return grid;
}
