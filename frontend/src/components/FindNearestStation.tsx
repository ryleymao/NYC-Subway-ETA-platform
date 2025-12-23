import { useState, useEffect } from 'react'
import { useGeolocation, calculateDistance, formatDistance } from '../hooks/useGeolocation'

interface Station {
  id: string
  name: string
  lat?: number
  lon?: number
}

interface FindNearestStationProps {
  stations: Station[]
  onStationSelect: (stationId: string) => void
  selectedLine: string
}

// Station coordinates (same as in SubwayMap)
const STATION_COORDS: Record<string, { lat: number; lon: number; line: string; name: string }> = {
  '101': { lat: 40.8892, lon: -73.9026, line: '1', name: 'Van Cortlandt Park-242 St' },
  '103': { lat: 40.8847, lon: -73.9009, line: '1', name: '238 St' },
  '104': { lat: 40.8788, lon: -73.9048, line: '1', name: '231 St' },
  '106': { lat: 40.8694, lon: -73.9151, line: '1', name: '215 St' },
  '107': { lat: 40.8649, lon: -73.9189, line: '1', name: '207 St' },
  '120': { lat: 40.7614, lon: -73.9776, line: '1', name: 'Times Sq-42 St' },
  '121': { lat: 40.7555, lon: -73.9872, line: '1', name: '34 St-Penn Station' },
  '122': { lat: 40.7504, lon: -73.9911, line: '1', name: '28 St' },
  '123': { lat: 40.7456, lon: -73.9943, line: '1', name: '23 St' },
  '124': { lat: 40.7400, lon: -73.9976, line: '1', name: '18 St' },
  '125': { lat: 40.7347, lon: -74.0018, line: '1', name: '14 St-Union Sq' },
  '126': { lat: 40.7305, lon: -74.0052, line: '1', name: 'Christopher St-Sheridan Sq' },
  '127': { lat: 40.7253, lon: -74.0089, line: '1', name: 'Houston St' },
  '128': { lat: 40.7183, lon: -74.0132, line: '1', name: 'Canal St' },
  '129': { lat: 40.7130, lon: -74.0166, line: '1', name: 'Franklin St' },
  '130': { lat: 40.7076, lon: -74.0201, line: '1', name: 'Chambers St' },
  '131': { lat: 40.7014, lon: -74.0132, line: '1', name: 'WTC Cortlandt' },
  '132': { lat: 40.6944, lon: -74.0106, line: '1', name: 'Rector St' },
  '133': { lat: 40.6881, lon: -74.0106, line: '1', name: 'South Ferry' },
  'A01': { lat: 40.8681, lon: -73.9199, line: 'A', name: 'Inwood-207 St' },
  'A02': { lat: 40.8655, lon: -73.9272, line: 'A', name: 'Dyckman St' },
  'A03': { lat: 40.8584, lon: -73.9332, line: 'A', name: '190 St' },
  'A09': { lat: 40.7617, lon: -73.9778, line: 'A', name: '42 St-Port Authority' },
  'A10': { lat: 40.7555, lon: -73.9872, line: 'A', name: '34 St-Penn Station' },
  'A11': { lat: 40.7504, lon: -73.9911, line: 'A', name: '23 St' },
  'A12': { lat: 40.7456, lon: -73.9943, line: 'A', name: '14 St' },
  'A13': { lat: 40.7347, lon: -74.0018, line: 'A', name: 'W 4 St-Wash Sq' },
  'A14': { lat: 40.7305, lon: -74.0052, line: 'A', name: 'Spring St' },
  'A15': { lat: 40.7253, lon: -74.0089, line: 'A', name: 'Canal St' },
  'A16': { lat: 40.7183, lon: -74.0132, line: 'A', name: 'Chambers St' },
  'A17': { lat: 40.7130, lon: -74.0166, line: 'A', name: 'Fulton St' },
  'A18': { lat: 40.7076, lon: -74.0201, line: 'A', name: 'High St' },
  'A19': { lat: 40.7014, lon: -74.0132, line: 'A', name: 'Jay St-MetroTech' },
}

export default function FindNearestStation({
  stations,
  onStationSelect,
  selectedLine,
}: FindNearestStationProps) {
  const { latitude, longitude, error, loading, getCurrentPosition } = useGeolocation()
  const [nearestStations, setNearestStations] = useState<
    Array<{ station: Station; distance: number }>
  >([])

  const findNearest = () => {
    if (!latitude || !longitude) {
      getCurrentPosition()
      return
    }

    const stationsWithDistance = stations
      .map((station) => {
        const coords = STATION_COORDS[station.id]
        if (!coords) return null

        const distance = calculateDistance(latitude, longitude, coords.lat, coords.lon)
        return { station, distance }
      })
      .filter((item): item is { station: Station; distance: number } => item !== null)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5) // Top 5 nearest

    setNearestStations(stationsWithDistance)
  }

  // Auto-find when location is available and stations are loaded
  useEffect(() => {
    if (latitude && longitude && stations.length > 0) {
      const stationsWithDistance = stations
        .map((station) => {
          const coords = STATION_COORDS[station.id]
          if (!coords) return null

          const distance = calculateDistance(latitude, longitude, coords.lat, coords.lon)
          return { station, distance }
        })
        .filter((item): item is { station: Station; distance: number } => item !== null)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 5) // Top 5 nearest

      setNearestStations(stationsWithDistance)
    }
  }, [latitude, longitude, stations])

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg p-4 border-2 border-blue-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-gray-800">
          Find Nearest Station
        </h3>
        <button
          onClick={getCurrentPosition}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md"
        >
          {loading ? (
            <span>Locating...</span>
          ) : (
            <span>Use My Location</span>
          )}
        </button>
      </div>

      {error && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {latitude && longitude && (
        <div className="mb-3 text-xs text-gray-600">
          Location: {latitude.toFixed(4)}, {longitude.toFixed(4)}
          {nearestStations.length > 0 && (
            <span className="ml-2 text-green-600 font-semibold">
              Found {nearestStations.length} nearby stations
            </span>
          )}
        </div>
      )}

      {nearestStations.length > 0 && (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          <p className="text-sm font-semibold text-gray-700 mb-2">Nearest Stations:</p>
          {nearestStations.map(({ station, distance }) => (
            <button
              key={station.id}
              onClick={() => onStationSelect(station.id)}
              className="w-full text-left p-3 bg-white rounded-lg border-2 border-gray-200 hover:border-blue-400 hover:shadow-md transition-all active:scale-98"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">{station.name}</div>
                  <div className="text-xs text-gray-500 mt-1">Line {selectedLine}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-blue-600">{formatDistance(distance)}</div>
                  <div className="text-xs text-gray-500">away</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {!latitude && !loading && !error && (
        <p className="text-sm text-gray-600 text-center py-4">
          Tap "Use My Location" to find the nearest subway station
        </p>
      )}
    </div>
  )
}

