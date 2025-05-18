"use strict";
/**
 * os-tests Types
 * ========
 *
 * Type definitions for the standardized testing framework for PrimeOS applications.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestResultStatus = void 0;
/**
 * Test result status enumeration
 */
var TestResultStatus;
(function (TestResultStatus) {
    TestResultStatus["Passed"] = "passed";
    TestResultStatus["Failed"] = "failed";
    TestResultStatus["Skipped"] = "skipped";
    TestResultStatus["Timeout"] = "timeout";
    TestResultStatus["Error"] = "error";
})(TestResultStatus || (exports.TestResultStatus = TestResultStatus = {}));
