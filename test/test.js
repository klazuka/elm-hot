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
    await doBrowserApplicationTest(t, "BrowserApplicationCounter");
});

test('Browser.Navigation.Key can be found in a nested record', async t => {
    await doBrowserApplicationTest(t, "BrowserApplicationCounterDeepKey");
});

test('Browser.Navigation.Key can be found in the variants of a union type', async t => {
    await doBrowserApplicationTest(t, "BrowserApplicationCounterMultiKey");
});

test('init side effects do not run after HMR', async t => {
    // see https://github.com/klazuka/elm-hot-webpack-loader/issues/1
    await doCounterTest(t, "InitSideEffects");
});

test('fullscreen apps which pass empty args to init works', async t => {
    // see https://github.com/klazuka/elm-hot/issues/11
    await doCounterTest(t, "FullScreenEmptyInit");
});

test('multiple Elm Main modules', async t => {
    const testName = "MultiMain";
    const page = t.context.page;
    await page.goto(`${t.context.serverUrl}/${testName}.html`);

    const inc = "#incrementer ";
    const dec = "#decrementer ";

    // interleave various updates to the 2 separate Elm apps
    // one app increments a counter; the other decrements
    // each app has its own counter value.
    await checkCodeVersion(t, page, "inc-v1", inc);
    await checkCodeVersion(t, page, "dec-v1", dec);
    await stepTheCounter(t, page, 1, inc);
    await modifyElmCode(t, testName, page, "inc-v1", "inc-v2", inc);
    await stepTheCounter(t, page, 2, inc);
    await stepTheCounter(t, page, 3, inc);
    await modifyElmCode(t, testName, page, "dec-v1", "dec-v2", dec);
    await stepTheCounter(t, page, -1, dec);
    await stepTheCounter(t, page, 4, inc);
    await modifyElmCode(t, testName, page, "inc-v2", "inc-v3", inc);
    await stepTheCounter(t, page, 5, inc);
    await stepTheCounter(t, page, -2, dec);
    await modifyElmCode(t, testName, page, "inc-v3", "inc-v4", inc);
    await modifyElmCode(t, testName, page, "dec-v2", "dec-v3", dec);
    await stepTheCounter(t, page, -3, dec);
    await stepTheCounter(t, page, 6, inc);
});

test('counter HMR preserves count (embed app in DOM with debugger)', async t => {
    await doCounterTest(t, "DebugEmbed");
});

test('counter HMR preserves count (fullscreen app in DOM with debugger)', async t => {
    await doCounterTest(t, "DebugFullscreen");
});

test('counter HMR preserves count (Browser.application with debugger)', async t => {
    await doBrowserApplicationTest(t, "DebugBrowserApplication");
});

test('pending async tasks are cancelled when HMR is performed', async t => {
    const testName = "MainWithTasks";
    const page = t.context.page;
    await page.goto(`${t.context.serverUrl}/${testName}.html`);
    const sleepyTaskMillis = 5000; // this MUST be in sync with the code in `MainWithTasks.elm`
    const slop = 500; // additional millis to wait just to make sure that everything has completed

    await checkCodeVersion(t, page, "v1");
    t.is(await getCounterValue(page), 0);

    // trigger sleepy increment but do HMR halfway through, cancelling the increment
    await incrementCounter(page);
    t.is(await getCounterValue(page), 0); // still 0 because the increment is async
    await page.waitFor(sleepyTaskMillis / 2);
    await modifyElmCode(t, testName, page, "v1", "v2");
    await page.waitFor((sleepyTaskMillis / 2) + slop);
    t.is(await getCounterValue(page), 0); // should still be 0 because the increment was cancelled

    // trigger sleepy increment but this time allow it to complete
    await incrementCounter(page);
    await page.waitFor(sleepyTaskMillis + slop);
    t.is(await getCounterValue(page), 1); // should now be 1 because the increment had time to finish
    await modifyElmCode(t, testName, page, "v2", "v3");
});

test('ports are reconnected after HMR (embed case)', async t => {
    await doCounterTest(t, "PortsEmbed");
});

test('ports are reconnected after HMR (fullscreen case)', async t => {
    await doCounterTest(t, "PortsFullscreen");
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

async function doBrowserApplicationTest(t, testName) {
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
}


test('if Browser.Navigation.Key cannot be found, degrade gracefully', async t => {
    const testName = "BrowserApplicationMissingNavKeyError";
    // There was a bug (https://github.com/klazuka/elm-hot/issues/15) which caused an infinite loop
    // when the root of the model was a union type and the Browser.Navigation.Key could not be found.
    const page = t.context.page;
    await page.goto(`${t.context.serverUrl}/${testName}.html`);
    // If we made it this far, then the page successfully loaded.
    t.pass()
});


// TEST BUILDING BLOCKS


async function stepTheCounter(t, page, expectedPost, selectorScope = "") {
    await incrementCounter(page, selectorScope);
    t.is(await getCounterValue(page, selectorScope), expectedPost);
}

async function modifyElmCode(t, testName, page, oldVersion, newVersion, selectorScope = "") {
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

    await checkCodeVersion(t, page, newVersion, selectorScope);
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

async function incrementCounter(page, selectorScope = "") {
    // console.log("Stepping the counter " + selectorScope);
    await page.click(selectorScope + buttonId, {delay: 10});
}

async function getCounterValue(page, selectorScope = "") {
    const value = await page.$eval(selectorScope + valueId, el => parseInt(el.innerText));
    // console.log("Current counter value is " + value);
    return value;
}

async function checkCodeVersion(t, page, expectedVersion, selectorScope = "") {
    const value = await page.$eval(selectorScope + codeVersionId, el => el.innerText);
    // console.log("Current code version is " + value);
    t.is(value, `code: ${expectedVersion}`);
    return value;
}
