'use client'

import { useEffect, useRef, useMemo } from 'react'
import type { CheckIn } from '@/types/database'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface CheckInMapProps {
  checkIns: CheckIn[]
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

export default function CheckInMap({ checkIns }: CheckInMapProps) {
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

  useEffect(() => {
    if (!mapRef.current || geoCheckIns.length === 0) return
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
      marker.bindPopup(
        `<div style="font-size:13px;line-height:1.4;">
          <strong>${formatTime(ci.scheduled_time)}</strong> — <span style="color:${ci.status === 'completed' ? '#16a34a' : '#dc2626'};font-weight:600;">${ci.status}</span>
          <br/><span style="color:#64748b;">${ci.latitude!.toFixed(5)}, ${ci.longitude!.toFixed(5)}${accuracy}</span>
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
        // Single point: use a sensible zoom so the surrounding area is visible
        map.setView(bounds.getCenter(), 15)
      } else {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 17 })
      }
    }

    return () => {
      map.remove()
      mapInstance.current = null
    }
  }, [geoCheckIns, ackPoints])

  if (geoCheckIns.length === 0 && ackPoints.length === 0) return null

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
