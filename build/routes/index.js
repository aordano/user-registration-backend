"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostRoute = void 0;
var express = require("express");
var fs = require("fs");
var os_1 = require("os");
var SQLite = require("sqlite3");
var sqlite = SQLite.verbose();
var router = express.Router();
// let db = new sqlite3.Database(':memory:');
/* POST home page. */
// TODO Translate this function to typescript 
// TODO Make changes to save stuff in a SQLite file instead
// TODO Change the URL of the success page to reflect that is for membership.
exports.PostRoute = router.post('/', function (req, res) {
    var email = req.body.email;
    var name = req.body.name;
    var surname = req.body.surname;
    var organization = req.body.organization;
    var position = req.body.position;
    var composed_text = req.body.composed_text;
    var subscribe = req.body.subscribe;
    var filecontent = '---' + os_1.EOL +
        'email: ' + String(email) + os_1.EOL +
        'name: ' + String(name).replace(/:/g, '') + os_1.EOL +
        'surname: ' + String(surname).replace(/:/g, '') + os_1.EOL +
        'organization: ' + String(organization).replace(/:/g, '') + os_1.EOL +
        'position: ' + String(position).replace(/:/g, '') + os_1.EOL +
        'text: ' + String(composed_text).replace(/:/g, '').replace(/($)/gmiu, ' ').replace(/(\n)/gmiu, ' ') + os_1.EOL +
        '---' + os_1.EOL;
    var pathname = "/tmp/membership/" +
        String(Date.now()) +
        String(organization).split(' ')[0] + '/';
    var fullpathname = pathname + "index.md";
    console.log(pathname);
    fs.mkdir(pathname, function (err) {
        if (err && err.code != 'EEXIST')
            throw 'error; most likely path is broken somewhere';
        fs.writeFile(fullpathname, filecontent, function (err) {
            if (err)
                throw err;
        });
        res.redirect('https://nodoambiental.org/contactsuccess.html');
    });
});
