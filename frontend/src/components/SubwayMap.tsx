import { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Import accurate station coordinates from GTFS data
import stationData from '../data/station_coords.json'

// Convert the loaded data to our format
const ACCURATE_STATION_COORDS: Record<string, { lat: number; lon: number; line: string; name: string; order: number }> = {}

if (stationData && (stationData as any).stations) {
  Object.entries((stationData as any).stations).forEach(([id, station]: [string, any]) => {
    ACCURATE_STATION_COORDS[id] = {
      lat: station.lat,
      lon: station.lon,
      line: station.line,
      name: station.name,
      order: station.order
    }
  })
  console.log(`Loaded ${Object.keys(ACCURATE_STATION_COORDS).length} accurate station coordinates from GTFS data`)
}

// Fix for default marker icons in React-Leaflet
import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png'

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconRetinaUrl: iconRetina,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

L.Marker.prototype.options.icon = DefaultIcon

interface SubwayMapProps {
  selectedStation?: {
    id: string
    name: string
    lat?: number
    lon?: number
  }
  line?: string
  stations?: Array<{
    id: string
    name: string
    lat?: number
    lon?: number
  }>
  userLocation?: {
    lat: number
    lon: number
  } | null
}

// Use accurate coordinates if available, otherwise empty
const STATION_COORDS = ACCURATE_STATION_COORDS

// Calculate bounds from all stations
function calculateBounds() {
  const allCoords = Object.values(STATION_COORDS)
  if (allCoords.length === 0) {
    // Default to NYC area if no stations
    return L.latLngBounds(
      [40.5, -74.3],
      [41.0, -73.7]
    )
  }

  const lats = allCoords.map(c => c.lat)
  const lons = allCoords.map(c => c.lon)
  
  return L.latLngBounds(
    [Math.min(...lats), Math.min(...lons)],
    [Math.max(...lats), Math.max(...lons)]
  )
}

function MapBounds({ bounds }: { bounds: L.LatLngBounds | null }) {
  const map = useMap()
  
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 13
      })
    }
  }, [bounds, map])
  
  return null
}

function MapUpdater({ selectedStation }: { selectedStation?: SubwayMapProps['selectedStation'] }) {
  const map = useMap()
  
  useEffect(() => {
    if (selectedStation?.lat && selectedStation?.lon) {
      map.setView([selectedStation.lat, selectedStation.lon], 15, {
        animate: true,
        duration: 0.8
      })
    } else if (selectedStation?.id) {
      const station = STATION_COORDS[selectedStation.id]
      if (station) {
        map.setView([station.lat, station.lon], 15, {
          animate: true,
          duration: 0.8
        })
      }
    }
  }, [selectedStation, map])
  
  return null
}

