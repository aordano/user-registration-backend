var express = require('express');
var router = express.Router();
var fs = require('fs'); 
var endOfLine = require('os').EOL;

/* POST home page. */
router.post('/', function (req, res) {
    var email = req.body.email;
    var name = req.body.name;
    var surname = req.body.surname;
    var organization = req.body.organization;
    var position = req.body.position;
    var composed_text = req.body.composed_text;
    var subscribe = req.body.subscribe;

    var yamlEOL = endOfLine + '  ';
    var filecontent =
        '---' + endOfLine +
        'email: ' + String(email) + endOfLine +
        'name: ' + String(name).replace(/:/g, '') + endOfLine +
        'surname: ' + String(surname).replace(/:/g, '') + endOfLine +
        'organization: ' + String(organization).replace(/:/g, '') + endOfLine +
        'position: ' + String(position).replace(/:/g, '') + endOfLine +
        'text: |' + endOfLine +
        String(composed_text).replace(endOfLine, yamlEOL) + endOfLine +
        '---' + endOfLine;

    var pathname =
        "/var/www/contact-review/content/" +
        String(Date.now()) +
        String(organization).split(' ')[0] + '/';

    var fullpathname = pathname + "index.md";

    console.log(pathname);
    fs.mkdir(pathname, err => {
        if (err && err.code != 'EEXIST') throw 'error; most likely path is broken somewhere'
        fs.writeFile(fullpathname, filecontent, (err) => {
            if (err) throw err;
        });

        res.redirect('https://nodoambiental.org/contactsuccess.html')

    });

});

module.exports = router;
