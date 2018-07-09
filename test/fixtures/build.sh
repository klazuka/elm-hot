#!/usr/bin/env bash


for filename in *.elm; do
    echo "Compiling $filename"
    elm make $filename --output=build/"$(basename "$filename" .elm).js"
done
