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
        if(req.body && req.body.type && req.body.url){
            const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless']  });
            const options = { logLevel: 'info', output: req.body.type, onlyCategories: ['performance'], port: chrome.port  };
            const runnerResult = await lighthouse(req.body.url, options);
            await chrome.kill();
            console.log('Report is done for', runnerResult.lhr.finalUrl);
            res.send(runnerResult.report);
        }else{
            res.send("Please pass url and type")
        }
        
    } catch (err) {
        console.log(err)
        res.status(500).send("Something went wrong");
    }

})

let server = app.listen(port, function () {
    console.log(`Server listening at ${port}`)
})