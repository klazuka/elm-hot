
// This code simulates the client code from webpack-hot-middleware

function pullNewCode() {
    console.log("pulling new code");

    var myRequest = new Request("http://127.0.0.1:3000/injected.js");
    myRequest.cache = "no-cache";

    fetch(myRequest).then(function (response) {
        console.log(response.status + " " + response.statusText);
        response.text().then(function (value) {
            jsModule.hot.myHotApply();
            delete Elm;
            eval(value)
        })
    })
}

var eventSource = new EventSource("stream");
eventSource.onmessage = function (evt) {
    console.log("got message: " + evt.data);
    pullNewCode()
};