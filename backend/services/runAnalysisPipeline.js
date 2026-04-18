const path = require('path');
const { chunkFile } = require('./chunkFile');
const { summarizeFile } = require('./summarizeFile');
const { synthesizeSummaries } = require('./synthesizeSummaries');

const PARSEABLE_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs']);


const CONCURRENCY = 5;


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

async function withRetry(fn, retries = 3, delayMs = 10000) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const isRateLimit = err.status === 429 ||
        (err.message && err.message.includes('429'));

      if (isRateLimit && attempt < retries) {
        const wait = delayMs * Math.pow(2, attempt); // 10s, 20s, 40s
        console.log(`  Rate limited. Waiting ${wait / 1000}s before retry ${attempt + 1}...`);
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
  }
  return results;
}


async function runAnalysisPipeline(repoRoot, fileTree, repoUrl) {
  console.log('\n=== RepoLens AI Pipeline ===');

  // --- Stage 1: Chunking ---
  console.log('\n[Stage 1] Chunking files...');
  const allFiles = flattenTree(fileTree, repoRoot);
  const jsFiles = allFiles.filter(f =>
    PARSEABLE_EXTENSIONS.has(path.extname(f))
  );

  console.log(`  Found ${jsFiles.length} JS/TS files`);

  // Group chunks by file so summarizeFile() can merge multi-chunk files
  const fileChunkGroups = jsFiles.map(filePath => {
    const chunks = chunkFile(filePath);
    // Store relative path in chunks for cleaner output
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

  // Filter out any nulls from files that failed to read
  const fileSummaries = summaryResults.filter(Boolean);

  console.log(`  Got ${fileSummaries.length} file summaries`);

  // --- Stage 3: Group by folder (no LLM call — pure transform) ---
  console.log('\n[Stage 3] Grouping summaries by folder...');
  // This happens inside synthesizeSummaries — no separate step needed

  // --- Stage 4: Final synthesis ---
  console.log('\n[Stage 4] Synthesizing architecture overview...');
  const architectureOverview = await synthesizeSummaries(fileSummaries, repoUrl);

  console.log('\n=== Pipeline complete ===\n');

  return {
    fileSummaries,   // array of { filePath, summary } — useful for per-file UI
    architectureOverview, // string — the high level explanation
  };
}

module.exports = { runAnalysisPipeline };