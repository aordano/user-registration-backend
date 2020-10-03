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

// Imports
import * as express from "express"
import { readFileSync } from "fs"
import { resolve } from "path"
import { uid } from "rand-token"
import * as Types from "../types"
import * as Utils from "../utils"

// TODO Documentation!

// TODO Make data fetched from the request is grabbed based on the fields present in the relevant table

const router = express.Router()

const leadsTable: Types.tableField[] = JSON.parse(
    readFileSync(resolve(__dirname, "../tables/leads.json")).toString()
)

const membership_applicantsTable: Types.tableField[] = JSON.parse(
    readFileSync(resolve(__dirname, "../tables/membership_applicants.json")).toString()
)

/* POST home page. */

export const PostRoute = router.post("/", (req, res) => {
    const query_kind = req.headers["query-kind"]

    if (query_kind === "leadgen") {
        const leadData: Types.rowFields = {
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

        const interesadosDB = new Utils.DB.Handler("./db/interesados.db")

        interesadosDB.openDB()

        interesadosDB.createTable("leads", leadsTable)

        interesadosDB.insertRows("leads", leadData)

        interesadosDB.closeDB()

        res.redirect("https://nodoambiental.org/leadgen_success.html")
    }

    if (query_kind === "membership") {
        const membershipData: Types.rowFields = {
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

        const selectionToMake: Types.selectField[] = [
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

        const interesadosDB = new Utils.DB.Handler("./db/interesados.db")

        interesadosDB.openDB()

        interesadosDB.select("leads", selectionToMake, selectCallback)
    }

    if (query_kind === "verification") {
        if (typeof req.body.autokey === "number") {
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
                        data: req.body.autokey,
                    },
                },
            ]
            const interesadosDB = new Utils.DB.Handler("./db/interesados.db")

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
