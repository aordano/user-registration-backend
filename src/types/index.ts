/**
 * # Types > index.ts
 *
 * ---
 *
 * Type aliases definition file.
 *
 * This aliases are consumed by the rest of the application, for ease of work and preventing errors at compile time.
 * @packageDocumentation
 */

/**
 * @property **column**: Name of the column.
 * @property **datatype**: Datatype to be registered for the column.
 *
 * ---
 *
 * ### Description
 *
 * Type definition for fields of a table (Giving the name of the column and its datatype).
 *
 * The `datatype` property should be bounded by the datatypes that SQLite 3 accepts, rather than a arbitrary string.
 *
 * ### Usage
 *
 * ```json
 * {
 *  "column": "name",
 *  "datatype": "TEXT"
 * }
 * ```
 *
 * This would be used to construct the `CREATE TABLE` query.
 *
 * ### Comment
 *
 * TODO:Patch Bound `datatype` options to what SQLite accepts.
 *
 * ---
 */
export type tableField = {
    column: string
    datatype: string
}

/**
 * ### Description
 *
 * Simple discriminator to bound the field information to accepted types.
 *
 * ---
 */
export type data = string | number | null

/**
 * ### Description
 *
 * Simple discriminator to bound the row information to accepted types.
 *
 * The _Type_ suffix is pointless given that this file is loaded as a namespace.
 *
 * ### Comment
 *
 * TODO Remove pointless _Type_ suffix.
 *
 * ---
 */
export type rowType = data[]

/**
 * @property **columns**: Array containing the name of the relevant columns.
 * @property **rowFields**: Array containing the data of every row, given it complies with the restrictions imposed by `Types.rowType`.
 *
 * ---
 *
 * ### Description
 *
 * It is important to note that the `rows` array and the `columns` array should be always of the same length, given the indexes have to be
 * referential to match the column to the data of the row; the _nth_ data in `rows` will be written relevant to the _nth_ string in `columns`.
 * Maybe this should be a map instead.
 *
 * ### Usage
 *
 * ```json
 * {
 *     "columns": [
 *         "name",
 *         "age"
 *     ],
 *     "rows": [
 *         [
 *             "John Smith",
 *             23
 *         ],
 *         [
 *             "Smith Smith",
 *             45
 *         ]
 *     ]
 * }
 * ```
 * This would end up in an `INSERT` statement, matching the indexes.
 *
 * ### Comment
 *
 * TODO:Patch Make sure both properties have always the same length.
 *
 * ---
 */
export type rowFields = {
    columns: string[]
    rows: rowType[]
}

/**
 * @property **column**: Name of the relevant column.
 * @property **data**: Data to be matched in the relevant column.
 *
 * ---
 *
 * ### Description
 *
 * Nothing fancy here, just a small structure to be orderly when referencing a set to discriminate against.
 *
 * ### Usage
 *
 * ```json
 * {
 *  "column": "name",
 *  "data": "John"
 * }
 * ```
 * Here the column `name` would be affected, given the data provided.
 *
 * ---
 */
export type set = {
    column: string
    data: data
}

/**
 * @property **set**: Contains all the discriminators to pull data from, when doing an `UPDATE` operation.
 * @property **where**: Discriminator to be used to select the data when performing the operation.
 *
 * ---
 *
 * ### Description
 *
 * It's a bit confusing, so maybe it should be _more_ aliased so it's more obvious and expressive what it is and what it is for.
 *
 * ### Usage
 *
 * ```json
 * {
 *  "set": [
 *      {
 *          "column": "name",
 *          "data": "New and Tasty John"
 *      }
 *  ],
 *  "where": {
 *      "column": "name",
 *      "data": "John"
 *  }
 * }
 * ```
 * This would be read like `UPDATE <table name> SET name = 'New and Tasty John' WHERE name = "John"`
 *
 * ### Comment
 *
 * TODO:Patch Fix aliasing and make it easily understandable.
 *
 * ---
 */
export type rowFieldUpdate = {
    set: set[]
    where: set
}

/**
 * @property **column**: Column where to operate the selection. (left side of the comparation)
 * @property **data**: Data used to select. (right side of the comparation)
 * @property **operator**: Operator to define the kind of comparison.
 *
 * ---
 *
 * ### Description
 *
 * This simply provides a bit of bounded structure to define a `WHERE` when making a `SELECT` query. It is just fancy talk, given this
 * is just a simple comparison, but having it split in this way allows to have data coming from different parts without clashing and to
 * be more careful with the sourcing of data without having pointless complexity or wasted resources processing parts that you know are safe.
 *
 * ### Usage
 *
 * In this way, an object like
 *
 * ```json
 *
 * {
 *     "column": "name",
 *     "data": "John Smith Smith",
 *     "operator": "="
 * }
 *
 *
 * ```
 * would be read as `... WHERE name = 'John Smith Smith' ...`
 *
 * ---
 */
