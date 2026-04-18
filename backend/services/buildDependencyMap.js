const path = require('path');
const { scanDirectory } = require('./scanDirectory');
const { parseFile } = require('./parseFile');
const fs = require('fs');

// File extensions 
const PARSEABLE_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs']);


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


function resolveImport(importPath, importerFile, repoRoot) {
  
  if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
    return null;
  }

  const importerDir = path.dirname(importerFile);
  let resolved = path.resolve(importerDir, importPath);

  
  const extensions = ['.js', '.jsx', '.ts', '.tsx', '/index.js', '/index.ts'];

  if (fs.existsSync(resolved) && fs.statSync(resolved).isFile()) {
    return resolved;
  }

  for (const ext of extensions) {
    const candidate = resolved + ext;
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null; 
}


function buildDependencyMap(repoRoot, fileTree) {
  const allFiles = flattenTree(fileTree, repoRoot);
  const jsFiles = allFiles.filter(f => PARSEABLE_EXTENSIONS.has(path.extname(f)));

  const dependencyMap = {};

  for (const file of jsFiles) {
    
    const relativeKey = path.relative(repoRoot, file);

    const rawImports = parseFile(file);
    const resolvedDeps = [];

    for (const imp of rawImports) {
      const resolved = resolveImport(imp, file, repoRoot);
      if (resolved) {
        
        resolvedDeps.push(path.relative(repoRoot, resolved));
      }
    }

    dependencyMap[relativeKey] = resolvedDeps;
  }

  return dependencyMap;
}

module.exports = { buildDependencyMap };