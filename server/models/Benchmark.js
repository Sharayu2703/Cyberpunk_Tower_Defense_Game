import mongoose from 'mongoose';

const benchmarkSchema = new mongoose.Schema({
  mode: {
    type: String, // 'naive' or 'optimized'
    required: true,
  },
  activeEnemies: {
    type: Number,
    required: true,
  },
  activeTowers: {
    type: Number,
    required: true,
  },
  activeProjectiles: {
    type: Number,
    required: true,
  },
  avgFps: {
    type: Number,
    required: true,
  },
  minFps: {
    type: Number,
  },
  frameTimeP95: {
    type: Number, // 95th percentile in ms
    required: true,
  },
  pctFramesAbove33ms: {
    type: Number, // % of frames > 33ms
    required: true,
  },
  hardwareInfo: {
    type: String,
    default: 'Browser UserAgent',
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

export const Benchmark = mongoose.models.Benchmark || mongoose.model('Benchmark', benchmarkSchema);
