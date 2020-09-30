#!/bin/bash
echo ' ~~~~~ Membership/Leads Backend ~~~~~ '
echo ''
echo 'Microservice to handle the reception and manipulation of leads or potential members data'
echo ''
rm -rf ./build/*
echo 'Previous compilation cleaned.'
tsc
echo 'Typescript compiled. Generating docs...'
typedoc
echo ''
echo 'Server launched on port 9898.'
echo 'Now listening.'
echo ''
node ./start.js
echo "Server closed. Goodbye!"