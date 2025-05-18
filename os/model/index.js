"use strict";
/**
 * Model Implementation
 * ===================
 *
 * This module implements the standard definition pattern for all PrimeOS modules.
 * It serves as the base class that other modules should extend or implement.
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelTestAdapter = exports.createModelTestAdapter = exports.createModule = exports.StandardModel = exports.BaseModel = void 0;
exports.createModel = createModel;
exports.createAndInitializeModel = createAndInitializeModel;
var types_1 = require("./types");
var logging_1 = require("../logging");
/**
 * Default options for model
 */
var DEFAULT_OPTIONS = {
    debug: false,
    name: 'unnamed-module',
    version: '0.1.0'
};
/**
 * Base implementation of the model interface
 * This class can be extended by specific module implementations
 */
var BaseModel = /** @class */ (function () {
    /**
     * Create a new model instance
     */
    function BaseModel(options) {
        if (options === void 0) { options = {}; }
        this.options = __assign(__assign({}, DEFAULT_OPTIONS), options);
        this.startTime = Date.now();
        this.state = {
            lifecycle: types_1.ModelLifecycleState.Uninitialized,
            lastStateChangeTime: this.startTime,
            uptime: 0,
            operationCount: {
                total: 0,
                success: 0,
                failed: 0
            }
        };
        // Initialize logger with model name as source
        this.logger = (0, logging_1.createLogging)({
            name: this.options.name || DEFAULT_OPTIONS.name,
            debug: this.options.debug,
            minLevel: this.options.debug ? logging_1.LogLevel.TRACE : logging_1.LogLevel.INFO
        });
        if (this.options.debug) {
            console.log("[".concat(this.getModuleIdentifier(), "] Created model instance"));
        }
    }
    /**
     * Get module logger instance
     */
    BaseModel.prototype.getLogger = function () {
        return this.logger;
    };
    /**
     * Log at specified level (helper method)
     */
    BaseModel.prototype.logMessage = function (level, message, data) {
        return this.logger.log(level, message, data).then(function () { });
    };
    /**
     * Initialize the module with given configuration
     * Subclasses should override this with their specific initialization logic
     */
    BaseModel.prototype.initialize = function () {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        startTime = Date.now();
                        this.updateLifecycle(types_1.ModelLifecycleState.Initializing);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 6, , 8]);
                        // Initialize logger first
                        return [4 /*yield*/, this.logger.initialize()];
                    case 2:
                        // Initialize logger first
                        _a.sent();
                        return [4 /*yield*/, this.logger.info('Initializing module', this.options)];
                    case 3:
                        _a.sent();
                        // Subclasses should implement their initialization logic
                        return [4 /*yield*/, this.onInitialize()];
                    case 4:
                        // Subclasses should implement their initialization logic
                        _a.sent();
                        this.updateLifecycle(types_1.ModelLifecycleState.Ready);
                        return [4 /*yield*/, this.logger.info('Module initialized successfully')];
                    case 5:
                        _a.sent();
                        return [2 /*return*/, this.createResult(true, { initialized: true }, undefined)];
                    case 6:
                        error_1 = _a.sent();
                        this.updateLifecycle(types_1.ModelLifecycleState.Error);
                        return [4 /*yield*/, this.logger.error('Initialization failed', error_1)];
                    case 7:
                        _a.sent();
                        if (this.options.debug) {
                            console.error("[".concat(this.getModuleIdentifier(), "] Initialization error:"), error_1);
                        }
                        return [2 /*return*/, this.createResult(false, undefined, error_1 instanceof Error ? error_1.message : String(error_1))];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Hook for subclass initialization implementation
     */
    BaseModel.prototype.onInitialize = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/];
            });
        });
    };
    /**
     * Process input data and return results
     * Subclasses should implement their own processing logic by overriding onProcess
     */
    BaseModel.prototype.process = function (input) {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, errorMessage, result, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        startTime = Date.now();
                        this.state.operationCount.total++;
                        if (!(this.state.lifecycle !== types_1.ModelLifecycleState.Ready)) return [3 /*break*/, 2];
                        this.state.operationCount.failed++;
                        errorMessage = "Cannot process in ".concat(this.state.lifecycle, " state. Module must be in Ready state.");
                        return [4 /*yield*/, this.logger.warn(errorMessage)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, this.createResult(false, undefined, errorMessage)];
                    case 2:
                        this.updateLifecycle(types_1.ModelLifecycleState.Processing);
                        return [4 /*yield*/, this.logger.debug('Processing input', input)];
                    case 3:
                        _a.sent();
                        if (this.options.debug) {
                            console.log("[".concat(this.getModuleIdentifier(), "] Processing input:"), input);
                        }
                        _a.label = 4;
                    case 4:
                        _a.trys.push([4, 7, , 9]);
                        return [4 /*yield*/, this.onProcess(input)];
                    case 5:
                        result = _a.sent();
                        this.updateLifecycle(types_1.ModelLifecycleState.Ready);
                        this.state.operationCount.success++;
                        return [4 /*yield*/, this.logger.debug('Processing completed successfully', { resultSummary: typeof result })];
                    case 6:
                        _a.sent();
                        return [2 /*return*/, this.createResult(true, result, undefined)];
                    case 7:
                        error_2 = _a.sent();
                        this.updateLifecycle(types_1.ModelLifecycleState.Error);
                        this.state.operationCount.failed++;
                        return [4 /*yield*/, this.logger.error('Processing error', error_2)];
                    case 8:
                        _a.sent();
                        if (this.options.debug) {
                            console.error("[".concat(this.getModuleIdentifier(), "] Processing error:"), error_2);
                        }
                        return [2 /*return*/, this.createResult(false, undefined, error_2 instanceof Error ? error_2.message : String(error_2))];
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get current module state
     */
    BaseModel.prototype.getState = function () {
        // Update uptime when state is requested
        this.state.uptime = Date.now() - this.startTime;
        return __assign({}, this.state);
    };
    /**
     * Reset module to initial state
     */
    BaseModel.prototype.reset = function () {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        startTime = Date.now();
                        return [4 /*yield*/, this.logger.info('Resetting module')];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 5, , 7]);
                        // Allow subclasses to perform custom reset logic
                        return [4 /*yield*/, this.onReset()];
                    case 3:
                        // Allow subclasses to perform custom reset logic
                        _a.sent();
                        // Reset state counters
                        this.state.operationCount = {
                            total: 0,
                            success: 0,
                            failed: 0
                        };
                        this.updateLifecycle(types_1.ModelLifecycleState.Ready);
                        return [4 /*yield*/, this.logger.info('Module reset completed')];
                    case 4:
                        _a.sent();
                        return [2 /*return*/, this.createResult(true, { reset: true }, undefined)];
                    case 5:
                        error_3 = _a.sent();
                        this.updateLifecycle(types_1.ModelLifecycleState.Error);
                        return [4 /*yield*/, this.logger.error('Reset failed', error_3)];
                    case 6:
                        _a.sent();
                        if (this.options.debug) {
                            console.error("[".concat(this.getModuleIdentifier(), "] Reset error:"), error_3);
                        }
                        return [2 /*return*/, this.createResult(false, undefined, error_3 instanceof Error ? error_3.message : String(error_3))];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Hook for subclass reset implementation
     */
    BaseModel.prototype.onReset = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/];
            });
        });
    };
    /**
     * Terminate the module, releasing resources
     */
    BaseModel.prototype.terminate = function () {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        startTime = Date.now();
                        this.updateLifecycle(types_1.ModelLifecycleState.Terminating);
                        return [4 /*yield*/, this.logger.info('Terminating module')];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 6, , 9]);
                        // Allow subclasses to perform custom termination logic
                        return [4 /*yield*/, this.onTerminate()];
                    case 3:
                        // Allow subclasses to perform custom termination logic
                        _a.sent();
                        this.updateLifecycle(types_1.ModelLifecycleState.Terminated);
                        // Log termination before logger terminates
                        return [4 /*yield*/, this.logger.info('Module terminated successfully')];
                    case 4:
                        // Log termination before logger terminates
                        _a.sent();
                        // Terminate the logger last
                        return [4 /*yield*/, this.logger.terminate()];
                    case 5:
                        // Terminate the logger last
                        _a.sent();
                        return [2 /*return*/, this.createResult(true, { terminated: true }, undefined)];
                    case 6:
                        error_4 = _a.sent();
                        this.updateLifecycle(types_1.ModelLifecycleState.Error);
                        return [4 /*yield*/, this.logger.error('Termination failed', error_4)];
                    case 7:
                        _a.sent();
                        if (this.options.debug) {
                            console.error("[".concat(this.getModuleIdentifier(), "] Termination error:"), error_4);
                        }
                        // Still try to terminate the logger
                        return [4 /*yield*/, this.logger.terminate().catch(function () { })];
                    case 8:
                        // Still try to terminate the logger
                        _a.sent();
                        return [2 /*return*/, this.createResult(false, undefined, error_4 instanceof Error ? error_4.message : String(error_4))];
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Hook for subclass termination implementation
     */
    BaseModel.prototype.onTerminate = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/];
            });
        });
    };
    /**
     * Create a standardized result object
     */
    BaseModel.prototype.createResult = function (success, data, error) {
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
    BaseModel.prototype.updateLifecycle = function (newState) {
        var prevState = this.state.lifecycle;
        this.state.lifecycle = newState;
        this.state.lastStateChangeTime = Date.now();
        // Only log if the logger is initialized and not terminating/terminated
        if (this.logger &&
            this.logger.getState().lifecycle !== types_1.ModelLifecycleState.Terminating &&
            this.logger.getState().lifecycle !== types_1.ModelLifecycleState.Terminated) {
            // Don't await this to avoid blocking the state transition
            this.logger.debug('State transition', { from: prevState, to: newState }).catch(function () { });
        }
        if (this.options.debug) {
            console.log("[".concat(this.getModuleIdentifier(), "] State transition: ").concat(prevState, " -> ").concat(newState));
        }
    };
    /**
     * Get a standardized identifier for this module
     */
    BaseModel.prototype.getModuleIdentifier = function () {
        return this.options.id ||
            "".concat(this.options.name, "@").concat(this.options.version);
    };
    return BaseModel;
}());
exports.BaseModel = BaseModel;
/**
 * Reference implementation of BaseModel
 * Provides a concrete implementation that can be used directly
 */
