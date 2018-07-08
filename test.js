import test from 'ava';
const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');
const {startServer} = require('./server/standalone.js');


/*
    AVA tests are run concurrently in separate processes. This is good because
    each integration test is slow. But you must also be careful to isolate
    the tests (especially files on disk)!
 */



test('counter HMR preserves count', async t => {
    const httpServer = startServer();
    const serverUrl = 'http://127.0.0.1:' + httpServer.address().port;
    console.log("server running at", serverUrl);

    // these must match the ids used in the Elm counter example program
    const counterIncrementId = "#button-plus";
    const counterValueId = "#counter-value";

    async function incrementCounter(page) {
        console.log("Incrementing the counter");
        await page.click(counterIncrementId, {delay: "10"});
    }

    async function getCounterValue(page) {
        const value = await page.$eval(counterValueId, el => parseInt(el.innerText));
        console.log("Current counter value is " + value);
        return value;
    }

    const pathToElmCode = path.join(__dirname, "./test/fixtures/build/BrowserElementCounter.js");
    const elmCode = fs.readFileSync(pathToElmCode, {encoding: "utf8"});
    const originalIncrementCode = "return _Utils_Tuple2(model + 1, elm$core$Platform$Cmd$none);";
    const modifiedIncrementCode = originalIncrementCode.replace("model + 1", "model + 100");

    const browser = await puppeteer.launch({headless: true, slowMo: 100});
    const page = await browser.newPage();
    // page.on('console', msg => console.log(msg.text()));

    console.log("Loading the page");
    await page.goto(serverUrl + "/BrowserElementCounter.html");
    console.log("Finished loading the page");

    t.is(await getCounterValue(page), 0);
    await incrementCounter(page);
    t.is(await getCounterValue(page), 1);

    console.log("Modifying the Elm code to change the increment-by amount");
    fs.writeFileSync(pathToElmCode, elmCode.replace(originalIncrementCode, modifiedIncrementCode));
    await delay(100);

    t.is(await getCounterValue(page), 1);
    await incrementCounter(page);
    t.is(await getCounterValue(page), 101);

    console.log("Closing the browser");
    await browser.close();
    console.log("Final cleanup");
    fs.writeFileSync(pathToElmCode, elmCode);
});


// UTIL

const delay = ms => new Promise(res => setTimeout(res, ms));