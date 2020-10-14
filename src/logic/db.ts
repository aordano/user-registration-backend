/**
 * # Logic > db.ts
 *
 * ---
 *
 * This file handles all the logic relared to the database handling. The idea is to have it defined here and be called from the
 * route, keeping it clean.
 *
 * ---
 *
 * TODO Documentation
 *
 * TODO:Minor Add return type and data to pass to the email stuff that goes after this
 *
 * TODO:Patch Add error handling
 *
 * TODO:Minor Make more generic the table and stuff handling to allow extensibility in the future as needed
 *
 * TODO:Major Make it so the verified people that want to be in the mailing list are copied to another table for mailing list uses
 *
 * ---
 * @packageDocumentation
 */

/**
 * * ------------------------------->>
 * * Imports
 * * ------------------------------->>
 */

import { Request, Response } from "express"
import { resolve } from "path"
import { uid } from "rand-token"
import * as Types from "../types"
import * as Utils from "../utils"

/**
 * * ---------------------------------------------------------->>
 * * Class to define what to do once the relevant route is hit
 * * ---------------------------------------------------------->>
 */

/**
 * ## queryHandler
 *
 * ---
 *
 * ### Why
 *
 * This class manages the requests made to the main endpoint.
 *
 * The idea of having it in another place than the route is to make it clean and easy to understand, without bloat.
 *
 * So basically you give this the tables, the request and response objects and it performs all the stuff related to the data and queries to the database.
 *
 * ### How
 *
 * When a `new queryHandler()` is called, we initialize it with all the data present in the route.
 *
 * It has no defaults set.
 *
 * This data is transfered to an `.request`, `.response` and `.tables` objects to be inherited from the route def.
 *
 * Inside `queryHandler` there's the methods for manipulating the responses and calling the databasey stuff, namely `.leadgenQuery()`,
 * `.verificationQuery()` and `.membershipQuery()`. This methods unsurprisingly handle the leadgen, verification and membership stages of the contact.
 *
 * So basically all the logic _related to the database and redirects/responses_ is defined in here, so this class and its methods are a bit custom, and
 * making this more general would be pointlessly hard.
 *
 * The mini-format used here is to prepend the case to the `Query` word as the method name, so if you add a method that handles the `potato` case,
 * you should call it as `.potatoQuery()`. The class contains internally all the data relevant, given when it's initialized, so there should be no
 * arguments present in the method call. The idea behind this is to make it super clean and concise in the route.
 *
 * ### Usage
 *
 * You simply create an instance of the class (should be imported as a namespace, so it would be something like `import DB from "../logic"`)
 * as you usually create an instance of any class:
 *
 * ```typescript
 *
 * import * as Logic from "../logic"
 *
 * const POSTQuery = new Logic.DB.queryHandler(req, res, myTables)
 *
 *
 * ```
 *
 * Then you call what you need according to the cases you're handling:
 *
 * ```typescript
 *
 * switch (queryKind) {
 *      case "leadgen":
 *          POSTQuery.leadgenQuery()
 *          return
 *      default:
 *          return
 * }
 *
 *
 * ```
 *
 *
 * ---
 */
export class Handler {
    constructor(
        request: Request,
        response: Response<any>,
        tables: { leads: Types.tableField[]; membership: Types.tableField[] }
    ) {
        this.request = request
        this.response = response
        this.tables = tables
    }

    /**
     * ### Description
     *
     * This object holds the table definition data for all the needed tables.
     *
     * The idea is to make it easy for the methods to process the stuff while keeping it clean.
     *
     * Every table definition should be added as a child of the root object feeded to the class, with the key as relevant name of the table.
     *
     * For the structure surrounding the table datatypes see {@link Types.tableField}.
     *
     * ---
     */
    private tables

    /**
     * ### Description
     *
     * The request object, no changes, as passed to the route.
     *
     * ---
     */
    private request

    /**
     * ### Description
     *
     * The response object, no changes, as passed to the route.
     *
     * ---
     */
    private response

