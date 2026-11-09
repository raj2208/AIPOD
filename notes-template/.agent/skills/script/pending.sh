#!/usr/bin/env bash
# Lists which notes need a script.
#
#   new    the note has no script yet
#   stale  the note changed after its script was written
#   ok     the script is up to date
#
# Output, tab separated: status, note path, script path, current note hash.
# Only needs git (for `git hash-object`), not a git repository.
set -euo pipefail

cd "$(dirname "$0")/../../.."

find notes -type f -name '*.md' ! -name 'README.md' | sort | while read -r note; do
  hash=$(git hash-object "$note")

  # The script whose header says `source: <this note>`.
  script=$(grep -rlE "^source:[[:space:]]*${note}[[:space:]]*$" scripts --include='*.script.md' 2>/dev/null | head -n 1 || true)

  if [ -z "$script" ]; then
    expected="scripts/${note#notes/}"
    printf 'new\t%s\t%s\t%s\n' "$note" "${expected%.md}.script.md" "$hash"
    continue
  fi

  written_for=$(sed -n 's/^source_hash:[[:space:]]*//p' "$script" | head -n 1 | tr -d '[:space:]')
  if [ "$written_for" = "$hash" ]; then
    printf 'ok\t%s\t%s\t%s\n' "$note" "$script" "$hash"
  else
    printf 'stale\t%s\t%s\t%s\n' "$note" "$script" "$hash"
  fi
done
