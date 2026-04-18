const fs = require('fs');
const parser = require('@babel/parser');
const path = require('path');


function parseFile(filePath) {
  let code;
  try {
    code = fs.readFileSync(filePath, 'utf-8');
  } catch {
    return []; // unreadable file — skip it
  }

  let ast;
  try {
    ast = parser.parse(code, {

      sourceType: 'module',

      plugins: [
        'jsx',          // support React JSX syntax
        'typescript',   // support TypeScript type annotations
        'decorators-legacy', // support @decorators
        'classProperties',
      ],
    });
  } catch (e) {
   
    console.warn(`Could not parse ${filePath}: ${e.message}`);
    return [];
  }

  const imports = [];


  for (const node of ast.program.body) {

 
    if (node.type === 'ImportDeclaration') {
      imports.push(node.source.value);
     
    }

   
    if (
      node.type === 'ExportNamedDeclaration' ||
      node.type === 'ExportAllDeclaration'
    ) {
      if (node.source) {
        
        imports.push(node.source.value);
      }
    }

   
    collectDynamicImports(node, imports);
  }

  return imports;
}


function collectDynamicImports(node, imports) {
  if (!node || typeof node !== 'object') return;

  //  Handle dynamic import()
  if (
    node.type === 'CallExpression' &&
    node.callee.type === 'Import' &&
    node.arguments.length > 0 &&
    node.arguments[0].type === 'StringLiteral'
  ) {
    imports.push(node.arguments[0].value);
  }

  // Handle require()
  if (
    node.type === 'CallExpression' &&
    node.callee.type === 'Identifier' &&
    node.callee.name === 'require' &&
    node.arguments.length === 1 &&
    node.arguments[0].type === 'StringLiteral'
  ) {
    imports.push(node.arguments[0].value);
  }

  // Continue traversal
  for (const key of Object.keys(node)) {
    const child = node[key];

    if (Array.isArray(child)) {
      child.forEach(c => collectDynamicImports(c, imports));
    } else if (child && typeof child === 'object' && child.type) {
      collectDynamicImports(child, imports);
    }
  }
}

module.exports = { parseFile };