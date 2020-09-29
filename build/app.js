"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
var http_errors_1 = require("http-errors");
var express = require("express");
var path = require("path");
var bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var index_1 = require("./routes/index");
exports.app = express();
exports.app.use(logger('dev'));
exports.app.use(express.json());
exports.app.use(express.urlencoded({ extended: false }));
exports.app.use(cookieParser());
exports.app.use(bodyParser.urlencoded({ extended: false }));
exports.app.use(bodyParser.json());
exports.app.use(express.static(path.join(__dirname, 'public')));
exports.app.use('/', index_1.PostRoute);
// catch 404 and forward to error handler
exports.app.use(function (req, res, next) {
    next(http_errors_1.createerror(404));
});
// error handler
exports.app.use(function (error, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = error.message;
    res.locals.error = req.app.get('env') === 'development' ? error : {};
    // render the error page
    res.status(error.status || 500);
});
