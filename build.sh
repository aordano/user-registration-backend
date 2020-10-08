#!/bin/bash
echo ' ~~~~~ Membership/Leads Backend ~~~~~ '
echo ''
echo 'Microservice to handle the reception and manipulation of leads or potential members data'
echo ''
rm -rf ./build/*
mkdir ./build/tables
cp -R ./tables/* ./build/tables/
echo 'Previous compilation cleaned.'
tsc
echo 'Typescript compiled. Generating docs...'
typedoc 
cp -R ./docsDependencies/* ./docs/assets/js/
cp ./.nojekyll ./docs/
echo '...done.'
echo ''