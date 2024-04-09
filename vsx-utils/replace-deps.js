const fs = require('fs');
const path = require('path');

// Path to your package.json file
const packageJsonFilePath = path.join(__dirname, '..', 'package.json');
const extensionFilePath = path.join(__dirname, '..', ' extension-dependencies.open-vsx.json');

// Read the package.json file
const packageJsonFile = fs.readFileSync(packageJsonFilePath);
const packageJson = JSON.parse(packageJsonFile);

const extensionFile = fs.readFileSync(extensionFilePath);
const extensionJson = JSON.parse(extensionFile);

// Create a backup
fs.writeFileSync(path.join(__dirname, '..', 'package.json.bak'), packageJsonFile);

// Replace the extensionDependencies array
packageJson.extensionDependencies = extensionJson.extensionDependencies;

// Write the updated JSON back to the file
fs.writeFileSync(packageJsonFilePath, JSON.stringify(packageJson, null, 2));