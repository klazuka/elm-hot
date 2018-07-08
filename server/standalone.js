const express = require('express');
const path = require('path');
const fs = require('fs');
const chokidar = require('chokidar');
const app = express();

const pathToTestFixtures = path.join(__dirname, "../test/fixtures");
const pathToBuildDir = path.join(pathToTestFixtures, "build");
const watcher = chokidar.watch(pathToBuildDir, {persistent: true});

app.get('/runtime.js', (req, res) => res.sendFile(path.join(__dirname, "../hmr/runtime.js")));

app.get('/:filename.html', (req, res) => {
    const filename = req.params.filename + ".html";
    console.log("Getting HTML for " + filename);
    res.sendFile(path.join(pathToTestFixtures, filename))
});

app.get('/build/:filename.js', function (req, res) {
    const filename = req.params.filename + ".js";
    console.log("Doing injection for " + filename);

    const pathToElmCodeJS = path.join(pathToBuildDir, filename);

    const originalElmCodeJS = fs.readFileSync(pathToElmCodeJS);
    const hmrCode = fs.readFileSync(path.join(__dirname, "../hmr/hmr.js"));

    const regex = /(_Platform_export\([^]*)(}\(this\)\);)/;
    const match = regex.exec(originalElmCodeJS);

    if (match === null) {
        throw new Error("Compiled JS from the Elm compiler is not valid. Version mismatch?");
    }

    const fullyInjectedCode = originalElmCodeJS.slice(0, match.index)
        + match[1] + "\n\n" + hmrCode + "\n\n" + match[2];

    res.send(fullyInjectedCode);
});

app.get('/stream', function (req, res) {
    res.writeHead(200, {
        'Connection': 'keep-alive',
        'Content-Type': 'text/event-stream'
    });

    watcher.on('change', function(pathThatChanged, stats) {
        console.log('path ' + pathThatChanged + ' changed');
        const relativeLoadPath = path.relative(pathToTestFixtures, pathThatChanged);
        res.write(`data: ${relativeLoadPath}\n\n`);
    });
});

function startServer(port) {
    return app.listen(port);
}

if (require.main === module) {
    startServer(3000);
    console.log("Server listening at http://127.0.0.1:3000")
}

module.exports = {
    app,
    startServer: startServer
};
