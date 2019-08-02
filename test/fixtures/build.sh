#!/usr/bin/env bash

cd "${0%/*}" # set CWD to the dir containing the script

set -o errexit
set -o pipefail
set -o nounset

for filename in *.elm; do

    if [[ $filename == MultiMain* ]] ;
    then
        # these will be compiled later as a single unit
        continue
    fi

    extraArgs=""

    if [[ $filename == Debug* ]] ;
    then
        extraArgs="--debug"
    fi

    echo "Compiling $filename"
    npx elm make $filename --output=build/"$(basename "$filename" .elm).js" ${extraArgs}
done

echo "Compiling MultiMain1.elm and MultiMain2.elm"
npx elm make MultiMain1.elm MultiMain2.elm --output=build/MultiMain.js