// inject the HMR code into the Elm compiler's JS output
function inject(hmrCode, originalElmCodeJS) {
    const regex = /(_Platform_export\([^]*)(}\(this\)\);)/;
    const match = regex.exec(originalElmCodeJS);

    if (match === null) {
        throw new Error("Compiled JS from the Elm compiler is not valid. Version mismatch?");
    }

    return originalElmCodeJS.slice(0, match.index)
        + match[1] + "\n\n" + hmrCode + "\n\n" + match[2];
}

module.exports = {
    inject: inject
};