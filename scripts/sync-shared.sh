#!/usr/bin/env bash
# Copies each file in shared/ into the skills that ship it. Skills are installed
# one at a time, so each needs its own copy; shared/ is the single source.
# Usage: scripts/sync-shared.sh          write the copies
#        scripts/sync-shared.sh --check  exit 1 if any copy differs
set -euo pipefail
cd "$(dirname "$0")/.."

copies="
code-quality.md     implement-feature init-auth init-backend init-database simplify-code review-changes
security.md         implement-feature plan-change verify-work review-changes
verification.md     implement-feature verify-work
architecture.md     implement-feature plan-change
operating-rules.md  hungry-jack plan-change verify-work simplify-code review-changes reflect
"

stale=0
while read -r file skills; do
  [ -n "$file" ] || continue
  for skill in $skills; do
    target="skills/$skill/references/$file"
    if cmp -s "shared/$file" "$target"; then continue; fi
    if [ "${1:-}" = "--check" ]; then
      echo "out of date: $target"
      stale=1
    else
      mkdir -p "$(dirname "$target")"
      cp "shared/$file" "$target"
      echo "updated: $target"
    fi
  done
done <<< "$copies"

exit "$stale"
