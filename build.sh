#!/bin/bash
echo ' ~~~~~ Membership/Leads Backend ~~~~~ '
echo ''
echo 'Microservice to handle the reception and manipulation of leads or potential members data'
echo ''
rm -rf ./build/*
mkdir ./build/db
mkdir ./build/db/tables
cp -R ./db/* ./build/db/
mkdir ./build/email
cp -R ./email/* ./build/email/
echo 'Previous compilation cleaned.'
tsc
echo 'Typescript compiled. Generating docs...'
typedoc 
cp -R ./docsDependencies/* ./docs/assets/js/
cp ./.nojekyll ./docs/
echo '...done.'
echo ''