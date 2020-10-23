/**
 * # Routes > index.ts
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

/**
 * * ------------------------------->>
 * * Imports
 * * ------------------------------->>
 */

import * as express from "express"
import { readFileSync } from "fs"
import { resolve } from "path"
import * as Logic from "../logic"
import * as Types from "../types"
// TODO Documentation!

/**
 * * ------------------------------->>
 * * Router definition
 * * ------------------------------->>
 */

const router = express.Router()

/**
 * * ----------------------------------------->>
 * * Data parsing from table definition files
 * * ----------------------------------------->>
 */

const loadTable = (name: string): Types.table => {
    return JSON.parse(
        readFileSync(resolve(__dirname, `../../../db/tables/${name}.json`)).toString()
    )
}

const leadsTable = loadTable("leads")

const membership_applicantsTable = loadTable("membership_applicants")

/**
 * * ------------------------------->>
 * * Main POST Route
 * * ------------------------------->>
 */

/**
 * ## `PostRoute`
 *
 * ---
 *
 * ### Description
 *
 * Handles all the stuff going on in the endpoint.
 *
 * Simply put, someone sends a `POST` request to the endpoint, and given it has a header `query-kind` containing, well, the query kind, it
 * will process the data in the body to do databasey stuff. The request expected is `application-json`, so the body should contain a set of keys and
 * values with all the info.
 *
 * ### Usage
 *
 * You receive data in a `POST` request from a contact form present on the main website. This is  a `leadgen` query-kind.
 *
 * This data is then registered in the database, always even if it's garbage or anything is dropped in a later step,
 * and an email is triggered to the inbox provided, to verify it.
 *
 * This verification email contains a link pointing back to the endpoint, where the query-kind now is `verification`, containing simply the primary
 * key generated in the leads table when the data was registered. If the given number matches a entry in the DB, then a hopefully unique token is generated
 * and the data in the leads table is updated with this verification token.
 *
 * Upon verification, _another_ mail is sent saying that everything went smoothly, and prompting the user to contact the organization, opt to become a member
 * donate money or something, and pointing to where's our cool stuff and that go go check it out.
 *
 * If the user choses to apply for memebership, then it's redirected to another form where more sensitive data is requested. This form is reached
 * via a `GET` request containing the verification token assigned to the user. Then when the form is filled, the verification token is passed along it in
 * another `POST` request to the endpoint, this time with `membership` query-kind.
 *
 * Given the received verification token is present on the leads table, then the corresponding primary key of the leads table is recorded in the
 * membership table, along all the extra info provided in the last form.
 *
 * Lastly, this triggers _yet another_ email saying that the application was succesfuly processed and that "you can contact us like bla bla etc" and that
 * the organization will be put in contact with them.
 *
 * Frontend should be split in two folders, `leadgen` and `membership`, to have the corresponding status page after doing something.
 *
 * Leadgen contains:
 *
 * - invalid_data:
 * Redirect to generic error page if there's garbage data somewhere in the `POST` request.
 *
 * - verification_notice:
 * Redirect to status page aknowledging the person's affiliation and requesting a verification from the email provided.
 *
 * - verification_success:
 * Redirect to page where the email verification is noted and the person's welcomed to us.
 *
 * Membership contains:
 *
 * - application_success:
 * Redirect to page saying the application for membership was successful and that we'll contact them soon enough.
 *
 * - invalid_token:
 * Redirect to page saying the UID is garbage; this would be in the shape of a generic "Something went wrong :(" display.
 *
 * - invalid_data:
 * Redirect to a generic error page like in the case of the leadgen, but with minor changes to relate to the membership process.
 *
 * ---
 *
 * ### Comments
 *
 * TODO:Major Add part of the workflow that incorporates donations once that part is more ready to be presented to the world
 *
 * ---
 */
export const PostRoute = router.post("/", (request, response) => {
    const query_kind = request.headers["query-kind"] // Header required to know that it's a valid request and not random stuff

    if (query_kind !== undefined || query_kind !== null) {
        const query = new Logic.Registrar.Handler(request, response, {
            leads: leadsTable,
            membership: membership_applicantsTable,
        })

        switch (query_kind) {
            case "leadgen": {
                query.leadgen()
                return
            }

            case "membership": {
                query.membership()
                return
            }
            default:
                return
        }
    }
})

export const GetRoute = router.get("/verification", (request, response) => {
    const query = new Logic.Registrar.Handler(request, response, {
        leads: leadsTable,
        membership: membership_applicantsTable,
    })

    query.verification()
})
