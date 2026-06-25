#!/usr/bin/env bash
# Require CI to pass before anything merges to main.
#
# Needs the GitHub CLI authenticated as a repo admin:  gh auth login
# Run after CI has executed at least once (so the check names exist).
#
#   ./scripts/setup-branch-protection.sh
#
# Override the repo with REPO=owner/name ./scripts/setup-branch-protection.sh
set -euo pipefail

REPO="${REPO:-agusty30/helios_nano}"
BRANCH="${BRANCH:-main}"

echo "Applying branch protection to ${REPO}@${BRANCH}…"

gh api -X PUT "repos/${REPO}/branches/${BRANCH}/protection" \
  --input - <<'JSON'
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["Typecheck", "Docker build"]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "dismiss_stale_reviews": true
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
JSON

echo "Done. PRs to ${BRANCH} now require Typecheck + Docker build to pass."
