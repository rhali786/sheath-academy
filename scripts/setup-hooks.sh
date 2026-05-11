#!/bin/sh
# Run once after cloning: npm run setup-hooks
cp scripts/hooks/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
cp scripts/hooks/commit-msg .git/hooks/commit-msg
chmod +x .git/hooks/commit-msg
echo "git hooks installed (pre-commit, commit-msg)"
