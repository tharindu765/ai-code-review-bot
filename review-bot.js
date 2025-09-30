const { Octokit } = require("@octokit/rest");
const fetch = require("node-fetch"); // CJS

// GitHub token & DeepSeek API key
const githubToken = process.env.GITHUB_TOKEN;
const deepseekKey = process.env.DEEPSEEK_API_KEY;

const octokit = new Octokit({ auth: githubToken });
const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");
const prNumber = process.env.PR_NUMBER;

// Generate review using DeepSeek
async function generateReview(diffText) {
  if (!diffText) return "No diff provided.";

  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${deepseekKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "deepseek-coder", // best for code
      messages: [
        { role: "system", content: "You are a senior code reviewer. Be concise and helpful." },
        { role: "user", content: `Review this PR diff and suggest improvements:\n${diffText}` }
      ]
    }),
  });

  const data = await response.json();

  if (data.error) {
    return `Error from DeepSeek: ${data.error.message}`;
  }

  return data.choices?.[0]?.message?.content || "No review generated.";
}

async function run() {
  try {
    // Step 1: Post initial comment
    await octokit.issues.createComment({
      owner,
      repo,
      issue_number: prNumber,
      body: "👋 Thanks for the PR! The AI bot is reviewing your code...",
    });

    // Step 2: Fetch changed files and diffs
    const { data: files } = await octokit.pulls.listFiles({
      owner,
      repo,
      pull_number: prNumber,
    });

    const diff = files
      .map((f) => f.patch)
      .filter(Boolean)
      .join("\n");

    if (!diff) {
      console.log("No diff to review.");
      return;
    }

    // Step 3: Generate AI review
    const reviewText = await generateReview(diff);
    console.log("AI Review:\n", reviewText);

    // Step 4: Post AI review comment on PR
    await octokit.issues.createComment({
      owner,
      repo,
      issue_number: prNumber,
      body: `🤖 AI Review:\n\n${reviewText}`,
    });

    console.log("AI review posted!");
  } catch (err) {
    console.error("Error running bot:", err);
    process.exit(1);
  }
}

run();
