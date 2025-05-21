/**
 * Verification Validators
 * ===================
 * 
 * Implementation of validators for verification operations.
 */

import { LoggingInterface } from '../../../../os/logging';
import { 
  PrimeRegistryForVerification, 
  RetryOptions, 
  VerificationOptions 
} from '../types';
import { 
  ValidationResult, 
  Validator, 
  ValidationFactory 
} from './types';
import { 
  ValidationError, 
  PrimeRegistryError 
} from '../errors';
import { VERIFICATION_CONSTANTS } from '../constants';

/**
 * Base validator implementation
 */
abstract class BaseValidator<T> implements Validator<T> {
  protected logger?: LoggingInterface;
  
  constructor(logger?: LoggingInterface) {
    this.logger = logger;
  }
  
  /**
   * Validate a value
   */
  abstract validate(value: T): ValidationResult;
  
  /**
   * Validate and throw if invalid
   */
  validateAndThrow(value: T): void {
    const result = this.validate(value);
    
    if (!result.valid) {
      throw new ValidationError(result.error || 'Validation failed', value);
    }
  }
}

/**
 * Validator for bigint values
 */
class BigIntValidator extends BaseValidator<bigint> {
  validate(value: bigint): ValidationResult {
    // Check if value is defined
    if (value === undefined || value === null) {
      return {
        valid: false,
        error: 'Value cannot be undefined or null',
        details: { value }
      };
    }
    
    // Check if value is a bigint
    if (typeof value !== 'bigint') {
      return {
        valid: false,
        error: `Value must be a bigint, got ${typeof value}`,
        details: { value, type: typeof value }
      };
    }
    
    return { valid: true };
  }
}

/**
 * Validator for prime registry
 */
class PrimeRegistryValidator extends BaseValidator<PrimeRegistryForVerification> {
  validate(registry: PrimeRegistryForVerification): ValidationResult {
    // Check if registry is defined
    if (!registry) {
      return {
        valid: false,
        error: 'Prime registry cannot be undefined or null',
        details: { registry }
      };
    }
    
    // Check if registry has required methods from BasePrimeRegistry
    if (typeof registry.getPrime !== 'function') {
      return {
        valid: false,
        error: 'Prime registry must have getPrime method',
        details: { registry, missingMethod: 'getPrime' }
      };
    }
    
    if (typeof registry.getIndex !== 'function') {
      return {
        valid: false,
        error: 'Prime registry must have getIndex method',
        details: { registry, missingMethod: 'getIndex' }
      };
    }
    
    if (typeof registry.factor !== 'function') {
      return {
        valid: false,
        error: 'Prime registry must have factor method',
        details: { registry, missingMethod: 'factor' }
      };
    }
    
    // Check optional methods if they are provided but not functions
    if (registry.getPrimeFactors !== undefined && typeof registry.getPrimeFactors !== 'function') {
      return {
        valid: false,
        error: 'Prime registry has getPrimeFactors property but it is not a function',
        details: { registry, invalidMethod: 'getPrimeFactors' }
      };
    }
    
    if (registry.isPrime !== undefined && typeof registry.isPrime !== 'function') {
      return {
        valid: false,
        error: 'Prime registry has isPrime property but it is not a function',
        details: { registry, invalidMethod: 'isPrime' }
      };
    }
    
    return { valid: true };
  }
  
  /**
   * Validate and throw if invalid
   */
  validateAndThrow(registry: PrimeRegistryForVerification): void {
    const result = this.validate(registry);
    
    if (!result.valid) {
      throw new PrimeRegistryError(result.error || 'Invalid prime registry');
    }
  }
}

/**
 * Validator for retry options
 */
