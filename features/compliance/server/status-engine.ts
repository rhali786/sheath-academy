import type {
  StatusEngineInput,
  StatusEngineResult,
  ComplianceStatus,
  ComplianceCheck,
} from '@/features/compliance/types'

/**
 * Derives compliance status from rules + household config + live attendance.
 *
 * Precedence (Cursor 7.3):
 *  1. compliance_rulesets (verified) is the legal floor — never silently merged with schoolYear.
 *  2. school_years.requiredDays/Hours is the household's own target.
 *  3. If ruleset is null/unverified → fall back to schoolYear target, label self-reported.
 *  4. Warn when household target < legal floor (never auto-resolve).
 */
export function runStatusEngine(input: StatusEngineInput): StatusEngineResult {
  const { ruleset, overrides, schoolYearConfig, attendanceSummary, subjectCoverage, artifactFlags } = input

  const reasons: string[] = []
  const nextActions: string[] = []
  const missingData: string[] = []

  const isVerifiedRuleset = ruleset !== null && ruleset.isVerified && ruleset.value !== null
  const isSelfReported = !isVerifiedRuleset

  const provenance = isVerifiedRuleset
    ? `${ruleset.state} – ${ruleset.pathwayKey} pathway (verified ${ruleset.lastVerifiedAt})`
    : null

  // Determine the effective required days
  const override = overrides.find(o => o.requirementType === 'attendance_days')
  let requiredDays: number | null = null

  if (override) {
    requiredDays = override.overrideValue
  } else if (isVerifiedRuleset && ruleset.requirementType === 'attendance_days') {
    requiredDays = ruleset.value
  } else if (schoolYearConfig.requiredDays !== null) {
    requiredDays = schoolYearConfig.requiredDays
  }

  // Missing data detection
  if (requiredDays === null) {
    missingData.push('No attendance requirement configured')
  }
  if (!attendanceSummary.rangeStart) {
    missingData.push('No school year date range configured')
  }

  // Legal floor warning: household target < verified ruleset floor
  let belowLegalFloorWarning: string | null = null
  if (
    isVerifiedRuleset &&
    ruleset.requirementType === 'attendance_days' &&
    ruleset.value !== null &&
    schoolYearConfig.requiredDays !== null &&
    !override &&
    schoolYearConfig.requiredDays < ruleset.value
  ) {
    belowLegalFloorWarning =
      `School year set to ${schoolYearConfig.requiredDays} days; ${ruleset.state} requires ${ruleset.value} (${ruleset.pathwayKey} pathway)`
  }

  // Compute status
  let status: ComplianceStatus = 'green'

  if (requiredDays === null || !attendanceSummary.rangeStart) {
    status = 'yellow'
    reasons.push('Attendance requirement or school year dates not configured')
    nextActions.push('Configure your school year and attendance requirement')
  } else {
    const present = attendanceSummary.daysPresent
    const ratio = present / requiredDays

    if (ratio >= 1.0) {
      status = 'green'
    } else if (ratio >= 0.85) {
      status = 'yellow'
      const remaining = requiredDays - present
      reasons.push(`${present} of ${requiredDays} days present — ${remaining} more needed`)
      nextActions.push(`Record ${remaining} more school days to reach your requirement`)
    } else {
      status = 'red'
      const remaining = requiredDays - present
      reasons.push(`${present} of ${requiredDays} days present — significantly below target`)
      nextActions.push(`Record ${remaining} more school days`)
    }
  }

  if (isSelfReported) {
    reasons.push(isVerifiedRuleset === false && ruleset !== null
      ? 'State ruleset not yet verified — verdict is self-reported'
      : 'No verified state ruleset — using household target (self-reported)')
  }

  if (belowLegalFloorWarning) {
    nextActions.push(belowLegalFloorWarning)
  }

  // Requirement checklist (independent of the headline status). Each line reports
  // its own met/unmet state so the card can render an honest ✓/✕ per item.
  const checks: ComplianceCheck[] = []

  // 1. Days logged vs requirement.
  if (requiredDays !== null) {
    const present = attendanceSummary.daysPresent
    checks.push({
      label: `${present} / ${requiredDays} days logged`,
      met: present >= requiredDays,
    })
  } else {
    checks.push({ label: 'Attendance requirement not set', met: false })
  }

  // 2. Subject coverage — a subject counts as "covered" once it has any completed lesson.
  const totalSubjects = subjectCoverage.length
  const coveredSubjects = subjectCoverage.filter(s => s.lessonsCompleted > 0).length
  if (totalSubjects > 0) {
    checks.push({
      label: coveredSubjects === totalSubjects
        ? 'All required subjects covered'
        : `${coveredSubjects} of ${totalSubjects} subjects covered`,
      met: coveredSubjects === totalSubjects,
    })
  }

  // 3. Portfolio evidence on file.
  checks.push({
    label: artifactFlags.hasPortfolioEvidence ? 'Portfolio evidence on file' : 'No portfolio evidence yet',
    met: artifactFlags.hasPortfolioEvidence,
  })

  return {
    status,
    reasons,
    nextActions,
    missingData,
    checks,
    isSelfReported,
    belowLegalFloorWarning,
    provenance,
  }
}
