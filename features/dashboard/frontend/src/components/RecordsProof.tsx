import React, { useState } from 'react'
import { CheckCircle, TrendingUp, Folder, BookOpen } from 'lucide-react'
import type { Record } from '../types'

interface RecordsProofProps {
  records: Record[]
}

const iconMap: Record<string, React.ReactNode> = {
  CheckCircle: <CheckCircle className="w-6 h-6 text-green-600" />,
  TrendingUp: <TrendingUp className="w-6 h-6 text-blue-600" />,
  Folder: <Folder className="w-6 h-6 text-purple-600" />,
  BookOpen: <BookOpen className="w-6 h-6 text-orange-600" />,
}

export function RecordsProof({ records }: RecordsProofProps) {
  const [selectedExport, setSelectedExport] = useState<string | null>(null)

  return (
    <section className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="card-lg">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Records & Proof</h2>

        {/* Records Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {records.map((record) => (
            <div key={record.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-3xl">
                  {iconMap[record.icon] || '📊'}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900">{record.title}</h3>
              <p className="text-lg font-bold text-blue-600 mt-1">
                {record.count}{record.maxCount ? `/${record.maxCount}` : ''}
              </p>
              <button className="mt-3 w-full text-sm font-medium text-blue-600 hover:text-blue-700">
                {record.viewButton} →
              </button>
            </div>
          ))}
        </div>

        {/* Export Buttons */}
        <div className="pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ready to Export</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <button
              onClick={() => setSelectedExport('attendance')}
              className="px-4 py-3 bg-blue-50 text-blue-600 rounded-lg font-medium text-sm hover:bg-blue-100 transition border border-blue-200"
            >
              Attendance Report ↗
            </button>
            <button
              onClick={() => setSelectedExport('progress')}
              className="px-4 py-3 bg-green-50 text-green-600 rounded-lg font-medium text-sm hover:bg-green-100 transition border border-green-200"
            >
              Progress Report ↗
            </button>
            <button
              onClick={() => setSelectedExport('portfolio')}
              className="px-4 py-3 bg-purple-50 text-purple-600 rounded-lg font-medium text-sm hover:bg-purple-100 transition border border-purple-200"
            >
              Portfolio Export ↗
            </button>
            <button
              onClick={() => setSelectedExport('quran')}
              className="px-4 py-3 bg-orange-50 text-orange-600 rounded-lg font-medium text-sm hover:bg-orange-100 transition border border-orange-200"
            >
              Quran Summary ↗
            </button>
            <button
              onClick={() => setSelectedExport('islamic')}
              className="px-4 py-3 bg-pink-50 text-pink-600 rounded-lg font-medium text-sm hover:bg-pink-100 transition border border-pink-200"
            >
              Islamic Studies ↗
            </button>
          </div>
        </div>
      </div>

      {/* Export Confirmation Modal */}
      {selectedExport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-sm w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Export Initiated</h3>
            <p className="text-gray-600 mb-6">
              Your {selectedExport} report is being prepared. Check your downloads folder.
            </p>
            <button
              onClick={() => setSelectedExport(null)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
