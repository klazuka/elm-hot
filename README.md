[![CircleCI](https://circleci.com/gh/klazuka/elm-hot.svg?style=svg)](https://circleci.com/gh/klazuka/elm-hot)

# elm-hot

Hot code swapping support for Elm 0.19. This improves the Elm development workflow by automatically reloading
your code in the browser after a change, while preserving your current app state.

This package provides a Webpack loader that can be used in conjunction with 
[elm-webpack-loader](https://github.com/elm-community/elm-webpack-loader). I intend
to provide alternative integration options in the future that do not require Webpack.


## Changelog

### 0.9.0
- first release
- Elm 0.19 support


## Installation

```
$ npm install --save-dev elm-webpack-loader elm-hot
```


## Webpack Loader Usage

Assuming that you're already using `elm-webpack-loader`, just add `{ loader: 'elm-hot' }` immediately 
**before** `elm-webpack-loader` in the `use` array. 

It should look something like this:

```javascript
module.exports = {
    module: {
        rules: [
            {
                test: /\.elm$/,
                exclude: [/elm-stuff/, /node_modules/],

                use: [
                    { loader: 'elm-hot' },
                    {
                        loader: 'elm-webpack-loader',
                        options: {
                            cwd: __dirname
                        }
                    }
                ]
            }
        ]
    }
}
```

It's important that the `elm-hot` loader comes *before* the `elm-webpack-loader` in the `use` array.

When running `webpack-dev-server`, you must add the `--hot` flag.


## Example

Check out the [example app](https://github.com/klazuka/example-elm-hot-webpack).


## Caveats

- Elm 0.18 is not supported. Use fluxxu/elm-hot-loader@0.5.x instead.
- If your app uses `Browser.application`, then the `Browser.Navigation.Key` must be stored at the root
  of your app Model.


## Attribution

This is based on the work of Flux Xu's [elm-hot-loader](https://github.com/fluxxu/elm-hot-loader).
