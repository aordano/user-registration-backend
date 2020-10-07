/**
 * # Utils > db.ts
 *
 * ---
 *
 * Database handling file.
 * This describes tools to abstract and simplify the use of the `sqlite3` library.
 *
 * It consists of a single class, `Handler`, with methods for opening/creating a DB, creating tables, inserting data, updating data and reading data.
 *
 * It has two private objects, the `database`, where the operations are made, and the `filename`, which describes where is the DB to work with.
 *
 * It has one public object, `callbackData`, which makes available the data resulting of a `SELECT` operation, as well as the data originating the request.
 * @packageDocumentation
 */

/**
 * * ------------------------------->>
 * * Imports
 * * ------------------------------->>
 */

import { Database } from "sqlite3"
import { escape } from "sqlstring"
import * as Types from "../types"

/**
 * * ------------------------------->>
 * * Handler Class for DB Management
 * * ------------------------------->>
 */

/**
 * ## Handler
 *
 * ---
 *
 * ### Why
 *
 * This class is an abstraction to handle a SQLite 3 database.
 *
 * The default API `sqlite3` uses is complex, and it's both hard to read and write code that handles queries, so a simpler abstraction was chosen
 * so the main code is cleaner, more explicit and easier to understand.
 *
 * Also I wanted to make the data handling more friendly, so instead of spiting stuff into the API, this abstraction takes JSON object with a defined structure,
 * which makes it harder to make mistakes, simplifies the handling of the data (whether storing it, or modifying it with JS) and makes it more obvious
 * how things are put together.
 *
 * ### How
 *
 * When a `new Handler()` is called, we initialize it with the string with the location of the database file, relative of the place where it's called.
 *
 * It defaults to a DB in memory if called with no argument.
 *
 * This data is transfered to a `.filename` object to be used to open the DB.
 *
 * Inside `Handler` there's the methods for manipulating the database, namely `.openDB()`, `.createTable()`, `.insertRows()`,
 *`.updateRows()`, `.select()` and `.closeDB()`.
 *
 * This methods grab the data given as a JSON object, the table where to operate and constructs a corresponding query, escaped and sanitized (save for
 * stuff that should be defined by code, not by user, like the table structures. If this needs to be dynamic somehow, aditional steps should be took to
 * clean the column names from anything nefarious), and passes it to `sqlite3`, which performs the operations.
 *
 * ### Usage
 *
 * You simply create an instance of the class (should be imported as a namespace, so it would be something like `import DB from "../utils"`)
 * as you usually create an instance of any class:
 *
 * ```typescript
 *
 * import * as Utils from "../utils"
 *
 * const myDB = new Utils.DB.Handler("path/to/DB.db")
 *
 *
 * ```
 *
 * Which then can be used freely, with its methods applying only to the database relevant to the instance.
 *
 * ---
 *
 *
 */
export class Handler {
    constructor(location?: string) {
        this.filename = location
    }

    /**
     * ### Description
     *
     * This object holds the data relevant to a query, so it's readily available to be consumed by the callback function or something outside
     * the scope of the method that fills this with data.
     *
     * For the structure, see {@link Types.callbackData}, where it's defined.
     *
     * The idea behind putting this information in a public object from the database originates from the need to avoid race conditions and unmanaged asynchronicity
     * when doing the requests to `sqlite3`. Given that the library does not supply a `Promise` when anything is called, and continues execution nonetheless, race conditions
     * are bound to happen where you keep doing stuff synchronously and there's missing data that appears later.
     *
     * Having this here sidesteps the issue altogether, so when the operation is completed and a callback is executed, you know than from that point onwards this
     * will be populated with your data, and if it's not, then there's no data yet. (If we just go with the flow, because we don't have promises we can't know if it's working or the result is empty)
     *
     * It is filled by the fault with empty data.
     *
     * ---
     */
    public callbackData: Types.callbackData = {
        error: new Error(""),
        result: [{ placeholder: "" }],
        query: "",
        data: {
            columnsToSelect: [""],
            where: {
                query: {
                    column: "",
                    data: "",
                    operator: "=",
                },
            },
        },
    }

    /**
     * ### Description
     *
     * This holds the location of the database relative to the source file, defaulting to a in-memory DB. Nothing fancy.
     *
     * ---
     */
    private filename = ":memory:"

    /**
     * ### Description
     *
     * The library used here, `sqlite3`, does all the work on a `Database` object created for the purpose of managing the queries and data.
     * We store that in a private object so it's there available to be worked on by any of the methods, and being something pertaining to the class,
     * you can have as many databases simultaneously as you want, withouth the posibility of any interference, while mantaining the simplicity of contextuality.
     *
     * ---
     *
     */
    private database: Database

