#!/usr/bin/env bash


for filename in *.elm; do
    echo "Compiling $filename"
    npx elm make $filename --output=build/"$(basename "$filename" .elm).js"
done
