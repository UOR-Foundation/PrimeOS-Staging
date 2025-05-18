"use strict";
/**
 * Model Types
 * ===========
 *
 * Type definitions for the model module that define the standard pattern for all PrimeOS modules.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelLifecycleState = void 0;
/**
 * Model lifecycle state
 */
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