class RetryOptionsValidator extends BaseValidator<RetryOptions> {
  validate(options?: RetryOptions): ValidationResult {
    // If options are not provided, they are valid (defaults will be used)
    if (!options) {
      return { valid: true };
    }
    
    // Check maxRetries
    if (options.maxRetries !== undefined && 
        (typeof options.maxRetries !== 'number' || 
         options.maxRetries < 0 || 
         !Number.isInteger(options.maxRetries))) {
      return {
        valid: false,
        error: 'maxRetries must be a non-negative integer',
        details: { maxRetries: options.maxRetries }
      };
    }
    
    // Check initialDelay
    if (options.initialDelay !== undefined && 
        (typeof options.initialDelay !== 'number' || 
         options.initialDelay < 0)) {
      return {
        valid: false,
        error: 'initialDelay must be a non-negative number',
        details: { initialDelay: options.initialDelay }
      };
    }
    
    // Check maxDelay
    if (options.maxDelay !== undefined && 
        (typeof options.maxDelay !== 'number' || 
         options.maxDelay < 0)) {
      return {
        valid: false,
        error: 'maxDelay must be a non-negative number',
        details: { maxDelay: options.maxDelay }
      };
    }
    
    // Check backoffFactor
    if (options.backoffFactor !== undefined && 
        (typeof options.backoffFactor !== 'number' || 
         options.backoffFactor <= 0)) {
      return {
        valid: false,
        error: 'backoffFactor must be a positive number',
        details: { backoffFactor: options.backoffFactor }
      };
    }
    
    // Check that maxDelay is greater than or equal to initialDelay
    if (options.initialDelay !== undefined && 
        options.maxDelay !== undefined && 
        options.initialDelay > options.maxDelay) {
      return {
        valid: false,
        error: 'maxDelay must be greater than or equal to initialDelay',
        details: { 
          initialDelay: options.initialDelay, 
          maxDelay: options.maxDelay 
        }
      };
    }
    
    return { valid: true };
  }
}

/**
 * Validator for verification options
 */
class VerificationOptionsValidator extends BaseValidator<VerificationOptions> {
  validate(options?: VerificationOptions): ValidationResult {
    // If options are not provided, they are valid (defaults will be used)
    if (!options) {
      return { valid: true };
    }
    
    // Check debug
    if (options.debug !== undefined && typeof options.debug !== 'boolean') {
      return {
        valid: false,
        error: 'debug must be a boolean',
        details: { debug: options.debug }
      };
    }
    
    // Check failFast
    if (options.failFast !== undefined && typeof options.failFast !== 'boolean') {
      return {
        valid: false,
        error: 'failFast must be a boolean',
        details: { failFast: options.failFast }
      };
    }
    
    // Check cacheSize
    if (options.cacheSize !== undefined && 
        (typeof options.cacheSize !== 'number' || 
         options.cacheSize < 0 || 
         !Number.isInteger(options.cacheSize))) {
      return {
        valid: false,
        error: 'cacheSize must be a non-negative integer',
        details: { cacheSize: options.cacheSize }
      };
    }
    
    // Check enableCache
    if (options.enableCache !== undefined && typeof options.enableCache !== 'boolean') {
      return {
        valid: false,
        error: 'enableCache must be a boolean',
        details: { enableCache: options.enableCache }
      };
    }
    
    // Check enableRetry
    if (options.enableRetry !== undefined && typeof options.enableRetry !== 'boolean') {
      return {
        valid: false,
        error: 'enableRetry must be a boolean',
        details: { enableRetry: options.enableRetry }
      };
    }
    
    // Check name
    if (options.name !== undefined && typeof options.name !== 'string') {
      return {
        valid: false,
        error: 'name must be a string',
        details: { name: options.name }
      };
    }
    
    // Check version
    if (options.version !== undefined && typeof options.version !== 'string') {
      return {
        valid: false,
        error: 'version must be a string',
        details: { version: options.version }
      };
    }
    
    // Check retryOptions
    if (options.retryOptions !== undefined) {
      const retryValidator = new RetryOptionsValidator(this.logger);
      const retryResult = retryValidator.validate(options.retryOptions);
      
      if (!retryResult.valid) {
        return {
          valid: false,
          error: `Invalid retryOptions: ${retryResult.error}`,
          details: retryResult.details
        };
      }
    }
    
    // Check enableRateLimit
    if (options.enableRateLimit !== undefined && typeof options.enableRateLimit !== 'boolean') {
      return {
        valid: false,
        error: 'enableRateLimit must be a boolean',
        details: { enableRateLimit: options.enableRateLimit }
      };
    }
    
    // Check rateLimit
    if (options.rateLimit !== undefined && 
        (typeof options.rateLimit !== 'number' || 
         options.rateLimit <= 0 || 
         !Number.isInteger(options.rateLimit))) {
      return {
        valid: false,
        error: 'rateLimit must be a positive integer',
        details: { rateLimit: options.rateLimit }
      };
    }
    
    // Check rateLimitBurst
    if (options.rateLimitBurst !== undefined && 
        (typeof options.rateLimitBurst !== 'number' || 
         options.rateLimitBurst <= 0 || 
         !Number.isInteger(options.rateLimitBurst))) {
      return {
        valid: false,
        error: 'rateLimitBurst must be a positive integer',
        details: { rateLimitBurst: options.rateLimitBurst }
      };
    }
    
    // Check enableCircuitBreaker
    if (options.enableCircuitBreaker !== undefined && typeof options.enableCircuitBreaker !== 'boolean') {
      return {
        valid: false,
        error: 'enableCircuitBreaker must be a boolean',
        details: { enableCircuitBreaker: options.enableCircuitBreaker }
      };
    }
    
    // Check circuitBreakerThreshold
    if (options.circuitBreakerThreshold !== undefined && 
        (typeof options.circuitBreakerThreshold !== 'number' || 
         options.circuitBreakerThreshold <= 0 || 
         !Number.isInteger(options.circuitBreakerThreshold))) {
      return {
        valid: false,
        error: 'circuitBreakerThreshold must be a positive integer',
        details: { circuitBreakerThreshold: options.circuitBreakerThreshold }
      };
    }
    
    // Check circuitBreakerTimeout
    if (options.circuitBreakerTimeout !== undefined && 
        (typeof options.circuitBreakerTimeout !== 'number' || 
         options.circuitBreakerTimeout <= 0 || 
         !Number.isInteger(options.circuitBreakerTimeout))) {
      return {
        valid: false,
        error: 'circuitBreakerTimeout must be a positive integer',
        details: { circuitBreakerTimeout: options.circuitBreakerTimeout }
      };
    }
    
    return { valid: true };
  }
}

