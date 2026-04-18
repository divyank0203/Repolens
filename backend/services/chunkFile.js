const fs = require('fs');

const MAX_LINES_PER_CHUNK = 300;

function chunkFile(filePath) {
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf-8');
  } catch {
    return [];
  }

  const lines = content.split('\n');

  
  if (lines.length <= MAX_LINES_PER_CHUNK) {
    return [{
      filePath,
      chunkIndex: 0,
      totalChunks: 1,
      content,
    }];
  }

  
  const chunks = [];
  for (let i = 0; i < lines.length; i += MAX_LINES_PER_CHUNK) {
    const slice = lines.slice(i, i + MAX_LINES_PER_CHUNK);
    chunks.push({
      filePath,
      chunkIndex: chunks.length,
      totalChunks: Math.ceil(lines.length / MAX_LINES_PER_CHUNK),
      content: slice.join('\n'),
    });
  }

  return chunks;
}

module.exports = { chunkFile };