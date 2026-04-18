const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialise once at module load — not inside each function call.
// Creating the client is cheap but there's no reason to repeat it.
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// gemini-2.5-flash is the best free option right now:
// better reasoning than flash-lite, 250 req/day free quota
const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',

  // systemInstruction is Gemini's equivalent of Anthropic's system prompt.
  // It goes here on the model config, not inside the message array.
  systemInstruction: `You are a senior software engineer analyzing a codebase.
Your job is to write concise, accurate summaries of individual source files.
Focus on what the code DOES, not how it looks. Be specific about function names,
data shapes, and side effects. Do not reproduce code. Respond in plain text only.`,
});

/**
 * Sends a single file chunk to Gemini and returns a plain-text summary.
 * Signature is identical to the Anthropic version — nothing in
 * runAnalysisPipeline.js needs to change.
 */
async function summarizeChunk(chunk) {
  const { filePath, chunkIndex, totalChunks, content } = chunk;

  const chunkLabel = totalChunks > 1
    ? ` (part ${chunkIndex + 1} of ${totalChunks})`
    : '';

  const prompt = `File: ${filePath}${chunkLabel}

\`\`\`
${content}
\`\`\`

Summarize this file in 3-5 sentences covering:
1. Its primary purpose
2. The key functions or classes it exports
3. What external modules or files it depends on
4. Any side effects (writes to disk, makes network calls, mutates global state)`;

  // Gemini's API uses generateContent() instead of messages.create()
  // The response shape is different — text lives at:
  // result.response.text()  (a method, not a property)
  const result = await model.generateContent(prompt);
  const summary = result.response.text();

  return { filePath, chunkIndex, summary };
}

/**
 * Summarizes all chunks for a single file.
 * Multi-chunk files get a merge call, same strategy as before.
 */
async function summarizeFile(chunks) {
  if (chunks.length === 0) return null;

  if (chunks.length === 1) {
    return summarizeChunk(chunks[0]);
  }

  // Summarize each part in parallel
  const partSummaries = await Promise.all(chunks.map(summarizeChunk));

  // Merge into one coherent summary
  const mergePrompt = `These are summaries of different parts of the file "${chunks[0].filePath}":

${partSummaries.map((p, i) => `Part ${i + 1}:\n${p.summary}`).join('\n\n')}

Write a single unified summary of the complete file in 3-5 sentences.`;

  // For the merge call we use a plain model without the code-analyst
  // system instruction — we're summarizing summaries, not code
  const mergeModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const mergeResult = await mergeModel.generateContent(mergePrompt);

  return {
    filePath: chunks[0].filePath,
    chunkIndex: 0,
    summary: mergeResult.response.text(),
  };
}

module.exports = { summarizeFile };