#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')

const repoRoot = path.join(__dirname, '..')
const hooksDir = path.join(repoRoot, '.git', 'hooks')
const sourceDir = path.join(__dirname, 'hooks')

if (!fs.existsSync(hooksDir)) {
  process.stderr.write('setup-hooks: .git/hooks not found — are you in a git repository?\n')
  process.exit(1)
}

const hooks = ['pre-commit', 'commit-msg', 'prepare-commit-msg']

for (const hook of hooks) {
  const src = path.join(sourceDir, hook)
  const dest = path.join(hooksDir, hook)
  fs.copyFileSync(src, dest)
  try {
    fs.chmodSync(dest, 0o755)
  } catch {
    // Windows: chmod is a no-op but Git for Windows respects shebangs regardless.
  }
  console.log(`  installed .git/hooks/${hook}`)
}

console.log('git hooks installed (pre-commit, commit-msg, prepare-commit-msg)')
