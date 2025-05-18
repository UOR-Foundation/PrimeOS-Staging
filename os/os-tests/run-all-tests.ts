#!/usr/bin/env node

/**
 * PrimeOS Test Runner
 * ===================
 * 
 * This script discovers and runs tests for all PrimeOS modules that implement
 * the TestableInterface. It uses the testing framework to execute tests and
 * generate reports.
 */

import * as fs from 'fs';
import * as path from 'path';
import { 
  createTestFramework, 
  TestableInterface,
  TestResultStatus,
  TestResult
} from './index';

// Parse command line arguments
const args = process.argv.slice(2).reduce((acc: Record<string, any>, arg) => {
  if (arg.startsWith('--')) {
    const [key, value] = arg.slice(2).split('=');
    acc[key] = value || true;
  }
  return acc;
}, {});

const ROOT_DIR = path.resolve(__dirname, '../../');
const VERBOSE = args.verbose === 'true' || args.verbose === true;
const FAIL_FAST = args.failFast === 'true' || args.failFast === true;
const REPORT_FORMAT = args.reportFormat || 'console';
const REPORT_PATH = args.reportPath || '';
const FILTER_TAGS = args.tags ? args.tags.split(',') : [];
const FILTER_MODULES = args.modules ? args.modules.split(',') : [];

/**
 * Main test runner
 */
async function main() {
  console.log('PrimeOS Test Runner');
  console.log('===================');
  console.log(`Root directory: ${ROOT_DIR}`);
  
  try {
    // Initialize the test framework
    const framework = createTestFramework({
      name: 'primeos-tests',
      version: '0.1.0',
      debug: VERBOSE,
      verbose: VERBOSE,
      failFast: FAIL_FAST,
      reportFormat: REPORT_FORMAT as any,
      reportPath: REPORT_PATH || `test-report.${REPORT_FORMAT}`
    });
    
    await framework.initialize();
    
    // Discover testable modules
    console.log('\nDiscovering testable modules...');
    const testableModules = await discoverTestableModules(ROOT_DIR);
    
    if (testableModules.length === 0) {
      console.log('No testable modules found.');
      process.exit(0);
    }
    
    console.log(`Found ${testableModules.length} testable modules.`);
    
    // Filter modules if specified
    let modulesToTest = testableModules;
    if (FILTER_MODULES.length > 0) {
      modulesToTest = testableModules.filter(module => 
        FILTER_MODULES.includes(module.getTestMetadata().moduleName));
      console.log(`Filtered to ${modulesToTest.length} modules based on command line filter.`);
    }
    
    if (modulesToTest.length === 0) {
      console.log('No modules match the specified filter.');
      process.exit(0);
    }
    
    // Register modules with the test framework
    for (const module of modulesToTest) {
      framework.register(module);
    }
    
    // Run tests
    console.log('\nRunning tests...');
    const startTime = Date.now();
    let results;
    
    if (FILTER_TAGS.length > 0) {
      console.log(`Filtering tests by tags: ${FILTER_TAGS.join(', ')}`);
      results = await framework.runWithTags(FILTER_TAGS);
    } else {
      results = await framework.runAll();
    }
    
    const duration = Date.now() - startTime;
    
    // Calculate summary
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    let skippedTests = 0;
    
    Object.entries(results).forEach(([moduleName, moduleResults]) => {
      // Type assertion for moduleResults
      Object.entries(moduleResults as Record<string, unknown>).forEach(([testName, result]) => {
        totalTests++;
        
        const testResult = result as unknown as TestResult;
        if (testResult.status === TestResultStatus.Passed) {
          passedTests++;
        } else if (testResult.status === TestResultStatus.Failed || testResult.status === TestResultStatus.Error) {
          failedTests++;
        } else if (testResult.status === TestResultStatus.Skipped) {
          skippedTests++;
        }
      });
    });
    
    // Print summary
    console.log('\nTest Summary:');
    console.log(`  Modules tested: ${Object.keys(results).length}`);
    console.log(`  Tests executed: ${totalTests}`);
    console.log(`  Tests passed: ${passedTests}`);
    console.log(`  Tests failed: ${failedTests}`);
    console.log(`  Tests skipped: ${skippedTests}`);
    console.log(`  Total duration: ${duration}ms`);
    
    const successRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 100;
    console.log(`  Success rate: ${successRate}%`);
    
    // Generate report if not using console format
    if (REPORT_FORMAT !== 'console' && REPORT_PATH) {
      const reportPath = await framework.generateReport(results);
      console.log(`\nTest report generated: ${reportPath}`);
    }
    
    // Clean up
    await framework.terminate();
    
    // Exit with appropriate code
    process.exit(failedTests > 0 ? 1 : 0);
    
  } catch (error) {
    console.error(`Error running tests: ${error}`);
    process.exit(1);
  }
}

/**
 * Discover modules that implement the TestableInterface
 */
async function discoverTestableModules(rootDir: string): Promise<TestableInterface[]> {
  const modules: TestableInterface[] = [];
  
  // Scan for modules with test.ts files
  const directories = await scanDirectories(rootDir);
  
  for (const dir of directories) {
    try {
      // Check if the directory has an index.ts file and a test.ts file
      const indexPath = path.join(dir, 'index.ts');
      const testPath = path.join(dir, 'test.ts');
      
      if (fs.existsSync(indexPath) && fs.existsSync(testPath)) {
        // Try to import the module
        try {
          // For simplicity, we're assuming that the main export implements TestableInterface
          // In a real implementation, you might need to check more carefully
          const modulePath = path.relative(__dirname, dir);
          const moduleImport = await import(modulePath);
          
          // Get the main export
          const mainExport = moduleImport.default || Object.values(moduleImport)[0];
          
          // Create an instance if it's a constructor
          const instance = typeof mainExport === 'function' 
            ? new mainExport() 
            : mainExport;
          
          // Check if it implements the TestableInterface
          if (isTestableInterface(instance)) {
            modules.push(instance);
            if (VERBOSE) {
              console.log(`  Found testable module: ${dir}`);
            }
          }
        } catch (error) {
          if (VERBOSE) {
            console.log(`  Error importing module from ${dir}: ${error}`);
          }
        }
      }
    } catch (error) {
      if (VERBOSE) {
        console.log(`  Error processing directory ${dir}: ${error}`);
      }
    }
  }
  
  return modules;
}

/**
 * Check if an object implements the TestableInterface
 */
function isTestableInterface(obj: any): obj is TestableInterface {
  return obj && 
         typeof obj.validateBase === 'function' &&
         typeof obj.runTests === 'function' &&
         typeof obj.getTestMetadata === 'function';
}

/**
 * Recursively scan directories
 */
async function scanDirectories(dir: string): Promise<string[]> {
  const results: string[] = [];
  
  if (!fs.existsSync(dir)) {
    return results;
  }
  
  // Read the directory
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  // Add the current directory
  results.push(dir);
  
  // Process subdirectories
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory() && !entry.name.startsWith('.') && !entry.name.startsWith('node_modules')) {
      const subResults = await scanDirectories(fullPath);
      results.push(...subResults);
    }
  }
  
  return results;
}

// Run the main function
main().catch(error => {
  console.error(`Unhandled error: ${error}`);
  process.exit(1);
});
