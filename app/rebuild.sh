#!/bin/bash
rm -rf dist/
elm make src/Counter.elm --output=dist/elm-output.js
