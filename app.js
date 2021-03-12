const express = require('express');
const app = express();
const fs = require('fs');
const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const path = require('path');
require('dotenv').config()
const port = process.env.PORT || 3000
app.use(express.urlencoded({ extended: false }));

app.post('/', async function (req, res) {
    try {
        const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
        const options = { logLevel: 'info', output: 'html', onlyCategories: ['performance'], port: chrome.port };
        const runnerResult = await lighthouse(req.body.site, options);
        let data = ''
        let ext = ''
        if (req.query && req.query.getJSON) {
            data = JSON.stringify(runnerResult.lhr);
            ext = '.json';
        } else {
            data = runnerResult.report;
            ext = '.html';
        }
        fs.writeFileSync('lhreport' + ext, data);
        let sendFile1 = '/lhreport' + ext

        await chrome.kill();
        console.log('Report is done for', runnerResult.lhr.finalUrl);
        res.sendFile(path.join(__dirname + sendFile1));
    } catch (err) {
        console.log(err)
        res.status(500).send("Something went wrong");
    }

})

let server = app.listen(port, function () {
    console.log(`Server listening at ${port}`)
})