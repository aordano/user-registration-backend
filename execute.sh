#!/bin/bash
rm -rf ./build/*
tsc
echo ' ~~~~~ Membership/Leads Backend ~~~~~ '
echo ''
echo 'Microservice to handle the reception and manipulation of leads or potential members data'
echo ''
echo 'Init.'
echo 'Server launched.'
node ./start.js
echo "Server closed. Goodbye!"