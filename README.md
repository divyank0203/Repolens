# RepoLens

> Visualize and understand any GitHub codebase in minutes.

RepoLens clones a public GitHub repository, maps its dependency graph, and uses AI to explain what every file does — so you can understand an unfamiliar codebase before making your first change.

---

## Demo

![alt text](image.png)


## Features

- **Dependency graph** — visualizes how files import each other using a clean hierarchical layout powered by Dagre
- **Click to explore** — click any node to highlight its direct imports and dependents instantly
- **Entry point detection** — automatically identifies where execution starts using `package.json`, common filenames (`index.js`, `main.ts`, `server.js`), and structural heuristics
- **AI file summaries** — every JS/TS file gets a concise summary powered by Google Gemini
- **Architecture overview** — a single high-level explanation of how the entire codebase is structured
- **Search and filter** — search by filename, filter by folder, or isolate highly-connected hub files
- **Layout toggle** — switch between top-down and left-right graph layouts

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, React Flow |
| Graph layout | Dagre |
| Backend | Node.js, Express |
| Repo cloning | simple-git |
| AST parsing | @babel/parser |
| AI pipeline | Google Gemini API (gemini-2.5-flash-lite) |

---

## How It Works

```
GitHub URL
    ↓
Clone repo locally (simple-git, shallow clone)
    ↓
Scan file tree — ignore node_modules, .git, dist, build
    ↓
Parse every JS/TS file with @babel/parser → extract all imports
    ↓
Build dependency map  { "fileA.js": ["fileB.js", "fileC.js"] }
    ↓
Detect entry points (package.json + filename heuristics + graph structure)
    ↓
React Flow + Dagre → render interactive dependency graph
    ↓
AI pipeline runs in background:
  chunk large files → summarize each file → synthesize architecture overview
    ↓
Side panel shows per-file summaries + architecture overview on demand
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Git installed on your system
- A free Google Gemini API key — get one at [aistudio.google.com](https://aistudio.google.com)

### 1. Clone the repo

```bash
git clone https://github.com/yourusername/repolens.git
cd repolens
```

### 2. Backend setup

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend/` folder:

```
GEMINI_API_KEY=your_key_here
```

Start the backend:

```bash
node index.js
```

Backend runs on `http://localhost:3001`

### 3. Frontend setup

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`

### 4. Analyze a repo

Open `http://localhost:5173`, paste any public GitHub URL, and click **Analyze**.

The dependency graph loads in 10–30 seconds. AI summaries load in the background.

---

## Project Structure

```
repolens/
├── backend/
│   ├── index.js                      # Express entry point
│   ├── .env                          # API keys (not committed)
│   ├── routes/
│   │   └── repo.js                   # All API route handlers
│   └── services/
│       ├── cloneRepo.js              # Clones GitHub repos via simple-git
│       ├── scanDirectory.js          # Recursive file tree extraction
│       ├── parseFile.js              # AST-based import extraction
│       ├── buildDependencyMap.js     # Assembles the full dependency map
│       ├── detectEntryPoints.js      # Entry point detection heuristics
│       ├── chunkFile.js              # Splits large files for AI context limits
│       ├── summarizeFile.js          # Per-file Gemini summarization
│       ├── synthesizeSummaries.js    # Final architecture synthesis call
│       └── runAnalysisPipeline.js    # Orchestrates the full AI pipeline
└── frontend/
    └── src/
        ├── App.jsx                   # Root — owns all state and data fetching
        └── components/
            ├── RepoInput.jsx         # URL input bar
            ├── DependencyGraph.jsx   # React Flow canvas + interaction logic
            ├── SummaryPanel.jsx      # Sliding side panel with tabs
            ├── SearchFilter.jsx      # Search, folder filter, connectivity filter
            └── transformToGraph.js   # Converts dependency map → React Flow nodes/edges
```

---

## API Reference

All endpoints accept `POST` with body `{ "repoUrl": "https://github.com/user/repo" }`.

| Endpoint | Description | Response |
|---|---|---|
| `POST /api/repo` | Clone and return file tree | `{ tree }` |
| `POST /api/repo/analyze` | Dependency map + entry points | `{ tree, dependencyMap, entryPoints }` |
| `POST /api/repo/summary` | Full AI pipeline | `{ fileSummaries, architectureOverview }` |

---

## AI Pipeline Design

The AI pipeline uses **prompt chaining** — a sequence of smaller LLM calls where the output of one becomes the input of the next, rather than sending the entire codebase in a single prompt.

```
Stage 1  Read and chunk files (max 300 lines per chunk)
Stage 2  Summarize each file individually (parallel, batched at 3 concurrent)
Stage 3  Group file summaries by folder
Stage 4  Single synthesis call → architecture overview
```

This approach stays well within token limits and keeps each call focused, which produces better summaries than a single large prompt would.

---

## Limitations

- Public GitHub repos only (no auth support)
- JS and TypeScript files only (`.js`, `.jsx`, `.ts`, `.tsx`, `.mjs`)
- Gemini free tier is rate limited — large repos may take 2–3 minutes
- Repos with 200+ JS files may hit daily quota limits on the free tier

---


