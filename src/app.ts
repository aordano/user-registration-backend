// TODO Documentation
import * as bodyParser from "body-parser"
import * as cookieParser from "cookie-parser"
import * as express from "express"
import { createerror } from "http-errors"
import * as logger from "morgan"
import * as path from "path"
import { PostRoute } from "./routes/index"

export const app = express()

app.use(logger("dev"))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(express.static(path.join(__dirname, "public")))

app.use("/", PostRoute)

// catch 404 and forward to error handler
app.use((req, res, next) => {
    next(createerror(404))
})

// error handler
app.use((error, req, res, next) => {
    // set locals, only providing error in development
    res.locals.message = error.message
    res.locals.error = req.app.get("env") === "development" ? error : {}

    // render the error page
    res.status(error.status || 500)
})
