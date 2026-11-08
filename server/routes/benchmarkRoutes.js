import express from 'express';
import { recordBenchmark, getBenchmarks } from '../controllers/benchmarkController.js';

const router = express.Router();

router.post('/', recordBenchmark);
router.get('/', getBenchmarks);

export default router;
