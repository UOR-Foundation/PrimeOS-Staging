/**
 * os-tests Implementation
 * ========
 * 
 * This module implements a standardized testing framework for PrimeOS applications.
 * It follows the standard PrimeOS model pattern.
 * 
 * It also provides mock implementations of core system modules for testing.
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  BaseModel,
  ModelResult,
  ModelLifecycleState
} from '../model';
import {
  TestFrameworkOptions,
  TestFrameworkInterface,
  TestFrameworkState,
  TestableInterface,
  TestResults,
  TestResult,
  TestResultStatus
} from './types';

/**
 * Default options for test framework
 */
const DEFAULT_OPTIONS: TestFrameworkOptions = {
  debug: false,
  name: 'os-tests',
  version: '0.1.0',
  verbose: false,
  failFast: false,
  reportFormat: 'console'
};

/**
 * Main implementation of the testing framework
 */
export class TestFrameworkImplementation extends BaseModel implements TestFrameworkInterface {
  /**
   * Collection of registered modules to test
   */
  private modules: Map<string, TestableInterface> = new Map();
  
  /**
   * Create a new testing framework instance
   */
  constructor(options: TestFrameworkOptions = {}) {
    // Initialize BaseModel with options
    super({ ...DEFAULT_OPTIONS, ...options });
  }
  
  /**
   * Module-specific initialization logic
   */
  protected async onInitialize(): Promise<void> {
    // Initialize state
    this.state.custom = {
      registeredModules: [],
      stats: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        duration: 0
      }
    };
    
