const { Octokit } = require("@octokit/rest");
const fetch = require("node-fetch"); // CJS

// GitHub token & Hugging Face API key
const githubToken = process.env.GITHUB_TOKEN;
const hfKey = process.env.HF_API_KEY;

const octokit = new Octokit({ auth: githubToken });
const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");
const prNumber = process.env.PR_NUMBER;

// Generate review using Hugging Face model
async function generateReview(diffText) {
  if (!diffText) return "No diff provided.";

  const response = await fetch(
    "https://api-inference.huggingface.co/models/bigcode/starcoder", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${hfKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: `Review this PR diff and suggest improvements:\n${diffText}`,
        options: { wait_for_model: true },
      }),
    }
  );

  const data = await response.json();

  // Hugging Face returns either array of outputs or object with generated_text
  if (Array.isArray(data) && data[0]?.generated_text) {
    return data[0].generated_text;
  } else if (data.generated_text) {
    return data.generated_text;
  } else if (data.error) {
    return `Error from model: ${data.error}`;
  }

  return "No review generated.";
}

async function run() {
  try {
    // Step 1: Post initial comment
    await octokit.issues.createComment({
      owner,
      repo,
      issue_number: prNumber,
      body: "👋 Thanks for the PR! The bot is reviewing your code...",
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
