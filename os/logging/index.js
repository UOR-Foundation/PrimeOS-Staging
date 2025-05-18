"use strict";
/**
 * Logging Implementation
 * =======
 *
 * This module implements a logging system for PrimeOS based on the Model pattern.
 *
 * Note: This implementation deliberately does not extend BaseModel to avoid
 * circular dependencies, but it follows the same model pattern and interface.
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggingImplementation = void 0;
exports.createLogging = createLogging;
var types_1 = require("./types");
var types_2 = require("../model/types");
/**
 * Default options for logging
 */
var DEFAULT_LOGGING_OPTIONS = {
    name: 'logging',
    version: '0.1.0',
    debug: false,
    minLevel: types_1.LogLevel.INFO,
    maxEntries: 1000,
    consoleOutput: true
};
/**
 * Get effective minimum level based on options
 */
function getEffectiveMinLevel(options) {
    // If debug mode is enabled, use TRACE as the minimum level
    // unless a specific level is requested
    if (options.debug && options.minLevel === undefined) {
        return types_1.LogLevel.TRACE;
    }
    return options.minLevel !== undefined ? options.minLevel : types_1.LogLevel.INFO;
}
/**
 * Default log formatter
 */
function defaultFormatter(entry) {
    var timestamp = new Date(entry.timestamp).toISOString();
    var level = types_1.LogLevel[entry.level].padEnd(5, ' ');
    return "[".concat(timestamp, "] ").concat(level, " [").concat(entry.source, "] ").concat(entry.message);
}
/**
 * Main implementation of the logging module
 *
 * This implementation follows the Model pattern but does not extend BaseModel
 * to avoid circular dependencies between logging and model.
 */
