const simpleGit = require('simple-git');
const path = require('path');
const fs = require('fs');


const CLONE_BASE = path.join('/tmp', 'repolens');

async function cloneRepo(repoUrl) {
 
  const repoName = repoUrl.split('/').pop().replace('.git', '');
  const clonePath = path.join(CLONE_BASE, repoName);

  
  if (fs.existsSync(clonePath)) {
    console.log(`Repo already cloned at ${clonePath}, reusing.`);
    return clonePath;
  }

  
  fs.mkdirSync(CLONE_BASE, { recursive: true });

  console.log(`Cloning ${repoUrl} into ${clonePath}...`);

  
  const git = simpleGit();
  await git.clone(repoUrl, clonePath, ['--depth=1']);


  return clonePath;
}

module.exports = { cloneRepo };