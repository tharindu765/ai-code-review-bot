const { Octokit } = require("@octokit/rest");
//const OpenAI = require("openai"); // make sure to npm install openai
const fetch = require("node-fetch"); // or use require('node-fetch') for CJS

// GitHub & OpenAI tokens
const githubToken = process.env.GITHUB_TOKEN;
//const openaiKey = process.env.OPENAI_API_KEY;

const octokit = new Octokit({ auth: githubToken });
//const openai = new OpenAI({ apiKey: openaiKey });

// GitHub repo & PR info
const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");
const prNumber = process.env.PR_NUMBER;

const hfKey = process.env.HF_API_KEY;

// Example: Using the "text-generation" pipeline (like GPT)
async function generateReview(diffText) {
  const response = await fetch("https://api-inference.huggingface.co/models/bigcode/starcoder", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${hfKey}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    inputs: `Review this PR diff and suggest improvements:\n${diff}`,
    options: { wait_for_model: true }
  })
});

  const result = await response.json();
  return result[0]?.generated_text || "No review generated.";
}

async function run() {
  // Step 1: Post initial comment
  await octokit.issues.createComment({
    owner,
    repo,
    issue_number: prNumber,
    body: "👋 Thanks for the PR! The bot is reviewing your code..."
  });

  // Step 2: Fetch changed files and diffs
  const { data: files } = await octokit.pulls.listFiles({
    owner,
    repo,
    pull_number: prNumber
  });

  const diff = files.map(f => f.patch).filter(Boolean).join("\n");
  if (!diff) {
    console.log("No diff to review.");
    return;
  }
  
  const reviewText = await generateReview(diff);
  console.log("AI Review:\n", reviewText);
  /*const diff = files
  .map(f => f.patch)
  .filter(Boolean)
  .map(d => d.split("\n").slice(0, 50).join("\n")) // first 50 lines only
  .join("\n");
    if (!diff) {
    console.log("No diff to review.");
    return;
  }*/


  // Step 3: Send diff to OpenAI GPT for review
  /*const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      { role: "system", content: "You are a senior developer reviewing pull requests." },
      { role: "user", content: `Please review this PR diff and suggest improvements:\n${diff}` }
    ]
  });

  const aiComment = response.choices[0].message.content;
  */

  // Step 4: Post AI review comment on PR
  await octokit.issues.createComment({
    owner,
    repo,
    issue_number: prNumber,
    body: `🤖 AI Review:\n\n${reviewText}`
  });

  console.log("AI review posted!");
}

run().catch(err => {
  console.error("Error running bot:", err);
  process.exit(1);
});
