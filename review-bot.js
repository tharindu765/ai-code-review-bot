// review-bot.js
import { Octokit } from "@octokit/rest";

const token = process.env.GITHUB_TOKEN; // GitHub provides this in Actions
const octokit = new Octokit({ auth: token });

// These will be passed from GitHub Actions
const [owner, repo, pull_number] = process.env.GITHUB_REPOSITORY.split("/");
const prNumber = process.env.PR_NUMBER;

async function run() {
  await octokit.issues.createComment({
    owner,
    repo,
    issue_number: prNumber,
    body: "👋 Thanks for the PR! The bot is reviewing your code..."
  });
}

run();
