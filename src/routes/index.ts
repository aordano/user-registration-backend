import * as express from "express"
import { Database, Statement} from "sqlite3"
import { escape } from "sqlstring"

// TODO Documentation!


type tableField = {
    column: string,
    datatype: string
}

type rowType = (string|number|boolean)[]

type rowFields = {
    columns: string[],
    rows: rowType[]
}

const router = express.Router()

class DatabaseHandler {
    constructor(location?: string) {
        this.filename = location
      }

    private filename: string = ":memory:"

    private database: Database

    public openDB() {
        this.database = new Database(this.filename, (error) => {
            if (error) {
              console.error(error.message)
            }
            console.log('Connected to the database.')
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
                    const placeholders = row.map(() => { return `?` })

                    const query = `INSERT INTO ${table}(${columns.join(",")}) VALUES (${placeholders.join(",")})`

                    this.database.run(
                        query,
                        escapedValues,
                        (error) => {
                            if (error) { 
                                const errorMessage = `Error in data inserting, query failed: \n 
                                    INSERT INTO ${table}(${columns}) VALUES \n 
                                    ${escapedValues} \n
                                    `
    
                                console.log(errorMessage)
                                return console.error(error.message)
                            }
                        }
                    )
                    
                    console.log(`Queried an INSERT in table ${table}, columns ${columns} adding ${allRows.length} rows.`)
                }

                
            })
        })

    }

    public closeDB() {
        this.database.close()
        console.log('Closed the database. \n')
    }
}


const leadsTable: tableField[] = [
    {
        column: "name",
        datatype: "TEXT"
    },
    {
        column: "organization",
        datatype: "TEXT"
    },
    {
        column: "role",
        datatype: "TEXT"
    },
    {
        column: "email",
        datatype: "TEXT"
    },
    {
        column: "mailing_list",
        datatype: "INTEGER"
    },
    {
        column: "membership_interest",
        datatype: "INTEGER"
    },
    {
        column: "message",
        datatype: "TEXT"
    },
    {
        column: "autokey",
        datatype: "INTEGER PRIMARY KEY"
    }
]

const membership_applicantsTable: tableField[] = [
    {
        column: "name",
        datatype: "TEXT"
    },
    {
        column: "ID",
        datatype: "TEXT"
    },
    {
        column: "ID_type",
        datatype: "TEXT"
    },
    {
        column: "zip",
        datatype: "TEXT"
    },
    {
        column: "title",
        datatype: "TEXT"
    },
    {
        column: "autokey",
        datatype: "INTEGER PRIMARY KEY"
    }
]

/* POST home page. */

export const PostRoute = router.post('/', async (req, res) => {
    
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
                "membership_interest"
            ],
            rows: [[
                req.body.email,
                req.body.name,
                req.body.organization ?? "",
                req.body.role ?? "",
                req.body.message ?? "",
                req.body.mailing_list,
                req.body.membership_interest
            ]]

        } 

        const interesadosDB = new DatabaseHandler("./db/interesados.db")

        await interesadosDB.openDB()

        // console.log(leadsTable)
        await interesadosDB.createTable("leads", leadsTable)
    
        // console.log(leadData)
        await interesadosDB.insertRows("leads",leadData)
        
        await interesadosDB.closeDB()
    
        res.redirect('https://nodoambiental.org/leadgen_success.html')
    }

    else if (query_kind === "membership") {

        const membershipData: rowFields = {
            columns: [
                "name",
                "ID_type",
                "ID",
                "zip",
                "title",
                "autokey"
            ],
            rows: [[
                req.body.name,
                req.body.ID_type,
                req.body.ID,
                req.body.zip,
                req.body.title ?? "",
                req.body.autokey
            ]]

        } 

        const interesadosDB = new DatabaseHandler("./db/interesados.db")

        interesadosDB.openDB()

        interesadosDB.createTable("membership_applicants", membership_applicantsTable)
    
        interesadosDB.insertRows("membership_applicants",membershipData)
        
        interesadosDB.closeDB()
    
        res.redirect('https://nodoambiental.org/membership_success.html')


    }

});


