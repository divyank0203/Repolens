const path = require('path');
const fs   = require('fs');

// Common entry point filenames across different project types
const ENTRY_FILENAMES = new Set([
  'index.js',   'index.ts',   'index.jsx',  'index.tsx',
  'main.js',    'main.ts',    'main.jsx',   'main.tsx',
  'app.js',     'app.ts',     'app.jsx',    'app.tsx',
  'server.js',  'server.ts',
  'client.js',  'client.ts',
  'entry.js',   'entry.ts',
]);

// Patterns in package.json that point to entry files
const PACKAGE_JSON_FIELDS = ['main', 'module', 'browser'];


function detectEntryPoints(repoRoot, dependencyMap) {
  const entryPoints = new Set();

  // ── Strategy 1: package.json fields ───────────────────────────────────
  const pkgPath = path.join(repoRoot, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      for (const field of PACKAGE_JSON_FIELDS) {
        if (pkg[field] && typeof pkg[field] === 'string') {
          // normalize to forward slashes and strip leading ./
          const normalized = pkg[field].replace(/\\/g, '/').replace(/^\.\//, '');
          // check if this file exists in our dependency map
          const match = Object.keys(dependencyMap).find(f =>
            f.replace(/\\/g, '/') === normalized
          );
          if (match) entryPoints.add(match);
        }
      }
    } catch {
      // malformed package.json — skip
    }
  }

  // ── Strategy 2: common entry filenames ────────────────────────────────
  // Only look at root-level and one level deep (src/, app/, lib/)
  // Avoids false positives from deeply nested index.js files
  for (const filePath of Object.keys(dependencyMap)) {
    const normalized = filePath.replace(/\\/g, '/');
    const parts      = normalized.split('/');
    const filename   = parts[parts.length - 1].toLowerCase();
    const depth      = parts.length;

    if (ENTRY_FILENAMES.has(filename) && depth <= 2) {
      entryPoints.add(filePath);
    }
  }

  // ── Strategy 3: structural heuristic ──────────────────────────────────
  // Build in-degree (how many files import this) for every file
  const inDegree = {};
  for (const [source, deps] of Object.entries(dependencyMap)) {
    for (const target of deps) {
      inDegree[target] = (inDegree[target] || 0) + 1;
    }
  }

  // A file is a structural entry point if:
  // - Nobody imports it (in-degree = 0)  AND
  // - It imports at least 2 other files (out-degree >= 2)
  // This catches entry files that aren't named conventionally
  for (const [filePath, deps] of Object.entries(dependencyMap)) {
    const fileInDegree  = inDegree[filePath] || 0;
    const fileOutDegree = deps.length;

    if (fileInDegree === 0 && fileOutDegree >= 2) {
      entryPoints.add(filePath);
    }
  }

  return Array.from(entryPoints);
}

module.exports = { detectEntryPoints };