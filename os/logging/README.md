# PrimeOS Logging System

This module provides a comprehensive logging system for PrimeOS, based on the Model pattern. It offers a flexible, level-based logging infrastructure that can be used across all PrimeOS components.

## Features

- **Level-based logging**: Six different log levels (TRACE, DEBUG, INFO, WARN, ERROR, FATAL)
- **In-memory log storage**: Maintains a history of recent logs for debugging and analysis
- **Console output**: Configurable console logging with nice formatting
- **Custom formatters**: Ability to customize log message formatting
- **Statistics tracking**: Tracks statistics for each log level
- **Model pattern compliance**: Fully implements the PrimeOS Model interface for consistency

## Usage

### Basic Usage

```typescript
import { createLogging, LogLevel } from './os/logging';

// Create a logger instance
const logger = createLogging({
  name: 'my-module',
  minLevel: LogLevel.INFO,
  consoleOutput: true
});

// Initialize the logger
await logger.initialize();

// Log messages at different levels
await logger.info('Application started');
await logger.warn('Resource usage high', { memoryUsage: '85%' });
await logger.error('Connection failed', { endpoint: 'api.example.com' });

// Get recent log entries
const recentLogs = logger.getEntries(10);

// Clean up
await logger.terminate();
```

### Configuration Options

The logging module accepts the following configuration options:

```typescript
interface LoggingOptions extends ModelOptions {
  minLevel?: LogLevel;        // Minimum level to log (default: INFO)
  maxEntries?: number;        // Maximum number of entries to keep (default: 1000)
  consoleOutput?: boolean;    // Whether to output to console (default: true)
  formatter?: Function;       // Custom formatter for log entries
}
```

### Log Levels

The logging module supports the following log levels, in ascending order of severity:

- `LogLevel.TRACE` (0): Detailed tracing information
- `LogLevel.DEBUG` (1): Debugging information
- `LogLevel.INFO` (2): General informational messages (default)
- `LogLevel.WARN` (3): Warning messages
- `LogLevel.ERROR` (4): Error messages
- `LogLevel.FATAL` (5): Critical failures
- `LogLevel.NONE` (6): No logging

### Advanced Usage

#### Custom Formatting

You can provide a custom formatter function to format log entries:

```typescript
const logger = createLogging({
  formatter: (entry) => {
    return `${new Date(entry.timestamp).toISOString()} [${entry.level}] ${entry.message}`;
  }
});
```

#### Processing Log Inputs

The logging module can process different types of inputs:

```typescript
// Process a string (becomes INFO level log)
await logger.process("System starting");

// Process an object with level and message
await logger.process({
  level: LogLevel.WARN,
  message: "Low disk space",
  data: { available: "120MB" }
});

// Get statistics
const state = logger.getState();
console.log(state.stats); // Shows count by log level
```

## Integration with PrimeOS

This module is designed to integrate seamlessly with other PrimeOS components:

1. It implements the `ModelInterface` from the `os/model` module
2. It follows the standard lifecycle (initialize → process → terminate)
3. It provides proper state tracking for monitoring

### Special Implementation Note

Unlike most PrimeOS modules, the Logging module does not extend `BaseModel` even though it follows the same pattern. This design decision was made deliberately to avoid circular dependencies:

- The `BaseModel` class needs logging capabilities
- If the logging module extended `BaseModel`, it would create a circular dependency

Instead, the logging module independently implements the `ModelInterface` with its own state management. This approach allows:

1. The logging module to be used by `BaseModel` without circular imports
2. Model modules to use logging through the standardized `LoggingInterface`
3. A clean separation of concerns while maintaining the consistent Model pattern

This implementation detail is transparent to users of the logging module, who can interact with it using the same interface as any other PrimeOS module.

## Implementation Details

The logging module maintains an in-memory array of log entries, with configurable maximum size. When the maximum is reached, older entries are removed to make room for new ones.

Performance considerations:
- Log entries below the configured minimum level are filtered out early
- Console output can be disabled for performance-critical applications
- Statistics tracking has minimal overhead
- Debug mode automatically adjusts log level to TRACE for more verbose output

### Model Integration

The logging module is foundational to the PrimeOS architecture:

1. Every `BaseModel` instance automatically creates and manages its own logger
2. Lifecycle state transitions are automatically logged
3. Error conditions are captured in logs with stack traces and context
4. Log levels are automatically configured based on the model's debug setting

For example, when you create any module using the standard pattern:

```typescript
import { createModel } from './os/model';

const myModule = createModel({ 
  name: 'my-module', 
  debug: true 
});

await myModule.initialize();
```

A logger is automatically created, initialized, and available within the module. You can access it via:

```typescript
// From inside a custom module that extends BaseModel
this.logger.info('Operation started', { operationId: 123 });

// From outside, using the getter
const logger = myModule.getLogger();
logger.warn('External warning');
```

## Example: System-wide Logging

```typescript
// In your main application file
import { createLogging } from './os/logging';
import { ModelLifecycleState } from './os/model';

// Create a global logger
export const systemLogger = createLogging({
  name: 'system',
  debug: true,
  minLevel: process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG
});

// Initialize the logger when application starts
await systemLogger.initialize();

// Log system state changes
systemLogger.on('stateChange', (oldState, newState) => {
  if (newState === ModelLifecycleState.Error) {
    systemLogger.error('Module entered error state', { module: oldState.name });
  }
});

// Before application shutdown
await systemLogger.terminate();
```
