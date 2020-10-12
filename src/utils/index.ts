/**
 * # Utils > index.ts
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

export * as DB from "./db"
export * as Email from "./email"
export * as Functions from "./functions"
