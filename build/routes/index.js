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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostRoute = void 0;
// TODO Break up file in smaller ones
// Imports
var express = require("express");
var rand_token_1 = require("rand-token");
var sqlite3_1 = require("sqlite3");
var sqlstring_1 = require("sqlstring");
var router = express.Router();
var DatabaseHandler = /** @class */ (function () {
    function DatabaseHandler(location) {
        this.callbackData = {
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
        };
        this.filename = ":memory:";
        this.filename = location;
    }
    DatabaseHandler.prototype.openDB = function () {
        this.database = new sqlite3_1.Database(this.filename, function (error) {
            if (error) {
                console.error(error.message);
            }
            console.log("Connected to the database.");
        });
    };
    DatabaseHandler.prototype.createTable = function (name, fields) {
        var _this = this;
        var columns = "";
        fields.forEach(function (field, loopIndex) {
            if (loopIndex === 0) {
                columns = field.column + " " + field.datatype;
            }
            else {
                columns = columns + ", " + field.column + " " + field.datatype;
            }
        });
        var query = "CREATE TABLE IF NOT EXISTS " + name + "(" + columns + ")";
        this.database.serialize(function () {
            _this.database.run(query);
            console.log("Created table " + name + " if it does not exist.");
        });
    };
    DatabaseHandler.prototype.insertRows = function (table, data) {
        var _this = this;
        var columns = Object.entries(data)[0][1]; // Retrieve columns array
        var allRows = Object.entries(data)[1][1]; // Retrieve rows array
        this.database.serialize(function () {
            allRows.forEach(function (row) {
                if (row.length > 1) {
                    var escapedValues_1 = row.map(function (value) {
                        if (typeof value === "string") {
                            return sqlstring_1.escape(value);
                        }
                        return value;
                    });
                    var placeholders = row.map(function () {
                        return "?";
                    });
                    var query = "INSERT INTO " + table + "(" + columns.join(",") + ") VALUES (" + placeholders.join(",") + ")";
                    _this.database.run(query, escapedValues_1, function (error) {
                        if (error) {
                            var errorMessage = "Error in data inserting, query failed: \n \n                                    INSERT INTO " + table + "(" + columns + ") VALUES \n \n                                    " + escapedValues_1 + " \n\n                                    ";
                            console.log(errorMessage);
                            return console.error(error.message);
                        }
                    });
                    console.log("Queried an INSERT in table " + table + ", columns " + columns + " adding " + allRows.length + " rows.");
                }
            });
        });
    };
    DatabaseHandler.prototype.updateRows = function (table, data) {
        var _this = this;
        this.database.serialize(function () {
            data.forEach(function (queryToExecute, index) {
                var sets = Object.entries(queryToExecute)[0][1]; // Retrieve sets array
                var where = Object.entries(queryToExecute)[1][1]; // Retrieve where object
                var setQuery = "SET ";
                sets.forEach(function (currentSet, index) {
                    if (index + 1 !== sets.length) {
                        setQuery = setQuery + " " + currentSet.column + " = " + sqlstring_1.escape(currentSet.data) + ", ";
                    }
                    else {
                        setQuery = setQuery + " " + currentSet.column + " = " + sqlstring_1.escape(currentSet.data);
                    }
                });
                var query = "UPDATE " + table + " " + setQuery + " WHERE " + where.column + " = " + sqlstring_1.escape(where.data);
                _this.database.run(query, [], function (error) {
                    if (error) {
                        var errorMessage = "Error in data updating, query failed: \n \n                            UPDATE " + table + " \n\n                            " + setQuery + " \n\n                            WHERE " + where.column + " = " + sqlstring_1.escape(where.data);
                        console.log(errorMessage);
                        return console.error(error.message);
                    }
                });
                console.log("Queried an UPDATE in table " + table + ", whith sets \n\n                    " + setQuery + " \n\n                    and WHERE " + where.column + " = " + sqlstring_1.escape(where.data));
            });
        });
    };
    DatabaseHandler.prototype.select = function (table, data, callback) {
        var _this = this;
        // FIXME See wtf is going on that it outputs before executing the queries
        data.forEach(function (select) {
            var columns = select.columnsToSelect.join(", ");
            var whereQuery = select.where.query.column + " " + select.where.query.operator + " " + select.where.query.data;
            if (select.where.extraConditions) {
                // Add extra conditions to the query, if they are present
                select.where.extraConditions.forEach(function (conditions) {
                    var conditionQuery = conditions.conditionType + " \n                    " + conditions.conditionQuery.column + " " + conditions.conditionQuery.operator + " " + conditions.conditionQuery.data;
                    whereQuery = whereQuery + " " + conditions.conditionType + " " + conditionQuery;
                });
            }
            var query = "SELECT " + columns + " FROM " + table + " WHERE " + whereQuery;
            _this.database.get(query, [], function (error, result) {
                _this.callbackData.data = select;
                _this.callbackData.error = error;
                _this.callbackData.query = query;
                _this.callbackData.result = result;
                callback();
            });
        });
    };
    DatabaseHandler.prototype.closeDB = function () {
        this.database.close();
        console.log("Closed the database. \n");
    };
    return DatabaseHandler;
}());
var leadsTable = [
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
];
var membership_applicantsTable = [
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
];
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
        var interesadosDB = new DatabaseHandler("./db/interesados.db");
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
        var interesadosDB_1 = new DatabaseHandler("./db/interesados.db");
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
            var interesadosDB = new DatabaseHandler("./db/interesados.db");
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
