"use strict";
/**
 * # app.ts
 *
 * ---
 *
 * Main file, handles Express's methods and defines the use of the routes.
 *
 * Currently there's only a main route at the root of the endpoint.
 *
 *
 * @packageDocumentation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
// Imports
var bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
var express = require("express");
var http_errors_1 = require("http-errors");
var logger = require("morgan");
var path = require("path");
var index_1 = require("./routes/index");
// Set-up Express
exports.app = express();
exports.app.use(logger("dev"));
exports.app.use(express.json());
exports.app.use(express.urlencoded({ extended: false }));
exports.app.use(cookieParser());
exports.app.use(bodyParser.urlencoded({ extended: false }));
exports.app.use(bodyParser.json());
exports.app.use(express.static(path.join(__dirname, "public")));
// Route selection
exports.app.use("/", index_1.PostRoute);
// Catch 404 and forward to error handler
exports.app.use(function (req, res, next) {
    next(http_errors_1.createerror(404));
});
// Error handler
exports.app.use(function (error, req, res, next) {
    // Set locals, only providing error in development
    res.locals.message = error.message;
    res.locals.error = req.app.get("env") === "development" ? error : {};
    // Render the error page
    res.status(error.status || 500);
});
