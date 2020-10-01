/**
 * # index.ts
 *
 * ---
 *
 * Main route file. This route triggers only with a POST request, and only if it contains the correct header.
 *
 * Currently there's a custom header, `query-kind`. It may contain:
 * - leadgen
 * - membership
 * - verification
 *
 * TODO Verification not yet implemented
 *
 * Each triggers a different action, but they all revolve around parsing the data and storing it in the database.
 * We use SQLite as the database because this is very low-volume so simplicity and portability was much more important than performance.
 *
 * #### leadgen | `POST`
 * `leadgen` grabs the data from the form present in the website, parses it and stores it in the database.
 * It then triggers an email asking for verification.
 *
 * #### verifcation | `POST`
 * `verification` sets the verified status of a lead with an unique token, and triggers a second email, with some info and stuff and asking if
 * they want to apply for membership.
 * This link contains the unique token of the verification, which is then read by the membership form page where it leads to.
 *
 * #### membership | `POST`
 * `membership` grabs the data sent by the membership form page, stores it in the database and triggers an email to contacto@nodoambiental.org informing
 * that someon wants to apply for membership.
 * @packageDocumentation
 */

// TODO Break up file in smaller ones

// Imports
import * as express from "express"
import { uid } from "rand-token"
import { Database } from "sqlite3"
import { escape } from "sqlstring"

// TODO Documentation!

type tableField = {
    column: string
    datatype: string
}

type rowType = (string | number | boolean)[]

type rowFields = {
    columns: string[]
    rows: rowType[]
}

type setType = {
    column: string
    data: string | number | null
}

type rowFieldUpdate = {
    set: setType[]
    where: setType
}

type selectQuery = {
    column: string
    data: string
    operator: "=" | "<>" | "!=" | "<" | ">" | "<=" | ">=" | ""
}

type extraSelectQuery = {
    conditionType: "ALL" | "AND" | "ANY" | "BETWEEN" | "EXISTS" | "IN" | "LIKE" | "NOT" | "OR"
    conditionQuery: selectQuery
}

type selectField = {
    columnsToSelect: string[]
    where: {
        query: selectQuery
        extraConditions?: extraSelectQuery[]
    }
}

type callbackData = {
    error: Error
    result: Record<string, string | number | null | undefined>[]
    query: string
    data: selectField
}

const router = express.Router()

class DatabaseHandler {
    constructor(location?: string) {
        this.filename = location
    }

