import { useQuery } from 'react-query'
import axios from 'axios'

interface LineStatusProps {
  lines: string[]
  authToken: string
}

export default function LineStatus({ lines, authToken }: LineStatusProps) {
  // This is a simplified status component
  // In production, you'd fetch line status from an API endpoint
  
  const lineColors: Record<string, string> = {
    '1': '#EE352E',
    '2': '#EE352E',
    '3': '#EE352E',
    '4': '#00933C',
    '5': '#00933C',
    '6': '#00933C',
    'A': '#0039A6',
    'C': '#0039A6',
    'E': '#0039A6',
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">Line Status</h2>
      <div className="flex flex-wrap gap-3">
        {lines.map((line) => (
          <div
            key={line}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border-2"
            style={{
              borderColor: lineColors[line] || '#666',
              backgroundColor: `${lineColors[line] || '#666'}10`,
            }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: lineColors[line] || '#666' }}
            >
              {line}
            </div>
            <span className="text-sm font-medium">Line {line}</span>
            <span className="text-xs text-green-600">●</span>
          </div>
        ))}
      </div>
    </div>
  )
}