    /**
     * ### Description
     *
     * This method simply grabs the filename set when initializing everything, and creates/opens the database according if it exists or not.
     * It has a minor error handling, but it should be better and more descriptive.
     *
     * ### Usage
     *
     * Before doing anything, the database must be created/opened:
     *
     * ```typescript
     *
     * myDB.openDB()
     *
     *
     * ```
     *
     * The method creates the DB if it does not exist, and then opens it, or just opens it if it already exists. The DB is opened with RW permissions,
     * maybe in a future release I could include a parameter to define the permissions when opening it.
     *
     * ### Comment
     *
     * TODO:Patch Improve error handling of `openDB()` method.
     *
     * TODO:Minor Add parameter to define the permissions when opening the database.
     *
     * ---
     */
    public openDB(): void {
        this.database = new Database(this.filename, (error) => {
            if (error) {
                console.error(error.message)
            }
            console.log("Connected to the database.")
        })
    }

    /**
     * @param name Name of the table to create/open.
     * @param fields Fields to be present in the table. This is defined by a JSON object containing a `column` and `datatype` property for every
     * field to be present in the table. See {@link Types.tableField} for more info about the structure (spoiler: it has only two properties).
     *
     * ### Description
     *
     * This simply iterates over the given fields, building the query, and then passing it to `sqlite3` to be run.
     * The inputs are not sanitized, because they are assumed to be from a trusted source, given that you're defining the structure of a
     * table, it is expected you're reading it from a JSON file where everything is defined, and not available for edition by anyone.
     *
     * If some dynamicity is needed, then there has to be an external way of sanitizing and parsing the data before inputing in here.
     *
     * For now this lacks proper error handling.
     *
     * ### Usage
     *
     * Then you open/create the DB, do some stuff, detailed in the examples of every method, and close the database.
     *
     * Once the database is open, you can operate on it:
     *
     * ```typescript
     * import { resolve } from "path"
     * import { readFileSync } from "fs"
     *
     * const myFields = JSON.parse(
     *      readFileSync(
     *          resolve(
     *              __dirname,
     *              "../relative/path/to/fields/data.json"
     *          )
     *      ).toString()
     * )
     *
     * myDB.createTable("myTable, myFields")
     *
     *
     * ```
     *
     * The example given produces a string
     *
     * `CREATE TABLE IF NOT EXISTS myTable (field_1 datatype_1, field_2 datatype_2, ... field_n datatype_n) `
     *
     * In this example I read the data from a `.json` file, but it can be from anywhere, if it ends up being formatted as an object,
     * which the method consumes.
     *
     * ### Comment
     *
     * TODO:Patch Add error handling to the table creation
     *
     * ---
     */
    public createTable(name: string, fields: Types.tableField[]): void {
        let columns = ""
        fields.forEach((field, loopIndex) => {
            if (loopIndex === 0) {
                columns = `${field.column} ${field.datatype}`
            } else {
                columns = `${columns}, ${field.column} ${field.datatype}`
            }
        })

        const query = `CREATE TABLE IF NOT EXISTS ${name}(${columns})`

        this.database.serialize(() => {
            this.database.run(query)
            console.log(`Created table ${name} if it does not exist.`)
        })
    }

