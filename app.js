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
        const MOTOG4_EMULATION_METRICS = {
            mobile: true,
            width: 360,
            height: 640,
            deviceScaleFactor: 2.625,
            disabled: false,
        };
        const DESKTOP_EMULATION_METRICS = {
            mobile: false,
            width: 1350,
            height: 940,
            deviceScaleFactor: 1,
            disabled: false,
        };
        const desktopDense4G = {
            rttMs: 40,
            throughputKbps: 10 * 1024,
            cpuSlowdownMultiplier: 1
        };
        const  mobileSlow4G= {
            rttMs: 150,
            throughputKbps: 1638.4,            
            cpuSlowdownMultiplier: 4,
          };
        const emulatedUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36'
        if (req.body && req.body.type && req.body.url && req.body.isDesktop) {
            let mobileDesktopConfig
            const isDesktop = JSON.parse(req.body.isDesktop)
            if (isDesktop) {
                mobileDesktopConfig = {
                    'formFactor': 'desktop',
                    'screenEmulation': DESKTOP_EMULATION_METRICS,
                    'throttling': desktopDense4G,
                    'channel': 'devtools',
                    'emulatedUserAgent': emulatedUserAgent
                }
            } else {
                mobileDesktopConfig = {
                    'formFactor': 'mobile',
                    'screenEmulation': MOTOG4_EMULATION_METRICS,
                    'throttling': mobileSlow4G,
                    'channel': 'devtools',
                    'emulatedUserAgent': emulatedUserAgent
                }
            }
            const chrome = await chromeLauncher.launch({ chromeFlags: ["--headless"], "user-agent": emulatedUserAgent });
            const options = {
                'extends': 'lighthouse:default', output: req.body.type, maxWaitForLoad: 70 * 1000, port: chrome.port, onlyAudits: [
                    'first-contentful-paint',
                    'first-meaningful-paint',
                    'speed-index',
                    'largest-contentful-paint',
                    'interactive',
                    'cumulative-layout-shift'
                ],
                ...mobileDesktopConfig
            };
            const runnerResult = await lighthouse(req.body.url, options);
            await chrome.kill();
            console.log('Report is done for', runnerResult.lhr.finalUrl);
            if (req.body.type === 'json') {
                let obj = {
                    "first-contentful-paint": runnerResult.lhr.audits['first-contentful-paint'],
                    "largest-contentful-paint": runnerResult.lhr.audits['largest-contentful-paint'],
                    "first-meaningful-paint": runnerResult.lhr.audits['first-meaningful-paint'],
                    "speed-index": runnerResult.lhr.audits['speed-index'],
                    "cumulative-layout-shift": runnerResult.lhr.audits['cumulative-layout-shift'],
                    "interactive": runnerResult.lhr.audits['interactive']
                }
                res.send(obj);
            } else {
                res.send(runnerResult.report);
            }
        } else {
            res.send("Please pass url, type and isDesktop")
        }
        
    } catch (err) {
        console.log(err)
        res.status(500).send("Something went wrong");
    }

})

let server = app.listen(port, function () {
    console.log(`Server listening at ${port}`)
})