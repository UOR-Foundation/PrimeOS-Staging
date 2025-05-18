"use strict";
/**
 * OS Model Mock for Testing
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
exports.BaseModel = exports.ModelLifecycleState = void 0;
var ModelLifecycleState;
(function (ModelLifecycleState) {
    ModelLifecycleState["Uninitialized"] = "uninitialized";
    ModelLifecycleState["Initializing"] = "initializing";
    ModelLifecycleState["Ready"] = "ready";
    ModelLifecycleState["Processing"] = "processing";
    ModelLifecycleState["Error"] = "error";
    ModelLifecycleState["Terminating"] = "terminating";
    ModelLifecycleState["Terminated"] = "terminated";
})(ModelLifecycleState || (exports.ModelLifecycleState = ModelLifecycleState = {}));
var BaseModel = /** @class */ (function () {
    function BaseModel(options) {
        if (options === void 0) { options = {}; }
        var _this = this;
        this.options = __assign({ debug: false, name: 'base-model', version: '1.0.0' }, options);
        this.state = {
            lifecycle: ModelLifecycleState.Uninitialized,
            lastStateChangeTime: Date.now(),
            uptime: 0,
            operationCount: {
                total: 0,
                success: 0,
                failed: 0
            }
        };
        // Simple mock logger
        this.logger = {
            debug: function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                    return [2 /*return*/, Promise.resolve()];
                }); });
            },
            info: function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                    return [2 /*return*/, Promise.resolve()];
                }); });
            },
            warn: function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                    return [2 /*return*/, Promise.resolve()];
                }); });
            },
            error: function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                    return [2 /*return*/, Promise.resolve()];
                }); });
            }
        };
    }
    BaseModel.prototype.initialize = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.state.lifecycle = ModelLifecycleState.Initializing;
                        this.state.lastStateChangeTime = Date.now();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.onInitialize()];
                    case 2:
                        _a.sent();
                        this.state.lifecycle = ModelLifecycleState.Ready;
                        return [2 /*return*/, this.createResult(true)];
                    case 3:
                        error_1 = _a.sent();
                        this.state.lifecycle = ModelLifecycleState.Error;
                        return [2 /*return*/, this.createResult(false, undefined, error_1.message)];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    BaseModel.prototype.onInitialize = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/];
            });
        });
    };
    BaseModel.prototype.process = function (input) {
        return __awaiter(this, void 0, void 0, function () {
            var result, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.state.lifecycle !== ModelLifecycleState.Ready) {
                            throw new Error('Model is not ready for processing');
                        }
                        this.state.lifecycle = ModelLifecycleState.Processing;
                        this.state.operationCount.total++;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.onProcess(input)];
                    case 2:
                        result = _a.sent();
                        this.state.operationCount.success++;
                        this.state.lifecycle = ModelLifecycleState.Ready;
                        return [2 /*return*/, result];
                    case 3:
                        error_2 = _a.sent();
                        this.state.operationCount.failed++;
                        this.state.lifecycle = ModelLifecycleState.Error;
                        throw error_2;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    BaseModel.prototype.onProcess = function (input) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                throw new Error('onProcess method must be implemented by subclasses');
            });
        });
    };
    BaseModel.prototype.reset = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.onReset()];
                    case 1:
                        _a.sent();
                        this.state.operationCount = {
                            total: 0,
                            success: 0,
                            failed: 0
                        };
                        this.state.lastStateChangeTime = Date.now();
                        return [2 /*return*/, this.createResult(true)];
                    case 2:
                        error_3 = _a.sent();
                        return [2 /*return*/, this.createResult(false, undefined, error_3.message)];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    BaseModel.prototype.onReset = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/];
            });
        });
    };
    BaseModel.prototype.terminate = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.state.lifecycle = ModelLifecycleState.Terminating;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.onTerminate()];
                    case 2:
                        _a.sent();
                        this.state.lifecycle = ModelLifecycleState.Terminated;
                        return [2 /*return*/, this.createResult(true)];
                    case 3:
                        error_4 = _a.sent();
                        this.state.lifecycle = ModelLifecycleState.Error;
                        return [2 /*return*/, this.createResult(false, undefined, error_4.message)];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    BaseModel.prototype.onTerminate = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/];
            });
        });
    };
    BaseModel.prototype.getState = function () {
        return __assign({}, this.state);
    };
    BaseModel.prototype.createResult = function (success, data, error) {
        return {
            success: success,
            data: data,
            error: error,
            timestamp: Date.now(),
            source: this.options.name || 'unknown'
        };
    };
    return BaseModel;
}());
exports.BaseModel = BaseModel;
