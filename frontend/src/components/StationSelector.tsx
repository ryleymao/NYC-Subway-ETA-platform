import { useState, useEffect } from 'react'
import axios from 'axios'

interface StationSelectorProps {
  lines: string[]
  selectedLine: string
  selectedStation: string
  selectedDirection: string
  onLineChange: (line: string) => void
  onStationChange: (station: string) => void
  onDirectionChange: (direction: string) => void
  authToken: string
}

// Common station IDs for testing (in production, fetch from API)
const COMMON_STATIONS: Record<string, { id: string; name: string }[]> = {
  '1': [
    { id: '101', name: 'Van Cortlandt Park-242 St' },
    { id: '103', name: '238 St' },
    { id: '104', name: '231 St' },
    { id: '106', name: '215 St' },
    { id: '107', name: '207 St' },
  ],
  'A': [
    { id: 'A01', name: 'Inwood-207 St' },
    { id: 'A02', name: 'Dyckman St' },
    { id: 'A03', name: '190 St' },
  ],
  'C': [
    { id: 'A01', name: 'Inwood-207 St' },
    { id: 'A02', name: 'Dyckman St' },
  ],
  'E': [
    { id: 'A01', name: 'Inwood-207 St' },
    { id: 'A02', name: 'Dyckman St' },
  ],
}

export default function StationSelector({
  lines,
  selectedLine,
  selectedStation,
  selectedDirection,
  onLineChange,
  onStationChange,
  onDirectionChange,
  authToken,
}: StationSelectorProps) {
  const [stations, setStations] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchStations = async () => {
      // Try to fetch from API first
      setLoading(true)
      try {
        const API_BASE = import.meta.env.VITE_API_URL || '/api'
        const response = await axios.get(
          `${API_BASE}/stations/${selectedLine}`,
          {
            headers: { Authorization: `Bearer ${authToken}` },
          }
        )
        if (response.data?.stations?.length > 0) {
          setStations(response.data.stations)
        } else {
          // Fallback to common stations
          setStations(COMMON_STATIONS[selectedLine] || [])
        }
      } catch (error) {
        // Fallback to common stations
        setStations(COMMON_STATIONS[selectedLine] || [])
      } finally {
        setLoading(false)
      }
    }

    if (selectedLine) {
      fetchStations()
      onStationChange('') // Reset station when line changes
    }
  }, [selectedLine, authToken, onStationChange])

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">Select Station</h2>

      {/* Line Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Line
        </label>
        <select
          value={selectedLine}
          onChange={(e) => onLineChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {lines.map((line) => (
            <option key={line} value={line}>
              Line {line}
            </option>
          ))}
        </select>
      </div>

      {/* Station Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Station
        </label>
        {loading ? (
          <div className="text-gray-500">Loading stations...</div>
        ) : (
          <select
            value={selectedStation}
            onChange={(e) => onStationChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={stations.length === 0}
          >
            <option value="">Select a station</option>
            {stations.map((station) => (
              <option key={station.id} value={station.id}>
                {station.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Direction Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Direction
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => onDirectionChange('N')}
            className={`flex-1 px-4 py-2 rounded-md font-medium transition ${
              selectedDirection === 'N'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Northbound
          </button>
          <button
            onClick={() => onDirectionChange('S')}
            className={`flex-1 px-4 py-2 rounded-md font-medium transition ${
              selectedDirection === 'S'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Southbound
          </button>
        </div>
      </div>
    </div>
  )
}

