const Groq = require('groq-sdk');
const path = require('path');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

function groupByFolder(fileSummaries) {
  const groups = {};
  for (const { filePath, summary } of fileSummaries) {
    const folder = path.dirname(filePath) || '.';
    if (!groups[folder]) groups[folder] = [];
    groups[folder].push(`${path.basename(filePath)}: ${summary}`);
  }
  return groups;
}

function formatGroupsForPrompt(groups) {
  return Object.entries(groups)
    .map(([folder, summaries]) =>
      `### ${folder}/\n${summaries.map(s => `- ${s}`).join('\n')}`
    )
    .join('\n\n');
}

async function synthesizeSummaries(fileSummaries, repoUrl) {
  const groups = groupByFolder(fileSummaries);
  const formattedGroups = formatGroupsForPrompt(groups);

  const response = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    max_tokens: 1024,
    messages: [
      {
        role: 'system',
        content: `You are a senior software architect reviewing a codebase for the first time.
Given per-file summaries organized by folder, produce a high-level architectural overview.
Write for an engineer who needs to understand the system quickly before making changes.
Use plain text with minimal markdown. Be specific — name actual files, functions, and data flows.`
      },
      {
        role: 'user',
        content: `Repository: ${repoUrl}

Per-file summaries grouped by folder:

${formattedGroups}

Write an architectural overview covering:
1. What this codebase does overall (1-2 sentences)
2. The main layers or modules and their responsibilities
3. The key data flows (how a request/event moves through the system)
4. Any notable patterns or design decisions visible from the structure
5. Entry points (where execution starts)`
      }
    ]
  });

  return response.choices[0].message.content;
}

module.exports = { synthesizeSummaries };