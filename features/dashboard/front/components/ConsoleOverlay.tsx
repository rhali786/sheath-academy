'use client'

import { useState, useEffect } from 'react'

interface LogEntry {
  id: string
  type: 'log' | 'warn' | 'error'
  message: string
  timestamp: string
}

export function ConsoleOverlay() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)

  useEffect(() => {
    let logId = 0

    const originalLog = console.log
    const originalWarn = console.warn
    const originalError = console.error

    const addLog = (type: 'log' | 'warn' | 'error', args: unknown[]) => {
      const message = args
        .map(arg => {
          if (typeof arg === 'object') {
            try {
              return JSON.stringify(arg, null, 2)
            } catch {
              return String(arg)
            }
          }
          return String(arg)
        })
        .join(' ')

      setLogs(prev => [
        ...prev,
        {
          id: String(logId++),
          type,
          message,
          timestamp: new Date().toLocaleTimeString(),
        },
      ])
    }

    console.log = (...args) => {
      originalLog(...args)
      addLog('log', args)
    }

    console.warn = (...args) => {
      originalWarn(...args)
      addLog('warn', args)
    }

    console.error = (...args) => {
      originalError(...args)
      addLog('error', args)
    }

    return () => {
      console.log = originalLog
      console.warn = originalWarn
      console.error = originalError
    }
  }, [])

  const getColor = (type: string) => {
    switch (type) {
      case 'error':
        return 'text-red-500'
      case 'warn':
        return 'text-yellow-500'
      default:
        return 'text-gray-300'
    }
  }

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 bg-gray-900 text-white px-3 py-2 rounded text-xs font-mono border border-gray-600 hover:border-gray-400 transition"
        title="Toggle Console"
      >
        📱 Console ({logs.length})
      </button>

      {/* Console Overlay */}
      {isOpen && (
        <div className="fixed bottom-16 right-4 z-50 w-96 max-h-96 bg-gray-950 border border-gray-600 rounded shadow-lg flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between bg-gray-900 px-3 py-2 border-b border-gray-600">
            <span className="text-white text-xs font-mono font-bold">
              Browser Console
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="text-gray-400 hover:text-white text-xs"
              >
                {isMinimized ? '▲' : '▼'}
              </button>
              <button
                onClick={() => setLogs([])}
                className="text-gray-400 hover:text-white text-xs"
                title="Clear logs"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Content */}
          {!isMinimized && (
            <div className="flex-1 overflow-y-auto bg-gray-950 p-3 space-y-1 font-mono text-xs">
              {logs.length === 0 ? (
                <div className="text-gray-500">No logs yet...</div>
              ) : (
                logs.map(log => (
                  <div
                    key={log.id}
                    className={`${getColor(log.type)} break-all whitespace-pre-wrap`}
                  >
                    <span className="text-gray-500">[{log.timestamp}]</span>{' '}
                    {log.message}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </>
  )
}
