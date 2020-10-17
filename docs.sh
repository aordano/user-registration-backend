#!/bin/bash
echo 'Generating docs...'
# Generate docs
typedoc 
# Copy support files for the docs
cp -R ./docsDependencies/* ./docs/assets/js/
cp ./.nojekyll ./docs/
echo '...done'