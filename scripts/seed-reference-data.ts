/**
 * Reference data seed — compliance_rulesets + starter badge_definitions.
 *
 * Run with: npm run db:seed:reference
 *
 * Idempotent — uses ON CONFLICT DO NOTHING with stable deterministic IDs.
 * Safe to run multiple times; second run is a no-op.
 *
 * NEVER truncates existing rows.
 */

import * as fs from 'fs'
import * as path from 'path'
import { getDb } from '../features/lib/server/db'
import { complianceRulesets, badgeDefinitions } from '../db/schema'

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not set — add it to .env.local and run with: npm run db:seed:reference')
  process.exit(1)
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface RequirementEntry {
  value: unknown
  source_url?: string
  verified?: boolean
}

interface Pathway {
  key: string
  label: string
  requirements: Record<string, RequirementEntry>
}

interface StateEntry {
  state: string
  stateName: string
  pathways: Pathway[]
  last_verified?: string
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const db = getDb()
  const now = new Date()

  // ── 1. Compliance rulesets ────────────────────────────────────────────────

  const jsonPath = path.join(
    __dirname,
    '../docs/compliance-research/homeschool-requirements-2026-06-27.json',
  )
  const raw = fs.readFileSync(jsonPath, 'utf-8')
  const states: StateEntry[] = JSON.parse(raw)

  const REQUIREMENT_KEYS = [
    'instructionDaysPerYear',
    'instructionHoursPerYear',
    'requiredSubjects',
    'filings',
    'evaluationOrTesting',
    'recordRetention',
  ]

  type ComplianceRulesetInsert = typeof complianceRulesets.$inferInsert

  const rulesetRows: ComplianceRulesetInsert[] = []

  for (const stateEntry of states) {
    for (const pathway of stateEntry.pathways) {
      for (const requirementKey of REQUIREMENT_KEYS) {
        const req = pathway.requirements[requirementKey]
        if (!req) continue

        const stateCode = stateEntry.state.toLowerCase()
        const id = `ruleset_${stateCode}_${pathway.key}_${requirementKey}`

        // Determine numeric value — only set when value is a plain number
        let numericValue: string | null = null
        if (typeof req.value === 'number') {
          numericValue = String(req.value)
        }
        // Non-numeric values (arrays, objects, null) are intentionally discarded;
        // authoritative details are reachable via sourceUrl.

        // Determine unit
        let unit: string
        if (requirementKey.includes('Hour')) {
          unit = 'hours'
        } else if (requirementKey === 'requiredSubjects') {
          unit = 'subjects'
        } else {
          unit = 'days'
        }

        const lastVerifiedAt =
          req.verified && stateEntry.last_verified
            ? new Date(stateEntry.last_verified)
            : null

        rulesetRows.push({
          id,
          state: stateEntry.state,
          pathwayKey: pathway.key,
          requirementType: requirementKey,
          value: numericValue,
          unit,
          sourceUrl: req.source_url ?? null,
          lastVerifiedAt,
          isVerified: req.verified === true,
          createdAt: now,
          updatedAt: now,
        })
      }
    }
  }

  const rulesetAttempted = rulesetRows.length
  if (rulesetAttempted > 0) {
    await db.insert(complianceRulesets).values(rulesetRows).onConflictDoNothing()
  }
  console.log(
    `compliance_rulesets: attempted ${rulesetAttempted} rows — onConflictDoNothing applied (re-run is a no-op)`,
  )

  // ── 2. Starter badge definitions ──────────────────────────────────────────

  type BadgeDefinitionInsert = typeof badgeDefinitions.$inferInsert

