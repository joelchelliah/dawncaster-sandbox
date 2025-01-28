const fs = require("fs");

function createDir(dirName) {
  if (!fs.existsSync(dirName)) {
    fs.mkdirSync(dirName, { recursive: true });
  }
}

module.exports = { createDir };
