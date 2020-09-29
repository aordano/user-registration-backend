// ? This file looks really pointless

import * as express from "express"

const router = express.Router()

/* GET users listing. */
export const GetRoute = router.get('/', function(req, res, next) {
  res.send('respond with a resource');
})
