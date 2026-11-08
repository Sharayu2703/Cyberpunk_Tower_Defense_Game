import mongoose from 'mongoose';

const gameStateSchema = new mongoose.Schema({
  slotId: {
    type: String,
    required: true,
    unique: true,
    default: 'autosave',
  },
  playerName: {
    type: String,
    default: 'CYBER-OPERATIVE',
  },
  wave: {
    type: Number,
    required: true,
    default: 1,
  },
  health: {
    type: Number,
    required: true,
    default: 100,
  },
  energy: {
    type: Number,
    required: true,
    default: 450,
  },
  score: {
    type: Number,
    required: true,
    default: 0,
  },
  towers: [
    {
      id: String,
      type: { type: String },
      gridX: Number,
      gridY: Number,
      level: Number,
      targetingMode: String,
      totalInvested: Number,
      kills: Number,
      damageDealt: Number,
    },
  ],
  savedAt: {
    type: Date,
    default: Date.now,
  },
});

export const GameState = mongoose.models.GameState || mongoose.model('GameState', gameStateSchema);