    /**
     * @param table Name of the table where to execute the query.
     * @param data Data, organized in an object where you have separation of concerns between the columns and the data to be input.
     * The data is related column-wise by index, but being independant it allows to have an object where you just grab and modify a tiny bit that you want
     * without meddling with anything else. See {@link Types.rowFields} fore more information about the structure of this data.
     *
     * ### Description
     *
     * This function untangles the data given, organizes it and constructs a `INSERT` query for every row, to be executed sequentially.
     * This function _does_ escape the contents to be inserted, and also loads them parameterized. It _does not_ escape or sanitize the column names, as
     * they are assumed to come from a trusted source (that's why there's a separation of concerns and are not mixed together in a simple array). If there's a
     * need for a user inputted column name, it should be sanitized before getting it into the method.
     *
     * Even if there's dynamic requeriments to the columns to be
     * changed, it is still asumed that the available pool of column names to select from is from a trusted source, so it would be strange to need direct user input for
     * the column name.
     *
     * The error handling is very basic and should include what to do when there's an error, besides logging it.
     *
     * ### Usage
     *
     * You provide the data to be inserted to the table, and the table name. This data is an object that contains the relevant information
     * about what to put in there, see {@link Types.rowFields}.
     *
     * ```typescript
     *
     * const myRowsToInsert = {
     *      columns: [
     *          "name",
     *          "surname"
     *      ],
     *      rows: [
     *          [
     *              "John",
     *              "Smith"
     *          ],
     *          [
     *              "Johnny",
     *              "Smithy"
     *          ]
     *      ]
     * }
     *
     * myDB.insertRows("myTable", myRowsToInsert)
     *
     * ```
     *
     * What this does is grab the data given to it, build a `INSERT` string query,
     * ask politely `sqlite3` to insert the data, and log it did so.
     *
     * The example given produces the string `INSERT INTO myTable(name, surname) VALUES ('John', 'Smith'), ('Johnny', 'Smithy')`
     *
     * It escapes the _data_ to be inserted, meaning what's inside `data.rows`, but it _does not_ sanitize nor escape the data
     * present in `data.columns`. This is by design; it's a mess to try to escape column names as strings, and it is assumed that the origin of the data
     * that defines _where_ is to be stuff inserted is trustful. That's why instead of simply doing a nice map or bidimentional array, I opted to
     * split it in an independan property wich you can source from other place safer than the data you're handling.
     *
     * Maybe in a future release it could be made so the columns are also sanitized.
     *
     * ### Comment
     *
     * TODO:Minor Sanitize column names data
     *
     * TODO:Patch Better error handling than just a log.
     *
     * ---
     */
    public insertRows(table: string, data: Types.rowFields): void {
        const columns = Object.entries(data)[0][1] // Retrieve columns array
        const allRows = Object.entries(data)[1][1] // Retrieve rows array

        this.database.serialize(() => {
            allRows.forEach((row) => {
                if (row.length > 1) {
                    const escapedValues = row.map((value) => {
                        if (typeof value === "string") {
                            return escape(value)
                        }
                        return value
                    })
                    const placeholders = row.map(() => {
                        return `?`
                    })

                    const query = `INSERT INTO ${table}(${columns.join(
                        ","
                    )}) VALUES (${placeholders.join(",")})`

                    this.database.run(query, escapedValues, (error) => {
                        if (error) {
                            const errorMessage = `Error in data inserting, query failed: \n 
                                    INSERT INTO ${table}(${columns}) VALUES \n 
                                    ${escapedValues} \n
                                    `

                            console.log(errorMessage)
                            return console.error(error.message)
                        }
                    })

                    console.log(
                        `Queried an INSERT in table ${table}, columns ${columns} adding ${allRows.length} rows.`
                    )
                }
            })
        })
    }

    /**
     * @param table Name of the table to work with.
     * @param data Data to be updated in the given table. This data contains not only the data itself but every part of the `UPDATE` query to be made,
     * giving flexibility to filter and discriminate according to the needs, without sacrificing ease of use.
     *
     * Basically it's:
     *
     * - A condition (the `WHERE`) given in `data.where`.
     * - The set of data to work with, namely the columns and data.
     *
     * See {@link Types.rowFieldUpdate} for more information about the structure of this data.
     *
     * ### Description
     *
     * This function grabs the conditions and data, constructs a `UPDATE` query escaping _the data only_, and gets everything into the meat grinder.
     *
     * It currently has a very basic error handling, and it only supports equalities for selection and discrimination, so that should change
     * in a future release.
     * Also the separation of concerns betwheen the data to update (which is escaped) and the vulnerable information is not good enough.
     *
     * ### Usage
     *
     * This metod grabs the destination table, and the data and uses it to construct a string with an `UPDATE` query.
     *
     * ```typescript
     *
     * const myRowsToUpdate = {
     *      "set": [
     *          {
     *              "column": "name",
     *              "data": "New and Tasty John"
     *          }
     *      ],
     *      "where": {
     *          "column": "name",
     *          "data": "John"
     *      }
     * }
     *
     * myDB.updateRows("myTable", myRowsToUpdate)
     *
     * ```
     *
     * As with all the other methods, given this class is a glorified wrapper, what this one does is construct a string to query the database to perform
     * the given operation. This fabricates a `UPDATE` operation.
     *
     * The values present in all the `data` keys are escaped, and everything else is kept as the input.
     *
     * In the example, the resulting query would be `UPDATE myTable SET name = 'New and Tasty John' WHERE name = 'John'`
     *
     * ### Comment
     *
     * TODO:Minor Maybe the property names from the data given to the method should be renamed to something more obvious and abstracted.
     *
     * TODO:Patch Better error handling than only logging.
     *
     * TODO:Major Support all the conditions and comparators of SQLite 3 rather than just equality.
     *
     * TODO:Minor Improve separation of concerns for vulnerable data.
     *
     * ---
     */
    public updateRows(table: string, data: Types.rowFieldUpdate[]): void {
        this.database.serialize(() => {
            data.forEach((queryToExecute, index) => {
                const sets = Object.entries(queryToExecute)[0][1] as Types.set[] // Retrieve sets array
                const where = Object.entries(queryToExecute)[1][1] as Types.set //  Retrieve where object

                let setQuery = `SET `
                sets.forEach((currentSet, index) => {
                    if (index + 1 !== sets.length) {
                        setQuery = `${setQuery} ${currentSet.column} = ${escape(currentSet.data)}, `
                    } else {
                        setQuery = `${setQuery} ${currentSet.column} = ${escape(currentSet.data)}`
                    }
                })
                const query = `UPDATE ${table} ${setQuery} WHERE ${where.column} = ${escape(
                    where.data
                )}`

                this.database.run(query, [], (error) => {
                    if (error) {
                        const errorMessage = `Error in data updating, query failed: \n 
                            UPDATE ${table} \n
                            ${setQuery} \n
                            WHERE ${where.column} = ${escape(where.data)}`

                        console.log(errorMessage)
                        return console.error(error.message)
                    }
                })

                console.log(
                    `Queried an UPDATE in table ${table}, whith sets \n
                    ${setQuery} \n
                    and WHERE ${where.column} = ${escape(where.data)}`
                )
            })
        })
    }

