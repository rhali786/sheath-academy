#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')

const bump = process.argv[2] || 'patch'
if (!['major', 'minor', 'patch'].includes(bump)) {
  process.stderr.write(`bump-version: unknown type "${bump}" — use major, minor, or patch\n`)
  process.exit(1)
}

const pkgPath = path.join(__dirname, '..', 'package.json')
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))

let [major, minor, patch] = pkg.version.split('.').map(Number)
if (bump === 'major') { major++; minor = 0; patch = 0 }
else if (bump === 'minor') { minor++; patch = 0 }
else { patch++ }

pkg.version = `${major}.${minor}.${patch}`

fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
process.stdout.write(`version bumped (${bump}) → ${pkg.version}\n`)
