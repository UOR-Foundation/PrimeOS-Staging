/**
 * os-tests Types
 * ========
 * 
 * Type definitions for the standardized testing framework for PrimeOS applications.
 */

import {
  ModelOptions,
  ModelInterface,
  ModelResult,
  ModelState,
  ModelLifecycleState
} from '../model/types';
import { LoggingInterface } from '../logging';

/**
 * Configuration options for os-tests
 */
export interface TestFrameworkOptions extends ModelOptions {
  /**
   * Run tests in verbose mode with detailed output
   */
  verbose?: boolean;
  
  /**
   * Filter tests by specified tags
   */
  tags?: string[];
  
  /**
   * Exit process on test failure
   */
  failFast?: boolean;
  
  /**
   * Report format (console, json, etc)
   */
  reportFormat?: 'console' | 'json' | 'html';
  
  /**
   * Path to output test report file
   */
  reportPath?: string;
}

/**
 * Test case specification
 */
export interface TestSpec<T = unknown> {
  /**
   * Unique test identifier
   */
  id: string;
  
  /**
   * Human-readable test title
   */
  title: string;
  
  /**
   * Categorization tags
   */
  tags: string[];
  
  /**
   * Test priority
   */
  priority: 'high' | 'medium' | 'low';
  
  /**
   * Test inputs
   */
  inputs: T[];
  
  /**
   * Expected outputs or behaviors
   */
  expected: any;
  
  /**
   * Optional timeout specification in milliseconds
   */
  timeout?: number;
  
  /**
   * Flag to skip this test
   */
  skip?: boolean;
  
  /**
   * Flag to run only this test
   */
  only?: boolean;
}

/**
 * Test result status enumeration
 */
export enum TestResultStatus {
  Passed = 'passed',
  Failed = 'failed',
  Skipped = 'skipped',
  Timeout = 'timeout',
  Error = 'error'
}

/**
 * Result of a test execution
 */
export interface TestResult<T = unknown> {
  /**
   * Test ID
   */
  id: string;
  
  /**
   * Test status
   */
  status: TestResultStatus;
  
  /**
   * Result data if successful
   */
  data?: T;
  
  /**
   * Error details if failed
   */
  error?: string;
  
  /**
   * Test duration in milliseconds
   */
  duration: number;
  
  /**
   * Execution timestamp
   */
  timestamp: number;
  
  /**
   * Module that produced the result
   */
  source: string;
  
  /**
   * Execution traces for debugging
   */
  traces?: any[];
}

/**
 * Collection of test results
 */
export type TestResults = Record<string, TestResult>;

/**
 * Test metadata
 */
export interface TestMetadata {
  /**
   * Module name
   */
  moduleName: string;
  
  /**
   * Module version
   */
  version: string;
  
  /**
   * Number of tests
   */
  testCount: number;
  
  /**
   * Test categories
   */
  tags: string[];
}

/**
 * Interface for testable modules
 */
export interface TestableInterface {
  /**
   * Check if module satisfies basic test requirements
   */
  validateBase(): TestResult;
  
  /**
   * Run module-specific test suite
   */
  runTests(): Promise<TestResults>;
  
  /**
   * Get module test metadata
   */
  getTestMetadata(): TestMetadata;
}

/**
 * Core interface for testing framework functionality
 */
export interface TestFrameworkInterface extends ModelInterface {
  /**
   * Register a module to be tested
   */
  register(module: TestableInterface): TestFrameworkInterface;
  
  /**
   * Run all registered tests
   */
  runAll(): Promise<Record<string, TestResults>>;
  
  /**
   * Run tests with specific tags
   */
  runWithTags(tags: string[]): Promise<Record<string, TestResults>>;
  
  /**
   * Run tests for a specific module
   */
  runForModule(moduleName: string): Promise<TestResults>;
  
  /**
   * Generate report from test results
   */
  generateReport(results: Record<string, TestResults>): Promise<string>;
  
  /**
   * Access the framework logger
   */
  getLogger(): LoggingInterface;
}

/**
 * Result of testing framework operations
 */
export type TestFrameworkResult<T = unknown> = ModelResult<T>;

/**
 * Extended state for testing framework module
 */
export interface TestFrameworkState extends ModelState {
  /**
   * Custom state properties for the testing framework
   */
  custom?: {
    /**
     * Registered modules
     */
    registeredModules: string[];
    
    /**
     * Last test run results
     */
    lastResults?: Record<string, TestResults>;
    
    /**
     * Test statistics
     */
    stats?: {
      total: number;
      passed: number;
      failed: number;
      skipped: number;
      duration: number;
    };
  };
}
