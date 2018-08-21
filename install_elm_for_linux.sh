#!/usr/bin/env bash

# remove this script once the npm Elm 0.19 installer is released
curl https://44a95588fe4cc47efd96-ec3c2a753a12d2be9f23ba16873acc23.ssl.cf2.rackcdn.com/binaries-for-linux-64.tar.gz > elm19.tar.gz
tar zxvf elm19.tar.gz
rm elm19.tar.gz
mv elm node_modules/.bin/elm