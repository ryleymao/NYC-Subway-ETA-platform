#!/usr/bin/env python3
"""Parse MTA GTFS static data to extract accurate station coordinates"""
import json
import zipfile
import csv
from pathlib import Path
from collections import defaultdict

def parse_gtfs_stops(gtfs_path: str) -> dict:
    """Parse stops.txt to get station coordinates"""
    stops = {}
    
    with zipfile.ZipFile(gtfs_path, 'r') as zip_ref:
        if 'stops.txt' not in zip_ref.namelist():
            print("Error: stops.txt not found in GTFS data")
            return stops
        
        with zip_ref.open('stops.txt') as f:
            reader = csv.DictReader(f.read().decode('utf-8').splitlines())
            for row in reader:
                stop_id = row.get('stop_id', '').strip()
                stop_name = row.get('stop_name', '').strip()
                stop_lat = row.get('stop_lat', '').strip()
                stop_lon = row.get('stop_lon', '').strip()
                location_type = row.get('location_type', '0').strip()
                
                # Only process stations (location_type 0 or 1)
                if location_type in ['0', '1'] and stop_lat and stop_lon:
                    try:
                        stops[stop_id] = {
                            'id': stop_id,
                            'name': stop_name,
                            'lat': float(stop_lat),
                            'lon': float(stop_lon),
                            'location_type': int(location_type)
                        }
                    except ValueError:
                        continue
    
    print(f"Parsed {len(stops)} stops")
    return stops

def parse_gtfs_routes(gtfs_path: str) -> Dict[str, str]:
    """Parse routes.txt to map route IDs to line identifiers"""
    routes = {}
    
    with zipfile.ZipFile(gtfs_path, 'r') as zip_ref:
        if 'routes.txt' not in zip_ref.namelist():
            print("Warning: routes.txt not found")
            return routes
        
        with zip_ref.open('routes.txt') as f:
            reader = csv.DictReader(f.read().decode('utf-8').splitlines())
            for row in reader:
                route_id = row.get('route_id', '').strip()
                route_short_name = row.get('route_short_name', '').strip()
                route_long_name = row.get('route_long_name', '').strip()
                
                if route_id and route_short_name:
                    routes[route_id] = route_short_name
    
    print(f"Parsed {len(routes)} routes")
    return routes

def parse_gtfs_stop_times(gtfs_path: str, routes: Dict[str, str], stops: Dict) -> Dict[str, List[Tuple[str, int]]]:
    """Parse stop_times.txt and trips.txt to get station ordering per line"""
    # Map: line -> [(stop_id, order), ...]
    line_stations = defaultdict(list)
    
    # First, get trip to route mapping
    trip_to_route = {}
    with zipfile.ZipFile(gtfs_path, 'r') as zip_ref:
        if 'trips.txt' in zip_ref.namelist():
            with zip_ref.open('trips.txt') as f:
                reader = csv.DictReader(f.read().decode('utf-8').splitlines())
                for row in reader:
                    trip_id = row.get('trip_id', '').strip()
                    route_id = row.get('route_id', '').strip()
                    if trip_id and route_id:
                        trip_to_route[trip_id] = route_id
        
        # Then parse stop_times to get ordering
        # Use a single representative trip per route for consistent ordering
        route_trips = defaultdict(list)
        if 'stop_times.txt' in zip_ref.namelist():
            with zip_ref.open('stop_times.txt') as f:
                reader = csv.DictReader(f.read().decode('utf-8').splitlines())
                for row in reader:
                    trip_id = row.get('trip_id', '').strip()
                    route_id = trip_to_route.get(trip_id)
                    if route_id and route_id in routes:
                        if trip_id not in route_trips[route_id]:
                            route_trips[route_id].append(trip_id)
        
        # Now get stations for one representative trip per route
        if 'stop_times.txt' in zip_ref.namelist():
            with zip_ref.open('stop_times.txt') as f:
                reader = csv.DictReader(f.read().decode('utf-8').splitlines())
                trip_stations = defaultdict(list)  # trip_id -> [(stop_id, sequence)]
                
                for row in reader:
                    trip_id = row.get('trip_id', '').strip()
                    stop_id = row.get('stop_id', '').strip()
                    sequence = row.get('stop_sequence', '').strip()
                    
                    if not trip_id or not stop_id or not sequence:
                        continue
                    
                    try:
                        seq = int(sequence)
                        trip_stations[trip_id].append((stop_id, seq))
                    except ValueError:
                        continue
                
                # For each route, use the first trip and sort by sequence
                for route_id, trip_ids in route_trips.items():
                    if not trip_ids:
                        continue
                    line = routes[route_id]
                    # Use first trip for this route
                    representative_trip = trip_ids[0]
                    if representative_trip in trip_stations:
                        stations = trip_stations[representative_trip]
                        stations.sort(key=lambda x: x[1])  # Sort by sequence
                        line_stations[line] = stations
    
    print(f"Parsed stop sequences for {len(line_stations)} lines")
    return line_stations

def generate_station_coords(stops: dict, line_stations: dict) -> dict:
    """Generate final station coordinates JSON structure"""
    result = {}
    
    for line, stations in line_stations.items():
        seen_stops = set()  # Track stops we've added for this line
        for order, (stop_id_with_dir, seq) in enumerate(stations, start=1):
            # Remove direction suffix (N/S) from stop_id
            base_stop_id = stop_id_with_dir.rstrip('NS')
            
            # Try to find matching stop
            matching_stop_id = None
            if base_stop_id in stops:
                matching_stop_id = base_stop_id
            else:
                # Try variations (sometimes stops have different IDs)
                for stop_id in stops.keys():
                    if stop_id.startswith(base_stop_id) or base_stop_id.startswith(stop_id):
                        matching_stop_id = stop_id
                        break
            
            if matching_stop_id and matching_stop_id not in seen_stops:
                stop = stops[matching_stop_id]
                # Create unique ID: line + stop_id
                station_id = f"{line}{matching_stop_id}"
                result[station_id] = {
                    'lat': stop['lat'],
                    'lon': stop['lon'],
                    'line': line,
                    'name': stop['name'],
                    'order': order,
                    'stop_id': matching_stop_id
                }
                seen_stops.add(matching_stop_id)
    
    return result

def main():
    """Main function to process GTFS data"""
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    output_dir = project_root / 'frontend' / 'src' / 'data'
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Try both possible filenames
    gtfs_zip = script_dir / 'gtfs_subway.zip'
    if not gtfs_zip.exists():
        gtfs_zip = script_dir / 'gtfs_static.zip'
    output_file = output_dir / 'station_coords.json'
    
    if not gtfs_zip.exists():
        print(f"Error: {gtfs_zip} not found")
        print("Download GTFS data from: https://new.mta.info/developers")
        print(f"Save it as: {gtfs_zip}")
        return
    
    print(f"Parsing {gtfs_zip}...")
    try:
        stops = parse_gtfs_stops(str(gtfs_zip))
        routes = parse_gtfs_routes(str(gtfs_zip))
        line_stations = parse_gtfs_stop_times(str(gtfs_zip), routes, stops)
        station_coords = generate_station_coords(stops, line_stations)
        
        result = {
            "generated_from": "MTA GTFS Static Data",
            "total_stations": len(station_coords),
            "lines": list(set(s['line'] for s in station_coords.values())),
            "stations": station_coords
        }
        
        with open(output_file, 'w') as f:
            json.dump(result, f, indent=2)
        
        print(f"✓ Generated {output_file}")
        print(f"  Stations: {len(station_coords)}, Lines: {len(result['lines'])}")
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()

