const {test} = require('ava');
const puppeteer = require('puppeteer');
const childProcess = require("child_process");

const {startServer} = require('./server.js');

test.before(async () => {
    console.log("Building the Elm code");
    const output = childProcess.execFileSync('./build.sh', {cwd: "./test/fixtures"});
    console.log("Elm build.sh output: " + output);

    global.browser = await puppeteer.launch({
        headless: true,         // default is true; set to false when debugging failed tests
        slowMo: 50,             // introduce a little delay between each operation
        dumpio: false,          // default is false; set to true when debugging failed tests
        args: ['--no-sandbox']  // required for CI builds
    });
});

test.beforeEach(async t => {
    t.context.httpServer = startServer();
    t.context.serverUrl = 'http://127.0.0.1:' + t.context.httpServer.address().port;

    const page = await browser.newPage();
    page.on('pageerror', error => {
        console.log("BROWSER: uncaught exception: " + error);
    });
    page.on('requestfailed', request => {
        console.log("BROWSER: request failed: " + request.url());
    });
    page.on('response', response => {
        if (!response.ok())
            console.error("BROWSER: response: " + response.url() + " " + response.status());
    });
    t.context.page = page;
});

test.afterEach(async t => {
    await t.context.page.close()
});

test.after.always(async () => {
    if (typeof browser !== "undefined") {
        // normally browser will be defined, but it might not be if a `before` hook failed
        await browser.close();
    }
});
