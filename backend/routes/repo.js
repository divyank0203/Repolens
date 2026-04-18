const express = require('express');
const router = express.Router();
const { cloneRepo } = require('../services/cloneRepo');
const { scanDirectory } = require('../services/scanDirectory');
const { buildDependencyMap } = require('../services/buildDependencyMap');
const { parseFile } = require('../services/parseFile');
const { runAnalysisPipeline } = require('../services/runAnalysisPipeline');
const { detectEntryPoints } = require('../services/detectEntryPoints');

router.post('/', async (req, res) => {
  const { repoUrl } = req.body;

  
  if (!repoUrl || !repoUrl.startsWith('https://github.com')) {
    return res.status(400).json({
      error: 'A valid GitHub HTTPS URL is required.'
    });
  }

  try {
    
    const clonedPath = await cloneRepo(repoUrl);

    
    const fileTree = scanDirectory(clonedPath);

    return res.json({
      repoUrl,
      clonedPath,
      tree: fileTree,
    });

  } catch (err) {
    console.error('Error processing repo:', err.message);
    return res.status(500).json({ error: err.message });
  }
});


router.post('/analyze', async (req, res) => {
  const { repoUrl } = req.body;
  if (!repoUrl || !repoUrl.startsWith('https://github.com')) {
    return res.status(400).json({ error: 'A valid GitHub HTTPS URL is required.' });
  }
  try {
    const clonedPath      = await cloneRepo(repoUrl);
    const fileTree        = scanDirectory(clonedPath);
    const dependencyMap   = buildDependencyMap(clonedPath, fileTree);
    const entryPoints     = detectEntryPoints(clonedPath, dependencyMap); 

    return res.json({
      repoUrl,
      tree: fileTree,
      dependencyMap,
      entryPoints, // array of relative file paths
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

router.post('/summary', async (req, res) => {
  const { repoUrl } = req.body;

  if (!repoUrl || !repoUrl.startsWith('https://github.com')) {
    return res.status(400).json({ error: 'A valid GitHub HTTPS URL is required.' });
  }

  try {
    const clonedPath = await cloneRepo(repoUrl);
    const fileTree = scanDirectory(clonedPath);
    const result = await runAnalysisPipeline(clonedPath, fileTree, repoUrl);

    return res.json({
      repoUrl,
      fileSummaries: result.fileSummaries,
      architectureOverview: result.architectureOverview,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});



module.exports = router;