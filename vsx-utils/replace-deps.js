const fs = require('fs');
const path = require('path');

// Path to your package.json file
const packageJsonFilePath = path.join(__dirname, '..', 'package.json');
// Fixed filename typo for open-vsx dependencies file
const extensionFilePath = path.join(__dirname, '..', 'extension-dependencies.open-vsx.json');
// Provide backwards compatibility in case filename typo still exists on disk
const oldExtensionFilePath = path.join(__dirname, '..', ' extension-dependencies.open-vsx.json');

// Read the package.json file
const packageJsonFile = fs.readFileSync(packageJsonFilePath);
const packageJson = JSON.parse(packageJsonFile);

const effectiveExtensionFilePath = fs.existsSync(extensionFilePath) ? extensionFilePath : oldExtensionFilePath;
const extensionFile = fs.readFileSync(effectiveExtensionFilePath);
const extensionJson = JSON.parse(extensionFile);

// Check if open-vsx dependencies are already applied to prevent replacing backup
if (JSON.stringify(packageJson.extensionDependencies) === JSON.stringify(extensionJson.extensionDependencies)) {
    console.log("Open VSX dependencies are already active. Skipping replacement to protect backup.");
    process.exit(0);
}

// Create a backup
fs.writeFileSync(path.join(__dirname, '..', 'package.json.bak'), packageJsonFile);

// Replace the extensionDependencies array
packageJson.extensionDependencies = extensionJson.extensionDependencies;

// Write the updated JSON back to the file
fs.writeFileSync(packageJsonFilePath, JSON.stringify(packageJson, null, 2));

console.log("Applied Open VSX dependencies. package.json backed up.");