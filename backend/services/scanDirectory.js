const fs = require('fs');
const path = require('path');


const IGNORED = new Set([
  'node_modules', '.git', 'dist', 'build',
  '.next', 'coverage', '__pycache__', '.cache'
]);

function scanDirectory(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });


  const result = [];

  for (const entry of entries) {
    
    if (IGNORED.has(entry.name)) continue;

    if (entry.isDirectory()) {
      result.push({
        type: 'directory',
        name: entry.name,
        children: scanDirectory(path.join(dirPath, entry.name))
 
      });
    } else {
      result.push({
        type: 'file',
        name: entry.name,
      });
    }
  }


  return result.sort((a, b) => {
    if (a.type === b.type) return a.name.localeCompare(b.name);
    return a.type === 'directory' ? -1 : 1;
  });
}

module.exports = { scanDirectory };