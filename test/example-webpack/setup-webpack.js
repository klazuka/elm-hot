const {test} = require('ava');
const puppeteer = require('puppeteer');
const childProcess = require("child_process");

var devServerProcess = null;

function startServer() {
    // Ideally we would use webpack dev server's NodeJS API to start the server, but I couldn't
    // get HMR to work in that case. So we will settle for just spawning the server in a separate process.
    devServerProcess = childProcess.exec("npm run dev", {cwd: 'test/example-webpack'}, (error, stdout, stderr) => {
        if (error) {
            console.error(`failed to launch dev server process; error: ${error}`);
        }
    });
}

test.before(async () => {
    global.browser = await puppeteer.launch({
        headless: true,         // default is true; set to false when debugging failed tests
        slowMo: 50,             // introduce a little delay between each operation
        dumpio: false,          // default is false; set to true when debugging failed tests
        args: ['--no-sandbox']  // required for CI builds
    });
});

test.beforeEach(async t => {
    // TODO [kl] if we ever do multiple webpack tests, we will need to randomize the server listen port
    t.context.httpServer = startServer();
    t.context.serverUrl = 'http://127.0.0.1:3333';

    const page = await browser.newPage();

    // TODO [kl] get rid of the brittle sleep. find a better way
    // a one-second delay on my computer is fine, but CircleCI needs more than that.
    console.log("wait for the server to be ready");
    await page.waitFor(5000);
    console.log("done sleeping");

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
    await t.context.page.close();
});

test.afterEach.always(async t => {
    devServerProcess.kill()
});


test.after.always(async () => {
    if (typeof browser !== "undefined") {
        // normally browser will be defined, but it might not be if a `before` hook failed
        await browser.close();
    }
});
