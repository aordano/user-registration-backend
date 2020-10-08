#!/bin/bash
bash ./build.sh
echo 'Server launching on port 9898.'
echo 'Now listening.'
echo ''
node ./start.js
echo "Server closed. Goodbye!"