    /**
     * <script src="../assets/js/dagre.js"></script>
     * <script src="../assets/js/nomnoml.js"></script>
     * <script src="../assets/js/custom.js"></script>
     *
     * ---
     *
     * ### Description
     *
     * This method handles the logic behind the leadgen database handling.
     *
     * The idea here is to check that everything's fine and then write the data to a database table for further use.
     * The data is recorded _always_, even if it's duplicate or garbage (as long as all the fields are valid).
     * This is by design. We would want to have everyone recorded for further use if needed.
     *
     * So basically:
     *
     * <div class="diagram" id="leadgenQueryDiagram"></div>
     *
     * <script>
     *      var canvas = document.getElementById('leadgen-query-diagram');
     *      var source = `
     *
     *#title: Leadgen Query Diagram
     *#stroke: #333333
     *#fill: #C9C0FF; D9D0FF
     *#lineWidth: 2
     *#bendSize: 2
     *#edges: rounded
     *
     *          [<start>s] -> [leadgenQuery() is called]
     *          [leadgenQuery() is called] -> [Data is read from the request]
     *          [Data is read from the request] -> [Discard garbage data]
     *          [Discard garbage data] -> [Redirect to garbage data page]
     *          [Redirect to garbage data page] -> [Return with nonzero exit code]
     *          [Return with nonzero exit code] -> [<end>e]
     *          [Data is read from the request] -> [Write data into the DB]
     *          [Write data into the DB] -> [Redirect to mail verification page]
     *          [Redirect to mail verification page] -> [Return with zero exit code]
     *          [Return with zero exit code] -> [<end>e]
     *      `;
     *      document.getElementById("leadgenQueryDiagram").appendChild(HTMLStringToElement(nomnoml.renderSvg(source)));
     * </script>
     *
     *
     * ---
     *
     * ### Usage
     *
     * Just call it after created the instance of this class.
     *
     * ```typescript
     *
     * const query = new queryHandler(
     *      request,
     *      response,
     *      {
     *          leads: leadsTable,
     *          membership: membership_applicantsTable,
     *      }
     * )
     *
     * query.leadgenQuery()
     *
     * ```
     *
     * ---
     *
     * ### Comment
     *
     *
     *
     * ---
     */
    public leadgenQuery = (): number => {
        const leadData = Utils.Functions.parseRequestData(this.request, this.tables.leads)

        const rowsWithoutProtectedFields = leadData.rows.filter((row, rowIndex) => {
            if (
                leadData.columns[rowIndex] !== "verification_token" ||
                leadData.columns[rowIndex] !== "autokey"
            ) {
                return row
            }
        })

        if (rowsWithoutProtectedFields.indexOf(undefined) !== -1) {
            // Let's make sure we don't even try to process garbage data.

            // ? It is important that the form in the frontend passes the optative elements with some empty placeholder data
            // so it's not blackholed just because the person didn't fill a field.

            this.response.redirect("https://nodoambiental.org/leadgen/invalid_data.html")

            return 1
        }

        const interesadosDB = new Utils.DB.Handler(resolve(__dirname, "../../db/interesados.db"))

        interesadosDB.openDB()

        interesadosDB.createTable("leads", this.tables.leads)

        interesadosDB.insertRows("leads", leadData)

        interesadosDB.closeDB()

        this.response.redirect("https://nodoambiental.org/leadgen/contact_success.html")

        return 0
    }

    public verificationQuery = (): number => {
        if (typeof parseInt(this.request.query.autokey) === "number") {
            const updateTokenData: Types.rowFieldUpdate[] = [
                {
                    set: [
                        {
                            column: "verification_token",
                            data: uid(32),
                        },
                    ],
                    where: {
                        column: "autokey",
                        data: parseInt(this.request.query.autokey),
                    },
                },
            ]
            const interesadosDB = new Utils.DB.Handler(
                resolve(__dirname, "../../db/interesados.db")
            )

            interesadosDB.openDB()

            interesadosDB.createTable("leads", this.tables.leads)

            interesadosDB.updateRows("leads", updateTokenData)

            interesadosDB.closeDB()

            this.response.redirect("https://nodoambiental.org/leadgen/verification_success.html")

            return 0
        }

        this.response.redirect("https://nodoambiental.org/leadgen/invalid_data.html")

        return 1
    }

    public membershipQuery = (): number => {
        const membershipData = Utils.Functions.parseRequestData(
            this.request,
            this.tables.membership
        )

        const selectionToMake: Types.selectField[] = [
            {
                columnsToSelect: ["verification_token"],
                where: {
                    query: {
                        column: "verification_token",
                        data: `"${String(this.request.body.verification_token)}"`,
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
                    typeof result === "string" && result === this.request.body.verification_token
                        ? true
                        : false

                if (verification) {
                    interesadosDB.createTable("membership_applicants", this.tables.membership)
                    interesadosDB.insertRows("membership_applicants", membershipData)

                    interesadosDB.closeDB()

                    this.response.redirect(
                        "https://nodoambiental.org/membership/application_success.html"
                    )

                    return 0
                }

                interesadosDB.closeDB()

                this.response.redirect("https://nodoambiental.org/membership/invalid_token.html")

                return 1
            }

            interesadosDB.closeDB()

            this.response.redirect("https://nodoambiental.org/membership/invalid_data.html")

            return 2
        }

        const interesadosDB = new Utils.DB.Handler(resolve(__dirname, "../../db/interesados.db"))

        if (membershipData.rows.indexOf(undefined) !== -1) {
            this.response.redirect("https://nodoambiental.org/leadgen/invalid_data.html")
            return
        } else {
            interesadosDB.openDB()

            let exitCode

            interesadosDB.select("leads", selectionToMake, () => {
                exitCode = selectCallback()
            })

            return exitCode // I think this does not work, maybe i should try to await the call
        }
    }
}
