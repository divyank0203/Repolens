const path = require('path');
const fs   = require('fs');
const { chunkFile }           = require('./chunkFile');
const { summarizeFile }       = require('./summarizeFile');
const { synthesizeSummaries } = require('./synthesizeSummaries');

const PARSEABLE_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs']);
const CONCURRENCY  = 3;
const MAX_FILES    = 20;
const MAX_FILE_SIZE = 50000; // skip files larger than 50kb (usually generated)

function flattenTree(tree, basePath) {
  const files = [];
  for (const node of tree) {
    const fullPath = path.join(basePath, node.name);
    if (node.type === 'file') {
      files.push(fullPath);
    } else if (node.type === 'directory') {
      files.push(...flattenTree(node.children, fullPath));
    }
  }
  return files;
}


async function withRetry(fn, retries = 4, defaultDelayMs = 15000) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const isRateLimit =
        err.status === 429 ||
        (err.message && err.message.includes('429')) ||
        (err.message && err.message.toLowerCase().includes('rate limit'));

      if (isRateLimit && attempt < retries) {
        // Try to parse the suggested retry delay from the error message
        // Groq includes something like "Please retry in 58.4s"
        let wait = defaultDelayMs * Math.pow(2, attempt);
        const match = err.message && err.message.match(/retry in ([\d.]+)s/i);
        if (match) {
          // Use the suggested delay + 2s buffer
          wait = Math.ceil(parseFloat(match[1]) * 1000) + 2000;
        }
        console.log(`  Rate limited. Waiting ${(wait / 1000).toFixed(1)}s before retry ${attempt + 1}...`);
        await new Promise(res => setTimeout(res, wait));
      } else {
        throw err;
      }
    }
  }
}

async function runInBatches(items, concurrency, asyncFn) {
  const results = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(item => withRetry(() => asyncFn(item)))
    );
    results.push(...batchResults);
    console.log(`  Summarized ${Math.min(i + concurrency, items.length)}/${items.length} files`);

    
    if (i + concurrency < items.length) {
      await new Promise(res => setTimeout(res, 2000));
    }
  }
  return results;
}

async function runAnalysisPipeline(repoRoot, fileTree, repoUrl) {
  console.log('\n=== RepoLens AI Pipeline ===');

  // --- Stage 1: Chunking ---
  console.log('\n[Stage 1] Chunking files...');
  const allFiles = flattenTree(fileTree, repoRoot);

  const jsFiles = allFiles
    .filter(f => PARSEABLE_EXTENSIONS.has(path.extname(f)))
    .filter(f => {
      try { return fs.statSync(f).size < MAX_FILE_SIZE; }
      catch { return false; }
    })
    .slice(0, MAX_FILES);

  console.log(`  Found ${jsFiles.length} JS/TS files (capped at ${MAX_FILES})`);

  const fileChunkGroups = jsFiles.map(filePath => {
    const chunks = chunkFile(filePath);
    return chunks.map(c => ({
      ...c,
      filePath: path.relative(repoRoot, c.filePath),
    }));
  }).filter(group => group.length > 0);

  // --- Stage 2: Per-file summarization ---
  console.log(`\n[Stage 2] Summarizing ${fileChunkGroups.length} files (concurrency: ${CONCURRENCY})...`);

  const summaryResults = await runInBatches(
    fileChunkGroups,
    CONCURRENCY,
    (chunks) => summarizeFile(chunks)
  );

  const fileSummaries = summaryResults.filter(Boolean);
  console.log(`  Got ${fileSummaries.length} file summaries`);

  // --- Stage 3: Group by folder (pure transform, no LLM call) ---
  console.log('\n[Stage 3] Grouping summaries by folder...');

  // --- Stage 4: Final synthesis ---
  console.log('\n[Stage 4] Synthesizing architecture overview...');
  const architectureOverview = await synthesizeSummaries(fileSummaries, repoUrl);

  console.log('\n=== Pipeline complete ===\n');

  return {
    fileSummaries,
    architectureOverview,
  };
}

module.exports = { runAnalysisPipeline };