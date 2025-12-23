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
      <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
        Select a station to view ETAs
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

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-xl font-bold">
            Line {line} - {data.station_name || station}
          </h2>
          <p className="text-sm text-gray-500">
            {direction === 'N' ? 'Northbound' : 'Southbound'}
          </p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
            'on_time'
          )}`}
        >
          Live
        </span>
      </div>

      <div className="space-y-3">
        {directionData.trains.slice(0, 3).map((train: Train, index: number) => (
          <div
            key={train.train_id || index}
            className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                    line === '1' || line === '2' || line === '3'
                      ? 'bg-[#EE352E]'
                      : line === '4' || line === '5' || line === '6'
                      ? 'bg-[#00933C]'
                      : 'bg-[#0039A6]'
                  }`}
                >
                  {line}
                </div>
                <div>
                  <div className="font-semibold text-lg">
                    {train.eta_minutes === 0 ? 'Arriving' : `${train.eta_minutes} min`}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(train.arrival_time).toLocaleTimeString()}
                  </div>
                </div>
              </div>
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                  train.status || 'on_time'
                )}`}
              >
                {train.status === 'on_time' ? 'On Time' : train.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      {data.last_updated && (
        <p className="text-xs text-gray-400 mt-4">
          Last updated: {new Date(data.last_updated).toLocaleString()}
        </p>
      )}
    </div>
  )
}

