"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostRoute = void 0;
var express = require("express");
var sqlite3_1 = require("sqlite3");
var sqlstring_1 = require("sqlstring"); // ? Does this even do something?
var router = express.Router();
var DatabaseHandler = /** @class */ (function () {
    function DatabaseHandler(location) {
        this.filename = ":memory:";
        this.filename = location;
    }
    DatabaseHandler.prototype.openDB = function () {
        this.database = new sqlite3_1.Database(this.filename, function (error) {
            if (error) {
                console.error(error.message);
            }
            console.log('Connected to the database.');
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
        // TODO Add proper escaping with a prepared statement, for security and avoiding errors in the message text field
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
                    var placeholders = row.map(function () { return "?"; });
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
    DatabaseHandler.prototype.closeDB = function () {
        this.database.close();
        console.log('Closed the database. \n');
    };
    return DatabaseHandler;
}());
var leadsTable = [
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
];
var membership_applicantsTable = [
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
];
/* POST home page. */
exports.PostRoute = router.post('/', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var query_kind, leadData, interesadosDB, membershipData, interesadosDB;
    var _a, _b, _c, _d;
    return __generator(this, function (_e) {
        switch (_e.label) {
            case 0:
                query_kind = req.headers["query-kind"];
                if (!(query_kind === "leadgen")) return [3 /*break*/, 5];
                leadData = {
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
                            (_a = req.body.organization) !== null && _a !== void 0 ? _a : "",
                            (_b = req.body.role) !== null && _b !== void 0 ? _b : "",
                            (_c = req.body.message) !== null && _c !== void 0 ? _c : "",
                            req.body.mailing_list,
                            req.body.membership_interest
                        ]]
                };
                interesadosDB = new DatabaseHandler("./db/interesados.db");
                return [4 /*yield*/, interesadosDB.openDB()
                    // console.log(leadsTable)
                ];
            case 1:
                _e.sent();
                // console.log(leadsTable)
                return [4 /*yield*/, interesadosDB.createTable("leads", leadsTable)
                    // console.log(leadData)
                ];
            case 2:
                // console.log(leadsTable)
                _e.sent();
                // console.log(leadData)
                return [4 /*yield*/, interesadosDB.insertRows("leads", leadData)];
            case 3:
                // console.log(leadData)
                _e.sent();
                return [4 /*yield*/, interesadosDB.closeDB()];
            case 4:
                _e.sent();
                res.redirect('https://nodoambiental.org/leadgen_success.html');
                return [3 /*break*/, 6];
            case 5:
                if (query_kind === "membership") {
                    membershipData = {
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
                                (_d = req.body.title) !== null && _d !== void 0 ? _d : "",
                                req.body.autokey
                            ]]
                    };
                    interesadosDB = new DatabaseHandler("./db/interesados.db");
                    interesadosDB.openDB();
                    interesadosDB.createTable("membership_applicants", membership_applicantsTable);
                    interesadosDB.insertRows("membership_applicants", membershipData);
                    interesadosDB.closeDB();
                    res.redirect('https://nodoambiental.org/membership_success.html');
                }
                _e.label = 6;
            case 6: return [2 /*return*/];
        }
    });
}); });
