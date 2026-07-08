'use client'

import { useContext, useState } from 'react'
import { useSession } from 'next-auth/react'
import { householdApi } from '../services/api'
import { HouseholdContext } from '../context'
import { LogoMark } from './logoPresets'

/**
 * The household's chosen preset mark (crescent/star/book/lantern/compass), on a badge
 * sized generously enough (32px badge, 20px icon, bold stroke) to actually read as an
 * icon rather than a smudge — the earlier 20px badge / 12-16px icon was too small to
 * register as a shape at a glance.
 */
function LogoBadge({ preset }: { preset?: string | null }) {
  return (
    <span
      data-testid="household-switcher-logo-mark-wrap"
      className="w-8 h-8 rounded-full bg-gradient-to-br from-forest-600 to-forest-900 ring-1 ring-white shadow-sm flex items-center justify-center shrink-0"
    >
      <LogoMark preset={preset} className="w-5 h-5 text-white" strokeWidth={2.5} />
    </span>
  )
}

export function HouseholdSwitcher() {
  const { data: session, update } = useSession()
  // Read the context directly (rather than the throwing useHousehold() hook) so this
  // component degrades gracefully — showing the default mark — if ever rendered outside
  // a HouseholdProvider, instead of crashing the whole header.
  const householdCtx = useContext(HouseholdContext)
  const logoPreset = householdCtx?.householdProfile?.logoPreset
  const [open, setOpen] = useState(false)
  const [switching, setSwitching] = useState(false)

  const memberships = session?.user?.memberships
  const currentId = session?.user?.householdId
  const currentHousehold = memberships?.find(m => m.householdId === currentId)

  if (!memberships || memberships.length < 2) {
    const soloName = currentHousehold?.householdName || memberships?.[0]?.householdName || householdCtx?.familyName
    return (
      <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-700">
        <LogoBadge preset={logoPreset} />
        {soloName && <span className="max-w-[120px] truncate">{soloName}</span>}
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Household</span>
      </span>
    )
  }

  const displayName = currentHousehold?.householdName ?? 'Switch household'

  async function handleSwitch(householdId: string) {
    if (householdId === currentId || switching) return
    setOpen(false)
    setSwitching(true)
    try {
      const res = await householdApi.switchHousehold(householdId)
      await update({ householdId: res.data.householdId, timezone: res.data.timezone })
    } finally {
      setSwitching(false)
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-label="Switch household"
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={switching}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
      >
        <LogoBadge preset={logoPreset} />
        <span className="max-w-[120px] truncate">{displayName}</span>
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-0.5">
          Household
          <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Your households"
          className="absolute right-0 mt-1 w-52 bg-white rounded-xl border border-slate-200 shadow-lg z-50 py-1"
        >
          {memberships.map(m => {
            const isActive = m.householdId === currentId
            return (
              <button
                key={m.householdId}
                role="option"
                aria-selected={isActive}
                data-active={isActive ? 'true' : 'false'}
                aria-current={isActive ? 'true' : undefined}
                type="button"
                onClick={() => handleSwitch(m.householdId)}
                className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between gap-2 hover:bg-slate-50 transition-colors ${isActive ? 'font-medium text-slate-900' : 'text-slate-600'}`}
              >
                <span className="truncate">{m.householdName}</span>
                <span className="flex items-center gap-1.5 shrink-0">
                  {m.role === 'owner' && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                      Owner
                    </span>
                  )}
                  {isActive && (
                    <svg className="w-3.5 h-3.5 text-forest-700" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
