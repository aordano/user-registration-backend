import * as express from "express"
import * as SQLite from "sqlite3"

type tableField = {
    column: string,
    datatype: string
}

type rowField = {
    column: string,
    values: (string|number|boolean)[]
}

const router = express.Router()

class DatabaseHandler {
    constructor() {  }

    private filename: string = ":memory:"

    private database: SQLite.Database

    public setDB(dbname: string) {
        this.filename = dbname
    }

    public openDB() {
        this.database = new SQLite.Database(this.filename, SQLite.OPEN_READWRITE | SQLite.OPEN_CREATE, (error) => {
            if (error) {
              console.error(error.message);
            }
            console.log('Connected to the database.');
          })
    } 

    public createTable(name: string, fields: tableField[]) {
        let columns = ""
        fields.forEach((field) => {
            columns = `${columns}, ${Object.keys(field)} ${Object.values(field)}`
        })
        let tableString = `CREATE TABLE IF NOT EXISTS ${name} (${columns})`

        this.database.serialize(() => this.database.run(tableString))
    }

    public insertRows(table: string, data: rowField[]) {
        const columns = data.map((row) => { return row.column })
        const values = data.map((column) => { return column.values })
        const placeholders = values.map(() => { return "(?)" }).join(", ")
        
        this.database.serialize(() => {
            columns.forEach((column) => {
                this.database.run(
                    `INSERT INTO ${table}(${column}) VALUES ${placeholders}`,
                    values[columns.indexOf(column)]),
                    (error) => {
                        if (error) {return console.error(error.message)}
                    }
            })
        })
    }

    public closeDB() {
        this.database.close()
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
// TODO Translate this function to typescript 
// TODO Make changes to save stuff in a SQLite file instead
// TODO Change the URL of the success page to reflect that is for membership.

export const PostRoute = router.post('/', function (req, res) {
    
    const query_kind = req.headers["query-kind"]

    if (query_kind === "leadgen") {

        const email: string = req.body.email
        const name: string = req.body.name
        const organization: string = req.body.organization ?? ""
        const role: string = req.body.role ?? ""
        const composed_text: string = req.body.composed_text ?? ""
        const mailing_list: number = req.body.mailing_list
        const membership_interest: number = req.body.membership_interest
        const autokey: string = "NULL"

        const values = Object.entries({
            email,
            name,
            organization,
            role,
            composed_text,
            mailing_list,
            membership_interest,
            autokey
        })
    
        const leadData = values.map((field: any[]): rowField => {
            return {
                column: field[0],
                values: field[1]
            }
        })
    
        const interesadosDB = new DatabaseHandler
    
        interesadosDB.setDB("../interesados.db")
        interesadosDB.openDB()
    
        interesadosDB.createTable("leads", leadsTable)
    
        interesadosDB.insertRows("leads",leadData)
        
        interesadosDB.closeDB()
    
        res.redirect('https://nodoambiental.org/leadgen_success.html')
    }

    if (query_kind === "membership") {

        const name: string = req.body.name
        const ID_type: string = req.body.ID_type
        const ID: string = req.body.ID
        const zip: string = req.body.zip
        const title: number = req.body.title ?? ""
        const autokey: number = req.body.autokey
        
        const values = Object.entries({
            name,
            ID_type,
            ID,
            zip,
            title,
            autokey
        })
    
        const membershipData = values.map((field: any[]): rowField => {
            return {
                column: field[0],
                values: field[1]
            }
        })

        const interesadosDB = new DatabaseHandler
    
        interesadosDB.setDB("../interesados.db")
        interesadosDB.openDB()

        interesadosDB.createTable("membership_applicants", membership_applicantsTable)
    
        interesadosDB.insertRows("leads",membershipData)
        
        interesadosDB.closeDB()
    
        res.redirect('https://nodoambiental.org/membership_success.html')


    }

});


