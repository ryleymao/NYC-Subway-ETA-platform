import { useState } from 'react'
import LineStatus from './LineStatus'

interface NavigationProps {
  lines: string[]
  authToken: string
  currentView: 'main' | 'status'
  onViewChange: (view: 'main' | 'status') => void
}

export default function Navigation({ lines, authToken, currentView, onViewChange }: NavigationProps) {
  return (
    <nav className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo/Title */}
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg">
              NYC Subway ETA
            </h1>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => onViewChange('main')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                currentView === 'main'
                  ? 'bg-white text-blue-600 shadow-md'
                  : 'text-blue-100 hover:text-white hover:bg-blue-800'
              }`}
            >
              ETA Lookup
            </button>
            <button
              onClick={() => onViewChange('status')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                currentView === 'status'
                  ? 'bg-white text-blue-600 shadow-md'
                  : 'text-blue-100 hover:text-white hover:bg-blue-800'
              }`}
            >
              Line Status
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

export function StatusPage({ lines, authToken }: { lines: string[]; authToken: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Subway Line Status</h2>
          <p className="text-gray-600">Real-time status of all NYC subway lines</p>
        </div>
        <LineStatus lines={lines} authToken={authToken} />
      </div>
    </div>
  )
}

