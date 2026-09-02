const fs = require('fs');
const path = require('path');

const target = path.join(__dirname, '../dist/apps/api/src/index.js');
const rootIndex = path.join(__dirname, '../dist/index.js');

if (fs.existsSync(target) && !fs.existsSync(rootIndex)) {
  fs.writeFileSync(rootIndex, "require('./apps/api/src/index.js');\n");
}