export type selectQuery = {
    column: string
    data: string
    operator: "=" | "<>" | "!=" | "<" | ">" | "<=" | ">=" | ""
}

/**
 * @property **conditionType**: Type of condition relationship.
 * @property **conditionQuery**: Comparison to be made when selecting.
 *
 * ---
 *
 * ### Description
 *
 * When you do a `SELECT` operation, the `WHERE` part may contain additional conditions to be met, so this provides structure to define and arbitrary
 * number of extra conditions as needed, without sacrificing the benefits outlined in `Types.selectQuery`
 *
 * ### Usage
 *
 * ```json
 *
 * {
 *  "conditionType": "AND",
 *  "conditionQuery": {
 *      "column": "surname",
 *      "data": "Smith",
 *      "operator": "="
 *  }
 * }
 *
 *
 * ```
 *
 * So this would end up in a `SELECT` statement as `... WHERE <condition given previously> AND surname = 'Smith'`
 *
 * ---
 */
export type extraSelectQuery = {
    conditionType: "ALL" | "AND" | "ANY" | "BETWEEN" | "EXISTS" | "IN" | "LIKE" | "NOT" | "OR" | ""
    conditionQuery: selectQuery
}

/**
 * @property **columnsToSelect**: Columns to be affected by the selection.
 * @property **where**: Conditions to be met for selection.
 * @property **where.query**: Main condition for the selection
 * @property **where.extraConditions**: Optative additional conditions for selection.
 *
 * ---
 *
 * ### Description
 *
 * When you do a `SELECT` operation, the `WHERE` part may contain additional conditions to be met, so this provides structure to define and arbitrary
 * number of extra conditions as needed, without sacrificing the benefits outlined in `Types.selectQuery`. The separation of concerns could be improved.
 *
 * ### Usage
 *
 * ```json
 *
 * {
 *  "columnsToSelect": [
 *      "name",
 *      "surname"
 *  ],
 *  "where": {
 *      "query": {
 *          "column": "name",
 *          "data": "John",
 *          "operator": "="
 *      },
 *      "extraConditions": [
 *          {
 *              "conditionType": "AND",
 *              "conditionQuery": {
 *                  "column": "surname",
 *                  "data": "Smith",
 *                  "operator": "="
 *              }
 *          }
 *      ]
 *  }
 * }
 * ```
 *
 * So this is the final structure used for selecting data. It defines the totality of the `WHERE` part of the statement. In the example given,
 * the query would end up like `... WHERE name = 'John' AND surname = 'Smith'`.
 *
 * It may seem like pointless complexity but allows a _lot_ of flexibility and separation of concerns of the data. Ordering it this way makes it easier to
 * make it work with stores, like Redux or MobX.
 *
 * ### Comment
 *
 * TODO:Minor Improve separation of concerns between data and columns/operators to be used.
 *
 * ---
 */
export type selectField = {
    columnsToSelect: string[]
    where: {
        query: selectQuery
        extraConditions?: extraSelectQuery[]
    }
}

/**
 * @property **error**: Error output from the request, if any.
 * @property **result**: Result of the request, if any.
 * @property **query**: String containing the query to the database.
 * @property **data**: Original data sent to conform the request when invoking `select()`.
 *
 * ---
 *
 * ### Description
 *
 * When you perform a `SELECT` operation, once it's completed the method stores the relevant info in an object part of the instance you're currently
 * working on. This object contains the return information from the request (the error and result parameters), the query string and the data passed to the
 * select method.
 *
 * ### Usage
 * (more accurately, an example of how the data would be presented)
 *
 *
 * ```json
 * {
 *  "error": "",
 *  "result": [
 *      {
 *          "name": "John"
 *      }
 *  ],
 *  "query": "SELECT name FROM people WHERE name = 'John'",
 *  "data": {
 *      "columnsToSelect": [
 *          "name",
 *      ],
 *      "where": {
 *          "query": {
 *              "column": "name",
 *              "data": "John",
 *              "operator": "="
 *          }
 *      }
 *  }
 * }
 * ```
 *
 * The `result` property is defined as an array of `Record` because always the kind of resulting data will be bound by the allowed
 * types in SQLite, where the output is an object containing a property with the key as the name of the originating column and value as the
 * data it contains.
 *
 * ---
 */
export type callbackData = {
    error: Error
    result: Record<string, data | undefined>[]
    query: string
    data: selectField
}

export type mailConfig = {
    host: string
    port: number
    secure: boolean
    auth: {
        user: string
        pass: string
    }
}

export type messageConfig = {
    from: string
    to: string
    subject: string
}

export type messageHTML = string

export type emailCompositor = {
    queryKind: string
    body: messageHTML
}

export type composedEmail = {
    messageConfig: messageConfig
    body: string
}

interface MJMLParseError {
    line: number
    message: string
    tagName: string
    formattedMessage: string
}

export interface MJMLParseResults {
    html: string
    errors: MJMLParseError[]
}

export type templateReplaces = {
    target: string
    content: string
}
