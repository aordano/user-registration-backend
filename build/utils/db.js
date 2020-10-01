"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Handler = void 0;
var sqlite3_1 = require("sqlite3");
var sqlstring_1 = require("sqlstring");
var Handler = /** @class */ (function () {
    function Handler(location) {
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
    Handler.prototype.openDB = function () {
        this.database = new sqlite3_1.Database(this.filename, function (error) {
            if (error) {
                console.error(error.message);
            }
            console.log("Connected to the database.");
        });
    };
    Handler.prototype.createTable = function (name, fields) {
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
    Handler.prototype.insertRows = function (table, data) {
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
    Handler.prototype.updateRows = function (table, data) {
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
    Handler.prototype.select = function (table, data, callback) {
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
    Handler.prototype.closeDB = function () {
        this.database.close();
        console.log("Closed the database. \n");
    };
    return Handler;
}());
exports.Handler = Handler;