/**
 * Implementation of validation factory
 */
export class VerificationValidationFactory implements ValidationFactory {
  private logger?: LoggingInterface;
  
  constructor(logger?: LoggingInterface) {
    this.logger = logger;
  }
  
  /**
   * Create a validator for bigint values
   */
  createBigIntValidator(): Validator<bigint> {
    return new BigIntValidator(this.logger);
  }
  
  /**
   * Create a validator for prime registry
   */
  createPrimeRegistryValidator(): Validator<PrimeRegistryForVerification> {
    return new PrimeRegistryValidator(this.logger);
  }
  
  /**
   * Create a validator for retry options
   */
  createRetryOptionsValidator(): Validator<RetryOptions> {
    return new RetryOptionsValidator(this.logger);
  }
  
  /**
   * Create a validator for verification options
   */
  createVerificationOptionsValidator(): Validator<VerificationOptions> {
    return new VerificationOptionsValidator(this.logger);
  }
}

/**
 * Create a validation factory
 */
export function createValidationFactory(logger?: LoggingInterface): ValidationFactory {
  return new VerificationValidationFactory(logger);
}

/**
 * Validate a bigint value
 */
export function validateBigInt(value: bigint): ValidationResult {
  return new BigIntValidator().validate(value);
}

/**
 * Validate a prime registry
 */
export function validatePrimeRegistry(registry: PrimeRegistryForVerification): ValidationResult {
  return new PrimeRegistryValidator().validate(registry);
}

/**
 * Validate retry options
 */
export function validateRetryOptions(options?: RetryOptions): ValidationResult {
  return new RetryOptionsValidator().validate(options);
}

/**
 * Validate verification options
 */
export function validateVerificationOptions(options?: VerificationOptions): ValidationResult {
  return new VerificationOptionsValidator().validate(options);
}
