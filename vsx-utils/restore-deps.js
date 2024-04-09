const fs = require('fs');
const path = require('path');

// Path to your package.json file
const filePath = path.join(__dirname, '..', 'package.json');

// Path to your backup file
const backupPath = path.join(__dirname, '..', 'package.json.bak');

// Restore the original package.json
fs.copyFileSync(backupPath, filePath);