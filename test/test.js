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

test('counter HMR preserves count (Browser.application)', async t => {
    const testName = "BrowserApplicationCounter";
    const page = t.context.page;
    await page.goto(`${t.context.serverUrl}/${testName}.html`);

    const inc = "#incrementer ";
    const dec = "#decrementer ";

    await checkCodeVersion(t, page, "v1");
    await stepTheCounter(t, page, 1, inc);
    await stepTheCounter(t, page, 2, inc);
    await stepTheCounter(t, page, 3, inc);
    await clickLink(page, "#nav-decrement");
    await stepTheCounter(t, page, 2, dec);
    await modifyElmCode(t, testName, page, "v1", "v2");
    await stepTheCounter(t, page, 1, dec);
    await clickLink(page, "#nav-increment");
    await stepTheCounter(t, page, 2, inc);
    await modifyElmCode(t, testName, page, "v2", "v3");
    await stepTheCounter(t, page, 3, inc);
    await stepTheCounter(t, page, 4, inc);
    await modifyElmCode(t, testName, page, "v3", "v4");
    await stepTheCounter(t, page, 5, inc);
    await modifyElmCode(t, testName, page, "v4", "v5");
    await clickLink(page, "#nav-decrement");
    await stepTheCounter(t, page, 4, dec);
    await stepTheCounter(t, page, 3, dec);
    await clickLink(page, "#nav-increment");
    await stepTheCounter(t, page, 4, inc);
});

test.skip('multiple Elm Main modules', async t => {
    const testName = "MultiMain";
    const page = t.context.page;
    await page.goto(`${t.context.serverUrl}/${testName}.html`);

    const inc = "#incrementer ";
    const dec = "#decrementer ";

    // interleave various updates to the 2 separate Elm apps
    await checkCodeVersion(t, page, "v1", inc);
    await checkCodeVersion(t, page, "v1", dec);
    await stepTheCounter(t, page, 1, inc);
    await modifyElmCode(t, testName, page, "v1", "v2", inc);
    await stepTheCounter(t, page, 2, inc);
    await stepTheCounter(t, page, 3, inc);
    await modifyElmCode(t, testName, page, "v1", "v2", dec);
    await stepTheCounter(t, page, -1, dec);
    await stepTheCounter(t, page, 4, inc);
    await modifyElmCode(t, testName, page, "v2", "v3", inc);
    await stepTheCounter(t, page, 5, inc);
    await stepTheCounter(t, page, -2, dec);
    await modifyElmCode(t, testName, page, "v3", "v4", inc);
    await modifyElmCode(t, testName, page, "v2", "v3", dec);
    await stepTheCounter(t, page, -3, dec);
    await stepTheCounter(t, page, 6, inc);
});

test('ports are reconnected after HMR', async t => {
    await doCounterTest(t, "MainWithPorts");
});

async function doCounterTest(t, testName) {
    const page = t.context.page;
    await page.goto(`${t.context.serverUrl}/${testName}.html`);

    await checkCodeVersion(t, page, "v1");
    await stepTheCounter(t, page, 1);
    await modifyElmCode(t, testName, page, "v1", "v2");
    await stepTheCounter(t, page, 2);
    await modifyElmCode(t, testName, page, "v2", "v3");
    await stepTheCounter(t, page, 3);
    await stepTheCounter(t, page, 4);
    await modifyElmCode(t, testName, page, "v3", "v4");
    await stepTheCounter(t, page, 5);
    await stepTheCounter(t, page, 6);
    await stepTheCounter(t, page, 7);
    await modifyElmCode(t, testName, page, "v4", "v5");
    await stepTheCounter(t, page, 8);
}


// TEST BUILDING BLOCKS


async function stepTheCounter(t, page, expectedPost, selectorScope = "") {
    await incrementCounter(page, selectorScope);
    t.is(await getCounterValue(page, selectorScope), expectedPost);
}

async function modifyElmCode(t, testName, page, oldVersion, newVersion) {
    const pathToElmCode = path.join(__dirname, `./fixtures/build/${testName}.js`);
    const elmCode = fs.readFileSync(pathToElmCode, {encoding: "utf8"});
    const originalFragment = `elm$html$Html$text('code: ${oldVersion}')`;
    const modifiedFragment = `elm$html$Html$text('code: ${newVersion}')`;
    const newElmCode = elmCode.replace(originalFragment, modifiedFragment);
    if (newElmCode === elmCode) {
        throw Error("Failed to modify the compiled Elm code on disk: pattern not found");
    }
    fs.writeFileSync(pathToElmCode, newElmCode);
    // console.log("Finished writing to the compiled Elm file on disk");
    await page.waitFor(200);
    // console.log("done sleeping");

    await checkCodeVersion(t, page, newVersion);
}

async function clickLink(page, selector) {
    // console.log("Clicking link at selector", selector);
    await Promise.all([
        page.waitForNavigation({timeout: 5000}),
        page.click(selector, {delay: 10}),
    ]);
}


// ELM COUNTER MANIPULATION


// these must match the ids used in the Elm counter example program
const buttonId = "#counter-button";
const valueId = "#counter-value";
const codeVersionId = "#code-version";

async function incrementCounter(page, selectorScope) {
    // console.log("Stepping the counter " + selectorScope);
    await page.click(selectorScope + buttonId, {delay: 10});
}

async function getCounterValue(page, selectorScope) {
    const value = await page.$eval(selectorScope + valueId, el => parseInt(el.innerText));
    // console.log("Current counter value is " + value);
    return value;
}

async function checkCodeVersion(t, page, expectedVersion, selectorScope = "") {
    const value = await page.$eval(selectorScope + codeVersionId, el => el.innerText);
    // console.log("Current code version is " + value);
    t.is(value, `code: ${expectedVersion}`)
    return value;
}
