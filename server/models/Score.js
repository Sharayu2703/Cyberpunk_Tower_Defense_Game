import mongoose from 'mongoose';

const scoreSchema = new mongoose.Schema({
  playerName: {
    type: String,
    required: true,
    trim: true,
    default: 'CYBER-OPERATIVE',
  },
  score: {
    type: Number,
    required: true,
    default: 0,
  },
  waveReached: {
    type: Number,
    required: true,
    default: 1,
  },
  enemiesKilled: {
    type: Number,
    default: 0,
  },
  towersBuilt: {
    type: Number,
    default: 0,
  },
  isVictory: {
    type: Boolean,
    default: false,
  },
  durationSeconds: {
    type: Number,
    default: 0,
  },
  difficulty: {
    type: String,
    enum: ['normal', 'hardcore', 'stress_test'],
    default: 'normal',
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

export const Score = mongoose.models.Score || mongoose.model('Score', scoreSchema);
