// Entry point for Render deployment
const fs = require('fs');
const path = require('path');

// Check which main file exists and use that one
const possibleMainFiles = ['server.js', 'index.js', 'app.js'];
let mainFile = null;

for (const file of possibleMainFiles) {
  if (fs.existsSync(path.join(__dirname, file))) {
    mainFile = file;
    break;
  }
}

if (mainFile) {
  console.log(`Found main file: ${mainFile}, starting server...`);
  require(`./${mainFile}`);
} else {
  console.error('No main server file found. Please create server.js, index.js, or app.js');
  process.exit(1);
}