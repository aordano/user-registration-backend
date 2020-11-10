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
 * TODO:Patch This file is huge, break up the email stuff into another file and call email functions present there
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
import { readFileSync } from "fs"
import mjml2html from "mjml"
import { resolve } from "path"
import { uid } from "rand-token"
import * as Types from "../types"
import * as Utils from "../utils"

const mailAuthConfig: Types.mailConfig = JSON.parse(
    readFileSync(resolve(__dirname, "../../email/config/auth.jsonc")).toString()
)

/**
 * * ----------------------------------------->>
 * * Templates and related config parsing
 * * ----------------------------------------->>
 */

const loadJSON = (name: string): Types.messageConfig => {
    return JSON.parse(
        readFileSync(resolve(__dirname, `../../email/templates/${name}_subject.jsonc`)).toString()
    )
}

const loadTemplate = (name: string): Types.MJMLParseResults => {
    return mjml2html(
        readFileSync(resolve(__dirname, `../../email/templates/${name}.mjml`)).toString(),
        {
            minify: true,
        }
    )
}

const buildTemplates = (...args: string[]): Types.emailCompositor[] => {
    return args.map((queryKind: string) => {
        return {
            queryKind,
            body: loadTemplate(queryKind).html,
        }
    })
}

const templates = buildTemplates(
    "verify",
    "verification_successful",
    "membership_application",
    "user_registered"
)

