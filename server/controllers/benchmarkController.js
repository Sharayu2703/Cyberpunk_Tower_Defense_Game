import { Benchmark } from '../models/Benchmark.js';
import { getDBStatus } from '../config/db.js';

let memoryBenchmarks = [];

export const recordBenchmark = async (req, res) => {
  try {
    const { mode, activeEnemies, activeTowers, activeProjectiles, avgFps, minFps, frameTimeP95, pctFramesAbove33ms, hardwareInfo } = req.body;
    const benchData = {
      mode: mode || 'optimized',
      activeEnemies: Number(activeEnemies) || 0,
      activeTowers: Number(activeTowers) || 0,
      activeProjectiles: Number(activeProjectiles) || 0,
      avgFps: Number(avgFps) || 0,
      minFps: Number(minFps) || 0,
      frameTimeP95: Number(frameTimeP95) || 0,
      pctFramesAbove33ms: Number(pctFramesAbove33ms) || 0,
      hardwareInfo: hardwareInfo || 'Browser Client',
      timestamp: new Date(),
    };

    const { connected } = getDBStatus();
    if (connected) {
      const saved = await Benchmark.create(benchData);
      return res.status(201).json({ success: true, source: 'mongodb', data: saved });
    }

    const memoryRecord = { _id: String(Date.now()), ...benchData };
    memoryBenchmarks.unshift(memoryRecord);
    if (memoryBenchmarks.length > 50) memoryBenchmarks.pop();
    return res.status(201).json({ success: true, source: 'memory', data: memoryRecord });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const getBenchmarks = async (req, res) => {
  try {
    const { connected } = getDBStatus();
    if (connected) {
      const records = await Benchmark.find().sort({ timestamp: -1 }).limit(20).lean();
      return res.json({ success: true, source: 'mongodb', data: records });
    }
    return res.json({ success: true, source: 'memory', data: memoryBenchmarks });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
