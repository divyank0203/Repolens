const express = require('express');
const cors = require('cors');
const repoRoute = require('./routes/repo');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());


app.use('/api/repo', repoRoute);

app.listen(PORT, () => {
  console.log(`RepoLens backend running on http://localhost:${PORT}`);
});