// We need to clean all the strings that were previosuly escaped when loaded into the database
const cleanString = (stringToClean: string) => {
    return stringToClean.substring(1, stringToClean.length - 1)
}

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
    constructor(request: Request, response: Response<any>, tables: Record<string, Types.table>) {
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
    private tables: Record<string, Types.table>

    /**
     * ### Description
     *
     * The request object, no changes, as passed to the route.
     *
     * ---
     */
    private request: Request

    /**
     * ### Description
     *
     * The response object, no changes, as passed to the route.
     *
     * ---
     */
    private response: Response<any>

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
    public leadgen = (): void | Error => {
        const leadData = Utils.Functions.parseRequestData(this.request, this.tables.leads.fields)

        leadData.rows[leadData.columns.indexOf("verification_token")] = uid(32)

        const rowsWithoutProtectedFields = leadData.rows.filter((row, rowIndex) => {
            if (this.tables.leads.protected.indexOf(leadData.columns[rowIndex]) === -1) {
                return row
            }
        })

        if (rowsWithoutProtectedFields.indexOf(undefined) !== -1) {
            // Let's make sure we don't even try to process garbage data.

            // ? It is important that the form in the frontend passes the optative elements with some empty placeholder data
            // so it's not blackholed just because the person didn't fill a field.

            this.response.redirect("https://nodoambiental.org/leadgen/invalid-data.html")

            return new Error(
                `Invalid data: missing or invalid fields. \n Request body: ${this.request.body}`
            )
        }

        const interesadosDB = new Utils.DB.Handler(resolve(__dirname, "../../../db/interesados.db"))

        interesadosDB.openDB()

        interesadosDB.createTable("leads", this.tables.leads.fields)

        interesadosDB.insertRows("leads", [leadData])

        interesadosDB.closeDB()

        this.response.redirect("https://nodoambiental.org/leadgen/contact_success.html")

        const email = new Utils.Email.Handler(mailAuthConfig, templates)

        const subject = loadJSON("verify")

        email.construct(
            "verify",
            {
                from: subject.from,
                to: this.request.body["email"],
                subject: subject.subject,
            },
            [
                {
                    target: "nombre",
                    content: this.request.body["name"],
                },
                {
                    target: "verification-token",
                    content: leadData.rows[leadData.columns.indexOf("verification_token")],
                },
            ]
        )

        email.send()

        return
    }

    public verification = (): void | Error => {
        if (this.request.query.token) {
            const interesadosDB = new Utils.DB.Handler(
                resolve(__dirname, "../../../db/interesados.db")
            )

            if (
                this.request.query.token !== (undefined || null) &&
                typeof this.request.query.token === "string" &&
                this.request.query.token.length === 32
            ) {
                const queriedToken = this.request.query.token

                const tokenQueryVerification = typeof queriedToken === "string" ? true : false

                if (tokenQueryVerification) {
                    const selectCallback = (callbackData: Types.callbackData) => {
                        if (callbackData.result) {
                            // The ordering of the expected values at every index is the same of the columns to select in the database query

                            // Because we read this from a text field, even if the type is Types.data, this will always be a string
                            const verificationToken = Object.entries(
                                callbackData.result
                            )[0][1] as string

                            // We need to remove first and last character because the SELECT query reads the text field as-is
                            // so instead of returning {column: "value"}, it returns {column: "'value'"}
                            // It is this way for any text field, so we reapeat the procedure for every requested value

                            const emailRecipient = Object.entries(
                                callbackData.result
                            )[1][1] as string

                            const name = Object.entries(callbackData.result)[2][1] as string

                            const userToken = uid(32)

                            if (verificationToken !== "ALREADY_VERIFIED") {
                                // The conditions are not joined in one check because the redirect is different
                                // according to the error type
                                if (verificationToken === queriedToken) {
                                    // The verification token needs to be destroyed and replaced by a filler that prevents executing
                                    // the verification flow a second time.
                                    const updateTokenData: Types.rowFieldUpdate[] = [
                                        {
                                            set: [
                                                {
                                                    column: "user_token",
                                                    data: userToken,
                                                },
                                                {
                                                    column: "verification_token",
                                                    data: "ALREADY_VERIFIED",
                                                },
                                            ],
                                            where: {
                                                column: "verification_token",
                                                data: queriedToken,
                                            },
                                        },
                                    ]

                                    interesadosDB.openDB()

                                    interesadosDB.createTable("leads", this.tables.leads.fields)

                                    interesadosDB.updateRows("leads", updateTokenData)

                                    interesadosDB.closeDB()

                                    this.response.redirect(
                                        "https://nodoambiental.org/leadgen/verification-success.html"
                                    )

                                    const email = new Utils.Email.Handler(mailAuthConfig, templates)

                                    const subject = loadJSON("verification_successful")

                                    email.construct(
                                        "verification_successful",
                                        {
                                            from: subject.from,
                                            to: emailRecipient,
                                            subject: subject.subject,
                                        },
                                        [
                                            {
                                                target: "nombre",
                                                content: name,
                                            },
                                            {
                                                target: "user-token",
                                                content: userToken,
                                            },
                                        ]
                                    )

                                    email.send()

                                    const queriedOrg = Object.entries(callbackData.result)[3][1]
                                    const organization =
                                        typeof queriedOrg === "string" ? queriedOrg : false

                                    const queriedRole = Object.entries(
                                        callbackData.result
                                    )[4][1] as string
                                    const role =
                                        typeof queriedRole === "string" ? queriedRole : false

                                    const queriedMessage = Object.entries(
                                        callbackData.result
                                    )[5][1] as string
                                    const message =
                                        typeof queriedMessage === "string" ? queriedMessage : false

                                    if (message) {
                                        const subject = loadJSON("user_registered")

                                        email.construct(
                                            "user_registered",
                                            {
                                                from: emailRecipient,
                                                to: subject.to,
                                                subject: subject.subject,
                                            },
                                            [
                                                {
                                                    target: "nombre",
                                                    content: name,
                                                },
                                                {
                                                    target: "organization",
                                                    content: organization
                                                        ? `, pertenezco a ${organization}`
                                                        : "",
                                                },
                                                {
                                                    target: "role",
                                                    content: role ? `, como ${role},` : ",",
                                                },
                                                {
                                                    target: "message",
                                                    content: message,
                                                },
                                            ]
                                        )

                                        email.send()

                                        return
                                    }
                                    return
                                }

                                this.response.redirect(
                                    "https://nodoambiental.org/leadgen/invalid-data.html"
                                )

                                return new Error(
                                    `Invalid data: token not present in DB. \n Token provided: ${queriedToken}`
                                )
                            }

                            this.response.redirect(
                                "https://nodoambiental.org/leadgen/already-verified.html"
                            )

                            return new Error(
                                `Already verified: user already verified. \n Token provided: ${queriedToken}`
                            )
                        }

                        this.response.redirect(
                            "https://nodoambiental.org/leadgen/already-verified.html"
                        )

                        return new Error(
                            `Already verified: user already verified. \n Token provided: ${queriedToken}`
                        )
                    }

                    const selectionToMake: Types.selectField[] = [
                        {
                            columnsToSelect: [
                                "verification_token",
                                "email",
                                "name",
                                "organization",
                                "role",
                                "message",
                            ],
                            where: {
                                query: {
                                    column: "verification_token",
                                    data: `'${this.request.query.token}'`,
                                    operator: "=",
                                },
                            },
                        },
                    ]

                    interesadosDB.openDB()

                    interesadosDB.select("leads", selectionToMake, selectCallback)

                    return
                }
            }

            this.response.redirect("https://nodoambiental.org/leadgen/invalid-data.html")

            return new Error(
                `Invalid data: garbage token. \n Token provided: ${this.request.query.token}`
            )
        }

        this.response.redirect("https://nodoambiental.org/leadgen/invalid-data.html")

        return new Error(
            `Invalid data: no token provided or malformed query. \n Query made: ${this.request.query}`
        )
    }

    public membership = (): void | Error => {
        // TODO:Patch add error handling for executing the logic after parsing the request
        const membershipData = Utils.Functions.parseRequestData(
            this.request,
            this.tables.membership.fields
        )

        // TODO:Minor Make it so the ID type is fixed between a set of options to be selected from a dropdown;
        // the logic here should discriminate between the allowed ID types and a 'Other' value.

        const leadsSelectionToMake: Types.selectField[] = [
            {
                columnsToSelect: ["user_token", "name", "email"],
                where: {
                    query: {
                        column: "user_token",
                        data: `"${String(this.request.body.user_token)}"`,
                        operator: "=",
                    },
                },
            },
        ]

        const membershipApplicantsSelectionToMake: Types.selectField[] = [
            {
                columnsToSelect: ["user_token"],
                where: {
                    query: {
                        column: "user_token",
                        data: `"${String(this.request.body.user_token)}"`,
                        operator: "=",
                    },
                },
            },
        ]

        const membershipApplicantsSelectCallback = (
            callbackData: Types.callbackData,
            name: string,
            emailRecipient: string,
            queriedToken: string
        ) => {
            membershipData.rows[membershipData.columns.indexOf("user_token")] = queriedToken
            const membershipApplicantsQueryToken = callbackData.result

            if (membershipApplicantsQueryToken === undefined) {
                interesadosDB.createTable("membership_applicants", this.tables.membership.fields)
                interesadosDB.insertRows("membership_applicants", [membershipData])

                interesadosDB.closeDB()

                this.response.redirect(
                    "https://nodoambiental.org/membership/application-success.html"
                )

                const email = new Utils.Email.Handler(mailAuthConfig, templates)

                const subject = loadJSON("membership_application")

                email.construct(
                    "membership_application",
                    {
                        from: subject.from,
                        to: emailRecipient,
                        subject: subject.subject,
                    },
                    [
                        {
                            target: "nombre",
                            content: name,
                        },
                    ]
                )

                email.send()

                return
            }

            interesadosDB.closeDB()

            this.response.redirect("https://nodoambiental.org/membership/invalid-data.html")

            return new Error(
                `Invalid data: token already present in the membership applicants table
                \n Token provided: ${this.request.body.user_token}`
            )
        }

        const leadsSelectCallback = (callbackData: Types.callbackData) => {
            const queriedToken = Object.entries(callbackData.result)[0][1] as string
            const name = Object.entries(callbackData.result)[1][1]
            const emailRecipient = Object.entries(callbackData.result)[2][1]
            if (
                queriedToken !== (undefined || null) &&
                typeof queriedToken === "string" &&
                typeof name === "string" &&
                typeof emailRecipient === "string" &&
                queriedToken.length === 32 &&
                queriedToken === this.request.body.user_token
            ) {
                interesadosDB.select(
                    "membership_applicants",
                    membershipApplicantsSelectionToMake,
                    (membershipCallbackData: Types.callbackData) => {
                        membershipApplicantsSelectCallback(
                            membershipCallbackData,
                            name,
                            emailRecipient,
                            queriedToken
                        )
                    }
                )
                return
            }

            interesadosDB.closeDB()

            this.response.redirect("https://nodoambiental.org/membership/invalid-data.html")

            return new Error(
                `Invalid data: provided token is not found in the database or is garbage 
                \n Token provided: ${this.request.body.user_token}`
            )
        }

        const interesadosDB = new Utils.DB.Handler(resolve(__dirname, "../../../db/interesados.db"))

        const rowsWithoutProtectedFields = membershipData.rows.filter((row, rowIndex) => {
            if (this.tables.leads.protected.indexOf(membershipData.columns[rowIndex]) === -1) {
                return row
            }
        })

        if (rowsWithoutProtectedFields.indexOf(undefined) !== -1) {
            this.response.redirect("https://nodoambiental.org/membership/invalid-data.html")
            return new Error(
                `Invalid data: missing or malformed field.  \n Request body: ${this.request.body}`
            )
        } else {
            interesadosDB.openDB()

            interesadosDB.select("leads", leadsSelectionToMake, leadsSelectCallback)
        }
    }
}
