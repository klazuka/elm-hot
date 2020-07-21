#!/usr/bin/env bash

if ! command -v elm &> /dev/null
then
    echo "Could not find the Elm compiler on your path"
    exit 1
fi

ACTUAL_ELM_VERSION=$(elm --version)

if ! echo $ACTUAL_ELM_VERSION | grep -q "0.19.[01]"
then
    echo "Expected Elm compiler version 0.19.0 or 0.19.1, got $ACTUAL_ELM_VERSION"
    exit 2
fi

echo "Testing with Elm $ACTUAL_ELM_VERSION"
npx ava
