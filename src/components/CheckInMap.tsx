'use client'

import { useEffect, useRef, useMemo } from 'react'
import type { CheckIn } from '@/types/database'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface WatchLocation {
  watch_latitude: number | null
  watch_longitude: number | null
  watch_radius_m: number
}

interface CheckInMapProps {
  checkIns: CheckIn[]
  watch?: WatchLocation
}

function createIcon(color: string) {
  return L.divIcon({
    className: '',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -14],
    html: `<div style="
      width:24px;height:24px;border-radius:50%;
      background:${color};border:3px solid white;
      box-shadow:0 2px 6px rgba(0,0,0,0.3);
    "></div>`,
  })
}

const greenIcon = createIcon('#22c55e')
const redIcon = createIcon('#ef4444')
const amberIcon = createIcon('#f59e0b')

function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function distanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export default function CheckInMap({ checkIns, watch }: CheckInMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)

  const geoCheckIns = useMemo(
    () => checkIns.filter((c) => c.latitude != null && c.status !== 'cancelled'),
    [checkIns]
  )

  // Supervisor acknowledgment points
  const ackPoints = useMemo(
    () => checkIns.filter((c) => c.ack_latitude != null),
    [checkIns]
  )

  const hasWatchLocation = !!(watch?.watch_latitude != null && watch?.watch_longitude != null)

  useEffect(() => {
    if (!mapRef.current || (geoCheckIns.length === 0 && ackPoints.length === 0 && !hasWatchLocation)) return
    if (mapInstance.current) {
      mapInstance.current.remove()
      mapInstance.current = null
    }

    const map = L.map(mapRef.current, {
      scrollWheelZoom: false,
      attributionControl: true,
    })
    mapInstance.current = map

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map)

    const bounds = L.latLngBounds([])

    // Draw watch geofence circle
    if (hasWatchLocation && watch) {
      const watchLatLng: L.LatLngExpression = [watch.watch_latitude!, watch.watch_longitude!]
      bounds.extend(watchLatLng)

      L.circle(watchLatLng, {
        radius: watch.watch_radius_m,
        color: '#3b82f6',
        fillColor: '#3b82f6',
        fillOpacity: 0.08,
        weight: 2,
        opacity: 0.4,
        dashArray: '6,4',
      }).addTo(map)

      // Add a small center marker for the watch location
      const watchIcon = L.divIcon({
        className: '',
        iconSize: [12, 12],
        iconAnchor: [6, 6],
        html: `<div style="width:12px;height:12px;border-radius:50%;background:#3b82f6;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3);opacity:0.6;"></div>`,
      })
      L.marker(watchLatLng, { icon: watchIcon }).addTo(map)
        .bindPopup(
          `<div style="font-size:13px;line-height:1.4;">
            <strong>Watch Location</strong>
            <br/><span style="color:#64748b;">Radius: ${watch.watch_radius_m}m</span>
          </div>`,
          { closeButton: false }
        )
    }

    // Worker check-in markers
    const sortedGeo = [...geoCheckIns].sort(
      (a, b) => new Date(a.scheduled_time).getTime() - new Date(b.scheduled_time).getTime()
    )

    const routeCoords: L.LatLngExpression[] = []

    sortedGeo.forEach((ci) => {
      const latlng: L.LatLngExpression = [ci.latitude!, ci.longitude!]
      bounds.extend(latlng)
      routeCoords.push(latlng)

      const icon = ci.status === 'completed' ? greenIcon : redIcon
      const marker = L.marker(latlng, { icon }).addTo(map)

      const accuracy = ci.gps_accuracy ? ` (±${ci.gps_accuracy.toFixed(0)}m)` : ''
      let geofenceInfo = ''
      if (hasWatchLocation && watch) {
        const dist = distanceMeters(watch.watch_latitude!, watch.watch_longitude!, ci.latitude!, ci.longitude!)
        const inside = dist <= watch.watch_radius_m
        geofenceInfo = `<br/><span style="color:${inside ? '#16a34a' : '#dc2626'};font-weight:600;">${inside ? 'Inside' : 'Outside'} geofence</span> <span style="color:#64748b;">(${Math.round(dist)}m from center)</span>`
      }
      marker.bindPopup(
        `<div style="font-size:13px;line-height:1.4;">
          <strong>${formatTime(ci.scheduled_time)}</strong> — <span style="color:${ci.status === 'completed' ? '#16a34a' : '#dc2626'};font-weight:600;">${ci.status}</span>
          <br/><span style="color:#64748b;">${ci.latitude!.toFixed(5)}, ${ci.longitude!.toFixed(5)}${accuracy}</span>${geofenceInfo}
        </div>`,
        { closeButton: false }
      )
    })

    // Draw patrol route line
    if (routeCoords.length > 1) {
      L.polyline(routeCoords, {
        color: '#3b82f6',
        weight: 2,
        opacity: 0.5,
        dashArray: '6,8',
      }).addTo(map)
    }

    // Supervisor ack markers (amber diamonds)
    ackPoints.forEach((ci) => {
      const latlng: L.LatLngExpression = [ci.ack_latitude!, ci.ack_longitude!]
      bounds.extend(latlng)

      const marker = L.marker(latlng, { icon: amberIcon }).addTo(map)
      marker.bindPopup(
        `<div style="font-size:13px;line-height:1.4;">
          <strong>Supervisor Ack</strong>
          <br/><span style="color:#d97706;font-weight:600;">${formatTime(ci.ack_at!)}</span>
          <br/><span style="color:#64748b;">${ci.ack_latitude!.toFixed(5)}, ${ci.ack_longitude!.toFixed(5)}</span>
        </div>`,
        { closeButton: false }
      )
    })

    if (bounds.isValid()) {
      const totalMarkers = sortedGeo.length + ackPoints.length
      if (totalMarkers <= 1) {
        map.setView(bounds.getCenter(), 15)
      } else {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 17 })
      }
    }

    // Fix tiles not rendering in dynamically sized containers
    setTimeout(() => map.invalidateSize(), 100)

    return () => {
      map.remove()
      mapInstance.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geoCheckIns, ackPoints, hasWatchLocation, watch?.watch_latitude, watch?.watch_longitude, watch?.watch_radius_m])

  if (geoCheckIns.length === 0 && ackPoints.length === 0 && !hasWatchLocation) return null

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
          Check-In Locations
        </h3>
        <div className="flex items-center gap-3 text-[10px] font-semibold text-slate-600">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white shadow" />
            Completed
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-white shadow" />
            Missed
          </span>
          {ackPoints.length > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 border-2 border-white shadow" />
              Supervisor
            </span>
          )}
        </div>
      </div>
      <div
        ref={mapRef}
        className="w-full h-[300px] sm:h-[400px] rounded-xl overflow-hidden border border-slate-100"
      />
    </div>
  )
}
