const fs = require('fs');

const MAX_LINES_PER_CHUNK = 300;
// Why 300 lines? At ~40 chars/line average that's ~12k chars, roughly
// 3000 tokens. Leaves plenty of room for the prompt + response within
// a typical 8k output token budget per call.

/**
 * Reads a file and returns an array of chunks.
 * Each chunk is { filePath, chunkIndex, totalChunks, content }
 *
 * Most files will return a single chunk.
 * Only large files get split.
 */
function chunkFile(filePath) {
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf-8');
  } catch {
    return [];
  }

  const lines = content.split('\n');

  // File fits in one chunk — most common case
  if (lines.length <= MAX_LINES_PER_CHUNK) {
    return [{
      filePath,
      chunkIndex: 0,
      totalChunks: 1,
      content,
    }];
  }

  // Split into pages of MAX_LINES_PER_CHUNK lines each
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