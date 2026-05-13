'use client'

import { useState, useEffect } from 'react'
import type { HouseholdProfile } from '@/features/lib/types'
import { householdApi } from '../services/api'
import { useHousehold } from '../context'

export function HouseholdSettings() {
  const { householdProfile } = useHousehold()

  const [weekStartDay, setWeekStartDay] = useState<'Monday' | 'Sunday'>('Monday')
  const [previousValue, setPreviousValue] = useState<'Monday' | 'Sunday'>('Monday')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Load initial weekStartDay from household profile or fetch it
  useEffect(() => {
    if (householdProfile?.weekStartDay) {
      setWeekStartDay(householdProfile.weekStartDay)
      setPreviousValue(householdProfile.weekStartDay)
    } else {
      // Fetch the profile if not available in context
      householdApi
        .getProfile()
        .then((res) => {
          if (res.data?.weekStartDay) {
            setWeekStartDay(res.data.weekStartDay)
            setPreviousValue(res.data.weekStartDay)
          }
        })
        .catch(() => {
          // Default to Monday if fetch fails
          setWeekStartDay('Monday')
          setPreviousValue('Monday')
        })
    }
  }, [householdProfile])

  async function handleWeekStartDayChange(value: 'Monday' | 'Sunday') {
    setWeekStartDay(value)
    setError(null)
    setSuccess(false)
    setLoading(true)

    try {
      const response = await householdApi.updateProfile(undefined, value)
      if (response.status === 'success') {
        setPreviousValue(value)
        setSuccess(true)
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(false), 3000)
      } else {
        throw new Error(response.message || 'Failed to update week start day')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update week start day'
      setError(message)
      // Revert to previous value on error
      setWeekStartDay(previousValue)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Week Starts On section */}
      <div className="border-b border-slate-200 pb-6">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Week Starts On</h3>
        <div className="space-y-3">
          <label className="flex items-center p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
            <input
              type="radio"
              name="weekStartDay"
              value="Monday"
              checked={weekStartDay === 'Monday'}
              onChange={() => handleWeekStartDayChange('Monday')}
              disabled={loading}
              className="w-4 h-4 text-forest-900 border-slate-300 focus:ring-forest-900"
            />
            <span className="ml-3 text-sm text-slate-700">Monday</span>
          </label>
          <label className="flex items-center p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
            <input
              type="radio"
              name="weekStartDay"
              value="Sunday"
              checked={weekStartDay === 'Sunday'}
              onChange={() => handleWeekStartDayChange('Sunday')}
              disabled={loading}
              className="w-4 h-4 text-forest-900 border-slate-300 focus:ring-forest-900"
            />
            <span className="ml-3 text-sm text-slate-700">Sunday</span>
          </label>
        </div>

        {/* Status messages */}
        {loading && (
          <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
            <div className="w-4 h-4 rounded-full border-2 border-slate-300 border-t-forest-900 animate-spin" />
            <span>Saving...</span>
          </div>
        )}
        {success && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">Week start day updated successfully</p>
          </div>
        )}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
      </div>
    </div>
  )
}
