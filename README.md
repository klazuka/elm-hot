[![CircleCI](https://circleci.com/gh/klazuka/elm-hot.svg?style=svg)](https://circleci.com/gh/klazuka/elm-hot)

# elm-hot

This package provides the core infrastructure needed for doing hot code swapping in Elm. It supports Elm 0.19 only.

**This low-level package is only intended for authors of Elm application servers.**

If you're looking for something that's easier to use, and you're willing to use Webpack, see [elm-hot-webpack-loader](https://github.com/klazuka/elm-hot-webpack-loader), which is built using this package.

The goal of this package is to provide a reusable core that can be used to provide hot code swapping support in a variety of environments--not just Webpack.


## Changelog

### 1.0.1
- bug fixes

### 1.0.0
- improved Browser.application support (Browser.Navigation.Key can be stored anywhere in your model now) 

### 0.9.1
- separated the Webpack loader out into its own package
- exposed core API

### 0.9.0
- first release


### Installing `elm-hot` core API

```bash
$ npm install --save elm-hot
```

---------------------------------------------

### Core API


**`function inject(str)`**

Injects the hot code swapping functionality into a compiled Elm app.

- takes the Javascript code emitted by the Elm compiler as an input string
- returns a string containing the injected code ready to be `eval`-ed in the browser.   


### Example of how the core API could be used 

```javascript
const elmHot = require('elm-hot');
const {compileToStringSync} = require('node-elm-compiler');
const injectedCode = elmHot.inject(compileToStringSync(["src/Main.elm"], {}));
```

In order to provide something similar to `webpack-dev-server` with hot module reloading, an application server could be developed to do the following:

- serve a modified version of the app developer's `index.html` to receive push events from the server
- watch `.elm` files on disk for changes
- whenever a source file changes, push an event to the client notifying it that it should fetch new code from the server
- when the client receives the event:
    - fetch the new code (the server will re-compile the Elm code and use `elm-hot` to inject the hot-code-swapping logic)
    - the client deletes the old `Elm` object and calls `eval()` on the new code from the server
    
I have implemented something similar to this for the integration tests. See [test/server.js]() and [test/client.js]() for inspiration.

The above description is probably a bit too vague, so if you would like more details, create an issue.

-------------------------------------------


### Attribution

Elm hot code swapping is based on the work of Flux Xu's [elm-hot-loader](https://github.com/fluxxu/elm-hot-loader).
