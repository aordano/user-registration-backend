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

// Imports
import * as bodyParser from "body-parser"
import cookieParser from "cookie-parser"
import express from "express"
import { createerror } from "http-errors"
import logger from "morgan"
import * as path from "path"
import { PostRoute } from "./routes/index"

// Set-up Express
export const app = express()

app.use(logger("dev"))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(express.static(path.join(__dirname, "public")))

// Route selection
app.use("/", PostRoute)

// Catch 404 and forward to error handler
app.use((req, res, next) => {
    next(createerror(404))
})

// Error handler
app.use((error, req, res, next) => {
    // Set locals, only providing error in development
    res.locals.message = error.message
    res.locals.error = req.app.get("env") === "development" ? error : {}

    // Render the error page
    res.status(error.status || 500)
})
