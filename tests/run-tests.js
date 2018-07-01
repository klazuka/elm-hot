
const chai = require("chai");
const expect = chai.expect;
const puppeteer = require('puppeteer');

const serverUrl = 'http://127.0.0.1:3000';

// these must match the ids used in the Elm counter example program
const counterIncrementId = "#button-plus";
const counterValueId = "#counter-value";

process.on('unhandledRejection', (reason, p) => {
    console.log('Unhandled Rejection at: Promise', p);
    process.exit(1);
});


(async() => {
    const browser = await puppeteer.launch({headless: false, slowMo: 100});
    const page = await browser.newPage();

    console.log("Loading the page");
    await page.goto(serverUrl);
    console.log("Finished loading the page");

    expect(await getCounterValue(page)).to.equal(0);
    await incrementCounter(page);
    expect(await getCounterValue(page)).to.equal(1);

    console.log("Closing the browser");
    await browser.close();
})();

async function incrementCounter(page) {
    console.log("Incrementing the counter");
    await page.click(counterIncrementId, {delay: "10"});
}

async function getCounterValue(page) {
    const value = await page.$eval(counterValueId, el => parseInt(el.innerText));
    console.log("Current counter value is " + value);
    return value;
}
