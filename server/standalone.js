const express = require('express');
const path = require('path');
const fs = require('fs');
const chokidar = require('chokidar');
const app = express();

const pathToElmCode = path.join(__dirname, "../app/dist/elm-output.js");

const watcher = chokidar.watch(pathToElmCode, {persistent: true});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, "../app/app.html")));
app.get('/client.js', (req, res) => res.sendFile(path.join(__dirname, "../hmr/client.js")));
app.get('/runtime.js', (req, res) => res.sendFile(path.join(__dirname, "../hmr/runtime.js")));

app.get('/injected.js', function (req, res) {
    console.log("GET /injected.js");
    const originalElmCode = fs.readFileSync(pathToElmCode);
    const hmrCode = fs.readFileSync(path.join(__dirname, "../hmr/hmr.js"));

    const regex = /(_Platform_export\([^]*)(}\(this\)\);)/;
    const match = regex.exec(originalElmCode);

    if (match === null) {
        throw new Error("Compiled JS from the Elm compiler is not valid. Version mismatch?");
    }

    const fullyInjectedCode = originalElmCode.slice(0, match.index)
        + match[1] + "\n\n" + hmrCode + "\n\n" + match[2];

    res.send(fullyInjectedCode);
});

app.get('/stream', function (req, res) {
    res.writeHead(200, {
        'Connection': 'keep-alive',
        'Content-Type': 'text/event-stream'
    });

    watcher.on('change', function(path, stats) {
        console.log('path ' + path + ' changed');
        res.write('data: something changed\n\n');
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
