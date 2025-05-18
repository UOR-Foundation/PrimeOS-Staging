/**
 * {{module-name}} Types
 * {{module-name-underline}}
 * 
 * Type definitions for the {{module-name}} module.
 */

import {
  ModelOptions,
  ModelInterface,
  ModelResult,
  ModelState,
  ModelLifecycleState
} from '../os/model/types';
import { LoggingInterface } from '../os/logging';

/**
 * Configuration options for {{module-name}}
 */
export interface {{module-prefix}}Options extends ModelOptions {
  /**
   * Module-specific options go here
   */
  // Add module-specific options here
}

/**
 * Core interface for {{module-name}} functionality
 */
export interface {{module-prefix}}Interface extends ModelInterface {
  /**
   * Module-specific methods go here
   */
  // Add module-specific methods here
  
  /**
   * Access the module logger
   */
  getLogger(): LoggingInterface;
}

/**
 * Result of {{module-name}} operations
 */
export type {{module-prefix}}Result<T = unknown> = ModelResult<T>;

/**
 * Extended state for {{module-name}} module
 */
export interface {{module-prefix}}State extends ModelState {
  /**
   * Module-specific state properties go here
   */
  // Add module-specific state properties here
}
