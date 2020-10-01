import { Database } from "sqlite3"
import { escape } from "sqlstring"
import * as Types from "../types"

export class Handler {
    constructor(location?: string) {
        this.filename = location
    }

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

    private filename = ":memory:"

    private database: Database

    public openDB(): void {
        this.database = new Database(this.filename, (error) => {
            if (error) {
                console.error(error.message)
            }
            console.log("Connected to the database.")
        })
    }

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

    public updateRows(table: string, data: Types.rowFieldUpdate[]): void {
        this.database.serialize(() => {
            data.forEach((queryToExecute, index) => {
                const sets = Object.entries(queryToExecute)[0][1] as Types.set[] // Retrieve sets array
                const where = Object.entries(queryToExecute)[1][1] as Types.set // Retrieve where object

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

    public select(table: string, data: Types.selectField[], callback: () => void): void {
        // FIXME See wtf is going on that it outputs before executing the queries
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

    public closeDB(): void {
        this.database.close()
        console.log("Closed the database. \n")
    }
}
