#!/bin/bash
# Load all the cleaning and building process
bash ./build.sh
echo 'Server launching on port 9898.'
echo 'Now listening.'
echo ''
# Start server. It says that the server is listening before actually running it
# because otherwise the message would not appear.
# TODO:Patch Delete listening message and add it inside the app.
node ./start.js
echo "Server closed. Goodbye!"