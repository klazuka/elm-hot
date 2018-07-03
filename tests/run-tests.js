const path = require('path');
const fs = require('fs');
const chai = require("chai");
const expect = chai.expect;
const puppeteer = require('puppeteer');

const serverUrl = 'http://127.0.0.1:3000';

// these must match the ids used in the Elm counter example program
const counterIncrementId = "#button-plus";
const counterValueId = "#counter-value";

const pathToElmCode = path.join(__dirname, "../app/dist/elm-output.js");
const elmCode = fs.readFileSync(pathToElmCode, {encoding: "utf8"});
const originalIncrementCode = "return _Utils_Tuple2(model + 1, elm$core$Platform$Cmd$none);";
const modifiedIncrementCode = originalIncrementCode.replace("model + 1", "model + 100");

(async() => {
    const browser = await puppeteer.launch({headless: true, slowMo: 100});
    const page = await browser.newPage();

    console.log("Loading the page");
    await page.goto(serverUrl);
    console.log("Finished loading the page");

    expect(await getCounterValue(page)).to.equal(0);
    await incrementCounter(page);
    expect(await getCounterValue(page)).to.equal(1);

    console.log("Modifying the Elm code to change the increment-by amount");
    fs.writeFileSync(pathToElmCode, elmCode.replace(originalIncrementCode, modifiedIncrementCode));
    await timeout(1000);

    expect(await getCounterValue(page)).to.equal(1);
    await incrementCounter(page);
    expect(await getCounterValue(page)).to.equal(101);

    console.log("Closing the browser");
    await browser.close();
})().catch((reason) => {
    console.log('Unhandled promise failure:', reason);
}).finally(() => {
    console.log("Final cleanup");
    fs.writeFileSync(pathToElmCode, elmCode);
});

const timeout = ms => new Promise(res => setTimeout(res, ms));

async function incrementCounter(page) {
    console.log("Incrementing the counter");
    await page.click(counterIncrementId, {delay: "10"});
}

async function getCounterValue(page) {
    const value = await page.$eval(counterValueId, el => parseInt(el.innerText));
    console.log("Current counter value is " + value);
    return value;
}
