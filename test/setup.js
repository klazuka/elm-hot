const {test} = require('ava');
const puppeteer = require('puppeteer');
const childProcess = require("child_process");

const {startServer} = require('../server/standalone.js');

global.test = test;

test.before(async () => {
    childProcess.execFileSync('./build.sh', {cwd: "./test/fixtures"});
    global.browser = await puppeteer.launch({headless: true, slowMo: 100});
});

test.beforeEach(async t => {
    t.context.httpServer = startServer();
    t.context.serverUrl = 'http://127.0.0.1:' + t.context.httpServer.address().port;
});

test.after.always(async () => {
    await browser.close();
});
