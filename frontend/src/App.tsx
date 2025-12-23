import { useState, useEffect } from 'react'
import { QueryClient, QueryClientProvider, useQuery } from 'react-query'
import axios from 'axios'
import StationSelector from './components/StationSelector'
import ETADisplay from './components/ETADisplay'
import LineStatus from './components/LineStatus'

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
  const [selectedLine, setSelectedLine] = useState<string>('1')
  const [selectedStation, setSelectedStation] = useState<string>('')
  const [selectedDirection, setSelectedDirection] = useState<string>('N')
  const [authToken, setAuthTokenState] = useState<string>(getAuthToken())

  const lines = ['1', '2', '3', '4', '5', '6', 'A', 'C', 'E']

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              🚇 NYC Subway ETA
            </h1>
            <button
              onClick={() => {
                setAuthToken('')
                setAuthTokenState('')
              }}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Change Token
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Line Status Overview */}
        <LineStatus lines={lines} authToken={authToken} />

        {/* Main Content */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Station Selector */}
          <div className="lg:col-span-1">
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

          {/* ETA Display */}
          <div className="lg:col-span-2">
            <ETADisplay
              line={selectedLine}
              station={selectedStation}
              direction={selectedDirection}
              data={etaData}
              isLoading={isLoading}
              error={error}
            />
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

