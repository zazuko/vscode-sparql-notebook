const fs = require('fs');
const path = require('path');

// Path to your package.json file
const filePath = path.join(__dirname, '..', 'package.json');

// Path to your backup file
const backupPath = path.join(__dirname, '..', 'package.json.bak');

// Restore the original package.json if the backup exists
if (fs.existsSync(backupPath)) {
    fs.copyFileSync(backupPath, filePath);
    console.log("Restored original VS Code dependencies from package.json.bak.");
} else {
    console.log("No package.json.bak found. Assuming standard dependencies are already active.");
}