#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const specPath = path.join(__dirname, '../docs/WAVE1-SPECIFICATION.md')
const featureBaseDir = path.join(__dirname, '../features')

const spec = fs.readFileSync(specPath, 'utf-8')

// Extract features from spec using regex pattern for feature sections
const featurePattern = /### Feature (\d+) — ([^\n]+)\n\n([^]*?)(?=### Feature \d+|## Wave|$)/g
const features = []
let match

while ((match = featurePattern.exec(spec)) !== null) {
  const number = parseInt(match[1])
  const title = match[2].trim()
  const content = match[3].trim()

  features.push({ number, title, content })
}

console.log(`Found ${features.length} features`)

// Create folders and README files
features.forEach((feature) => {
  const folderName = `feature-${String(feature.number).padStart(2, '0')}-${feature.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')}_todo`

  const folderPath = path.join(featureBaseDir, folderName)

  // Create folder
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true })
    console.log(`✓ Created folder: ${folderName}`)
  }

  // Create README
  const readmeContent = `# Feature ${feature.number} — ${feature.title}

**STATUS:** Undeveloped (To Do)

---

${feature.content}

---

**Next Steps:** Review this specification with the team. Resolve open questions before sprint planning.
`

  const readmePath = path.join(folderPath, 'README.md')
  fs.writeFileSync(readmePath, readmeContent, 'utf-8')
  console.log(`  ✓ Created README.md`)
})

console.log(`\n✅ Created ${features.length} feature folders with README files`)
