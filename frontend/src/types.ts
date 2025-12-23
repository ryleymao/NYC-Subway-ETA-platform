export interface Train {
  arrival_time: string
  eta_minutes: number
  train_id: string
  route_id: string
  status: 'on_time' | 'delayed' | 'early'
}

export interface DirectionETA {
  direction: string
  trains: Train[]
}

export interface ETAResponse {
  line: string
  station_id: string
  station_name?: string
  etas: DirectionETA[]
  last_updated?: string
}

