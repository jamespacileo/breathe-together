#!/bin/bash

# Claude Code pre-commit/pre-push hook
# Runs lint and type checks before allowing git commit or git push

# Read the tool input from stdin
input=$(cat)

# Extract the command being run
command=$(echo "$input" | jq -r '.tool_input.command // ""')

# Only intercept git commit and git push commands
if ! echo "$command" | grep -qE "^git (commit|push)"; then
  exit 0
fi

# Determine which operation
if echo "$command" | grep -qE "^git commit"; then
  operation="commit"
else
  operation="push"
fi

echo "==> Running pre-$operation checks..."

# Change to project directory
cd "$CLAUDE_PROJECT_DIR" || exit 1

# Run biome lint
echo "==> Checking lint (biome)..."
npm run lint 2>&1
lint_status=$?

if [ $lint_status -ne 0 ]; then
  echo "==> Lint check FAILED. Please fix lint errors before ${operation}ing." >&2
  exit 2
fi

echo "==> Lint check passed"

# Run type check
echo "==> Checking types (tsc)..."
npx tsc --noEmit 2>&1
type_status=$?

if [ $type_status -ne 0 ]; then
  echo "==> Type check FAILED. Please fix type errors before ${operation}ing." >&2
  exit 2
fi

echo "==> Type check passed"

echo "==> All pre-$operation checks passed!"
exit 0
