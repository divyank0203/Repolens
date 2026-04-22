const path = require('path');
const fs   = require('fs');
const { chunkFile }           = require('./chunkFile');
const { summarizeFile }       = require('./summarizeFile');
const { synthesizeSummaries } = require('./synthesizeSummaries');

const PARSEABLE_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs']);
const CONCURRENCY   = 3;
const MAX_FILE_SIZE = 50000; 

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

function priorityScore(filePath) {
  const normalized = filePath.replace(/\\/g, '/').toLowerCase();
  const filename   = path.basename(normalized, path.extname(normalized));

  if (['index', 'main', 'app', 'server', 'client'].includes(filename)) return 0;
  if (/^src\/[^/]+$/.test(normalized))                                  return 1;
  if (/\/(routes|controllers|services)\//.test(normalized))             return 2;
  if (/\/(components|pages|views|screens)\//.test(normalized))          return 3;
  if (/\/(utils|helpers|lib|hooks)\//.test(normalized))                 return 4;
  if (/\.(test|spec)\.[jt]sx?$/.test(normalized))                       return 9;
  return 5;
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
        let wait = defaultDelayMs * Math.pow(2, attempt);
        const match = err.message && err.message.match(/retry in ([\d.]+)s/i);
        if (match) {
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

  console.log('\n[Stage 1] Chunking files...');
  const allFiles = flattenTree(fileTree, repoRoot);

  const jsFiles = allFiles
    .filter(f => PARSEABLE_EXTENSIONS.has(path.extname(f)))
    .filter(f => {
      try { return fs.statSync(f).size < MAX_FILE_SIZE; }
      catch { return false; }
    })
    .sort((a, b) => {
      const ra = path.relative(repoRoot, a);
      const rb = path.relative(repoRoot, b);
      return priorityScore(ra) - priorityScore(rb);
    });

  console.log(`  Found ${jsFiles.length} JS/TS files`);

  const fileChunkGroups = jsFiles.map(filePath => {
    const chunks = chunkFile(filePath);
    return chunks.map(c => ({
      ...c,
      filePath: path.relative(repoRoot, c.filePath),
    }));
  }).filter(group => group.length > 0);

  console.log(`\n[Stage 2] Summarizing ${fileChunkGroups.length} files (concurrency: ${CONCURRENCY})...`);

  const summaryResults = await runInBatches(
    fileChunkGroups,
    CONCURRENCY,
    (chunks) => summarizeFile(chunks)
  );

  const fileSummaries = summaryResults.filter(Boolean);
  console.log(`  Got ${fileSummaries.length} file summaries`);

  console.log('\n[Stage 3] Grouping summaries by folder...');

  console.log('\n[Stage 4] Synthesizing architecture overview...');
  const architectureOverview = await synthesizeSummaries(fileSummaries, repoUrl);

  console.log('\n=== Pipeline complete ===\n');

  return { fileSummaries, architectureOverview };
}

module.exports = { runAnalysisPipeline };