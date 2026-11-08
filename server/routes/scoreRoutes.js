import express from 'express';
import { getLeaderboard, submitScore } from '../controllers/scoreController.js';

const router = express.Router();

router.get('/', getLeaderboard);
router.post('/', submitScore);

export default router;
