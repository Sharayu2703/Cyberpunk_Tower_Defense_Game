/**
 * PerformanceMonitor - Frame telemetry & strict requirement validation
 * Measures 95th percentile frame times, % of frames > 33ms, and memory stability.
 */
export class PerformanceMonitor {
  constructor(sampleSize = 240) {
    this.sampleSize = sampleSize;
    this.frameTimes = new Float32Array(sampleSize);
    this.frameIndex = 0;
    this.totalSamples = 0;

    this.fps = 60;
    this.avgFps = 60;
    this.minFps = 60;
    this.maxFps = 60;
    this.p95FrameTime = 16.6;
    this.pctAbove33ms = 0;

    this.lastTime = performance.now();
    this.framesAbove33 = 0;
    this.updateThrottle = 0;

    // Metrics snapshot
    this.snapshot = {
      fps: 60,
      avgFps: 60,
      minFps: 60,
      p95FrameTime: 16.6,
      pctAbove33ms: 0,
      memoryMB: 0,
      meets45FpsP95: true,
      meets33msRequirement: true,
    };
  }

  recordFrame(now) {
    const delta = now - this.lastTime;
    this.lastTime = now;

    // Protect against background tab pause spikes (>500ms)
    if (delta > 500) return;

    this.frameTimes[this.frameIndex] = delta;
    this.frameIndex = (this.frameIndex + 1) % this.sampleSize;
    this.totalSamples = Math.min(this.sampleSize, this.totalSamples + 1);

    this.updateThrottle++;
    if (this.updateThrottle >= 10) {
      this.updateThrottle = 0;
      this._calculateMetrics();
    }
  }

  _calculateMetrics() {
    if (this.totalSamples === 0) return;

    let sum = 0;
    let minTime = 999999;
    let maxTime = 0;
    let countAbove33 = 0;

    // Create sorted copy for percentile calculation
    const sorted = new Float32Array(this.totalSamples);
    for (let i = 0; i < this.totalSamples; i++) {
      const ft = this.frameTimes[i];
      sorted[i] = ft;
      sum += ft;
      if (ft < minTime) minTime = ft;
      if (ft > maxTime) maxTime = ft;
      if (ft > 33.33) countAbove33++;
    }

    sorted.sort();

    const avgTime = sum / this.totalSamples;
    const p95Index = Math.min(this.totalSamples - 1, Math.floor(this.totalSamples * 0.95));
    const p95Time = sorted[p95Index];

    this.fps = Math.round(1000 / (this.frameTimes[(this.frameIndex - 1 + this.sampleSize) % this.sampleSize] || 16.6));
    this.avgFps = Math.round(1000 / (avgTime || 16.6));
    this.minFps = Math.round(1000 / (maxTime || 16.6));
    this.maxFps = Math.round(1000 / (minTime || 16.6));
    this.p95FrameTime = parseFloat(p95Time.toFixed(2));
    this.pctAbove33ms = parseFloat(((countAbove33 / this.totalSamples) * 100).toFixed(1));

    let memoryMB = 0;
    if (window.performance && window.performance.memory) {
      memoryMB = Math.round(window.performance.memory.usedJSHeapSize / (1024 * 1024));
    }

    // Criteria:
    // 1) Maintain at least 45 FPS for 95% of frames (i.e. P95 frame time <= 1000/45 = 22.2ms)
    // 2) Fewer than 5% of frames may exceed 33ms
    const meets45FpsP95 = this.p95FrameTime <= 22.22;
    const meets33msRequirement = this.pctAbove33ms <= 5.0;

    this.snapshot = {
      fps: this.fps,
      avgFps: this.avgFps,
      minFps: this.minFps,
      p95FrameTime: this.p95FrameTime,
      pctAbove33ms: this.pctAbove33ms,
      memoryMB,
      meets45FpsP95,
      meets33msRequirement,
    };
  }

  getSnapshot() {
    return this.snapshot;
  }

  reset() {
    this.frameIndex = 0;
    this.totalSamples = 0;
    this.lastTime = performance.now();
  }
}
