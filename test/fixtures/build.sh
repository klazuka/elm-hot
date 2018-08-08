#!/usr/bin/env bash

set -o errexit
set -o pipefail
set -o nounset

for filename in *.elm; do

    if [[ $filename == MultiMain* ]] ;
    then
        # these will be compiled later as a single unit
        continue
    fi

    echo "Compiling $filename"
    npx elm make $filename --output=build/"$(basename "$filename" .elm).js"
done

echo "Compiling MultiMain1.elm and MultiMain2.elm"
npx elm make MultiMain1.elm MultiMain2.elm --output=build/MultiMain.js