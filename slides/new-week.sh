#!/bin/bash
# Creates a new weekly slide deck from the template.
# Usage: bash slides/new-week.sh

YEAR=$(date +%Y)
WEEK=$(date +%V)
FILENAME="slides/${YEAR}-W${WEEK}.md"

if [ -f "$FILENAME" ]; then
  echo "Already exists: $FILENAME"
  exit 0
fi

cp slides/template.md "$FILENAME"
echo "Created: $FILENAME"
echo "Render: npx @marp-team/marp-cli $FILENAME --preview"