    public callbackData: callbackData = {
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

    public openDB() {
        this.database = new Database(this.filename, (error) => {
            if (error) {
                console.error(error.message)
            }
            console.log("Connected to the database.")
        })
    }

    public createTable(name: string, fields: tableField[]) {
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

    public insertRows(table: string, data: rowFields) {
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

    public updateRows(table: string, data: rowFieldUpdate[]) {
        this.database.serialize(() => {
            data.forEach((queryToExecute, index) => {
                const sets = Object.entries(queryToExecute)[0][1] as setType[] // Retrieve sets array
                const where = Object.entries(queryToExecute)[1][1] as setType // Retrieve where object

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

    public select(table: string, data: selectField[], callback: () => void) {
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

    public closeDB() {
        this.database.close()
        console.log("Closed the database. \n")
    }
}

const leadsTable: tableField[] = [
    {
        column: "name",
        datatype: "TEXT",
    },
    {
        column: "organization",
        datatype: "TEXT",
    },
    {
        column: "role",
        datatype: "TEXT",
    },
    {
        column: "email",
        datatype: "TEXT",
    },
    {
        column: "mailing_list",
        datatype: "INTEGER",
    },
    {
        column: "membership_interest",
        datatype: "INTEGER",
    },
    {
        column: "message",
        datatype: "TEXT",
    },
    {
        column: "verification_token",
        datatype: "TEXT UNIQUE",
    },
    {
        column: "autokey",
        datatype: "INTEGER PRIMARY KEY",
    },
]

const membership_applicantsTable: tableField[] = [
    {
        column: "name",
        datatype: "TEXT",
    },
    {
        column: "ID",
        datatype: "TEXT UNIQUE",
    },
    {
        column: "ID_type",
        datatype: "TEXT",
    },
    {
        column: "zip",
        datatype: "TEXT",
    },
    {
        column: "title",
        datatype: "TEXT",
    },
    {
        column: "message",
        datatype: "TEXT",
    },
    {
        column: "autokey",
        datatype: "INTEGER PRIMARY KEY",
    },
]

/* POST home page. */

export const PostRoute = router.post("/", (req, res) => {
    const query_kind = req.headers["query-kind"]

    if (query_kind === "leadgen") {
        const leadData: rowFields = {
            columns: [
                "email",
                "name",
                "organization",
                "role",
                "message",
                "mailing_list",
                "membership_interest",
                "verification_token",
            ],
            rows: [
                [
                    req.body.email,
                    req.body.name,
                    req.body.organization ?? "",
                    req.body.role ?? "",
                    req.body.message ?? "",
                    req.body.mailing_list,
                    req.body.membership_interest,
                    "", // verification token empty string
                ],
            ],
        }

        const interesadosDB = new DatabaseHandler("./db/interesados.db")

        interesadosDB.openDB()

        interesadosDB.createTable("leads", leadsTable)

        interesadosDB.insertRows("leads", leadData)

        interesadosDB.closeDB()

        res.redirect("https://nodoambiental.org/leadgen_success.html")
    }

    if (query_kind === "membership") {
        const membershipData: rowFields = {
            columns: ["name", "ID_type", "ID", "zip", "title", "autokey", "message"],
            rows: [
                [
                    req.body.name,
                    req.body.ID_type,
                    req.body.ID,
                    req.body.zip,
                    req.body.title ?? "",
                    req.body.autokey,
                    req.body.message,
                ],
            ],
        }

        const selectionToMake: selectField[] = [
            {
                columnsToSelect: ["verification_token"],
                where: {
                    query: {
                        column: "verification_token",
                        data: `"${String(req.body.verification_token)}"`,
                        operator: "=",
                    },
                },
            },
        ]

        const selectCallback = () => {
            if (
                interesadosDB.callbackData.result !== undefined &&
                interesadosDB.callbackData.result !== null &&
                typeof interesadosDB.callbackData.result === "object" &&
                interesadosDB.callbackData.result.length === undefined
            ) {
                const result = Object.entries(interesadosDB.callbackData.result)[0][1]

                const verification =
                    typeof result === "string" && result === req.body.verification_token
                        ? true
                        : false

                if (verification) {
                    interesadosDB.createTable("membership_applicants", membership_applicantsTable)
                    interesadosDB.insertRows("membership_applicants", membershipData)

                    interesadosDB.closeDB()

                    res.redirect("https://nodoambiental.org/membership/application_success.html")

                    return
                }

                interesadosDB.closeDB()

                res.redirect("https://nodoambiental.org/membership/invalid_token.html")

                return
            }

            interesadosDB.closeDB()

            res.redirect("https://nodoambiental.org/membership/invalid_data.html")
        }

        const interesadosDB = new DatabaseHandler("./db/interesados.db")

        interesadosDB.openDB()

        interesadosDB.select("leads", selectionToMake, selectCallback)
    }

    if (query_kind === "verification") {
        if (typeof req.body.autokey === "number") {
            const updateTokenData: rowFieldUpdate[] = [
                {
                    set: [
                        {
                            column: "verification_token",
                            data: uid(16),
                        },
                    ],
                    where: {
                        column: "autokey",
                        data: req.body.autokey,
                    },
                },
            ]
            const interesadosDB = new DatabaseHandler("./db/interesados.db")

            interesadosDB.openDB()

            // console.log(leadsTable)
            interesadosDB.createTable("leads", leadsTable)

            // console.log(leadData)
            interesadosDB.updateRows("leads", updateTokenData)

            interesadosDB.closeDB()

            res.redirect("https://nodoambiental.org/leadgen/verification_success.html")

            return
        }

        res.redirect("https://nodoambiental.org/leadgen/invalid_data.html")
    }
})
