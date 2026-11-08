import { GameState } from '../models/GameState.js';
import { getDBStatus } from '../config/db.js';

let memorySaves = {};

export const saveGame = async (req, res) => {
  try {
    const { slotId = 'autosave', playerName, wave, health, energy, score, towers } = req.body;
    const stateData = {
      slotId,
      playerName: playerName || 'CYBER-OPERATIVE',
      wave: Number(wave) || 1,
      health: Number(health) || 100,
      energy: Number(energy) || 450,
      score: Number(score) || 0,
      towers: towers || [],
      savedAt: new Date(),
    };

    const { connected } = getDBStatus();
    if (connected) {
      const saved = await GameState.findOneAndUpdate(
        { slotId },
        stateData,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      return res.json({ success: true, source: 'mongodb', data: saved });
    }

    memorySaves[slotId] = stateData;
    return res.json({ success: true, source: 'memory', data: stateData });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const loadGame = async (req, res) => {
  try {
    const { slotId = 'autosave' } = req.params;
    const { connected } = getDBStatus();

    if (connected) {
      const state = await GameState.findOne({ slotId }).lean();
      if (!state) {
        return res.status(404).json({ success: false, message: 'Save state not found' });
      }
      return res.json({ success: true, source: 'mongodb', data: state });
    }

    const state = memorySaves[slotId];
    if (!state) {
      return res.status(404).json({ success: false, message: 'Save state not found' });
    }
    return res.json({ success: true, source: 'memory', data: state });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
