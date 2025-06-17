/**
 * PerformanceTestingService.ts
 * 
 * Service for benchmarking and testing photo organization performance
 * with various library sizes and configurations.
 */

import type { PhotoReference, OrganizationState } from '../types/organization';
import { PhotoAsset } from '../types/photo';

export interface PerformanceMetrics {
  operationName: string;
  startTime: number;
  endTime: number;
  duration: number;
  photoCount: number;
  memoryUsage?: {
    used: number;
    total: number;
  };
  additionalData?: Record<string, any>;
}

export interface BenchmarkResult {
  testName: string;
  metrics: PerformanceMetrics[];
  summary: {
    totalDuration: number;
    averageDurationPerPhoto: number;
    maxMemoryUsage: number;
    minMemoryUsage: number;
    recommendations: string[];
  };
}

export interface TestConfiguration {
  photoCount: number;
  batchSize: number;
  enableOptimizations: boolean;
  simulateRealDevicePerformance: boolean;
  includeMemoryProfiling: boolean;
}

/**
 * Service for performance testing and benchmarking
 */
class PerformanceTestingService {
  private static instance: PerformanceTestingService;
  private metrics: PerformanceMetrics[] = [];
  private isRunning = false;
  
  private constructor() {}
  
  static getInstance(): PerformanceTestingService {
    if (!PerformanceTestingService.instance) {
      PerformanceTestingService.instance = new PerformanceTestingService();
    }
    return PerformanceTestingService.instance;
  }
  
  /**
   * Run a comprehensive benchmark test
   */
  async runBenchmark(config: TestConfiguration): Promise<BenchmarkResult> {
    if (this.isRunning) {
      throw new Error('Benchmark already running');
    }
    
    this.isRunning = true;
    this.metrics = [];
    
    try {
      const testName = `Benchmark_${config.photoCount}photos_${Date.now()}`;
      
      // Generate synthetic photo data
      const photos = await this.generateSyntheticPhotos(config.photoCount);
      
      // Test initial organization
      await this.measureOperation(
        'Initial Organization',
        () => this.simulateInitialOrganization(photos, config),
        photos.length
      );
      
      // Test incremental updates
      const newPhotos = await this.generateSyntheticPhotos(Math.floor(config.photoCount * 0.1));
      await this.measureOperation(
        'Incremental Update',
        () => this.simulateIncrementalUpdate(newPhotos, config),
        newPhotos.length
      );
      
      // Test category queries
      await this.measureOperation(
        'Category Queries',
        () => this.simulateCategoryQueries(config),
        config.photoCount
      );
      
      // Generate summary
      const summary = this.generateSummary();
      
      return {
        testName,
        metrics: [...this.metrics],
        summary
      };
    } finally {
      this.isRunning = false;
    }
  }
  
