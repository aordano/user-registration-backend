"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostRoute = void 0;
// Imports
var express = require("express");
var fs_1 = require("fs");
var path_1 = require("path");
var rand_token_1 = require("rand-token");
var Utils = require("../utils");
// TODO Documentation!
var router = express.Router();
var leadsTable = JSON.parse(fs_1.readFileSync(path_1.resolve(__dirname, "../tables/leads.json")).toString());
var membership_applicantsTable = JSON.parse(fs_1.readFileSync(path_1.resolve(__dirname, "../tables/membership_applicants.json")).toString());
/* POST home page. */
exports.PostRoute = router.post("/", function (req, res) {
    var _a, _b, _c, _d;
    var query_kind = req.headers["query-kind"];
    if (query_kind === "leadgen") {
        var leadData = {
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
                    (_a = req.body.organization) !== null && _a !== void 0 ? _a : "",
                    (_b = req.body.role) !== null && _b !== void 0 ? _b : "",
                    (_c = req.body.message) !== null && _c !== void 0 ? _c : "",
                    req.body.mailing_list,
                    req.body.membership_interest,
                    "",
                ],
            ],
        };
        var interesadosDB = new Utils.DB.Handler("./db/interesados.db");
        interesadosDB.openDB();
        interesadosDB.createTable("leads", leadsTable);
        interesadosDB.insertRows("leads", leadData);
        interesadosDB.closeDB();
        res.redirect("https://nodoambiental.org/leadgen_success.html");
    }
    if (query_kind === "membership") {
        var membershipData_1 = {
            columns: ["name", "ID_type", "ID", "zip", "title", "autokey", "message"],
            rows: [
                [
                    req.body.name,
                    req.body.ID_type,
                    req.body.ID,
                    req.body.zip,
                    (_d = req.body.title) !== null && _d !== void 0 ? _d : "",
                    req.body.autokey,
                    req.body.message,
                ],
            ],
        };
        var selectionToMake = [
            {
                columnsToSelect: ["verification_token"],
                where: {
                    query: {
                        column: "verification_token",
                        data: "\"" + String(req.body.verification_token) + "\"",
                        operator: "=",
                    },
                },
            },
        ];
        var selectCallback = function () {
            if (interesadosDB_1.callbackData.result !== undefined &&
                interesadosDB_1.callbackData.result !== null &&
                typeof interesadosDB_1.callbackData.result === "object" &&
                interesadosDB_1.callbackData.result.length === undefined) {
                var result = Object.entries(interesadosDB_1.callbackData.result)[0][1];
                var verification = typeof result === "string" && result === req.body.verification_token
                    ? true
                    : false;
                if (verification) {
                    interesadosDB_1.createTable("membership_applicants", membership_applicantsTable);
                    interesadosDB_1.insertRows("membership_applicants", membershipData_1);
                    interesadosDB_1.closeDB();
                    res.redirect("https://nodoambiental.org/membership/application_success.html");
                    return;
                }
                interesadosDB_1.closeDB();
                res.redirect("https://nodoambiental.org/membership/invalid_token.html");
                return;
            }
            interesadosDB_1.closeDB();
            res.redirect("https://nodoambiental.org/membership/invalid_data.html");
        };
        var interesadosDB_1 = new Utils.DB.Handler("./db/interesados.db");
        interesadosDB_1.openDB();
        interesadosDB_1.select("leads", selectionToMake, selectCallback);
    }
    if (query_kind === "verification") {
        if (typeof req.body.autokey === "number") {
            var updateTokenData = [
                {
                    set: [
                        {
                            column: "verification_token",
                            data: rand_token_1.uid(16),
                        },
                    ],
                    where: {
                        column: "autokey",
                        data: req.body.autokey,
                    },
                },
            ];
            var interesadosDB = new Utils.DB.Handler("./db/interesados.db");
            interesadosDB.openDB();
            // console.log(leadsTable)
            interesadosDB.createTable("leads", leadsTable);
            // console.log(leadData)
            interesadosDB.updateRows("leads", updateTokenData);
            interesadosDB.closeDB();
            res.redirect("https://nodoambiental.org/leadgen/verification_success.html");
            return;
        }
        res.redirect("https://nodoambiental.org/leadgen/invalid_data.html");
    }
});
