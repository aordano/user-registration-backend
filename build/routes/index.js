var express = require('express');
// const sqlite3 = require('sqlite3').verbose();
var router = express.Router();
var fs = require('fs');
var endOfLine = require('os').EOL;
// let db = new sqlite3.Database(':memory:');
/* POST home page. */
router.post('/', function (req, res) {
    var email = req.body.email;
    var name = req.body.name;
    var surname = req.body.surname;
    var organization = req.body.organization;
    var position = req.body.position;
    var composed_text = req.body.composed_text;
    var subscribe = req.body.subscribe;
    var filecontent = '---' + endOfLine +
        'email: ' + String(email) + endOfLine +
        'name: ' + String(name).replace(/:/g, '') + endOfLine +
        'surname: ' + String(surname).replace(/:/g, '') + endOfLine +
        'organization: ' + String(organization).replace(/:/g, '') + endOfLine +
        'position: ' + String(position).replace(/:/g, '') + endOfLine +
        'text: ' + String(composed_text).replace(/:/g, '').replace(/($)/gmiu, ' ').replace(/(\n)/gmiu, ' ') + endOfLine +
        '---' + endOfLine;
    var pathname = "/tmp/membership/" + // TODO Change to SQLite 
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
module.exports = router;
