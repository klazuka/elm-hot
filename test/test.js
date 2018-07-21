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


test('counter HMR preserves count (Browser.element)', async t => {
    await doCounterTest(t, "BrowserElementCounter");
});

test('counter HMR preserves count (Browser.document)', async t => {
    await doCounterTest(t, "BrowserDocumentCounter");
});

test('counter HMR preserves count (Browser.sandbox)', async t => {
    await doCounterTest(t, "BrowserSandboxCounter");
});

test('multiple Elm Main modules', async t => {
    const testName = "MultiMain";
    const page = t.context.page;
    await page.goto(`${t.context.serverUrl}/${testName}.html`);

    await stepTheCounter(t, page, 0, 1, "#incrementer ");
    await stepTheCounter(t, page, 0, -1, "#decrementer ");
    await modifyElmIncrementCode(t, testName, page, 1, 10, "+");
    await modifyElmIncrementCode(t, testName, page, 1, 10, "-");
    await stepTheCounter(t, page, 1, 11, "#incrementer ");
    await stepTheCounter(t, page, -1, -11, "#decrementer ");
});

test('ports are reconnected after HMR', async t => {
    await doCounterTest(t, "MainWithPorts");
});

async function doCounterTest(t, testName) {
    const page = t.context.page;
    await page.goto(`${t.context.serverUrl}/${testName}.html`);

    await stepTheCounter(t, page, 0, 1);
    await modifyElmIncrementCode(t, testName, page, 1, 10);
    await stepTheCounter(t, page, 1, 11);
    await modifyElmIncrementCode(t, testName, page, 10, 20);
    await stepTheCounter(t, page, 11, 31);
    await stepTheCounter(t, page, 31, 51);
    await stepTheCounter(t, page, 51, 71);
    await modifyElmIncrementCode(t, testName, page, 20, 30);
    await stepTheCounter(t, page, 71, 101);
}


// TEST BUILDING BLOCKS


async function stepTheCounter(t, page, expectedPre, expectedPost, selectorScope = "") {
    t.is(await getCounterValue(page, selectorScope), expectedPre);
    await incrementCounter(page, selectorScope);
    t.is(await getCounterValue(page, selectorScope), expectedPost);
}

async function modifyElmIncrementCode(t, testName, page, oldIncrementBy, newIncrementBy, binOp = "+") {
    const pathToElmCode = path.join(__dirname, `./fixtures/build/${testName}.js`);
    const elmCode = fs.readFileSync(pathToElmCode, {encoding: "utf8"});
    const originalIncrementCode = `{count: model.count ${binOp} ${oldIncrementBy}}`;
    const modifiedIncrementCode = `{count: model.count ${binOp} ${newIncrementBy}}`;
    const newElmCode = elmCode.replace(originalIncrementCode, modifiedIncrementCode);
    if (newElmCode === elmCode) {
        throw Error("Failed to modify the compiled Elm code on disk: pattern not found");
    }
    fs.writeFileSync(pathToElmCode, newElmCode);
    // console.log("Finished writing to the compiled Elm file on disk");
    await page.waitFor(200);
    // console.log("done sleeping");
}



// ELM COUNTER MANIPULATION


// these must match the ids used in the Elm counter example program
const buttonId = "#counter-button";
const valueId = "#counter-value";

async function incrementCounter(page, selectorScope) {
    // console.log("Incrementing the counter");
    await page.click(selectorScope + buttonId, {delay: "10"});
}

async function getCounterValue(page, selectorScope) {
    const value = await page.$eval(selectorScope + valueId, el => parseInt(el.innerText));
    // console.log("Current counter value is " + value);
    return value;
}