var StandardModel = /** @class */ (function (_super) {
    __extends(StandardModel, _super);
    function StandardModel() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * Process input data with default implementation
     */
    StandardModel.prototype.onProcess = function (input) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Basic input validation to reject undefined or null
                if (input === undefined) {
                    throw new Error('Input cannot be undefined');
                }
                // This is a simple pass-through implementation
                // Real modules would implement their specific logic
                return [2 /*return*/, input];
            });
        });
    };
    return StandardModel;
}(BaseModel));
exports.StandardModel = StandardModel;
/**
 * Create a standard model instance with the specified options
 */
function createModel(options) {
    if (options === void 0) { options = {}; }
    return new StandardModel(options);
}
/**
 * Create and initialize a model in a single step
 * This is a convenience function that combines creation and initialization
 */
function createAndInitializeModel() {
    return __awaiter(this, arguments, void 0, function (options) {
        var model, result;
        if (options === void 0) { options = {}; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    model = createModel(options);
                    return [4 /*yield*/, model.initialize()];
                case 1:
                    result = _a.sent();
                    if (!result.success) {
                        throw new Error("Failed to initialize model: ".concat(result.error));
                    }
                    return [2 /*return*/, model];
            }
        });
    });
}
// Export module creation functionality
var create_module_1 = require("./create-module");
Object.defineProperty(exports, "createModule", { enumerable: true, get: function () { return create_module_1.createModule; } });
// Export testing adapter functionality
var model_test_adapter_1 = require("./model-test-adapter");
Object.defineProperty(exports, "createModelTestAdapter", { enumerable: true, get: function () { return model_test_adapter_1.createModelTestAdapter; } });
Object.defineProperty(exports, "ModelTestAdapter", { enumerable: true, get: function () { return model_test_adapter_1.ModelTestAdapter; } });
// Export all types
__exportStar(require("./types"), exports);
