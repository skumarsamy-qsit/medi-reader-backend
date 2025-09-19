import { logger } from "./logger.js";

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();
  private activeTimers: Map<string, number> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startTimer(operation: string): void {
    this.activeTimers.set(operation, Date.now());
  }

  endTimer(operation: string): number {
    const startTime = this.activeTimers.get(operation);
    if (!startTime) {
      console.warn(`⚠️ No timer found for operation: ${operation}`);
      return 0;
    }

    const duration = Date.now() - startTime;
    this.activeTimers.delete(operation);
    
    // Store metric
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }
    this.metrics.get(operation)!.push(duration);
    
    // Keep only last 100 measurements
    const measurements = this.metrics.get(operation)!;
    if (measurements.length > 100) {
      measurements.splice(0, measurements.length - 100);
    }

    return duration;
  }

  getAverageTime(operation: string): number {
    const measurements = this.metrics.get(operation);
    if (!measurements || measurements.length === 0) return 0;
    
    return measurements.reduce((sum, time) => sum + time, 0) / measurements.length;
  }

  getMetrics(): Record<string, { average: number; count: number; latest: number }> {
    const result: Record<string, { average: number; count: number; latest: number }> = {};
    
    for (const [operation, measurements] of this.metrics.entries()) {
      if (measurements.length > 0) {
        result[operation] = {
          average: this.getAverageTime(operation),
          count: measurements.length,
          latest: measurements[measurements.length - 1]
        };
      }
    }
    
    return result;
  }

  clearMetrics() {
    this.metrics.clear();
    this.activeTimers.clear();
    logger.debug('Performance metrics cleared', 'PerformanceMonitor');
  }

  getMemoryOptimizedMetrics() {
    // Return only essential metrics to reduce memory usage
    const result: Record<string, { average: number; latest: number }> = {};
    
    for (const [operation, measurements] of this.metrics.entries()) {
      if (measurements.length > 0) {
        result[operation] = {
          average: this.getAverageTime(operation),
          latest: measurements[measurements.length - 1]
        };
      }
    }
    
    return result;
  }

  optimizeMetrics() {
    // Keep only last 20 measurements for each operation
    for (const [operation, measurements] of this.metrics.entries()) {
      if (measurements.length > 20) {
        this.metrics.set(operation, measurements.slice(-20));
      }
    }
    logger.debug('Performance metrics optimized', 'PerformanceMonitor');
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance();