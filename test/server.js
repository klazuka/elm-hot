const express = require('express');
const path = require('path');
const fs = require('fs');
const chokidar = require('chokidar');
const app = express();

const {inject} = require('../src/inject.js');

const pathToTestFixtures = path.join(__dirname, "./fixtures");
const pathToBuildDir = path.join(pathToTestFixtures, "build");

try {
    fs.mkdirSync(pathToBuildDir);
} catch (error) {
    if (error.code !== 'EEXIST') throw error;
}
const watcher = chokidar.watch(pathToBuildDir, {persistent: true});

app.get('/client.js', (req, res) => res.sendFile(path.join(__dirname, "./client.js")));

app.get('/:filename.html', (req, res) => {
    const filename = req.params.filename + ".html";
    res.sendFile(path.join(pathToTestFixtures, filename))
});

app.get('/build/:filename.js', function (req, res) {
    const filename = req.params.filename + ".js";
    const pathToElmCodeJS = path.join(pathToBuildDir, filename);
    const originalElmCodeJS = fs.readFileSync(pathToElmCodeJS, {encoding: "utf8"});
    const fullyInjectedCode = inject(originalElmCodeJS);
    res.send(fullyInjectedCode);
});

app.get('/stream-:programName', function (req, res) {
    const programName = req.params.programName;
    res.writeHead(200, {
        'Connection': 'keep-alive',
        'Content-Type': 'text/event-stream'
    });

    watcher.on('change', function (pathThatChanged, stats) {
        if (pathThatChanged.endsWith(programName + ".js")) {
            //console.log("Pushing HMR event to client");
            const relativeLoadPath = path.relative(pathToTestFixtures, pathThatChanged);
            res.write(`data: ${relativeLoadPath}\n\n`);
        }
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
