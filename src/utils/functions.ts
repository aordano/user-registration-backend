/**
 * # Utils > functions.ts
 *
 * ---
 *
 * Generic functions used in the project. May be refactored into specific files arisen the need.
 *
 * ---
 * @packageDocumentation
 */

// Imports
import * as Types from "../types"

/**
 * @param request Request made to the endpoint.
 * @param table JSON object of the table to handle.
 *
 * ### Description
 *
 * This simple function reads the columns to be verified/manipulated, from the definition of the table in the JSON file.
 *
 * Then it grabs the column name and records every entry in the body that has a key matching it, and registers the data it contains as part
 * of the row to update/handle.
 *
 * It returns the row info parsed from the body, matching the field it corresponds to.
 *
 * ### Usage
 *
 * Simply call the function giving the parsed JSON object of the table definition, and the request received, and it will crank out the data.
 *
 * ```typescript
 *
 * const awesomeData = parseRequestData(request, awesomeTable)
 *
 *
 * ```
 *
 * ### Comments
 *
 * TODO:Patch Add typings to the request parameter
 *
 * ---
 */
export const parseRequestData = (request, table: Types.tableField[]): Types.rowFields => {
    const columns = table.map((field: Types.tableField) => {
        return field.column
    })
    const rows = columns.map((column: string, index) => {
        // Placeholder lack of data makes sure then can be a check for missing fields
        const placeholderData = undefined

        if (column === "verification_token") {
            return ""
        }
        return request.body[column] ?? placeholderData
    })

    return { columns, rows }
}
