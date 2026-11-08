import { Score } from '../models/Score.js';
import { getDBStatus } from '../config/db.js';

// In-memory fallback
let memoryScores = [
  { _id: '1', playerName: 'NEXUS-PRIME', score: 98500, waveReached: 50, enemiesKilled: 4820, isVictory: true, timestamp: new Date(Date.now() - 3600000) },
  { _id: '2', playerName: 'CYBER-VALKYRIE', score: 72400, waveReached: 44, enemiesKilled: 3950, isVictory: false, timestamp: new Date(Date.now() - 7200000) },
  { _id: '3', playerName: 'VOID-PHANTOM', score: 54100, waveReached: 38, enemiesKilled: 2900, isVictory: false, timestamp: new Date(Date.now() - 10800000) },
  { _id: '4', playerName: 'GLITCH-HUNTER', score: 41200, waveReached: 30, enemiesKilled: 2100, isVictory: false, timestamp: new Date(Date.now() - 14400000) },
  { _id: '5', playerName: 'GRID-RUNNER', score: 28900, waveReached: 22, enemiesKilled: 1450, isVictory: false, timestamp: new Date(Date.now() - 18000000) },
];

export const getLeaderboard = async (req, res) => {
  try {
    const { connected } = getDBStatus();
    if (connected) {
      const scores = await Score.find().sort({ score: -1 }).limit(20).lean();
      return res.json({ success: true, source: 'mongodb', data: scores });
    }
    const sorted = [...memoryScores].sort((a, b) => b.score - a.score).slice(0, 20);
    return res.json({ success: true, source: 'memory', data: sorted });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const submitScore = async (req, res) => {
  try {
    const { playerName, score, waveReached, enemiesKilled, towersBuilt, isVictory, durationSeconds, difficulty } = req.body;
    const scoreData = {
      playerName: playerName || 'CYBER-OPERATIVE',
      score: Number(score) || 0,
      waveReached: Number(waveReached) || 1,
      enemiesKilled: Number(enemiesKilled) || 0,
      towersBuilt: Number(towersBuilt) || 0,
      isVictory: Boolean(isVictory),
      durationSeconds: Number(durationSeconds) || 0,
      difficulty: difficulty || 'normal',
      timestamp: new Date(),
    };

    const { connected } = getDBStatus();
    if (connected) {
      const newScore = await Score.create(scoreData);
      return res.status(201).json({ success: true, source: 'mongodb', data: newScore });
    }

    const memoryRecord = { _id: String(Date.now()), ...scoreData };
    memoryScores.push(memoryRecord);
    return res.status(201).json({ success: true, source: 'memory', data: memoryRecord });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