  /**
   * Measure a single operation
   */
  async measureOperation<T>(
    operationName: string,
    operation: () => Promise<T> | T,
    photoCount: number
  ): Promise<T> {
    const startTime = performance.now();
    const startMemory = this.getMemoryUsage();
    
    try {
      const result = await operation();
      const endTime = performance.now();
      const endMemory = this.getMemoryUsage();
      
      const metric: PerformanceMetrics = {
        operationName,
        startTime,
        endTime,
        duration: endTime - startTime,
        photoCount,
        memoryUsage: {
          used: endMemory.used,
          total: endMemory.total
        }
      };
      
      this.metrics.push(metric);
      return result;
    } catch (error) {
      const endTime = performance.now();
      
      const metric: PerformanceMetrics = {
        operationName: `${operationName} (Failed)`,
        startTime,
        endTime,
        duration: endTime - startTime,
        photoCount,
        additionalData: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
      
      this.metrics.push(metric);
      throw error;
    }
  }
  
  /**
   * Generate realistic synthetic photo data for testing
   */
  async generateSyntheticPhotos(count: number): Promise<PhotoReference[]> {
    const photos: PhotoReference[] = [];
    const currentYear = new Date().getFullYear();
    
    for (let i = 0; i < count; i++) {
      // Generate random dates within the last 2 years
      const randomDate = new Date(
        currentYear - Math.floor(Math.random() * 2),
        Math.floor(Math.random() * 12),
        Math.floor(Math.random() * 28) + 1
      );
      
      // Generate random source types
      const sourceTypes = ['camera', 'whatsapp', 'instagram', 'screenshots'];
      const randomSource = sourceTypes[Math.floor(Math.random() * sourceTypes.length)];
      
      const photoAsset: PhotoAsset = {
        id: `test_photo_${i}`,
        uri: `file://test/photo_${i}.jpg`,
        width: 1920 + Math.floor(Math.random() * 1080),
        height: 1080 + Math.floor(Math.random() * 720),
        creationTime: randomDate.getTime(),
        fileName: `${randomSource}_photo_${i}.jpg`
      };
      
      photos.push({
        photoId: photoAsset.id,
        photo: photoAsset,
        monthCategoryId: null,
        sourceCategoryId: null,
        organizationScore: Math.random(),
        lastUpdated: Date.now()
      });
    }
    
    return photos;
  }
  
  /**
   * Simulate initial organization process
   */
  private async simulateInitialOrganization(
    photos: PhotoReference[],
    config: TestConfiguration
  ): Promise<void> {
    // Simulate the time it would take to organize photos
    const baseTimePerPhoto = 0.5; // milliseconds
    const simulatedTime = photos.length * baseTimePerPhoto;
    
    if (config.simulateRealDevicePerformance) {
      // Add some realistic processing time
      await this.sleep(Math.min(simulatedTime, 100)); // Cap at 100ms for testing
    }
    
    // Simulate memory allocation for organization structures
    if (config.includeMemoryProfiling) {
      // Create temporary structures to simulate memory usage
      const tempCategories = new Array(photos.length / 10).fill(null).map((_, i) => ({
        id: `category_${i}`,
        photos: photos.slice(i * 10, (i + 1) * 10)
      }));
      
      // Keep reference briefly to ensure memory allocation
      setTimeout(() => {
        tempCategories.length = 0;
      }, 10);
    }
  }
  
  /**
   * Simulate incremental update process
   */
  private async simulateIncrementalUpdate(
    newPhotos: PhotoReference[],
    config: TestConfiguration
  ): Promise<void> {
    const baseTimePerPhoto = 0.3; // Faster than initial organization
    const simulatedTime = newPhotos.length * baseTimePerPhoto;
    
    if (config.simulateRealDevicePerformance) {
      await this.sleep(Math.min(simulatedTime, 50));
    }
  }
  
  /**
   * Simulate category query operations
   */
  private async simulateCategoryQueries(config: TestConfiguration): Promise<void> {
    const queryCount = 10;
    const timePerQuery = 2; // milliseconds
    
    if (config.simulateRealDevicePerformance) {
      await this.sleep(queryCount * timePerQuery);
    }
  }
  
  /**
   * Generate performance summary
   */
  private generateSummary(): BenchmarkResult['summary'] {
    const totalDuration = this.metrics.reduce((sum, metric) => sum + metric.duration, 0);
    const totalPhotos = this.metrics.reduce((sum, metric) => sum + metric.photoCount, 0);
    const averageDurationPerPhoto = totalPhotos > 0 ? totalDuration / totalPhotos : 0;
    
    const memoryUsages = this.metrics
      .filter(m => m.memoryUsage)
      .map(m => m.memoryUsage!.used);
    
    const maxMemoryUsage = Math.max(...memoryUsages, 0);
    const minMemoryUsage = Math.min(...memoryUsages, 0);
    
    const recommendations = this.generateRecommendations();
    
    return {
      totalDuration,
      averageDurationPerPhoto,
      maxMemoryUsage,
      minMemoryUsage,
      recommendations
    };
  }
  
  /**
   * Generate performance recommendations
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    
    const organizationMetric = this.metrics.find(m => m.operationName === 'Initial Organization');
    if (organizationMetric && organizationMetric.duration > 1000) {
      recommendations.push('Consider implementing background organization processing');
    }
    
    const incrementalMetric = this.metrics.find(m => m.operationName === 'Incremental Update');
    if (incrementalMetric && organizationMetric && incrementalMetric.duration > organizationMetric.duration * 0.5) {
      recommendations.push('Incremental updates could be optimized further');
    }
    
    const memoryUsages = this.metrics
      .filter(m => m.memoryUsage)
      .map(m => m.memoryUsage!.used);
    
    if (memoryUsages.length > 0 && Math.max(...memoryUsages) > 100 * 1024 * 1024) {
      recommendations.push('Consider implementing memory optimization strategies');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Performance is within acceptable parameters');
    }
    
    return recommendations;
  }
  
  /**
   * Get current memory usage (simplified for testing)
   */
  private getMemoryUsage(): { used: number; total: number } {
    // In a real React Native environment, you might use:
    // - Performance API
    // - Native bridge to get actual memory stats
    // For now, return mock data
    return {
      used: Math.floor(Math.random() * 50) * 1024 * 1024, // Random MB
      total: 1024 * 1024 * 1024 // 1GB
    };
  }
  
  /**
   * Sleep utility for simulating processing time
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Export metrics to JSON for analysis
   */
  exportMetrics(): string {
    return JSON.stringify({
      timestamp: Date.now(),
      metrics: this.metrics,
      summary: this.generateSummary()
    }, null, 2);
  }
  
  /**
   * Clear all stored metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }
}

/**
 * Predefined test configurations
 */
export const TEST_CONFIGURATIONS = {
  SMALL_LIBRARY: {
    photoCount: 100,
    batchSize: 25,
    enableOptimizations: true,
    simulateRealDevicePerformance: false,
    includeMemoryProfiling: true
  } as TestConfiguration,
  
  MEDIUM_LIBRARY: {
    photoCount: 1000,
    batchSize: 50,
    enableOptimizations: true,
    simulateRealDevicePerformance: true,
    includeMemoryProfiling: true
  } as TestConfiguration,
  
  LARGE_LIBRARY: {
    photoCount: 5000,
    batchSize: 100,
    enableOptimizations: true,
    simulateRealDevicePerformance: true,
    includeMemoryProfiling: true
  } as TestConfiguration
};

// Singleton instance export
export const performanceTestingService = PerformanceTestingService.getInstance(); 