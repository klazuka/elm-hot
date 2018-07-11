const {test} = require('ava');
const puppeteer = require('puppeteer');
const childProcess = require("child_process");

const {startServer} = require('../server/standalone.js');

global.test = test;

test.before(async () => {
    console.log("Building the Elm code");
    const output = childProcess.execFileSync('./build.sh', {cwd: "./test/fixtures"});
    console.log("Elm build.sh output: " + output);

    global.browser = await puppeteer.launch({headless: true, slowMo: 100, args: ['--no-sandbox']});
});

test.beforeEach(async t => {
    t.context.httpServer = startServer();
    t.context.serverUrl = 'http://127.0.0.1:' + t.context.httpServer.address().port;
});

test.after.always(async () => {
    await browser.close();
});
