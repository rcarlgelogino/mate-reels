#!/usr/bin/env bash
# Prints the real reels that are built but not posted yet, oldest first, one "TAG/file.mp4" per line.
# Looks at "reels-YYYY-MM-DD-N" releases from the last 3 days; test videos are ignored. Needs GH_TOKEN.
set -euo pipefail
POSTED="${1:-posted/posted.txt}"; touch "$POSTED"
SINCE=$(date -u -d '3 days ago' +%F)
gh release list --limit 40 --json tagName,createdAt --jq 'sort_by(.createdAt) | .[].tagName' | grep '^reels-' | while read -r TAG; do
  D=$(echo "$TAG" | cut -c7-16)
  [[ "$D" < "$SINCE" ]] && continue
  for A in $(gh release view "$TAG" --json assets --jq '.assets[].name' | grep '\.mp4$' | grep -v 'test_reel' | sort); do
    grep -qx "$TAG/$A" "$POSTED" || echo "$TAG/$A"
  done
done
