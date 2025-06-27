#!/bin/bash

# Function to convert to kebab-case
to_kebab_case() {
    echo "$1" | tr '[:upper:]' '[:lower:]' | \
    sed -E 's/[^a-zA-Z0-9]/-/g' | \
    sed -E 's/-+/-/g' | \
    sed -E 's/^-+|-+$//g'
}

# Get package name from user
read -p "Enter package name: " package_name
package_name=$(to_kebab_case "$package_name")

# Create directory structure
# Check if package directory already exists
if [ -d "packages/$package_name" ]; then
    echo "Package 'packages/$package_name' already exists. Exiting"
    exit 0
fi

mkdir -p "packages/$package_name/src"

# Create tsconfig.json
cat > "packages/$package_name/tsconfig.json" << EOL
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    // composite is useful for referenced packages. see https://www.typescriptlang.org/docs/handbook/project-references.html#composite
    "composite": true
  },
  "exclude": ["jest.config.ts", "jest.teardown.ts"]
}

EOL

# Create package.json
cat > "packages/$package_name/package.json" << EOL
{
  "name": "@packages/$package_name",
  "version": "0.0.0",
  "private": true,
  "main": "./index.ts",
  "scripts": {
    "test": "node --experimental-vm-modules ../../node_modules/.bin/jest --config jest.config.ts --maxWorkers=2 --passWithNoTests"
  },
  "exports": {
    "./*": "./src/*.ts"
  }
}
EOL

# Create jest.config.ts
cat > "packages/$package_name/jest.config.ts" << EOL
export default {
  // Teardown function after all tests run
  // globalTeardown: '<rootDir>/jest.teardown-init.mjs',
  transform: {
    '^.+\\.(t|j)sx?$': '@swc/jest'
  },
  extensionsToTreatAsEsm: ['.ts', '.tsx']
};

EOL

# Run eslint initialization
cd "packages/$package_name"
npx eslint --fix .
cd ../..

echo -e "Refreshing dependencies..."

npm install "@packages/$package_name"

echo "Package $package_name has been generated successfully!"

