"use strict";
/**
 * Logging Types
 * =======
 *
 * Type definitions for the logging module.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogLevel = void 0;
/**
 * Log level enumeration
 */
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["TRACE"] = 0] = "TRACE";
    LogLevel[LogLevel["DEBUG"] = 1] = "DEBUG";
    LogLevel[LogLevel["INFO"] = 2] = "INFO";
    LogLevel[LogLevel["WARN"] = 3] = "WARN";
    LogLevel[LogLevel["ERROR"] = 4] = "ERROR";
    LogLevel[LogLevel["FATAL"] = 5] = "FATAL";
    LogLevel[LogLevel["NONE"] = 6] = "NONE";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
