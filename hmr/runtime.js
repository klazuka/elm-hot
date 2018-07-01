
// This code (crudely) simulates the hot-module-reloading runtime provided by Webpack.
// We only need to implement a small part of the API in order to provide standalone
// Elm hot reloading without Webpack. We don't need any of the stuff related to Webpack's
// ability to bundle disparate types of modules (JS, CSS, etc.).
//
// For details on the Webpack HMR API, see https://webpack.js.org/api/hot-module-replacement/

console.log("loading the HMR runtime")

var myDisposeCallback = null

// TODO [kl] or alias it to module if running in Webpack
var jsModule = {
    hot: {
        accept: function () {
            console.log("hot.accept() called")
        },

        dispose: function (callback) {
            console.log("hot.dispose() called; storing callback")
            myDisposeCallback = callback
        },

        data: null,

        // only needed when running without webpack
        // TODO [kl] don't call this if you are running in a webpack environment
        myHotApply: function () {
            console.log("myHotApply()")
            var newData = {}
            myDisposeCallback(newData)
            console.log("storing disposed hot data " + JSON.stringify(newData))
            jsModule.hot.data = newData
        }

    }
}