// Create subway-style marker icon
const createSubwayMarker = (line: string, lineColor: string, isSelected: boolean = false) => {
  const size = isSelected ? 40 : 24
  const borderWidth = isSelected ? 4 : 2
  const fontSize = isSelected ? 18 : 12
  const shadowSize = isSelected ? 12 : 6
  
  return L.divIcon({
    className: 'subway-marker',
    html: `
      <div style="
        position: relative;
        width: ${size}px;
        height: ${size}px;
      ">
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: ${size}px;
          height: ${size}px;
          background: linear-gradient(135deg, ${lineColor} 0%, ${lineColor}dd 100%);
          border-radius: 50%;
          border: ${borderWidth}px solid white;
          box-shadow: 0 ${shadowSize}px ${shadowSize * 2}px rgba(0,0,0,0.4), 
                      0 0 0 ${isSelected ? 4 : 2}px ${lineColor}40;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 900;
          font-size: ${fontSize}px;
          font-family: 'Arial Black', Arial, sans-serif;
          text-shadow: 0 1px 2px rgba(0,0,0,0.3);
          z-index: 10;
          ${isSelected ? 'animation: pulse 2s infinite;' : ''}
        ">${line}</div>
        ${isSelected ? `
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: ${size + 16}px;
            height: ${size + 16}px;
            border-radius: 50%;
            border: 2px solid ${lineColor};
            opacity: 0.6;
            animation: ripple 2s infinite;
          "></div>
        ` : ''}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 - 5],
  })
}

export default function SubwayMap({ selectedStation, line, stations, userLocation }: SubwayMapProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  
  const lineColors: Record<string, string> = {
    '1': '#EE352E', // Red
    '2': '#EE352E', // Red
    '3': '#EE352E', // Red
    '4': '#00933C', // Green
    '5': '#00933C', // Green
    '6': '#00933C', // Green
    '7': '#B933AD', // Purple
    'A': '#0039A6', // Blue
    'C': '#0039A6', // Blue
    'E': '#0039A6', // Blue
    'B': '#FF6319', // Orange
    'D': '#FF6319', // Orange
    'F': '#FF6319', // Orange
    'L': '#A7A9AC', // Grey
    'N': '#FCCC0A', // Yellow
    'Q': '#FCCC0A', // Yellow
    'R': '#FCCC0A', // Yellow
    'W': '#FCCC0A', // Yellow
    'G': '#6CBE45', // Light Green
    'J': '#996633', // Brown
    'Z': '#996633', // Brown
    'M': '#FF6319', // Orange (also Brown when running on J/Z)
  }

  // Calculate bounds from all stations
  const bounds = useMemo(() => calculateBounds(), [])
  
  // Get center point for initial view
  const center: [number, number] = [40.7589, -73.9851] // NYC center

  const selectedStationData = selectedStation?.id ? STATION_COORDS[selectedStation.id] : null
  const selectedLineColor = lineColors[line || '1'] || '#666'

  // Group stations by line and order them by the 'order' field
  const routeLines = useMemo(() => {
    const linesMap: Record<string, Array<{ order: number; coords: [number, number] }>> = {}
    
    Object.values(STATION_COORDS).forEach(station => {
      if (!linesMap[station.line]) {
        linesMap[station.line] = []
      }
      linesMap[station.line].push({ order: station.order, coords: [station.lat, station.lon] })
    })
    
    // Sort by order field for each line
    Object.keys(linesMap).forEach(lineKey => {
      linesMap[lineKey].sort((a, b) => a.order - b.order)
    })
    
    // Convert to coordinate arrays
    const routeCoords: Record<string, [number, number][]> = {}
    Object.keys(linesMap).forEach(lineKey => {
      routeCoords[lineKey] = linesMap[lineKey].map(item => item.coords)
    })
    
    return routeCoords
  }, [])

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  const mapContent = (
    <div className={`w-full h-full rounded-xl overflow-hidden shadow-2xl border-4 border-gray-300 relative ${isFullscreen ? 'fixed inset-0 z-[9999] rounded-none border-0' : ''}`}>
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.1); }
        }
        @keyframes ripple {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
          100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
        }
        @keyframes pulse-ring {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 0.3; }
          100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
        }
        .subway-marker {
          background: transparent !important;
          border: none !important;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 12px !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
        }
        .leaflet-popup-content {
          margin: 12px 16px !important;
        }
      `}</style>
      
      {/* Fullscreen button */}
      <button
        onClick={toggleFullscreen}
        className="absolute top-4 right-4 z-[1000] bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-3 border-2 border-gray-200 hover:bg-white hover:shadow-xl transition-all"
        title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
      >
        {isFullscreen ? (
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        )}
      </button>
      
      <MapContainer
        center={center}
        zoom={12}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
        scrollWheelZoom={true}
        zoomControl={true}
        bounds={bounds || undefined}
        boundsOptions={{ padding: [50, 50], maxZoom: 13 }}
      >
        {/* Use CartoDB Positron tiles for a cleaner look */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={19}
        />
        
        <MapBounds bounds={bounds} />
        <MapUpdater selectedStation={selectedStation} />
        
        {/* Show user location marker */}
        {userLocation && (
          <Marker
            position={[userLocation.lat, userLocation.lon]}
            icon={L.divIcon({
              className: 'user-location-marker',
              html: `
                <div style="
                  position: relative;
                  width: 24px;
                  height: 24px;
                ">
                  <div style="
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 20px;
                    height: 20px;
                    background: #4285F4;
                    border-radius: 50%;
                    border: 3px solid white;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.4);
                    z-index: 10;
                  "></div>
                  <div style="
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 20px;
                    height: 20px;
                    background: #4285F4;
                    border-radius: 50%;
                    opacity: 0.3;
                    animation: pulse-ring 2s infinite;
                  "></div>
                </div>
              `,
              iconSize: [24, 24],
              iconAnchor: [12, 12],
            })}
            zIndexOffset={2000}
          >
            <Popup>
              <div className="text-center">
                <div className="font-bold text-blue-600">Your Location</div>
                <div className="text-xs text-gray-500 mt-1">
                  {userLocation.lat.toFixed(4)}, {userLocation.lon.toFixed(4)}
                </div>
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* Draw route lines for all lines - properly ordered */}
        {Object.entries(routeLines).map(([lineKey, points]) => {
          if (points.length < 2) return null
          const lineColor = lineColors[lineKey] || '#666'
          const isSelectedLine = line === lineKey
          
          return (
            <Polyline
              key={lineKey}
              positions={points}
              pathOptions={{
                color: lineColor,
                weight: isSelectedLine ? 6 : 4,
                opacity: isSelectedLine ? 0.9 : 0.6,
                dashArray: isSelectedLine ? undefined : '10, 5'
              }}
            />
          )
        })}
        
        {/* Show only selected station and stations on selected line */}
        {Object.entries(STATION_COORDS).map(([id, station]) => {
          const isSelected = selectedStation?.id === id
          const isOnSelectedLine = line && station.line === line
          
          // Only show selected station or stations on the selected line
          if (!isSelected && !isOnSelectedLine) return null
          
          const stationLineColor = lineColors[station.line] || '#666'
          
          return (
            <Marker
              key={id}
              position={[station.lat, station.lon]}
              icon={createSubwayMarker(station.line, stationLineColor, isSelected)}
              zIndexOffset={isSelected ? 1000 : 100}
            >
              <Popup className="custom-popup" closeButton={true} autoClose={!isSelected}>
                <div className="text-center p-2">
                  <div 
                    className={`inline-block ${isSelected ? 'w-10 h-10' : 'w-8 h-8'} rounded-full flex items-center justify-center text-white font-bold ${isSelected ? 'text-lg' : 'text-sm'} mb-2`}
                    style={{ backgroundColor: stationLineColor }}
                  >
                    {station.line}
                  </div>
                  <div className={`font-${isSelected ? 'bold' : 'semibold'} ${isSelected ? 'text-lg' : 'text-base'} text-gray-900 mb-1`}>
                    {station.name}
                  </div>
                  <div className="text-xs text-gray-600">Line {station.line}</div>
                  {isSelected && (
                    <div className="text-xs text-gray-500 mt-2">Selected Station</div>
                  )}
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
      
      {/* Map legend */}
      <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-3 z-[1000] border-2 border-gray-200 max-w-[220px]">
        <div className="text-sm font-bold text-gray-800 mb-3">Subway Lines</div>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div 
              className="w-8 h-1.5 rounded"
              style={{ backgroundColor: '#EE352E' }}
            ></div>
            <span className="text-xs font-medium text-gray-700">Lines 1, 2, 3 (Red)</span>
          </div>
          <div className="flex items-center gap-3">
            <div 
              className="w-8 h-1.5 rounded"
              style={{ backgroundColor: '#00933C' }}
            ></div>
            <span className="text-xs font-medium text-gray-700">Lines 4, 5, 6 (Green)</span>
          </div>
          <div className="flex items-center gap-3">
            <div 
              className="w-8 h-1.5 rounded"
              style={{ backgroundColor: '#0039A6' }}
            ></div>
            <span className="text-xs font-medium text-gray-700">Lines A, C, E (Blue)</span>
          </div>
          <div className="flex items-center gap-3">
            <div 
              className="w-8 h-1.5 rounded"
              style={{ backgroundColor: '#FF6319' }}
            ></div>
            <span className="text-xs font-medium text-gray-700">Lines B, D, F (Orange)</span>
          </div>
          <div className="flex items-center gap-3">
            <div 
              className="w-8 h-1.5 rounded"
              style={{ backgroundColor: '#FCCC0A' }}
            ></div>
            <span className="text-xs font-medium text-gray-700">Lines N, Q, R, W (Yellow)</span>
          </div>
          <div className="flex items-center gap-3">
            <div 
              className="w-8 h-1.5 rounded"
              style={{ backgroundColor: '#B933AD' }}
            ></div>
            <span className="text-xs font-medium text-gray-700">Line 7 (Purple)</span>
          </div>
          <div className="flex items-center gap-3">
            <div 
              className="w-8 h-1.5 rounded"
              style={{ backgroundColor: '#A7A9AC' }}
            ></div>
            <span className="text-xs font-medium text-gray-700">Line L (Grey)</span>
          </div>
          <div className="flex items-center gap-3">
            <div 
              className="w-8 h-1.5 rounded"
              style={{ backgroundColor: '#6CBE45' }}
            ></div>
            <span className="text-xs font-medium text-gray-700">Line G (Light Green)</span>
          </div>
          <div className="flex items-center gap-3">
            <div 
              className="w-8 h-1.5 rounded"
              style={{ backgroundColor: '#996633' }}
            ></div>
            <span className="text-xs font-medium text-gray-700">Lines J, Z (Brown)</span>
          </div>
          {userLocation && (
            <div className="flex items-center gap-3 pt-2 border-t border-gray-200">
              <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white"></div>
              <span className="text-xs text-gray-600">Your Location</span>
            </div>
          )}
          {selectedStation && (
            <div className="flex items-center gap-3 pt-2 border-t border-gray-200">
              <div className="w-3 h-3 rounded-full border-2 border-white animate-pulse" style={{ backgroundColor: selectedLineColor }}></div>
              <span className="text-xs text-gray-600">Selected Station</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-[9999] bg-white">
        {mapContent}
      </div>
    )
  }

  return mapContent
}
