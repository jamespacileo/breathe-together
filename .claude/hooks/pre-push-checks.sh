#!/bin/bash

# Claude Code pre-push hook
# Runs lint and type checks before allowing git push

# Read the tool input from stdin
input=$(cat)

# Extract the command being run
command=$(echo "$input" | jq -r '.tool_input.command // ""')

# Only intercept git push commands
if ! echo "$command" | grep -qE "^git push"; then
  exit 0
fi

echo "Running pre-push checks..."

# Change to project directory
cd "$CLAUDE_PROJECT_DIR" || exit 1

# Run biome lint
echo "Running lint check..."
npm run lint
lint_status=$?

if [ $lint_status -ne 0 ]; then
  echo "Lint check failed. Please fix lint errors before pushing." >&2
  exit 2
fi

echo "Lint check passed"

# Run type check
echo "Running type check..."
npx tsc --noEmit
type_status=$?

if [ $type_status -ne 0 ]; then
  echo "Type check failed. Please fix type errors before pushing." >&2
  exit 2
fi

echo "Type check passed"

echo "All pre-push checks passed!"
exit 0
