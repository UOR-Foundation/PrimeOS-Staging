"use strict";
/**
 * Model Test Adapter
 * =================
 *
 * This file provides an adapter for making models testable using the os-tests framework.
 * It implements the TestableInterface from os-tests to allow models to be registered
 * and tested using the standard testing framework.
 */
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
exports.ModelTestAdapter = void 0;
exports.createModelTestAdapter = createModelTestAdapter;
var types_1 = require("./types");
var os_tests_1 = require("../os-tests");
/**
 * Test adapter for model instances
 * This class wraps a model instance and makes it testable using the os-tests framework
 */
var ModelTestAdapter = /** @class */ (function () {
    /**
     * Create a new model test adapter
     */
    function ModelTestAdapter(model, options) {
        this.testCases = [];
        this.tags = ['model'];
        this.model = model;
        if (options === null || options === void 0 ? void 0 : options.tags) {
            this.tags = __spreadArray(__spreadArray([], this.tags, true), options.tags, true);
        }
        if (options === null || options === void 0 ? void 0 : options.testCases) {
            this.testCases = __spreadArray(__spreadArray([], this.testCases, true), options.testCases, true);
        }
        // Add default test cases if none provided
        if (this.testCases.length === 0) {
            this.testCases = [
                { name: 'model-initialization', input: null },
                { name: 'model-simple-process', input: 'test-data' },
                { name: 'model-reset', input: null },
            ];
        }
    }
    /**
     * Validate base requirements for the model
     */
    ModelTestAdapter.prototype.validateBase = function () {
        try {
            // Check if model is initialized
            var state = this.model.getState();
            if (state.lifecycle === types_1.ModelLifecycleState.Error) {
                return {
                    id: 'model-base-validation',
                    status: os_tests_1.TestResultStatus.Failed,
                    error: 'Model is in error state',
                    duration: 0,
                    timestamp: Date.now(),
                    source: 'model-test-adapter'
                };
            }
            if (state.lifecycle !== types_1.ModelLifecycleState.Ready) {
                return {
                    id: 'model-base-validation',
                    status: os_tests_1.TestResultStatus.Failed,
                    error: "Model is not ready (current state: ".concat(state.lifecycle, ")"),
                    duration: 0,
                    timestamp: Date.now(),
                    source: 'model-test-adapter'
                };
            }
            // All checks passed
            return {
                id: 'model-base-validation',
                status: os_tests_1.TestResultStatus.Passed,
                duration: 0,
                timestamp: Date.now(),
                source: 'model-test-adapter'
            };
        }
        catch (error) {
            return {
                id: 'model-base-validation',
                status: os_tests_1.TestResultStatus.Error,
                error: error instanceof Error ? error.message : String(error),
                duration: 0,
                timestamp: Date.now(),
                source: 'model-test-adapter'
            };
        }
    };
    /**
     * Run tests for the model
     */
    ModelTestAdapter.prototype.runTests = function () {
        return __awaiter(this, void 0, void 0, function () {
            var results, startTime, _i, _a, testCase, caseStartTime, state, resetResult, result, error_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        results = {};
                        startTime = Date.now();
                        _i = 0, _a = this.testCases;
                        _b.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 8];
                        testCase = _a[_i];
                        caseStartTime = Date.now();
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 6, , 7]);
                        // Special handling for initialization and reset test cases
                        if (testCase.name === 'model-initialization') {
                            state = this.model.getState();
                            results[testCase.name] = {
                                id: testCase.name,
                                status: state.lifecycle === types_1.ModelLifecycleState.Ready ?
                                    os_tests_1.TestResultStatus.Passed : os_tests_1.TestResultStatus.Failed,
                                error: state.lifecycle !== types_1.ModelLifecycleState.Ready ?
                                    "Model not in ready state: ".concat(state.lifecycle) : undefined,
                                duration: Date.now() - caseStartTime,
                                timestamp: Date.now(),
                                source: 'model-test-adapter'
                            };
                            return [3 /*break*/, 7];
                        }
                        if (!(testCase.name === 'model-reset')) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.model.reset()];
                    case 3:
                        resetResult = _b.sent();
                        results[testCase.name] = (0, os_tests_1.modelResultToTestResult)(resetResult, testCase.name, 'model-test-adapter');
                        return [3 /*break*/, 7];
                    case 4: return [4 /*yield*/, this.model.process(testCase.input)];
                    case 5:
                        result = _b.sent();
                        // If expected result is provided, validate against it
                        if (testCase.expectedResult !== undefined) {
                            if (JSON.stringify(result.data) !== JSON.stringify(testCase.expectedResult)) {
                                results[testCase.name] = {
                                    id: testCase.name,
                                    status: os_tests_1.TestResultStatus.Failed,
                                    error: "Expected ".concat(JSON.stringify(testCase.expectedResult), " but got ").concat(JSON.stringify(result.data)),
                                    duration: Date.now() - caseStartTime,
                                    timestamp: Date.now(),
                                    source: 'model-test-adapter'
                                };
                                return [3 /*break*/, 7];
                            }
                        }
                        // Default pass-through of result
                        results[testCase.name] = (0, os_tests_1.modelResultToTestResult)(result, testCase.name, 'model-test-adapter');
                        return [3 /*break*/, 7];
                    case 6:
                        error_1 = _b.sent();
                        results[testCase.name] = {
                            id: testCase.name,
                            status: os_tests_1.TestResultStatus.Error,
                            error: error_1 instanceof Error ? error_1.message : String(error_1),
                            duration: Date.now() - caseStartTime,
                            timestamp: Date.now(),
                            source: 'model-test-adapter'
                        };
                        return [3 /*break*/, 7];
                    case 7:
                        _i++;
                        return [3 /*break*/, 1];
                    case 8: return [2 /*return*/, results];
                }
            });
        });
    };
    /**
     * Get metadata about the tests for this module
     */
    ModelTestAdapter.prototype.getTestMetadata = function () {
        // Get the module name from the source property of a result
        // which will contain the module identifier (name@version or id)
        var testResult = this.model.createResult(true);
        var sourceParts = testResult.source.split('@');
        return {
            moduleName: "model-".concat(sourceParts[0] || 'unnamed'),
            version: sourceParts.length > 1 ? sourceParts[1] : '0.1.0',
            testCount: this.testCases.length,
            tags: this.tags
        };
    };
    return ModelTestAdapter;
}());
exports.ModelTestAdapter = ModelTestAdapter;
/**
 * Create a test adapter for a model instance
 */
function createModelTestAdapter(model, options) {
    return new ModelTestAdapter(model, options);
}
