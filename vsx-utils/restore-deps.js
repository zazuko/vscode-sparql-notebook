const fs = require('fs');
const path = require('path');

// Path to your package.json file
const filePath = path.join(__dirname, '..', 'package.json');

// Path to your backup file
const backupPath = path.join(__dirname, '..', 'package.json.bak');

// Restore the original extensionDependencies if the backup exists
if (fs.existsSync(backupPath)) {
    const currentJson = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const backupJson = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

    currentJson.extensionDependencies = backupJson.extensionDependencies;
    fs.writeFileSync(filePath, JSON.stringify(currentJson, null, 2) + '\n');

    // Optionally remove backup
    // fs.unlinkSync(backupPath);

    console.log("Restored original VS Code dependencies from package.json.bak.");
} else {
    console.log("No package.json.bak found. Assuming standard dependencies are already active.");
}