    // Log initialization
    await this.logger.debug('Test framework initialized with options', this.options);
  }
  
  /**
   * Register a module to be tested
   */
  register(module: TestableInterface): TestFrameworkInterface {
    const metadata = module.getTestMetadata();
    this.modules.set(metadata.moduleName, module);
    
    // Update state
    const state = this.getState() as TestFrameworkState;
    if (!state.custom) {
      state.custom = {
        registeredModules: []
      };
    }
    state.custom.registeredModules = Array.from(this.modules.keys());
    
    this.logger.info(`Registered module for testing: ${metadata.moduleName}`);
    return this;
  }
  
  /**
   * Run all registered tests
   */
  async runAll(): Promise<Record<string, TestResults>> {
    this.logger.info(`Running tests for ${this.modules.size} registered modules`);
    
    const startTime = Date.now();
    const allResults: Record<string, TestResults> = {};
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    let skippedTests = 0;
    
    for (const [moduleName, module] of this.modules.entries()) {
      this.logger.debug(`Testing module: ${moduleName}`);
      
      // Validate base requirements first
      const baseResult = module.validateBase();
      if (baseResult.status === TestResultStatus.Failed || baseResult.status === TestResultStatus.Error) {
        this.logger.error(`Module ${moduleName} failed base validation: ${baseResult.error}`);
        allResults[moduleName] = { 
          baseValidation: baseResult 
        };
        failedTests += 1;
        totalTests += 1;
        
        if ((this.options as TestFrameworkOptions).failFast) {
          this.logger.warn(`Aborting further tests due to failFast option`);
          break;
        }
        
        continue;
      }
      
      // Run the module's tests
      try {
        const results = await module.runTests();
        allResults[moduleName] = results;
        
        // Count results
        const resultsCount = Object.keys(results).length;
        const passedCount = Object.values(results).filter(r => r.status === TestResultStatus.Passed).length;
        const failedCount = Object.values(results).filter(r => r.status === TestResultStatus.Failed || 
                                                                r.status === TestResultStatus.Error).length;
        const skippedCount = Object.values(results).filter(r => r.status === TestResultStatus.Skipped).length;
        
        totalTests += resultsCount;
        passedTests += passedCount;
        failedTests += failedCount;
        skippedTests += skippedCount;
        
        // Log results summary
        if ((this.options as TestFrameworkOptions).verbose) {
          Object.entries(results).forEach(([testName, result]) => {
            const status = result.status === TestResultStatus.Passed ? 'PASSED' : 
                            result.status === TestResultStatus.Failed ? 'FAILED' :
                            result.status === TestResultStatus.Skipped ? 'SKIPPED' : 
                            result.status === TestResultStatus.Error ? 'ERROR' : 'TIMEOUT';
            
            this.logger.debug(`  ${testName}: ${status}`);
            if (result.status !== TestResultStatus.Passed) {
              this.logger.debug(`    Error: ${result.error}`);
            }
          });
        }
        
        this.logger.info(`Module ${moduleName}: ${passedCount}/${resultsCount} tests passed`);
        
        if (failedCount > 0 && (this.options as TestFrameworkOptions).failFast) {
          this.logger.warn(`Aborting further tests due to failFast option`);
          break;
        }
      } catch (error) {
        this.logger.error(`Error running tests for module ${moduleName}: ${error}`);
        allResults[moduleName] = {
          execution: {
            id: 'execution',
            status: TestResultStatus.Error,
            error: error instanceof Error ? error.message : String(error),
            duration: 0,
            timestamp: Date.now(),
            source: moduleName
          }
        };
        
        failedTests += 1;
        totalTests += 1;
        
        if ((this.options as TestFrameworkOptions).failFast) {
          this.logger.warn(`Aborting further tests due to failFast option`);
          break;
        }
      }
    }
    
    const duration = Date.now() - startTime;
    
    // Update state with results
    const state = this.getState() as TestFrameworkState;
    if (!state.custom) {
      state.custom = {
        registeredModules: []
      };
    }
    state.custom.lastResults = allResults;
    state.custom.stats = {
      total: totalTests,
      passed: passedTests,
      failed: failedTests,
      skipped: skippedTests,
      duration
    };
    
    // Log overall summary
    this.logger.info(`\nTest Summary:`);
    this.logger.info(`  Modules tested: ${Object.keys(allResults).length}`);
    this.logger.info(`  Tests executed: ${totalTests}`);
    this.logger.info(`  Tests passed: ${passedTests}`);
    this.logger.info(`  Tests failed: ${failedTests}`);
    this.logger.info(`  Tests skipped: ${skippedTests}`);
    this.logger.info(`  Total duration: ${duration}ms`);
    this.logger.info(`  Success rate: ${Math.round((passedTests / totalTests) * 100)}%`);
    
    // Generate report if needed
    if ((this.options as TestFrameworkOptions).reportPath) {
      await this.generateReport(allResults);
    }
    
    return allResults;
  }
  
  /**
   * Run tests with specific tags
   */
  async runWithTags(tags: string[]): Promise<Record<string, TestResults>> {
    this.logger.info(`Running tests with tags: ${tags.join(', ')}`);
    
    // Filter modules by tag
    const filteredModules = new Map<string, TestableInterface>();
    for (const [moduleName, module] of this.modules.entries()) {
      const metadata = module.getTestMetadata();
      if (metadata.tags.some(tag => tags.includes(tag))) {
        filteredModules.set(moduleName, module);
      }
    }
    
    const originalModules = this.modules;
    this.modules = filteredModules;
    
    // Run tests
    const results = await this.runAll();
    
    // Restore original modules
    this.modules = originalModules;
    
    return results;
  }
  
  /**
   * Run tests for a specific module
   */
  async runForModule(moduleName: string): Promise<TestResults> {
    const module = this.modules.get(moduleName);
    if (!module) {
      this.logger.error(`Module ${moduleName} not found`);
      const errorResult: TestResult = {
        id: 'module-not-found',
        status: TestResultStatus.Error,
        error: `Module ${moduleName} not found`,
        duration: 0,
        timestamp: Date.now(),
        source: this.options.name || 'os-tests'
      };
      return { 'module-not-found': errorResult };
    }
    
    this.logger.info(`Running tests for module: ${moduleName}`);
    
    // Validate base requirements first
    const baseResult = module.validateBase();
    if (baseResult.status === TestResultStatus.Failed || baseResult.status === TestResultStatus.Error) {
      this.logger.error(`Module ${moduleName} failed base validation: ${baseResult.error}`);
      return { baseValidation: baseResult };
    }
    
    // Run the module's tests
    try {
      const results = await module.runTests();
      
      // Log results
      const resultsCount = Object.keys(results).length;
      const passedCount = Object.values(results).filter(r => r.status === TestResultStatus.Passed).length;
      
      this.logger.info(`Module ${moduleName}: ${passedCount}/${resultsCount} tests passed`);
      
      return results;
    } catch (error) {
      this.logger.error(`Error running tests for module ${moduleName}: ${error}`);
      const errorResult: TestResult = {
        id: 'execution-error',
        status: TestResultStatus.Error,
        error: error instanceof Error ? error.message : String(error),
        duration: 0,
        timestamp: Date.now(),
        source: moduleName
      };
      return { 'execution-error': errorResult };
    }
  }
  
  /**
   * Generate report from test results
   */
  async generateReport(results: Record<string, TestResults>): Promise<string> {
    const format = (this.options as TestFrameworkOptions).reportFormat || 'json';
    const reportPath = (this.options as TestFrameworkOptions).reportPath || `test-report.${format}`;
    
    this.logger.info(`Generating ${format} report at ${reportPath}`);
    
    switch (format) {
      case 'json':
        return this.generateJsonReport(results, reportPath);
      case 'html':
        return this.generateHtmlReport(results, reportPath);
      case 'console':
      default:
        return this.generateConsoleReport(results);
    }
  }
  
  /**
   * Generate JSON report
   */
  private async generateJsonReport(results: Record<string, TestResults>, reportPath: string): Promise<string> {
    const state = this.getState() as TestFrameworkState;
    const report = {
      timestamp: Date.now(),
      framework: {
        name: this.options.name,
        version: this.options.version
      },
      stats: state.custom?.stats || {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        duration: 0
      },
      results
    };
    
    const content = JSON.stringify(report, null, 2);
    fs.writeFileSync(reportPath, content);
    
    return reportPath;
  }
  
  /**
   * Generate HTML report
   */
  private async generateHtmlReport(results: Record<string, TestResults>, reportPath: string): Promise<string> {
    const state = this.getState() as TestFrameworkState;
    const stats = state.custom?.stats as {
      total: number;
      passed: number;
      failed: number;
      skipped: number;
      duration: number;
    } || {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0
    };
    
    // Create simple HTML report
    let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>PrimeOS Test Report</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; }
        .summary { background: #f5f5f5; padding: 10px; border-radius: 5px; margin-bottom: 20px; }
        .module { margin-bottom: 20px; border: 1px solid #ddd; border-radius: 5px; overflow: hidden; }
        .module-header { background: #eee; padding: 10px; font-weight: bold; }
        .test { padding: 10px; border-bottom: 1px solid #eee; }
        .test:last-child { border-bottom: none; }
        .passed { border-left: 5px solid #4CAF50; }
        .failed { border-left: 5px solid #F44336; }
        .skipped { border-left: 5px solid #9E9E9E; }
        .error { border-left: 5px solid #FF9800; }
        .timeout { border-left: 5px solid #9C27B0; }
      </style>
    </head>
    <body>
      <h1>PrimeOS Test Report</h1>
      <div class="summary">
        <h2>Summary</h2>
        <p>Timestamp: ${new Date().toISOString()}</p>
        <p>Framework: ${this.options.name} v${this.options.version}</p>
        <p>Modules tested: ${Object.keys(results).length}</p>
        <p>Tests executed: ${stats.total}</p>
        <p>Tests passed: ${stats.passed}</p>
        <p>Tests failed: ${stats.failed}</p>
        <p>Tests skipped: ${stats.skipped}</p>
        <p>Total duration: ${stats.duration}ms</p>
        <p>Success rate: ${Math.round((stats.passed / (stats.total || 1)) * 100)}%</p>
      </div>
    `;
    
    // Add module results
    for (const [moduleName, moduleResults] of Object.entries(results)) {
      html += `
      <div class="module">
        <div class="module-header">${moduleName}</div>
      `;
      
      for (const [testName, result] of Object.entries(moduleResults)) {
        const statusClass = result.status === TestResultStatus.Passed ? 'passed' : 
                       result.status === TestResultStatus.Failed ? 'failed' :
                       result.status === TestResultStatus.Skipped ? 'skipped' : 
                       result.status === TestResultStatus.Error ? 'error' : 'timeout';
        
        html += `
        <div class="test ${statusClass}">
          <div><strong>${testName}</strong>: ${result.status}</div>
          <div>Duration: ${result.duration}ms</div>
          ${result.error ? `<div>Error: ${result.error}</div>` : ''}
        </div>
        `;
      }
      
      html += `</div>`;
    }
    
    html += `
    </body>
    </html>
    `;
    
    fs.writeFileSync(reportPath, html);
    
    return reportPath;
  }
  
  /**
   * Generate console report
   */
  private async generateConsoleReport(results: Record<string, TestResults>): Promise<string> {
    const state = this.getState() as TestFrameworkState;
    const stats = state.custom?.stats as {
      total: number;
      passed: number;
      failed: number;
      skipped: number;
      duration: number;
    } || {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0
    };
    
    let report = '\nPrimeOS Test Report\n';
    report += '=================\n\n';
    report += `Framework: ${this.options.name} v${this.options.version}\n`;
    report += `Timestamp: ${new Date().toISOString()}\n\n`;
    report += 'Summary:\n';
    report += `  Modules tested: ${Object.keys(results).length}\n`;
    report += `  Tests executed: ${stats.total}\n`;
    report += `  Tests passed: ${stats.passed}\n`;
    report += `  Tests failed: ${stats.failed}\n`;
    report += `  Tests skipped: ${stats.skipped}\n`;
    report += `  Total duration: ${stats.duration}ms\n`;
    report += `  Success rate: ${Math.round((stats.passed / (stats.total || 1)) * 100)}%\n\n`;
    
    // Add module results
    for (const [moduleName, moduleResults] of Object.entries(results)) {
      report += `Module: ${moduleName}\n`;
      report += '----------------------------------------\n';
      
      for (const [testName, result] of Object.entries(moduleResults)) {
        const status = result.status === TestResultStatus.Passed ? 'PASSED' : 
                       result.status === TestResultStatus.Failed ? 'FAILED' :
                       result.status === TestResultStatus.Skipped ? 'SKIPPED' : 
                       result.status === TestResultStatus.Error ? 'ERROR' : 'TIMEOUT';
        
        report += `  ${testName}: ${status}\n`;
        report += `    Duration: ${result.duration}ms\n`;
        if (result.error) {
          report += `    Error: ${result.error}\n`;
        }
        report += '\n';
      }
    }
    
    this.logger.info(report);
    
    return report;
  }
  
  /**
   * Process input data with module-specific logic
   * This is used to run tests via the standard model interface
   */
  protected async onProcess<T = unknown, R = unknown>(input: T): Promise<R> {
    await this.logger.debug('Processing input in test framework', input);
    
    // Handle different input types
    if (typeof input === 'string') {
      // Input can be a module name to test
      if (this.modules.has(input as string)) {
        const results = await this.runForModule(input as string);
        return results as unknown as R;
      }
      
      // Input can be a tag to filter tests
      if ((input as string).startsWith('tag:')) {
        const tag = (input as string).substring(4);
        const results = await this.runWithTags([tag]);
        return results as unknown as R;
      }
      
      // Command to run all tests
      if ((input as string) === 'run-all') {
        const results = await this.runAll();
        return results as unknown as R;
      }
    }
    
    // Input can be an array of tags
    if (Array.isArray(input)) {
      const results = await this.runWithTags(input as string[]);
      return results as unknown as R;
    }
    
    // Input can be an object with specific configuration
    if (input && typeof input === 'object') {
      const config = input as any;
      
      if (config.moduleName) {
        return (await this.runForModule(config.moduleName)) as unknown as R;
      }
      
      if (config.tags) {
        return (await this.runWithTags(config.tags)) as unknown as R;
      }
      
      if (config.reportFormat) {
        (this.options as TestFrameworkOptions).reportFormat = config.reportFormat;
      }
      
      if (config.reportPath) {
        (this.options as TestFrameworkOptions).reportPath = config.reportPath;
      }
      
      if (config.runAll) {
        return (await this.runAll()) as unknown as R;
      }
    }
    
    // Default to running all tests
    const results = await this.runAll();
    return results as unknown as R;
  }
  
  /**
   * Clean up resources when module is reset
   */
  protected async onReset(): Promise<void> {
    // Clear registered modules
    this.modules.clear();
    
    // Reset state
    const state = this.getState() as TestFrameworkState;
    if (!state.custom) {
      state.custom = {
        registeredModules: []
      };
    }
    state.custom.registeredModules = [];
    state.custom.lastResults = undefined;
    state.custom.stats = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0
    };
    
    await this.logger.debug('Test framework reset');
  }
  
  /**
   * Clean up resources when module is terminated
   */
  protected async onTerminate(): Promise<void> {
    // Clear registered modules
    this.modules.clear();
    
    await this.logger.debug('Test framework terminated');
  }
}

/**
 * Create a testing framework instance with the specified options
 */
export function createTestFramework(options: TestFrameworkOptions = {}): TestFrameworkInterface {
  return new TestFrameworkImplementation(options);
}

/**
 * Create and initialize a testing framework instance in a single step
 */
export async function createAndInitializeTestFramework(options: TestFrameworkOptions = {}): Promise<TestFrameworkInterface> {
  const instance = createTestFramework(options);
  const result = await instance.initialize();
  
  if (!result.success) {
    throw new Error(`Failed to initialize testing framework: ${result.error}`);
  }
  
  return instance;
}

/**
 * Helper to convert model results to test results
 */
export function modelResultToTestResult(result: ModelResult, id: string, source: string): TestResult {
  return {
    id,
    status: result.success ? TestResultStatus.Passed : TestResultStatus.Failed,
    data: result.success ? result.data : undefined,
    error: result.success ? undefined : result.error,
    duration: result.duration || 0,
    timestamp: result.timestamp,
    source: source
  };
}

// Export types
// Export test framework types and implementation
export * from './types';

// Export mocks for use in tests across the project
export * from './mocks';
