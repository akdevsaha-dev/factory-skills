#!/usr/bin/env bash
# Runs the eval cases in evals/ against the skills in skills/, loaded as a temporary plugin.
# Extra arguments go to `claude plugin eval`, for example: scripts/eval.sh --case 'hungry-jack-*'
set -euo pipefail
repo=$(cd "$(dirname "$0")/.." && pwd)
plugin=$(mktemp -d)
trap 'rm -rf "$plugin"' EXIT

mkdir "$plugin/.claude-plugin"
echo '{ "name": "factory-skills" }' > "$plugin/.claude-plugin/plugin.json"
cp -R "$repo/skills" "$plugin/skills"
rsync -a --exclude results "$repo/evals/" "$plugin/evals/"

claude plugin eval "$plugin" --trust-plugin --scaffold --allow-tools Bash Write Edit \
  --runs 1 --ablation none --output-dir "$repo/evals/results" "$@"
