#!/bin/sh
# Run once after cloning: npm run setup-hooks
# Installs the pre-commit hook that auto-increments the patch version on every commit.
HOOK=.git/hooks/pre-commit
cat > "$HOOK" <<'EOF'
#!/bin/sh
node scripts/bump-version.cjs
git add package.json
EOF
chmod +x "$HOOK"
echo "pre-commit hook installed"
