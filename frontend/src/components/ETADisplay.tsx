import { Train } from '../types'

interface ETADisplayProps {
  line: string
  station: string
  direction: string
  data: any
  isLoading: boolean
  error: any
}

export default function ETADisplay({
  line,
  station,
  direction,
  data,
  isLoading,
  error,
}: ETADisplayProps) {
  if (!station) {
    return (
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg p-8 text-center border-2 border-dashed border-gray-200">
        <p className="text-lg text-gray-600 font-medium">Select a station to view ETAs</p>
        <p className="text-sm text-gray-400 mt-2">Choose a line and station above</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-red-600">
          <h3 className="font-semibold mb-2">Error loading ETAs</h3>
          <p className="text-sm">
            {error?.response?.data?.detail || error?.message || 'Unknown error'}
          </p>
        </div>
      </div>
    )
  }

  if (!data || !data.etas || data.etas.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">
          Line {line} - {data?.station_name || station}
        </h2>
        <p className="text-gray-500">No ETA data available. Worker may still be processing.</p>
      </div>
    )
  }

  const directionData = data.etas.find(
    (eta: any) => eta.direction === direction
  )

  if (!directionData || !directionData.trains || directionData.trains.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">
          Line {line} - {data.station_name || station}
        </h2>
        <p className="text-gray-500">No trains available for this direction.</p>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on_time':
        return 'bg-green-100 text-green-800'
      case 'delayed':
        return 'bg-red-100 text-red-800'
      case 'early':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const lineColor = line === '1' || line === '2' || line === '3'
    ? '#EE352E'
    : line === '4' || line === '5' || line === '6'
    ? '#00933C'
    : '#0039A6'

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg p-6 border-2 border-gray-100">
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md"
              style={{ backgroundColor: lineColor }}
            >
              {line}
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              {data.station_name || station}
            </h2>
          </div>
          <div className="flex items-center gap-2 ml-12">
            <span className="text-sm font-medium text-gray-600">
              {direction === 'N' ? 'Northbound' : 'Southbound'}
            </span>
          </div>
        </div>
        <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-600 animate-pulse"></span>
          Live
        </span>
      </div>

      <div className="space-y-4">
        {directionData.trains.slice(0, 5).map((train: Train, index: number) => (
          <div
            key={train.train_id || index}
            className="bg-white rounded-lg p-5 border-2 border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 transform hover:-translate-y-0.5"
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div
                  className="w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-lg"
                  style={{ backgroundColor: lineColor }}
                >
                  {line}
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-gray-900">
                      {train.eta_minutes === 0 ? 'NOW' : `${train.eta_minutes}`}
                    </span>
                    {train.eta_minutes !== 0 && (
                      <span className="text-lg text-gray-500 font-medium">min</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    Arrives at {new Date(train.arrival_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
              <span
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${getStatusColor(
                  train.status || 'on_time'
                )}`}
              >
                {train.status === 'on_time' ? '✓ On Time' : train.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      {data.last_updated && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-400">
            Last updated: {new Date(data.last_updated).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  )
}

