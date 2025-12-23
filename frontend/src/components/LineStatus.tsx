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
    '1': '#EE352E', // Red
    '2': '#EE352E', // Red
    '3': '#EE352E', // Red
    '4': '#00933C', // Green
    '5': '#00933C', // Green
    '6': '#00933C', // Green
    '7': '#B933AD', // Purple
    'A': '#0039A6', // Blue
    'B': '#FF6319', // Orange
    'C': '#0039A6', // Blue
    'D': '#FF6319', // Orange
    'E': '#0039A6', // Blue
    'F': '#FF6319', // Orange
    'G': '#6CBE45', // Light Green
    'J': '#996633', // Brown
    'L': '#A7A9AC', // Grey
    'M': '#FF6319', // Orange
    'N': '#FCCC0A', // Yellow
    'Q': '#FCCC0A', // Yellow
    'R': '#FCCC0A', // Yellow
    'W': '#FCCC0A', // Yellow
    'Z': '#996633', // Brown
  }

  return (
    <div className="bg-gradient-to-r from-white to-gray-50 rounded-xl shadow-lg p-6 border-2 border-gray-100">
      <h2 className="text-xl font-bold mb-5 text-gray-800">
        Line Status
      </h2>
      <div className="flex flex-wrap gap-3">
        {lines.map((line) => (
          <div
            key={line}
            className="flex items-center gap-2 px-5 py-3 rounded-xl border-2 transition-all duration-200 hover:scale-105 hover:shadow-md cursor-pointer"
            style={{
              borderColor: lineColors[line] || '#666',
              backgroundColor: `${lineColors[line] || '#666'}15`,
            }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-base shadow-md"
              style={{ backgroundColor: lineColors[line] || '#666' }}
            >
              {line}
            </div>
            <span className="text-sm font-semibold text-gray-700">Line {line}</span>
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          </div>
        ))}
      </div>
    </div>
  )
}

