import * as express from "express"
import * as fs from "fs"
import { EOL } from "os"
import * as SQLite from "sqlite3"

const sqlite = SQLite.verbose()
const router = express.Router()

// let db = new sqlite3.Database(':memory:');

/* POST home page. */
// TODO Translate this function to typescript 
// TODO Make changes to save stuff in a SQLite file instead
// TODO Change the URL of the success page to reflect that is for membership.

export const PostRoute = router.post('/', function (req, res) {
    var email = req.body.email;
    var name = req.body.name;
    var surname = req.body.surname;
    var organization = req.body.organization;
    var position = req.body.position;
    var composed_text = req.body.composed_text;
    var subscribe = req.body.subscribe;

    var filecontent =
        '---' + EOL +
        'email: ' + String(email) + EOL +
        'name: ' + String(name).replace(/:/g, '') + EOL +
        'surname: ' + String(surname).replace(/:/g, '') + EOL +
        'organization: ' + String(organization).replace(/:/g, '') + EOL +
        'position: ' + String(position).replace(/:/g, '') + EOL +
        'text: ' + String(composed_text).replace(/:/g, '').replace(/($)/gmiu, ' ').replace(/(\n)/gmiu, ' ') + EOL +
        '---' + EOL;

    var pathname =
        "/tmp/membership/" + 
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