    /**
     * @param table Name of the table to work with.
     * @param data Data containing the information about how and what to select. The data is nested in a way thet supports the entire spectrum of selection
     * posibilities that SQLite 3 has. See {@link Types.selectField} for more information about its structure.
     * @param callback Function to be executed when the data is finally read. It can be anything.
     *
     * ### Description
     *
     * This method has some particularities that the other ones do not have. Everything takes time and the querying of a database is not exempt from this.
     * So it's expected that queries block the main thread, or children do the work for us. The thing here is that the `sqlite3` node library being used does
     * not support promises easily, so the execution continues and you have now ay of knowing if the `null` or `undefined` you got is a result of the query or
     * if it's just unset stuff because of race conditions.
     *
     * Therefore, it is important to only continue with execution when this callback is fired. This is a small hack that mimics the behaviour of a `.then()`, so you keep
     * doing your stuff inside the callback function.
     *
     * The complexity with that is making available the resulting data to the callback function, so the most practical solution was to simply make it available publicly from an object
     * of the instance of `Handle()` where you're working. See {@link `Handle.callbackData`} for a tad bit of info.
     *
     * The ideal thing here would be to set the return type of the `select()` method as a `Promise` and deliver the data when it's fullfilled, so you can use standard tools like `await` or `.then()`.
     * This was not made like this because the library expects for stuff to return a `Database` object, and I wanted to avoid the complexity of doing so. For a future release.
     *
     * ### Usage
     *
     * This being the most complex operation in SQLite, is also the most complex operation present here. In this case, the complexity is presented
     * in the shape of a deep data structure, where everything is defined and may be not immediately intuitive. In this way, the complexity is offloaded
     * to the data where is easier to handle, and kept the code simpler.
     *
     * ```typescript
     *
     * const mySelection = {
     *      "columnsToSelect": [
     *          "name",
     *          "surname"
     *      ],
     *      "where": {
     *          "query": {
     *              "column": "name",
     *              "data": "John",
     *              "operator": "="
     *          },
     *          "extraConditions": [
     *              {
     *                  "conditionType": "AND",
     *                  "conditionQuery": {
     *                      "column": "surname",
     *                      "data": "Smith",
     *                      "operator": "="
     *                  }
     *              }
     *          ]
     *      }
     * }
     *
     * myDB.select("myTable", mySelection)
     *
     * ```
     *
     * As with everything, the data complexity is kept in a completely different layer than the implementation, where in a few clean lines you can execute
     * the operations needed.
     *
     * As with everything else too, what this method does is construct a string to be used as a query for the database.
     *
     * In the given example, the query would be:
     * `SELECT name, surname FROM myTable WHERE name = 'John' AND surname = 'Smith'`.
     *
     * ### Comment
     *
     * TODO:Minor Implement `Promise` functionality
     *
     * TODO:Patch Add missing error handling
     *
     * ---
     */
    public select(table: string, data: Types.selectField[], callback: () => void): void {
        data.forEach((select) => {
            const columns = select.columnsToSelect.join(", ")
            let whereQuery = `${select.where.query.column} ${select.where.query.operator} ${select.where.query.data}`
            if (select.where.extraConditions) {
                // Add extra conditions to the query, if they are present
                select.where.extraConditions.forEach((conditions) => {
                    const conditionQuery = `${conditions.conditionType} 
                    ${conditions.conditionQuery.column} ${conditions.conditionQuery.operator} ${conditions.conditionQuery.data}`

                    whereQuery = `${whereQuery} ${conditions.conditionType} ${conditionQuery}`
                })
            }
            const query = `SELECT ${columns} FROM ${table} WHERE ${whereQuery}`

            this.database.get(query, [], (error, result) => {
                this.callbackData.data = select
                this.callbackData.error = error
                this.callbackData.query = query
                this.callbackData.result = result
                callback()
            })
        })
    }

    /**
     * ### Description
     *
     * Closes the opened database to finalize the work being made. Not rocket science.
     */
    public closeDB(): void {
        this.database.close()
        console.log("Closed the database. \n")
    }
}
