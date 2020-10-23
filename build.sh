#!/bin/bash
echo ' ~~~~~ Membership/Leads Backend ~~~~~ '
echo ''
echo 'Microservice to handle the reception and manipulation of leads or potential members data'
echo ''
# TODO:Minor Change the hardcoded build folder to one based on a provided flag
# TODO:Minor Copy a execute-only script to the build dir
# Clean everything
rm -rfd ./build/email
rm -rfd ./build/src
rm -rfd ./build/db/tables
rm -rfd build/
mkdir build
mkdir ./build/db/tables
cp -R ./db/tables/* ./build/db/tables
mkdir ./build/email
cp -R ./email/* ./build/email/
cp -R ./execute.sh ./build/execute.sh
echo 'Previous compilation cleaned.'
#  Compile TypeScript
tsc
echo 'Typescript compiled.'
echo ''