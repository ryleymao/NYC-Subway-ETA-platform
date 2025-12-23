import { useState, useEffect } from 'react'
import { QueryClient, QueryClientProvider, useQuery } from 'react-query'
import axios from 'axios'
import StationSelector from './components/StationSelector'
import ETADisplay from './components/ETADisplay'
import SubwayMap from './components/SubwayMap'
import Navigation, { StatusPage } from './components/Navigation'
import { useGeolocation } from './hooks/useGeolocation'

// In dev mode, Vite proxy handles /api -> backend
// In production (Docker), nginx proxy handles /api -> backend
const API_BASE = import.meta.env.VITE_API_URL || '/api'
const POLL_INTERVAL = 30000 // 30 seconds

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchInterval: POLL_INTERVAL,
      staleTime: 10000,
    },
  },
})

// Simple token storage (in production, use proper auth)
const getAuthToken = () => {
  return localStorage.getItem('auth_token') || ''
}

const setAuthToken = (token: string) => {
  localStorage.setItem('auth_token', token)
}

function AppContent() {
  const [selectedLine, setSelectedLine] = useState<string>('')
  const [selectedStation, setSelectedStation] = useState<string>('')
  const [selectedDirection, setSelectedDirection] = useState<string>('N')
  const [authToken, setAuthTokenState] = useState<string>(getAuthToken())
  const [currentView, setCurrentView] = useState<'main' | 'status'>('main')
  const { latitude, longitude } = useGeolocation()

  // All 22 regular NYC subway lines (excluding shuttles)
  const lines = ['1', '2', '3', '4', '5', '6', '7', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'J', 'L', 'M', 'N', 'Q', 'R', 'W', 'Z']

  // Update user location when geolocation changes
  useEffect(() => {
    if (latitude && longitude) {
      setUserLocation({ lat: latitude, lon: longitude })
    }
  }, [latitude, longitude])

  // Fetch ETA data
  const { data: etaData, isLoading, error, refetch } = useQuery(
    ['eta', selectedLine, selectedStation, selectedDirection],
    async () => {
      if (!selectedStation) return null
      
      const response = await axios.get(`${API_BASE}/eta`, {
        params: {
          line: selectedLine,
          station_id: selectedStation,
          direction: selectedDirection,
        },
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })
      return response.data
    },
    {
      enabled: !!selectedStation && !!authToken,
      refetchInterval: POLL_INTERVAL,
    }
  )

  // Auto-refetch when selections change
  useEffect(() => {
    if (selectedStation && authToken) {
      refetch()
    }
  }, [selectedLine, selectedStation, selectedDirection, authToken, refetch])

  // Handle token input
  const handleTokenSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const tokenInput = form.querySelector('input[name="token"]') as HTMLInputElement
    if (tokenInput?.value) {
      const token = tokenInput.value
      setAuthToken(token)
      setAuthTokenState(token)
    }
  }

  if (!authToken) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
          <h1 className="text-2xl font-bold mb-4">NYC Subway ETA</h1>
          <p className="text-gray-600 mb-4">
            Enter your JWT token to access the API
          </p>
          <form onSubmit={handleTokenSubmit} className="space-y-4">
            <input
              type="text"
              name="token"
              placeholder="JWT Token"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition"
            >
              Connect
            </button>
          </form>
          <p className="text-sm text-gray-500 mt-4">
            Generate a token using: <code className="bg-gray-100 px-2 py-1 rounded">python scripts/generate_token.py</code>
          </p>
        </div>
      </div>
    )
  }

  // Get station info for map
  const [stationInfo, setStationInfo] = useState<{ id: string; name: string } | null>(null)
  const [allStations, setAllStations] = useState<Array<{ id: string; name: string }>>([])
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null)

  useEffect(() => {
    const fetchStationInfo = async () => {
      if (!selectedStation) {
        setStationInfo(null)
        return
      }
      
      try {
        const API_BASE = import.meta.env.VITE_API_URL || '/api'
        const response = await axios.get(
          `${API_BASE}/stations/${selectedLine}`,
          {
            headers: { Authorization: `Bearer ${authToken}` },
          }
        )
        if (response.data?.stations) {
          setAllStations(response.data.stations)
          const station = response.data.stations.find((s: any) => s.id === selectedStation)
          if (station) {
            setStationInfo({ id: station.id, name: station.name })
          }
        }
      } catch (error) {
        // Fallback
        setStationInfo({ id: selectedStation, name: selectedStation })
      }
    }
    
    fetchStationInfo()
  }, [selectedStation, selectedLine, authToken])

  // Show status page if selected
  if (currentView === 'status') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100">
        <Navigation
          lines={lines}
          authToken={authToken}
          currentView={currentView}
          onViewChange={setCurrentView}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => {
              setAuthToken('')
              setAuthTokenState('')
            }}
            className="mb-4 text-sm text-gray-600 hover:text-gray-800 transition-colors px-3 py-1 rounded-md hover:bg-gray-200"
          >
            Change Token
          </button>
        </div>
        <StatusPage lines={lines} authToken={authToken} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100">
      {/* Navigation */}
      <Navigation
        lines={lines}
        authToken={authToken}
        currentView={currentView}
        onViewChange={setCurrentView}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Token change button */}
        <div className="mb-4 flex justify-end">
          <button
            onClick={() => {
              setAuthToken('')
              setAuthTokenState('')
            }}
            className="text-sm text-gray-600 hover:text-gray-800 transition-colors px-3 py-1 rounded-md hover:bg-gray-200"
          >
            Change Token
          </button>
        </div>

        {/* Main Content Grid - Mobile-first responsive */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          {/* Left Column - Station Selector */}
          <div className="lg:col-span-3">
            <StationSelector
              lines={lines}
              selectedLine={selectedLine}
              selectedStation={selectedStation}
              selectedDirection={selectedDirection}
              onLineChange={setSelectedLine}
              onStationChange={setSelectedStation}
              onDirectionChange={setSelectedDirection}
              authToken={authToken}
            />
          </div>

          {/* Middle Column - ETA Display */}
          <div className="lg:col-span-5">
            <ETADisplay
              line={selectedLine}
              station={selectedStation}
              direction={selectedDirection}
              data={etaData}
              isLoading={isLoading}
              error={error}
            />
          </div>

          {/* Right Column - Map */}
          <div className="lg:col-span-4 order-first lg:order-last">
            <div className="bg-white rounded-lg shadow-lg p-2 sm:p-4 h-[400px] sm:h-[500px] lg:h-[600px]">
              <h2 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 text-gray-800 px-2">Station Map</h2>
              <SubwayMap
                selectedStation={stationInfo || undefined}
                line={selectedLine}
                stations={allStations}
                userLocation={userLocation}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  )
}

export default App

