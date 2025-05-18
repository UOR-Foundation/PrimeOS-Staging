"use strict";
/**
 * os-tests Implementation
 * ========
 *
 * This module implements a standardized testing framework for PrimeOS applications.
 * It follows the standard PrimeOS model pattern.
 *
 * It also provides mock implementations of core system modules for testing.
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
exports.TestFrameworkImplementation = void 0;
exports.createTestFramework = createTestFramework;
exports.createAndInitializeTestFramework = createAndInitializeTestFramework;
exports.modelResultToTestResult = modelResultToTestResult;
var fs = require("fs");
var model_1 = require("../model");
var types_1 = require("./types");
/**
 * Default options for test framework
 */
var DEFAULT_OPTIONS = {
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
var TestFrameworkImplementation = /** @class */ (function (_super) {
    __extends(TestFrameworkImplementation, _super);
    /**
     * Create a new testing framework instance
     */
    function TestFrameworkImplementation(options) {
        if (options === void 0) { options = {}; }
        // Initialize BaseModel with options
        var _this = _super.call(this, __assign(__assign({}, DEFAULT_OPTIONS), options)) || this;
        /**
         * Collection of registered modules to test
         */
        _this.modules = new Map();
        return _this;
    }
    /**
     * Module-specific initialization logic
     */
    TestFrameworkImplementation.prototype.onInitialize = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
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
                        return [4 /*yield*/, this.logger.debug('Test framework initialized with options', this.options)];
                    case 1:
                        // Log initialization
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Register a module to be tested
     */
    TestFrameworkImplementation.prototype.register = function (module) {
        var metadata = module.getTestMetadata();
        this.modules.set(metadata.moduleName, module);
        // Update state
        var state = this.getState();
        if (!state.custom) {
            state.custom = {
                registeredModules: []
            };
        }
        state.custom.registeredModules = Array.from(this.modules.keys());
        this.logger.info("Registered module for testing: ".concat(metadata.moduleName));
        return this;
    };
    /**
     * Run all registered tests
     */
    TestFrameworkImplementation.prototype.runAll = function () {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, allResults, totalTests, passedTests, failedTests, skippedTests, _i, _a, _b, moduleName, module_1, baseResult, results, resultsCount, passedCount, failedCount, skippedCount, error_1, duration, state;
            var _this = this;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        this.logger.info("Running tests for ".concat(this.modules.size, " registered modules"));
                        startTime = Date.now();
                        allResults = {};
                        totalTests = 0;
                        passedTests = 0;
                        failedTests = 0;
                        skippedTests = 0;
                        _i = 0, _a = this.modules.entries();
                        _c.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 6];
                        _b = _a[_i], moduleName = _b[0], module_1 = _b[1];
                        this.logger.debug("Testing module: ".concat(moduleName));
                        baseResult = module_1.validateBase();
                        if (baseResult.status === types_1.TestResultStatus.Failed || baseResult.status === types_1.TestResultStatus.Error) {
                            this.logger.error("Module ".concat(moduleName, " failed base validation: ").concat(baseResult.error));
                            allResults[moduleName] = {
                                baseValidation: baseResult
                            };
                            failedTests += 1;
                            totalTests += 1;
                            if (this.options.failFast) {
                                this.logger.warn("Aborting further tests due to failFast option");
                                return [3 /*break*/, 6];
                            }
                            return [3 /*break*/, 5];
                        }
                        _c.label = 2;
                    case 2:
                        _c.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, module_1.runTests()];
                    case 3:
                        results = _c.sent();
                        allResults[moduleName] = results;
                        resultsCount = Object.keys(results).length;
                        passedCount = Object.values(results).filter(function (r) { return r.status === types_1.TestResultStatus.Passed; }).length;
                        failedCount = Object.values(results).filter(function (r) { return r.status === types_1.TestResultStatus.Failed ||
                            r.status === types_1.TestResultStatus.Error; }).length;
                        skippedCount = Object.values(results).filter(function (r) { return r.status === types_1.TestResultStatus.Skipped; }).length;
                        totalTests += resultsCount;
                        passedTests += passedCount;
                        failedTests += failedCount;
                        skippedTests += skippedCount;
                        // Log results summary
                        if (this.options.verbose) {
                            Object.entries(results).forEach(function (_a) {
                                var testName = _a[0], result = _a[1];
                                var status = result.status === types_1.TestResultStatus.Passed ? 'PASSED' :
                                    result.status === types_1.TestResultStatus.Failed ? 'FAILED' :
                                        result.status === types_1.TestResultStatus.Skipped ? 'SKIPPED' :
                                            result.status === types_1.TestResultStatus.Error ? 'ERROR' : 'TIMEOUT';
                                _this.logger.debug("  ".concat(testName, ": ").concat(status));
                                if (result.status !== types_1.TestResultStatus.Passed) {
                                    _this.logger.debug("    Error: ".concat(result.error));
                                }
                            });
                        }
                        this.logger.info("Module ".concat(moduleName, ": ").concat(passedCount, "/").concat(resultsCount, " tests passed"));
                        if (failedCount > 0 && this.options.failFast) {
                            this.logger.warn("Aborting further tests due to failFast option");
                            return [3 /*break*/, 6];
                        }
                        return [3 /*break*/, 5];
                    case 4:
                        error_1 = _c.sent();
                        this.logger.error("Error running tests for module ".concat(moduleName, ": ").concat(error_1));
                        allResults[moduleName] = {
                            execution: {
                                id: 'execution',
                                status: types_1.TestResultStatus.Error,
                                error: error_1 instanceof Error ? error_1.message : String(error_1),
                                duration: 0,
                                timestamp: Date.now(),
                                source: moduleName
                            }
                        };
                        failedTests += 1;
                        totalTests += 1;
                        if (this.options.failFast) {
                            this.logger.warn("Aborting further tests due to failFast option");
                            return [3 /*break*/, 6];
                        }
                        return [3 /*break*/, 5];
                    case 5:
                        _i++;
                        return [3 /*break*/, 1];
                    case 6:
                        duration = Date.now() - startTime;
                        state = this.getState();
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
                            duration: duration
                        };
                        // Log overall summary
                        this.logger.info("\nTest Summary:");
                        this.logger.info("  Modules tested: ".concat(Object.keys(allResults).length));
                        this.logger.info("  Tests executed: ".concat(totalTests));
                        this.logger.info("  Tests passed: ".concat(passedTests));
                        this.logger.info("  Tests failed: ".concat(failedTests));
                        this.logger.info("  Tests skipped: ".concat(skippedTests));
                        this.logger.info("  Total duration: ".concat(duration, "ms"));
                        this.logger.info("  Success rate: ".concat(Math.round((passedTests / totalTests) * 100), "%"));
                        if (!this.options.reportPath) return [3 /*break*/, 8];
                        return [4 /*yield*/, this.generateReport(allResults)];
                    case 7:
                        _c.sent();
                        _c.label = 8;
                    case 8: return [2 /*return*/, allResults];
                }
            });
        });
    };
    /**
     * Run tests with specific tags
     */
    TestFrameworkImplementation.prototype.runWithTags = function (tags) {
        return __awaiter(this, void 0, void 0, function () {
            var filteredModules, _i, _a, _b, moduleName, module_2, metadata, originalModules, results;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        this.logger.info("Running tests with tags: ".concat(tags.join(', ')));
                        filteredModules = new Map();
                        for (_i = 0, _a = this.modules.entries(); _i < _a.length; _i++) {
                            _b = _a[_i], moduleName = _b[0], module_2 = _b[1];
                            metadata = module_2.getTestMetadata();
                            if (metadata.tags.some(function (tag) { return tags.includes(tag); })) {
                                filteredModules.set(moduleName, module_2);
                            }
                        }
                        originalModules = this.modules;
                        this.modules = filteredModules;
                        return [4 /*yield*/, this.runAll()];
                    case 1:
                        results = _c.sent();
                        // Restore original modules
                        this.modules = originalModules;
                        return [2 /*return*/, results];
                }
            });
        });
    };
    /**
     * Run tests for a specific module
     */
    TestFrameworkImplementation.prototype.runForModule = function (moduleName) {
        return __awaiter(this, void 0, void 0, function () {
            var module, errorResult, baseResult, results, resultsCount, passedCount, error_2, errorResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        module = this.modules.get(moduleName);
                        if (!module) {
                            this.logger.error("Module ".concat(moduleName, " not found"));
                            errorResult = {
                                id: 'module-not-found',
                                status: types_1.TestResultStatus.Error,
                                error: "Module ".concat(moduleName, " not found"),
                                duration: 0,
                                timestamp: Date.now(),
                                source: this.options.name || 'os-tests'
                            };
                            return [2 /*return*/, { 'module-not-found': errorResult }];
                        }
                        this.logger.info("Running tests for module: ".concat(moduleName));
                        baseResult = module.validateBase();
                        if (baseResult.status === types_1.TestResultStatus.Failed || baseResult.status === types_1.TestResultStatus.Error) {
                            this.logger.error("Module ".concat(moduleName, " failed base validation: ").concat(baseResult.error));
                            return [2 /*return*/, { baseValidation: baseResult }];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, module.runTests()];
                    case 2:
                        results = _a.sent();
                        resultsCount = Object.keys(results).length;
                        passedCount = Object.values(results).filter(function (r) { return r.status === types_1.TestResultStatus.Passed; }).length;
                        this.logger.info("Module ".concat(moduleName, ": ").concat(passedCount, "/").concat(resultsCount, " tests passed"));
                        return [2 /*return*/, results];
                    case 3:
                        error_2 = _a.sent();
                        this.logger.error("Error running tests for module ".concat(moduleName, ": ").concat(error_2));
                        errorResult = {
                            id: 'execution-error',
                            status: types_1.TestResultStatus.Error,
                            error: error_2 instanceof Error ? error_2.message : String(error_2),
                            duration: 0,
                            timestamp: Date.now(),
                            source: moduleName
                        };
                        return [2 /*return*/, { 'execution-error': errorResult }];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Generate report from test results
     */
    TestFrameworkImplementation.prototype.generateReport = function (results) {
        return __awaiter(this, void 0, void 0, function () {
            var format, reportPath;
            return __generator(this, function (_a) {
                format = this.options.reportFormat || 'json';
                reportPath = this.options.reportPath || "test-report.".concat(format);
                this.logger.info("Generating ".concat(format, " report at ").concat(reportPath));
                switch (format) {
                    case 'json':
                        return [2 /*return*/, this.generateJsonReport(results, reportPath)];
                    case 'html':
                        return [2 /*return*/, this.generateHtmlReport(results, reportPath)];
                    case 'console':
                    default:
                        return [2 /*return*/, this.generateConsoleReport(results)];
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Generate JSON report
     */
    TestFrameworkImplementation.prototype.generateJsonReport = function (results, reportPath) {
        return __awaiter(this, void 0, void 0, function () {
            var state, report, content;
            var _a;
            return __generator(this, function (_b) {
                state = this.getState();
                report = {
                    timestamp: Date.now(),
                    framework: {
                        name: this.options.name,
                        version: this.options.version
                    },
                    stats: ((_a = state.custom) === null || _a === void 0 ? void 0 : _a.stats) || {
                        total: 0,
                        passed: 0,
                        failed: 0,
                        skipped: 0,
                        duration: 0
                    },
                    results: results
                };
                content = JSON.stringify(report, null, 2);
                fs.writeFileSync(reportPath, content);
                return [2 /*return*/, reportPath];
            });
        });
    };
    /**
     * Generate HTML report
     */
    TestFrameworkImplementation.prototype.generateHtmlReport = function (results, reportPath) {
        return __awaiter(this, void 0, void 0, function () {
            var state, stats, html, _i, _a, _b, moduleName, moduleResults, _c, _d, _e, testName, result, statusClass;
            var _f;
            return __generator(this, function (_g) {
                state = this.getState();
                stats = ((_f = state.custom) === null || _f === void 0 ? void 0 : _f.stats) || {
                    total: 0,
                    passed: 0,
                    failed: 0,
                    skipped: 0,
                    duration: 0
                };
                html = "\n    <!DOCTYPE html>\n    <html>\n    <head>\n      <title>PrimeOS Test Report</title>\n      <style>\n        body { font-family: Arial, sans-serif; margin: 20px; }\n        h1 { color: #333; }\n        .summary { background: #f5f5f5; padding: 10px; border-radius: 5px; margin-bottom: 20px; }\n        .module { margin-bottom: 20px; border: 1px solid #ddd; border-radius: 5px; overflow: hidden; }\n        .module-header { background: #eee; padding: 10px; font-weight: bold; }\n        .test { padding: 10px; border-bottom: 1px solid #eee; }\n        .test:last-child { border-bottom: none; }\n        .passed { border-left: 5px solid #4CAF50; }\n        .failed { border-left: 5px solid #F44336; }\n        .skipped { border-left: 5px solid #9E9E9E; }\n        .error { border-left: 5px solid #FF9800; }\n        .timeout { border-left: 5px solid #9C27B0; }\n      </style>\n    </head>\n    <body>\n      <h1>PrimeOS Test Report</h1>\n      <div class=\"summary\">\n        <h2>Summary</h2>\n        <p>Timestamp: ".concat(new Date().toISOString(), "</p>\n        <p>Framework: ").concat(this.options.name, " v").concat(this.options.version, "</p>\n        <p>Modules tested: ").concat(Object.keys(results).length, "</p>\n        <p>Tests executed: ").concat(stats.total, "</p>\n        <p>Tests passed: ").concat(stats.passed, "</p>\n        <p>Tests failed: ").concat(stats.failed, "</p>\n        <p>Tests skipped: ").concat(stats.skipped, "</p>\n        <p>Total duration: ").concat(stats.duration, "ms</p>\n        <p>Success rate: ").concat(Math.round((stats.passed / (stats.total || 1)) * 100), "%</p>\n      </div>\n    ");
                // Add module results
                for (_i = 0, _a = Object.entries(results); _i < _a.length; _i++) {
                    _b = _a[_i], moduleName = _b[0], moduleResults = _b[1];
                    html += "\n      <div class=\"module\">\n        <div class=\"module-header\">".concat(moduleName, "</div>\n      ");
                    for (_c = 0, _d = Object.entries(moduleResults); _c < _d.length; _c++) {
                        _e = _d[_c], testName = _e[0], result = _e[1];
                        statusClass = result.status === types_1.TestResultStatus.Passed ? 'passed' :
                            result.status === types_1.TestResultStatus.Failed ? 'failed' :
                                result.status === types_1.TestResultStatus.Skipped ? 'skipped' :
                                    result.status === types_1.TestResultStatus.Error ? 'error' : 'timeout';
                        html += "\n        <div class=\"test ".concat(statusClass, "\">\n          <div><strong>").concat(testName, "</strong>: ").concat(result.status, "</div>\n          <div>Duration: ").concat(result.duration, "ms</div>\n          ").concat(result.error ? "<div>Error: ".concat(result.error, "</div>") : '', "\n        </div>\n        ");
                    }
                    html += "</div>";
                }
                html += "\n    </body>\n    </html>\n    ";
                fs.writeFileSync(reportPath, html);
                return [2 /*return*/, reportPath];
            });
        });
    };
    /**
     * Generate console report
     */
    TestFrameworkImplementation.prototype.generateConsoleReport = function (results) {
        return __awaiter(this, void 0, void 0, function () {
            var state, stats, report, _i, _a, _b, moduleName, moduleResults, _c, _d, _e, testName, result, status_1;
            var _f;
            return __generator(this, function (_g) {
                state = this.getState();
                stats = ((_f = state.custom) === null || _f === void 0 ? void 0 : _f.stats) || {
                    total: 0,
                    passed: 0,
                    failed: 0,
                    skipped: 0,
                    duration: 0
                };
                report = '\nPrimeOS Test Report\n';
                report += '=================\n\n';
                report += "Framework: ".concat(this.options.name, " v").concat(this.options.version, "\n");
                report += "Timestamp: ".concat(new Date().toISOString(), "\n\n");
                report += 'Summary:\n';
                report += "  Modules tested: ".concat(Object.keys(results).length, "\n");
                report += "  Tests executed: ".concat(stats.total, "\n");
                report += "  Tests passed: ".concat(stats.passed, "\n");
                report += "  Tests failed: ".concat(stats.failed, "\n");
                report += "  Tests skipped: ".concat(stats.skipped, "\n");
                report += "  Total duration: ".concat(stats.duration, "ms\n");
                report += "  Success rate: ".concat(Math.round((stats.passed / (stats.total || 1)) * 100), "%\n\n");
                // Add module results
                for (_i = 0, _a = Object.entries(results); _i < _a.length; _i++) {
                    _b = _a[_i], moduleName = _b[0], moduleResults = _b[1];
                    report += "Module: ".concat(moduleName, "\n");
                    report += '----------------------------------------\n';
                    for (_c = 0, _d = Object.entries(moduleResults); _c < _d.length; _c++) {
                        _e = _d[_c], testName = _e[0], result = _e[1];
                        status_1 = result.status === types_1.TestResultStatus.Passed ? 'PASSED' :
                            result.status === types_1.TestResultStatus.Failed ? 'FAILED' :
                                result.status === types_1.TestResultStatus.Skipped ? 'SKIPPED' :
                                    result.status === types_1.TestResultStatus.Error ? 'ERROR' : 'TIMEOUT';
                        report += "  ".concat(testName, ": ").concat(status_1, "\n");
                        report += "    Duration: ".concat(result.duration, "ms\n");
                        if (result.error) {
                            report += "    Error: ".concat(result.error, "\n");
                        }
                        report += '\n';
                    }
                }
                this.logger.info(report);
                return [2 /*return*/, report];
            });
        });
    };
    /**
     * Process input data with module-specific logic
     * This is used to run tests via the standard model interface
     */
    TestFrameworkImplementation.prototype.onProcess = function (input) {
        return __awaiter(this, void 0, void 0, function () {
            var results_1, tag, results_2, results_3, results_4, config, results;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.logger.debug('Processing input in test framework', input)];
                    case 1:
                        _a.sent();
                        if (!(typeof input === 'string')) return [3 /*break*/, 7];
                        if (!this.modules.has(input)) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.runForModule(input)];
                    case 2:
                        results_1 = _a.sent();
                        return [2 /*return*/, results_1];
                    case 3:
                        if (!input.startsWith('tag:')) return [3 /*break*/, 5];
                        tag = input.substring(4);
                        return [4 /*yield*/, this.runWithTags([tag])];
                    case 4:
                        results_2 = _a.sent();
                        return [2 /*return*/, results_2];
                    case 5:
                        if (!(input === 'run-all')) return [3 /*break*/, 7];
                        return [4 /*yield*/, this.runAll()];
                    case 6:
                        results_3 = _a.sent();
                        return [2 /*return*/, results_3];
                    case 7:
                        if (!Array.isArray(input)) return [3 /*break*/, 9];
                        return [4 /*yield*/, this.runWithTags(input)];
                    case 8:
                        results_4 = _a.sent();
                        return [2 /*return*/, results_4];
                    case 9:
                        if (!(input && typeof input === 'object')) return [3 /*break*/, 15];
                        config = input;
                        if (!config.moduleName) return [3 /*break*/, 11];
                        return [4 /*yield*/, this.runForModule(config.moduleName)];
                    case 10: return [2 /*return*/, (_a.sent())];
                    case 11:
                        if (!config.tags) return [3 /*break*/, 13];
                        return [4 /*yield*/, this.runWithTags(config.tags)];
                    case 12: return [2 /*return*/, (_a.sent())];
                    case 13:
                        if (config.reportFormat) {
                            this.options.reportFormat = config.reportFormat;
                        }
                        if (config.reportPath) {
                            this.options.reportPath = config.reportPath;
                        }
                        if (!config.runAll) return [3 /*break*/, 15];
                        return [4 /*yield*/, this.runAll()];
                    case 14: return [2 /*return*/, (_a.sent())];
                    case 15: return [4 /*yield*/, this.runAll()];
                    case 16:
                        results = _a.sent();
                        return [2 /*return*/, results];
                }
            });
        });
    };
    /**
     * Clean up resources when module is reset
     */
    TestFrameworkImplementation.prototype.onReset = function () {
        return __awaiter(this, void 0, void 0, function () {
            var state;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Clear registered modules
                        this.modules.clear();
                        state = this.getState();
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
                        return [4 /*yield*/, this.logger.debug('Test framework reset')];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Clean up resources when module is terminated
     */
    TestFrameworkImplementation.prototype.onTerminate = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Clear registered modules
                        this.modules.clear();
                        return [4 /*yield*/, this.logger.debug('Test framework terminated')];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return TestFrameworkImplementation;
}(model_1.BaseModel));
exports.TestFrameworkImplementation = TestFrameworkImplementation;
/**
 * Create a testing framework instance with the specified options
 */
function createTestFramework(options) {
    if (options === void 0) { options = {}; }
    return new TestFrameworkImplementation(options);
}
/**
 * Create and initialize a testing framework instance in a single step
 */
function createAndInitializeTestFramework() {
    return __awaiter(this, arguments, void 0, function (options) {
        var instance, result;
        if (options === void 0) { options = {}; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    instance = createTestFramework(options);
                    return [4 /*yield*/, instance.initialize()];
                case 1:
                    result = _a.sent();
                    if (!result.success) {
                        throw new Error("Failed to initialize testing framework: ".concat(result.error));
                    }
                    return [2 /*return*/, instance];
            }
        });
    });
}
/**
 * Helper to convert model results to test results
 */
function modelResultToTestResult(result, id, source) {
    return {
        id: id,
        status: result.success ? types_1.TestResultStatus.Passed : types_1.TestResultStatus.Failed,
        data: result.success ? result.data : undefined,
        error: result.success ? undefined : result.error,
        duration: result.duration || 0,
        timestamp: result.timestamp,
        source: source
    };
}
// Export types
// Export test framework types and implementation
__exportStar(require("./types"), exports);
// Export mocks for use in tests across the project
__exportStar(require("./mocks"), exports);
