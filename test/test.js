import test from 'ava';

const path = require('path');
const fs = require('fs');

// Setup before and after test conditions and bring in to scope:
//  - `test` : AVA's test function
// - `browser` : puppeteer's browser object
require('./setup');


/*
    AVA tests are run concurrently in separate processes. This is good because
    each integration test is slow. But you must also be careful to isolate
    the tests (especially files on disk)!
*/


test('counter HMR preserves count', async t => {
    const testName = "BrowserElementCounter";
    const page = await browser.newPage();
    await page.goto(`${t.context.serverUrl}/${testName}.html`);

    t.is(await getCounterValue(page), 0);
    await incrementCounter(page);
    t.is(await getCounterValue(page), 1);

    const pathToElmCode = path.join(__dirname, `./fixtures/build/${testName}.js`);
    const elmCode = fs.readFileSync(pathToElmCode, {encoding: "utf8"});
    const originalIncrementCode = "return _Utils_Tuple2(model + 1, elm$core$Platform$Cmd$none);";
    const modifiedIncrementCode = originalIncrementCode.replace("model + 1", "model + 100");
    fs.writeFileSync(pathToElmCode, elmCode.replace(originalIncrementCode, modifiedIncrementCode));

    t.is(await getCounterValue(page), 1);
    await incrementCounter(page);
    t.is(await getCounterValue(page), 101);
});

test('ports are reconnected after HMR', async t => {
    const testName = "MainWithPorts";
    const page = await browser.newPage();
    await page.goto(`${t.context.serverUrl}/${testName}.html`);

    t.is(await getCounterValue(page), 0);
    await incrementCounter(page);
    t.is(await getCounterValue(page), 1);

    const pathToElmCode = path.join(__dirname, `./fixtures/build/${testName}.js`);
    const elmCode = fs.readFileSync(pathToElmCode, {encoding: "utf8"});
    const originalIncrementCode = "return _Utils_Tuple2(n + 1, elm$core$Platform$Cmd$none);";
    const modifiedIncrementCode = originalIncrementCode.replace("n + 1", "n + 100");
    fs.writeFileSync(pathToElmCode, elmCode.replace(originalIncrementCode, modifiedIncrementCode));

    t.is(await getCounterValue(page), 1);
    await incrementCounter(page);
    t.is(await getCounterValue(page), 101);
});



// ELM COUNTER MANIPULATION

// these must match the ids used in the Elm counter example program
const counterIncrementId = "#button-plus";
const counterValueId = "#counter-value";

async function incrementCounter(page) {
    // console.log("Incrementing the counter");
    await page.click(counterIncrementId, {delay: "10"});
}

async function getCounterValue(page) {
    const value = await page.$eval(counterValueId, el => parseInt(el.innerText));
    // console.log("Current counter value is " + value);
    return value;
}


// GENERIC UTIL

const delay = ms => new Promise(res => setTimeout(res, ms));