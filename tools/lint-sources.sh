#!/bin/sh
# Refuses literal control characters in tracked source. Twice now a Write has put a raw
# 0x00 or 0x01 into a .ts file: the code worked, but `file` reported the source as binary
# and grep skipped it silently, so a repo-wide rename missed the file entirely.
set -e
found=0
for f in $(git ls-files '*.ts' '*.tsx' '*.css' '*.json' '*.md' '*.yaml' '*.yml'); do
  if ! LC_ALL=C perl -ne 'exit 1 if /[\x00-\x08\x0b\x0c\x0e-\x1f]/' "$f"; then
    echo "control character in $f"
    found=1
  fi
done
[ "$found" -eq 0 ] || { echo "Write these as escapes (\\u0001) instead."; exit 1; }