  const starterBadges: BadgeDefinitionInsert[] = [
    {
      id: 'badge_starter_quran_memorizer',
      householdId: null,
      title: 'Quran Memorizer',
      description: 'Demonstrated memorization of selected surahs with correct tajweed',
      criteria: 'Memorize and recite at least 10 surahs with correct pronunciation and tajweed',
      emblemKey: 'quran_memorizer',
      gradeBands: ['g1_4', 'g5_8', 'g9_12'],
      verificationRequirement: 'parent',
      isStarter: true,
      enabled: true,
      visibility: 'platform',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'badge_starter_math_champion',
      householdId: null,
      title: 'Math Champion',
      description: 'Showed strong mastery of grade-level mathematics concepts',
      criteria: 'Complete a math assessment at grade level with 90% or higher accuracy',
      emblemKey: 'math_champion',
      gradeBands: ['g1_4', 'g5_8', 'g9_12'],
      verificationRequirement: 'parent',
      isStarter: true,
      enabled: true,
      visibility: 'platform',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'badge_starter_avid_reader',
      householdId: null,
      title: 'Avid Reader',
      description: 'Read a significant body of books and demonstrated comprehension',
      criteria: 'Read and summarize at least 12 books in a school year',
      emblemKey: 'avid_reader',
      gradeBands: ['g1_4', 'g5_8', 'g9_12'],
      verificationRequirement: 'parent',
      isStarter: true,
      enabled: true,
      visibility: 'platform',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'badge_starter_science_explorer',
      householdId: null,
      title: 'Science Explorer',
      description: 'Completed hands-on science experiments and demonstrated scientific thinking',
      criteria: 'Design and carry out at least 5 experiments with written observations',
      emblemKey: 'science_explorer',
      gradeBands: ['g1_4', 'g5_8', 'g9_12'],
      verificationRequirement: 'parent',
      isStarter: true,
      enabled: true,
      visibility: 'platform',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'badge_starter_history_detective',
      householdId: null,
      title: 'History Detective',
      description: 'Demonstrated deep engagement with historical events and sources',
      criteria:
        'Complete a research project on a historical topic using at least 3 primary or secondary sources',
      emblemKey: 'history_detective',
      gradeBands: ['g1_4', 'g5_8', 'g9_12'],
      verificationRequirement: 'parent',
      isStarter: true,
      enabled: true,
      visibility: 'platform',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'badge_starter_creative_writer',
      householdId: null,
      title: 'Creative Writer',
      description: 'Produced original written work showing imagination and craft',
      criteria: 'Write and revise at least 3 original stories, essays, or poems',
      emblemKey: 'creative_writer',
      gradeBands: ['g1_4', 'g5_8', 'g9_12'],
      verificationRequirement: 'parent',
      isStarter: true,
      enabled: true,
      visibility: 'platform',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'badge_starter_language_learner',
      householdId: null,
      title: 'Language Learner',
      description: 'Made measurable progress in a second or heritage language',
      criteria: 'Complete 50+ hours of instruction or practice in a language other than English',
      emblemKey: 'language_learner',
      gradeBands: ['g1_4', 'g5_8', 'g9_12'],
      verificationRequirement: 'parent',
      isStarter: true,
      enabled: true,
      visibility: 'platform',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'badge_starter_community_helper',
      householdId: null,
      title: 'Community Helper',
      description: 'Volunteered and contributed meaningfully to the community',
      criteria: 'Complete at least 20 hours of community service or volunteer work',
      emblemKey: 'community_helper',
      gradeBands: ['g1_4', 'g5_8', 'g9_12'],
      verificationRequirement: 'parent',
      isStarter: true,
      enabled: true,
      visibility: 'platform',
      createdAt: now,
      updatedAt: now,
    },
  ]

  const badgeAttempted = starterBadges.length
  await db.insert(badgeDefinitions).values(starterBadges).onConflictDoNothing()
  console.log(
    `badge_definitions: attempted ${badgeAttempted} starter rows — onConflictDoNothing applied (re-run is a no-op)`,
  )

  console.log('\ndb:seed:reference complete.')
  console.log(
    `  compliance_rulesets: ${rulesetAttempted} rows attempted (states: ${[...new Set(states.map((s) => s.state))].join(', ')})`,
  )
  console.log(`  badge_definitions: ${badgeAttempted} starter badges attempted`)
  process.exit(0)
}

main().catch((err) => {
  console.error('db:seed:reference failed:', err)
  process.exit(1)
})
