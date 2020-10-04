/**
 * # Logic > db.ts
 *
 * ---
 *
 *
 * @packageDocumentation
 */

// TODO Documentation!

// TODO:Patch Minor Add return type and data to pass to the email stuff that goes after this

// TODO:Minor Add error handling

// TODO:Minor Make more generic the table and stuff handling to allow extensibility in the future as needed

// Imports
import { Request, Response } from "express"
import { uid } from "rand-token"
import * as Types from "../types"
import * as Utils from "../utils"

/**
 * ## `Document me plz`
 *
 * ---
 */
export class queryHandler {
    constructor(
        request: Request,
        response: Response<any>,
        tables: { leads: Types.tableField[]; membership: Types.tableField[] }
    ) {
        this.request = request
        this.response = response
        this.tables = tables
    }

    private tables

    private request

    private response

    public leadgenQuery = (): void => {
        const leadData = Utils.Functions.parseRequestData(this.request, this.tables.leads)

        if (leadData.rows.indexOf(undefined) !== -1) {
            // Let's make sure we don't even try to process garbage data.
            /**
             * ? It is important that the form in the frontend passes the optative elements with some empty placeholder data
             * so it's not blackholed just because the person didn't fill a field.
             *
             */
            this.response.redirect("https://nodoambiental.org/leadgen/invalid_data.html")

            return
        } else {
            const interesadosDB = new Utils.DB.Handler("./db/interesados.db")

            interesadosDB.openDB()

            interesadosDB.createTable("leads", this.tables.leads)

            interesadosDB.insertRows("leads", leadData)

            interesadosDB.closeDB()

            this.response.redirect("https://nodoambiental.org/leadgen/verification_notice.html")

            return
        }
    }

    public verificationQuery = (): void => {
        if (typeof this.request.body.autokey === "number") {
            const updateTokenData: Types.rowFieldUpdate[] = [
                {
                    set: [
                        {
                            column: "verification_token",
                            data: uid(16),
                        },
                    ],
                    where: {
                        column: "autokey",
                        data: this.request.body.autokey,
                    },
                },
            ]
            const interesadosDB = new Utils.DB.Handler("./db/interesados.db")

            interesadosDB.openDB()

            interesadosDB.createTable("leads", this.tables.leads)

            interesadosDB.updateRows("leads", updateTokenData)

            interesadosDB.closeDB()

            this.response.redirect("https://nodoambiental.org/leadgen/verification_success.html")

            return
        }

        this.response.redirect("https://nodoambiental.org/leadgen/invalid_data.html")

        return
    }

    public membershipQuery = (): void => {
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

                    return
                }

                interesadosDB.closeDB()

                this.response.redirect("https://nodoambiental.org/membership/invalid_token.html")

                return
            }

            interesadosDB.closeDB()

            this.response.redirect("https://nodoambiental.org/membership/invalid_data.html")

            return
        }

        const interesadosDB = new Utils.DB.Handler("./db/interesados.db")

        if (membershipData.rows.indexOf(undefined) !== -1) {
            this.response.redirect("https://nodoambiental.org/leadgen/invalid_data.html")
            return
        } else {
            interesadosDB.openDB()

            interesadosDB.select("leads", selectionToMake, selectCallback)
            return
        }
    }
}
