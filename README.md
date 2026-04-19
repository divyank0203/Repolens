# Repolens
Visualize and understand any GitHub codebase in minutes.
RepoLens clones a GitHub repository, maps its dependency graph, and uses AI to explain what every file does — so you can understand an unfamiliar codebase before making your first change.

Demo

Analyze any public GitHub repo by pasting its URL. The dependency graph loads in seconds. AI summaries load in the background.

![alt text](image.png)

Features

Dependency graph — visualizes how files import each other using a clean hierarchical layout
Click to explore — click any node to highlight its imports and dependents
Entry point detection — automatically identifies where execution starts (index.js, main.ts, server.js, structural heuristics)
AI file summaries — every JS/TS file gets a 3-5 sentence summary powered by Google Gemini
Architecture overview — a single high-level explanation of how the whole codebase is structured
Search and filter — search by filename, filter by folder, or isolate highly-connected files
Layout toggle — switch between top-down and left-right graph layouts


Tech stack
LayerTechnologyFrontendReact, Vite, React Flow, Tailwind (inline styles)Graph layoutDagreBackendNode.js, ExpressRepo cloningsimple-gitAST parsing@babel/parserAI pipelineGoogle Gemini API (gemini-2.5-flash-lite)

How it works
GitHub URL
    ↓
Clone repo locally (simple-git, --depth=1)
    ↓
Scan file tree (ignore node_modules, .git, dist)
    ↓
Parse every JS/TS file with @babel/parser → extract imports
    ↓
Build dependency map  {fileA: [fileB, fileC], ...}
    ↓
Detect entry points (package.json + filename + structural heuristics)
    ↓
React Flow + Dagre → render interactive dependency graph
    ↓
AI pipeline (background):
  chunk files → summarize each → synthesize architecture overview
    ↓
Side panel shows per-file summaries + architecture overview

Getting started
Prerequisites

Node.js 18+
Git installed on your system
A free Google Gemini API key from aistudio.google.com

1. Clone the repo
bashgit clone https://github.com/yourusername/repolens.git
cd repolens
2. Backend setup
bashcd backend
npm install
Create backend/.env:
GEMINI_API_KEY=your_key_here
Start the backend:
bashnode index.js
Backend runs on http://localhost:3001
3. Frontend setup
bashcd frontend
npm install
npm run dev
Frontend runs on http://localhost:5173
4. Analyze a repo
Open http://localhost:5173, paste any public GitHub URL, and click Analyze.
The dependency graph loads in 10-30 seconds (cloning time). AI summaries load in the background over 1-3 minutes depending on repo size.

Project structure
repolens/
├── backend/
│   ├── index.js                      # Express entry point
│   ├── routes/
│   │   └── repo.js                   # API routes
│   └── services/
│       ├── cloneRepo.js              # Clones GitHub repos
│       ├── scanDirectory.js          # Recursive file tree extraction
│       ├── parseFile.js              # AST-based import extraction
│       ├── buildDependencyMap.js     # Builds the dependency map
│       ├── detectEntryPoints.js      # Entry point heuristics
│       ├── chunkFile.js              # Splits large files for AI
│       ├── summarizeFile.js          # Per-file AI summarization
│       ├── synthesizeSummaries.js    # Final architecture synthesis
│       └── runAnalysisPipeline.js    # Pipeline orchestrator
├── frontend/
│   └── src/
│       ├── App.jsx                   # Root component
│       └── components/
│           ├── RepoInput.jsx         # URL input
│           ├── DependencyGraph.jsx   # React Flow canvas
│           ├── SummaryPanel.jsx      # Side panel with tabs
│           ├── SearchFilter.jsx      # Search and filter controls
│           └── transformToGraph.js   # Dependency map → React Flow nodes

API endpoints
MethodEndpointDescriptionPOST/api/repoClone repo and return file treePOST/api/repo/analyzeFile tree + dependency map + entry pointsPOST/api/repo/summaryAI summaries + architecture overview
All endpoints accept { repoUrl: "https://github.com/user/repo" }.

Limitations

Public GitHub repos only (no authentication)
JS and TypeScript files only (.js, .jsx, .ts, .tsx)
AI summaries use Gemini free tier — rate limited to ~20 files per minute
Large repos (200+ files) may hit daily API quota limits
![alt text](image.png)