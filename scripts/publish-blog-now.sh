#!/bin/zsh
# Punctual blog publish, driven from this Mac.
#
# Lives in Application Support, NOT the repo on the Desktop: launchd agents are
# blocked by TCC from reading Desktop files (stat succeeds, open fails), so a
# copy in the repo would simply never run. For the same reason this reads the
# due-post state from GitHub rather than the local checkout — no Desktop access
# anywhere in the path.
#
# Why it exists: GitHub's scheduler fires the 04:23 UTC cron around 10:30, so
# posts land at lunchtime. Vercel's scheduler can't do it either, because that
# project's GITHUB_WORKFLOW_TOKEN returns 401 and CRON_SECRET was never set.
#
# Safe any day, any number of times: the workflow publishes only drafts whose
# scheduledFor is due and still draft:true, and enforces Mon/Wed/Fri itself.
set -u
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"
REPO="Fiker-dev/lulidigital"
say() { echo "$(date -u '+%Y-%m-%dT%H:%M:%SZ') [publish-blog] $*"; }

command -v gh >/dev/null || { say "gh not found on PATH"; exit 1; }
gh auth status >/dev/null 2>&1 || { say "gh not authenticated (keychain unreadable from launchd?)"; exit 1; }

TODAY=$(date -u +%F)

# Ask GitHub, not the disk. Returns the number of drafts already due.
DUE=$(gh api "repos/$REPO/contents/src/content/blog" --jq '.[].name' 2>/dev/null \
  | while read -r f; do
      case "$f" in *.md) ;; *) continue ;; esac
      body=$(gh api "repos/$REPO/contents/src/content/blog/$f" -H "Accept: application/vnd.github.raw" 2>/dev/null | head -20)
      echo "$body" | grep -qE '^draft:[[:space:]]*true[[:space:]]*$' || continue
      s=$(echo "$body" | sed -n 's/^scheduledFor:[[:space:]]*"\{0,1\}\([0-9-]\{10\}\).*/\1/p' | head -1)
      [ -n "$s" ] && [ "$s" '<' "$TODAY" -o "$s" = "$TODAY" ] && echo "$f"
    done | wc -l | tr -d ' ')

if [ "${DUE:-0}" -eq 0 ]; then
  say "nothing due today — not dispatching."
  exit 0
fi

say "$DUE post(s) due — dispatching publish-scheduled.yml"
gh workflow run publish-scheduled.yml -R "$REPO" && say "dispatched." || { say "dispatch FAILED"; exit 1; }
