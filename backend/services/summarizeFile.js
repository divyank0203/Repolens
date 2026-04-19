const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `You are a senior software engineer analyzing a codebase.
Write concise, accurate summaries of individual source files.
Focus on what the code DOES. Be specific about function names, data shapes,
and side effects. Do not reproduce code. Respond in plain text only.`;

async function summarizeChunk(chunk) {
  const { filePath, chunkIndex, totalChunks, content } = chunk;

  const chunkLabel = totalChunks > 1
    ? ` (part ${chunkIndex + 1} of ${totalChunks})`
    : '';

  const response = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    max_tokens: 512,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `File: ${filePath}${chunkLabel}

\`\`\`
${content}
\`\`\`

Summarize this file in 3-5 sentences covering:
1. Its primary purpose
2. The key functions or classes it exports
3. What external modules or files it depends on
4. Any side effects (writes to disk, makes network calls, mutates global state)`
      }
    ]
  });

  return {
    filePath,
    chunkIndex,
    summary: response.choices[0].message.content,
  };
}

async function summarizeFile(chunks) {
  if (chunks.length === 0) return null;

  if (chunks.length === 1) {
    return summarizeChunk(chunks[0]);
  }

  const partSummaries = await Promise.all(chunks.map(summarizeChunk));

  const mergeResponse = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    max_tokens: 512,
    messages: [
      {
        role: 'system',
        content: 'Combine partial summaries of the same file into one coherent summary. Plain text only.'
      },
      {
        role: 'user',
        content: `These are summaries of different parts of "${chunks[0].filePath}":

${partSummaries.map((p, i) => `Part ${i + 1}:\n${p.summary}`).join('\n\n')}

Write a single unified summary in 3-5 sentences.`
      }
    ]
  });

  return {
    filePath: chunks[0].filePath,
    chunkIndex: 0,
    summary: mergeResponse.choices[0].message.content,
  };
}

module.exports = { summarizeFile };