import express from 'express';
import { saveGame, loadGame } from '../controllers/gameController.js';

const router = express.Router();

router.post('/save', saveGame);
router.get('/load/:slotId', loadGame);

export default router;
