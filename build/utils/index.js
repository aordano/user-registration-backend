"use strict";
/**
 * # index.ts
 *
 * ---
 *
 * Utils namespace exports.
 *
 * This file grabs exports from other utility files, and exports them as namespaced for every file.
 *
 * In this way, you can import this file like:
 *
 * ```typescript
 *
 * import * as Utils from "../utils"
 *
 *
 * ```
 *
 * Where you can use the namespacess that there are inside:
 *
 * ```typescript
 *
 * myDB = new Utils.DB.Handler()
 *
 *
 * ```
 *
 * @packageDocumentation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DB = void 0;
exports.DB = require("./db");