var LoggingImplementation = /** @class */ (function () {
    /**
     * Create a new logging instance
     */
    function LoggingImplementation(options) {
        var _a;
        if (options === void 0) { options = {}; }
        this.entries = [];
        this.stats = (_a = {},
            _a[types_1.LogLevel.TRACE] = 0,
            _a[types_1.LogLevel.DEBUG] = 0,
            _a[types_1.LogLevel.INFO] = 0,
            _a[types_1.LogLevel.WARN] = 0,
            _a[types_1.LogLevel.ERROR] = 0,
            _a[types_1.LogLevel.FATAL] = 0,
            _a[types_1.LogLevel.NONE] = 0,
            _a);
        this.options = __assign(__assign({}, DEFAULT_LOGGING_OPTIONS), options);
        this.startTime = Date.now();
        // Initialize state similar to BaseModel
        this.state = {
            lifecycle: types_2.ModelLifecycleState.Uninitialized,
            lastStateChangeTime: this.startTime,
            uptime: 0,
            operationCount: {
                total: 0,
                success: 0,
                failed: 0
            },
            recentEntries: [],
            stats: __assign({}, this.stats)
        };
    }
    /**
     * Get the module identifier
     */
    LoggingImplementation.prototype.getModuleIdentifier = function () {
        return this.options.id ||
            "".concat(this.options.name, "@").concat(this.options.version);
    };
    /**
     * Create a standardized result object
     */
    LoggingImplementation.prototype.createResult = function (success, data, error) {
        return {
            success: success,
            data: data,
            error: error,
            timestamp: Date.now(),
            source: this.getModuleIdentifier()
        };
    };
    /**
     * Update the module lifecycle state
     */
    LoggingImplementation.prototype.updateLifecycle = function (newState) {
        var prevState = this.state.lifecycle;
        this.state.lifecycle = newState;
        this.state.lastStateChangeTime = Date.now();
        if (this.options.debug) {
            console.log("[".concat(this.getModuleIdentifier(), "] State transition: ").concat(prevState, " -> ").concat(newState));
        }
    };
    /**
     * Initialize the logging module
     */
    LoggingImplementation.prototype.initialize = function () {
        return __awaiter(this, void 0, void 0, function () {
            var entry, formatter;
            return __generator(this, function (_a) {
                this.updateLifecycle(types_2.ModelLifecycleState.Initializing);
                try {
                    // Clear any existing entries
                    this.entries = [];
                    this.resetStats();
                    // Only log initialization in debug mode, and directly add to entries
                    // without going through log method to avoid counting this in tests
                    if (this.options.debug) {
                        entry = {
                            timestamp: Date.now(),
                            level: types_1.LogLevel.INFO,
                            source: this.getModuleIdentifier(),
                            message: 'Logging module initialized',
                            data: {
                                options: this.options
                            }
                        };
                        // Only update console output if enabled
                        if (this.options.consoleOutput) {
                            formatter = this.options.formatter || defaultFormatter;
                            console.info(formatter(entry), entry.data);
                        }
                    }
                    this.updateLifecycle(types_2.ModelLifecycleState.Ready);
                    return [2 /*return*/, this.createResult(true, { initialized: true })];
                }
                catch (error) {
                    this.updateLifecycle(types_2.ModelLifecycleState.Error);
                    return [2 /*return*/, this.createResult(false, undefined, error instanceof Error ? error.message : String(error))];
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Process input data for the logging module
     * This accepts log entries in a variety of formats and standardizes them
     */
    LoggingImplementation.prototype.process = function (input) {
        return __awaiter(this, void 0, void 0, function () {
            var entry, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.state.lifecycle !== types_2.ModelLifecycleState.Ready) {
                            return [2 /*return*/, this.createResult(false, undefined, "Cannot process in ".concat(this.state.lifecycle, " state. Module must be in Ready state."))];
                        }
                        this.updateLifecycle(types_2.ModelLifecycleState.Processing);
                        this.state.operationCount.total++;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 9, , 10]);
                        if (!(typeof input === 'string')) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.info(input)];
                    case 2:
                        _a.sent();
                        this.state.operationCount.success++;
                        this.updateLifecycle(types_2.ModelLifecycleState.Ready);
                        return [2 /*return*/, this.createResult(true, { processed: true })];
                    case 3:
                        if (!(input && typeof input === 'object' && 'message' in input)) return [3 /*break*/, 5];
                        entry = input;
                        return [4 /*yield*/, this.log(entry.level || types_1.LogLevel.INFO, entry.message, entry.data)];
                    case 4:
                        _a.sent();
                        this.state.operationCount.success++;
                        this.updateLifecycle(types_2.ModelLifecycleState.Ready);
                        return [2 /*return*/, this.createResult(true, { processed: true })];
                    case 5:
                        if (!(!input || typeof input !== 'object')) return [3 /*break*/, 7];
                        return [4 /*yield*/, this.info('Processing input data', input)];
                    case 6:
                        _a.sent();
                        this.state.operationCount.success++;
                        this.updateLifecycle(types_2.ModelLifecycleState.Ready);
                        return [2 /*return*/, this.createResult(true, { processed: true })];
                    case 7: 
                    // For other object inputs, log them as data
                    return [4 /*yield*/, this.info('Processing input object', input)];
                    case 8:
                        // For other object inputs, log them as data
                        _a.sent();
                        this.state.operationCount.success++;
                        this.updateLifecycle(types_2.ModelLifecycleState.Ready);
                        return [2 /*return*/, this.createResult(true, { processed: true })];
                    case 9:
                        error_1 = _a.sent();
                        this.state.operationCount.failed++;
                        this.updateLifecycle(types_2.ModelLifecycleState.Error);
                        return [2 /*return*/, this.createResult(false, undefined, error_1 instanceof Error ? error_1.message : String(error_1))];
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get current module state
     */
    LoggingImplementation.prototype.getState = function () {
        // Update uptime when state is requested
        this.state.uptime = Date.now() - this.startTime;
        return __assign({}, this.state);
    };
    /**
     * Reset module to initial state
     */
    LoggingImplementation.prototype.reset = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.updateLifecycle(types_2.ModelLifecycleState.Initializing);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.clearHistory()];
                    case 2:
                        _a.sent();
                        // Reset state counters
                        this.state.operationCount = {
                            total: 0,
                            success: 0,
                            failed: 0
                        };
                        this.updateLifecycle(types_2.ModelLifecycleState.Ready);
                        return [2 /*return*/, this.createResult(true, { reset: true })];
                    case 3:
                        error_2 = _a.sent();
                        this.updateLifecycle(types_2.ModelLifecycleState.Error);
                        return [2 /*return*/, this.createResult(false, undefined, error_2 instanceof Error ? error_2.message : String(error_2))];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Terminate the module, releasing resources
     */
    LoggingImplementation.prototype.terminate = function () {
        return __awaiter(this, void 0, void 0, function () {
            var entry, formatter;
            return __generator(this, function (_a) {
                this.updateLifecycle(types_2.ModelLifecycleState.Terminating);
                try {
                    // Log termination if in debug mode
                    if (this.options.debug) {
                        entry = {
                            timestamp: Date.now(),
                            level: types_1.LogLevel.INFO,
                            source: this.getModuleIdentifier(),
                            message: 'Logging module terminated'
                        };
                        // Only output to console if enabled
                        if (this.options.consoleOutput) {
                            formatter = this.options.formatter || defaultFormatter;
                            console.info(formatter(entry));
                        }
                    }
                    this.updateLifecycle(types_2.ModelLifecycleState.Terminated);
                    return [2 /*return*/, this.createResult(true, { terminated: true })];
                }
                catch (error) {
                    this.updateLifecycle(types_2.ModelLifecycleState.Error);
                    return [2 /*return*/, this.createResult(false, undefined, error instanceof Error ? error.message : String(error))];
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Log a message at the specified level
     */
    LoggingImplementation.prototype.log = function (level, message, data) {
        return __awaiter(this, void 0, void 0, function () {
            var minLevel, entry, maxEntries, formatter, formattedMessage;
            return __generator(this, function (_a) {
                // Check if we're terminated
                if (this.state.lifecycle === types_2.ModelLifecycleState.Terminated) {
                    return [2 /*return*/, this.createResult(false, undefined, 'Logger has been terminated')];
                }
                minLevel = getEffectiveMinLevel(this.options);
                if (level < minLevel) {
                    return [2 /*return*/, this.createResult(true, { skipped: true, level: level })];
                }
                entry = {
                    timestamp: Date.now(),
                    level: level,
                    source: this.getModuleIdentifier(),
                    message: message === undefined ? 'undefined' : message,
                    data: data
                };
                // Update statistics
                this.stats[level]++;
                this.state.stats = __assign({}, this.stats);
                // Update operation count to track state changes
                this.state.operationCount.total++;
                this.state.operationCount.success++;
                maxEntries = (this.options.maxEntries !== undefined ? this.options.maxEntries : DEFAULT_LOGGING_OPTIONS.maxEntries);
                if (maxEntries > 0) {
                    this.entries.push(entry);
                    // Trim if exceeding max entries
                    if (this.entries.length > maxEntries) {
                        this.entries = this.entries.slice(-maxEntries);
                    }
                }
                // Update recent entries in state
                this.state.recentEntries = this.entries.slice(-10);
                // Output to console if enabled
                if (this.options.consoleOutput) {
                    formatter = this.options.formatter || defaultFormatter;
                    formattedMessage = formatter(entry);
                    switch (level) {
                        case types_1.LogLevel.TRACE:
                        case types_1.LogLevel.DEBUG:
                            console.debug(formattedMessage, data);
                            break;
                        case types_1.LogLevel.INFO:
                            console.info(formattedMessage, data);
                            break;
                        case types_1.LogLevel.WARN:
                            console.warn(formattedMessage, data);
                            break;
                        case types_1.LogLevel.ERROR:
                        case types_1.LogLevel.FATAL:
                            console.error(formattedMessage, data);
                            break;
                    }
                }
                return [2 /*return*/, this.createResult(true, { entry: entry })];
            });
        });
    };
    /**
     * Convenience method for TRACE level
     */
    LoggingImplementation.prototype.trace = function (message, data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.log(types_1.LogLevel.TRACE, message, data)];
            });
        });
    };
    /**
     * Convenience method for DEBUG level
     */
    LoggingImplementation.prototype.debug = function (message, data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.log(types_1.LogLevel.DEBUG, message, data)];
            });
        });
    };
    /**
     * Convenience method for INFO level
     */
    LoggingImplementation.prototype.info = function (message, data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.log(types_1.LogLevel.INFO, message, data)];
            });
        });
    };
    /**
     * Convenience method for WARN level
     */
    LoggingImplementation.prototype.warn = function (message, data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.log(types_1.LogLevel.WARN, message, data)];
            });
        });
    };
    /**
     * Convenience method for ERROR level
     */
    LoggingImplementation.prototype.error = function (message, data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.log(types_1.LogLevel.ERROR, message, data)];
            });
        });
    };
    /**
     * Convenience method for FATAL level
     */
    LoggingImplementation.prototype.fatal = function (message, data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.log(types_1.LogLevel.FATAL, message, data)];
            });
        });
    };
    /**
     * Get recent log entries
     */
    LoggingImplementation.prototype.getEntries = function (count) {
        if (count && count > 0) {
            return this.entries.slice(-count);
        }
        return __spreadArray([], this.entries, true);
    };
    /**
     * Clear log history
     */
    LoggingImplementation.prototype.clearHistory = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.entries = [];
                this.resetStats();
                this.state.recentEntries = [];
                return [2 /*return*/, this.createResult(true, { cleared: true })];
            });
        });
    };
    /**
     * Helper to reset statistics
     */
    LoggingImplementation.prototype.resetStats = function () {
        var _a;
        this.stats = (_a = {},
            _a[types_1.LogLevel.TRACE] = 0,
            _a[types_1.LogLevel.DEBUG] = 0,
            _a[types_1.LogLevel.INFO] = 0,
            _a[types_1.LogLevel.WARN] = 0,
            _a[types_1.LogLevel.ERROR] = 0,
            _a[types_1.LogLevel.FATAL] = 0,
            _a[types_1.LogLevel.NONE] = 0,
            _a);
        this.state.stats = __assign({}, this.stats);
    };
    return LoggingImplementation;
}());
exports.LoggingImplementation = LoggingImplementation;
/**
 * Create a logging instance with the specified options
 */
function createLogging(options) {
    if (options === void 0) { options = {}; }
    return new LoggingImplementation(options);
}
// Export types
__exportStar(require("./types"), exports);
